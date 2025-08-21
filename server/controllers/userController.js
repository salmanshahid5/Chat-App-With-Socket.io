import mongoose from "mongoose";
import User from "../models/userModal.js";

// Friend suggestions
export const getFriendSuggestions = async (req, res) => {
  try {
    const userId = req.user._id; // login user id

    // Current user find karo
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Following list ko ObjectId array banalo
    const followingIds = currentUser.following.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    // Suggestions nikalna
    const suggestions = await User.find({
      $and: [
        { _id: { $ne: new mongoose.Types.ObjectId(userId) } },
        { _id: { $nin: followingIds } },
      ],
    }).select("username email profilePic");

    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error in getFriendSuggestions:", error);
    res.status(500).json({ msg: error.message });
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