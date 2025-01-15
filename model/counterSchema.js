const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // Counter name (e.g., "contestCode")
    seq: { type: Number, default: 0, },    // Counter value
  });
  
const Counter = mongoose.model("Counter", counterSchema);

async function initializeCounter() {
    const existing = await Counter.findById("contestCode");
    if (!existing) {
      await Counter.create({ _id: "contestCode", seq: 6123533523 }); // 10-digit starting point
      console.log("Counter initialized successfully!");
    } else {
      console.log("Counter already exists!");
    }
}

initializeCounter();

module.exports = Counter