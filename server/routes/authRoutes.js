import express from "express"
import { loginUser, signup } from "../controllers/authController.js";
const router = express.Router()

router.post('/register', signup);
router.post('/login', loginUser);

export default router