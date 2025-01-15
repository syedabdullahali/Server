const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    auctioncategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    
  },
  {
    timestamps: true,
  }
);

const SubCatgory = mongoose.model("sub-category", subCategorySchema);
module.exports = SubCatgory;
