import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";

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
    const userId = req.user._id;

    const chats = await Chat.find({ members: userId })
      .populate("members", "username email profilePic")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "username email profilePic" },
      })
      .sort({ updatedAt: -1 }); // newest chats first

    res.status(200).json(chats);
  } catch (err) {
    console.error("Error in getChatsWithLastMessage:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


// Send message in a 1-to-1 chat
export const sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;

    if (!chatId || !text) {
      return res.status(400).json({ msg: "chatId and text are required" });
    }

    const message = await Message.create({
      chatId,
      sender: req.user._id,
      text,
      isGroup: false,
    });

    // Update latestMessage using Chat model (fixed typo)
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    const populated = await Message.findById(message._id)
      .populate("sender", "_id username profilePic");

    const payload = { ...(populated.toObject ? populated.toObject() : populated), chatId: String(chatId) };

    const io = req.app.get("io");
    io.to(String(chatId)).emit("chatUpdated", payload);

    return res.status(201).json(payload);
  } catch (err) {
    console.error("Error in sendMessage:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Get all messages in a 1-to-1 chat
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId })
      .populate("sender", "_id username profilePic")
      .sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (err) {
    console.error("Error in getChatMessages:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
