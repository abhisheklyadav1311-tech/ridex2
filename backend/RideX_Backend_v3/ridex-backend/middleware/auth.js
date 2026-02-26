"use strict";
const jwt   = require("jsonwebtoken");
const store = require("../db/init");

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res.status(401).json({ success:false, message:"Authentication required" });
  try {
    const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user    = store.data.users.find(u => u.id === payload.id);
    if (!user) return res.status(401).json({ success:false, message:"User not found" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success:false, message:"Invalid or expired token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ success:false, message:"Admin access required" });
  next();
};

const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
      req.user = store.data.users.find(u => u.id === payload.id) || null;
    } catch {}
  }
  next();
};

module.exports = { auth, adminOnly, optionalAuth };
