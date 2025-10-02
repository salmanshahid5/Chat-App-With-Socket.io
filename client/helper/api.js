import axios from "axios";

export const api = axios.create({
  // baseURL: "http://localhost:5000/api", 
  baseURL: "https://chat-app-with-socket-io-ten.vercel.app/api", 
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json", 
  },
});
