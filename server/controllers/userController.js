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

// Accept Friend Request
export const acceptRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fromUserId } = req.body;

    const user = await User.findById(userId);
    const fromUser = await User.findById(fromUserId);

    if (!user || !fromUser) return res.status(404).json({ msg: "User not found" });

    // Remove the friend request
    user.friendRequests = user.friendRequests.filter(
      (r) => r.from.toString() !== fromUserId.toString()
    );

    // Add each other as friends if not already
    if (!user.friends.includes(fromUserId)) user.friends.push(fromUserId);
    if (!fromUser.friends.includes(userId)) fromUser.friends.push(userId);

    await user.save();
    await fromUser.save();

    const io = req.app.get("io");

    // 🔹 Notify both users with new friend
    io.to(fromUserId.toString()).emit("newFriend", {
      _id: userId,
      username: user.username,
      profilePic: user.profilePic,
      email: user.email,
    });

    io.to(userId.toString()).emit("newFriend", {
      _id: fromUserId,
      username: fromUser.username,
      profilePic: fromUser.profilePic,
      email: fromUser.email,
    });

    // Populate the friend to send back to frontend (optional)
    const populatedFriend = await User.findById(fromUserId).select("username profilePic email");

    res.json({ msg: "Friend request accepted", friend: populatedFriend });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete / Cancel Friend Request
export const deleteFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id; // current logged-in user
    const { fromUserId } = req.body; // the sender of the request

    if (!fromUserId) return res.status(400).json({ msg: "fromUserId is required" });

    const me = await User.findById(userId);
    if (!me) return res.status(404).json({ msg: "User not found" });

    me.friendRequests = me.friendRequests.filter((fr) => {
      const fromId = fr.from?._id ? fr.from._id.toString() : fr.from?.toString();
      return fromId !== fromUserId.toString();
    });

    await me.save();
    res.json({ msg: "Friend request deleted" });
  } catch (error) {
    console.error("Error in deleteFriendRequest:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

// get friend requests
export const getFriendRequests = async (req, res) => {
  try {
    //  agar req.user hi undefined hai (auth middleware fail)
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: "Unauthorized - no user found" });
    }

    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: "friendRequests.from",
      select: "username email profilePic",
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const pendingRequests = user.friendRequests
      .filter((fr) => fr?.status === "pending" && fr?.from) // null safe filter
      .map((fr) => ({
        _id: fr._id,          // request id
        from: fr.from,        // user details
        status: fr.status,
      }));

    res.json({ requests: pendingRequests });
  } catch (err) {
    console.error("Error in getFriendRequests:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

// cancel friend request

export const cancelFriendRequest = async (req, res) => {
  try {
    const { toUserId } = req.body; // jis user ko request bheji thi
    const fromUserId = req.user._id; // logged in user

    if (!toUserId) {
      return res.status(400).json({ msg: "toUserId is required" });
    }

    // Target user find karo
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Filter out request
    const updatedRequests = toUser.friendRequests.filter(
      (fr) => fr.from.toString() !== fromUserId.toString()
    );

    if (updatedRequests.length === toUser.friendRequests.length) {
      return res.status(400).json({ msg: "No pending request found to cancel" });
    }

    // Save updated list
    toUser.friendRequests = updatedRequests;
    await toUser.save();

    res.json({ msg: "Friend request cancelled successfully" });
  } catch (error) {
    console.error("Error in cancelFriendRequest:", error);
    res.status(500).json({ msg: "Server error" });
  }
};