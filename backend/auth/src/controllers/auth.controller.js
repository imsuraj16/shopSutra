const userModel = require("../models/user/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const redis = require("../db/redis");

// Controller for registering a new user
const register = async (req, res) => {
  try {
    const {
      fullName: { firstName, lastName },
      userName,
      email,
      password,
      role
    } = req.body;

    const userExists = await userModel.findOne({
      $or: [{ email }, { userName }],
    });

    if (userExists) {
      return res.status(409).json({
        message: "User with given email or username already exists",
      });
    }

    const newUser = await userModel.create({
      fullName: {
        firstName,
        lastName,
      },
      userName,
      email,
      password: await bcrypt.hash(password, 10), // hashing password before saving
      role : role || 'user'
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        userName: newUser.userName,
      },
      process.env.JWT_SECRET,
      {
        // process.env.JWT_SECRET is a secret key used to sign the token. It should be a long, random string that is kept secret.
        expiresIn: "1d", // token will expire in 1 day
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        userName: newUser.userName,
        role: newUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Controller for getting current logged in user
const login = async (req, res) => {
  try {
    const { email, userName, password } = req.body;

    const userExists = await userModel
      .findOne({
        $or: [{ email }, { userName }],
      })
      .select("+password"); // explicitly select password field

    if (!userExists) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, userExists.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: userExists._id,
        email: userExists.email,
        userName: userExists.userName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        id: userExists._id,
        fullName: userExists.fullName,
        email: userExists.email,
        userName: userExists.userName,
        role: userExists.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

//controller for getting current logged in user
const currentUser = async (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
};

// Controller for logging out a user
const logout = async (req, res) => {
  const { token } = req.cookies;
  if (token) {
    await redis.set(`blcklist:${token}`, "true", "EX", 24 * 60 * 60); // expire in 1 day
  }
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
  });
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

module.exports = {
  register,
  login,
  currentUser,
  logout,
};
