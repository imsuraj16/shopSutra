const userModel = require("../models/user/user.model");

// Get all addresses for the authenticated user
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

// Add a new address for the authenticated user
const addAddress = async (req, res) => {
  try {
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
      address: user.address[user.address.length - 1],
      addresses: user.address, //user ke latest added address ko bhejte hain.
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete an address for the authenticated user
const deleteaddress = async (req, res) => {
  try {
    const { id } = req.user;
    const { addressId } = req.params;

    const user = await userModel.findOneAndUpdate(
      {
        _id: id,
        "address._id": addressId,
      },
      {
        $pull: { address: { _id: addressId } },
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({ message: "address not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      addresses: user.address,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update an address for the authenticated user
const updateAddress = async (req, res) => {
  try {
    const { id } = req.user;
    const { addressId } = req.params;
    const { street, city, state, country, zipCode, isDefault } = req.body;

    const user = await userModel.findOneAndUpdate(
      {
        _id: id,
        "address._id": addressId,
      },
      {
        $set: {
          "address.$.street": street,
          "address.$.city": city,
          "address.$.state": state,
          "address.$.country": country,
          "address.$.zipCode": zipCode,
          "address.$.isDefault": isDefault,
        },
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({ message: "Address not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      addresses: user.address,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { getAddresses, addAddress, deleteaddress, updateAddress };
