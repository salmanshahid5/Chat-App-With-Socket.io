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

// Send Friend Request
export const sendFriendRequest = async (req, res) => {
  try {
    const { toUserId } = req.body;
    const fromUserId = req.user._id;

    if (!toUserId) return res.status(400).json({ msg: "toUserId is required" });
    if (fromUserId.toString() === toUserId.toString())
      return res.status(400).json({ msg: "Cannot send request to yourself" });

    const toUser = await User.findById(toUserId);
    if (!toUser) return res.status(404).json({ msg: "User not found" });

    // Check if already requested
    const already = toUser.friendRequests.find(
      (fr) =>
        (fr.from._id ? fr.from._id.toString() : fr.from.toString()) ===
        fromUserId.toString()
    );
    if (already) return res.status(400).json({ msg: "Already requested" });

    toUser.friendRequests.push({ from: fromUserId, status: "pending" });
    await toUser.save();

    // Emit event to receiver
    const io = req.app.get("io"); // app.set("io", io) kiya tha server me
    io.to(toUserId.toString()).emit("newFriendRequest", {
      _id: new mongoose.Types.ObjectId(), // ya request ka actual _id agar save kar rahe ho
      from: {
        _id: fromUserId,
        username: req.user.username,
        profilePic: req.user.profilePic
      },
      status: "pending"
    });


    res.json({ msg: "Friend request sent" });
  } catch (error) {
    console.error("Error in sendFriendRequest:", error);
    res.status(500).json({ msg: "Server error" });
  }
};