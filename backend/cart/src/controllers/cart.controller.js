const cartModel = require("../models/cart.model");
const axios = require("axios");

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
      productId : productId,
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

module.exports = {
  addItemToCart,
};
