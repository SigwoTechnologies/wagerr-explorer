const TX = require('../model/tx');
require('babel-polyfill');
const config = require('../config');
const { exit, rpc } = require('../lib/cron');
const fetch = require('../lib/fetch');
const locker = require('../lib/locker');
const moment = require('moment');
// Models.
const Coin = require('../model/coin');
const UTXO = require('../model/utxo');
const BetResult = require('../model/betresult');
const BetAction = require('../model/betaction');

/**
 * Get the coin related information including things
 * like price coinmarketcap.com data.
 */
async function syncCoin() {
  const date = moment().utc().startOf('minute').toDate();
  // Setup the coinmarketcap.com api url.
  const url = `${ config.coinMarketCap.api }${ config.coinMarketCap.ticker }`;

  const info = await rpc.call('getinfo');
  const masternodes = await rpc.call('getmasternodecount');
  const nethashps = await rpc.call('getnetworkhashps');
  const utxo = await UTXO.aggregate([
    {$match: {address: {$ne: 'ZERO_COIN_MINT'}}},
    {$match: {address: {$not: /OP_RETURN/}}},
    {$group: {_id: 'supply', total: {$sum: '$value'}}}
  ])

  const lastSentFromOracle = (await TX.find({'vin.address': config.coin.oracle_payout_address})
    .sort({blockHeight: -1})
    .limit(1).exec())[0]

  const oracleTxs = await TX
    .aggregate([
      {
        $match: {
          $and: [
            {'blockHeight': {$gt: lastSentFromOracle.blockHeight}},
            {'vout.address': config.coin.oracle_payout_address}
          ]
        }
      },
      {$sort: {blockHeight: -1}}
    ])
    .allowDiskUse(true)
    .exec()

  const payout = oracleTxs.reduce((acc, tx) => acc + tx.vout.reduce((a, t) => {
      if (t.address === config.coin.oracle_payout_address) {
        return a + t.value
      } else {
        return a
      }
    }, 0.0), 0.0)

  const payoutPerSecond = payout / (moment().unix() - moment(lastSentFromOracle.createdAt).unix())

  const result = await BetResult.aggregate([
    {
      $group: {
        _id: '$eventId',
        results: {
          $push: '$$ROOT'
        },
      },
    },
    {
      $project: {
        _id: '$_id',
        result: {$arrayElemAt: [ "$results.result", 0 ]}
      }
    },
    {
      $lookup: {
        from: 'betactions',
        let: { 'id': '$_id'},
        pipeline: [
          {$match:
              { $and:
                  [ {$expr: {$eq: ["$eventId", "$$id"]}},
                  ]
              }}
        ],
        as: 'actions'
      }
    }
  ])
  let totalBet = (await BetAction.aggregate([
    {
      $group:
        {_id: null, total: {$sum: '$betValue'}},
    }
  ]))[0].total
  let totalBurn =  0;
  result.forEach(result =>{
    result.actions.forEach(action =>{
      if (action.betChoose !== result.result) {
        totalBurn += action.betValue
      }
    })
  })
  let market = await fetch(url);
  if (Array.isArray(market)) {
    market = market.length ? market[0] : {};
  }

  const coin = new Coin({
    cap: market.market_cap_usd,
    createdAt: date,
    blocks: info.blocks,
    btc: market.price_btc,
    diff: info.difficulty,
    mnsOff: masternodes.total - masternodes.stable,
    mnsOn: masternodes.stable,
    netHash: nethashps,
    peers: info.connections,
    status: 'Online',
    supply: utxo[0].total + info.zWGRsupply.total,
    usd: market.price_usd,
    totalBet: totalBet,
    totalBurn: totalBurn,
    oracleProfitPerSecond: payoutPerSecond
  });

  await coin.save();
}

/**
 * Handle locking.
 */
async function update() {
  const type = 'coin';
  let code = 0;

  try {
    locker.lock(type);
    await syncCoin();
  } catch(err) {
    console.log(err);
    code = 1;
  } finally {
    try {
      locker.unlock(type);
    } catch(err) {
      console.log(err);
      code = 1;
    }
    exit(code);
  }
}

update();
