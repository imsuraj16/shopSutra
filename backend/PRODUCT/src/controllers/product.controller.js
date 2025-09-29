const productModel = require("../models/product.model");
const { uploadImage } = require("../services/storage.service");

const createProduct = async (req,res) => {
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
    images : file.map((file) => ({
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

module.exports = {
  createProduct,
};

