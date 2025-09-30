import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoute from "./routes/userRoute.js";
import chatRoutes from "./routes/chatRoute.js";
import groupRoutes from "./routes/grouproute.js";
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
app.use("/api", groupRoutes); 

app.get("/", (req, res) => res.send("Server is running"));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io accessible in controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join personal room (for friend updates)
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined personal room`);
  });

  // Join 1-to-1 chat
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Send 1-to-1 message
  socket.on("sendMessage", (message) => {
    io.to(message.chatId).emit("receiveMessage", message);
  });

  // Join group room
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`User joined group ${groupId}`);
  });

  // Send group message
  socket.on("sendGroupMessage", (message) => {
    io.to(message.groupId).emit("newGroupMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
