// controllers/userController.js
import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";


// ============================
//  REGISTER USER
// ============================
export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid user data");
  }

  // Successful response
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token: user.generateToken(),
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

// ============================
//  LOGIN USER
// ============================
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(400);
    throw new Error("Invalid email or password");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(400);
    throw new Error("Invalid email or password");
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    token: user.generateToken(),
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

// ============================
//  GET LOGGED-IN USER PROFILE
// ============================
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    user,
  });
});
