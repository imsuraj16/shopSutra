const express = require("express");
const multer = require("multer");
const {
  createProduct,
  getProducts,
  getProductById,
  editproduct,
  deleteProduct,
} = require("../controllers/product.controller");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const {
  productValidation,
  paramsValidation,
  updateProductvalidation,
} = require("../middlewares/validator.middleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// normalize multipart fields like price[amount] into req.body.price
function normalizeProductBody(req, res, next) {
  try {
    const amtKey = "price[amount]";
    const currKey = "price[currency]";
    const amount = req.body?.[amtKey];
    const currency = req.body?.[currKey];
    if (amount !== undefined || currency !== undefined) {
      req.body.price = {
        ...(req.body.price || {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(currency !== undefined ? { currency } : {}),
      };
      delete req.body[amtKey];
      delete req.body[currKey];
    }
    next();
  } catch (e) {
    next(e);
  }
}

//for creating a product
router.post(
  "/",
  createAuthMiddleware(["seller", "admin"]),
  upload.array("images", 5),
  normalizeProductBody,
  productValidation,
  createProduct
);

//edit product
router.patch(
  "/:productId",
  createAuthMiddleware(["seller"]),
  upload.array("images", 5),
  normalizeProductBody,
  paramsValidation,
  updateProductvalidation,
  editproduct
);

//get all products
router.get("/", getProducts);

//get product by id
router.get(
  "/:productId",
  paramsValidation,
  createAuthMiddleware(["seller"]),
  getProductById
);

//delete product
router.delete('/:productId', createAuthMiddleware(['seller']), paramsValidation, deleteProduct);

module.exports = router;
