require('babel-polyfill')
require('../lib/cron')
const config = require('../config')
const {exit, rpc} = require('../lib/cron')
const fetch = require('../lib/fetch')
const {forEach} = require('p-iteration')
const locker = require('../lib/locker')
const moment = require('moment')
const _ = require('lodash')

// Models.
const Proposal = require('../model/proposal')
const TX = require('../model/tx')

console.log('Running proposal cron job');

async function syncProposal () {
  const date = moment().utc().startOf('minute').toDate()
  await Proposal.deleteMany({})
  // Increase the timeout for Proposals.
  rpc.timeout(10000) // 10 secs
  const proposals = await rpc.call('getbudgetinfo')
  const mnc = await rpc.call('getmasternodecount')
  const projectionProposals = await rpc.call('getbudgetprojection')
  await forEach(proposals, async (pp) => {
    let projectionPP =  _.find(projectionProposals, { 'Hash': pp.Hash});
    if (projectionPP) {
      pp = projectionPP
    }
    const tx = await TX.findOne({txId:pp.FeeHash});
    const proposal = new Proposal({
      id: pp.Hash,
      createdAt: tx.createdAt,
      name: pp.Name,
      url: pp.URL,
      hash: pp.Hash,
      feeHash: pp.FeeHash,
      blockStart: pp.BlockStart,
      blockEnd: pp.BlockEnd,
      totalPaymentCount: pp.TotalPaymentCount,
      remainingPaymentCount: pp.RemainingPaymentCount,
      paymentAddress: pp.PaymentAddress,
      ratio: pp.Ratio,
      yeas: pp.Yeas,
      nays: pp.Nays,
      abstains: pp.Abstains,
      totalPayment: pp.TotalPayment,
      monthlyPayment: pp.MonthlyPayment,
      isValid: pp.IsValid,
      fValid: pp.fValid,
      masternodeCount: mnc.total,
      alloted: pp.Alloted,
      totalBudgetAlloted: pp.TotalBudgetAlloted
    })
    await proposal.save()
  })

}

/**
 * Handle locking.
 */
async function update () {
  const type = 'proposal'
  let code = 0
  try {
    locker.lock(type)
    await syncProposal()
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
