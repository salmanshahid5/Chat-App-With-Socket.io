// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const authentication = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No token, not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password"); 
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token invalid" });
  }
};
