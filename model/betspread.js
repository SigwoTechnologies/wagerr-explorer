const mongoose = require('mongoose');


const Betspread = mongoose.model('Betspread', new mongoose.Schema({
    _id: { required: true, type: String },
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
    txType: { required: false, type: String },
    betValue: { required: false, type: Number },
    value: { required: false, type: Number },
    matched: { required: false, type: Boolean, default: false },
    synced: { required: false, type: Boolean, default: false },
    visibility: { required: false, type: Boolean, default: true },
    mhomeOdds: { required: false, type: Number },
    mawayOdds: { required: false, type: Number }
  }, { versionKey: false }), 'betspreads');
  
  module.exports =  Betspread;
  