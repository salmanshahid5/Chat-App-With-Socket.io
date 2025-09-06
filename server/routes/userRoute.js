import express from "express";
import { acceptRequest, cancelFriendRequest, deleteFriendRequest, getFriendRequests, getFriends, getFriendSuggestions, sendFriendRequest, updateProfile } from "../controllers/userController.js";
import { authentication } from "../middleware/protect.js";

const router = express.Router();
router.get('/friend-suggestions', authentication, getFriendSuggestions)
router.put("/update-profile", authentication, updateProfile);
router.post("/send-request", authentication, sendFriendRequest);
router.get("/friend-requests", authentication, getFriendRequests);
router.post("/cancel-request", authentication, cancelFriendRequest);

export default router;