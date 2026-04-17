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
  level: string;
  region: string;
};

type Assignment = {
  id: number;
  match_id: number;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
};

type MatchReport = {
  id: number;
  user_id: string;
  match_id: number;
  sets_played: string;
  final_score: string;
  mvp: string;
  incidents: string;
  created_at: string;
};

const STATUS_CYCLE: Record<string, string> = {
  scheduled: "completed",
  completed: "cancelled",
  cancelled: "scheduled",
};

const MATCH_STATUS_STYLE: Record<string, [string, string]> = {
  scheduled:  ["#E6F1FB", "#185FA5"],
  completed:  ["#D1FAE5", "#065F46"],
  cancelled:  ["#FCE8E8", "#991B1B"],
};

const navItems = ["Dashboard", "Matches", "Assignments", "Reports", "Users"];

export default function AdminPage() {
  const [tab, setTab] = useState("Dashboard");
  const [matches, setMatches] = useState<Match[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reports, setReports] = useState<MatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [form, setForm] = useState({
    home_team: "", away_team: "", venue: "", match_date: "", match_time: "", status: "scheduled",
  });
  const [assignForm, setAssignForm] = useState({ match_id: "", user_id: "", role: "1st Referee" });
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" }>({ text: "", type: "success" });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      await loadData();
    };
    init();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [m, p, a, r] = await Promise.all([
      supabase.from("matches").select("*").order("match_date"),
      supabase.from("profiles").select("*").neq("role", "admin"),
      supabase.from("assignments").select("*").order("created_at", { ascending: false }),
      supabase.from("match_reports").select("*").order("created_at", { ascending: false }),
    ]);
    if (m.data) setMatches(m.data);
    if (p.data) setProfiles(p.data);
    if (a.data) setAssignments(a.data);
    if (r.data) setReports(r.data);
    setLoading(false);
  };

  const showMsg = (text: string, type: "success" | "error" = "success") =>
    setMsg({ text, type });

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const setAF = (k: string, v: string) => setAssignForm(p => ({ ...p, [k]: v }));

  const createMatch = async () => {
    if (!form.home_team || !form.away_team || !form.match_date) {
      showMsg("Please fill in home team, away team and date.", "error");
      return;
    }
    const { error } = await supabase.from("matches").insert([form]);
    if (error) {
      showMsg("Error creating match: " + error.message, "error");
    } else {
      showMsg("Match created!");
      setForm({ home_team: "", away_team: "", venue: "", match_date: "", match_time: "", status: "scheduled" });
      loadData();
    }
  };

  const deleteMatch = async (id: number) => {
    const hasAssignments = assignments.some(a => a.match_id === id);
    const hasReports = reports.some(r => r.match_id === id);
    if (hasAssignments || hasReports) {
      const what = [hasAssignments && "assignments", hasReports && "reports"].filter(Boolean).join(" and ");
      if (!window.confirm(`This match has linked ${what}. Delete anyway? This cannot be undone.`)) return;
    }
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) {
      showMsg("Error deleting match: " + error.message, "error");
    } else {
      showMsg("Match deleted.");
      loadData();
    }
  };

  const toggleMatchStatus = async (id: number, currentStatus: string) => {
    const next = STATUS_CYCLE[currentStatus] ?? "scheduled";
    const { error } = await supabase.from("matches").update({ status: next }).eq("id", id);
    if (error) {
      showMsg("Error updating status: " + error.message, "error");
    } else {
      setMatches(prev => prev.map(m => m.id === id ? { ...m, status: next } : m));
    }
  };

  const createAssignment = async () => {
    if (!assignForm.match_id || !assignForm.user_id) {
      showMsg("Please select a match and a referee.", "error");
      return;
    }
    const { error } = await supabase.from("assignments").insert([{
      match_id: parseInt(assignForm.match_id),
      user_id: assignForm.user_id,
      role: assignForm.role,
      status: "pending",
    }]);
    if (error) {
      showMsg("Error assigning referee: " + error.message, "error");
    } else {
      showMsg("Referee assigned!");
      setAssignForm({ match_id: "", user_id: "", role: "1st Referee" });
      loadData();
    }
  };

  const deleteAssignment = async (id: number) => {
    const { error } = await supabase.from("assignments").delete().eq("id", id);
    if (error) {
      showMsg("Error deleting assignment: " + error.message, "error");
    } else {
      showMsg("Assignment removed.");
      loadData();
    }
  };

  const toggleUserRole = async (id: string, currentRole: string) => {
    const next = currentRole === "national_referee" ? "referee" : "national_referee";
    const { error } = await supabase.from("profiles").update({ role: next }).eq("id", id);
    if (error) {
      showMsg("Error updating role: " + error.message, "error");
    } else {
      showMsg(`Role updated to ${next}.`);
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: next } : p));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{ padding: 32, fontFamily: "sans-serif", color: "#6B7280" }}>Loading...</div>
    );
  }

  if (accessDenied) {
    return (
      <main style={{ minHeight: "100vh", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Access denied</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>You don&apos;t have admin privileges.</div>
          <button onClick={() => router.push("/")} style={{ fontSize: 13, color: "#185FA5", background: "none", border: "none", cursor: "pointer" }}>← Back to dashboard</button>
        </div>
      </main>
    );
  }

  // ── Derived stats for Dashboard tab ──────────────────────────────────────────
  const matchByStatus = (s: string) => matches.filter(m => m.status === s).length;
  const assignByStatus = (s: string) => assignments.filter(a => a.status === s).length;
  const recentReports = reports.slice(0, 3);

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", fontFamily: "sans-serif", minHeight: "100vh", background: "#F9FAFB", paddingBottom: 40 }}>
      <div style={{ background: "#0C447C", color: "#fff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>PROVO Officials Portal</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Admin Panel</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={() => router.push("/")} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", background: "none", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
            Dashboard
          </button>
          <button onClick={handleLogout} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", background: "none", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "0.5px solid #E5E7EB", background: "#fff", overflowX: "auto" }}>
        {navItems.map(item => (
          <button key={item} onClick={() => setTab(item)} style={{
            flex: 1, padding: "12px 8px", fontSize: 12,
            fontWeight: tab === item ? 500 : 400,
            color: tab === item ? "#185FA5" : "#6B7280",
            background: "none", border: "none",
            borderBottom: tab === item ? "2px solid #185FA5" : "2px solid transparent",
            cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {item}
          </button>
        ))}
      </div>

      {msg.text && (
        <div style={{
          background: msg.type === "error" ? "#FCE8E8" : "#D1FAE5",
          color: msg.type === "error" ? "#991B1B" : "#065F46",
          padding: "10px 16px", fontSize: 13, display: "flex", justifyContent: "space-between",
        }}>
          {msg.text}
          <button onClick={() => setMsg({ text: "", type: "success" })} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
        </div>
      )}

      <div style={{ padding: 16 }}>

        {/* ── DASHBOARD TAB ── */}
        {tab === "Dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {/* Matches card */}
              <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, fontWeight: 500 }}>Matches</div>
                <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>{matches.length}</div>
                {[["scheduled", "#185FA5"], ["completed", "#065F46"], ["cancelled", "#991B1B"]].map(([s, c]) => (
                  <div key={s} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 2 }}>
                    <span style={{ textTransform: "capitalize" }}>{s}</span>
                    <span style={{ color: c as string, fontWeight: 500 }}>{matchByStatus(s)}</span>
                  </div>
                ))}
              </div>

              {/* Assignments card */}
              <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 8, fontWeight: 500 }}>Assignments</div>
                <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>{assignments.length}</div>
                {[["pending", "#856404"], ["accepted", "#065F46"], ["declined", "#991B1B"]].map(([s, c]) => (
                  <div key={s} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 2 }}>
                    <span style={{ textTransform: "capitalize" }}>{s}</span>
                    <span style={{ color: c as string, fontWeight: 500 }}>{assignByStatus(s)}</span>
                  </div>
                ))}
              </div>

              {/* Reports card */}
              <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Reports submitted</div>
                <div style={{ fontSize: 32, fontWeight: 600, color: "#185FA5" }}>{reports.length}</div>
              </div>

              {/* Referees card */}
              <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4, fontWeight: 500 }}>Referees</div>
                <div style={{ fontSize: 32, fontWeight: 600, color: "#185FA5" }}>{profiles.length}</div>
              </div>
            </div>

            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>Recent reports</h3>
            {recentReports.length === 0 && <p style={{ fontSize: 13, color: "#6B7280" }}>No reports yet.</p>}
            {recentReports.map(r => {
              const match = matches.find(m => m.id === r.match_id);
              const referee = profiles.find(p => p.id === r.user_id);
              return (
                <div key={r.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {match ? `${match.home_team} vs ${match.away_team}` : `Match #${r.match_id}`}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                      {referee?.full_name || "Unknown referee"} · Score: {r.final_score}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── MATCHES TAB ── */}
        {tab === "Matches" && (
          <div>
            <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 500 }}>Create new match</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {([["Home team", "home_team"], ["Away team", "away_team"], ["Venue", "venue"], ["Time", "match_time"]] as [string, string][]).map(([label, key]) => (
                  <div key={key}>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>{label}</label>
                    <input
                      placeholder={label}
                      value={form[key as keyof typeof form]}
                      onChange={e => setF(key, e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Date</label>
                <input
                  type="date"
                  value={form.match_date}
                  onChange={e => setF("match_date", e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}
                />
              </div>
              <button onClick={createMatch} style={{ background: "#0C447C", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Create match
              </button>
            </div>

            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>All matches ({matches.length})</h3>
            {matches.length === 0 && <p style={{ color: "#6B7280", fontSize: 13 }}>No matches yet.</p>}
            {matches.map(m => {
              const assignCount = assignments.filter(a => a.match_id === m.id).length;
              const reportCount = reports.filter(r => r.match_id === m.id).length;
              const [statusBg, statusColor] = MATCH_STATUS_STYLE[m.status] ?? MATCH_STATUS_STYLE.scheduled;
              return (
                <div key={m.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{m.home_team} vs {m.away_team}</div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>{m.match_date} · {m.match_time} · {m.venue}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>
                        {assignCount} assignment{assignCount !== 1 ? "s" : ""} · {reportCount} report{reportCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: 10 }}>
                      <button
                        onClick={() => toggleMatchStatus(m.id, m.status)}
                        style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: statusBg, color: statusColor, border: "none", cursor: "pointer", fontWeight: 500, textTransform: "capitalize" }}
                      >
                        {m.status || "scheduled"}
                      </button>
                      <button onClick={() => deleteMatch(m.id)} style={{ fontSize: 11, color: "#991B1B", background: "#FCE8E8", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── ASSIGNMENTS TAB ── */}
        {tab === "Assignments" && (
          <div>
            <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 500 }}>Assign referee to match</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Match</label>
                  <select value={assignForm.match_id} onChange={e => setAF("match_id", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}>
                    <option value="">Select a match...</option>
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>{m.home_team} vs {m.away_team} — {m.match_date}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Referee</label>
                  <select value={assignForm.user_id} onChange={e => setAF("user_id", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}>
                    <option value="">Select a referee...</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name || "Unnamed"} — {p.level || p.role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Role in match</label>
                  <select value={assignForm.role} onChange={e => setAF("role", e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}>
                    {["1st Referee", "2nd Referee", "Scorer", "Assistant Scorer"].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <button onClick={createAssignment} style={{ background: "#0C447C", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                  Assign referee
                </button>
              </div>
            </div>

            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>All assignments ({assignments.length})</h3>
            {assignments.length === 0 && <p style={{ color: "#6B7280", fontSize: 13 }}>No assignments yet.</p>}
            {assignments.map(a => {
              const match = matches.find(m => m.id === a.match_id);
              const profile = profiles.find(p => p.id === a.user_id);
              const shortDate = a.created_at
                ? new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : null;
              return (
                <div key={a.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {match ? `${match.home_team} vs ${match.away_team}` : "Unknown match"}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                        {match?.match_date} · {profile?.full_name || "Unknown referee"} · {a.role}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 4,
                          background: a.status === "accepted" ? "#D1FAE5" : a.status === "declined" ? "#FCE8E8" : "#FFF3CD",
                          color: a.status === "accepted" ? "#065F46" : a.status === "declined" ? "#991B1B" : "#856404",
                        }}>
                          {a.status || "pending"}
                        </span>
                        {shortDate && <span style={{ fontSize: 11, color: "#9CA3AF" }}>{shortDate}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAssignment(a.id)}
                      style={{ fontSize: 11, color: "#991B1B", background: "#FCE8E8", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", marginLeft: 10 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {tab === "Reports" && (
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>Submitted reports ({reports.length})</h3>
            {reports.length === 0 && <p style={{ color: "#6B7280", fontSize: 13 }}>No reports submitted yet.</p>}
            {reports.map(r => {
              const match = matches.find(m => m.id === r.match_id);
              const referee = profiles.find(p => p.id === r.user_id);
              return (
                <div key={r.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "14px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {match ? `${match.home_team} vs ${match.away_team}` : `Match #${r.match_id}`}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280" }}>
                        {match?.match_date} · by {referee?.full_name || "Unknown referee"}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#D1FAE5", color: "#065F46" }}>Submitted</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: r.incidents ? 8 : 0 }}>
                    {([["Score", r.final_score], ["Sets", r.sets_played], ["MVP", r.mvp || "—"]] as [string, string][]).map(([label, val]) => (
                      <div key={label} style={{ background: "#F9FAFB", borderRadius: 6, padding: "6px 8px" }}>
                        <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {r.incidents && (
                    <div style={{ background: "#FFF3CD", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#856404" }}>
                      ⚠️ {r.incidents}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === "Users" && (
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>All referees ({profiles.length})</h3>
            {profiles.length === 0 && (
              <p style={{ color: "#6B7280", fontSize: 13 }}>No profiles yet. Users need to complete their profile after signing up.</p>
            )}
            {profiles.map(p => (
              <div key={p.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.full_name || "No name set"}</div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>
                    License: {p.license_number || "N/A"} · {p.level || "—"} · {p.region || "—"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#E6F1FB", color: "#185FA5" }}>
                    {p.role}
                  </span>
                  <button
                    onClick={() => toggleUserRole(p.id, p.role)}
                    style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "#F3F4F6", color: "#374151", border: "0.5px solid #E5E7EB", cursor: "pointer" }}
                  >
                    {p.role === "national_referee" ? "→ referee" : "→ national"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
