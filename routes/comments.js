
const express = require("express");
const db = require("../db");
const { authenticate } = require("../middleware");

const router = express.Router();
////this is the comments section ///////////////////////////////////////
// add comments 
router.post("/:id/comments", authenticate, (req, res) => {

  const { comment } = req.body;

  db.get(`SELECT * FROM tickets WHERE id=?`,
    [req.params.id],
    (err, ticket) => {

      if (!ticket)
        return res.status(404).json({ message: "Ticket not found" });
      if (
        req.user.role_id === 1 ||
        (req.user.role_id === 2 && ticket.assigned_to === req.user.id) ||
        (req.user.role_id === 3 && ticket.created_by === req.user.id)
      ) {

        db.run(
          `INSERT INTO ticket_comments (ticket_id, user_id, comment)
           VALUES (?, ?, ?)`,
          [req.params.id, req.user.id, comment],
          function () {
            res.status(201).json({ message: "Comment added" });
          }
        );

      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }
  );
});
//get comments
router.get("/:id/comments", authenticate, (req, res) => {

  db.get(`SELECT * FROM tickets WHERE id=?`,
    [req.params.id],
    (err, ticket) => {

      if (!ticket)
        return res.status(404).json({ message: "Ticket not found" });

      if (
        req.user.role_id === 1 ||
        (req.user.role_id === 2 && ticket.assigned_to === req.user.id) ||
        (req.user.role_id === 3 && ticket.created_by === req.user.id)
      ) {

        db.all(
          `SELECT * FROM ticket_comments WHERE ticket_id=?`,
          [req.params.id],
          (err, rows) => {
            res.json(rows);
          }
        );

      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }
  );
});
//this is the updated comments
router.patch("/comments/:id", authenticate, (req, res) => {

  const { comment } = req.body;

  db.get(
    `SELECT * FROM ticket_comments WHERE id=?`,
    [req.params.id],
    (err, existingComment) => {

      if (!existingComment)
        return res.status(404).json({ message: "Comment not found" });
      if (
        req.user.role_id === 1 ||
        existingComment.user_id === req.user.id
      ) {

        db.run(
          `UPDATE ticket_comments SET comment=? WHERE id=?`,
          [comment, req.params.id],
          function () {
            res.json({ message: "Comment updated" });
          }
        );

      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }
  );
});
//to delete the comments
router.delete("/comments/:id", authenticate, (req, res) => {

  db.get(
    `SELECT * FROM ticket_comments WHERE id=?`,
    [req.params.id],
    (err, existingComment) => {

      if (!existingComment)
        return res.status(404).json({ message: "Comment not found" });
      if (
        req.user.role_id === 1 ||
        existingComment.user_id === req.user.id
      ) {

        db.run(
          `DELETE FROM ticket_comments WHERE id=?`,
          [req.params.id],
          function () {
            res.json({ message: "Comment deleted" });
          }
        );

      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }
  );
});
module.exports=router;