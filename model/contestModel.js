const mongoose = require("mongoose");

const SheduleSchema = new mongoose.Schema({
  startTime: { type: Date },
  endTime: { type: Date },
  status: { type: String, enum: ["active", "stopped"], default: "active" },
});

const contestSchema = new mongoose.Schema(
  {
    entryAmount: { type: Number, required: true },
    slots: { type: Number, required: true },
    upto: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    type: { type: String, required: true },
    typeCashBonus: { type: String },
    bonusCashPercentage: { type: Number },
    bonusCashAmount: { type: Number },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sub-category",
      required: false,
    },
    platformFeePercentage: { type: Number },
    platformFeeAmount: { type: Number },
    prizeDistributionPercentage: { type: Number, required: true },
    prizeDistributionAmount: { type: Number, required: true },
    rankDistribution: { type: Array, required: true },
    prizeDistribution: { type: Array, required: true },
    rankCount: { type: Number, required: true },
    rankPercentage: { type: Number, required: true },
    startDateTime: { type: Date },
    endDateTime: { type: Date },
    timeSlots: [SheduleSchema],
    isBotActive:{ type: Boolean, required: true,default:false },
    bidRange:{ type: Number, required: true,default:100},
    isBidRangeActive:{ type: Boolean, required: true,default:false},
    bot2isActive:{type:Boolean,default:true},
    bidRangeOfContest:{
      maxBidRange:{ type: Number, required: true},
      minBidRange:{ type: Number, required: true}
    },
    favorite:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ] 
  },

  { timestamps: true }
);
module.exports = mongoose.model("categoryContest", contestSchema);