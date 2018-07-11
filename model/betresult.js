
const mongoose = require('mongoose');

/**
 * BetEvent
 *
 */

const BetResult = mongoose.model('BetResult', new mongoose.Schema({
  _id: { required: true, select: false, type: String },
  txId: { index: true, required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  createdAt: { required: true, type: Date },
  eventId: { required: true, type: String },
  result: { required: true, type: String },
  opString: { required: true, type: String },
}, { versionKey: false }), 'betresults');


module.exports =  BetResult;
