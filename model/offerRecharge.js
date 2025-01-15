const { Schema, model } = require("mongoose");

const walletOffer = new Schema({
    range:{type:String,default:0},
    bounus: {type:Number,default:0},
    rangeOption: [],
  },{timestamps:true})

module.exports = model('offerRecharge',walletOffer)
