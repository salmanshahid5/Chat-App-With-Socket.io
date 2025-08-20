import express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.get("/", (req, res) => {
    res.send("Server is running ");
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});