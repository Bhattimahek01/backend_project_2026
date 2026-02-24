const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");
require("dotenv").config();

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    // Trim spaces and convert to lowercase to match DB
    email = email.trim().toLowerCase();

    db.get(
      `SELECT * FROM users WHERE LOWER(email)=?`,
      [email],
      async (err, user) => {
        if (err) {
          console.error("DB error:", err);
          return res.status(500).json({ message: "Server error" });
        }

        if (!user) {
          console.log("User not found for email:", email);
          return res.status(404).json({ message: "User not found" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign(
          {
            id: user.id,
            role_id: user.role_id,
          },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Login successful", token });
      }
    );
  } catch (error) {
    console.error("Login route error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;