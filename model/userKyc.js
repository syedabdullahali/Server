const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Reject", "Approve"],
      required: true,
      default: "Pending",
    },
    aadharNumber: {
      type: Number,
      required: true,
    },
    aadhar_photo: {
      type: String,
      reqired: true,
    },
    pancardNumber: {
      type: String,
      required: true,
    },
    pancard_photo: {
      type: String,
      required: true,
    },
    address: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("user_kyc", kycSchema);
