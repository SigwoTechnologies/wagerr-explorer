
const mongoose = require('mongoose');

/**
 * Block
 *
 * Is the system representation of a block
 * that closely reflects that used on the network.
 */
const Mappingname = mongoose.model('Mappingname', new mongoose.Schema({
  __v: { select: false, type: Number },
  name: { required: true, type: String },
  exists: { required: false, type: Boolean, default: true },
  mappingIndex: { required: true, type: String },
  mappingId: { required: true, type: Number }
}, { versionKey: false }), 'mappingnames');

module.exports =  Mappingname;
