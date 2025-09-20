import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CameraIcon } from "@heroicons/react/24/outline";
import { api } from "../../helper/api.js";
import { useNavigate } from "react-router-dom";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const UserProfileSheet = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const [user, setUser] = useState(storedUser);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [bio, setBio] = useState(storedUser.bio || "");
  const [email, setEmail] = useState(storedUser.email || "");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setBio(user?.bio || "");
    setEmail(user?.email || "");
  }, [user]);

  const updateLocalUser = (updatedFields) => {
    const newUser = { ...user, ...updatedFields };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put(
        "/users/update-profile",
        { bio, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateLocalUser(res.data);
      setIsEditingAbout(false);
      setIsEditingEmail(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  // Cloudinary upload for profile picture
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // check file size
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2 MB");
      return;
    }

    setUploading(true);

    try {
      // Show local preview
      const previewUrl = URL.createObjectURL(file);
      updateLocalUser({ profilePic: previewUrl });

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("Cloudinary upload failed", data);
        alert("Image upload failed");
        setUploading(false);
        return;
      }

      const cloudUrl = data.secure_url;

      // Update backend with Cloudinary URL
      const token = localStorage.getItem("token");
      const res2 = await api.put(
        "/users/update-profile",
        { profilePic: cloudUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateLocalUser(res2.data);
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
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
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 p-6 overflow-y-auto"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="flex flex-col items-center mb-6 relative">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border flex items-center justify-center bg-gray-100">
                  <img
                    src={user?.profilePic || `https://i.pravatar.cc/100?u=${user.id}`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-sm">
                      Uploading...
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-1 right-2 bg-black/60 hover:bg-black/80 
             text-white p-2 rounded-full shadow-md cursor-pointer 
             transition-transform duration-200 hover:scale-110"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
              <h2 className="text-xl font-semibold mt-3">{user?.username}</h2>
            </div>

            {/* About */}
            <div className="mb-4">
              <p className="text-gray-500 text-sm">About</p>
              {isEditingAbout ? (
                <div className="flex gap-2 items-center">
                  <input
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="border px-2 py-1 rounded w-full"
                  />
                  <button onClick={handleSave} className="text-green-600 font-medium">
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-gray-800">{user?.bio || "No info"}</span>
                  <button
                    onClick={() => setIsEditingAbout(true)}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm">Email</p>
              {isEditingEmail ? (
                <div className="flex gap-2 items-center">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border px-2 py-1 rounded w-full"
                  />
                  <button onClick={handleSave} className="text-green-600 font-medium">
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-start">
                  <span className="text-gray-800 break-words">{user?.email}</span>
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="text-blue-500 hover:underline text-sm mt-1 self-end"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Logout */}
            <div className="border-t pt-4">
              <button
                onClick={handleLogout}
                className="w-full py-2 border rounded-lg text-gray-700 hover:bg-gray-100"
              >
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
