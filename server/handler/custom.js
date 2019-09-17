const Coin = require('../../model/coin')
const config = require('../../config')
const TX = require('../../model/tx')
const { BigNumber } = require('bignumber.js')
const UTXO = require('../../model/utxo');
const { rpc } = require('../../lib/cron');

const getBetStatus = async (req, res) => {
  try {
    const txs = await TX
      .aggregate([
        {$match: {$or: [{'vout.address': config.coin.oracle_payout_address}, {'vin.address': config.coin.oracle_payout_address}]}},
        {$sort: {blockHeight: -1}}
      ])
      .allowDiskUse(true)
      .exec()

    const staked = txs.filter(tx => tx.vout[0].address === 'NON_STANDARD')
      .reduce((acc, tx) => acc.minus(tx.vin.reduce((a, t) => {
        if (t.address === config.coin.oracle_payout_address) {
          return a.plus(BigNumber(t.value))
        } else {
          return a
        }
      }, BigNumber(0.0))).plus(tx.vout.reduce((a, t) => {
        if (t.address === config.coin.oracle_payout_address) {
          return a.plus(BigNumber(t.value))
        } else {
          return a
        }
      }, BigNumber(0.0))), BigNumber(0.0))
    const coinInfo = await  Coin.findOne()
      .sort({createdAt: -1})
    res.json({totalBet: coinInfo.totalBet, totalOracleProfit: staked})
  } catch (err) {
    console.log(err)
    res.status(500).send(err.message || err)
  }
}

const getCustomSupply = async (req, res) => {
  try {
    const info = await rpc.call('getinfo');
    res.json(info.moneysupply);
  } catch(err) {
    console.log(err);
    res.status(500).send(err.message || err);
  }
};

module.exports = {
  getBetStatus,
  getCustomSupply
}
