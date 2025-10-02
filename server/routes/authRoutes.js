import express from "express"
import { loginUser, signup } from "../controllers/authController.js";
const router = express.Router()

router.post('/auth/register', signup);
router.post('/auth/login', loginUser);

export default router