const cartModel = require("../models/cart.model");
const axios = require("axios");

// Add item to cart
const addItemToCart = async (req, res) => {
  try {
    const { items } = req.body;
    const user = req.user;

    let cart = await cartModel.findOne({ user: user.id });

    let newCart = false;

    if (!cart) {
      newCart = true;
      cart = new cartModel({
        user: user.id,
        items: [],
        totalPrice: 0,
      });
    }

    const itemMap = new Map();

    cart.items.forEach((item) =>
      itemMap.set(item.productId.toString(), item.quantity)
    );

    items.forEach(({ productId, quantity }) => {
      if (itemMap.has(productId)) {
        itemMap.set(productId, itemMap.get(productId) + quantity);
      } else {
        itemMap.set(productId, quantity);
      }
    });

    cart.items = Array.from(itemMap, ([productId, quantity]) => ({
      productId: productId,
      quantity,
    }));

    const products = await Promise.all(
      cart.items.map(async ({ productId }) => {
        const { data } = await axios.get(
          `http://localhost:3001/api/products/${productId}`
        );
        return data;
      })
    );

    cart.totalPrice = cart.items.reduce((acc, item, index) => {
      const product = products[index];
      return acc + product.product.price.amount * item.quantity;
    }, 0);

    await cart.save();

    return res.status(newCart ? 201 : 200).json({
      success: true,
      message: newCart ? "Cart created" : "Cart updated",
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//get all items in cart
const allItemsInCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: { items: [], totalPrice: 0 },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cart retrieved",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  addItemToCart,
  allItemsInCart,
};
