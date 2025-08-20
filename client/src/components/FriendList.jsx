import React, { useState } from "react";
import {
  MagnifyingGlassIcon,
  CheckIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import FriendSuggestionSheet from "./FriendSuggestionSheet";

const FriendList = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const friends = [
    { id: 1, name: "Ali", lastMsg: "Hello!", time: "10:30 AM", img: "https://i.pravatar.cc/40?img=1" },
    { id: 2, name: "Jawad", lastMsg: "See you soon", time: "09:15 AM", img: "https://i.pravatar.cc/40?img=2" },
    { id: 3, name: "Salman", lastMsg: "Typing...", time: "Yesterday", img: "https://i.pravatar.cc/40?img=3" },
  ];

  return (
    <aside className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Search Box */}
      <div className="p-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white outline-none"
          />
        </div>
      </div>

      {/* Header with + icon */}
      <div className="px-4 py-3 font-semibold text-gray-700 flex items-center justify-between">
        <h2>Chats</h2>
        <button
          onClick={() => setIsSheetOpen(true)}
          className="p-1 rounded-full hover:bg-gray-200"
          title="Add Friends"
        >
          <PlusIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Friend List */}
      <ul className="flex-1 overflow-y-auto scrollbar-none">
        {friends.map((friend) => (
          <li
            key={friend.id}
            className="px-4 py-3 hover:bg-gray-200 cursor-pointer flex items-center gap-3"
          >
            <img
              src={friend.img}
              alt={friend.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{friend.name}</span>
                <span className="text-xs text-gray-500">{friend.time}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{friend.lastMsg}</span>
                <CheckIcon className="w-4 h-4 text-blue-500 ml-2" />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Sheet Component */}
      <FriendSuggestionSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </aside>
  );
};

export default FriendList;
