const mongoose = require("mongoose");

const PContestShcema = new mongoose.Schema(
  {
    distirbytionpercent: { type: Number },    // in percentage 
    platformfee: { type: Number },     // in percentage
    influencerfee: { type: Number },  // in percentage
    winners_minimum_percent: { type: Number },     //  in percentage
    minimum_slot_count: { type: Number },    //  minimum slot
    numberof_bids: { type: Number },      // minimum bids
    max_limit_pricepool: { type: Number },    // prize pool limit  
    minimumEntryFees:  { type: Number },  
    privateCategory: [
      {
        duration:{ type: String },
        title:{ type: String }
      }
    ]
  },
  {
    timestamps: true,
  }
);

const PcontestSetting = mongoose.model("pcontest-setting", PContestShcema);
module.exports = PcontestSetting;





