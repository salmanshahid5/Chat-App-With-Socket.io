import express from "express";
import { createChat, getUserChats, getChatById, getChatsWithLastMessage, getChatMessages, sendMessage } from "../controllers/chatController.js";
import { authentication } from "../middleware/protect.js";

const router = express.Router();

router.post("/chats/create", authentication, createChat);
router.get("/chats/with-last-message", authentication, getChatsWithLastMessage);
router.get("/chats/", authentication, getUserChats);
router.get("/chats/:chatId", authentication, getChatById);
router.get("/chats/:chatId/messages", authentication, getChatMessages);
router.post("/chats/message", authentication, sendMessage);

export default router;
