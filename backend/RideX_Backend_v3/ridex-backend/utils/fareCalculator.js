"use strict";
const store = require("../db/init");

const isPeak = () => {
  const hour   = new Date().getHours();
  const ranges = store.getSettingStr("peak_hours","8-10,17-20")
    .split(",").map(r => r.trim().split("-").map(Number));
  return ranges.some(([s,e]) => hour >= s && hour <= e);
};
const isNight = () => { const h = new Date().getHours(); return h >= 22 || h < 6; };

const calculateFare = (rideType, distanceKm, durationMin) => {
  const t = rideType.toLowerCase();
  const baseFare = store.getSetting(`${t}_base_fare`, 80);
  const perKm    = store.getSetting(`${t}_per_km`,    10);
  const perMin   = store.getSetting(`${t}_per_min`,    2);
  const minFare  = store.getSetting("min_fare",       50);
  const gst      = store.getSetting("gst_percent",     5);

  const distCharge = parseFloat((distanceKm * perKm).toFixed(2));
  const timeCharge = parseFloat((durationMin * perMin).toFixed(2));
  let   subTotal   = baseFare + distCharge + timeCharge;

  let surgeMultiplier = 1.0, surgeLabel = "Standard";
  if (isPeak()) {
    surgeMultiplier = store.getSetting("surge_peak_multiplier", 1.5);
    surgeLabel = "Peak Hours";
  } else if (isNight()) {
    surgeMultiplier = store.getSetting("surge_night_multiplier", 1.2);
    surgeLabel = "Night Surge";
  }

  subTotal = subTotal * surgeMultiplier;
  const gstAmount = parseFloat(((subTotal * gst) / 100).toFixed(2));
  let fare = Math.max(Math.round(subTotal + gstAmount), minFare);

  return {
    fare,
    breakdown: {
      baseFare, distanceCharge: Math.round(distCharge),
      timeCharge: Math.round(timeCharge),
      surgeMultiplier, surgeLabel, surgeApplied: surgeMultiplier > 1.0,
      gstAmount: Math.round(gstAmount), gstPercent: gst, total: fare,
    },
  };
};

const allEstimates = (distanceKm, durationMin) => {
  const out = {};
  ["mini","sedan","suv","premium"].forEach(t => { out[t] = calculateFare(t, distanceKm, durationMin); });
  return out;
};

module.exports = { calculateFare, allEstimates };
