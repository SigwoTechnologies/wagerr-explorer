
const mongoose = require('mongoose');

/**
 * BetEvent
 *
 */

const BetEvent = mongoose.model('BetEvent', new mongoose.Schema({
  _id: { required: true, type: String },
  txId: { index: true, required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  createdAt: { required: true, type: Date },
  eventId: { index: true,  required: true, type: String },
  timeStamp: { index: true,  required: true, type: String },
  league: { required: true, type: String },
  info: { type: String },
  homeTeam: {  required: true, type: String },
  awayTeam: {  required: true, type: String },
  homeOdds: { required: true, type: String },
  drawOdds: { required: true, type: String },
  awayOdds: { required: true, type: String },
  opString: { required: true, type: String },
  opCode: { required: false, type: String},
  transaction: { required: false, type: Map },
  matched: { required: false, type: Boolean, default: false },
  visibility: { required: false, type: Boolean, default: true }
}, { versionKey: false }), 'betevents');


module.exports =  BetEvent;
