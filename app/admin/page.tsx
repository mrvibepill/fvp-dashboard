"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Match = {
  id: number;
  home_team: string;
  away_team: string;
  venue: string;
  match_date: string;
  match_time: string;
  status: string;
};

type Profile = {
  id: string;
  full_name: string;
  role: string;
  license_number: string;
};

type Assignment = {
  id: number;
  match_id: number;
  user_id: string;
  role: string;
  status: string;
};

const navItems = ["Matches", "Assignments", "Users"];

export default function AdminPage() {
  const [tab, setTab] = useState("Matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ home_team: "", away_team: "", venue: "", match_date: "", match_time: "", status: "scheduled" });
  const [assignForm, setAssignForm] = useState({ match_id: "", user_id: "", role: "1st Referee" });
  const [msg, setMsg] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [m, p, a] = await Promise.all([
      supabase.from("matches").select("*").order("match_date"),
      supabase.from("profiles").select("*").neq("role", "admin"),
      supabase.from("assignments").select("*"),
    ]);
    if (m.data) setMatches(m.data);
    if (p.data) setProfiles(p.data);
    if (a.data) setAssignments(a.data);
    setLoading(false);
  };

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const setAF = (k: string, v: string) => setAssignForm(p => ({ ...p, [k]: v }));

  const createMatch = async () => {
  if (!form.home_team || !form.away_team || !form.match_date) {
    setMsg("Please fill in home team, away team and date!");
    return;
  }
  const { error } = await supabase.from("matches").insert([form]);
  if (error) { 
    setMsg("Error: " + error.message); 
  } else { 
    setMsg("Match created!"); 
    setForm({ home_team: "", away_team: "", venue: "", match_date: "", match_time: "", status: "scheduled" }); 
    loadData(); 
  }
};

  const deleteMatch = async (id: number) => {
    await supabase.from("matches").delete().eq("id", id);
    loadData();
  };

  const createAssignment = async () => {
    if (!assignForm.match_id || !assignForm.user_id) return;
    const { error } = await supabase.from("assignments").insert([{ ...assignForm, match_id: parseInt(assignForm.match_id) }]);
    if (!error) { setMsg("Referee assigned!"); setAssignForm({ match_id: "", user_id: "", role: "1st Referee" }); loadData(); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div style={{ padding: 32, fontFamily: "sans-serif" }}>Loading...</div>;

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", fontFamily: "sans-serif", minHeight: "100vh", background: "#F9FAFB", paddingBottom: 40 }}>
      <div style={{ background: "#0C447C", color: "#fff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>FVP Officials Portal</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Admin Panel</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => router.push("/")} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", background: "none", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Dashboard</button>
          <button onClick={handleLogout} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", background: "none", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "0.5px solid #E5E7EB", background: "#fff" }}>
        {navItems.map(item => (
          <button key={item} onClick={() => setTab(item)} style={{ flex: 1, padding: "12px 0", fontSize: 13, fontWeight: tab === item ? 500 : 400, color: tab === item ? "#185FA5" : "#6B7280", background: "none", border: "none", borderBottom: tab === item ? "2px solid #185FA5" : "2px solid transparent", cursor: "pointer" }}>
            {item}
          </button>
        ))}
      </div>

      {msg && <div style={{ background: "#D1FAE5", color: "#065F46", padding: "10px 16px", fontSize: 13 }}>{msg} <button onClick={() => setMsg("")} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", color: "#065F46" }}>✕</button></div>}

      <div style={{ padding: 16 }}>
        {tab === "Matches" && (
          <div>
            <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 500 }}>Create new match</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {([["Home team", "home_team"], ["Away team", "away_team"], ["Venue", "venue"], ["Time", "match_time"]] as [string, string][]).map(([label, key]) => (
                  <div key={key}>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>{label}</label>
                    <input placeholder={label} value={form[key as keyof typeof form]} onChange={e => setF(key, e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Date</label>
                <input type="date" value={form.match_date} onChange={e => setF("match_date", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }} />
              </div>
              <button onClick={createMatch} style={{ background: "#0C447C", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Create match</button>
            </div>

            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>All matches ({matches.length})</h3>
            {matches.length === 0 && <p style={{ color: "#6B7280", fontSize: 13 }}>No matches yet.</p>}
            {matches.map(m => (
              <div key={m.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.home_team} vs {m.away_team}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{m.match_date} · {m.match_time} · {m.venue}</div>
                </div>
                <button onClick={() => deleteMatch(m.id)} style={{ fontSize: 11, color: "#991B1B", background: "#FCE8E8", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {tab === "Assignments" && (
          <div>
            <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 500 }}>Assign referee to match</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Match</label>
                  <select value={assignForm.match_id} onChange={e => setAF("match_id", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}>
                    <option value="">Select a match...</option>
                    {matches.map(m => <option key={m.id} value={m.id}>{m.home_team} vs {m.away_team} — {m.match_date}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Referee</label>
                  <select value={assignForm.user_id} onChange={e => setAF("user_id", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}>
                    <option value="">Select a referee...</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || "Unnamed"} — {p.role}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Role in match</label>
                  <select value={assignForm.role} onChange={e => setAF("role", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}>
                    {["1st Referee", "2nd Referee", "Scorer", "Assistant Scorer"].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <button onClick={createAssignment} style={{ background: "#0C447C", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Assign referee</button>
              </div>
            </div>

            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>All assignments ({assignments.length})</h3>
            {assignments.length === 0 && <p style={{ color: "#6B7280", fontSize: 13 }}>No assignments yet.</p>}
            {assignments.map(a => {
              const match = matches.find(m => m.id === a.match_id);
              const profile = profiles.find(p => p.id === a.user_id);
              return (
                <div key={a.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{match ? `${match.home_team} vs ${match.away_team}` : "Unknown match"}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>{profile?.full_name || "Unknown referee"} — {a.role}</div>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: a.status === "accepted" ? "#D1FAE5" : "#FFF3CD", color: a.status === "accepted" ? "#065F46" : "#856404" }}>{a.status}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === "Users" && (
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>All users ({profiles.length})</h3>
            {profiles.length === 0 && <p style={{ color: "#6B7280", fontSize: 13 }}>No profiles yet. Users need to complete their profile after signing up.</p>}
            {profiles.map(p => (
              <div key={p.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.full_name || "No name set"}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>License: {p.license_number || "N/A"} · {p.role}</div>
                </div>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#E6F1FB", color: "#185FA5" }}>{p.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}