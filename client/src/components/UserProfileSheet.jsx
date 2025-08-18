import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const UserProfileSheet = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Sheet Content */}
                    <motion.div
                        className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 p-6 overflow-y-auto"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                        {/* User Info */}
                        <div className="flex flex-col items-center mb-6">
                            <img
                                src="https://i.pravatar.cc/100?img=8"
                                alt="User"
                                className="w-24 h-24 rounded-full object-cover mb-3"
                            />
                            <h2 className="text-xl font-semibold">Salman</h2>
                        </div>

                        {/* About */}
                        <div className="mb-4">
                            <p className="text-gray-500 text-sm">About</p>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-800">13/12</span>
                                <button className="text-blue-500 hover:underline text-sm">Edit</button>
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="mb-6">
                            <p className="text-gray-500 text-sm">Email</p>
                            <div className="flex flex-col items-start">
                                <span className="text-gray-800 break-words">
                                    salmanshahid0333@gmail.com
                                </span>
                                <button className="text-blue-500 hover:underline text-sm mt-1 self-end">Edit</button>
                            </div>

                        </div>

                        {/* Logout */}
                        <div className="border-t pt-4">
                            <button className="w-full py-2 border rounded-lg text-gray-700 hover:bg-gray-100">
                                Log out
                            </button>
                            <p className="text-xs text-gray-400 mt-2">
                                Chat history on this computer will be cleared when you log out.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default UserProfileSheet;
