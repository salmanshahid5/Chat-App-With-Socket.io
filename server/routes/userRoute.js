import express from "express";
import { acceptRequest, cancelFriendRequest, deleteFriendRequest, getFriendRequests, getFriends, getFriendSuggestions, sendFriendRequest, updateProfile } from "../controllers/userController.js";
import { authentication } from "../middleware/protect.js";

const router = express.Router();
router.get('/users/friend-suggestions', authentication, getFriendSuggestions)
router.put("/users/update-profile", authentication, updateProfile);
router.post("/users/send-request", authentication, sendFriendRequest);
router.get("/users/friend-requests", authentication, getFriendRequests);
router.post("/users/cancel-request", authentication, cancelFriendRequest);
router.post("/users/accept-request", authentication, acceptRequest);
router.post("/users/delete-requests", authentication, deleteFriendRequest);
router.get("/users/friends", authentication, getFriends);

export default router;