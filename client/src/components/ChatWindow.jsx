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

  // Read & normalize current user from localStorage (support common id fields)
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const currentUserId = useMemo(() => {
    if (!currentUser) return null;
    return (
      currentUser._id ||
      currentUser.id ||
      currentUser.userId ||
      currentUser.uid ||
      currentUser._uid ||
      currentUser.uuid ||
      null
    );
  }, [currentUser]);

  // Utility: get sender id from multiple shapes
  const getSenderId = (msg) => {
    if (!msg) return null;

    const s = msg.sender;
    if (!s) {
      if (msg.senderId) return msg.senderId;
      if (msg.sender_id) return msg.sender_id;
      if (msg.from) return typeof msg.from === "string" ? msg.from : msg.from._id || msg.from.id || null;
      return null;
    }

    if (typeof s === "string") return s;
    if (typeof s === "object") {
      return s._id || s.id || s.userId || s.uid || null;
    }

    return null;
  };

  // ensure both sides are strings and trimmed for reliable comparison
  const isSentByMe = (msg) => {
    const sid = getSenderId(msg);
    if (!sid || !currentUserId) return false;
    return String(sid).trim() === String(currentUserId).trim();
  };

  // normalize a single message object: ensure sender is object { _id, username?, profilePic? }
  const normalizeMessage = (m) => {
    if (!m) return m;
    const msg = { ...m };

    // if sender is string, convert to object
    if (msg.sender && typeof msg.sender === "string") {
      msg.sender = { _id: msg.sender };
    }
    if (!msg.sender) {
      const sid = getSenderId(msg);
      if (sid) msg.sender = { _id: sid };
    }
    if (!msg.createdAt) msg.createdAt = new Date().toISOString();

    return msg;
  };

  // Helper: are two messages likely the same (used to match temp -> server)
  const isLikelySameMessage = (tempMsg, serverMsg) => {
    if (!tempMsg || !serverMsg) return false;
    if (String(tempMsg._id).startsWith("temp-")) {
      const sameText = String(tempMsg.text || "").trim() === String(serverMsg.text || "").trim();
      const t1 = Date.parse(tempMsg.createdAt || 0);
      const t2 = Date.parse(serverMsg.createdAt || 0);
      const timeDiff = Number.isFinite(t1) && Number.isFinite(t2) ? Math.abs(t1 - t2) : 0;
      if (sameText && timeDiff < 15000) return true;
      if (sameText && Math.abs(Date.now() - t1) < 20000) return true;
    }
    return false;
  };

  // fetch messages (works for group or chat endpoints the same)
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId) {
        setMessages([]);
        return;
      }
      try {
        const res = await api.get(`/groups/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data) ? res.data : [];
        const normalized = data.map(normalizeMessage);
        setMessages(normalized);
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

  // socket listeners for incoming messages
  useEffect(() => {
    const addIfNotExists = (message) => {
      if (!message) return;
      const normalized = normalizeMessage(message);

      setMessages((prev) => {
        if (normalized._id) {
          const filtered = prev.filter((m) => {
            if (String(m._id).startsWith("temp-") && isLikelySameMessage(m, normalized)) {
              return false;
            }
            return true;
          });
          if (filtered.some((m) => String(m._id) === String(normalized._id))) return filtered;

          return [...filtered, normalized];
        }
        if (!normalized._id && prev.some((m) => m.text === normalized.text && m.createdAt === normalized.createdAt)) {
          return prev;
        }

        return [...prev, normalized];
      });
    };

    const onReceive = (message) => {
      const msgChatId = message?.chatId || message?.groupId || message?.group || message?.chat;
      if (!chatId || !msgChatId) return;
      if (String(msgChatId) !== String(chatId)) return;
      addIfNotExists(message);
    };

    socket.on("receiveMessage", onReceive);
    socket.on("newGroupMessage", onReceive);
    socket.on("chatUpdated", onReceive);

    return () => {
      socket.off("receiveMessage", onReceive);
      socket.off("newGroupMessage", onReceive);
      socket.off("chatUpdated", onReceive);
    };
  }, [chatId]);

  // auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // send message (optimistic + replace temp)
  const handleSend = async () => {
    if (!inputText.trim() || !chatId) return;

    const tempId = `temp-${Date.now()}`;
    const temp = normalizeMessage({
      _id: tempId,
      text: inputText,
      groupId: chatId,
      isGroup: true,
      sender: { _id: currentUserId, username: currentUser?.username, profilePic: currentUser?.profilePic },
      createdAt: new Date().toISOString(),
    });

    // add optimistic
    setMessages((prev) => [...prev, temp]);
    setInputText("");

    try {
      const res = await api.post(
        `/groups/${chatId}/messages`,
        { text: inputText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const serverMsg = normalizeMessage(res?.data);

      setMessages((prev) => {
        if (serverMsg._id) {
          const filtered = prev.filter((m) => {
            if (String(m._id).startsWith("temp-") && isLikelySameMessage(m, serverMsg)) return false;
            return true;
          });
          if (filtered.some((m) => String(m._id) === String(serverMsg._id))) return filtered;

          return [...filtered, serverMsg];
        }
        const withoutTemp = prev.filter((m) => String(m._id) !== String(tempId));
        return [...withoutTemp, serverMsg];
      });
    } catch (err) {
      console.error("Error sending message:", err?.response?.data || err);
    }
  };

  // --- NEW helpers for group header ---
  const isGroupChat = friend?.isGroup || Array.isArray(friend?.members);
  const getMemberDisplayName = (member) => {
    if (!member) return "Unknown";
    if (typeof member === "string") return member;
    return member.username || member.name || member.fullName || member._id || member.id || "Unknown";
  };

  const renderMemberList = (members = []) => {
    if (!Array.isArray(members) || members.length === 0) return "No members";
    const maxShow = 4; // show up to 4 names then "and X others"
    const names = members.map(getMemberDisplayName);
    if (names.length <= maxShow) return names.join(", ");
    const shown = names.slice(0, maxShow).join(", ");
    return `${shown} and ${names.length - maxShow} others`;
  };
  // --- end helpers ---

  return (
    <div className="flex flex-col h-screen bg-[#ffffff]">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-[#ffffff] border-b border-black/10">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="md:hidden text-gray-600 mr-2">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>

          {/* Group header when group, otherwise single chat header */}
          {isGroupChat ? (
            <>
              <img src={friend?.image || user} alt="group-avatar" className="w-8 h-8 rounded-full" />
              <div>
                <h2 className="font-semibold text-gray-800">
                  {friend?.name || "Group Chat"}
                </h2>
                <p className="text-xs text-gray-500">
                  {renderMemberList(friend?.members)}
                </p>
              </div>
            </>
          ) : (
            <>
              <img src={friend?.profilePic || user} alt="avatar" className="w-8 h-8 rounded-full" />
              <div>
                <h2 className="font-semibold text-gray-800">
                  {friend?.username ? friend.username.charAt(0).toUpperCase() + friend.username.slice(1) : friend?.name || "Unknown"}
                </h2>
                <p className="text-xs text-gray-500">online</p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3 text-gray-500">
          <MagnifyingGlassIcon className="h-5 w-5 cursor-pointer" />
          <PhoneIcon className="h-5 w-5 cursor-pointer" />
          <VideoCameraIcon className="h-5 w-5 cursor-pointer" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#ffffff]">
        {messages.map((msg, idx) => {
          const isMe = isSentByMe(msg);
          const key = msg._id || `${chatId}-${idx}-${msg.createdAt}`;

          return (
            <div key={key} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <img
                  src={(msg.sender && (msg.sender.profilePic || `https://i.pravatar.cc/40?u=${getSenderId(msg)}`)) || "https://i.pravatar.cc/40?u=other"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full mr-2 self-end"
                />
              )}

              <div className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && msg.sender?.username && (
                  <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender.username}</span>
                )}

                <div className={`px-4 py-2 rounded-2xl shadow break-words ${isMe ? "bg-[#00bfa6] text-white rounded-bl-none" : "bg-[#e0f7f3] text-[#242424] rounded-br-none"}`}>
                  <p>{msg.text}</p>
                  <p className="text-[10px] text-gray-300 mt-1 text-right">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              </div>

              {isMe && (
                <img src={currentUser?.profilePic || "https://i.pravatar.cc/40?u=me"} alt="avatar" className="w-8 h-8 rounded-full ml-2 self-end" />
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 flex items-center space-x-3 bg-[#F9FAFB] border-t border-black/10">
        <FaceSmileIcon className="h-6 w-6 text-gray-500 cursor-pointer" />
        <input
          type="text"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 px-4 py-2  border border-black/10 rounded-full outline-none focus:ring-0"
        />
        <button onClick={handleSend} className="p-2 bg-[#00bfa6] hover:bg-[#b2f2ea] text-white rounded-full transition cursor-pointer">
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
