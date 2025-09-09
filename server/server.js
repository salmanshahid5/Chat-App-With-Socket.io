import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoute from "./routes/userRoute.js";
import chatRoutes from "./routes/chatRoute.js";
import messageRoutes from "./routes/messageRoute.js";
import cors from "cors";

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoute);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => res.send("Server is running"));

// Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io); // Make io accessible in controllers

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    // console.log(`User ${userId} joined personal room`);
  });

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    // console.log(`Joined chat room ${chatId}`);
  });

  socket.on("sendMessage", (message) => {
    io.to(message.chatId).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    // console.log("User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
