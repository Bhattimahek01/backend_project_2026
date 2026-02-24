const express = require("express");
const db = require("../db");
const { authenticate } = require("../middleware");

const router = express.Router();

// Create a ticket
router.post("/", authenticate, (req, res) => {
  try {
    if (![1, 3].includes(req.user.role_id))
      return res.status(403).json({ message: "Access denied" });

    const { title, description, priority } = req.body;

    if (!title || !description || !priority)
      return res.status(400).json({ message: "Title, description, and priority are required" });

    // Validate priority
    const validPriorities = ["LOW", "MEDIUM", "HIGH"];
    if (!validPriorities.includes(priority))
      return res.status(400).json({ message: `Priority must be one of ${validPriorities.join(", ")}` });

    db.run(
      `INSERT INTO tickets (title, description, priority, created_by) VALUES (?, ?, ?, ?)`,
      [title, description, priority, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ message: "Database error", error: err.message });

        res.status(201).json({
          message: "Ticket created",
          ticket_id: this.lastID
        });
      }
    );
  } catch (error) {
    console.error("POST /tickets error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get tickets
router.get("/", authenticate, (req, res) => {
  try {
    let query = "";
    let params = [];

    if (req.user.role_id === 1) {
      // Manager: all tickets
      query = "SELECT * FROM tickets";
    } else if (req.user.role_id === 2) {
      // Support: tickets assigned to them
      query = "SELECT * FROM tickets WHERE assigned_to=?";
      params = [req.user.id];
    } else {
      // User: tickets they created
      query = "SELECT * FROM tickets WHERE created_by=?";
      params = [req.user.id];
    }

    db.all(query, params, (err, rows) => {
      if (err) return res.status(500).json({ message: "Database error", error: err.message });
      res.json(rows);
    });
  } catch (error) {
    console.error("GET /tickets error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Assign ticket
router.patch("/:id/assign", authenticate, (req, res) => {
  try {
    if (![1, 2].includes(req.user.role_id))
      return res.status(403).json({ message: "Access denied" });

    const { assigned_to } = req.body;
    if (!assigned_to) return res.status(400).json({ message: "assigned_to is required" });

    db.run(
      `UPDATE tickets SET assigned_to=? WHERE id=?`,
      [assigned_to, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ message: "Database error", error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Ticket not found" });

        res.json({ message: "Ticket assigned" });
      }
    );
  } catch (error) {
    console.error("PATCH /tickets/:id/assign error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update ticket status
router.patch("/:id/status", authenticate, (req, res) => {
  try {
    if (![1, 2].includes(req.user.role_id))
      return res.status(403).json({ message: "Access denied" });

    const { status } = req.body;
    const validStatus = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (!validStatus.includes(status))
      return res.status(400).json({ message: `Status must be one of ${validStatus.join(", ")}` });

    db.get(`SELECT status FROM tickets WHERE id=?`, [req.params.id], (err, ticket) => {
      if (err) return res.status(500).json({ message: "Database error", error: err.message });
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });

      db.run(
        `UPDATE tickets SET status=? WHERE id=?`,
        [status, req.params.id],
        function (err) {
          if (err) return res.status(500).json({ message: "Database error", error: err.message });

          db.run(
            `INSERT INTO ticket_status_logs (ticket_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)`,
            [req.params.id, ticket.status, status, req.user.id]
          );

          res.json({ message: "Status updated" });
        }
      );
    });
  } catch (error) {
    console.error("PATCH /tickets/:id/status error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete ticket
router.delete("/:id", authenticate, (req, res) => {
  try {
    if (req.user.role_id !== 1)
      return res.status(403).json({ message: "Only manager can delete" });

    db.run(`DELETE FROM tickets WHERE id=?`, [req.params.id], function (err) {
      if (err) return res.status(500).json({ message: "Database error", error: err.message });
      if (this.changes === 0) return res.status(404).json({ message: "Ticket not found" });

      res.json({ message: "Ticket deleted" });
    });
  } catch (error) {
    console.error("DELETE /tickets/:id error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;