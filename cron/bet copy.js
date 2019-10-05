require('babel-polyfill')
const blockchain = require('../lib/blockchain')
const {exit, rpc} = require('../lib/cron')
const {forEachSeries} = require('p-iteration')
const locker = require('../lib/locker')
const opCode = require('../lib/op_code')
const util = require('./util')
const methods = require('./methods')

// Models.
const Block = require('../model/block')
const BetAction = require('../model/betaction')
const BetEvent = require('../model/betevent')
const BetResult = require('../model/betresult')
const Betupdate = require('../model/betupdate')
const Betspread = require('../model/betspread')
const Bettotal = require('../model/bettotal')
const Transaction = require('../model/transaction')
const TX = require('../model/tx')

function hexToString (hexx) {
  var hex = hexx.toString()//force conversion
  var str = ''
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
  return str
}

async function preOPCode(block, rpctx, vout) {
  let opString = hexToString(vout.scriptPubKey.asm.substring(10))
  let datas = opString.split('|')
  if (datas[0] === '1' && datas.length === 11) {
    BetEvent.create({
      _id: datas[2]+rpctx.txid,
      txId: rpctx.txid,
      blockHeight: block.height,
      createdAt: block.createdAt,
      eventId: datas[2],
      timeStamp:  datas[3],
      league:  datas[4],
      info:  datas[5],
      homeTeam:  datas[6],
      awayTeam:  datas[7],
      homeOdds:  datas[8],
      awayOdds:  datas[9],
      drawOdds: datas[10],
      opString: opString,
    })
  } else if (datas[0] === '2' && datas.length === 4) {
    try {
      await BetAction.create({
        _id: datas[2]+datas[3]+rpctx.txid,
        txId: rpctx.txid,
        blockHeight: block.height,
        createdAt: block.createdAt,
        eventId: datas[2],
        betChoose: datas[3],
        betValue: vout.value,
        opString: opString,
      })
    } catch (e) {
      //console.log('Error saving bet action with old decryption method');
    }
  } else if (datas[0] === '3' && datas.length === 4) {
    let resultPayoutTxs = await TX.find({blockHeight: block.height+1})
    BetResult.create({
      _id: datas[2]+rpctx.txid,
      txId: rpctx.txid,
      blockHeight: block.height,
      createdAt: block.createdAt,
      eventId: datas[2],
      result: datas[3],
      opString: opString,
      payoutTx: resultPayoutTxs[0]
    })
  } else if (datas[0] === '4' && datas.length === 4){
    let resultPayoutTxs = await TX.find({blockHeight: block.height+1})
    BetResult.create({
      _id: datas[2]+rpctx.txid,
      txId: rpctx.txid,
      blockHeight: block.height,
      createdAt: block.createdAt,
      eventId: datas[2],
      result: 'REFUND '+datas[3],
      opString: opString,
      payoutTx: resultPayoutTxs[0]
    })
  }
}

async function recordExists(rType, val, recordType = '_id') {
  let response;
  try {
    response = await rType.findOne({ [recordType]: val });
  } catch (e) {
    console.log('bet.js:recordExists');
    console.log(e);
  }

  return response;
}

