const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const { cartValidationRules } = require("../middlewares/validator.middleware");
const { addItemToCart, allItemsInCart } = require("../controllers/cart.controller");

const router = express.Router();

//adding cart
router.post(
  "/items",
  createAuthMiddleware(["user"]),
  cartValidationRules,
  addItemToCart
);

router.get('/items', createAuthMiddleware(['user']), allItemsInCart);

module.exports = router;
