"use strict";
const router = require("express").Router();
const { v4 } = require("uuid");
const store  = require("../db/init");
const { now } = require("../db/store");
const { auth, optionalAuth } = require("../middleware/auth");
const { calculateFare, allEstimates } = require("../utils/fareCalculator");
const { getRoute, geocode } = require("../utils/mapsHelper");

// POST /api/rides/estimate
router.post("/estimate", optionalAuth, async (req, res) => {
  const { pickup, drop, rideType } = req.body;
  if (!pickup?.trim() || !drop?.trim())
    return res.status(400).json({ success:false, message:"Pickup and drop locations are required" });
  try {
    const route     = await getRoute(pickup.trim(), drop.trim());
    const estimates = allEstimates(route.distanceKm, route.durationMin);
    const eta = {};
    ["mini","sedan","suv","premium"].forEach(t => {
      const d = store.data.drivers.find(x => x.ride_type===t && x.status==="available");
      eta[t] = d ? Math.ceil(2 + Math.random()*6) : null;
    });
    res.json({ success:true, route, estimates, driverEta:eta, selected: (rideType||"sedan").toLowerCase() });
  } catch(e) {
    console.error("Estimate error:", e.message);
    res.status(500).json({ success:false, message:"Failed to estimate route. Please try again." });
  }
});

// POST /api/rides/book
router.post("/book", auth, async (req, res) => {
  const { pickup, drop, rideType, paymentMethod, scheduledAt } = req.body;
  if (!pickup?.trim() || !drop?.trim() || !rideType)
    return res.status(400).json({ success:false, message:"pickup, drop, and rideType are required" });
  try {
    const route  = await getRoute(pickup.trim(), drop.trim());
    const { fare, breakdown } = calculateFare(rideType, route.distanceKm, route.durationMin);
    const driver = store.data.drivers.find(d => d.ride_type===rideType.toLowerCase() && d.status==="available");
    if (!driver)
      return res.status(404).json({ success:false, message:"No drivers available right now. Please try again in a few minutes." });

    const rideId = v4();
    const ride = {
      id: rideId, user_id: req.user.id, driver_id: driver.id,
      pickup: pickup.trim(), drop_location: drop.trim(),
      ride_type: rideType.toLowerCase(), status: "confirmed",
      fare, base_fare: breakdown.baseFare,
      distance_charge: breakdown.distanceCharge,
      time_charge: breakdown.timeCharge,
      distance_km: route.distanceKm, duration_min: route.durationMin,
      payment_method: paymentMethod || "upi",
      payment_status: "pending",
      surge_multiplier: breakdown.surgeMultiplier,
      scheduled_at: scheduledAt || null,
      created_at: now(), confirmed_at: now(),
      started_at: null, completed_at: null,
      cancelled_by: null, cancel_reason: null,
    };
    store.data.rides.push(ride);
    store.data.payments.push({
      id: v4(), ride_id: rideId, user_id: req.user.id,
      amount: fare, method: paymentMethod||"upi", status:"pending", created_at: now(),
    });
    driver.status = "busy";
    store.save();

    res.json({
      success:true, message:"Ride confirmed! Your driver is on the way 🚗",
      ride: { id:rideId, status:"confirmed", pickup:pickup.trim(), drop:drop.trim(),
        rideType, fare, breakdown, distanceKm:route.distanceKm, durationMin:route.durationMin,
        distanceText:route.distanceText, durationText:route.durationText, paymentMethod:paymentMethod||"upi" },
      driver: { id:driver.id, name:driver.name, rating:driver.rating, trips:driver.total_trips,
        car:`${driver.car_model} — ${driver.car_color}`, plate:driver.plate, phone:driver.phone, etaMin:4 },
    });
  } catch(e) {
    console.error("Booking error:", e.message);
    res.status(500).json({ success:false, message:"Booking failed. Please try again." });
  }
});

// GET /api/rides/history
router.get("/history", auth, (req, res) => {
  const { status } = req.query;
  let rides = store.data.rides.filter(r => r.user_id === req.user.id);
  if (status) rides = rides.filter(r => r.status === status);
  rides.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  res.json({ success:true, rides: rides.map(r => {
    const driver = store.data.drivers.find(d => d.id === r.driver_id);
    const rating = store.data.ratings.find(x => x.ride_id === r.id);
    return {
      id: r.id, from: r.pickup, to: r.drop_location,
      date: new Date(r.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}),
      amount: r.fare, status: r.status,
      driver: driver?.name || "—", car: driver?.car_model, plate: driver?.plate,
      rating: rating?.stars || null, rideType: r.ride_type,
      distanceKm: r.distance_km, durationMin: r.duration_min,
      paymentMethod: r.payment_method, surge: r.surge_multiplier > 1,
    };
  }), pagination: { total: rides.length } });
});

