const mongoose = require('mongoose');

/**
 * LottoBet
 *
 */

const LottoBet = mongoose.model('LottoBet', new mongoose.Schema({
  _id: { required: true, type: String },
  txId: { index: true, required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  createdAt: { required: true, type: Date },
  txType: { required: true, type: String },
  betValue: { required: true, type: Number },
  eventId: { index: true,  required: true, type: String },
  opString: { required: true, type: String },
  opCode: { required: false, type: String},
  transaction: { required: false, type: Map },
  matched: { required: false, type: Boolean, default: false }
}, { versionKey: false }), 'lottobets');


module.exports =  LottoBet;
