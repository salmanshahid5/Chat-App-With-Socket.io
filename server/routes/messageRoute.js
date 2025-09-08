import express from "express";
import {
  sendMessage,
  // markAsRead,
  getMessages
} from "../controllers/messageController.js";
import { authentication } from "../middleware/protect.js";

const router = express.Router();

// send new message
router.post("/", authentication, sendMessage);


export default router;
