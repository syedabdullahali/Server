const mongoose = require("mongoose");

const tdsGstTextSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
});

module.exports = mongoose.model("TdsGstText", tdsGstTextSchema);
