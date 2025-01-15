const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    otp: {
      type: Number,
      // required: true,
    },
    password: {
      type: String,
      // required: true,
    },
    dob: {
      type: String,
    },
    state: {
      type: String,
    },
    totalRecharge: {
      type: Number,
    },
    totalSpent: {
      type: Number,
    },
    totalWithdraw: {
      type: Number,
    },
    profitOrLossPercentageToCompany: {
      type: String,
    },
    amountProfitToCompany: {
      type: String,
    },
    balance: {
      type: Number,
    },
    winningBalance: {
      type: Number,
    },
    performanceWinningPercentage: {
      type: String,
    },
    kyc: {
      type: String,
    },
    upiId: {
      type: String,
    },
    bankName: {
      type: String,
    },
    accountNumber: {
      type: Number,
    },
    ifscCode: {
      type: String,
    },
    activePercentage: {
      type: Number,
    },
   contestnotify: [
      {
        contestId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "categoryContest",
        },
        timeSlotId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        subcategoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "sub-category",
        },
      },
    ],
    contestNotification: [
      {
        contestId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "categoryContest",
        },
        subcategoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "sub-category",
        },
      },
    ],

    type: { type: String, enum: ["user", "bot","admin"], default: "user" },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    joinPrivateContest:[{type: mongoose.Schema.Types.ObjectId, ref: "privateContest" }]
  },
  {
    timestamps: true,
  }
);

const UserModel = mongoose.model("User", UserSchema);

module.exports = UserModel;
