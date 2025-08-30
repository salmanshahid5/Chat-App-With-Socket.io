import mongoose from "mongoose";
import User from "../models/userModel.js";

// Friend suggestions
export const getFriendSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Following list ko ObjectId array me convert karlo
    const followingIds = currentUser.following.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Suggestions (jo follow nahi kiye)
    const suggestions = await User.find({
      _id: { $ne: userId, $nin: followingIds },
    }).select("username email profilePic");

    // Ye find karega kin users ke friendRequests me currentUser ne request bheji hai
    const sentRequests = await User.find({
      "friendRequests.from": userId,
      "friendRequests.status": "pending",
    }).select("_id");

    res.status(200).json({
      suggestions,
      sentRequests: sentRequests.map((u) => u._id.toString()), // sirf IDs bhej do
    });
  } catch (error) {
    console.error("Error in getFriendSuggestions:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// update profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // token se user aayega
    const { username, email, bio } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email, bio },
      { new: true }
    );

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};