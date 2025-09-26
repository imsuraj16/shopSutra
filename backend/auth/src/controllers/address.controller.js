const userModel = require("../models/user/user.model");

const getAddresses = async (req, res) => {
  try {
    const { id } = req.user; // from auth middleware
    const user = await userModel.findById(id).select("address");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ success: true, addresses: user.address });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addAddress = async (req, res) => {
  const { street, city, state, country, zipCode, isDefault } = req.body;

  const id = req.user._id;

  const user = await userModel.findOneAndUpdate(
    { _id: id },
    {
      $push: {
        address: { street, city, state, country, zipCode, isDefault },
      },
    },
    { new: true }
  ); //hume latest updated document chahiye.

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(201).json({
    success: true,
    message: "Address added successfully",
    address: user.address[user.address.length - 1], //user ke latest added address ko bhejte hain.
  });
};

module.exports = { getAddresses, addAddress };
