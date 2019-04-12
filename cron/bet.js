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
    BetAction.create({
      _id: datas[2]+datas[3]+rpctx.txid,
      txId: rpctx.txid,
      blockHeight: block.height,
      createdAt: block.createdAt,
      eventId: datas[2],
      betChoose: datas[3],
      betValue: vout.value,
      opString: opString,
    })
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

async function recordExists(rType, _id) {
  let response;
  try {
    response = await rType.findOne({ _id });
  } catch (e) {
    console.log(e);
  }

  return response;
}

async function saveOPTransaction(block, rpctx, vout, transaction) {
  let createResponse;
  const timeNow = Date.now();

  if (['peerlessEvent'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${rpctx.txid}${block.height}`;
    const eventExists = await recordExists(BetEvent, _id);

    if (eventExists) {
      console.log(`Bet event ${_id} already on record`);
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
      // console.log(e);
      createResponse = e;
    }

    return createResponse;
  }
  
  if (['peerlessUpdateOdds'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${rpctx.txid}${block.height}`;
    const updateExists = await recordExists(Betupdate, _id);

    if (updateExists) {
      console.log(`Bet update ${_id} already on record`);
      return updateExists;
    }

    try {
      const event = await BetEvent.findOne({
        eventId: `${transaction.eventId}`,
      });

      if (event) {
        if (transaction.homeOdds) event.homeOdds = `${transaction.homeOdds}`;
        if (transaction.awayOdds) event.awayOdds = `${transaction.awayOdds}`;
        if (transaction.drawOdds) event.drawOdds = `${transaction.drawOdds}`;

        if (event.homeOdds == 0 || event.awayOdds == 0 || event.drawOdds == 0) {
          console.log('Invalid transaction data');
          console.log(transaction);
        }

        try {
          await event.save();
          console.log(`Odds updated for event#${transaction.eventId} at height ${block.height}`);
        } catch (e) {
          console.log('Unable to save event data');
          console.log(event);
          console.log(e);
        }
      }
    } catch (e) {
      console.log('Was not able to process odds updates');
      console.log.log(e);
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
      console.log('Error creating event update record');
      console.log(e);
    }

    return createResponse;
  }

  if (['peerlessBet'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${transaction.outcome}${rpctx.txid}${block.height}`;
    const betExists = await recordExists(BetAction, _id);
    
    if (betExists) {
      console.log(`Bet update ${_id} already on record`);
      return betExists;
    }

    try {
      const event = await BetEvent.findOne({
        eventId: `${transaction.eventId}`,
      });
      

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
          transaction,
        });
      } catch (e) {
        // console.log(e);
        createResponse = e;
      }
    } catch (e) {
      console.log('Error retrieving event data');
      console.log(e);
    }

    return createResponse;
  }

  if (['peerlessResult'].includes(transaction.txType)) {
    const _id = `${transaction.eventId}${rpctx.txid}${block.height}`;
    const resultExists = await recordExists(BetResult, _id);

    if (resultExists) {
      console.log(`Bet update ${_id} already on record`);
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
        result: opCode.resultMapping[transaction.tResult],
        opString: JSON.stringify(transaction),
        payoutTx: resultPayoutTxs[0],
        transaction,
      })
    } catch (e) {
      // console.log(e);
      createResponse = e;
    }

    return createResponse;
  }

  const transactionId = `${transaction.txType}-${rpctx.txid}${block.height}`;
  const transactionsExists = await recordExists(Transaction, transactionId);

  if (transactionsExists) {
    console.log(`Bet update ${_id} already on record`);
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
  if (rpctx.vout) {
    rpctx.vout.forEach(async (vout) => {
      if (vout.scriptPubKey.type === 'nulldata') {
        let transaction;
        try {
          transaction = await methods.validateVoutData(vout);
        } catch (e) {
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

  for (let height = start; height <= stop; height++) {
    const hash = await rpc.call('getblockhash', [height])
    const rpcblock = await rpc.call('getblock', [hash])
    const block = new Block({
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
      const rpctx = await util.getTX(txhash)

      if (blockchain.isPoS(block)) {
        await addPoS(block, rpctx)
      }
    })

    console.log(`Height: ${ block.height } Hash: ${ block.hash }`)
  }
}

/**
 * Handle locking.
 */
async function update () {
  const type = 'bet'
  let code = 0

  try {
    const info = await rpc.call('getinfo')
    const betEvent = await BetEvent.findOne().sort({blockHeight: -1})
    const betAction = await BetAction.findOne().sort({blockHeight: -1})
    const betResult = await BetResult.findOne().sort({blockHeight: -1})

    let clean = true // Always clear for now.
    let dbEventHeight = betEvent && betEvent.blockHeight ? betEvent.blockHeight : 1
    let dbActionHeight = betAction && betAction.blockHeight ? betAction.blockHeight : 1
    let dbResultHeight = betResult && betResult.blockHeight ? betResult.blockHeight : 1
    let dbHeight = [dbEventHeight, dbActionHeight, dbResultHeight].sort().reverse()[0]
    const block = await Block.findOne().sort({ height: -1});
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
    console.log(dbHeight, blockDbHeight, clean)
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
    console.log(err)
    code = 1
  } finally {
    try {
      locker.unlock(type)
    } catch (err) {
      console.log(err)
      code = 1
    }
    exit(code)
  }
}

update()
