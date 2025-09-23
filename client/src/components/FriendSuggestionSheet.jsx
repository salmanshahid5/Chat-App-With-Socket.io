import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { api } from "../../helper/api.js";
import { socket } from "../../helper/socket.js";

const FriendSuggestionSheet = ({ isOpen, onClose }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const fetchSuggestions = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await api.get("/users/friend-suggestions", {
            headers: { Authorization: `Bearer ${token}` },
          });

          setSuggestions(res.data.suggestions);
          setSentRequests(res.data.sentRequests || []);
        } catch (err) {
          console.error("Error fetching suggestions:", err.response?.data || err);
        }
      };
      fetchSuggestions();
    }
  }, [isOpen]);

  //  Listen for friend request acceptance
  useEffect(() => {
    socket.on("friendRequestAccepted", (data) => {
      setSentRequests(prev => prev.filter(id => id !== data.friendId));
    });
    return () => socket.off("friendRequestAccepted");
  }, []);

  const sendFriendRequest = async (userId) => {
    try {
      setLoadingIds(prev => [...prev, userId]);
      const token = localStorage.getItem("token");
      await api.post("/users/send-request", { toUserId: userId }, { headers: { Authorization: `Bearer ${token}` } });

      setSentRequests(prev => [...prev, userId]);
    } catch (err) {
      console.error("Error sending request:", err.response?.data || err);
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== userId));
    }
  };

  const cancelFriendRequest = async (userId) => {
    try {
      setLoadingIds(prev => [...prev, userId]);
      const token = localStorage.getItem("token");
      await api.post("/users/cancel-request", { toUserId: userId }, { headers: { Authorization: `Bearer ${token}` } });

      setSentRequests(prev => prev.filter(id => id !== userId));
    } catch (err) {
      console.error("Error cancelling request:", err.response?.data || err);
    } finally {
      setLoadingIds(prev => prev.filter(id => id !== userId));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg z-50 p-4 overflow-y-auto scrollbar-none"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-bold text-gray-800">Friend Suggestions</h2>
              <button onClick={onClose} className="p-2 rounded-full cursor-pointer">
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <ul className="space-y-4">
              {suggestions.length > 0 ? suggestions.map(user => (
                <li key={user._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <img src={user.profilePic || `https://i.pravatar.cc/150?u=${user._id}`} alt={user.username} className="w-12 h-12 rounded-full" />
                    <span className="font-medium text-gray-800">{user.username}</span>
                  </div>
                  {sentRequests.includes(user._id) ? (
                    <button onClick={() => cancelFriendRequest(user._id)} disabled={loadingIds.includes(user._id)} className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition cursor-pointer">
                      {loadingIds.includes(user._id) ? "Cancelling..." : "Cancel"}
                    </button>
                  ) : (
                    <button onClick={() => sendFriendRequest(user._id)} disabled={loadingIds.includes(user._id)} className="px-4 py-2 bg-[#00bfa6] text-white text-sm font-medium rounded-lg hover:bg-[#a0ede4] transition cursor-pointer">
                      {loadingIds.includes(user._id) ? "Sending..." : "Follow"}
                    </button>
                  )}
                </li>
              )) : <p className="text-center text-gray-500">No suggestions found</p>}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FriendSuggestionSheet;
