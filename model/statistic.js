
const mongoose = require('mongoose');

/**
 * Statistic
 *
 * Represents the state of the Statistic in general.
 */
const Statistic = mongoose.model('Statistic', new mongoose.Schema({
  __v: { select: false, type: Number },
  blockHeight: { required: true, type: Number },
  createdAt: { index: true, required: true, type: Date },
  totalBet: { type: Number },
  totalMint: { type: Number },
}, { versionKey: false }), 'statistics');

module.exports =  Statistic;
