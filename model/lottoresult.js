const mongoose = require('mongoose');

/**
 * LottoResult
 *
 */

const LottoResult = mongoose.model('LottoResult', new mongoose.Schema({
  _id: { required: true, type: String },
  txId: { index: true, required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  createdAt: { required: true, type: Date },
  txType: { required: true, type: String },
  eventId: { index: true,  required: true, type: String },
  opString: { required: true, type: String },
  opCode: { required: false, type: String},
  transaction: { required: false, type: Map },
  matched: { required: false, type: Boolean, default: false },
  visibility: { required: false, type: Boolean, default: true }
}, { versionKey: false }), 'lottoresults');


module.exports =  LottoResult;
