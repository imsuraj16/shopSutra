const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  price: {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["USD", "INR"],
      default: "INR",
    },
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  images: [
    {
      url: {
        type: String,
        required: true,
      },

      thumbnail: {
        type: String,
      },
    },
  ],
});

const productModel = mongoose.model("product", productSchema);

module.exports = productModel;
