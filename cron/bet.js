require('babel-polyfill')
const blockchain = require('../lib/blockchain')
const {exit, rpc} = require('../lib/cron')
const {forEachSeries} = require('p-iteration')
const locker = require('../lib/locker')
const util = require('./util')
// Models.
const Block = require('../model/block')
const BetAction = require('../model/betaction')
const BetEvent = require('../model/betevent')
const BetResult = require('../model/betresult')
const TX = require('../model/tx')

function hexToString (hexx) {
  var hex = hexx.toString()//force conversion
  var str = ''
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
  return str
}

async function addPoS (block, rpctx) {
  // We will ignore the empty PoS txs.
  // Setup the outputs for the transaction.
  if (rpctx.vout) {
    rpctx.vout.forEach(async (vout) => {
      if (vout.scriptPubKey.type === 'nulldata') {
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
    await BetAction.remove({ blockHeight: { $gte: start, $lte: stop } });
    await BetEvent.remove({ blockHeight: { $gte: start, $lte: stop } });
    await BetResult.remove({ blockHeight: { $gte: start, $lte: stop } });
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
