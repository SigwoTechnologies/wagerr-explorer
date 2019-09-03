const mongoose = require('mongoose');


const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    _id: { required: true, select: false, type: String },
    txId: { index: true, required: true, type: String },
    blockHeight: { index: true, required: true, type: Number },
    createdAt: { required: true, type: Date },
    opCode: { required: false, type: String },
    opObject: { required: false, type: Map },
    type: { required: false, type: Number },
    txType: { required: false, type: String },
    matched: { required: false, type: Boolean, default: false }
  }, { versionKey: false }), 'transactions');
  
  
  module.exports =  Transaction;
  