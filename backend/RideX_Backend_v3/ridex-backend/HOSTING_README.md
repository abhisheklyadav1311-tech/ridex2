# 🚗 RideX — Complete Setup & Hosting Guide

> Your full-stack cab booking app. Backend + Frontend + Live hosting in ~20 minutes.

---

## 📁 What You Have

```
ridex-backend/          ← Node.js API (this folder)
├── server.js           ← Express server (entry point)
├── db/init.js          ← SQLite DB (auto-creates tables + seeds data)
├── routes/
│   ├── auth.js         ← Login / Signup / Profile
│   ├── rides.js        ← Estimate, Book, History, Cancel, Rate
│   ├── support.js      ← Support tickets
│   └── admin.js        ← Full admin control panel
├── utils/
│   ├── fareCalculator.js  ← Dynamic pricing (reads from DB)
│   └── mapsHelper.js      ← Route estimation (Google Maps or smart mock)
├── middleware/auth.js  ← JWT authentication
├── .env.example        ← Copy to .env and fill values
└── package.json

your-react-app/src/
└── App.jsx             ← The connected frontend (replace with new file)
```

---

## 🖥️ Run Locally (5 minutes)

### Step 1 — Start the Backend

```bash
cd ridex-backend

# Copy environment file
copy .env.example .env          # Windows
# cp .env.example .env          # Mac/Linux

# Open .env in Notepad/VSCode and set:
#   JWT_SECRET = any long random string (50+ chars)
#   ADMIN_EMAIL = your email
#   ADMIN_PASSWORD = strong password

# Install packages
npm install

# Start (auto-creates database + admin account)
npm run dev
```

You'll see:
```
🚗 ════════════════════════════════════
   RideX API  →  http://localhost:5000
   Health     →  http://localhost:5000/api/health
════════════════════════════════════
```

### Step 2 — Update Frontend

1. Replace your `src/App.jsx` with the new `RideApp_connected.jsx` file
2. Create a file `src/.env` (in your React project root, NOT the backend):
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

### Step 3 — Start Frontend

```bash
cd your-react-project   # (the folder with package.json for React)
npm start               # or npm run dev if using Vite
```

✅ Your app is now fully connected at `http://localhost:5173`

---

## 🔑 Default Login Credentials

After first run, these accounts are auto-created:

| Role  | Email               | Password     |
|-------|---------------------|--------------|
| Admin | admin@ridex.com     | Admin@2026   |
| User  | user@ridex.com      | User@2026    |

**Change these in `.env` before going live!**

---

## 🌐 Deploy Live (Free)

### Option A — Render (Backend) + Vercel (Frontend) ✅ RECOMMENDED

**Step 1: Push code to GitHub**
```bash
# Create two GitHub repos:
# 1. ridex-backend  → push the backend folder
# 2. ridex-frontend → push your React project (with new App.jsx)
```

**Step 2: Deploy Backend on Render (free)**

1. Go to https://render.com → Sign up free
2. Click **New → Web Service**
3. Connect your `ridex-backend` GitHub repo
4. Fill in settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node
5. Add Environment Variables (click "Advanced"):
   ```
   JWT_SECRET         = (generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   ADMIN_EMAIL        = your-email@gmail.com
   ADMIN_PASSWORD     = YourStrongPassword123!
   NODE_ENV           = production
   FRONTEND_URL       = https://your-ridex.vercel.app  ← (fill after step 3)
   ```
6. Click **Create Web Service**
7. Wait 2-3 minutes → Your API will be at:
   `https://ridex-backend-xxxx.onrender.com`

**Step 3: Deploy Frontend on Vercel (free)**

1. Go to https://vercel.com → Sign up free
2. Click **New Project** → Import your `ridex-frontend` repo
3. Add Environment Variable:
   ```
   VITE_API_URL = https://ridex-backend-xxxx.onrender.com/api
   ```
   (use the URL from Render step above)
4. Click **Deploy**
5. Your site is live at: `https://ridex-frontend-xxxx.vercel.app`

**Step 4: Connect them**
- Go back to Render → Your backend service
- Update `FRONTEND_URL` to your Vercel URL
- Click "Save Changes" → backend auto-restarts

✅ **Done! Your app is live.**

---

### Option B — Railway (Backend + Frontend together)

1. Go to https://railway.app → Sign up (free $5/month credit)
2. Click **New Project → Deploy from GitHub**
3. Select your backend repo
4. Add environment variables (same as Render)
5. Railway gives you a URL automatically

---

## 🔒 Admin Panel

Access at: `http://localhost:5173` → Click **"Sign In"** → Login with admin credentials

