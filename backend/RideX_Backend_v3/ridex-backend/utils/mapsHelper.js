"use strict";
const https = require("https");

const KEY    = () => process.env.GOOGLE_MAPS_API_KEY;
const hasKey = () => KEY() && KEY() !== "your_google_maps_api_key_here" && KEY().length > 10;

// Smart mock: same city pair always gives same distance
const mockDistance = (origin, destination) => {
  const hash = [...`${origin}${destination}`].reduce((a,c) => a + c.charCodeAt(0), 0);
  const km   = parseFloat((4 + (hash % 26)).toFixed(1));
  const min  = Math.ceil(km * 3.2 + 5);
  return {
    distanceKm: km, durationMin: min,
    distanceText: `${km} km`, durationText: `${min} mins`,
    source: "estimated", note: "Add GOOGLE_MAPS_API_KEY in .env for real GPS distances",
  };
};

// Google Maps Distance Matrix (only if API key is set)
const googleDistance = (origin, destination) => new Promise((resolve, reject) => {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&units=metric&key=${KEY()}`;
  https.get(url, res => {
    let body = "";
    res.on("data", d => body += d);
    res.on("end", () => {
      try {
        const data = JSON.parse(body);
        if (data.status !== "OK") return reject(new Error(data.status));
        const el = data.rows[0]?.elements[0];
        if (!el || el.status !== "OK") return reject(new Error(el?.status));
        resolve({
          distanceKm:   parseFloat((el.distance.value / 1000).toFixed(1)),
          durationMin:  Math.ceil(el.duration.value / 60),
          distanceText: el.distance.text,
          durationText: el.duration.text,
          source: "google",
        });
      } catch(e) { reject(e); }
    });
  }).on("error", reject);
});

const getRoute = async (origin, destination) => {
  if (hasKey()) {
    try { return await googleDistance(origin, destination); }
    catch(e) { console.warn("Google Maps fallback:", e.message); }
  }
  return mockDistance(origin, destination);
};

const geocode = async () => ({ lat: 28.6139 + Math.random()*0.05, lng: 77.209 + Math.random()*0.05 });
const driverETA = async () => Math.ceil(2 + Math.random() * 6);

module.exports = { getRoute, geocode, driverETA };
