"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const mockUser = { name: "Carlos Méndez", license: "PR-REF-2041", level: "National", avatar: "CM" };

const initialMatches = [
  { id: 1, date: "Mar 14", time: "6:00 PM", home: "Criollos de Caguas", away: "Mets de Guaynabo", venue: "Coliseo Roberto Clemente", role: "1st Referee", status: "pending" },
  { id: 2, date: "Mar 16", time: "4:00 PM", home: "Capitanes de Arecibo", away: "Indios de Mayagüez", venue: "Coliseo Héctor Solá Bezares", role: "Scorer", status: "accepted" },
  { id: 3, date: "Mar 19", time: "7:30 PM", home: "Santeros de Aguada", away: "Leones de Ponce", venue: "Palacio de los Deportes", role: "2nd Referee", status: "pending" },
  { id: 4, date: "Mar 22", time: "5:00 PM", home: "Vaqueros de Bayamón", away: "Criollos de Caguas", venue: "Coliseo Ruben Rodriguez", role: "1st Referee", status: "accepted" },
];

const announcements = [
  { id: 1, date: "Mar 11", title: "Mandatory rules clinic – Mar 20", body: "All certified referees must attend the FIVB rules update clinic at the FVP office in San Juan." },
  { id: 2, date: "Mar 9", title: "New digital score sheet available", body: "The updated digital score sheet v2.3 is now available in the Tools section." },
  { id: 3, date: "Mar 5", title: "Uniform reminder", body: "Please ensure your official uniform is complete before your next assignment. Black shoes required." },
];

const completedMatches = [
  { id: 10, date: "Mar 8", home: "Mets de Guaynabo", away: "Leones de Ponce", score: "3-1", role: "1st Referee", submitted: true },
  { id: 11, date: "Mar 5", home: "Vaqueros de Bayamón", away: "Indios de Mayagüez", score: "3-0", role: "Scorer", submitted: false },
];

const navItems = ["Dashboard", "Schedule", "Reports", "Tools", "Profile"];

function Badge({ status }: { status: string }) {
  const map: Record<string, [string, string, string]> = {
    pending: ["#FFF3CD", "#856404", "Pending"],
    accepted: ["#D1FAE5", "#065F46", "Accepted"],
    declined: ["#FCE8E8", "#991B1B", "Declined"],
  };
  const [bg, color, label] = map[status] || map.pending;
  return <span style={{ background: bg, color, fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4 }}>{label}</span>;
}

function RoleBadge({ role }: { role: string }) {
  return <span style={{ background: "#F3F4F6", color: "#6B7280", fontSize: 11, padding: "2px 8px", borderRadius: 4, border: "0.5px solid #E5E7EB" }}>{role}</span>;
}

