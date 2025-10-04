const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const { cartValidationRules } = require("../middlewares/validator.middleware");
const { addItemToCart } = require("../controllers/cart.controller");

const router = express.Router();

//adding cart
router.post(
  "/items",
  createAuthMiddleware(["user"]),
  cartValidationRules,
  addItemToCart
);

module.exports = router;
