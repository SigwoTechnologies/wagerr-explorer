const mongoose = require('mongoose');

/**
 * LottoEvent
 *
 */

const LottoEvent = mongoose.model('LottoEvent', new mongoose.Schema({
  _id: { required: true, type: String },
  txId: { index: true, required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  createdAt: { required: true, type: Date },
  txType: { required: true, type: String },
  eventId: { index: true,  required: true, type: String },
  entryPrice: { required: true, type: String },
  opString: { required: true, type: String },
  opCode: { required: false, type: String},
  transaction: { required: false, type: Map },
  matched: { required: false, type: Boolean, default: false },
  visibility: { required: false, type: Boolean, default: true }
}, { versionKey: false }), 'lottoevents');


module.exports =  LottoEvent;
