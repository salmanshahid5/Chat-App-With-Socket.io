import React, { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, UsersIcon } from "@heroicons/react/24/outline";
import FriendSuggestionSheet from "./FriendSuggestionSheet";
import { api } from "../../helper/api.js";
import { socket } from "../../helper/socket";

const FriendList = ({ selectedFriend, setSelectedFriend, setChatId, onCreateGroup, groupMode }) => {
  const [searchName, setSearchName] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Fetch friends
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/users/friends", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFriends(res.data.friends || []);

        const userId = res.data.currentUser?._id;
        if (userId) socket.emit("join", userId);
      } catch (err) {
        console.error(err.response?.data || err);
      }
    };
    fetchFriends();
  }, []);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/chats/with-last-message", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChats(res.data || []);
      } catch (err) {
        console.error("Error fetching chats:", err.response?.data || err);
      }
    };
    fetchChats();
  }, []);

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/getusersGroups", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(res.data || []);
      } catch (err) {
        console.error("Error fetching groups:", err.response?.data || err);
      }
    };
    fetchGroups();
  }, []);


  // Socket updates
  useEffect(() => {
    socket.on("newFriend", (friend) => {
      setFriends((prev) =>
        prev.some((f) => f._id === friend._id) ? prev : [...prev, friend]
      );
    });

    socket.on("chatUpdated", (chat) => {
      setChats((prevChats) => {
        const updated = [...prevChats];
        const index = updated.findIndex((c) => c._id === chat._id);

        if (index !== -1) {
          updated[index] = { ...updated[index], ...chat };
        } else {
          updated.push(chat);
        }
        return updated;
      });
    });

    socket.on("groupUpdated", (group) => {
      setGroups((prevGroups) => {
        const updated = [...prevGroups];
        const index = updated.findIndex((g) => g._id === group._id);

        if (index !== -1) {
          updated[index] = { ...updated[index], ...group };
        } else {
          updated.push(group);
        }
        return updated;
      });
    });

    // Listen for newly created groups in real time
    socket.on("groupCreated", (newGroup) => {
      setGroups((prev) => {
        const exists = prev.some((g) => g._id === newGroup._id);
        return exists ? prev : [...prev, newGroup];
      });
    });

    return () => {
      socket.off("newFriend");
      socket.off("chatUpdated");
      socket.off("groupUpdated");
      socket.off("groupCreated");
    };
  }, []);

  // Filter friends
  const filteredFriends = useMemo(
    () =>
      friends.filter((friend) =>
        friend.username?.toLowerCase().includes(searchName.toLowerCase())
      ),
    [friends, searchName]
  );

  // Select / Deselect friend
  const toggleFriendSelect = (id) => {
    setSelectedFriends((prev) => (prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]));
  };

  // Handle friend click
  const handleSelectFriend = async (friend) => {
    if (groupMode) {
      toggleFriendSelect(friend._id);
      return;
    }

    setSelectedFriend(friend);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/chats/create",
        { userId: friend._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatId(res.data._id);
      socket.emit("joinChat", res.data._id);
      setChats((prev) => (prev.some((c) => c._id === res.data._id) ? prev : [...prev, res.data]));
    } catch (err) {
      console.error("Error creating/fetching chat:", err.response?.data || err);
    }
  };

  // Handle group click
  const handleSelectGroup = (group) => {
    setSelectedFriend(group); // treat group same as selected friend
    setChatId(group._id);
    socket.emit("joinChat", group._id);
  };

  // Get last message
  const getLastMessage = (id) => {
    const chat = chats.find((c) =>
      c.members.some((m) => (m._id ? m._id === id : m === id))
    );
    if (!chat || !chat.lastMessage) return { text: "", time: "" };

    const { text, createdAt } = chat.lastMessage;
    const msgDate = new Date(createdAt);
    if (isNaN(msgDate)) return { text, time: "" };

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let formattedTime;
    if (msgDate.toDateString() === today.toDateString()) {
      formattedTime = msgDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      formattedTime = "Yesterday";
    } else {
      formattedTime = msgDate.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
    }
    return { text, time: formattedTime };
  };

  // Create group
  const handleCreateGroup = () => {
    const groupMembers = friends.filter((f) => selectedFriends.includes(f._id));
    if (onCreateGroup) onCreateGroup(groupMembers);
    setSelectedFriends([]);
  };

  return (
    <aside className="h-screen bg-[#ffffff] flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white outline-none"
          />
        </div>
      </div>

      {/* Header */}
      <div className="px-4 py-3 font-semibold text-gray-700 flex items-center justify-between">
        <h2>Chats</h2>
        {groupMode && selectedFriends.length >= 2 ? (
          <button onClick={handleCreateGroup} className="flex items-center gap-2 px-3 py-1 rounded-full text-[#ffffff] bg-[#00BFA6] cursor-pointer">
            <UsersIcon className="w-5 h-5" />
            Create Group
          </button>
        ) : (
          <button onClick={() => setIsSheetOpen(true)} className="flex items-center gap-2 px-3 py-1 rounded-full text-[#ffffff] bg-[#00BFA6] cursor-pointer" title="Add Friend">
            <PlusIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Friends</span>
          </button>
        )}
      </div>

      {/* Friend + Group List */}
      <ul className="flex-1 overflow-y-auto scrollbar-none">
        {/* Friends */}
        {filteredFriends.map((friend) => (
          <li
            key={friend._id}
            className={`px-4 py-3 flex items-center gap-3 hover:bg-[#F2FCFA] cursor-pointer ${selectedFriend?._id === friend._id ? "bg-[#E0F7F3]" : ""}`}
            onClick={() => handleSelectFriend(friend)}
          >
            {groupMode && (
              <input
                type="checkbox"
                checked={selectedFriends.includes(friend._id)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleFriendSelect(friend._id);
                }}
                className="w-4 h-4 cursor-pointer"
              />
            )}
            <img src={friend.profilePic || `https://i.pravatar.cc/40?u=${friend._id}`} alt={friend.username} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex flex-col w-full">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{friend.username?.charAt(0).toUpperCase() + friend.username?.slice(1)}</span>
                <span className="text-xs text-gray-400">{getLastMessage(friend._id).time}</span>
              </div>
              <span className="text-sm text-gray-500 truncate max-w-[200px]">{getLastMessage(friend._id).text}</span>
            </div>
          </li>
        ))}

        {/* Groups */}
        {groups.map((group) => (
          <li
            key={group._id}
            className={`px-4 py-3 flex items-center gap-3 hover:bg-[#F2FCFA] cursor-pointer ${selectedFriend?._id === group._id ? "bg-[#E0F7F3]" : ""}`}
            onClick={() => handleSelectGroup(group)}
          >
            <img src={group.image || `https://i.pravatar.cc/40?u=${group._id}`} alt={group.name} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex flex-col w-full">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{group.name}</span>
                <span className="text-xs text-gray-400">{getLastMessage(group._id).time}</span>
              </div>
              <span className="text-sm text-gray-500 truncate max-w-[200px]">{getLastMessage(group._id).text}</span>
            </div>
          </li>
        ))}
      </ul>

      <FriendSuggestionSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} />
    </aside>
  );
};

export default FriendList;
