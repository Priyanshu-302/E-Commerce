const mongoose = require("mongoose");

// Review Schema
const ReviewSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID reference is required."],
      index: true,
    },
    user_id: {
      type: String,
      required: [true, "User ID reference is required."],
      index: true,
    },
    user_name: {
      type: String,
      required: [true, "User display name is required."],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required."],
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating cannot exceed 5."],
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

ReviewSchema.index({ product_id: 1, user_id: 1 }, { unique: true });

const Review = mongoose.model("Review", ReviewSchema);

module.exports = Review;