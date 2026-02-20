import { useState, useEffect, useRef } from "react";
// Version: 2.0.1 - Cache Bust

// API calls are proxied through our FastAPI backend to keep the API key secure.
const callClaude = async (systemPrompt, userMessage) => {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userMessage }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Backend error");
  }
  const data = await res.json();
  return data.text || "No response.";
};

const fonts = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');`;

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080808; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #c9a84c; }
  .app {
    min-height: 100vh;
    background: #080808;
    color: #e8e0d0;
    font-family: 'DM Mono', monospace;
    position: relative;
    overflow-x: hidden;
  }
  .grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  }
  .sidebar {
    position: fixed; left: 0; top: 0; bottom: 0; width: 220px;
    background: #0d0d0d;
    border-right: 1px solid #1e1e1e;
    z-index: 100;
    display: flex; flex-direction: column;
  }
  .logo {
    padding: 28px 20px 20px;
    border-bottom: 1px solid #1e1e1e;
  }
  .logo-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px; letter-spacing: 3px;
    color: #c9a84c;
    line-height: 1;
  }
  .logo-sub {
    font-size: 9px; color: #555; letter-spacing: 2px;
    margin-top: 4px;
    text-transform: uppercase;
  }
  .nav { padding: 16px 0; flex: 1; overflow-y: auto; }
  .nav-section { padding: 8px 20px 4px; font-size: 8px; color: #444; letter-spacing: 3px; text-transform: uppercase; }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 20px;
    cursor: pointer;
    font-size: 11px; letter-spacing: 1px;
    color: #666;
    transition: all 0.2s;
    border-left: 2px solid transparent;
    text-transform: uppercase;
  }
  .nav-item:hover { color: #e8e0d0; background: #141414; }
  .nav-item.active { color: #c9a84c; border-left-color: #c9a84c; background: #141414; }
  .nav-icon { font-size: 14px; width: 18px; text-align: center; }
  .main { margin-left: 220px; padding: 32px 36px; min-height: 100vh; }
  .page-header { margin-bottom: 32px; }
  .page-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px; font-weight: 300;
    color: #f0e8d8; letter-spacing: 1px;
    line-height: 1;
  }
  .page-title span { color: #c9a84c; }
  .page-sub { font-size: 10px; color: #555; letter-spacing: 2px; margin-top: 8px; text-transform: uppercase; }
  .divider { height: 1px; background: linear-gradient(90deg, #c9a84c33, transparent); margin: 16px 0 28px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .card {
    background: #0f0f0f;
    border: 1px solid #1a1a1a;
    border-radius: 2px;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, #c9a84c44, transparent);
  }
  .card-title {
    font-size: 9px; color: #666; letter-spacing: 3px;
    text-transform: uppercase; margin-bottom: 16px;
  }
  .card-title span { color: #c9a84c; }
  .stat-num {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 48px; color: #c9a84c;
    line-height: 1;
  }
  .stat-label { font-size: 9px; color: #555; letter-spacing: 2px; margin-top: 4px; text-transform: uppercase; }
  .stat-change { font-size: 10px; color: #4ade80; margin-top: 6px; }
  .stat-change.down { color: #f87171; }
  .btn {
    padding: 10px 20px;
    font-family: 'DM Mono', monospace;
    font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }
  .btn-gold {
    background: #c9a84c;
    color: #080808;
  }
  .btn-gold:hover { background: #e0be68; }
  .btn-outline {
    background: transparent;
    color: #c9a84c;
    border: 1px solid #c9a84c33;
  }
  .btn-outline:hover { border-color: #c9a84c; background: #c9a84c11; }
  .btn-ghost {
    background: transparent;
    color: #555;
    border: 1px solid #222;
  }
  .btn-ghost:hover { color: #e8e0d0; border-color: #444; }
  input, textarea, select {
    background: #0a0a0a;
    border: 1px solid #222;
    color: #e8e0d0;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    padding: 10px 14px;
    width: 100%;
    outline: none;
    transition: border 0.2s;
    border-radius: 0;
  }
  input:focus, textarea:focus, select:focus { border-color: #c9a84c44; }
  select option { background: #111; }
  label { font-size: 9px; color: #555; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 6px; }
  .form-group { margin-bottom: 16px; }
  .progress-bar {
    height: 3px;
    background: #1a1a1a;
    border-radius: 1px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #c9a84c, #e0be68);
    transition: width 0.8s ease;
  }
  .progress-fill.green { background: linear-gradient(90deg, #22c55e, #4ade80); }
  .progress-fill.blue { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  .progress-fill.red { background: linear-gradient(90deg, #ef4444, #f87171); }
  .tag {
    display: inline-block;
    padding: 3px 8px;
    font-size: 9px; letter-spacing: 1px;
    text-transform: uppercase;
    border-radius: 1px;
    margin: 2px;
  }
  .tag-gold { background: #c9a84c22; color: #c9a84c; border: 1px solid #c9a84c33; }
  .tag-green { background: #22c55e22; color: #4ade80; border: 1px solid #22c55e33; }
  .tag-blue { background: #3b82f622; color: #60a5fa; border: 1px solid #3b82f633; }
  .tag-red { background: #ef444422; color: #f87171; border: 1px solid #ef444433; }
  .tag-gray { background: #22222288; color: #888; border: 1px solid #333; }
  .ai-box {
    background: #0a0a0a;
    border: 1px solid #c9a84c22;
    padding: 20px;
    border-radius: 2px;
    position: relative;
  }
  .ai-box::before {
    content: 'AI ANALYSIS';
    position: absolute; top: -1px; left: 16px;
    background: #0a0a0a;
    color: #c9a84c; font-size: 8px; letter-spacing: 3px;
    padding: 0 8px; transform: translateY(-50%);
  }
  .ai-text { font-size: 12px; line-height: 1.8; color: #aaa; white-space: pre-wrap; }
  .loading-dots::after {
    content: '...';
    animation: dots 1.5s infinite;
  }
  @keyframes dots {
    0% { content: '.'; } 33% { content: '..'; } 66% { content: '...'; }
  }
  .film-strip {
    display: flex; gap: 2px; margin: 12px 0;
  }
  .film-frame {
    flex: 1; height: 4px;
    background: #1a1a1a;
    border-radius: 1px;
    transition: background 0.3s;
  }
  .film-frame.filled { background: #c9a84c; }
  .chart-bar {
    display: flex; align-items: flex-end; gap: 6px;
    height: 80px;
  }
  .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .bar-fill {
    width: 100%; border-radius: 1px 1px 0 0;
    background: linear-gradient(180deg, #c9a84c, #9a7a2a);
    transition: height 0.8s ease;
    min-height: 2px;
  }
  .bar-label { font-size: 8px; color: #555; letter-spacing: 1px; text-align: center; }
  .timeline { position: relative; padding-left: 20px; }
  .timeline::before { content: ''; position: absolute; left: 6px; top: 0; bottom: 0; width: 1px; background: #222; }
  .timeline-item { position: relative; margin-bottom: 20px; }
  .timeline-dot {
    position: absolute; left: -17px; top: 4px;
    width: 8px; height: 8px; border-radius: 50%;
    background: #c9a84c; border: 2px solid #080808;
  }
  .timeline-dot.gray { background: #333; }
  .timeline-title { font-size: 11px; color: #e8e0d0; letter-spacing: 1px; }
  .timeline-sub { font-size: 9px; color: #555; margin-top: 2px; }
  .platform-score {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 0; border-bottom: 1px solid #141414;
  }
  .platform-name { font-size: 11px; color: #e8e0d0; letter-spacing: 1px; }
  .score-badge {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px;
    width: 40px; text-align: right;
  }
  .score-high { color: #4ade80; }
  .score-mid { color: #c9a84c; }
  .score-low { color: #f87171; }
  .film-card {
    border: 1px solid #1a1a1a; padding: 16px;
    cursor: pointer; transition: all 0.2s;
    position: relative; overflow: hidden;
  }
  .film-card:hover { border-color: #c9a84c33; background: #111; }
  .film-card.selected { border-color: #c9a84c; background: #111; }
  .radar {
    width: 100%; max-width: 240px; margin: 0 auto;
    display: block;
  }
  .chat-messages {
    height: 300px; overflow-y: auto;
    padding: 16px; display: flex; flex-direction: column; gap: 12px;
  }
  .msg { max-width: 85%; }
  .msg.user { align-self: flex-end; }
  .msg.ai { align-self: flex-start; }
  .msg-bubble {
    padding: 10px 14px; font-size: 11px; line-height: 1.7;
  }
  .msg.user .msg-bubble { background: #c9a84c; color: #080808; }
  .msg.ai .msg-bubble { background: #141414; color: #aaa; border: 1px solid #222; }
  .msg-label { font-size: 8px; color: #444; letter-spacing: 2px; margin-bottom: 4px; }
  .msg.user .msg-label { text-align: right; }
  .chat-input-row { display: flex; gap: 0; }
  .chat-input-row input { flex: 1; }
  .chat-input-row .btn { white-space: nowrap; border-left: none; }
  .tab-row { display: flex; gap: 0; border-bottom: 1px solid #1a1a1a; margin-bottom: 24px; }
  .tab {
    padding: 10px 18px;
    font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    cursor: pointer; color: #555;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  .tab:hover { color: #e8e0d0; }
  .tab.active { color: #c9a84c; border-bottom-color: #c9a84c; }
  .badge {
    display: inline-block; padding: 2px 6px;
    font-size: 8px; letter-spacing: 1px; text-transform: uppercase;
    background: #c9a84c22; color: #c9a84c;
    border: 1px solid #c9a84c44; border-radius: 1px;
    vertical-align: middle; margin-left: 6px;
  }
  .unique-badge {
    display: inline-block; padding: 2px 6px;
    font-size: 7px; letter-spacing: 2px;
    background: #7c3aed22; color: #a78bfa;
    border: 1px solid #7c3aed44; border-radius: 1px;
    text-transform: uppercase;
  }
  .notification {
    position: fixed; top: 20px; right: 20px;
    background: #c9a84c; color: #080808;
    padding: 10px 16px; font-size: 10px; letter-spacing: 1px;
    z-index: 9999; animation: slideIn 0.3s ease;
  }
  @keyframes slideIn { from { transform: translateX(120%); } to { transform: translateX(0); } }
  .hero-stat { text-align: center; padding: 20px; }
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .cal-day {
    aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: #555; cursor: pointer;
    border-radius: 1px; transition: all 0.2s;
    border: 1px solid transparent;
  }
  .cal-day:hover { background: #1a1a1a; color: #e8e0d0; }
  .cal-day.optimal { background: #22c55e22; color: #4ade80; border-color: #22c55e33; }
  .cal-day.risky { background: #ef444422; color: #f87171; border-color: #ef444433; }
  .cal-day.moderate { background: #c9a84c22; color: #c9a84c; border-color: #c9a84c33; }
  .cal-day.selected-day { border-color: #c9a84c; background: #c9a84c; color: #080808; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fadeUp 0.4s ease forwards; }
`;

const NAV = [
  { id: "dashboard", icon: "◈", label: "Overview" },
  { id: "audience", icon: "⬡", label: "Audience DNA", unique: true },
  { id: "campaign", icon: "◎", label: "Campaign ROI" },
  { id: "distribution", icon: "⬢", label: "Distribution" },
  { id: "festival", icon: "◆", label: "Festival Radar" },
  { id: "release", icon: "⊕", label: "Release Timing" },
  { id: "comps", icon: "⊞", label: "Film Comps", unique: true },
  { id: "advisor", icon: "◉", label: "AI Advisor" },
];

// FILM_PRESETS moved to backend

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [film, setFilm] = useState(null);
  const [notification, setNotification] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "ai", text: "Hello, I'm your film strategy advisor. Ask me anything about marketing, distribution, festival strategy, or audience targeting for your project." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [campaignChannel, setCampaignChannel] = useState({ social: 40, influencer: 25, ott: 20, press: 15 });
  const [releaseTab, setReleaseTab] = useState("calendar");
  const [selectedDay, setSelectedDay] = useState(null);
  const [audienceTab, setAudienceTab] = useState("profile");

  // Real-time states
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingApp, setLoadingApp] = useState(false);
  const [audienceDataMap, setAudienceDataMap] = useState({});
  const [platformsDataMap, setPlatformsDataMap] = useState({});
  const [festivalsData, setFestivalsData] = useState([]);
  const [compsData, setCompsData] = useState([]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    console.log("App mounted. setAudienceDataMap is:", typeof setAudienceDataMap === 'function' ? 'defined' : 'undefined');
  }, []);

  const analyzeFilm = async (title) => {
    if (!title) return;
    setLoadingApp(true);
    setNotification(`Gathering real-time intelligence for "${title}"...`);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();

      setFilm(data.film);
      if (typeof setAudienceDataMap === 'function') {
        setAudienceDataMap({ [data.film.genre]: data.audience });
      }
      if (typeof setPlatformsDataMap === 'function') {
        setPlatformsDataMap({ [data.film.genre]: data.platforms });
      }
      if (typeof setFestivalsData === 'function') {
        setFestivalsData(data.festivals);
      }
      if (typeof setCompsData === 'function') {
        setCompsData(data.comps);
      }
      setNotification("Analysis Complete");
    } catch (err) {
      console.error(err);
      setNotification("Failed to analyze film");
    } finally {
      setLoadingApp(false);
    }
  };

  // Optional: Auto-load a generic example on start
  useEffect(() => {
    if (!film) {
      analyzeFilm("Dangal");
    }
  }, []);

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const runAI = async (system, prompt, setter) => {
    setAiLoading(true);
    setter("");
    const result = await callClaude(system, prompt);
    setter(result);
    setAiLoading(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(h => [...h, { role: "user", text: userMsg }]);
    const context = `Film: "${film.title}" | Genre: ${film.genre} | Budget: ${film.budget} | Language: ${film.lang} | Themes: ${film.themes} | Target Region: ${film.region}`;
    const system = `You are an expert film marketing and distribution strategist for Indian cinema with deep knowledge of OTT platforms, theatrical distribution, film festivals, audience analytics, and digital marketing. Be concise, tactical, and data-informed. Context: ${context}`;
    const result = await callClaude(system, userMsg);
    setChatHistory(h => [...h, { role: "ai", text: result }]);
  };

  // Data moved to backend

  const calendarData = Array.from({ length: 35 }, (_, i) => {
    const day = i - 3;
    if (day <= 0 || day > 31) return null;
    const risky = [7, 8, 14, 15, 21, 22, 28, 29].includes(day);
    const optimal = [3, 4, 10, 17, 24].includes(day);
    return { day, type: risky ? "risky" : optimal ? "optimal" : "moderate" };
  });

  if (loadingApp || !film) return <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "#c9a84c", background: "#080808" }}>Loading Data...</div>;

  const audienceForGenre = (audienceDataMap && audienceDataMap[film.genre]) || (audienceDataMap && audienceDataMap["Drama"]) || { segments: [], traits: [], dna: [50, 50, 50, 50, 50, 50] };
  const platformsForGenre = (platformsDataMap && platformsDataMap[film.genre]) || (platformsDataMap && platformsDataMap["Drama"]) || [];

  const radarPath = (vals) => {
    const cx = 70, cy = 70, r = 55;
    const n = vals.length;
    const pts = vals.map((v, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const rv = (v / 100) * r;
      return [cx + rv * Math.cos(angle), cy + rv * Math.sin(angle)];
    });
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + " Z";
  };

  const radarAxes = (vals) => {
    const cx = 70, cy = 70, r = 55;
    const labels = ["Emotion", "Action", "Visual", "Story", "Comedy", "Drama"];
    return vals.map((_, i) => {
      const angle = (i / vals.length) * 2 * Math.PI - Math.PI / 2;
      const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
      const lx = cx + (r + 12) * Math.cos(angle), ly = cy + (r + 12) * Math.sin(angle);
      return { x1: cx, y1: cy, x2: x, y2: y, lx, ly, label: labels[i] };
    });
  };

  const dna = audienceForGenre?.dna || [50, 50, 50, 50, 50, 50];

  return (
    <>
      <style>{fonts + css}</style>
      {notification && <div className="notification">{notification}</div>}
      <div className="grain" />
      <div className="app">
        <aside className="sidebar">
          <div className="logo">
            <div className="logo-title">CINTEL</div>
            <div className="logo-sub">Film Intelligence Platform</div>
          </div>
          <nav className="nav">
            <div className="nav-section">Modules</div>
            {NAV.map(n => (
              <div key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                <span className="nav-icon">{n.icon}</span>
                <span>{n.label}</span>
                {n.unique && <span className="unique-badge" style={{ marginLeft: "auto", fontSize: "6px", padding: "1px 4px" }}>AI</span>}
              </div>
            ))}
            <div className="nav-section" style={{ marginTop: 20 }}>Project</div>
            <div style={{ padding: "8px 20px" }}>
              <input
                type="text"
                placeholder="Search any movie title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    analyzeFilm(searchQuery);
                    setSearchQuery("");
                  }
                }}
                style={{ marginBottom: 8 }}
              />
              <button className="btn btn-outline" style={{ width: "100%", padding: "6px" }} onClick={() => {
                analyzeFilm(searchQuery);
                setSearchQuery("");
              }}>
                {loadingApp ? "Analyzing..." : "Generate Insights"}
              </button>
            </div>
            <div style={{ padding: "4px 20px 16px" }}>
              {[["Genre", film.genre], ["Budget", film.budget], ["Region", film.region]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #141414" }}>
                  <span style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>{k}</span>
                  <span style={{ fontSize: 9, color: "#c9a84c", letterSpacing: 1 }}>{v}</span>
                </div>
              ))}
            </div>
          </nav>
        </aside>

        <main className="main">
          {page === "dashboard" && (
            <div className="fade-up">
              <div className="page-header">
                <div className="page-title">Producer <span>Intelligence</span></div>
                <div className="page-sub">Overview — {film.title}</div>
              </div>
              <div className="divider" />
              <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                  { num: "87", label: "Audience Fit Score", change: "+12 vs avg", up: true },
                  { num: "3.2x", label: "Projected Campaign ROI", change: "Based on comps", up: true },
                  { num: "6", label: "Festivals Matched", change: "2 high priority", up: true },
                  { num: "₹3.4Cr", label: "Est. OTT Deal Value", change: "Netflix + Prime", up: true },
                ].map((s, i) => (
                  <div key={i} className="card hero-stat">
                    <div className="stat-num">{s.num}</div>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-change">{s.change}</div>
                  </div>
                ))}
              </div>
              <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card">
                  <div className="card-title">Audience Reach by Channel</div>
                  <div className="chart-bar">
                    {[["Social", 72], ["OTT Promo", 65], ["Festivals", 48], ["Press", 38], ["Influencer", 55], ["Trailer", 90]].map(([l, v]) => (
                      <div key={l} className="bar-col">
                        <div className="bar-fill" style={{ height: `${v * 0.8}%` }} />
                        <div className="bar-label">{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div className="film-strip">
                      {Array.from({ length: 24 }, (_, i) => <div key={i} className={`film-frame ${i < 17 ? "filled" : ""}`} />)}
                    </div>
                    <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>OVERALL VISIBILITY SCORE — 71%</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Strategic <span>Action Items</span></div>
                  <div className="timeline">
                    {[
                      { title: "Submit to MAMI Mumbai", sub: "Deadline in 18 days — Match: 94%", done: false },
                      { title: "Lock Trailer Cut", sub: "Target: 90s emotional hook", done: false },
                      { title: "Engage 3 Micro-Influencers", sub: "Film culture niche — ₹40K budget", done: true },
                      { title: "OTT Pitch Deck Ready", sub: "Netflix + MUBI priority", done: true },
                      { title: "Press Kit Distribution", sub: "15 film journalists targeted", done: false },
                    ].map((item, i) => (
                      <div key={i} className="timeline-item">
                        <div className={`timeline-dot ${item.done ? "" : "gray"}`} />
                        <div className="timeline-title" style={{ color: item.done ? "#555" : "#e8e0d0", textDecoration: item.done ? "line-through" : "none" }}>{item.title}</div>
                        <div className="timeline-sub">{item.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Quick <span>AI Insight</span></div>
                <button className="btn btn-gold" onClick={() => runAI(
                  "You are a film marketing strategist. Give a sharp 3-point executive summary for a film producer.",
                  `Film: "${film.title}", Genre: ${film.genre}, Budget: ${film.budget}, Language: ${film.lang}, Themes: ${film.themes}, Region: ${film.region}. Give 3 key strategic priorities for this film's marketing and distribution in the Indian market.`
                )} style={{ marginBottom: 16 }}>
                  {aiLoading ? "Analyzing..." : "Generate AI Brief"}
                </button>
                {(aiLoading || aiResult) && (
                  <div className="ai-box">
                    <div className="ai-text">{aiLoading ? <span className="loading-dots">Thinking</span> : aiResult}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {page === "audience" && (
            <div className="fade-up">
              <div className="page-header">
                <div className="page-title">Audience <span>DNA</span> Profiler <span className="unique-badge">Unique</span></div>
                <div className="page-sub">Psychographic mapping — {film.title}</div>
              </div>
              <div className="divider" />
              <div className="tab-row">
                {["profile", "segments", "behavior"].map(t => <div key={t} className={`tab ${audienceTab === t ? "active" : ""}`} onClick={() => setAudienceTab(t)}>{t}</div>)}
              </div>
              {audienceTab === "profile" && (
                <div className="grid-2">
                  <div className="card">
                    <div className="card-title">Film <span>DNA Radar</span></div>
                    <svg className="radar" viewBox="0 0 140 140">
                      {[0.25, 0.5, 0.75, 1].map(r => (
                        <polygon key={r} points={radarAxes(dna).map(a => {
                          const ang = Math.atan2(a.y2 - 70, a.x2 - 70);
                          const rr = r * 55;
                          return `${70 + rr * Math.cos(ang)},${70 + rr * Math.sin(ang)}`;
                        }).join(" ")} fill="none" stroke="#1a1a1a" strokeWidth="1" />
                      ))}
                      {radarAxes(dna).map((a, i) => (
                        <g key={i}>
                          <line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="#222" strokeWidth="1" />
                          <text x={a.lx} y={a.ly} textAnchor="middle" fontSize="6" fill="#666" fontFamily="DM Mono">{a.label}</text>
                        </g>
                      ))}
                      <path d={radarPath(dna)} fill="#c9a84c22" stroke="#c9a84c" strokeWidth="1.5" />
                      {radarAxes(dna).map((a, i) => {
                        const ang = Math.atan2(a.y2 - 70, a.x2 - 70);
                        const rv = (dna[i] / 100) * 55;
                        return <circle key={i} cx={70 + rv * Math.cos(ang)} cy={70 + rv * Math.sin(ang)} r="3" fill="#c9a84c" />;
                      })}
                    </svg>
                    <div style={{ marginTop: 16 }}>
                      {["Emotion", "Action", "Visual", "Story", "Comedy", "Drama"].map((l, i) => (
                        <div key={l} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>{l}</span>
                            <span style={{ fontSize: 9, color: "#c9a84c" }}>{dna[i]}%</span>
                          </div>
                          <div className="progress-bar"><div className="progress-fill" style={{ width: `${dna[i]}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-title">Audience <span>Traits</span></div>
                    <div style={{ marginBottom: 20 }}>
                      {audienceForGenre.traits.map((t, i) => <span key={i} className="tag tag-gold">{t}</span>)}
                    </div>
                    <div className="card-title" style={{ marginTop: 20 }}>Primary Demographics</div>
                    {[["Core Age Range", "26–40 years"], ["Gender Split", "55% Female / 45% Male"], ["Location", "Tier 1 & 2 Cities"], ["Education", "Graduate+"], ["Income", "₹4–15L annual"]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #141414" }}>
                        <span style={{ fontSize: 10, color: "#666" }}>{k}</span>
                        <span style={{ fontSize: 10, color: "#e8e0d0" }}>{v}</span>
                      </div>
                    ))}
                    <button className="btn btn-gold" style={{ marginTop: 20, width: "100%" }} onClick={() => runAI(
                      "You are an audience research analyst for Indian cinema. Provide tactical audience insights.",
                      `Analyze the ideal audience for a ${film.genre} film titled "${film.title}" with themes: ${film.themes}. Give psychographic insights, consumption habits, and 3 specific ways to reach them.`
                    )}>Generate Full Audience Report</button>
                    {(aiLoading || aiResult) && <div className="ai-box" style={{ marginTop: 16 }}><div className="ai-text">{aiLoading ? <span className="loading-dots">Analyzing</span> : aiResult}</div></div>}
                  </div>
                </div>
              )}
              {audienceTab === "segments" && (
                <div className="grid-3">
                  {audienceForGenre.segments.map((seg, i) => (
                    <div key={i} className="card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div className="card-title" style={{ marginBottom: 0 }}>Segment {i + 1}</div>
                        <div style={{ fontSize: 28, fontFamily: "Bebas Neue", color: "#c9a84c" }}>{seg.size}%</div>
                      </div>
                      <div style={{ fontSize: 13, color: "#e8e0d0", fontFamily: "Cormorant Garamond", fontWeight: 600, marginBottom: 8 }}>{seg.name}</div>
                      <div style={{ fontSize: 10, color: "#666", marginBottom: 12 }}>Age: {seg.age}</div>
                      <div className="progress-bar" style={{ marginBottom: 16 }}><div className="progress-fill" style={{ width: `${seg.size}%` }} /></div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Interests</div>
                        {seg.interest.map(x => <span key={x} className="tag tag-gray">{x}</span>)}
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Platforms</div>
                        {seg.platforms.map(x => <span key={x} className="tag tag-blue">{x}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {audienceTab === "behavior" && (
                <div className="card">
                  <div className="card-title">Behavioral <span>Triggers</span> — What Moves Your Audience to Watch</div>
                  <div className="grid-2">
                    {[
                      { trigger: "Trailer Emotional Hook", impact: 88, desc: "First 15 seconds must establish emotional stakes" },
                      { trigger: "Festival Validation", impact: 74, desc: "Award or selection labels increase click-through 3x" },
                      { trigger: "Friend Recommendation", impact: 91, desc: "Word-of-mouth is #1 discovery channel for drama" },
                      { trigger: "Director Reputation", impact: 62, desc: "Known directors reduce marketing cost by 30%" },
                      { trigger: "Cast Recognition", impact: 70, desc: "Even one known face improves opening weekend" },
                      { trigger: "Review Aggregate Score", impact: 85, desc: "85%+ positive reviews = streaming success" },
                    ].map((b, i) => (
                      <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid #141414" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "#e8e0d0" }}>{b.trigger}</span>
                          <span style={{ fontSize: 11, color: b.impact > 80 ? "#4ade80" : b.impact > 65 ? "#c9a84c" : "#f87171" }}>{b.impact}/100</span>
                        </div>
                        <div className="progress-bar" style={{ marginBottom: 6 }}>
                          <div className="progress-fill" style={{ width: `${b.impact}%`, background: b.impact > 80 ? "linear-gradient(90deg,#22c55e,#4ade80)" : undefined }} />
                        </div>
                        <div style={{ fontSize: 9, color: "#555" }}>{b.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {page === "campaign" && (
            <div className="fade-up">
              <div className="page-header">
                <div className="page-title">Campaign <span>ROI</span> Simulator</div>
                <div className="page-sub">Budget optimizer — {film.title}</div>
              </div>
              <div className="divider" />
              <div className="grid-2" style={{ marginBottom: 24 }}>
                <div className="card">
                  <div className="card-title">Budget <span>Allocation</span> (% of Marketing Budget)</div>
                  {Object.entries(campaignChannel).map(([key, val]) => (
                    <div key={key} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <label style={{ marginBottom: 0, color: "#888" }}>{key.toUpperCase()}</label>
                        <span style={{ fontSize: 11, color: "#c9a84c" }}>{val}%</span>
                      </div>
                      <input type="range" min="0" max="80" value={val} onChange={e => {
                        const newVal = parseInt(e.target.value);
                        setCampaignChannel(prev => ({ ...prev, [key]: newVal }));
                      }} style={{ padding: 0, background: "transparent", border: "none", accentColor: "#c9a84c" }} />
                    </div>
                  ))}
                  <div style={{ padding: "12px 0", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 9, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>Total Allocated</span>
                    <span style={{ fontSize: 11, color: Object.values(campaignChannel).reduce((a, b) => a + b, 0) > 100 ? "#f87171" : "#4ade80" }}>
                      {Object.values(campaignChannel).reduce((a, b) => a + b, 0)}%
                    </span>
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Projected <span>Returns</span></div>
                  {Object.entries(campaignChannel).map(([key, val]) => {
                    const roi = { social: 2.8, influencer: 1.9, ott: 3.5, press: 1.4 };
                    const roiVal = (val * roi[key] / 100).toFixed(2);
                    return (
                      <div key={key} style={{ marginBottom: 12, padding: "10px 0", borderBottom: "1px solid #141414" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: "#888", letterSpacing: 1, textTransform: "uppercase" }}>{key}</span>
                          <div>
                            <span style={{ fontSize: 9, color: "#555", marginRight: 8 }}>ROI: {roi[key]}x</span>
                            <span style={{ fontSize: 11, color: "#c9a84c" }}>{roiVal}x return</span>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(val * roi[key], 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ padding: "16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>Blended Campaign ROI</div>
                      <div style={{ fontFamily: "Bebas Neue", fontSize: 36, color: "#c9a84c" }}>
                        {(Object.entries(campaignChannel).reduce((sum, [key, val]) => {
                          const roi = { social: 2.8, influencer: 1.9, ott: 3.5, press: 1.4 };
                          return sum + (val / 100) * roi[key];
                        }, 0)).toFixed(1)}x
                      </div>
                    </div>
                    <button className="btn btn-gold" onClick={() => runAI(
                      "You are a film marketing ROI expert. Analyze campaign budget allocations and give tactical recommendations.",
                      `For "${film.title}" (${film.genre}), the producer has allocated: ${JSON.stringify(campaignChannel)}% across channels. Budget: ${film.budget}. Analyze this allocation and suggest 3 specific optimizations to maximize ROI.`
                    )}>AI Optimize</button>
                  </div>
                </div>
              </div>
              {(aiLoading || aiResult) && (
                <div className="card">
                  <div className="ai-box"><div className="ai-text">{aiLoading ? <span className="loading-dots">Optimizing</span> : aiResult}</div></div>
                </div>
              )}
              <div className="card">
                <div className="card-title">Channel <span>Intelligence</span></div>
                <div className="grid-3">
                  {[
                    { ch: "Social Media", best: "Reels, Threads, YouTube Shorts", timing: "6 weeks pre-release", tip: "Behind-the-scenes drives 40% more organic reach than promotional content", icon: "◎" },
                    { ch: "OTT Promotions", best: "Pre-roll, Sponsored content", timing: "4 weeks pre-release", tip: "Partner with platform for editorial feature — free if content is exclusive", icon: "⬢" },
                    { ch: "Influencer", best: "Film critics + Micro-influencers", timing: "3 weeks pre-release", tip: "10 micro-influencers (50K followers) outperform 1 macro (2M) for niche films", icon: "⬡" },
                  ].map((c, i) => (
                    <div key={i} className="card" style={{ background: "#0a0a0a" }}>
                      <div style={{ fontFamily: "Bebas Neue", fontSize: 28, color: "#c9a84c", marginBottom: 8 }}>{c.icon} {c.ch}</div>
                      <div style={{ fontSize: 9, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Best Format</div>
                      <div style={{ fontSize: 10, color: "#aaa", marginBottom: 12 }}>{c.best}</div>
                      <div style={{ fontSize: 9, color: "#555", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Timing</div>
                      <div style={{ fontSize: 10, color: "#aaa", marginBottom: 12 }}>{c.timing}</div>
                      <div style={{ fontSize: 9, color: "#c9a84c33", padding: "8px", background: "#c9a84c11", borderLeft: "2px solid #c9a84c44" }}>
                        <span style={{ color: "#c9a84c" }}>TIP: </span>{c.tip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {page === "distribution" && (
            <div className="fade-up">
              <div className="page-header">
                <div className="page-title">Distribution <span>Intelligence</span></div>
                <div className="page-sub">Platform matching & deal simulator</div>
              </div>
              <div className="divider" />
              <div className="grid-2">
                <div className="card">
                  <div className="card-title">Platform <span>Match Scores</span></div>
                  {platformsForGenre.map((p, i) => (
                    <div key={i} className="platform-score">
                      <div>
                        <div className="platform-name">{p.name}</div>
                        <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{p.window}</div>
                        <div className="progress-bar" style={{ marginTop: 6, width: 160 }}>
                          <div className={`progress-fill ${p.score > 80 ? "green" : ""}`} style={{ width: `${p.score}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className={`score-badge ${p.score > 80 ? "score-high" : p.score > 65 ? "score-mid" : "score-low"}`}>{p.score}</div>
                        <div style={{ fontSize: 8, color: "#555", textAlign: "right" }}>{p.deal}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-title">Deal <span>Simulation</span> & Negotiation Points</div>
                  <div style={{ marginBottom: 16 }}>
                    <label>Select Platform</label>
                    <select>
                      {platformsForGenre.map(p => <option key={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label>Revenue Model Preference</label>
                    <select>
                      <option>Flat Fee (Licensing)</option>
                      <option>Revenue Share (60/40)</option>
                      <option>Hybrid (Advance + Royalty)</option>
                      <option>Day-and-Date Co-release</option>
                    </select>
                  </div>
                  <button className="btn btn-gold" style={{ marginBottom: 16 }} onClick={() => runAI(
                    "You are a film distribution expert specializing in Indian OTT deals. Provide tactical negotiation guidance.",
                    `For "${film.title}" (${film.genre}, Budget: ${film.budget}), generate 5 specific negotiation talking points a producer should use when approaching a streaming platform. Include leverage points, realistic deal terms, and red lines to avoid.`
                  )}>Simulate Negotiation</button>
                  {(aiLoading || aiResult) && <div className="ai-box"><div className="ai-text">{aiLoading ? <span className="loading-dots">Simulating</span> : aiResult}</div></div>}
                </div>
              </div>
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-title">Distribution <span>Strategy</span> Paths</div>
                <div className="grid-3">
                  {[
                    { path: "Festival → OTT", risk: "Low", roi: "High", time: "12–18 months", desc: "Build critical acclaim and awards momentum, then approach OTTs with validated content. Best for art-house and drama.", recommended: film.genre === "Drama" },
                    { path: "Theatrical → OTT", risk: "Medium", roi: "Highest", time: "8–12 months", desc: "Traditional path with theatrical window. Requires marketing investment upfront but maximizes total revenue.", recommended: film.genre === "Thriller" },
                    { path: "Direct OTT", risk: "Low", roi: "Medium", time: "3–6 months", desc: "Skip theatrical entirely. Best for limited-budget films where marketing spends can't justify multiplex competition.", recommended: false },
                  ].map((s, i) => (
                    <div key={i} className={`card ${s.recommended ? "film-card selected" : "film-card"}`} style={{ background: "#0a0a0a" }}>
                      {s.recommended && <div className="badge">Recommended</div>}
                      <div style={{ fontFamily: "Cormorant Garamond", fontSize: 18, color: "#e8e0d0", marginBottom: 8, marginTop: s.recommended ? 8 : 0 }}>{s.path}</div>
                      <div style={{ fontSize: 10, color: "#aaa", marginBottom: 12, lineHeight: 1.6 }}>{s.desc}</div>
                      {[["Risk", s.risk], ["ROI Potential", s.roi], ["Timeline", s.time]].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #141414" }}>
                          <span style={{ fontSize: 9, color: "#555" }}>{k}</span>
                          <span style={{ fontSize: 9, color: v === "High" || v === "Highest" || v === "Low" ? "#4ade80" : "#c9a84c" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {page === "festival" && (
            <div className="fade-up">
              <div className="page-header">
                <div className="page-title">Festival <span>Radar</span></div>
                <div className="page-sub">Submission strategy & match engine</div>
              </div>
              <div className="divider" />
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-title">Top Festival <span>Matches</span> for "{film.title}"</div>
                <div style={{ display: "grid", gap: 12 }}>
                  {festivalsData.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: "1px solid #141414" }}>
                      <div style={{ fontFamily: "Bebas Neue", fontSize: 32, color: f.match > 85 ? "#4ade80" : f.match > 70 ? "#c9a84c" : "#f87171", width: 60, textAlign: "center", flexShrink: 0 }}>{f.match}%</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: "#e8e0d0", fontFamily: "Cormorant Garamond", fontWeight: 600 }}>{f.name}</span>
                          <span className={`tag ${f.status === "Open" ? "tag-green" : "tag-gray"}`}>{f.status}</span>
                        </div>
                        <div style={{ fontSize: 9, color: "#555" }}>{f.category} · Fee: {f.fee} · Deadline: {f.deadline}</div>
                      </div>
                      <button className="btn btn-outline" onClick={() => notify(`Strategy generated for ${f.name}`)}>
                        Strategy →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-title">AI <span>Festival</span> Strategy</div>
                <button className="btn btn-gold" style={{ marginBottom: 16 }} onClick={() => runAI(
                  "You are a film festival submission strategist with deep knowledge of Indian and international film festivals.",
                  `For "${film.title}" (${film.genre}, themes: ${film.themes}, language: ${film.lang}, budget: ${film.budget}), create a festival submission strategy. Include: priority festivals, submission sequence, what makes this film competitive, how to craft the submission materials, and expected outcomes.`
                )}>Generate Festival Strategy</button>
                {(aiLoading || aiResult) && <div className="ai-box"><div className="ai-text">{aiLoading ? <span className="loading-dots">Strategizing</span> : aiResult}</div></div>}
              </div>
            </div>
          )}

          {page === "release" && (
            <div className="fade-up">
              <div className="page-header">
                <div className="page-title">Release <span>Window</span> Optimizer</div>
                <div className="page-sub">Competition analysis & timing intelligence</div>
              </div>
              <div className="divider" />
              <div className="tab-row">
                {["calendar", "competition", "analysis"].map(t => <div key={t} className={`tab ${releaseTab === t ? "active" : ""}`} onClick={() => setReleaseTab(t)}>{t}</div>)}
              </div>
              {releaseTab === "calendar" && (
                <div className="grid-2">
                  <div className="card">
                    <div className="card-title">Release <span>Calendar</span> — Next 5 Weeks</div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                      {[["optimal", "Optimal", "#4ade80"], ["moderate", "Moderate", "#c9a84c"], ["risky", "Risky (Clashes)", "#f87171"]].map(([type, label, color]) => (
                        <div key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 1, background: color + "44", border: `1px solid ${color}44` }} />
                          <span style={{ fontSize: 8, color: "#555", letterSpacing: 1 }}>{label}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
                      {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <div key={i} style={{ fontSize: 8, color: "#444", textAlign: "center", letterSpacing: 1 }}>{d}</div>)}
                    </div>
                    <div className="calendar-grid">
                      {calendarData.map((d, i) => d ? (
                        <div key={i} className={`cal-day ${d.type} ${selectedDay === d.day ? "selected-day" : ""}`} onClick={() => setSelectedDay(d.day)}>
                          {d.day}
                        </div>
                      ) : <div key={i} />)}
                    </div>
                    {selectedDay && (
                      <div style={{ marginTop: 16, padding: "12px", background: "#0a0a0a", border: "1px solid #222" }}>
                        <div style={{ fontSize: 11, color: "#e8e0d0", marginBottom: 4 }}>Week of Day {selectedDay}</div>
                        <div style={{ fontSize: 9, color: calendarData.find(d => d?.day === selectedDay)?.type === "optimal" ? "#4ade80" : calendarData.find(d => d?.day === selectedDay)?.type === "risky" ? "#f87171" : "#c9a84c" }}>
                          {calendarData.find(d => d?.day === selectedDay)?.type === "optimal" ? "✓ Strong release window — low competition" : calendarData.find(d => d?.day === selectedDay)?.type === "risky" ? "✗ Major releases competing this weekend" : "~ Moderate — check competition details"}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="card">
                    <div className="card-title">Competing <span>Releases</span></div>
                    {[
                      { title: "Big Studio Action Tentpole", week: "Week 1", budget: "₹200Cr+", threat: "High" },
                      { title: "Regional Blockbuster", week: "Week 2", budget: "₹50Cr", threat: "Medium" },
                      { title: "Holiday Family Film", week: "Week 3", budget: "₹80Cr", threat: "Low" },
                      { title: "Franchise Sequel", week: "Week 4", budget: "₹150Cr", threat: "High" },
                    ].map((c, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #141414" }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#e8e0d0" }}>{c.title}</div>
                          <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{c.week} · {c.budget}</div>
                        </div>
                        <span className={`tag ${c.threat === "High" ? "tag-red" : c.threat === "Medium" ? "tag-gold" : "tag-green"}`}>{c.threat}</span>
                      </div>
                    ))}
                    <button className="btn btn-gold" style={{ marginTop: 16, width: "100%" }} onClick={() => runAI(
                      "You are a film release strategy expert with knowledge of the Indian theatrical market.",
                      `For "${film.title}" (${film.genre}, ${film.budget} budget), recommend the optimal release timing strategy. Consider: weekday vs weekend, holiday windows, OTT vs theatrical, and how to avoid major studio competition. Give specific tactical advice.`
                    )}>AI Timing Analysis</button>
                    {(aiLoading || aiResult) && <div className="ai-box" style={{ marginTop: 16 }}><div className="ai-text">{aiLoading ? <span className="loading-dots">Analyzing</span> : aiResult}</div></div>}
                  </div>
                </div>
              )}
              {releaseTab === "competition" && (
                <div className="card">
                  <div className="card-title">Competitive <span>Landscape</span> Analysis</div>
                  <div style={{ fontSize: 11, color: "#666", lineHeight: 1.8, marginBottom: 20 }}>
                    Based on historical data and current trends, here is the competitive pressure index for each release window:
                  </div>
                  {["Week 1 (Festival)", "Week 2 (Standard)", "Week 3 (Holiday Adjacent)", "Week 4 (Mid-Month)", "Week 5 (End Month)"].map((w, i) => {
                    const scores = [82, 45, 63, 28, 55];
                    return (
                      <div key={i} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: "#888" }}>{w}</span>
                          <span style={{ fontSize: 10, color: scores[i] > 70 ? "#f87171" : scores[i] > 50 ? "#c9a84c" : "#4ade80" }}>Competition: {scores[i]}/100</span>
                        </div>
                        <div className="progress-bar">
                          <div className={`progress-fill ${scores[i] > 70 ? "red" : scores[i] < 40 ? "green" : ""}`} style={{ width: `${scores[i]}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {releaseTab === "analysis" && (
                <div className="card">
                  <div className="card-title">Historical <span>Performance</span> — Similar Films by Release Week</div>
                  <div className="chart-bar" style={{ height: 120, marginBottom: 20 }}>
                    {[["Wk1\nFest", 45], ["Wk2\nStd", 72], ["Wk3\nHol", 88], ["Wk4\nMid", 61], ["Wk5\nEnd", 54], ["Wk6\nPre-Hol", 79]].map(([l, v]) => (
                      <div key={l} className="bar-col">
                        <div className="bar-fill" style={{ height: `${v}%`, background: v > 75 ? "linear-gradient(180deg,#4ade80,#22c55e)" : undefined }} />
                        <div className="bar-label" style={{ whiteSpace: "pre-line" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>* Height = Avg box office performance of comparable films in that release window (indexed)</div>
                </div>
              )}
            </div>
          )}

          {page === "comps" && (
            <div className="fade-up">
              <div className="page-header">
                <div className="page-title">Comparable <span>Film</span> Finder <span className="unique-badge">Unique</span></div>
                <div className="page-sub">Learn from films like yours</div>
              </div>
              <div className="divider" />
              <div className="grid-2" style={{ marginBottom: 20 }}>
                {compsData.map((f, i) => (
                  <div key={i} className="card film-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ fontFamily: "Cormorant Garamond", fontSize: 18, color: "#e8e0d0", fontWeight: 600 }}>{f.title}</div>
                      <div style={{ fontFamily: "Bebas Neue", fontSize: 24, color: "#4ade80" }}>{f.roi}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <span className="tag tag-gray">{f.genre}</span>
                      <span className="tag tag-gray">{f.year}</span>
                      {f.keywords.map(k => <span key={k} className="tag tag-gold">{k}</span>)}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
                      {[["Budget", f.budget], ["Collection", f.collection], ["Strategy", f.strategy]].map(([k, v]) => (
                        <div key={k} style={{ padding: "8px 0", borderBottom: "1px solid #141414" }}>
                          <div style={{ fontSize: 8, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>{k}</div>
                          <div style={{ fontSize: 10, color: "#c9a84c", marginTop: 2 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="card-title">AI Comparable <span>Analysis</span></div>
                <button className="btn btn-gold" style={{ marginBottom: 16 }} onClick={() => runAI(
                  "You are a film analyst specializing in comparable film analysis for Indian cinema. Provide strategic insights based on comp films.",
                  `Analyze comparable films for "${film.title}" (${film.genre}, themes: ${film.themes}, budget: ${film.budget}). Based on how similar films performed, what are the 5 most important lessons this producer should apply? Be specific about what worked, what didn't, and how those lessons translate to this project.`
                )}>Generate Comp Analysis</button>
                {(aiLoading || aiResult) && <div className="ai-box"><div className="ai-text">{aiLoading ? <span className="loading-dots">Researching comps</span> : aiResult}</div></div>}
              </div>
            </div>
          )}

          {page === "advisor" && (
            <div className="fade-up">
              <div className="page-header">
                <div className="page-title">AI Strategy <span>Advisor</span></div>
                <div className="page-sub">Powered by Claude — Context-aware film intelligence</div>
              </div>
              <div className="divider" />
              <div className="grid-2" style={{ alignItems: "start" }}>
                <div className="card" style={{ display: "flex", flexDirection: "column" }}>
                  <div className="card-title">Conversation</div>
                  <div className="chat-messages">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`msg ${msg.role}`}>
                        <div className="msg-label">{msg.role === "user" ? "YOU" : "CINTEL ADVISOR"}</div>
                        <div className="msg-bubble">{msg.text}</div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ padding: "16px 0 0", borderTop: "1px solid #1a1a1a" }}>
                    <div className="chat-input-row">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendChat()}
                        placeholder="Ask about marketing, distribution, festivals..."
                      />
                      <button className="btn btn-gold" onClick={sendChat}>Send</button>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-title">Active <span>Context</span></div>
                    {[["Film", film.title], ["Genre", film.genre], ["Budget", film.budget], ["Language", film.lang], ["Themes", film.themes], ["Region", film.region]].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #141414" }}>
                        <span style={{ fontSize: 9, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>{k}</span>
                        <span style={{ fontSize: 9, color: "#c9a84c" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <div className="card-title">Quick <span>Prompts</span></div>
                    {[
                      "What's the best 8-week pre-launch marketing plan?",
                      "How should I approach Netflix India for a deal?",
                      "Which festivals should I submit to first?",
                      "What budget should I allocate for social media?",
                      "How do I build buzz without a big star cast?",
                      "What are the top mistakes indie producers make?",
                    ].map((q, i) => (
                      <button key={i} className="btn btn-ghost" style={{ width: "100%", textAlign: "left", marginBottom: 6, fontSize: 9, letterSpacing: 1 }}
                        onClick={() => { setChatInput(q); }}>
                        → {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
