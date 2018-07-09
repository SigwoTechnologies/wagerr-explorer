
const mongoose = require('mongoose');

/**
 * BetEvent
 *
 * Connected betevent to the network.
 */
// {
//   "tx-id": "81b435faa205b96a682d35c92708f095778f6d3c26a8d90837c295feab109415",
//   "id": "#123",
//   "name": "WCUP",
//   "round": "RD3",
//   "starting": "1531141200",
//   "teams": [
//   {
//     "name": "TES",
//     "odds": "60000"
//   },
//   {
//     "name": "TIN",
//     "odds": "80000"
//   },
//   {
//     "name": "DRW",
//     "odds": "70000"
//   }
const Team = new mongoose.Schema({
  name: { required: true, type: String },
  odds: { required: true, type: String },
});

const BetEvent = mongoose.model('BetEvent', new mongoose.Schema({
  __v: { select: false, type: Number },
  txId: { index: true, required: true, type: String },
  id: { index: true, required: true, type: String },
  createdAt: { required: true, type: Date },
  name: { required: true, type: String },
  round: { required: true, type: String },
  starting: { index: true,  required: true, type: String },
  teams:  { required: true, type: [Team] }
}, { versionKey: false }), 'betevents');


module.exports =  BetEvent;
