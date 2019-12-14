const mongoose = require('mongoose');

/**
 * TXIn
 *
 * The inputs for a tx.
 */
const TXIn = new mongoose.Schema({
  __v: { select: false, type: Number },
  coinbase: { type: String },
  sequence: { type: Number },
  address: { type: String },
  value: { type: Number },
  isZcSpend:{ type: Boolean },
  vout: { type: Number }
});

/**
 * TXOut
 *
 * The outputs for a tx.
 */
const TXOut = new mongoose.Schema({
  __v: { select: false, type: Number },
  address: { required: true, type: String },
  n: { required: true, type: Number },
  value: { required: true, type: Number }
});

/**
 * Setup the schema for transactions.
 */
const txSchema = new mongoose.Schema({
  __v: { select: false, type: Number },
  blockHash: { required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  createdAt: { index: true, required: true, type: Date },
  txId: { index: true, required: true, type: String },
  version: { required: true, type: Number },
  vin: { required: true, type: [TXIn] },
  vout: { required: true, type: [TXOut] }
}, { versionKey: false });

/**
 * Helper method to return vout value for tx.
 */
txSchema.virtual('value')
  .get(() => {
    return this.vout.reduce((acc, vo) => acc + vo.value, 0.0);
  });

/**
 * LottoResult
 *
 */

const LottoResult = mongoose.model('LottoResult', new mongoose.Schema({
  _id: { required: true, type: String },
  txId: { index: true, required: true, type: String },
  blockHeight: { index: true, required: true, type: Number },
  createdAt: { required: true, type: Date },
  txType: { required: true, type: String },
  eventId: { index: true,  required: true, type: String },
  opString: { required: true, type: String },
  payoutTx: { required: false, type: txSchema },
  opCode: { required: false, type: String},
  transaction: { required: false, type: Map },
  matched: { required: false, type: Boolean, default: false },
  visibility: { required: false, type: Boolean, default: true }
}, { versionKey: false }), 'lottoresults');


module.exports =  LottoResult;
