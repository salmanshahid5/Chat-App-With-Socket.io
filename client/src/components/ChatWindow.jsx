import React, { useEffect, useRef, useState, useMemo } from "react";
import { api } from "../../helper/api";
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  VideoCameraIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import user from "../assets/user.png";
import { socket } from "../../helper/socket";

const ChatWindow = ({ friend, chatId, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");

  const currentUser = useMemo(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  }, []);
  const currentUserId = currentUser?._id;

  // robust sender id getter
  const getSenderId = (msg) => {
    if (!msg) return null;
    if (msg.sender) {
      if (typeof msg.sender === "string") return msg.sender;
      if (typeof msg.sender === "object") return msg.sender._id || msg.sender.id || null;
    }
    return msg.senderId || msg.sender_id || null;
  };

  const isSentByMe = (msg) => String(getSenderId(msg)) === String(currentUserId);

  // fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) return;
      try {
        const res = await api.get(`/groups/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data || []);
        socket.emit("joinChat", chatId);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();
    return () => {
      if (chatId) socket.emit("leaveChat", chatId);
    };
  }, [chatId, token]);

  // sockets: add messages (no duplicates)
  useEffect(() => {
    const addIfNotExists = (message) => {
      if (!message) return;
      setMessages((prev) => {
        if (message._id && prev.some((m) => String(m._id) === String(message._id))) return prev;
        return [...prev, message];
      });
    };

    const onReceive = (message) => {
      const msgChatId = message?.chatId || message?.groupId || message?.group;
      if (!chatId || String(msgChatId) !== String(chatId)) return;
      addIfNotExists(message);
    };

    socket.on("receiveMessage", onReceive);
    socket.on("newGroupMessage", onReceive);

    return () => {
      socket.off("receiveMessage", onReceive);
      socket.off("newGroupMessage", onReceive);
    };
  }, [chatId]);

  // scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // send message
  const handleSend = async () => {
    if (!inputText.trim() || !chatId) return;
    try {
      const res = await api.post(
        `/groups/${chatId}/messages`,
        { text: inputText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let newMsg = res?.data;
      if (!newMsg) {
        newMsg = {
          _id: `temp-${Date.now()}`,
          text: inputText,
          groupId: chatId,
          isGroup: true,
          sender: { _id: currentUserId, username: currentUser?.username, profilePic: currentUser?.profilePic },
          createdAt: new Date().toISOString(),
        };
      } else if (!getSenderId(newMsg)) {
        newMsg = {
          ...newMsg,
          sender: { _id: currentUserId, username: currentUser?.username, profilePic: currentUser?.profilePic },
          createdAt: newMsg.createdAt || new Date().toISOString(),
        };
      }

      setMessages((prev) => {
        if (newMsg._id && prev.some((m) => String(m._id) === String(newMsg._id))) return prev;
        return [...prev, newMsg];
      });

      setInputText("");
    } catch (err) {
      console.error("Error sending message:", err?.response?.data || err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f9fafb]">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="md:hidden text-gray-600 mr-2">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <img src={friend?.profilePic || user} alt="avatar" className="w-8 h-8 rounded-full" />
          <div>
            <h2 className="font-semibold text-gray-800">
              {friend?.username ? friend.username.charAt(0).toUpperCase() + friend.username.slice(1) : friend?.name || "Unknown"}
            </h2>
            <p className="text-xs text-gray-500">online</p>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-gray-500">
          <MagnifyingGlassIcon className="h-5 w-5 cursor-pointer" />
          <PhoneIcon className="h-5 w-5 cursor-pointer" />
          <VideoCameraIcon className="h-5 w-5 cursor-pointer" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
        {messages.map((msg) => {
          const isMe = isSentByMe(msg);
          const key = msg._id || msg.id || `${msg.groupId || chatId}-${msg.createdAt}-${Math.random()}`;

          return (
            <div key={key} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              {/* Avatar on left for others */}
              {!isMe && (
                <img
                  src={
                    (msg.sender && (msg.sender.profilePic || `https://i.pravatar.cc/40?u=${getSenderId(msg)}`)) ||
                    "https://i.pravatar.cc/40?u=other"
                  }
                  alt="avatar"
                  className="w-8 h-8 rounded-full mr-2 self-end"
                />
              )}

              <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                {/* Username (only for group chats and not me) */}
                {!isMe && msg.sender?.username && (
                  <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender.username}</span>
                )}

                {/* Bubble */}
                <div
                  className={`px-4 py-2 rounded-2xl shadow break-words ${isMe
                    ? "bg-[#5A65CC] text-white rounded-bl-none"
                    : "bg-white text-[#242424] rounded-br-none"
                    }`}
                >
                  <p>{msg.text}</p>
                  <p className="text-[10px] text-gray-300 mt-1 text-right">
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </p>
                </div>
              </div>

              {/* Avatar on right for me */}
              {isMe && (
                <img
                  src={currentUser?.profilePic || "https://i.pravatar.cc/40?u=me"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full ml-2 self-end"
                />
              )}
            </div>
          );
        })}


        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 flex items-center space-x-3 bg-[#F9FAFB] border-t border-gray-200">
        <FaceSmileIcon className="h-6 w-6 text-gray-500 cursor-pointer" />
        <input type="text" placeholder="Type a message..." value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} className="flex-1 px-4 py-2 border rounded-full outline-none focus:ring-0" />
        <button onClick={handleSend} className="p-2 bg-[#5A65CC] text-white rounded-full hover:bg-[#4a54aa] transition">
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
