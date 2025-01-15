const mongoose = require("mongoose");

const userContestDetailSchema = new mongoose.Schema({
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "categoryContest",
    required: true,
  },
  timeslotId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique:true,
    // ref: "timeSheduleSchema",
  },
  bot2isActive:{type:Boolean,default:true},
  companyProfit: { type: Number, default:0 },
  actualPrizePool: { type: Number, default:0 },
  totalbid: { type: Number, default:0 },
  totalbidsAmount: { type: Number, default:0},
  slotsFill: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  slotsFillCount: {type:Number,default:0},
  userranks:[
      {
          rank: {type:Number},
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          bid: { type: Number, default: 0 },
          totalBids: { type: Number, default: 0 },
          biddingTime: {type:Date,default:Date.now},
          WinningAmount: { type: Number, default: 0 },
          isInWiningRange:{ type: Boolean, default: false },
          duplicateCount:{ type: Number, default: 0 }
      },
    ],
  currentFill:{type:Array},
  isComplete: { type: Boolean, default: false },
  isContestDeclare: { type: Boolean, default: false },
  isPrizeDistributed: { type: Boolean, default: false },
  botSession: {
    type: String,
    default: "pending",
  }},{timestamps:true});

module.exports = mongoose.model("contestHistory", userContestDetailSchema);