// GET /api/rides/active
router.get("/active", auth, (req, res) => {
  const ride = store.data.rides
    .filter(r => r.user_id===req.user.id && ["confirmed","started"].includes(r.status))
    .sort((a,b) => new Date(b.created_at)-new Date(a.created_at))[0];
  if (!ride) return res.json({ success:true, ride:null, driver:null });
  const driver = store.data.drivers.find(d => d.id===ride.driver_id);
  res.json({ success:true,
    ride: { id:ride.id, status:ride.status, pickup:ride.pickup, drop:ride.drop_location, fare:ride.fare, rideType:ride.ride_type },
    driver: driver ? { name:driver.name, rating:driver.rating, trips:driver.total_trips,
      car:`${driver.car_model} — ${driver.car_color}`, plate:driver.plate, phone:driver.phone } : null,
  });
});

// GET /api/rides/:id
router.get("/:id", auth, (req, res) => {
  const ride = store.data.rides.find(r => r.id===req.params.id && r.user_id===req.user.id);
  if (!ride) return res.status(404).json({ success:false, message:"Ride not found" });
  res.json({ success:true, ride });
});

// PATCH /api/rides/:id/cancel
router.patch("/:id/cancel", auth, (req, res) => {
  const ride = store.data.rides.find(r => r.id===req.params.id && r.user_id===req.user.id);
  if (!ride) return res.status(404).json({ success:false, message:"Ride not found" });
  if (["completed","cancelled"].includes(ride.status))
    return res.status(400).json({ success:false, message:`Ride is already ${ride.status}` });

  const elapsed   = (Date.now() - new Date(ride.created_at).getTime()) / 60000;
  const freeWin   = store.getSetting("free_cancel_minutes", 2);
  const cancelFee = elapsed > freeWin ? store.getSetting("cancellation_fee", 30) : 0;

  ride.status = "cancelled";
  ride.cancelled_by = "user";
  ride.cancel_reason = req.body.reason || "Cancelled by user";
  const driver = store.data.drivers.find(d => d.id===ride.driver_id);
  if (driver) driver.status = "available";
  const payment = store.data.payments.find(p => p.ride_id===ride.id);
  if (payment) payment.status = "refunded";
  store.save();

  res.json({ success:true, message: cancelFee>0
    ? `Ride cancelled. Cancellation fee: ₹${cancelFee}`
    : "Ride cancelled (no charge)", cancellationFee: cancelFee });
});

// POST /api/rides/:id/rate
router.post("/:id/rate", auth, (req, res) => {
  const { stars, comment } = req.body;
  if (!stars || stars<1 || stars>5)
    return res.status(400).json({ success:false, message:"Rating must be 1-5" });
  const ride = store.data.rides.find(r => r.id===req.params.id && r.user_id===req.user.id);
  if (!ride) return res.status(404).json({ success:false, message:"Ride not found" });
  if (ride.status !== "completed")
    return res.status(400).json({ success:false, message:"Can only rate completed rides" });

  const existing = store.data.ratings.findIndex(r => r.ride_id===ride.id);
  const rating = { id:v4(), ride_id:ride.id, user_id:req.user.id, driver_id:ride.driver_id, stars:parseInt(stars), comment:comment||null, created_at:now() };
  if (existing >= 0) store.data.ratings[existing] = rating;
  else store.data.ratings.push(rating);

  const driver = store.data.drivers.find(d => d.id===ride.driver_id);
  if (driver) {
    const dRatings = store.data.ratings.filter(r => r.driver_id===driver.id);
    driver.rating = parseFloat((dRatings.reduce((s,r)=>s+r.stars,0)/dRatings.length).toFixed(2));
  }
  store.save();
  res.json({ success:true, message:"Thank you for your rating! ⭐" });
});

// PATCH /api/rides/:id/complete
router.patch("/:id/complete", auth, (req, res) => {
  const ride = store.data.rides.find(r => r.id===req.params.id && r.user_id===req.user.id);
  if (!ride) return res.status(404).json({ success:false, message:"Ride not found" });
  ride.status = "completed"; ride.completed_at = now();
  const payment = store.data.payments.find(p => p.ride_id===ride.id);
  if (payment) payment.status = "success";
  const driver = store.data.drivers.find(d => d.id===ride.driver_id);
  if (driver) { driver.status = "available"; driver.total_trips++; }
  const user = store.data.users.find(u => u.id===req.user.id);
  if (user) { user.total_rides = (user.total_rides||0)+1; user.total_spent = (user.total_spent||0)+ride.fare; }
  store.save();
  res.json({ success:true, message:"Ride completed! Please rate your driver." });
});

module.exports = router;
