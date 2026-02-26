import { useState, useEffect, useRef, useCallback } from "react";

// ─── API Config ───────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = async (path, opts = {}) => {
  const token = localStorage.getItem("ridex_token");
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ─── Auth Context ─────────────────────────────────────────────────────────────
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ridex_token");
    if (token) {
      api("/auth/me").then(d => setUser(d.user)).catch(() => {
        localStorage.removeItem("ridex_token");
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("ridex_token", token);
    setUser(userData);
  };
  const logout = () => {
    localStorage.removeItem("ridex_token");
    setUser(null);
  };
  return { user, loading, login, logout, setUser };
};

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = (dark) => ({
  bg:      dark ? "#090b14"                    : "#f0f2f8",
  bg2:     dark ? "#0f1320"                    : "#ffffff",
  bg3:     dark ? "rgba(255,255,255,0.05)"     : "rgba(0,0,0,0.04)",
  border:  dark ? "rgba(255,255,255,0.09)"     : "rgba(0,0,0,0.1)",
  text:    dark ? "#f8fafc"                    : "#0f172a",
  text2:   dark ? "rgba(248,250,252,0.5)"      : "rgba(15,23,42,0.55)",
  text3:   dark ? "rgba(248,250,252,0.28)"     : "rgba(15,23,42,0.32)",
  navBg:   dark ? "rgba(9,11,20,0.95)"         : "rgba(255,255,255,0.95)",
  cardBg:  dark ? "rgba(255,255,255,0.03)"     : "#ffffff",
  inputBg: dark ? "rgba(255,255,255,0.05)"     : "rgba(0,0,0,0.04)",
  shadow:  dark ? "0 24px 60px rgba(0,0,0,0.5)" : "0 24px 60px rgba(0,0,0,0.1)",
});

function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

// ─── Glow Cursor ─────────────────────────────────────────────────────────────
function GlowCursor() {
  const glowRef = useRef(null);
  const [hov, setHov] = useState(false);
  useEffect(() => {
    const mv  = (e) => { if (glowRef.current) glowRef.current.style.transform = `translate(${e.clientX-200}px,${e.clientY-200}px)`; };
    const ov  = (e) => { if (e.target.matches("button,a,[data-hover],input,select,.rc")) setHov(true); };
    const out = () => setHov(false);
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseover", ov);
    window.addEventListener("mouseout",  out);
    return () => { window.removeEventListener("mousemove",mv); window.removeEventListener("mouseover",ov); window.removeEventListener("mouseout",out); };
  }, []);
  return (
    <div ref={glowRef} style={{ position:"fixed",top:0,left:0,width:400,height:400,borderRadius:"50%",pointerEvents:"none",zIndex:9998,
      background:hov?"radial-gradient(circle,rgba(239,68,68,0.22) 0%,transparent 70%)":"radial-gradient(circle,rgba(239,68,68,0.09) 0%,transparent 70%)",
      transition:"background 0.35s ease" }} />
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type="success", onClose, dark }) {
  const th = T(dark);
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors = { success:"#22c55e", error:"#ef4444", info:"#3b82f6" };
  const icons  = { success:"✓", error:"✕", info:"ℹ" };
  return (
    <div style={{ position:"fixed",bottom:24,right:24,zIndex:10000,background:th.bg2,
      border:`1px solid ${colors[type]}40`,borderRadius:14,padding:"13px 20px",color:th.text,
      fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,
      boxShadow:th.shadow,animation:"slideUp 0.3s ease",display:"flex",alignItems:"center",gap:10,
      maxWidth:"calc(100vw - 48px)" }}>
      <span style={{ color:colors[type],fontSize:16,fontWeight:700 }}>{icons[type]}</span>{msg}
      <button onClick={onClose} style={{ background:"none",border:"none",color:th.text3,cursor:"pointer",marginLeft:8,fontSize:16 }}>×</button>
    </div>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
function Btn({ children, variant="primary", onClick, style={}, small=false, dark=true, full=false, loading=false, disabled=false }) {
  const [h, setH] = useState(false);
  const th = T(dark);
  const base = { display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,cursor:disabled||loading?"not-allowed":"pointer",
    border:"none",outline:"none",borderRadius:12,fontFamily:"'DM Sans',sans-serif",
    fontWeight:600,transition:"all 0.22s ease",fontSize:small?13:14,padding:small?"8px 16px":"12px 24px",
    width:full?"100%":"auto",whiteSpace:"nowrap",opacity:disabled||loading?0.6:1 };
  const v = {
    primary: { background:h&&!disabled?"#dc2626":"#ef4444",color:"#fff",
      boxShadow:h&&!disabled?"0 8px 24px rgba(239,68,68,0.5)":"0 4px 14px rgba(239,68,68,0.28)",
      transform:h&&!disabled?"scale(1.03)":"scale(1)" },
    ghost:   { background:h&&!disabled?"rgba(239,68,68,0.1)":"transparent",color:h&&!disabled?"#ef4444":th.text2,
      border:`1px solid ${th.border}`,transform:h&&!disabled?"scale(1.02)":"scale(1)" },
    outline: { background:"transparent",color:"#ef4444",border:"1.5px solid rgba(239,68,68,0.5)",
      boxShadow:h&&!disabled?"0 0 18px rgba(239,68,68,0.2)":"none",transform:h&&!disabled?"scale(1.02)":"scale(1)" },
    muted:   { background:h&&!disabled?th.border:th.bg3,color:th.text,border:`1px solid ${th.border}` },
    green:   { background:h&&!disabled?"#16a34a":"#22c55e",color:"#fff",
      boxShadow:h&&!disabled?"0 8px 24px rgba(34,197,94,0.4)":"none" },
  };
  return (
    <button onClick={disabled||loading?undefined:onClick} disabled={disabled||loading}
      onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{...base,...v[variant],...style}}>
      {loading ? <span style={{ display:"inline-block",width:14,height:14,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite" }} /> : children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Input({ label, value, onChange, type="text", icon, dark=true, onKeyDown }) {
  const [f, setF] = useState(false);
  const th = T(dark);
  return (
    <div style={{ display:"flex",alignItems:"center",background:f?"rgba(239,68,68,0.06)":th.inputBg,
      border:`1.5px solid ${f?"rgba(239,68,68,0.5)":th.border}`,borderRadius:12,overflow:"hidden",transition:"all 0.22s",
      boxShadow:f?"0 0 0 3px rgba(239,68,68,0.1)":"none" }}>
      {icon && <span style={{ paddingLeft:14,fontSize:14,opacity:0.45,flexShrink:0 }}>{icon}</span>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={label}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)} onKeyDown={onKeyDown}
        style={{ flex:1,background:"transparent",border:"none",outline:"none",
          color:th.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,padding:"13px 14px",minWidth:0 }} />
    </div>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function ThemeToggle({ dark, setDark }) {
  const th = T(dark);
  return (
    <button onClick={()=>setDark(!dark)} style={{ background:th.bg3,border:`1.5px solid ${th.border}`,
      borderRadius:40,padding:"7px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,
      transition:"all 0.25s",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:th.text,whiteSpace:"nowrap" }}>
      <span style={{ fontSize:14 }}>{dark?"☀️":"🌙"}</span>
      <span>{dark?"Light":"Dark"}</span>
    </button>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ page, setPage, dark, setDark, user, logout }) {
  const th = T(dark);
  const w  = useWidth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = w < 768;

  const links = [
    { id:"home",    label:"Home"      },
    { id:"book",    label:"Book Ride" },
    { id:"rides",   label:"My Rides"  },
    { id:"driver",  label:"Driver"    },
    { id:"support", label:"Support"   },
    ...(user?.role === "admin" ? [{ id:"admin", label:"⚙ Admin" }] : []),
  ];

  const go = (id) => { setPage(id); setMenuOpen(false); };

  return (
    <nav style={{ position:"fixed",top:0,left:0,right:0,zIndex:1000,
      background:th.navBg,backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
      borderBottom:`2px solid ${th.border}`,
      boxShadow:dark?"0 4px 30px rgba(0,0,0,0.45)":"0 4px 30px rgba(0,0,0,0.07)",
      transition:"background 0.3s",width:"100%" }}>
      <div style={{ maxWidth:1400,margin:"0 auto",padding:isMobile?"0 16px":"0 40px",
        display:"flex",alignItems:"center",height:64,gap:16,width:"100%" }}>
        {/* Logo */}
        <div data-hover onClick={()=>go("home")}
          style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0 }}>
          <div style={{ width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#ef4444,#f97316)",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",
            boxShadow:"0 4px 12px rgba(239,68,68,0.38)" }}>R</div>
          <span style={{ fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:th.text,letterSpacing:"-0.5px" }}>
            Ride<span style={{ color:"#ef4444" }}>X</span>
          </span>
        </div>

        {/* Desktop Links */}
        {!isMobile && (
          <div style={{ flex:1,display:"flex",justifyContent:"center",gap:2 }}>
            {links.map(l => <NavLink key={l.id} active={page===l.id} onClick={()=>go(l.id)} dark={dark} label={l.label} />)}
          </div>
        )}

        {/* Right */}
        <div style={{ display:"flex",gap:8,alignItems:"center",marginLeft:isMobile?"auto":"0",flexShrink:0 }}>
          <ThemeToggle dark={dark} setDark={setDark} />
          {!isMobile && (
            user
              ? <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <div style={{ background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",
                    borderRadius:10,padding:"6px 12px",fontFamily:"'DM Sans',sans-serif",fontSize:13,
                    fontWeight:600,color:"#ef4444" }}>👤 {user.name.split(" ")[0]}</div>
                  <Btn variant="ghost" small dark={dark} onClick={logout}>Logout</Btn>
                </div>
              : <>
                  <Btn variant="ghost" small dark={dark} onClick={()=>go("login")}>Sign In</Btn>
                  <Btn variant="primary" small dark={dark} onClick={()=>go("signup")}>Get Started</Btn>
                </>
          )}
          {isMobile && (
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{ background:th.bg3,border:`1px solid ${th.border}`,
              borderRadius:9,width:38,height:38,cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5 }}>
              {[0,1,2].map(i=>(
                <span key={i} style={{ width:18,height:2,background:th.text,borderRadius:2,display:"block",
                  transform:menuOpen&&i===0?"rotate(45deg) translate(5px,5px)":menuOpen&&i===1?"scaleX(0)":menuOpen&&i===2?"rotate(-45deg) translate(5px,-5px)":"none",
                  transition:"all 0.25s" }} />
              ))}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && menuOpen && (
        <div style={{ background:th.navBg,borderTop:`1px solid ${th.border}`,padding:"12px 16px 20px",display:"flex",flexDirection:"column",gap:4 }}>
          {links.map(l=>(
            <button key={l.id} onClick={()=>go(l.id)} style={{ background:page===l.id?"rgba(239,68,68,0.1)":"transparent",
              border:"none",padding:"12px 16px",borderRadius:10,cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:500,
              color:page===l.id?"#ef4444":th.text,textAlign:"left" }}>{l.label}</button>
          ))}
          <div style={{ display:"flex",gap:8,marginTop:8 }}>
            {user
              ? <Btn variant="ghost" dark={dark} onClick={logout} style={{ flex:1 }}>Logout</Btn>
              : <>
                  <Btn variant="ghost" dark={dark} onClick={()=>go("login")} style={{ flex:1 }}>Sign In</Btn>
                  <Btn variant="primary" dark={dark} onClick={()=>go("signup")} style={{ flex:1 }}>Get Started</Btn>
                </>
            }
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ active, onClick, dark, label }) {
  const [h, setH] = useState(false);
  const th = T(dark);
  return (
    <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ background:active?"rgba(239,68,68,0.1)":h?"rgba(239,68,68,0.05)":"transparent",
        border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500,
        color:active?"#ef4444":h?th.text:th.text2,padding:"7px 14px",borderRadius:9,transition:"all 0.2s",
        outline:"none",borderBottom:active?"2px solid #ef4444":"2px solid transparent" }}>
      {label}
    </button>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ setPage, showToast, dark }) {
  const [pickup, setPickup] = useState("");
  const [drop,   setDrop]   = useState("");
  const [rt,     setRt]     = useState("sedan");
  const [fy,     setFy]     = useState(0);
  const th = T(dark);
  const w  = useWidth();
  const isMobile = w < 768;
  const isTablet = w < 1100;

  useEffect(() => {
    let fr, s;
    const a = (ts) => { if(!s)s=ts; setFy(Math.sin((ts-s)/1200)*10); fr=requestAnimationFrame(a); };
    fr = requestAnimationFrame(a);
    return () => cancelAnimationFrame(fr);
  }, []);

  const handleQuickBook = () => {
    if (!pickup.trim() || !drop.trim()) { showToast("Enter pickup & drop location","error"); return; }
    sessionStorage.setItem("ridex_pickup", pickup);
    sessionStorage.setItem("ridex_drop", drop);
    sessionStorage.setItem("ridex_rt", rt);
    setPage("book");
  };

  const RIDE_TYPES = [
    { id:"mini",icon:"🚗" },{ id:"sedan",icon:"🚙" },
    { id:"suv",icon:"🚕" },{ id:"premium",icon:"🏎️" },
  ];

  return (
    <section style={{ minHeight:"100vh",position:"relative",overflow:"hidden",width:"100%",
      background:dark
        ? "radial-gradient(ellipse 80% 60% at 65% 40%,rgba(239,68,68,0.12) 0%,transparent 60%),radial-gradient(ellipse 50% 80% at 10% 80%,rgba(249,115,22,0.07) 0%,transparent 60%),#090b14"
        : "radial-gradient(ellipse 70% 50% at 60% 40%,rgba(239,68,68,0.07) 0%,transparent 60%),#f0f2f8" }}>
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",opacity:dark?0.04:0.05,
        backgroundImage:"linear-gradient(rgba(120,120,120,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(120,120,120,0.5) 1px,transparent 1px)",
        backgroundSize:"60px 60px" }} />
      <div style={{ maxWidth:1400,margin:"0 auto",padding:isMobile?"100px 16px 60px":isTablet?"110px 24px 70px":"110px 40px 80px",
        display:"flex",gap:isMobile?40:60,alignItems:"center",flexDirection:isMobile||isTablet?"column":"row",minHeight:"100vh" }}>
        {/* Left */}
        <div style={{ flex:"1 1 360px",minWidth:0,width:"100%",textAlign:isMobile?"center":"left" }}>
          <div style={{ display:"inline-flex",alignItems:"center",gap:8,background:"rgba(239,68,68,0.1)",
            border:"1px solid rgba(239,68,68,0.25)",borderRadius:100,padding:"6px 16px",marginBottom:24 }}>
            <span style={{ width:7,height:7,borderRadius:"50%",background:"#ef4444",display:"inline-block",animation:"pulse 1.5s infinite" }} />
            <span style={{ color:"#ef4444",fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:500 }}>Now live in 12 cities</span>
          </div>
          <h1 style={{ fontFamily:"'Syne',sans-serif",
            fontSize:isMobile?"clamp(36px,10vw,50px)":isTablet?"clamp(40px,6vw,60px)":"clamp(44px,5vw,72px)",
            fontWeight:800,color:th.text,lineHeight:1.06,marginBottom:20,letterSpacing:"-2px" }}>
            Ride Smarter.<br />
            <span style={{ background:"linear-gradient(135deg,#ef4444,#f97316)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>
              Travel Better.
            </span>
          </h1>
          <p style={{ color:th.text2,fontSize:isMobile?15:17,fontFamily:"'DM Sans',sans-serif",lineHeight:1.7,
            maxWidth:isMobile?"100%":460,margin:isMobile?"0 auto 36px":"0 0 36px" }}>
            Premium cab service with verified drivers, real-time tracking, live fare estimates, and seamless payments.
          </p>
          <div style={{ display:"flex",gap:isMobile?20:32,flexWrap:"wrap",justifyContent:isMobile?"center":"flex-start" }}>
            {[["3.2M+","Rides"],["50K+","Drivers"],["4.9★","Rating"]].map(([v,l])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Syne',sans-serif",fontSize:isMobile?22:26,fontWeight:800,color:th.text }}>{v}</div>
                <div style={{ fontSize:12,color:th.text3,fontFamily:"'DM Sans',sans-serif",marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Booking Card */}
        <div style={{ flex:"1 1 360px",maxWidth:isMobile?"100%":480,width:"100%" }}>
          <div style={{ background:dark?"rgba(12,16,28,0.92)":"rgba(255,255,255,0.97)",
            backdropFilter:"blur(20px)",border:`1px solid ${th.border}`,borderRadius:20,padding:isMobile?"20px":"28px",boxShadow:th.shadow }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,color:th.text,marginBottom:20 }}>Book Your Ride</h3>
            <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:14 }}>
              <Input label="Pickup location" value={pickup} onChange={setPickup} icon="📍" dark={dark} />
              <div style={{ position:"relative",height:1,background:th.border,margin:"2px 0" }}>
                <div style={{ position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",
                  width:26,height:26,borderRadius:"50%",background:th.bg2,border:`1px solid ${th.border}`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:th.text2 }}>⇅</div>
              </div>
              <Input label="Drop location" value={drop} onChange={setDrop} icon="🏁" dark={dark}
                onKeyDown={e=>e.key==="Enter"&&handleQuickBook()} />
            </div>
            <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
              {[{id:"mini",icon:"🚗"},{id:"sedan",icon:"🚙"},{id:"suv",icon:"🚕"},{id:"premium",icon:"🏎️"}].map(r=>(
                <button key={r.id} onClick={()=>setRt(r.id)} style={{ flex:1,minWidth:64,padding:"9px 6px",borderRadius:10,border:"1.5px solid",
                  borderColor:rt===r.id?"#ef4444":th.border,background:rt===r.id?"rgba(239,68,68,0.1)":th.bg3,
                  cursor:"pointer",transition:"all 0.2s",textAlign:"center" }}>
                  <div style={{ fontSize:18 }}>{r.icon}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:600,
                    color:rt===r.id?"#ef4444":th.text2,marginTop:2,textTransform:"capitalize" }}>{r.id}</div>
                </button>
              ))}
            </div>
            <Btn variant="primary" dark={dark} full onClick={handleQuickBook} style={{ padding:"14px",fontSize:15,borderRadius:14 }}>
              🚗 Book Now — Get Live Price
            </Btn>
          </div>
        </div>
      </div>
      {!isMobile && !isTablet && (
        <div style={{ position:"absolute",right:"1%",bottom:20,fontSize:110,opacity:0.05,pointerEvents:"none",
          transform:`translateY(${fy}px)`,transition:"transform 0.1s linear" }}>🚗</div>
      )}
    </section>
  );
}

// ─── Features section ─────────────────────────────────────────────────────────
const FEATURES = [
  { icon:"📍", title:"Live Route Estimation",  desc:"Real-time distance, time & fare calc from your actual locations" },
  { icon:"🛡️", title:"Verified Drivers",        desc:"Background-checked, trained & rated professionals"              },
  { icon:"💳", title:"Cashless Payments",       desc:"UPI, cards, wallet — pay your way, every time"                  },
  { icon:"🕐", title:"24/7 Availability",       desc:"Rides at midnight, dawn, or peak hours — always on"             },
  { icon:"📊", title:"Dynamic Pricing",         desc:"Transparent fare breakdown with surge & GST shown upfront"      },
  { icon:"⭐", title:"5-Star Standard",         desc:"Consistently high ratings across our entire fleet"              },
];

function Features({ dark }) {
  const th = T(dark);
  const w  = useWidth();
  const isMobile = w < 768;
  return (
    <div style={{ background:th.bg,width:"100%" }}>
      <section style={{ padding:isMobile?"60px 16px":w<1024?"80px 24px":"100px 40px",maxWidth:1400,margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:isMobile?40:56 }}>
          <p style={{ color:"#ef4444",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,letterSpacing:2,textTransform:"uppercase",marginBottom:10 }}>Why RideX</p>
          <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:isMobile?"clamp(26px,8vw,36px)":"clamp(30px,4vw,50px)",fontWeight:800,color:th.text,letterSpacing:"-1.5px" }}>
            Built for your comfort
          </h2>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":w<1024?"1fr 1fr":"1fr 1fr 1fr",gap:isMobile?14:20 }}>
          {FEATURES.map((f,i)=>{
            const [h,setH]=useState(false);
            return (
              <div key={i} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
                style={{ background:h?"rgba(239,68,68,0.05)":th.cardBg,border:`1px solid ${h?"rgba(239,68,68,0.22)":th.border}`,
                  borderRadius:18,padding:"24px 22px",transform:h?"translateY(-4px)":"translateY(0)",
                  boxShadow:h?(dark?"0 16px 36px rgba(0,0,0,0.35)":"0 16px 36px rgba(0,0,0,0.08)"):"none",
                  transition:"all 0.3s",cursor:"default" }}>
                <div style={{ fontSize:28,marginBottom:12 }}>{f.icon}</div>
                <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:th.text,marginBottom:8 }}>{f.title}</h3>
                <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:14,lineHeight:1.65 }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─── Book Page (with live API estimate) ──────────────────────────────────────
function BookPage({ showToast, dark, user, setPage }) {
  const [pickup,   setPickup]   = useState(sessionStorage.getItem("ridex_pickup") || "");
  const [drop,     setDrop]     = useState(sessionStorage.getItem("ridex_drop")   || "");
  const [rt,       setRt]       = useState(sessionStorage.getItem("ridex_rt")     || "sedan");
  const [estimate, setEstimate] = useState(null);
  const [estimating,setEstimating]=useState(false);
  const [pay,      setPay]      = useState("upi");
  const [booking,  setBooking]  = useState(false);
  const [booked,   setBooked]   = useState(null);
  const th   = T(dark);
  const w    = useWidth();
  const isMobile = w < 768;
  const px   = isMobile?"16px":w<1024?"24px":"40px";

  const PAYMENT_METHODS = [
    { id:"upi",label:"UPI",icon:"📲" },{ id:"card",label:"Card",icon:"💳" },
    { id:"wallet",label:"Wallet",icon:"👛" },{ id:"cash",label:"Cash",icon:"💵" },
  ];

  const getEstimate = async () => {
    if (!pickup.trim() || !drop.trim()) { showToast("Enter pickup & drop location","error"); return; }
    setEstimating(true);
    try {
      const data = await api("/rides/estimate", { method:"POST", body:{ pickup, drop, rideType:rt } });
      setEstimate(data);
    } catch(e) { showToast(e.message,"error"); }
    finally { setEstimating(false); }
  };

  const confirmRide = async () => {
    if (!user) { showToast("Please sign in to book a ride","error"); setPage("login"); return; }
    if (!estimate) { showToast("Get estimate first","error"); return; }
    setBooking(true);
    try {
      const sel = estimate.estimates[rt];
      const data = await api("/rides/book", { method:"POST", body:{ pickup, drop, rideType:rt, paymentMethod:pay } });
      setBooked(data);
      showToast("Ride confirmed! Driver is on the way 🚗","success");
    } catch(e) { showToast(e.message,"error"); }
    finally { setBooking(false); }
  };

  if (booked) return (
    <div style={{ minHeight:"100vh",background:th.bg,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 16px 40px" }}>
      <div style={{ textAlign:"center",maxWidth:440,width:"100%" }}>
        <div style={{ width:72,height:72,borderRadius:"50%",margin:"0 auto 20px",
          background:"linear-gradient(135deg,#ef4444,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:32,color:"#fff",boxShadow:"0 0 36px rgba(239,68,68,0.4)" }}>✓</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:th.text,marginBottom:10 }}>Ride Booked!</h2>
        <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",marginBottom:24 }}>{booked.driver.name} is {booked.driver.etaMin} min away</p>
        <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18,padding:22,marginBottom:20,textAlign:"left" }}>
          {[
            ["Driver",  booked.driver.name],
            ["Vehicle", booked.driver.car],
            ["Plate",   booked.driver.plate],
            ["Rating",  `⭐ ${booked.driver.rating}`],
            ["Distance",booked.ride.distanceText],
            ["Time",    booked.ride.durationText],
            ["Total",   `₹${booked.ride.fare}`],
          ].map(([k,v])=>(
            <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${th.border}` }}>
              <span style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:14 }}>{k}</span>
              <span style={{ color:k==="Total"?"#ef4444":th.text,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:k==="Total"?20:14 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <Btn variant="primary" dark={dark} style={{ flex:1 }} onClick={()=>setPage("driver")}>Track Ride 📍</Btn>
          <Btn variant="ghost"   dark={dark} style={{ flex:1 }} onClick={()=>{ setBooked(null); setEstimate(null); }}>New Ride</Btn>
        </div>
      </div>
    </div>
  );

  const sel = estimate?.estimates?.[rt];

  return (
    <div style={{ minHeight:"100vh",background:th.bg,width:"100%",padding:`80px ${px} 60px` }}>
      <div style={{ maxWidth:860,margin:"0 auto",width:"100%" }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:isMobile?28:34,fontWeight:800,color:th.text,marginBottom:6,letterSpacing:"-1px" }}>Book a Ride</h2>
        <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",marginBottom:32,fontSize:14 }}>
          Enter locations → get live price → confirm
        </p>

        {/* Route input */}
        <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18,padding:isMobile?18:24,marginBottom:20 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:th.text,marginBottom:14 }}>Route</h3>
          <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:14 }}>
            <Input label="Pickup location (e.g. Connaught Place, Delhi)" value={pickup} onChange={setPickup} icon="📍" dark={dark} />
            <Input label="Drop location (e.g. IGI Airport, Delhi)" value={drop} onChange={setDrop} icon="🏁" dark={dark}
              onKeyDown={e=>e.key==="Enter"&&getEstimate()} />
          </div>
          <Btn variant="primary" dark={dark} onClick={getEstimate} loading={estimating}
            style={{ fontSize:14 }}>
            🔍 Get Live Fare Estimate
          </Btn>

          {/* Route result */}
          {estimate && (
            <div style={{ marginTop:16,padding:"12px 16px",background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:12,
              display:"flex",gap:20,flexWrap:"wrap" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:th.text2 }}>📏 {estimate.route.distanceText}</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:th.text2 }}>⏱ {estimate.route.durationText}</span>
              {estimate.route.source === "mock" && (
                <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:th.text3 }}>
                  ℹ Add Google Maps key for exact distances
                </span>
              )}
            </div>
          )}
        </div>

        {/* Ride type cards with live prices */}
        {estimate && (
          <>
            <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:th.text,marginBottom:12 }}>Select Ride Type</h3>
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12,marginBottom:20 }}>
              {[
                { id:"mini",icon:"🚗",label:"Mini",desc:"4 seats" },
                { id:"sedan",icon:"🚙",label:"Sedan",desc:"4 seats" },
                { id:"suv",icon:"🚕",label:"SUV",desc:"6 seats" },
                { id:"premium",icon:"🏎️",label:"Premium",desc:"4 seats" },
              ].map(r=>{
                const est = estimate.estimates[r.id];
                const eta = estimate.driverEta?.[r.id];
                return (
                  <div key={r.id} onClick={()=>setRt(r.id)} className="rc"
                    style={{ background:rt===r.id?"rgba(239,68,68,0.08)":th.cardBg,
                      border:`1.5px solid ${rt===r.id?"#ef4444":th.border}`,
                      borderRadius:16,padding:"16px 14px",cursor:"pointer",
                      transform:rt===r.id?"translateY(-3px)":"none",
                      boxShadow:rt===r.id?"0 10px 24px rgba(239,68,68,0.15)":"none",transition:"all 0.25s" }}>
                    <div style={{ fontSize:28,marginBottom:8 }}>{r.icon}</div>
                    <div style={{ fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:th.text,marginBottom:2 }}>{r.label}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:th.text2,marginBottom:10 }}>{r.desc}</div>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:4 }}>
                      <div>
                        <div style={{ fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,color:"#ef4444" }}>
                          ₹{est?.fare ?? "—"}
                        </div>
                        {est?.breakdown?.surgeApplied && (
                          <div style={{ fontSize:10,color:"#f59e0b",fontFamily:"'DM Sans',sans-serif" }}>⚡ {est.breakdown.surgeLabel}</div>
                        )}
                      </div>
                      {eta && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:10,color:th.text2,
                        background:th.bg3,padding:"3px 7px",borderRadius:6,border:`1px solid ${th.border}` }}>{eta}min</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Fare breakdown */}
        {estimate && sel && (
          <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18,padding:isMobile?18:24,marginBottom:20 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:th.text,marginBottom:14 }}>
              Fare Breakdown — {rt.charAt(0).toUpperCase()+rt.slice(1)}
            </h3>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {[
                ["Base Fare",        `₹${sel.breakdown.baseFare}`],
                ["Distance Charge",  `₹${sel.breakdown.distanceCharge}`],
                ["Time Charge",      `₹${sel.breakdown.timeCharge}`],
                ...(sel.breakdown.surgeApplied?[[`Surge (${sel.breakdown.surgeLabel})`, `×${sel.breakdown.surgeMultiplier}`]]:[]),
                [`GST (${sel.breakdown.gstPercent}%)`, `₹${sel.breakdown.gstAmount}`],
              ].map(([k,v])=>(
                <div key={k} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${th.border}` }}>
                  <span style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:13 }}>{k}</span>
                  <span style={{ color:th.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 0" }}>
                <span style={{ color:th.text,fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700 }}>Total</span>
                <span style={{ color:"#ef4444",fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800 }}>₹{sel.fare}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment */}
        {estimate && (
          <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18,padding:isMobile?18:24,marginBottom:20 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:th.text,marginBottom:14 }}>Payment Method</h3>
            <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>
              {[{id:"upi",label:"UPI",icon:"📲"},{id:"card",label:"Card",icon:"💳"},{id:"wallet",label:"Wallet",icon:"👛"},{id:"cash",label:"Cash",icon:"💵"}].map(p=>(
                <button key={p.id} onClick={()=>setPay(p.id)} style={{ display:"flex",alignItems:"center",gap:7,
                  padding:"10px 16px",borderRadius:11,cursor:"pointer",transition:"all 0.2s",
                  background:pay===p.id?"rgba(239,68,68,0.1)":th.bg3,
                  border:`1.5px solid ${pay===p.id?"#ef4444":th.border}`,
                  fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,
                  color:pay===p.id?"#ef4444":th.text2 }}>
                  <span>{p.icon}</span>{p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confirm */}
        {estimate && sel && (
          <div style={{ background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.18)",
            borderRadius:18,padding:isMobile?18:24,display:"flex",justifyContent:"space-between",
            alignItems:"center",flexWrap:"wrap",gap:16 }}>
            <div>
              <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:13,marginBottom:4 }}>Confirmed fare</p>
              <p style={{ fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:800,color:th.text,letterSpacing:"-1px" }}>₹{sel.fare}</p>
              <p style={{ color:th.text3,fontFamily:"'DM Sans',sans-serif",fontSize:12 }}>
                {estimate.route.distanceText} • {estimate.route.durationText}
              </p>
            </div>
            <Btn variant="primary" dark={dark} onClick={confirmRide} loading={booking}
              style={{ padding:"14px 36px",fontSize:15,width:isMobile?"100%":"auto" }}>
              Confirm Ride →
            </Btn>
          </div>
        )}

        {!estimate && !estimating && (
          <div style={{ textAlign:"center",padding:"40px 20px",color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:14 }}>
            ↑ Enter your pickup and drop location above to get a live fare estimate
          </div>
        )}
      </div>
    </div>
  );
}

// ─── My Rides (live from API) ─────────────────────────────────────────────────
function RidesPage({ showToast, dark, user, setPage }) {
  const [rides,   setRides]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const th = T(dark);
  const w  = useWidth();
  const isMobile = w < 768;
  const px = isMobile?"16px":w<1024?"24px":"40px";

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const status = filter === "all" ? "" : `?status=${filter}`;
    api(`/rides/history${status}`)
      .then(d => setRides(d.rides || []))
      .catch(e => showToast(e.message,"error"))
      .finally(() => setLoading(false));
  }, [user, filter]);

  const cancel = async (id) => {
    try {
      const d = await api(`/rides/${id}/cancel`, { method:"PATCH", body:{ reason:"Changed plans" } });
      showToast(d.message,"success");
      setRides(prev => prev.map(r => r.id===id ? {...r,status:"cancelled"} : r));
    } catch(e) { showToast(e.message,"error"); }
  };

  const complete = async (id) => {
    try {
      await api(`/rides/${id}/complete`, { method:"PATCH" });
      showToast("Ride marked complete! Please rate your driver.","success");
      setRides(prev => prev.map(r => r.id===id ? {...r,status:"completed"} : r));
    } catch(e) { showToast(e.message,"error"); }
  };

  const sc = { completed:"#22c55e",cancelled:"#ef4444",ongoing:"#f59e0b",confirmed:"#3b82f6",started:"#f59e0b" };
  const sb = { completed:"rgba(34,197,94,0.1)",cancelled:"rgba(239,68,68,0.1)",ongoing:"rgba(245,158,11,0.1)",confirmed:"rgba(59,130,246,0.1)",started:"rgba(245,158,11,0.1)" };

  return (
    <div style={{ minHeight:"100vh",background:th.bg,width:"100%",padding:`80px ${px} 60px` }}>
      <div style={{ maxWidth:900,margin:"0 auto",width:"100%" }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:isMobile?28:34,fontWeight:800,color:th.text,marginBottom:6,letterSpacing:"-1px" }}>My Rides</h2>
        <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",marginBottom:24,fontSize:14 }}>Your complete ride history</p>

        {/* Filter pills */}
        <div style={{ display:"flex",gap:8,marginBottom:24,flexWrap:"wrap" }}>
          {["all","confirmed","completed","cancelled"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:"7px 16px",borderRadius:100,border:"1.5px solid",
              borderColor:filter===f?"#ef4444":th.border,background:filter===f?"rgba(239,68,68,0.1)":th.bg3,
              fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,cursor:"pointer",
              color:filter===f?"#ef4444":th.text2,textTransform:"capitalize",transition:"all 0.2s" }}>
              {f}
            </button>
          ))}
        </div>

        {!user && (
          <div style={{ textAlign:"center",padding:"60px 20px",background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18 }}>
            <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:16,marginBottom:20 }}>Sign in to view your rides</p>
            <Btn variant="primary" dark={dark} onClick={()=>setPage("login")}>Sign In</Btn>
          </div>
        )}

        {user && loading && (
          <div style={{ textAlign:"center",padding:"60px 20px",color:th.text2,fontFamily:"'DM Sans',sans-serif" }}>Loading your rides...</div>
        )}

        {user && !loading && rides.length === 0 && (
          <div style={{ textAlign:"center",padding:"60px 20px",background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18 }}>
            <div style={{ fontSize:40,marginBottom:16 }}>🚗</div>
            <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:16,marginBottom:20 }}>No rides found</p>
            <Btn variant="primary" dark={dark} onClick={()=>setPage("book")}>Book Your First Ride</Btn>
          </div>
        )}

        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {rides.map(ride=>(
            <div key={ride.id} style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18,padding:isMobile?"14px 16px":"18px 22px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:12 }}>
                <div style={{ minWidth:0,flex:1 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:5 }}>
                    <span style={{ fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:th.text }}>{ride.from}</span>
                    <span style={{ color:th.text3 }}>→</span>
                    <span style={{ fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:th.text }}>{ride.to}</span>
                  </div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:th.text2 }}>{ride.date}</span>
                    {ride.driver!=="—" && <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:th.text2 }}>👤 {ride.driver}</span>}
                    {ride.distanceKm && <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:th.text2 }}>📏 {ride.distanceKm}km</span>}
                    {ride.surge && <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#f59e0b" }}>⚡ Surge</span>}
                  </div>
                </div>
                <div style={{ textAlign:"right",flexShrink:0 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:th.text,marginBottom:6 }}>₹{ride.amount}</div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,fontWeight:600,
                    padding:"4px 12px",borderRadius:100,color:sc[ride.status]||th.text2,background:sb[ride.status]||th.bg3,textTransform:"capitalize" }}>
                    {ride.status}
                  </span>
                </div>
              </div>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {ride.status==="confirmed" && (
                  <>
                    <Btn variant="green" small dark={dark} onClick={()=>complete(ride.id)}>Mark Complete</Btn>
                    <Btn variant="outline" small dark={dark} onClick={()=>cancel(ride.id)}>Cancel</Btn>
                  </>
                )}
                {ride.status==="completed" && !ride.rating && (
                  <Btn variant="ghost" small dark={dark} onClick={()=>showToast("Rating feature coming soon","info")}>⭐ Rate Driver</Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Driver Page (live active ride) ──────────────────────────────────────────
function DriverPage({ showToast, dark, user }) {
  const [activeRide, setActiveRide] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const th = T(dark);
  const w  = useWidth();
  const isMobile = w < 768;
  const px = isMobile?"16px":w<1024?"24px":"40px";

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api("/rides/active")
      .then(d => setActiveRide(d.driver ? d : null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const driver = activeRide?.driver;
  const ride   = activeRide?.ride;

  return (
    <div style={{ minHeight:"100vh",background:th.bg,width:"100%",padding:`80px ${px} 60px` }}>
      <div style={{ maxWidth:600,margin:"0 auto",width:"100%" }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:isMobile?28:34,fontWeight:800,color:th.text,marginBottom:6,letterSpacing:"-1px" }}>Your Driver</h2>
        <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",marginBottom:28,fontSize:14 }}>
          {driver ? "Live — on the way to you" : "No active ride"}
        </p>

        {!user && (
          <div style={{ textAlign:"center",padding:"60px 20px",background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18 }}>
            <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:16 }}>Sign in to see your active driver</p>
          </div>
        )}

        {user && loading && <div style={{ textAlign:"center",padding:"60px",color:th.text2,fontFamily:"'DM Sans',sans-serif" }}>Loading...</div>}

        {user && !loading && !driver && (
          <div style={{ textAlign:"center",padding:"60px 20px",background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18 }}>
            <div style={{ fontSize:40,marginBottom:12 }}>🚗</div>
            <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:16 }}>You have no active ride right now.</p>
          </div>
        )}

        {driver && (
          <>
            <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:22,padding:isMobile?20:28,marginBottom:16 }}>
              <div style={{ display:"flex",gap:16,alignItems:"center",marginBottom:24 }}>
                <div style={{ width:64,height:64,borderRadius:"50%",flexShrink:0,
                  background:"linear-gradient(135deg,#ef4444,#f97316)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"#fff",
                  boxShadow:"0 8px 20px rgba(239,68,68,0.3)" }}>
                  {driver.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:th.text,marginBottom:4 }}>{driver.name}</h3>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ color:"#f59e0b" }}>⭐</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:th.text }}>{driver.rating}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:th.text2 }}>• {driver.trips?.toLocaleString()} trips</span>
                  </div>
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:22 }}>
                {[["🚗","Vehicle",driver.car],["🔢","Plate",driver.plate],["📱","Contact",driver.phone||"—"],["📍","Status","En route"]].map(([i,l,v])=>(
                  <div key={l} style={{ background:th.bg3,border:`1px solid ${th.border}`,borderRadius:12,padding:"12px 14px" }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:th.text3,marginBottom:3 }}>{i} {l}</div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:th.text,wordBreak:"break-all" }}>{v}</div>
                  </div>
                ))}
              </div>
              {ride && (
                <div style={{ background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:12,padding:"12px 16px",marginBottom:20 }}>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:th.text2,marginBottom:4 }}>Active Ride</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:th.text }}>{ride.pickup} → {ride.drop}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:"#ef4444",marginTop:4 }}>₹{ride.fare}</div>
                </div>
              )}
              <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                <Btn variant="primary" dark={dark} onClick={()=>showToast(`Calling ${driver.name}...`,"info")} style={{ flex:1,minWidth:80 }}>📞 Call</Btn>
                <Btn variant="muted"   dark={dark} onClick={()=>showToast("Chat feature coming soon","info")} style={{ flex:1,minWidth:80 }}>💬 Chat</Btn>
                <Btn variant="outline" dark={dark} onClick={()=>showToast("🚨 Emergency alert sent! Stay safe.","error")}>🚨 SOS</Btn>
              </div>
            </div>
            {/* Map placeholder */}
            <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:22,
              height:180,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at center,rgba(239,68,68,0.08) 0%,transparent 70%)" }} />
              <div style={{ textAlign:"center",position:"relative" }}>
                <div style={{ fontSize:40,marginBottom:8,animation:"bounce 1s infinite alternate" }}>🚗</div>
                <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,color:th.text2 }}>Live tracking map</p>
                <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:th.text3 }}>Arriving in ~4 minutes</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Support Page ─────────────────────────────────────────────────────────────
