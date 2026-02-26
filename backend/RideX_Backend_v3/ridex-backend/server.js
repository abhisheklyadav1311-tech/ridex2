"use strict";
require("dotenv").config();

const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const morgan    = require("morgan");
const rateLimit = require("express-rate-limit");

// Init store (creates data file + seeds on first run)
require("./db/init");

const app  = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "http://localhost:4173",
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

app.use(helmet({ crossOriginResourcePolicy:{ policy:"cross-origin" } }));
app.use(rateLimit({ windowMs:15*60*1000, max:300 }));
app.use(express.json({ limit:"10mb" }));
app.use(express.urlencoded({ extended:true }));
app.use(morgan(process.env.NODE_ENV==="production" ? "combined" : "dev"));

app.use("/api/auth",    require("./routes/auth"));
app.use("/api/rides",   require("./routes/rides"));
app.use("/api/support", require("./routes/support"));
app.use("/api/admin",   require("./routes/admin"));

app.get("/api/health", (req, res) => {
  const store = require("./db/init");
  res.json({ success:true, status:"🚗 RideX API running", version:"3.0.0",
    time: new Date().toISOString(),
    database: { users:store.data.users.length, drivers:store.data.drivers.length, rides:store.data.rides.length },
    googleMaps: (process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY!=="your_google_maps_api_key_here")
      ? "✅ Connected" : "⚠️  Smart estimation mode (works fine)",
  });
});

app.get("/", (req, res) => res.json({ message:"🚗 RideX Backend API v3", health:"/api/health" }));
app.use((req, res) => res.status(404).json({ success:false, message:`${req.method} ${req.path} not found` }));
app.use((err, req, res, _next) => { console.error("❌",err.message); res.status(err.status||500).json({ success:false, message:err.message }); });

app.listen(PORT, () => {
  console.log("\n🚗 ════════════════════════════════════");
  console.log(`   RideX API  →  http://localhost:${PORT}`);
  console.log(`   Health     →  http://localhost:${PORT}/api/health`);
  console.log("════════════════════════════════════\n");
});

module.exports = app;
