import React, { useState } from "react";
import { CameraIcon } from "@heroicons/react/24/outline";
import { api } from "../../helper/api";


const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const GroupModal = ({ isOpen, onClose, selectedFriends, onGroupCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [previewImage, setPreviewImage] = useState("");
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    //  Check file size
    if (file.size > 1 * 1024 * 1024) {
      alert("Image must be less than 1 MB.");
      return;
    }

    // show local preview immediately
    setPreviewImage(URL.createObjectURL(file));
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Cloudinary upload failed", data);
        alert("Image upload failed. Check console for details.");
        setUploading(false);
        return;
      }

      // data.secure_url and data.public_id available
      setPreviewImage(data.secure_url); // update preview to cloud URL
      setGroupImage({ url: data.secure_url, publicId: data.public_id });
    } catch (err) {
      console.error("Upload error:", err);
      alert("Image upload error. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return alert("Please enter a group name!");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append("name", groupName.trim());
      formData.append(
        "members",
        JSON.stringify(selectedFriends.map((f) => f._id))
      );

      // send Cloudinary URL instead of the file
      if (groupImage?.url) {
        formData.append("imageUrl", groupImage.url);
        formData.append("imagePublicId", groupImage.publicId || "");
      }

      const res = await api.post("/creategroup", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 201) {
        onGroupCreated?.(res.data);
        setGroupName("");
        setGroupImage(null);
        setPreviewImage("");
        onClose();
      }
    } catch (err) {
      console.error("Error creating group:", err);
      alert(err.response?.data?.msg || "Failed to create group. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Create Group</h2>

        {/* Group Image Upload */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border flex items-center justify-center bg-gray-100">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Group"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">No Image</span>
              )}
            </div>

            <label
              htmlFor="groupImageUpload"
              className="absolute bottom-1 right-1 cursor-pointer bg-gray-600 text-white p-2 rounded-full shadow-lg hover:bg-gray-400 transition"
            >
              <CameraIcon className="w-4 h-4" />
            </label>

            <input
              id="groupImageUpload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* uploading indicator */}
        {uploading && <p className="text-sm text-gray-500 mb-2">Uploading image...</p>}

        {/* Group Name Input */}
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name"
          className="w-full border rounded-md px-3 py-2 mb-4 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00bfa6] transition"
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            className="px-4 py-2 rounded-md bg-[#00bfa6] hover:bg-[#b2f2ea] text-white cursor-pointer"
            disabled={uploading}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupModal;
