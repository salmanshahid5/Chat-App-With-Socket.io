import { io } from "socket.io-client";

export const socket = io("https://chat-app-with-socket-io-ten.vercel.app", {
  withCredentials: true,
  transports: ["websocket"],
});