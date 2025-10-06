const express = require("express");
const createAuthMiddleware = require("../middlewares/auth.middleware");
const { cartValidationRules } = require("../middlewares/validator.middleware");
const {
  addItemToCart,
  allItemsInCart,
  updateItemsInCart,
  deleteCart,
} = require("../controllers/cart.controller");

const router = express.Router();

//adding cart
router.post(
  "/items",
  createAuthMiddleware(["user"]),
  cartValidationRules,
  addItemToCart
);

//get all items in cart
router.get("/items", createAuthMiddleware(["user"]), allItemsInCart);


//updating cart items
router.patch("/items", createAuthMiddleware(["user"]), updateItemsInCart);


//delete cart
router.delete("/items", createAuthMiddleware(["user"]), deleteCart);



module.exports = router;
