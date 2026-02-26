"use strict";
// db/store.js — Pure JavaScript JSON database (no native modules needed!)
const fs   = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../ridex-data.json");

const EMPTY = {
  users: [], drivers: [], rides: [],
  payments: [], ratings: [], support_tickets: [], settings: []
};

class Store {
  constructor() {
    this._load();
    if (this.data.settings.length === 0) this._seedSettings();
  }

  _load() {
    try { this.data = JSON.parse(fs.readFileSync(FILE, "utf8")); }
    catch { this.data = JSON.parse(JSON.stringify(EMPTY)); }
    // ensure all collections exist
    for (const k of Object.keys(EMPTY)) {
      if (!this.data[k]) this.data[k] = [];
    }
  }

  save() {
    fs.writeFileSync(FILE, JSON.stringify(this.data, null, 2));
  }

  _seedSettings() {
    const defaults = [
      { key:"mini_base_fare",          value:"80",   label:"Mini Base Fare (₹)"          },
      { key:"mini_per_km",             value:"10",   label:"Mini Per KM (₹)"             },
      { key:"mini_per_min",            value:"1",    label:"Mini Per Minute (₹)"          },
      { key:"sedan_base_fare",         value:"120",  label:"Sedan Base Fare (₹)"          },
      { key:"sedan_per_km",            value:"14",   label:"Sedan Per KM (₹)"             },
      { key:"sedan_per_min",           value:"2",    label:"Sedan Per Minute (₹)"         },
      { key:"suv_base_fare",           value:"180",  label:"SUV Base Fare (₹)"            },
      { key:"suv_per_km",              value:"20",   label:"SUV Per KM (₹)"               },
      { key:"suv_per_min",             value:"2.5",  label:"SUV Per Minute (₹)"           },
      { key:"premium_base_fare",       value:"280",  label:"Premium Base Fare (₹)"        },
      { key:"premium_per_km",          value:"30",   label:"Premium Per KM (₹)"           },
      { key:"premium_per_min",         value:"4",    label:"Premium Per Minute (₹)"       },
      { key:"surge_peak_multiplier",   value:"1.5",  label:"Peak Hours Surge Multiplier"  },
      { key:"surge_night_multiplier",  value:"1.2",  label:"Night Surge Multiplier"       },
      { key:"peak_hours",              value:"8-10,17-20", label:"Peak Hours (e.g. 8-10,17-20)" },
      { key:"gst_percent",             value:"5",    label:"GST Percent (%)"              },
      { key:"min_fare",                value:"50",   label:"Minimum Fare (₹)"             },
      { key:"cancellation_fee",        value:"30",   label:"Cancellation Fee (₹)"         },
      { key:"free_cancel_minutes",     value:"2",    label:"Free Cancellation Window (min)"},
    ];
    defaults.forEach(s => this.data.settings.push({ ...s, updated_at: now() }));
    this.save();
  }

  // ── Settings helpers ───────────────────────────────────────────────────────
  getSetting(key, fallback = null) {
    const s = this.data.settings.find(x => x.key === key);
    return s ? parseFloat(s.value) : fallback;
  }
  getSettingStr(key, fallback = "") {
    const s = this.data.settings.find(x => x.key === key);
    return s ? s.value : fallback;
  }
  setSetting(key, value) {
    const s = this.data.settings.find(x => x.key === key);
    if (s) { s.value = String(value); s.updated_at = now(); }
    else this.data.settings.push({ key, value: String(value), label: key, updated_at: now() });
    this.save();
  }
  setSettings(obj) {
    Object.entries(obj).forEach(([k, v]) => {
      const s = this.data.settings.find(x => x.key === k);
      if (s) { s.value = String(v); s.updated_at = now(); }
      else this.data.settings.push({ key: k, value: String(v), label: k, updated_at: now() });
    });
    this.save();
  }
  allSettings() {
    const out = {};
    this.data.settings.forEach(s => { out[s.key] = { value: s.value, label: s.label, updated_at: s.updated_at }; });
    return out;
  }
}

function now() { return new Date().toISOString(); }

module.exports = new Store();
module.exports.now = now;
