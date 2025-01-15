const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: {// totalBalnce  {// witdrawl false 
    type: Number,
    default: 0,
  },
  winningbalance: {// witdrawl active 
    type: Number,
    default: 0,
  },
  bonusAmount: { // cash bonus  {// witdrawl false 
    type: Number,
    default: 0,
  },
  rozarPayTrasitionId:{
    type: String,
    default: 0,
  },

});

module.exports = mongoose.model("Wallet", walletSchema);