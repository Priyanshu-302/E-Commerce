const mongoose = require("mongoose");

// Variant Schema
const VariantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: [true, "Variant SKU is required."],
    unique: true,
    trim: true,
    index: true,
  },
  price: {
    type: Number,
    default: null,
  },
  attributes: [
    {
      name: {
        type: String,
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
    },
  ],
});

// Product Schema
const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required."],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required."],
    },
    brand: {
      type: String,
      required: [true, "Product brand is required."],
      index: true,
    },
    categories: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [
      {
        url: { type: String, required: true },
        is_primary: { type: Boolean, default: false },
      },
    ],
    base_price: {
      type: Number,
      required: [true, "Base price is required."],
    },
    attributes: [
      {
        name: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],
    variants: [VariantSchema],
    ratings: {
      average_rating: { type: Number, default: 0 },
      total_reviews: { type: Number, default: 0 },
    },
    is_published: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

ProductSchema.pre("validate", function () {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
});

ProductSchema.index({ title: "text", brand: "text", description: "text" });

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;