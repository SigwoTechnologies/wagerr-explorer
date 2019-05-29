const mongoose = require('mongoose');


const Betspread = mongoose.model('Betspread', new mongoose.Schema({
    _id: { required: true, select: false, type: String },
    txId: { index: true, required: true, type: String },
    blockHeight: { index: true, required: true, type: Number },
    createdAt: { required: true, type: Date },
    opCode: { required: false, type: String },
    opObject: { required: false, type: Map },
    type: { required: false, type: Number },
    eventId: { index: true,  required: true, type: String },
    homePoints: { required: true, type: Number },
    awayPoints: { required: true, type: Number },
    homeOdds: { required: true, type: Number },
    awayOdds: {  required: true, type: Number },
    txType: { required: false, type: String }
  }, { versionKey: false }), 'betspreads');
  
  module.exports =  Betspread;
  