function DashboardPage({ assignments, setPage }: { assignments: typeof initialMatches; setPage: (p: string) => void }) {
  const pending = assignments.filter(m => m.status === "pending").length;
  const upcoming = assignments.filter(m => m.status === "accepted").length;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {([["Upcoming", upcoming, "#E6F1FB", "#185FA5"], ["Pending", pending, "#FAEEDA", "#854F0B"], ["This Month", 7, "#EAF3DE", "#3B6D11"]] as [string, number, string, string][]).map(([label, val, bg, col]) => (
          <div key={label} style={{ background: bg, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: col, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: col }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>Upcoming assignments</h3>
          <button onClick={() => setPage("Schedule")} style={{ fontSize: 12, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}>View all →</button>
        </div>
        {assignments.slice(0, 3).map(m => (
          <div key={m.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{m.home} vs {m.away}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{m.date} · {m.time} · {m.venue}</div>
              <RoleBadge role={m.role} />
            </div>
            <Badge status={m.status} />
          </div>
        ))}
      </div>
      <div>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>Announcements</h3>
        {announcements.map(a => (
          <div key={a.id} style={{ borderLeft: "2px solid #185FA5", paddingLeft: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>{a.date}</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{a.title}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>{a.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchedulePage({ assignments, setAssignments }: { assignments: typeof initialMatches; setAssignments: React.Dispatch<React.SetStateAction<typeof initialMatches>> }) {
  const handle = (id: number, status: string) =>
    setAssignments(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 500 }}>My assignments</h3>
      {assignments.map(m => (
        <div key={m.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{m.home} vs {m.away}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{m.date} · {m.time}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{m.venue}</div>
            </div>
            <Badge status={m.status} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleBadge role={m.role} />
            {m.status === "pending" && (
              <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                <button onClick={() => handle(m.id, "accepted")} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "#D1FAE5", color: "#065F46", border: "none", cursor: "pointer" }}>✓ Accept</button>
                <button onClick={() => handle(m.id, "declined")} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "#FCE8E8", color: "#991B1B", border: "none", cursor: "pointer" }}>✕ Decline</button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsPage() {
  const [form, setForm] = useState({ match: "", sets: "3", score: "", mvp: "", incidents: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div>
      <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 500 }}>Past reports</h3>
      <div style={{ marginBottom: 20 }}>
        {completedMatches.map(m => (
          <div key={m.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{m.home} vs {m.away}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>{m.date} · {m.score} · {m.role}</div>
            </div>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: m.submitted ? "#D1FAE5" : "#FFF3CD", color: m.submitted ? "#065F46" : "#856404" }}>{m.submitted ? "Submitted" : "Draft"}</span>
          </div>
        ))}
      </div>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>Submit new report</h3>
      {submitted ? (
        <div style={{ background: "#D1FAE5", borderRadius: 10, padding: 16, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#065F46" }}>Report submitted successfully</div>
          <button onClick={() => { setSubmitted(false); setForm({ match: "", sets: "3", score: "", mvp: "", incidents: "", notes: "" }); }} style={{ marginTop: 8, fontSize: 12, color: "#065F46", background: "none", border: "none", cursor: "pointer" }}>Submit another</button>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {([["Match", "match", "e.g. Criollos vs Vaqueros – Mar 14"], ["Final Score", "score", "e.g. 3-2"], ["MVP", "mvp", "Player name (optional)"]] as [string, string, string][]).map(([label, key, ph]) => (
            <div key={key}>
              <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>{label}</label>
              <input placeholder={ph} value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Sets played</label>
            <select value={form.sets} onChange={e => set("sets", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}>
              {["3", "4", "5"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Incidents / sanctions</label>
            <textarea placeholder="Red cards, delays, protests..." value={form.incidents} onChange={e => set("incidents", e.target.value)} style={{ width: "100%", boxSizing: "border-box", height: 70, padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13, resize: "vertical" }} />
          </div>
          <button onClick={() => { if (form.match && form.score) setSubmitted(true); }} style={{ background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Submit report</button>
        </div>
      )}
    </div>
  );
}

function ToolsPage() {
  const tools = [
    { label: "FIVB official website", desc: "Rules, regulations & news", url: "https://www.fivb.com", color: "#E6F1FB", tc: "#185FA5" },
    { label: "Digital score sheet", desc: "FVP online scoring tool", url: "#", color: "#EAF3DE", tc: "#3B6D11" },
    { label: "Referee guidelines", desc: "FVP officiating handbook", url: "#", color: "#FAEEDA", tc: "#854F0B" },
    { label: "FVP federation", desc: "Federación de Voleibol de PR", url: "https://www.fvpr.net", color: "#EEEDFE", tc: "#534AB7" },
    { label: "Sanction report form", desc: "File a red/yellow card report", url: "#", color: "#FCE8E8", tc: "#991B1B" },
    { label: "Referee certification", desc: "Renewal & certification info", url: "#", color: "#E1F5EE", tc: "#0F6E56" },
  ];
  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 500 }}>Resources & tools</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {tools.map(t => (
          <a key={t.label} href={t.url} target="_blank" rel="noreferrer" style={{ background: t.color, borderRadius: 10, padding: 14, textDecoration: "none", display: "block" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: t.tc, marginBottom: 2 }}>{t.label}</div>
            <div style={{ fontSize: 11, color: t.tc, opacity: 0.8 }}>{t.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

function ProfilePage() {
  const certs = ["FIVB Level 1 – International", "FVP National Certified", "Beach Volleyball Referee"];
  return (
    <div>
      <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 16, color: "#185FA5" }}>{mockUser.avatar}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{mockUser.name}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>License #{mockUser.license}</div>
            <div style={{ fontSize: 12, color: "#185FA5", marginTop: 2 }}>{mockUser.level} Referee</div>
          </div>
        </div>
        {([["Email", "carlos.mendez@fvpr.net"], ["Phone", "+1 (787) 555-0142"], ["Region", "Metro San Juan"], ["Member since", "2017"]] as [string, string][]).map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "0.5px solid #E5E7EB", fontSize: 13 }}>
            <span style={{ color: "#6B7280" }}>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Certifications</div>
        {certs.map(c => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: "#065F46" }}>✓</span>{c}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [page, setPage] = useState("Dashboard");
  const [assignments, setAssignments] = useState(initialMatches);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const pages: Record<string, React.ReactNode> = {
    Dashboard: <DashboardPage assignments={assignments} setPage={setPage} />,
    Schedule: <SchedulePage assignments={assignments} setAssignments={setAssignments} />,
    Reports: <ReportsPage />,
    Tools: <ToolsPage />,
    Profile: <ProfilePage />,
  };

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", fontFamily: "sans-serif", paddingBottom: 72, minHeight: "100vh", background: "#F9FAFB" }}>
      <div style={{ background: "#0C447C", color: "#fff", padding: "16px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>FVP Officials Portal</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{page}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={handleLogout}
            style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", background: "none", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
          >
            Sign out
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#185FA5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>
            {mockUser.avatar}
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>{pages[page]}</div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: "#fff", borderTop: "0.5px solid #E5E7EB", display: "flex" }}>
        {navItems.map(item => (
          <button key={item} onClick={() => setPage(item)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 4px 8px", background: "none", border: "none", cursor: "pointer", color: page === item ? "#185FA5" : "#6B7280", fontSize: 10, fontWeight: page === item ? 500 : 400 }}>
            {item}
          </button>
        ))}
      </div>
    </main>
  );
}