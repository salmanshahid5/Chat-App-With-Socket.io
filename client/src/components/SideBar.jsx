import React, { useState } from "react";
import {
  HomeIcon,
  ChatBubbleLeftIcon,
  PhoneIcon,
  Cog6ToothIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import UserProfileSheet from "./UserProfileSheet";
import FriendRequestSheet from "./FriendRequestSheet";

const SideBar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFriendSheetOpen, setIsFriendSheetOpen] = useState(false);

  const icons = [
    { id: 1, icon: <HomeIcon className="w-6 h-6" />, label: "Home" },
    { id: 2, icon: <ChatBubbleLeftIcon className="w-6 h-6" />, label: "Messages" },
    { id: 3, icon: <PhoneIcon className="w-6 h-6" />, label: "Calls" },
    { id: 4, icon: <UserPlusIcon className="w-6 h-6" />, label: "Friend Request" },
    { id: 5, icon: <Cog6ToothIcon className="w-6 h-6" />, label: "Settings" },
  ];

  return (
    <>
      <aside className="h-screen w-15 bg-gray-50 flex flex-col items-center py-2 justify-between">
        {/* Top Icons */}
        <div className="flex flex-col items-center">
          {icons.map((item) => (
            <button
              key={item.id}
              className="relative flex flex-col items-center justify-center w-12 h-12 my-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              title={item.label}
              onClick={() => {
                if (item.label === "Friend Request") {
                  setIsFriendSheetOpen(true);
                }
              }}
            >
              {item.icon}

              {/* Badge only for Friend Request */}
              {item.label === "Friend Request" && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  3
                </span>
              )}
            </button>
          ))}
        </div>

        {/* User Profile Image */}
        <div className="mb-4">
          <img
            src="https://i.pravatar.cc/40?img=8"
            alt="User"
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
            title="Profile"
            onClick={() => setIsProfileOpen(true)}
          />
        </div>
      </aside>

      {/* Sheets */}
      <UserProfileSheet isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <FriendRequestSheet isOpen={isFriendSheetOpen} onClose={() => setIsFriendSheetOpen(false)} />
    </>
  );
};

export default SideBar;
