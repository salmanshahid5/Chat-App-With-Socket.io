import Group from "../models/groupModel.js"
import Message from "../models/messageModel.js";

// createGroup
export const createGroup = async (req, res) => {
  try {
    const { name, members, imageUrl, imagePublicId } = req.body;
    const creatorId = req.user._id;

    if (!name) {
      return res.status(400).json({ msg: "Group name required" });
    }

    const existingGroup = await Group.findOne({ name: name.trim() });
    if (existingGroup) {
      return res.status(400).json({ msg: "Group with this name already exists" });
    }

    let parsedMembers = [];
    if (typeof members === "string") {
      try {
        parsedMembers = JSON.parse(members);
      } catch {
        parsedMembers = members.split(",").map((m) => m.trim()).filter(Boolean);
      }
    } else if (Array.isArray(members)) {
      parsedMembers = members;
    }

    const membersSet = Array.from(new Set([...parsedMembers, String(creatorId)]));

    const group = await Group.create({
      name: name.trim(),
      image: imageUrl || "",
      imagePublicId: imagePublicId || "",
      members: membersSet,
      admins: [creatorId],
    });

    // Populate members (and optionally admins)
    const populatedGroup = await group.populate("members", "username profilePic");
    await populatedGroup.populate("admins", "username profilePic");

    const io = req.app.get("io");
    const payload = populatedGroup.toObject();

    membersSet.forEach((memberId) => {
      io.to(String(memberId)).emit("groupCreated", payload);
    });

    return res.status(201).json(payload);
  } catch (err) {
    console.error("CreateGroup Error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// get users groups
export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate("members", "username email profilePic")
      .populate("admins", "username")
      .populate({
        path: "latestMessage",
        populate: { path: "sender", select: "_id username profilePic" }
      });

    return res.json(groups);
  } catch (err) {
    console.error("GetUserGroups Error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Get group by ID
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate("members", "username email profilePic")
      .populate("admins", "username");

    if (!group) return res.status(404).json({ msg: "Group not found" });

    if (!group.members.some((m) => m._id.equals(req.user._id))) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

//Add member
export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ msg: "Group not found" });

    if (!group.admins.includes(req.user._id)) {
      return res.status(403).json({ msg: "Only admins can add members" });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    const io = req.app.get("io");
    io.to(groupId).emit("groupUpdated", { groupId, action: "memberAdded", userId });

    res.json(group);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// sendGroupMessage

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;

    if (!text) return res.status(400).json({ msg: "Text required" });
    if (!req.user) return res.status(401).json({ msg: "User not authorized" });

    const message = await Message.create({
      groupId,
      sender: req.user._id,
      text,
      isGroup: true,
    });

    // update group's latestMessage
    await Group.findByIdAndUpdate(groupId, { latestMessage: message._id });

    // populate sender fields the client expects
    const populated = await Message.findById(message._id)
      .populate("sender", "_id username profilePic");

    // ensure plain JS object and cast id to string
    const payload = populated.toObject ? populated.toObject() : { ...populated };
    if (payload.sender && payload.sender._id) payload.sender._id = String(payload.sender._id);
    payload.groupId = String(groupId);

    const io = req.app.get("io");
    io.to(String(groupId)).emit("newGroupMessage", payload);

    return res.status(201).json(payload);
  } catch (err) {
    console.error("Send Group Message Error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.find({ groupId })
      .populate("sender", "_id username profilePic")
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (err) {
    console.error("Get Group Messages Error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

