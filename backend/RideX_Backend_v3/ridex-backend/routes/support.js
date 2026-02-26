"use strict";
const router = require("express").Router();
const { v4 } = require("uuid");
const store  = require("../db/init");
const { now } = require("../db/store");
const { auth, optionalAuth, adminOnly } = require("../middleware/auth");

router.post("/ticket", optionalAuth, (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!subject?.trim() || !message?.trim())
    return res.status(400).json({ success:false, message:"Subject and message are required" });
  const ticket = {
    id: v4(), user_id: req.user?.id || null,
    name: name || req.user?.name || "Guest",
    email: email || req.user?.email || null,
    subject: subject.trim(), message: message.trim(),
    status: "open", reply: null, created_at: now(), updated_at: now(),
  };
  store.data.support_tickets.push(ticket);
  store.save();
  res.json({ success:true, message:"Message received! We'll reply within 24 hours. 📬", ticketId: ticket.id });
});

router.get("/tickets", auth, adminOnly, (req, res) => {
  const { status } = req.query;
  let tickets = [...store.data.support_tickets];
  if (status) tickets = tickets.filter(t => t.status===status);
  tickets.sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
  res.json({ success:true, tickets });
});

router.patch("/tickets/:id/reply", auth, adminOnly, (req, res) => {
  const { reply } = req.body;
  if (!reply?.trim()) return res.status(400).json({ success:false, message:"Reply text required" });
  const ticket = store.data.support_tickets.find(t => t.id===req.params.id);
  if (!ticket) return res.status(404).json({ success:false, message:"Ticket not found" });
  ticket.reply = reply.trim(); ticket.status = "resolved"; ticket.updated_at = now();
  store.save();
  res.json({ success:true, message:"Reply sent" });
});

module.exports = router;
