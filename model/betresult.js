
const mongoose = require('mongoose');

/**
 * BetEvent
 *
 */

const BetResult = mongoose.model('BetResult', new mongoose.Schema({
  txId: { index: true, required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  createdAt: { required: true, type: Date },
  eventId: { required: true, type: String },
  result: { required: true, type: String },
  opString: { required: true, type: String },
}, { versionKey: false }), 'betresults');


module.exports =  BetResult;
