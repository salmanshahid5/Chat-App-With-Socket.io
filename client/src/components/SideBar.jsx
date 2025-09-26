import React, { useState, useEffect } from "react";
import {
  HomeIcon,
  ChatBubbleLeftIcon,
  PhoneIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import UserProfileSheet from "./UserProfileSheet";
import FriendRequestSheet from "./FriendRequestSheet";
import GroupModal from "./GroupModal.jsx";
import { api } from "../../helper/api.js";
import { socket } from "../../helper/socket.js";

const SideBar = ({ onToggleGroupMode, selectedFriends }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFriendSheetOpen, setIsFriendSheetOpen] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const profilePic = storedUser?.profilePic || "https://i.pravatar.cc/40?img=8";

  // Initial fetch of friend requests
  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/users/friend-requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFriendRequests(res.data.requests || []);
      } catch (err) {
        console.error("Error fetching friend requests:", err);
      }
    };
    fetchFriendRequests();
  }, []);

  // Real-time updates via socket
  useEffect(() => {
    const handleNewRequest = (request) => {
      if (!request?.from?._id) return;
      setFriendRequests((prev) => {
        const exists = prev.some((r) => r.from?._id === request.from._id);
        if (exists) return prev;
        return [...prev, request];
      });
    };

    const handleRequestAcceptedOrDeleted = (data) => {
      setFriendRequests((prev) =>
        prev.filter((r) => r.from?._id !== data.userId)
      );
    };

    socket.on("newFriendRequest", handleNewRequest);
    socket.on("friendRequestAccepted", handleRequestAcceptedOrDeleted);
    socket.on("friendRequestDeleted", handleRequestAcceptedOrDeleted);

    return () => {
      socket.off("newFriendRequest", handleNewRequest);
      socket.off("friendRequestAccepted", handleRequestAcceptedOrDeleted);
      socket.off("friendRequestDeleted", handleRequestAcceptedOrDeleted);
    };
  }, []);

  const icons = [
    { id: 1, icon: <HomeIcon className="w-6 h-6" />, label: "Home" },
    { id: 2, icon: <ChatBubbleLeftIcon className="w-6 h-6" />, label: "Messages" },
    { id: 3, icon: <PhoneIcon className="w-6 h-6" />, label: "Calls" },
    { id: 4, icon: <UserGroupIcon className="w-6 h-6" />, label: "Groups" },
    { id: 5, icon: <UserPlusIcon className="w-6 h-6" />, label: "Friend Request" },
    { id: 6, icon: <Cog6ToothIcon className="w-6 h-6" />, label: "Settings" },
  ];

  return (
    <>
      <aside className="h-screen w-[72px] bg-[#ffffff] flex flex-col items-center py-2 justify-between">
        <div className="flex flex-col items-center">
          {icons.map((item) => (
            <button
              key={item.id}
              className="relative flex flex-col items-center justify-center w-12 h-12 my-2 text-gray-600 hover:bg-[#F2FCFA] rounded-lg transition-colors duration-200"
              title={item.label}
              onClick={() => {
                if (item.label === "Friend Request") {
                  setIsFriendSheetOpen(true);
                }
                if (item.label === "Groups") {
                  onToggleGroupMode?.(); // friendlist ko toggle karega
                }
              }}
            >
              {item.icon}
              {item.label === "Friend Request" && friendRequests.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {friendRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="mb-4">
          <img
            src={profilePic}
            alt="User"
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
            title="Profile"
            onClick={() => setIsProfileOpen(true)}
          />
        </div>
      </aside>

      {/* Sheets & Modals */}
      <UserProfileSheet
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      <FriendRequestSheet
        isOpen={isFriendSheetOpen}
        onClose={() => setIsFriendSheetOpen(false)}
        groupMode={isGroupModalOpen}
        onGroupCreate={() => setIsGroupModalOpen(false)}
      />
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        selectedFriends={selectedFriends || []}
      />
    </>
  );
};

export default SideBar;
