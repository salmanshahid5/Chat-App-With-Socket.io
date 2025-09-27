import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../helper/api.js";
import { socket } from "../../helper/socket.js";
import { XMarkIcon } from "@heroicons/react/24/outline";

const FriendRequestSheet = ({ isOpen, onClose }) => {
  const [requests, setRequests] = useState([]);
  const [loadingIds, setLoadingIds] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get("/users/friend-requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequests(res.data.requests || []);
      } catch (err) {
        console.error("Error fetching requests:", err.response?.data || err);
      }
    };
    fetchRequests();
  }, [isOpen]);

  useEffect(() => {
    const handleNewRequest = (data) => {
      if (!data?._id) return;
      setRequests((prev) => [
        ...prev,
        { _id: Date.now(), from: data, status: "pending" },
      ]);
    };

    socket.on("newFriendRequest", handleNewRequest);
    return () => socket.off("newFriendRequest", handleNewRequest);
  }, []);

  // accept
  const handleAccept = async (fromUserId) => {
    if (!fromUserId) return;
    setLoadingIds((prev) => [...prev, fromUserId]);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/users/accept-request",
        { fromUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests((prev) => prev.filter((r) => r.from?._id !== fromUserId));
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== fromUserId));
    }
  };

  // delete
  const handleDelete = async (fromUserId) => {
    if (!fromUserId) return;
    setLoadingIds((prev) => [...prev, fromUserId]);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/users/delete-requests",
        { fromUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests((prev) => prev.filter((r) => r.from?._id !== fromUserId));
    } catch (err) {
      console.error(err.response?.data || err);
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== fromUserId));
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
            className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg z-50 p-6 overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-bold">Friend Requests</h2>
              <button onClick={onClose} className="p-2 rounded-full cursor-pointer">
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            {requests.length === 0 ? (
              <p className="text-gray-500 text-sm">No new requests</p>
            ) : (
              <ul className="space-y-4">
                {requests.map((req) => {
                  const fromUser = req.from;
                  return (
                    <li
                      key={req._id || req.sender?._id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#F9FAFB]"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            fromUser?.profilePic ||
                            `https://i.pravatar.cc/150?u=${fromUser?._id || req._id}`
                          }
                          alt={fromUser?.username || "Unknown"}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className="font-medium">
                          {fromUser?.username || "Unknown User"}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          disabled={
                            !fromUser?._id ||
                            loadingIds.includes(fromUser._id)
                          }
                          onClick={() => handleAccept(fromUser?._id)}
                          className="px-2 py-1 bg-[#00bfa6] text-white text-sm rounded-md cursor-pointer"
                        >
                          {fromUser?._id &&
                            loadingIds.includes(fromUser._id)
                            ? "Processing..."
                            : "Confirm"}
                        </button>
                        <button
                          disabled={
                            !fromUser?._id ||
                            loadingIds.includes(fromUser._id)
                          }
                          onClick={() => handleDelete(fromUser?._id)}
                          className="px-2 py-1 bg-gray-200 text-sm rounded-md hover:bg-gray-300"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FriendRequestSheet;
