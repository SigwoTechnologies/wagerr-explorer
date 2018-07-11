
const mongoose = require('mongoose');

/**
 * BetEvent
 *
 */

const BetEvent = mongoose.model('BetEvent', new mongoose.Schema({
  txId: { index: true, required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  createdAt: { required: true, type: Date },
  eventId: { index: true,  required: true, type: String },
  timeStamp: { index: true,  required: true, type: String },
  league: { required: true, type: String },
  info: { required: true, type: String },
  homeTeam: {  required: true, type: String },
  awayTeam: {  required: true, type: String },
  homeOdds: { required: true, type: String },
  drawOdds: { required: true, type: String },
  awayOdds: { required: true, type: String },
  opString: { required: true, type: String },
}, { versionKey: false }), 'betevents');


module.exports =  BetEvent;
