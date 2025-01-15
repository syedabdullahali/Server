const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReviewPContestSchema = new Schema(
  {
    count: { type: Number },
    profits: { type: Number },
    activeStatus: { type: String }, // This will be 'review' for review contests
    influencerName: { type: String },
    influencerProfit: { type: Number },
    companyProfit: { type: Number },
    average: { type: Number },
    createdPrizePool: { type: Number },
    createdEntryFee: { type: Number },
    createdSlots: { type: Number },
    createdUpto: { type: Number },
    actualPrizePool: { type: Number },
    actualSlots: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("reviewContest", ReviewPContestSchema);
