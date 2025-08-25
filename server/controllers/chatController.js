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

//  Get all chats of logged in user
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate("members", "username email profilePic")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username email profilePic" }
      });

    res.status(200).json(chats);
  } catch (err) {
    console.error("Error in getUserChats:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get specific chat by ID
export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate("members", "username email profilePic")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username email profilePic" }
      });

    if (!chat) {
      return res.status(404).json({ msg: "Chat not found" });
    }

    if (!chat.members.some(member => member._id.equals(req.user._id))) {
      return res.status(403).json({ msg: "Not authorized to view this chat" });
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error("Error in getChatById:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get chats with last message
export const getChatsWithLastMessage = async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate("members", "username profilePic email")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const result = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          sender: { $ne: req.user._id },
          readBy: { $ne: req.user._id },
        });

        return {
          ...chat.toObject(),
          lastMessage: chat.latestMessage
            ? {
                text: chat.latestMessage.text,
                time: chat.latestMessage.createdAt,
              }
            : null,
          unreadCount,
        };
      })
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Chats Fetch Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};