async function saveOPTransaction(block, rpctx, vout, transaction) {
  let createResponse;
  const timeNow = Date.now();

  if (['peerlessEvent'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${rpctx.txid}${block.height}`;
    // const _id = `${transaction.eventId}`;
    const eventExists = await recordExists(BetEvent, _id);

    if (eventExists) {
      //console.log(`Bet event ${_id} already on record`);
      return eventExists;
    }

    try {
      createResponse = await BetEvent.create({
        _id,
        txId: rpctx.txid,
        blockHeight: block.height,
        createdAt: block.createdAt,
        eventId: transaction.eventId,
        timeStamp:  transaction.timestamp,
        league:  transaction.tournament,
        info:  `R${transaction.round}`,
        homeTeam:  transaction.homeTeam,
        awayTeam:  transaction.awayTeam,
        homeOdds:  transaction.homeOdds,
        awayOdds:  transaction.awayOdds,
        drawOdds: transaction.drawOdds,
        opString: JSON.stringify(transaction),
        opCode: transaction.opCode,
        transaction,
      });
    } catch (e) {
      //console.log('Error creating bet event data');
      console.log(e);
      createResponse = e;
    }

    return createResponse;
  }

  if (['peerlessUpdateOdds'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${rpctx.txid}${block.height}`;
    const updateExists = await recordExists(Betupdate, _id);
    const resultExists = await recordExists(BetResult, `${transaction.eventId}`, 'eventId');

    if (updateExists) {
      // //console.log(`Bet update ${_id} already on record`);
      return updateExists;
    }

    if (resultExists) {
      // //console.log(`Bet result for event ${transaction.eventId} on record`);
    } else {
      try {
        const event = await BetEvent.findOne({
          eventId: `${transaction.eventId}`,
        });
  
        if (event) {
          // if (transaction.homeOdds)
          event.homeOdds = `${transaction.homeOdds}`;
          //if (transaction.awayOdds)
          event.awayOdds = `${transaction.awayOdds}`;
          //if (transaction.drawOdds)
          event.drawOdds = `${transaction.drawOdds}`;
  
          if (event.homeOdds == 0 || event.awayOdds == 0 || event.drawOdds == 0) {
            // //console.log('Invalid transaction data');
            // //console.log(transaction);
          }
  
          try {
            await event.save();
            //console.log(`Odds updated for event#${transaction.eventId} at height ${block.height}`);
          } catch (e) {
            //console.log('Unable to save event data');
            console.log(e);
            //console.log(transaction);
          }
        }
      } catch (e) {
        //console.log('Was not able to process odds updates');
        console.log.log(e);
      }
    }

    try {
      createResponse = Betupdate.create({
        _id,
        txId: rpctx.txid,
        blockHeight: block.height,
        createdAt: block.createdAt,
        opCode: transaction.opCode,
        type: transaction.type,
        txType: transaction.txType,
        eventId: transaction.eventId,
        opObject: transaction,
      });
    } catch (e) {
      //console.log('Error creating event update record');
      console.log(e);
    }

    return createResponse;
  }

  if (['peerlessBet'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${transaction.outcome}${rpctx.txid}${block.height}`;
    const betExists = await recordExists(BetAction, _id);
    
    if (betExists) {
      // console.log(`Bet update ${_id} already on record`);
      return betExists;
    }

    try {
      let event = {};
  
      const originalRecord = await BetEvent.findOne({
        eventId: `${transaction.eventId}`,
      });

      const updates = await Betupdate.find({
        eventId: `${transaction.eventId}`,
        createdAt: { $lt: block.createdAt },
      });

      const betTotals = await Bettotal.find({
        eventId: `${transaction.eventId}`,
        createdAt: { $lt: block.createdAt },
      });

      if(updates && updates.length > 0) {
        const lastRecord = updates[updates.length - 1].opObject;

        event = {
          homeOdds: lastRecord.get('homeOdds'),
          awayOdds: lastRecord.get('awayOdds'),
          drawOdds: lastRecord.get('drawOdds'),
        };
      } else {
        event = originalRecord;
      }

      if (betTotals && betTotals.length > 0) {
        const lastTotal = betTotals[betTotals.length - 1];

        event.points = lastTotal.points;
        event.overOdds = lastTotal.overOdds;
        event.underOdds = lastTotal.underOdds;
      }

      try {
        createResponse = await BetAction.create({
          _id,
          txId: rpctx.txid,
          blockHeight: block.height,
          createdAt: block.createdAt,
          eventId: transaction.eventId,
          betChoose: opCode.outcomeMapping[transaction.outcome],
          betValue: vout.value,
          opString: JSON.stringify(transaction),
          opCode: transaction.opCode,
          homeOdds: event.homeOdds,
          awayOdds: event.awayOdds,
          drawOdds: event.drawOdds,
          points: event.points,
          overOdds: event.overOdds,
          underOdds: event.underOdds,
          transaction,
        });

        //console.log('BetAction posteed');

      } catch (e) {
        console.log('Error creating bet action record');
        console.log(e);
        // createResponse = e;
      }
    } catch (e) {
      console.log('Error retrieving event data');
      console.log(e);
    }

    return createResponse;
  }

  if (['peerlessSpreadsMarket'].includes(transaction.txType)) {
    const _id = `SM${transaction.eventId}${rpctx.txid}${block.height}`;
    const spreadExists = await recordExists(Betspread, _id);

    if (spreadExists) {
      // console.log(`Bet spread ${_id} already on record`);
      return spreadExists;
    }

    const { spreadPoints } = transaction; 

    const homePoints = (transaction.homeOdds < transaction.awayOdds) ? -(spreadPoints) : spreadPoints;
    const awayPoints = (transaction.homeOdds > transaction.awayOdds) ? -(spreadPoints) : spreadPoints;

    try {
      createResponse = Betspread.create({
        _id,
        txId: rpctx.txid,
        blockHeight: block.height,
        createdAt: block.createdAt,
        opCode: transaction.opCode,
        type: transaction.type,
        txType: transaction.txType,
        eventId: transaction.eventId,
        opObject: transaction,
        homeOdds: transaction.homeOdds,
        awayOdds: transaction.awayOdds,
        betValue: vout.value,
        value: transaction.betValue,
        transaction,
        homePoints,
        awayPoints,
      });
    } catch (e) {
      console.log('Error creating event update record');
      // //console.log(transaction);
      console.log(e);
    }

    return createResponse;
  }

  if (['peerlessTotalsMarket'].includes(transaction.txType)) {
    const _id = `TM${transaction.eventId}${rpctx.txid}${block.height}`;
    const spreadExists = await recordExists(Bettotal, _id);

    if (spreadExists) {
      // //console.log(`Bet spread ${_id} already on record`);
      return spreadExists;
    }

    try {
      createResponse = Bettotal.create({
        _id,
        txId: rpctx.txid,
        blockHeight: block.height,
        createdAt: block.createdAt,
        opCode: transaction.opCode,
        type: transaction.type,
        txType: transaction.txType,
        eventId: transaction.eventId,
        opObject: transaction,
        points: transaction.spreadPoints,
        overOdds: transaction.homeOdds,
        underOdds: transaction.awayOdds,
      });
    } catch (e) {
      console.log('Error creating event update record');
      // //console.log(transaction);
      console.log(e);
    }

    return createResponse;
  }

  if (['peerlessResult'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${rpctx.txid}${block.height}`;
    const resultExists = await recordExists(BetResult, _id);

    if (resultExists) {
      // //console.log(`Bet result ${_id} already on record`);
      return resultExists;
    }
    

    try {
      let resultPayoutTxs = await TX.find({blockHeight: block.height+1});

      createResponse = await BetResult.create({
        _id,
        txId: rpctx.txid,
        blockHeight: block.height,
        createdAt: block.createdAt,
        eventId: transaction.eventId,
        result: opCode.resultMapping[transaction.resultType],
        opString: JSON.stringify(transaction),
        payoutTx: resultPayoutTxs[0],
        transaction,
      })
    } catch (e) {
      // console.log('Error creating peerlessResult data');
      console.log(e);
      createResponse = e;
    }

    return createResponse;
  }

  const transactionId = `${transaction.txType}-${rpctx.txid}${block.height}`;
  const transactionsExists = await recordExists(Transaction, transactionId);

  if (transactionsExists) {
    // console.log(`Bet update ${transactionId} already on record`);
    return transactionsExists;
  }

  return Transaction.create({
    _id: transactionId,
    txId: rpctx.txid,
    blockHeight: block.height,
    createdAt: block.createdAt,
    opCode: transaction.opCode,
    type: transaction.type,
    txType: transaction.txType,
    opObject: transaction,
  });
}

async function addPoS (block, rpctx) {
  // We will ignore the empty PoS txs.
  // Setup the outputs for the transaction.

  const rpctxVout = rpctx.get('vout');

  if (block.height == 771987) {
    console.log('Height 771987 reached');
    console.log(block);
    console.log(JSON.parse(rpctx));
    console.log(rpctxVout);
  }


  if (rpctx.vout) {
    rpctx.vout.forEach(async (vout) => {
      if (vout.scriptPubKey.type === 'nulldata') {
        console.log('Null data contained');
        let transaction;
        try {
          transaction = await methods.validateVoutData(vout);
          console.log('Below is the transaction');
          console.log(transaction);
        } catch (e) {
          // console.log('addPoS error');
          console.log(e);
          transaction = { error: true, fullError: e };
        }

        if (transaction.error || !transaction.prefix) {
          await preOPCode(block, rpctx, vout);
        } else {
          await saveOPTransaction(block, rpctx, vout, transaction);
        }
      }
    })
  }
}

/**
 * Process the blocks and transactions.
 * @param {Number} start The current starting block height.
 * @param {Number} stop The current block height at the tip of the chain.
 */
async function syncBlocksForBet (start, stop, clean = false) {
  if (clean) {
    await BetAction.deleteMany({ blockHeight: { $gte: start, $lte: stop } });
    await BetEvent.deleteMany({ blockHeight: { $gte: start, $lte: stop } });
    await BetResult.deleteMany({ blockHeight: { $gte: start, $lte: stop } });
  }
  rpc.timeout(10000) // 10 secs

  console.log(start, stop);

  for (let height = start; height <= stop; height++) {
    if (height >= 756000) {
      // const hash = await rpc.call('getblockhash', [height])
      // const rpcblock = await rpc.call('getblock', [hash])

      const block = (await Block.find({ height }))[0] || {};
      let rpcblock = block;

      let txs = rpcblock.rpctxs ? rpcblock.rpctxs : []

      await forEachSeries(txs, async (rpctx) => {
        if (blockchain.isPoS(block)) {
          // const rpctx = await util.getTX(txhash)

          await addPoS(block, rpctx)
        }
      })
      
      console.log(`Height: ${ block.height } Hash: ${ block.hash }`);

      /*const block = new Block({
        hash,
        height,
        bits: rpcblock.bits,
        confirmations: rpcblock.confirmations,
        createdAt: new Date(rpcblock.time * 1000),
        diff: rpcblock.difficulty,
        merkle: rpcblock.merkleroot,
        nonce: rpcblock.nonce,
        prev: rpcblock.prevblockhash ? rpcblock.prevblockhash : 'GENESIS',
        size: rpcblock.size,
        txs: rpcblock.tx ? rpcblock.tx : [],
        ver: rpcblock.version
      })

      const block = await Block.findOne({ height });
      if (height < 10) {
        //console.log(block);
      }
      let txs = block.txs || [];

      await forEachSeries(txs, async (txhash) => {
        if (blockchain.isPoS(block) && (height >= 121000) && (height <=126000)) {
          const rpctx = await util.getTX(txhash)
          await addPoS(block, rpctx)
        }
      }); */

      /*const block = new Block({
        hash,
        height,
        bits: rpcblock.bits,
        confirmations: rpcblock.confirmations,
        createdAt: new Date(rpcblock.time * 1000),
        diff: rpcblock.difficulty,
        merkle: rpcblock.merkleroot,
        nonce: rpcblock.nonce,
        prev: rpcblock.prevblockhash ? rpcblock.prevblockhash : 'GENESIS',
        size: rpcblock.size,
        txs: rpcblock.tx ? rpcblock.tx : [],
        ver: rpcblock.version
      })
      let txs = rpcblock.tx ? rpcblock.tx : []

      await forEachSeries(txs, async (txhash) => {
        if (blockchain.isPoS(block) && height >= 756000) {
          const rpctx = await util.getTX(txhash)
          await addPoS(block, rpctx)
        }
      })

      console.log(`Height: ${ block.height } Hash: ${ block.hash }`) */
    }
  }
}

/**
 * Handle locking.
 */
async function update () {
  const type = 'bet'
  let code = 0

  try {
    // const info = await rpc.call('getinfo')
    const betEvent = await BetEvent.findOne().sort({blockHeight: -1})
    const betAction = await BetAction.findOne().sort({blockHeight: -1})
    const betResult = await BetResult.findOne().sort({blockHeight: -1})

    let clean = true // Always clear for now.
    let dbEventHeight = betEvent && betEvent.blockHeight ? betEvent.blockHeight : 1
    let dbActionHeight = betAction && betAction.blockHeight ? betAction.blockHeight : 1
    let dbResultHeight = betResult && betResult.blockHeight ? betResult.blockHeight : 1
    let dbHeight = [dbEventHeight, dbActionHeight, dbResultHeight].sort().reverse()[0]
    const block = await Block.findOne().sort({ height: -1});
    // const blocks = await Block.find().sort({ height: -1});

    let blockDbHeight = block && block.height ? block.height - 1: 1;

    // If heights provided then use them instead.
    if (!isNaN(process.argv[2])) {
      clean = true
      dbHeight = parseInt(process.argv[2], 10)
    }
    if (!isNaN(process.argv[3])) {
      clean = true
      blockDbHeight = parseInt(process.argv[3], 10)
    }
    //console.log(dbHeight, blockDbHeight, clean)
    // If nothing to do then exit.
    if (dbHeight >= blockDbHeight) {
      return
    }
    // If starting from genesis skip.
    else if (dbHeight === 0) {
      dbHeight = 1
    }

    locker.lock(type)
    await syncBlocksForBet(dbHeight, blockDbHeight, clean)
  } catch (err) {
    console.log('Update() error');
    console.log(err)
    code = 1
  } finally {
    try {
      locker.unlock(type)
    } catch (err) {
      console.log('Update() error: finally');
      console.log(err)
      code = 1
    }
    exit(code)
  }
}

update()