**What you can control:**

### 💰 Pricing Control (Admin → Settings tab)
| Setting | What it does |
|---------|-------------|
| `mini_base_fare` | Minimum charge for Mini rides |
| `mini_per_km` | Per-km rate for Mini |
| `sedan_base_fare` | Minimum charge for Sedan |
| `sedan_per_km` | Per-km rate for Sedan |
| `suv_base_fare` | Base fare for SUV |
| `suv_per_km` | Per-km for SUV |
| `premium_base_fare` | Premium base fare |
| `premium_per_km` | Premium per-km |
| `surge_peak_multiplier` | Price multiplier during peak hours (e.g. 1.5 = 50% more) |
| `surge_night_multiplier` | Night surge multiplier |
| `peak_hours` | When peak pricing applies (e.g. "8-10,17-20") |
| `gst_percent` | GST percentage added to all rides |
| `min_fare` | Minimum fare for any ride |
| `cancellation_fee` | Fee charged for late cancellations |
| `free_cancel_minutes` | Minutes before cancellation fee kicks in |

### 🚗 Driver Management (Admin → Drivers tab)
- Add new drivers with name, phone, car details, plate number
- Choose ride type (Mini/Sedan/SUV/Premium)
- Remove drivers
- View driver ratings and trip counts

### 📊 Rides (Admin → Rides tab)
- View all bookings
- Mark rides as completed or cancelled

### 🎫 Support Tickets (Admin → Tickets tab)
- View all customer messages
- See subject, message, and contact details

---

## 🗺️ Adding Real GPS Distance (Optional)

The app works perfectly with smart distance estimation.
For **real GPS routing**, get a free Google Maps API key:

1. Go to https://console.cloud.google.com
2. Create a project → Enable **Distance Matrix API**
3. Create credentials → Copy API key
4. Add to `.env`:
   ```
   GOOGLE_MAPS_API_KEY=AIza...your_key_here
   ```
5. Restart the backend

---

## 🔌 Full API Reference

### Auth
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/signup` | `{name, email, phone, password}` | Create account |
| POST | `/api/auth/login` | `{email, password}` | Login → get token |
| GET  | `/api/auth/me` | *(token required)* | Get current user |

### Rides
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| POST | `/api/rides/estimate` | `{pickup, drop, rideType}` | Live fare estimate |
| POST | `/api/rides/book` | `{pickup, drop, rideType, paymentMethod}` | Book a ride |
| GET  | `/api/rides/history` | — | Your ride history |
| GET  | `/api/rides/active` | — | Active ride + driver |
| PATCH | `/api/rides/:id/cancel` | `{reason}` | Cancel a ride |
| POST | `/api/rides/:id/rate` | `{stars, comment}` | Rate driver (1-5) |
| PATCH | `/api/rides/:id/complete` | — | Mark as complete |

### Support
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| POST | `/api/support/ticket` | `{subject, message}` | Submit ticket |

### Admin (requires admin login)
| Method | URL | Description |
|--------|-----|-------------|
| GET  | `/api/admin/dashboard` | Stats, revenue, recent rides |
| GET  | `/api/admin/analytics` | Charts data (7 days, by type) |
| GET  | `/api/admin/settings` | All pricing settings |
| PUT  | `/api/admin/settings` | Update pricing `{key: value}` |
| GET  | `/api/admin/rides` | All rides (with filters) |
| PATCH | `/api/admin/rides/:id` | Update ride status |
| GET  | `/api/admin/drivers` | All drivers |
| POST | `/api/admin/drivers` | Add driver |
| PATCH | `/api/admin/drivers/:id` | Update driver |
| DELETE | `/api/admin/drivers/:id` | Remove driver |
| GET  | `/api/admin/users` | All users |
| GET  | `/api/admin/tickets` | Support tickets |

---

## 🛠️ Common Issues

**"No drivers available"**
→ Go to Admin → Drivers → Add at least one driver per ride type

**"CORS blocked"**
→ Make sure `FRONTEND_URL` in `.env` exactly matches your React app's URL

**"Authentication required"**
→ You need to be logged in. The frontend handles this automatically.

**App works locally but not on Render**
→ Check the environment variables are all set in Render dashboard

**SQLite error on Render**
→ Normal — Render's free tier resets disk on restart (data resets).
  For permanent data, upgrade to a paid plan or use Railway which persists data.

---

## 🎯 Quick Test

After starting the backend, open your browser and go to:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "success": true,
  "status": "🚗 RideX API running",
  "database": { "users": 2, "drivers": 8, "rides": 0 }
}
```

If you see this, everything is working! ✅

