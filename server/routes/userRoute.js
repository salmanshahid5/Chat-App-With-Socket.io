import express from "express";
import { acceptRequest, cancelFriendRequest, deleteFriendRequest, getFriendRequests, getFriends, getFriendSuggestions, sendFriendRequest, updateProfile } from "../controllers/userController.js";
import { authentication } from "../middleware/protect.js";

const router = express.Router();
router.get('/friend-suggestions', authentication, getFriendSuggestions)
router.put("/update-profile", authentication, updateProfile);


export default router;