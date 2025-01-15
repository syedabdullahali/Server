const mongoose = require("mongoose");

const userContestDetailSchema = new mongoose.Schema({
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "categoryContest",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timeslotId: {
    type: mongoose.Schema.Types.ObjectId,
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
  totalAmount:{type:Number, default:0}   
},{timestamps:true});

module.exports = mongoose.model("UserContestDetail", userContestDetailSchema);
