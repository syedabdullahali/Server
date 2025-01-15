const Counter = require('./counterSchema')
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

async function generateUniqueContestCode() {
  const counter = await Counter.findByIdAndUpdate(
    "contestCode",
    { $inc: { seq: 1 } }, // Increment counter
    { new: true, upsert: true } // Create if not exists
  );
  return counter.seq.toString();
}

const ContestSchema = new Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    }, //main category
    categoryName: { type: String },
    count: { type: Number }, // number of contest completed
    profits: { type: Number }, //contest profit
    activeStatus: { type: String }, //contest status
    influencer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, //influencer details
    influencerProfit: { type: Number }, //influencer profit after deduction taxes   after platform fee
    companyProfit: { type: Number }, // company profit
    average: { type: Number }, // ?
    createdPrizePool: { type: Number }, //pollprize will calculate the slot*entry fee
    createdEntryFee: { type: Number }, // contest joining fee
    createdSlots: { type: Number }, //how many users can join contest
    createdUpto: { type: Number }, // per user maximum how many bid place
    actualPrizePool: { type: Number }, // actual prize poll will be current slot*entry fee
    createdwiningPercentage: { type: Number },
    prizeDistributionPercentage : { type: Number },
    isApproved: { type: Boolean }, // if amount above 1lac then need approval else automatic approve
    ranks: [
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
    ], // will show which users gets which rank base on bidding
    startDateTime: { type: Date }, //contest start date and time
    endDateTime: { type: Date }, //contest end Date and Time
    totalbidAmount: { type: Number, default:0 },
    bids: { type: Number,default:0 },
    isComplete: { type: Boolean, default: false },
    contestCode: { type: String},
    bidRangeOfContest:{
      maxBidRange:{ type: Number, required: true},
      minBidRange:{ type: Number, required: true}
    },
  },
  { timestamps: true }
);


// Pre-save hook to generate a unique contestCode
ContestSchema.pre("save", async function (next) {
  if (!this.contestCode) {
    this.contestCode = await generateUniqueContestCode();
  }
  next();
});


module.exports = mongoose.model("privateContest", ContestSchema);
