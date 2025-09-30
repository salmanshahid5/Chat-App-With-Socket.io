import express from "express";
import {
    createGroup,
    getUserGroups,
    getGroupById,
    addMember,
    sendGroupMessage,
    getGroupMessages,
} from "../controllers/groupController.js";
import { authentication } from "../middleware/protect.js";

const router = express.Router();

router.post("/creategroup", authentication, createGroup);         // create new group
router.get("/getusersGroups", authentication, getUserGroups);        // get my groups
router.get("/:groupId", authentication, getGroupById); // get specific group
router.post("/:groupId/add", authentication, addMember);
router.post("/groups/:groupId/messages", authentication, sendGroupMessage);
router.get("/groups/:groupId/messages", authentication, getGroupMessages);

export default router;
