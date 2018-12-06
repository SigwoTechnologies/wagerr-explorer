const mongoose = require('mongoose')
/*
* proposal
*/
const Proposal = mongoose.model('Proposal', new mongoose.Schema({
  __v: {select: false, type: Number},
  id: {required: true, type: String},
  createdAt: {index: true, required: true, type: Date},
  name: {index: true, required: true, type: String},
  hash: {required: true, type: String},
  feeHash: {required: true, type: String},
  url: {required: true, type: String},
  blockStart: {index: true, required: true, type: Number},
  blockEnd: {index: true, required: true, type: Number},
  totalPaymentCount: {required: true, type: Number},
  remainingPaymentCount: {required: true, type: Number},
  paymentAddress: {required: true, type: String},
  ratio: {required: true, type: Number},
  yeas: {required: true, type: Number},
  nays: {required: true, type: Number},
  abstains: {required: true, type: Number},
  totalPayment: {index: true, required: true, type: Number},
  monthlyPayment: {required: true, type: Number},
  isValid: {required: true, type: Boolean},
  fValid: {required: true, type: Boolean},
  masternodeCount: {required: true, type: Number},
  alloted: {type: Number},
  totalBudgetAlloted: {type: Number},
}, {versionKey: false}), 'proposals')
module.exports = Proposal
