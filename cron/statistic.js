require('babel-polyfill')
const blockchain = require('../lib/blockchain')
const {exit, rpc} = require('../lib/cron')
const {forEachSeries} = require('p-iteration')
const locker = require('../lib/locker')
const util = require('./util')
// Models.
const Block = require('../model/block')
const Statistic = require('../model/statistic')
const TX = require('../model/tx')
const BetResult = require('../model/betresult')
const BetAction = require('../model/betaction')


console.log('Running statistic cron job');

/**
 * Process the blocks and transactions.
 * @param {Number} start The current starting block height.
 * @param {Number} stop The current block height at the tip of the chain.
 */
async function syncBlocksForStatistic (start, stop, clean = false) {
  if (clean) {
    await Statistic.deleteMany({ blockHeight: { $gte: start, $lte: stop } });
  }
  rpc.timeout(10000) // 10 secs

  for (let height = start; height <= stop; height++) {
    let totalBet = 0

    const actionData = await BetAction.aggregate([
      {$match: {blockHeight: { $lte: height , $gte: 290000}}},
      { $group: { _id: 'totalBet', total: { $sum: '$betValue' } } }
    ]);

    if (actionData.length!==0){
      totalBet = actionData[0].total
    }

    const resultData = await BetResult.aggregate([
      {$match: {blockHeight: {$lte: height, $gte: 290000}}},
    ]);

    let totalMint = 0
    if (resultData.length !== 0 ){
      resultData.forEach(queryResult => {
        let startIndex = 2
        if (queryResult.payoutTx.vout[1].address === queryResult.payoutTx.vout[2].address) {
          startIndex = 3
        }
        for (let i = startIndex; i < queryResult.payoutTx.vout.length - 1; i++) {
          totalMint += queryResult.payoutTx.vout[i].value
        }
      })
    }

    const block = await Block.findOne({height: height})

    const statistic = new Statistic({
      blockHeight: block.height,
      createdAt: block.createdAt,
      totalBet: totalBet,
      totalMint: totalMint,
    })
    await statistic.save()
    console.log(`Height: ${ block.height } totalBet: ${ totalBet } totalMint: ${ totalMint }`)

  }
}

/**
 * Handle locking.
 */
async function update () {
  const type = 'statistic'
  let code = 0

  try {
    const info = await rpc.call('getinfo')
    const statistic = await Statistic.findOne().sort({blockHeight: -1})
    const betResult = await BetResult.findOne().sort({blockHeight: -1})

    let clean = true // Always clear for now.
    let dbStatisticHeight =  statistic && statistic.blockHeight ? statistic.blockHeight : 290000

    let startHeight = dbStatisticHeight

    const block = await Block.findOne().sort({ height: -1});
    let blockDbHeight = block && block.height ? block.height - 1: 1;
    let dbResultHeight =  betResult && betResult.blockHeight ? betResult.blockHeight : 1

    let stopHeight = [blockDbHeight,  dbResultHeight].sort().reverse()[0]

    // If heights provided then use them instead.
    if (!isNaN(process.argv[2])) {
      clean = true
      startHeight = parseInt(process.argv[2], 10)
    }
    if (!isNaN(process.argv[3])) {
      clean = true
      stopHeight = parseInt(process.argv[3], 10)
    }
    console.log(startHeight, stopHeight, clean)
    // If nothing to do then exit.
    if (startHeight >= stopHeight) {
      return
    }
    // If starting from genesis skip.
    else if (startHeight === 0) {
      startHeight = 290000
    }

    locker.lock(type)
    await syncBlocksForStatistic(startHeight, stopHeight, clean)
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
