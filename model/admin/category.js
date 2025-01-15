const mongoose = require("mongoose");

const auctionCategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    duration: { type: String, required: true }, // "5 minutes", "1 hour"
    sortingNumber: { type: Number }, // Dynamically calculated field
  },
  {
    timestamps: true,
  }
);

// Helper function to convert duration to minutes
function convertDurationToMinutes(duration) {
  const durationMapping = {
    minute: 1,
    minutes: 1,
    hour: 60,
    hours: 60,
    day: 1440,
    days: 1440,
  };

  const parts = duration.split(" "); // Split "5 minutes" into ["5", "minutes"]
  const value = parseInt(parts[0], 10); // Extract numeric value
  const unit = parts[1]?.toLowerCase(); // Extract unit and convert to lowercase

  return value * (durationMapping[unit] || 0); // Convert to minutes
}

// Pre-save middleware to calculate sortingNumber
auctionCategorySchema.pre("save", function (next) {
  // Extract the length of the title as part of the sorting logic
  const titleValue = this.title ? this.title.length : 0;

  // Convert duration to minutes
  const durationInMinutes = convertDurationToMinutes(this.duration);

  // Sorting number logic (titleValue + durationInMinutes)
  this.sortingNumber = titleValue + durationInMinutes;

  next(); // Proceed with saving
});

const Category = mongoose.model("category", auctionCategorySchema);

module.exports = Category;
