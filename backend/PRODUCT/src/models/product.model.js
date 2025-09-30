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

// Create text index on title and description for search functionality
//jis bhi property par text index lgate hai uske upar query bahut fast ho jati hai or exact pura text nhi dalna rahta uspe sabse pass wala result mil jata hai
productSchema.index({ title: "text", description: "text" });

module.exports = productModel;
