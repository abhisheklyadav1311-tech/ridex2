"use strict";
// db/init.js — Seeds admin + demo data, exports the store
const bcrypt = require("bcryptjs");
const { v4 }  = require("uuid");
const store   = require("./store");
const { now } = require("./store");

// ── Seed admin + demo user on first run ───────────────────────────────────────
if (store.data.users.length === 0) {
  const adminEmail = (process.env.ADMIN_EMAIL    || "admin@ridex.com").toLowerCase();
  const adminPass  =  process.env.ADMIN_PASSWORD || "Admin@2026";
  store.data.users.push({
    id: v4(), name: "Admin", email: adminEmail,
    phone: "+91 00000 00000",
    password: bcrypt.hashSync(adminPass, 10),
    role: "admin", wallet: 0, created_at: now(), updated_at: now(),
  });
  store.data.users.push({
    id: v4(), name: "Demo User", email: "user@ridex.com",
    phone: "+91 99999 00000",
    password: bcrypt.hashSync("User@2026", 10),
    role: "user", wallet: 100, created_at: now(), updated_at: now(),
  });
  store.save();
  console.log("✅ Admin account created:", adminEmail);
}

// ── Seed demo drivers if none exist ───────────────────────────────────────────
if (store.data.drivers.length === 0) {
  const drivers = [
    { name:"Rajan Sharma",  phone:"+91 98765 43210", car_model:"Honda City",    car_color:"White",  plate:"DL 3C AB 7654", ride_type:"sedan"   },
    { name:"Vikram Kumar",  phone:"+91 98765 43211", car_model:"Maruti Swift",   car_color:"Silver", plate:"DL 4D BC 8765", ride_type:"mini"    },
    { name:"Anil Mehta",    phone:"+91 98765 43212", car_model:"Toyota Innova",  car_color:"Grey",   plate:"DL 5E CD 9876", ride_type:"suv"     },
    { name:"Suresh Patel",  phone:"+91 98765 43213", car_model:"BMW 5 Series",   car_color:"Black",  plate:"DL 6F DE 0987", ride_type:"premium" },
    { name:"Deepak Singh",  phone:"+91 98765 43214", car_model:"Hyundai i20",    car_color:"Red",    plate:"DL 7G EF 1098", ride_type:"mini"    },
    { name:"Mohan Yadav",   phone:"+91 98765 43215", car_model:"Honda Amaze",    car_color:"White",  plate:"DL 8H FG 2109", ride_type:"sedan"   },
    { name:"Rahul Verma",   phone:"+91 98765 43216", car_model:"Mahindra XUV",   car_color:"Blue",   plate:"DL 9I GH 3210", ride_type:"suv"     },
    { name:"Sanjay Gupta",  phone:"+91 98765 43217", car_model:"Mercedes C-Class",car_color:"Black", plate:"DL 1J HI 4321", ride_type:"premium" },
  ];
  drivers.forEach(d => store.data.drivers.push({
    id: v4(), ...d, rating: +(4.5 + Math.random() * 0.49).toFixed(2),
    total_trips: Math.floor(100 + Math.random() * 3900),
    status: "available", lat: 28.6139, lng: 77.209, created_at: now(),
  }));
  store.save();
  console.log("✅ Demo drivers seeded");
}

module.exports = store;
