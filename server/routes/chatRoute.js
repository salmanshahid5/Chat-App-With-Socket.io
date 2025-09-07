import express from "express";
import { createChat, getUserChats, getChatById, getChatsWithLastMessage } from "../controllers/chatController.js";
import { authentication } from "../middleware/protect.js";

const router = express.Router();


router.post("/create", authentication, createChat);

router.get("/with-last-message", authentication, getChatsWithLastMessage);

router.get("/", authentication, getUserChats);

router.get("/:chatId", authentication, getChatById);


export default router;
