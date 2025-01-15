const mongoose = require("mongoose");

const userContestDetailSchema = new mongoose.Schema({
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "privateContest",                      //Private Contest detail
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",                            //user Data 
    required: true,
  },
  winningAmount: {
    type: Number,                       //winning amount
    required: false,
    default:0
  },
  bids: [
    {
      Amount: { type: Number, required: false },            //how much bid place 
      bidTimeDate: { type: Date, required: false },
    },
  ],
  totalAmount:{type:Number, default:0}                             //total Amount of  bids
});

module.exports = mongoose.model("userPrivateContest_details", userContestDetailSchema);
