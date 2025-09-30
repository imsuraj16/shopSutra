const productModel = require("../models/product.model");
const { uploadImage } = require("../services/storage.service");

//for creating a product
const createProduct = async (req, res) => {
  const seller = req.user.id; // ye auth middleware se aayega
  const {
    title,
    description,
    price: { amount, currency = "INR" },
  } = req.body;

  const { files } = req;

  const file = await Promise.all(
    files.map(async (file) => {
      const data = await uploadImage(file);
      return data;
    })
  );

  const product = await productModel.create({
    title,
    description,
    price: {
      amount,
      currency,
    },
    images: file.map((file) => ({
      url: file.url,
      thumbnail: file.thumbnailUrl,
    })),
    seller,
  });

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    product,
  });
};

//getting all products
const getProducts = async (req, res) => {
  const {
    q,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
    order = "asc",
    sortBy = "createdAt",
  } = req.query;

  const filter = {};

  if (q) {
    filter.$text = { $search: q };
  }

  if (minPrice || maxPrice) {
    filter["price.amount"] = {
      ...(minPrice ? { $gte: Number(minPrice) } : {}),
      ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
    };
  }
  const skip = Number(page - 1) * Number(limit);
  const sortOrder = order === "dsc" ? -1 : 1;

  const products = await productModel
    .find(filter)
    .skip(skip)
    .limit(Number(limit))
    .sort({ [sortBy]: sortOrder });

  const total = await productModel.countDocuments(filter);

  return res.status(200).json({
    success: true,
    data: products,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

//getting product by id
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate ObjectId format explicitly to return 400 for invalid ids
    const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(productId);
    if (!isValidObjectId) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
};
