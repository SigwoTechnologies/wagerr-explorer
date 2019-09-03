
const mongoose = require('mongoose');

/**
 * BetEvent
 *
 */


const BetAction = mongoose.model('BetAction', new mongoose.Schema({
  _id: { required: true, type: String },
  txId: { index: true, required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  createdAt: { required: true, type: Date },
  eventId: { required: true, type: String },
  betValue: { required: true, type: Number },
  betChoose: { required: true, type: String },
  opString: { required: true, type: String },
  opCode: { required: false, type: String},
  homeOdds: { required: true, type: String },
  drawOdds: { required: true, type: String },
  awayOdds: { required: true, type: String },
  points: { required: false, type: Number },
  overOdds: { required: false, type: Number },
  underOdds: { required: false, type: Number },
  transaction: { required: false, type: Map },
  matched: { required: false, type: Boolean, default: false }
}, { versionKey: false }), 'betactions');


module.exports =  BetAction;
