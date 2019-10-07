
const mongoose = require('mongoose');

/**
 * BetErrors
 *
 */


const BetError = mongoose.model('BetError', new mongoose.Schema({
  _id: { required: true, type: String },
  txId: { index: true, required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  createdAt: { required: true, type: Date },
  eventId: { required: true, type: String },
  opCode: { required: false, type: String},
  transaction: { required: false, type: Map },
  completed: { required: true, type: Boolean, default: false },
  txType: { required: false, type: String},
  txErrorId: { required: true, type: String },
  reviewed: { required: false, type: Number, default: 0 },
  visibility: { required: false, type: Boolean, default: true }
}, { versionKey: false }), 'beterrors');


module.exports =  BetError;
