const mongoose = require("mongoose");

const WithdrawSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transfer: { type: String, required: true },
    UPI: {
      type: String,
    },
    AccountNumber: { type: Number },
    bankName: { type: String },
    IFSC_code: { type: String },
    Status: {
      type: String,
      enum: ["Completed", "Pending", "Failed"],
      default: "Pending",
      required: true,
    },
    transactionId:{type:String, required:true}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("withdraw", WithdrawSchema);
