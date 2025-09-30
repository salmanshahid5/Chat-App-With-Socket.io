import Message from "../models/messageModel.js";
import Chat from "../models/chatModel.js"

// Send Message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;

    if (!chatId || !text) {
      return res.status(400).json({ msg: "chatId aur text required hain" });
    }

    // Create new message
    const message = new Message({
      chatId,
      sender: req.user._id,
      text,
    });

    await message.save();

    // Update chat with latest message
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { latestMessage: message._id },
      { new: true }
    ).populate("members", "username email profilePic");

    // Populate sender for response
    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "username email profilePic"
    );

    // Emit chatUpdated to all members (FriendList will update)
    const io = req.app.get("io");
    io.to(chatId).emit("chatUpdated", {
      _id: chat._id,
      lastMessage: {
        text: populatedMessage.text,
        sender: populatedMessage.sender,
        createdAt: populatedMessage.createdAt,
      },
      updatedAt: chat.updatedAt,
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};


// Get Messages
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const messages = await Message.find({ chatId }).populate("sender", "name email");

    res.status(200).json(messages);
  } catch (error) {
    console.error("Get Messages Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};


// Mark all messages as read in a chat
const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      { chatId, readBy: { $ne: userId } }, // jo abhi tak read nahi kiye gaye
      { $push: { readBy: userId } }
    );

    res.status(200).json({ msg: "Messages marked as read" });
  } catch (error) {
    console.error("Mark Read Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

export  default markMessagesAsRead