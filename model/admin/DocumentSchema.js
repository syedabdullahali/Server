const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  privacy: { type: String, required: true },
  termCondition: { type: String, required: true },
  legality: { type: String, required: true },
  responbility: { type: String, required: true },
  opinionSuggestion: { type: String, required: true },
});

module.exports = mongoose.model("Documents", documentSchema);