function SupportPage({ showToast, dark, user }) {
  const [subject, setSubject] = useState("");
  const [msg,     setMsg]     = useState("");
  const [sending, setSending] = useState(false);
  const th = T(dark);
  const w  = useWidth();
  const isMobile = w < 768;
  const px = isMobile?"16px":w<1024?"24px":"40px";

  const send = async () => {
    if (!subject.trim() || !msg.trim()) { showToast("Fill in subject and message","error"); return; }
    setSending(true);
    try {
      await api("/support/ticket", { method:"POST", body:{
        subject, message:msg,
        name:  user?.name  || "Guest",
        email: user?.email || "",
      }});
      showToast("Message sent! We'll reply within 24 hours. 📬","success");
      setSubject(""); setMsg("");
    } catch(e) { showToast(e.message,"error"); }
    finally { setSending(false); }
  };

  return (
    <div style={{ minHeight:"100vh",background:th.bg,width:"100%",padding:`80px ${px} 60px` }}>
      <div style={{ maxWidth:700,margin:"0 auto",width:"100%" }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:isMobile?28:34,fontWeight:800,color:th.text,marginBottom:6,letterSpacing:"-1px" }}>Support Center</h2>
        <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",marginBottom:32,fontSize:14 }}>We're here 24/7 for you</p>
        <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:14,marginBottom:28 }}>
          {[["📞","Call Support","24/7 available"],["💬","Live Chat","~2 min wait"],["📧","Email Us","Reply in 24hr"]].map(([i,t,d])=>(
            <button key={t} onClick={()=>showToast(`${t} initiated — use the form below for fastest response`,"info")}
              style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:16,
                padding:isMobile?"16px 20px":"20px",cursor:"pointer",transition:"all 0.2s",
                textAlign:isMobile?"left":"center",display:isMobile?"flex":"block",gap:14,alignItems:"center" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(239,68,68,0.35)";e.currentTarget.style.transform="translateY(-2px)"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=th.border;e.currentTarget.style.transform="translateY(0)"}}>
              <div style={{ fontSize:24,marginBottom:isMobile?0:8 }}>{i}</div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:th.text,marginBottom:3 }}>{t}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:th.text2 }}>{d}</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:20,padding:isMobile?18:28 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:th.text,marginBottom:18 }}>Send a Message</h3>
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <Input label="Subject" value={subject} onChange={setSubject} icon="📝" dark={dark} />
            <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Describe your issue in detail..."
              style={{ width:"100%",minHeight:110,background:th.inputBg,border:`1.5px solid ${th.border}`,
                borderRadius:12,outline:"none",color:th.text,fontFamily:"'DM Sans',sans-serif",
                fontSize:14,padding:14,resize:"vertical",boxSizing:"border-box",transition:"border 0.2s" }}
              onFocus={e=>e.target.style.borderColor="rgba(239,68,68,0.5)"}
              onBlur={e=>e.target.style.borderColor=th.border} />
            <Btn variant="primary" dark={dark} full loading={sending} onClick={send}>Send Message →</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Pages ───────────────────────────────────────────────────────────────
