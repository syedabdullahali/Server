const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  imageUrl: { type: String},
  url: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Banner", bannerSchema);
