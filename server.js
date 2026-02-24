
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const ticketRoutes = require("./routes/tickets");
const commentRoutes = require("./routes/comments");

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.json({ message: "Support Ticket API Running" });
});
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/tickets", ticketRoutes);
app.use("/comments", commentRoutes);
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});