function AuthPage({ mode, setPage, showToast, dark, login }) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [pass,    setPass]    = useState("");
  const [loading, setLoading] = useState(false);
  const th = T(dark);
  const w  = useWidth();
  const isMobile = w < 480;
  const isLogin = mode === "login";

  const submit = async () => {
    if (!email || !pass) { showToast("Email and password are required","error"); return; }
    if (!isLogin && !name) { showToast("Name is required","error"); return; }
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/signup";
      const body = isLogin ? { email, password:pass } : { name, email, phone, password:pass };
      const data = await api(endpoint, { method:"POST", body });
      login(data.token, data.user);
      showToast(isLogin ? `Welcome back, ${data.user.name.split(" ")[0]}! 🎉` : "Account created! Welcome to RideX 🚗","success");
      setPage("home");
    } catch(e) { showToast(e.message,"error"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh",background:th.bg,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",
      padding:isMobile?"80px 16px 40px":"80px 24px 40px",position:"relative" }}>
      <div style={{ position:"absolute",inset:0,pointerEvents:"none",
        background:"radial-gradient(ellipse 55% 55% at 50% 40%,rgba(239,68,68,0.07) 0%,transparent 60%)" }} />
      <div style={{ maxWidth:420,width:"100%",position:"relative" }}>
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div style={{ width:48,height:48,borderRadius:13,margin:"0 auto 16px",
            background:"linear-gradient(135deg,#ef4444,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:22,fontWeight:800,color:"#fff",boxShadow:"0 8px 22px rgba(239,68,68,0.38)" }}>R</div>
          <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:isMobile?24:28,fontWeight:800,color:th.text,marginBottom:8 }}>
            {isLogin?"Welcome back":"Create account"}
          </h2>
          <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:14 }}>
            {isLogin?"Sign in to your RideX account":"Join 3M+ happy riders"}
          </p>
        </div>
        <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:20,padding:isMobile?"20px":"28px",boxShadow:th.shadow }}>
          <div style={{ display:"flex",flexDirection:"column",gap:12,marginBottom:16 }}>
            {!isLogin && <Input label="Full Name" value={name} onChange={setName} icon="👤" dark={dark} />}
            <Input label="Email address" value={email} onChange={setEmail} type="email" icon="✉️" dark={dark} />
            {!isLogin && <Input label="Phone number" value={phone} onChange={setPhone} icon="📱" dark={dark} />}
            <Input label="Password" value={pass} onChange={setPass} type="password" icon="🔒" dark={dark}
              onKeyDown={e=>e.key==="Enter"&&submit()} />
          </div>
          {isLogin && (
            <div style={{ textAlign:"right",marginBottom:16 }}>
              <button onClick={()=>showToast("Password reset email sent!","info")}
                style={{ background:"none",border:"none",color:"#ef4444",fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer",fontWeight:500 }}>
                Forgot password?
              </button>
            </div>
          )}
          <Btn variant="primary" dark={dark} full loading={loading} onClick={submit} style={{ padding:"14px",fontSize:15,borderRadius:14 }}>
            {isLogin?"Sign In →":"Create Account →"}
          </Btn>
          <div style={{ textAlign:"center",marginTop:16 }}>
            <span style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:14 }}>
              {isLogin?"Don't have an account? ":"Already have an account? "}
            </span>
            <button onClick={()=>setPage(isLogin?"signup":"login")}
              style={{ background:"none",border:"none",color:"#ef4444",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,cursor:"pointer" }}>
              {isLogin?"Sign up":"Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPage({ showToast, dark, user, setPage }) {
  const [tab,      setTab]      = useState("dashboard");
  const [stats,    setStats]    = useState(null);
  const [settings, setSettings] = useState({});
  const [rides,    setRides]    = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [tickets,  setTickets]  = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [editSettings, setEditSettings] = useState({});
  const [newDriver, setNewDriver] = useState({ name:"",phone:"",car_model:"",car_color:"White",plate:"",ride_type:"sedan" });
  const th = T(dark);
  const w  = useWidth();
  const isMobile = w < 768;
  const px = isMobile?"16px":w<1024?"24px":"40px";

  useEffect(() => {
    if (!user || user.role !== "admin") { setPage("home"); return; }
    loadDashboard();
  }, [user]);

  useEffect(() => {
    if (tab==="dashboard") loadDashboard();
    if (tab==="settings")  loadSettings();
    if (tab==="rides")     loadRides();
    if (tab==="drivers")   loadDrivers();
    if (tab==="tickets")   loadTickets();
  }, [tab]);

  const loadDashboard = () => api("/admin/dashboard").then(d=>setStats(d.stats)).catch(e=>showToast(e.message,"error"));
  const loadSettings  = () => api("/admin/settings").then(d=>{setSettings(d.settings);setEditSettings(Object.fromEntries(Object.entries(d.settings).map(([k,v])=>[k,v.value])));}).catch(e=>showToast(e.message,"error"));
  const loadRides     = () => api("/admin/rides").then(d=>setRides(d.rides)).catch(e=>showToast(e.message,"error"));
  const loadDrivers   = () => api("/admin/drivers").then(d=>setDrivers(d.drivers)).catch(e=>showToast(e.message,"error"));
  const loadTickets   = () => api("/admin/tickets").then(d=>setTickets(d.tickets)).catch(e=>showToast(e.message,"error"));

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api("/admin/settings", { method:"PUT", body:editSettings });
      showToast("Settings saved successfully!","success");
      loadSettings();
    } catch(e) { showToast(e.message,"error"); }
    finally { setSaving(false); }
  };

  const addDriver = async () => {
    if (!newDriver.name||!newDriver.phone||!newDriver.car_model||!newDriver.plate) {
      showToast("Fill all driver fields","error"); return;
    }
    try {
      await api("/admin/drivers", { method:"POST", body:newDriver });
      showToast("Driver added!","success");
      setNewDriver({ name:"",phone:"",car_model:"",car_color:"White",plate:"",ride_type:"sedan" });
      loadDrivers();
    } catch(e) { showToast(e.message,"error"); }
  };

  const deleteDriver = async (id) => {
    try {
      await api(`/admin/drivers/${id}`, { method:"DELETE" });
      showToast("Driver removed","success");
      loadDrivers();
    } catch(e) { showToast(e.message,"error"); }
  };

  const updateRide = async (id, status) => {
    try {
      await api(`/admin/rides/${id}`, { method:"PATCH", body:{ status } });
      showToast(`Ride ${status}`,"success");
      loadRides();
    } catch(e) { showToast(e.message,"error"); }
  };

  const TABS = ["dashboard","settings","rides","drivers","tickets"];

  const StatCard = ({ label, value, icon, color="#ef4444" }) => (
    <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:16,padding:"18px 20px" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div>
          <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:12,marginBottom:6 }}>{label}</p>
          <p style={{ fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,color:th.text }}>{value ?? "—"}</p>
        </div>
        <div style={{ fontSize:24,opacity:0.7 }}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:th.bg,width:"100%",padding:`80px ${px} 60px` }}>
      <div style={{ maxWidth:1200,margin:"0 auto",width:"100%" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,flexWrap:"wrap",gap:12 }}>
          <div>
            <h2 style={{ fontFamily:"'Syne',sans-serif",fontSize:isMobile?24:30,fontWeight:800,color:th.text,marginBottom:4,letterSpacing:"-1px" }}>
              ⚙ Admin Panel
            </h2>
            <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:14 }}>Full control over RideX operations</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",gap:6,marginBottom:28,flexWrap:"wrap",
          background:th.bg3,borderRadius:14,padding:6,border:`1px solid ${th.border}`,width:"fit-content" }}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 16px",borderRadius:10,border:"none",cursor:"pointer",
              background:tab===t?"#ef4444":"transparent",
              color:tab===t?"#fff":th.text2,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,
              textTransform:"capitalize",transition:"all 0.2s" }}>{t}</button>
          ))}
        </div>

        {/* Dashboard */}
        {tab==="dashboard" && stats && (
          <div>
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":w<1024?"repeat(3,1fr)":"repeat(4,1fr)",gap:14,marginBottom:28 }}>
              <StatCard label="Total Users"     value={stats.totalUsers}     icon="👤" />
              <StatCard label="Total Drivers"   value={stats.totalDrivers}   icon="🚗" />
              <StatCard label="Active Drivers"  value={stats.activeDrivers}  icon="✅" />
              <StatCard label="Today's Rides"   value={stats.todayRides}     icon="📍" />
              <StatCard label="Active Rides"    value={stats.activeRides}    icon="🔴" />
              <StatCard label="Total Rides"     value={stats.totalRides}     icon="📊" />
              <StatCard label="Today Revenue"   value={`₹${stats.todayRevenue}`}  icon="💰" />
              <StatCard label="Total Revenue"   value={`₹${Math.round(stats.totalRevenue)}`} icon="💎" />
            </div>
            <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18,padding:isMobile?18:24 }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:th.text,marginBottom:16 }}>Recent Rides</h3>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {(stats.recentRides||[]).slice(0,5).map(r=>(
                  <div key={r.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"10px 14px",background:th.bg3,borderRadius:10,flexWrap:"wrap",gap:8 }}>
                    <div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:th.text }}>
                        {r.pickup?.slice(0,20)} → {r.drop_location?.slice(0,20)}
                      </div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:th.text2 }}>
                        {r.user_name} • {r.ride_type}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:th.text }}>₹{r.fare}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:th.text2,textTransform:"capitalize" }}>{r.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {tab==="settings" && (
          <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18,padding:isMobile?18:28 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12 }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:th.text }}>Pricing & System Settings</h3>
              <Btn variant="primary" dark={dark} loading={saving} onClick={saveSettings}>💾 Save All</Btn>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":w<1024?"1fr 1fr":"1fr 1fr 1fr",gap:16 }}>
              {Object.entries(settings).map(([key,meta])=>(
                <div key={key} style={{ background:th.bg3,border:`1px solid ${th.border}`,borderRadius:12,padding:16 }}>
                  <label style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:th.text2,display:"block",marginBottom:8 }}>
                    {meta.label || key}
                  </label>
                  <input value={editSettings[key]??""} onChange={e=>setEditSettings(p=>({...p,[key]:e.target.value}))}
                    style={{ width:"100%",background:th.inputBg,border:`1.5px solid ${th.border}`,borderRadius:8,
                      outline:"none",color:th.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,fontWeight:600,
                      padding:"8px 12px",boxSizing:"border-box" }}
                    onFocus={e=>e.target.style.borderColor="rgba(239,68,68,0.5)"}
                    onBlur={e=>e.target.style.borderColor=th.border} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rides */}
        {tab==="rides" && (
          <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18,padding:isMobile?16:24 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:th.text,marginBottom:20 }}>All Rides</h3>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {rides.map(r=>(
                <div key={r.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"12px 16px",background:th.bg3,borderRadius:12,flexWrap:"wrap",gap:10 }}>
                  <div style={{ minWidth:0,flex:1 }}>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,color:th.text }}>
                      {r.pickup?.slice(0,25)} → {r.drop_location?.slice(0,25)}
                    </div>
                    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:th.text2 }}>
                      {r.user_name} • {r.ride_type} • ₹{r.fare} • {r.status}
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    {r.status==="confirmed" && <Btn variant="green" small dark={dark} onClick={()=>updateRide(r.id,"completed")}>Complete</Btn>}
                    {!["cancelled","completed"].includes(r.status) && <Btn variant="outline" small dark={dark} onClick={()=>updateRide(r.id,"cancelled")}>Cancel</Btn>}
                  </div>
                </div>
              ))}
              {rides.length===0 && <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",textAlign:"center",padding:"20px" }}>No rides found</p>}
            </div>
          </div>
        )}

        {/* Drivers */}
        {tab==="drivers" && (
          <div>
            <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18,padding:isMobile?18:24,marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:th.text,marginBottom:16 }}>Add New Driver</h3>
              <div style={{ display:"grid",gridTemplateColumns:isMobile?"1fr":w<1024?"1fr 1fr":"repeat(3,1fr)",gap:12,marginBottom:14 }}>
                {[["name","Name"],["phone","Phone"],["car_model","Car Model"],["car_color","Car Color"],["plate","Plate No."]].map(([k,l])=>(
                  <div key={k} style={{ display:"flex",alignItems:"center",background:th.inputBg,border:`1.5px solid ${th.border}`,borderRadius:12,overflow:"hidden" }}>
                    <input placeholder={l} value={newDriver[k]} onChange={e=>setNewDriver(p=>({...p,[k]:e.target.value}))}
                      style={{ flex:1,background:"transparent",border:"none",outline:"none",color:th.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,padding:"12px 14px" }} />
                  </div>
                ))}
                <select value={newDriver.ride_type} onChange={e=>setNewDriver(p=>({...p,ride_type:e.target.value}))}
                  style={{ background:th.inputBg,border:`1.5px solid ${th.border}`,borderRadius:12,outline:"none",color:th.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,padding:"12px 14px" }}>
                  {["mini","sedan","suv","premium"].map(t=><option key={t} value={t} style={{ background:dark?"#0f1320":"#fff" }}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <Btn variant="primary" dark={dark} onClick={addDriver}>+ Add Driver</Btn>
            </div>

            <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18,padding:isMobile?16:24 }}>
              <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:th.text,marginBottom:16 }}>All Drivers ({drivers.length})</h3>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                {drivers.map(d=>(
                  <div key={d.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"12px 16px",background:th.bg3,borderRadius:12,flexWrap:"wrap",gap:10 }}>
                    <div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,color:th.text }}>{d.name}</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:th.text2 }}>
                        {d.car_model} • {d.plate} • {d.ride_type} • ⭐{d.rating} • {d.status}
                      </div>
                    </div>
                    <Btn variant="outline" small dark={dark} onClick={()=>deleteDriver(d.id)}>Remove</Btn>
                  </div>
                ))}
                {drivers.length===0 && <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",textAlign:"center",padding:"20px" }}>No drivers yet</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tickets */}
        {tab==="tickets" && (
          <div style={{ background:th.cardBg,border:`1px solid ${th.border}`,borderRadius:18,padding:isMobile?16:24 }}>
            <h3 style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,color:th.text,marginBottom:20 }}>Support Tickets ({tickets.length})</h3>
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {tickets.map(t=>(
                <div key={t.id} style={{ background:th.bg3,border:`1px solid ${th.border}`,borderRadius:12,padding:16 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:8 }}>
                    <span style={{ fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:th.text }}>{t.subject}</span>
                    <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,padding:"3px 10px",borderRadius:100,
                      background:t.status==="open"?"rgba(239,68,68,0.1)":"rgba(34,197,94,0.1)",
                      color:t.status==="open"?"#ef4444":"#22c55e" }}>{t.status}</span>
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:th.text2,marginBottom:6 }}>
                    From: {t.name} ({t.email})
                  </div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:th.text,marginBottom:t.reply?8:0 }}>{t.message}</div>
                  {t.reply && (
                    <div style={{ background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,padding:"8px 12px",marginTop:8 }}>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:"#ef4444",marginBottom:4 }}>📝 Reply sent:</div>
                      <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:th.text2 }}>{t.reply}</div>
                    </div>
                  )}
                </div>
              ))}
              {tickets.length===0 && <p style={{ color:th.text2,fontFamily:"'DM Sans',sans-serif",textAlign:"center",padding:"20px" }}>No tickets yet</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ dark }) {
  const th = T(dark);
  const w  = useWidth();
  const isMobile = w < 640;
  const isTablet = w < 1024;
  const px = isMobile?"16px":isTablet?"24px":"40px";
  const cols = isMobile?"1fr":isTablet?"1fr 1fr":"2fr 1fr 1fr 1fr";
  return (
    <footer style={{ background:dark?"#060810":th.bg2,borderTop:`1px solid ${th.border}`,padding:`50px ${px} 28px`,width:"100%" }}>
      <div style={{ maxWidth:1400,margin:"0 auto",width:"100%" }}>
        <div style={{ display:"grid",gridTemplateColumns:cols,gap:40,marginBottom:40 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
              <div style={{ width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#ef4444,#f97316)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#fff",fontSize:15 }}>R</div>
              <span style={{ fontFamily:"'Syne',sans-serif",fontSize:19,fontWeight:800,color:th.text }}>Ride<span style={{ color:"#ef4444" }}>X</span></span>
            </div>
            <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:th.text2,lineHeight:1.7,maxWidth:260,marginBottom:18 }}>
              Premium cab service delivering safe, comfortable rides across India's top cities.
            </p>
          </div>
          {!isMobile && [["Company",["About","Careers","Press","Blog"]],["Product",["Book Ride","My Rides","Driver App","Business"]],["Support",["Help Center","Safety","Terms","Privacy"]]].map(([title,items])=>(
            <div key={title}>
              <h4 style={{ fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:th.text,marginBottom:14 }}>{title}</h4>
              <div style={{ display:"flex",flexDirection:"column",gap:9 }}>
                {items.map(item=>(
                  <button key={item} style={{ background:"none",border:"none",textAlign:"left",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:th.text3,cursor:"pointer",padding:0 }}
                    onMouseEnter={e=>e.currentTarget.style.color=th.text} onMouseLeave={e=>e.currentTarget.style.color=th.text3}>{item}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop:`1px solid ${th.border}`,paddingTop:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10 }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:th.text3 }}>© 2026 RideX Technologies. All rights reserved.</span>
          <div style={{ display:"flex",gap:14 }}>
            {["Twitter","LinkedIn","Instagram"].map(s=>(
              <button key={s} style={{ background:"none",border:"none",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:th.text3,cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color=th.text3}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page,  setPage] = useState("home");
  const [dark,  setDark] = useState(true);
  const [toasts,setToasts]=useState([]);
  const { user, loading, login, logout } = useAuth();
  const th = T(dark);

  const showToast = useCallback((msg, type="success") => {
    const id = Date.now();
    setToasts(p=>[...p,{ id, msg, type }]);
  }, []);

  if (loading) return (
    <div style={{ minHeight:"100vh",background:"#090b14",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,#ef4444,#f97316)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",margin:"0 auto 16px" }}>R</div>
        <div style={{ color:"rgba(248,250,252,0.5)",fontFamily:"'DM Sans',sans-serif",fontSize:14 }}>Loading...</div>
      </div>
    </div>
  );

  const props = { showToast, dark, user, setPage };

  return (
    <div style={{ background:th.bg,minHeight:"100vh",width:"100vw",maxWidth:"100vw",overflowX:"hidden",transition:"background 0.35s",position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { width:100%; min-height:100%; overflow-x:hidden; margin:0; padding:0; }
        body { width:100%; min-height:100vh; overflow-x:hidden; margin:0; padding:0; background:inherit; }
        #root { width:100%; min-height:100vh; }
        #root > div { width:100% !important; }
        section, footer, nav { width:100% !important; box-sizing:border-box; }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce  { from{transform:translateY(0)} to{transform:translateY(-8px)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:${th.bg}; }
        ::-webkit-scrollbar-thumb { background:rgba(239,68,68,0.4); border-radius:4px; }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator { filter:${dark?"invert(1)":"none"}; opacity:0.5; cursor:pointer; }
        button { cursor:pointer; }
      `}</style>

      <GlowCursor />
      <Navbar page={page} setPage={setPage} dark={dark} setDark={setDark} user={user} logout={logout} />

      {page==="home"    && <><Hero {...props} /><Features dark={dark} /><Footer dark={dark} /></>}
      {page==="book"    && <BookPage    {...props} login={login} />}
      {page==="rides"   && <RidesPage   {...props} />}
      {page==="driver"  && <DriverPage  {...props} />}
      {page==="support" && <SupportPage {...props} />}
      {page==="login"   && <AuthPage mode="login"  {...props} login={login} />}
      {page==="signup"  && <AuthPage mode="signup" {...props} login={login} />}
      {page==="admin"   && <AdminPage   {...props} />}

      {/* Toast stack */}
      <div style={{ position:"fixed",bottom:24,right:24,zIndex:10000,display:"flex",flexDirection:"column",gap:10,maxWidth:"calc(100vw - 48px)" }}>
        {toasts.map(t=>(
          <Toast key={t.id} msg={t.msg} type={t.type} dark={dark}
            onClose={()=>setToasts(p=>p.filter(x=>x.id!==t.id))} />
        ))}
      </div>
    </div>
  );
}
