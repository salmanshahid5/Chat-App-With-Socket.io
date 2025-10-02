import express from "express";
import {
  sendMessage,
  // markAsRead,
  getMessages
} from "../controllers/messageController.js";
import { authentication } from "../middleware/protect.js";

const router = express.Router();

// send new message
router.post("/messages/", authentication, sendMessage);

// get messages of a chat
router.get("/messages/:chatId", authentication, getMessages);

// router.put("/mark-read/:chatId", authentication, markMessagesAsRead);


export default router;
