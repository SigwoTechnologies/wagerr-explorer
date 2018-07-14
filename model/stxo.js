
const mongoose = require('mongoose');

/**
 * STXO
 *
 * Spent transactions in the blockchain.
 */
const STXO = mongoose.model('STXO', new mongoose.Schema({
  __v: { select: false, type: Number },
  _id: { required: true, select: false, type: String },
  address: { required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  n: { required: true, type: Number },
  txId: { required: true, type: String },
  value: { required: true, type: Number }
}, { versionKey: false }), 'stxo');

module.exports =  STXO;
