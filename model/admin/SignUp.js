const mongoose = require("mongoose");

const signUpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: Boolean, default: true },
  password: { type: String, require: true },
  profilePic: {
    type: String,
  },
  type: { type: String, default: "admin" },
  otp: String,
});

module.exports = mongoose.model("SignUp", signUpSchema);
