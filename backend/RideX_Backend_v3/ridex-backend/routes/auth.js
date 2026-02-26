"use strict";
const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { v4 }  = require("uuid");
const store   = require("../db/init");
const { auth } = require("../middleware/auth");
const { now } = require("../db/store");

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// POST /api/auth/signup
router.post("/signup", (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password)
    return res.status(400).json({ success:false, message:"Name, email and password are required" });
  if (password.length < 6)
    return res.status(400).json({ success:false, message:"Password must be at least 6 characters" });
  if (store.data.users.find(u => u.email === email.toLowerCase().trim()))
    return res.status(409).json({ success:false, message:"Email already registered. Please sign in." });

  const user = {
    id: v4(), name: name.trim(), email: email.toLowerCase().trim(),
    phone: phone?.trim() || null, password: bcrypt.hashSync(password, 10),
    role: "user", wallet: 0, created_at: now(), updated_at: now(),
  };
  store.data.users.push(user);
  store.save();

  const { password: _, ...safe } = user;
  res.status(201).json({ success:true, message:"Account created! Welcome to RideX 🚗", token: sign(user.id), user: safe });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ success:false, message:"Email and password required" });

  const user = store.data.users.find(u => u.email === email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ success:false, message:"Invalid email or password" });

  user.last_login = now();
  store.save();
  const { password: _, ...safe } = user;
  res.json({ success:true, message:"Welcome back!", token: sign(user.id), user: safe });
});

// GET /api/auth/me
router.get("/me", auth, (req, res) => {
  const { password: _, ...safe } = req.user;
  res.json({ success:true, user: safe });
});

// PUT /api/auth/profile
router.put("/profile", auth, (req, res) => {
  const { name, phone } = req.body;
  const user = store.data.users.find(u => u.id === req.user.id);
  if (name)  user.name  = name.trim();
  if (phone) user.phone = phone.trim();
  user.updated_at = now();
  store.save();
  const { password: _, ...safe } = user;
  res.json({ success:true, message:"Profile updated", user: safe });
});

module.exports = router;
