const mongoose = require("mongoose");

const ContestSchema = new mongoose.Schema(
  {
    entryAmount: { type: Number, required: true },
    slots: { type: Number, required: true },
    upto: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    type: { type: String, required: true },
    typeCashBonus: { type: String },
    bonusCashPercentage: { type: Number },
    bonusCashAmount: { type: Number },
    platformFeePercentage: { type: Number },
    platformFeeAmount: { type: Number },
    prizeDistributionPercentage: { type: Number, required: true },
    prizeDistributionAmount: { type: Number, required: true },
    rankDistribution: { type: Array, required: true },
    prizeDistribution: { type: Array, required: true },
    rankCount: { type: String, required: true },
    rankPercentage: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contest", ContestSchema);
