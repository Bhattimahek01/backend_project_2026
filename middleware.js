const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Token required" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};
exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: "Access denied" });
    next();
  };
};
