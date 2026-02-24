const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const { authenticate } = require("../middleware");

const router = express.Router();
router.post("/", authenticate, async (req, res) => {

  if (req.user.role_id !== 1)
    return res.status(403).json({ message: "Only manager can create users" });

  const { name, email, password, role_id } = req.body;

  if (!name || !email || !password || !role_id)
    return res.status(400).json({ message: "All fields required" });

  if (![1,2,3].includes(role_id))
    return res.status(400).json({ message: "Invalid role" });

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (name, email, password, role_id)
     VALUES (?, ?, ?, ?)`,
    [name, email, hashedPassword, role_id],
    function (err) {

      if (err)
        return res.status(400).json({ message: err.message });

      res.status(201).json({
        message: "User created successfully",
        user_id: this.lastID
      });
    }
  );
});
router.get("/", authenticate, (req, res) => {

  if (req.user.role_id !== 1)
    return res.status(403).json({ message: "Only manager can view users" });

  db.all(
    `SELECT id, name, email, role_id, created_at FROM users`,
    [],
    (err, users) => {

      if (err)
        return res.status(500).json({ message: "Server error" });

      res.status(200).json(users);
    }
  );
});

module.exports = router;