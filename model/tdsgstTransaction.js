const mongoose = require("mongoose");

const TDSGSTtransaction = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String,
      enum: ['TDS','GST'],
      required: true
     },
    amount: { type: Number, required:true },
  },
  {
    timeseries: true,
  }
);

module.exports = mongoose.model(
  "tdsgast-transaction",
  TDSGSTtransaction
);
