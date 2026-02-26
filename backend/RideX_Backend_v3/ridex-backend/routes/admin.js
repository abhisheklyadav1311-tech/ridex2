"use strict";
const router = require("express").Router();
const { v4 } = require("uuid");
const store  = require("../db/init");
const { now } = require("../db/store");
const { auth, adminOnly } = require("../middleware/auth");

router.use(auth, adminOnly);

// GET /api/admin/dashboard
router.get("/dashboard", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const completedPayments = store.data.payments.filter(p => p.status==="success");
  const todayRides = store.data.rides.filter(r => r.created_at.startsWith(today));

  res.json({ success:true, stats: {
    totalUsers:     store.data.users.filter(u => u.role==="user").length,
    totalDrivers:   store.data.drivers.length,
    activeDrivers:  store.data.drivers.filter(d => d.status==="available").length,
    busyDrivers:    store.data.drivers.filter(d => d.status==="busy").length,
    totalRides:     store.data.rides.length,
    todayRides:     todayRides.length,
    activeRides:    store.data.rides.filter(r => ["confirmed","started"].includes(r.status)).length,
    completedRides: store.data.rides.filter(r => r.status==="completed").length,
    cancelledRides: store.data.rides.filter(r => r.status==="cancelled").length,
    totalRevenue:   completedPayments.reduce((s,p)=>s+p.amount,0),
    todayRevenue:   completedPayments.filter(p=>p.created_at.startsWith(today)).reduce((s,p)=>s+p.amount,0),
    openTickets:    store.data.support_tickets.filter(t=>t.status==="open").length,
  },
  recentRides: store.data.rides
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,10)
    .map(r => {
      const user   = store.data.users.find(u=>u.id===r.user_id);
      const driver = store.data.drivers.find(d=>d.id===r.driver_id);
      return { ...r, user_name:user?.name, driver_name:driver?.name, plate:driver?.plate };
    }),
  });
});

// GET /api/admin/settings
router.get("/settings", (req, res) => {
  res.json({ success:true, settings: store.allSettings() });
});

// PUT /api/admin/settings
router.put("/settings", (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates!=="object" || !Object.keys(updates).length)
    return res.status(400).json({ success:false, message:"Provide settings as { key: value }" });
  store.setSettings(updates);
  res.json({ success:true, message:`${Object.keys(updates).length} setting(s) updated` });
});

// GET /api/admin/rides
router.get("/rides", (req, res) => {
  const { status, search } = req.query;
  let rides = [...store.data.rides];
  if (status) rides = rides.filter(r => r.status===status);
  if (search) {
    const s = search.toLowerCase();
    rides = rides.filter(r => {
      const user = store.data.users.find(u=>u.id===r.user_id);
      return r.pickup?.toLowerCase().includes(s) ||
             r.drop_location?.toLowerCase().includes(s) ||
             user?.name?.toLowerCase().includes(s);
    });
  }
  rides.sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
  res.json({ success:true, rides: rides.map(r => {
    const user   = store.data.users.find(u=>u.id===r.user_id);
    const driver = store.data.drivers.find(d=>d.id===r.driver_id);
    return { ...r, user_name:user?.name, user_email:user?.email, driver_name:driver?.name, plate:driver?.plate };
  })});
});

// PATCH /api/admin/rides/:id
router.patch("/rides/:id", (req, res) => {
  const { status } = req.body;
  const valid = ["confirmed","started","completed","cancelled"];
  if (!valid.includes(status)) return res.status(400).json({ success:false, message:"Invalid status" });
  const ride = store.data.rides.find(r => r.id===req.params.id);
  if (!ride) return res.status(404).json({ success:false, message:"Ride not found" });
  ride.status = status;
  if (status==="completed") {
    ride.completed_at = now();
    const payment = store.data.payments.find(p=>p.ride_id===ride.id);
    if (payment) payment.status = "success";
    const driver = store.data.drivers.find(d=>d.id===ride.driver_id);
    if (driver) { driver.status="available"; driver.total_trips++; }
  }
  if (status==="cancelled") {
    ride.cancelled_by = "admin";
    const driver = store.data.drivers.find(d=>d.id===ride.driver_id);
    if (driver) driver.status = "available";
  }
  store.save();
  res.json({ success:true, message:`Ride status → ${status}` });
});

// GET /api/admin/users
router.get("/users", (req, res) => {
  const users = store.data.users.filter(u=>u.role==="user").map(u => {
    const { password:_, ...safe } = u;
    const userRides = store.data.rides.filter(r=>r.user_id===u.id);
    const spent = store.data.payments.filter(p=>p.user_id===u.id&&p.status==="success").reduce((s,p)=>s+p.amount,0);
    return { ...safe, total_rides: userRides.length, total_spent: spent };
  });
  res.json({ success:true, users });
});

