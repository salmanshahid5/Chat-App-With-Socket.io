import React, { useState, useEffect } from "react";
import FriendList from "../components/FriendList";
import ChatWindow from "../components/ChatWindow";
import SideBar from "../components/SideBar";
import GroupModal from "../components/GroupModal";
import { socket } from "../../helper/socket.js";

const ChatPage = () => {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [groupMode, setGroupMode] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false); 
  const [groups, setGroups] = useState([]); // store created groups

  useEffect(() => {
    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));
    socket.on("connect_error", (err) => console.error("Socket error:", err.message));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  // Handle new group
  const handleGroupCreated = (group) => {
    setGroups(prev => [...prev, group]);
    setSelectedFriend(group); // select newly created group
    setChatId(group._id);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="w-[72px] flex-shrink-0">
        <SideBar onToggleGroupMode={() => setGroupMode(prev => !prev)} />
      </div>

      {/* Friend List */}
      <div className={`w-[300px] flex-shrink-0 ${selectedFriend ? "hidden md:block" : "block"}`}>
        <FriendList
          selectedFriend={selectedFriend}
          setSelectedFriend={setSelectedFriend}
          setChatId={setChatId}
          groupMode={groupMode}
          onCreateGroup={(members) => {
            setSelectedFriends(members); 
            setIsGroupModalOpen(true); 
            setGroupMode(false);          
          }}
          groups={groups} // pass groups to friend list
        />
      </div>

      {/* Chat Window */}
      <div className={`flex-1 ${selectedFriend ? "block" : "hidden md:flex"}`}>
        {selectedFriend && chatId ? (
          <ChatWindow
            friend={selectedFriend}
            chatId={chatId}
            onBack={() => setSelectedFriend(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center h-full text-gray-500">
            Select a friend or group to start chatting
          </div>
        )}
      </div>

      {/* Group Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setSelectedFriends([]);
        }}
        selectedFriends={selectedFriends}
        onGroupCreated={handleGroupCreated} // pass callback
      />
    </div>
  );
};

export default ChatPage;
