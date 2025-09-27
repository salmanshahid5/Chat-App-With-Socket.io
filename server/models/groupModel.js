import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        image: { type: String, default: "" },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    },
    { timestamps: true }
);

export default mongoose.model("Group", groupSchema);