// GET /api/admin/drivers
router.get("/drivers", (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const drivers = store.data.drivers.map(d => ({
    ...d,
    rides_today: store.data.rides.filter(r=>r.driver_id===d.id && r.created_at.startsWith(today)).length,
  }));
  res.json({ success:true, drivers });
});

// POST /api/admin/drivers
router.post("/drivers", (req, res) => {
  const { name, phone, car_model, car_color, plate, ride_type } = req.body;
  if (!name||!phone||!car_model||!plate||!ride_type)
    return res.status(400).json({ success:false, message:"All fields required: name, phone, car_model, plate, ride_type" });
  if (!["mini","sedan","suv","premium"].includes(ride_type.toLowerCase()))
    return res.status(400).json({ success:false, message:"ride_type must be: mini, sedan, suv, or premium" });
  if (store.data.drivers.find(d=>d.plate===plate.toUpperCase()))
    return res.status(409).json({ success:false, message:"Plate number already exists" });

  const driver = { id:v4(), name:name.trim(), phone:phone.trim(), car_model:car_model.trim(),
    car_color:car_color||"White", plate:plate.trim().toUpperCase(), ride_type:ride_type.toLowerCase(),
    rating:5.0, total_trips:0, status:"available", lat:28.6139, lng:77.209, created_at:now() };
  store.data.drivers.push(driver);
  store.save();
  res.status(201).json({ success:true, message:"Driver added successfully", id:driver.id });
});

// PATCH /api/admin/drivers/:id
router.patch("/drivers/:id", (req, res) => {
  const driver = store.data.drivers.find(d=>d.id===req.params.id);
  if (!driver) return res.status(404).json({ success:false, message:"Driver not found" });
  const { name, phone, car_model, car_color, plate, ride_type, status } = req.body;
  if (name)      driver.name      = name.trim();
  if (phone)     driver.phone     = phone.trim();
  if (car_model) driver.car_model = car_model.trim();
  if (car_color) driver.car_color = car_color.trim();
  if (plate)     driver.plate     = plate.trim().toUpperCase();
  if (ride_type) driver.ride_type = ride_type.toLowerCase();
  if (status)    driver.status    = status;
  store.save();
  res.json({ success:true, message:"Driver updated" });
});

// DELETE /api/admin/drivers/:id
router.delete("/drivers/:id", (req, res) => {
  const idx = store.data.drivers.findIndex(d=>d.id===req.params.id);
  if (idx===-1) return res.status(404).json({ success:false, message:"Driver not found" });
  store.data.drivers.splice(idx,1);
  store.save();
  res.json({ success:true, message:"Driver removed" });
});

// GET /api/admin/tickets
router.get("/tickets", (req, res) => {
  const tickets = [...store.data.support_tickets]
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  res.json({ success:true, tickets });
});

// PATCH /api/admin/tickets/:id
router.patch("/tickets/:id", (req, res) => {
  const ticket = store.data.support_tickets.find(t=>t.id===req.params.id);
  if (!ticket) return res.status(404).json({ success:false, message:"Ticket not found" });
  const { reply, status } = req.body;
  if (reply)  ticket.reply  = reply;
  if (status) ticket.status = status;
  ticket.updated_at = now();
  store.save();
  res.json({ success:true, message:"Ticket updated" });
});

// GET /api/admin/analytics
router.get("/analytics", (req, res) => {
  const last7 = {};
  for (let i=6; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const dateStr = d.toISOString().split("T")[0];
    const dayRides = store.data.rides.filter(r=>r.created_at.startsWith(dateStr));
    last7[dateStr] = { date:dateStr, rides:dayRides.length, revenue: dayRides.filter(r=>r.status==="completed").reduce((s,r)=>s+(r.fare||0),0) };
  }
  const byType = {};
  ["mini","sedan","suv","premium"].forEach(t => {
    const tr = store.data.rides.filter(r=>r.ride_type===t&&r.status==="completed");
    byType[t] = { ride_type:t, count:tr.length, revenue:tr.reduce((s,r)=>s+(r.fare||0),0), avg_fare: tr.length ? +(tr.reduce((s,r)=>s+(r.fare||0),0)/tr.length).toFixed(0) : 0 };
  });
  res.json({ success:true, last7Days:Object.values(last7), byRideType:Object.values(byType) });
});

module.exports = router;
