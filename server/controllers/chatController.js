import Chat from "../models/chatModel.js"
import Message from "../models/messageModel.js"

//  Create Chat between two users
export const createChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    if (!userId) return res.status(400).json({ msg: "userId is required" });

    // Check if chat already exists
    let chat = await Chat.findOne({
      members: { $all: [currentUserId, userId] },
    }).populate("members", "username email profilePic");

    if (chat) return res.status(200).json(chat);

    // Create new chat
    chat = new Chat({
      members: [currentUserId, userId],
    });

    await chat.save();
    chat = await chat.populate("members", "username email profilePic");

    res.status(201).json(chat);
  } catch (err) {
    console.error("Error in createChat:", err);
    res.status(500).json({ msg: "Server error" });
  }
};






