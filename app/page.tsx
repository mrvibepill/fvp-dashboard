/*
 * SUPABASE SETUP — run this once in the Supabase SQL editor
 * to auto-create a profiles row for every new user on signup:
 *
 * create or replace function public.handle_new_user()
 * returns trigger as $$
 * begin
 *   insert into public.profiles (id, full_name, role)
 *   values (new.id, new.raw_user_meta_data->>'full_name', 'referee');
 *   return new;
 * end;
 * $$ language plpgsql security definer;
 *
 * drop trigger if exists on_auth_user_created on auth.users;
 * create trigger on_auth_user_created
 *   after insert on auth.users
 *   for each row execute procedure public.handle_new_user();
 */

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Assignment = {
  id: number;
  role: string;
  status: string;
  matches: {
    id: number;
    home_team: string;
    away_team: string;
    venue: string;
    match_date: string;
    match_time: string;
    status: string;
  };
};

type Profile = {
  id: string;
  full_name: string;
  license_number: string;
  level: string;
  role: string;
  region: string;
  status: string;
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  created_at: string;
};

type MatchReport = {
  id: number;
  final_score: string;
  sets_played: string;
  created_at: string;
  match_id: number | null;
  matches: {
    home_team: string;
    away_team: string;
    match_date: string;
  } | null;
};

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

function DashboardPage({ assignments, announcements, reports, setPage }: { assignments: Assignment[]; announcements: Announcement[]; reports: MatchReport[]; setPage: (p: string) => void }) {
  const pending = assignments.filter(m => m.status === "pending").length;
  const upcoming = assignments.filter(m => m.status === "accepted").length;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {([["Upcoming", upcoming, "#E6F1FB", "#185FA5"], ["Pending", pending, "#FAEEDA", "#854F0B"], ["Total", assignments.length, "#EAF3DE", "#3B6D11"]] as [string, number, string, string][]).map(([label, val, bg, col]) => (
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
        {assignments.length === 0 && <p style={{ fontSize: 13, color: "#6B7280" }}>No assignments yet.</p>}
        {assignments.slice(0, 3).map(a => (
          <div key={a.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{a.matches.home_team} vs {a.matches.away_team}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{a.matches.match_date} · {a.matches.match_time} · {a.matches.venue}</div>
              <RoleBadge role={a.role} />
            </div>
            <Badge status={a.status} />
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>My reports</h3>
        {reports.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6B7280" }}>No reports submitted yet.</p>
        ) : (
          reports.slice(0, 3).map(r => (
            <div key={r.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                  {r.matches ? `${r.matches.home_team} vs ${r.matches.away_team}` : "Unknown match"}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  {r.matches?.match_date} · Score: {r.final_score} · Sets: {r.sets_played}
                </div>
              </div>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#D1FAE5", color: "#065F46", fontWeight: 500, flexShrink: 0 }}>Submitted</span>
            </div>
          ))
        )}
      </div>
      <div>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>Announcements</h3>
        {announcements.length === 0 && <p style={{ fontSize: 13, color: "#6B7280" }}>No announcements.</p>}
        {announcements.map(a => (
          <div key={a.id} style={{ borderLeft: "2px solid #185FA5", paddingLeft: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>
              {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{a.title}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>{a.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MATCH_STATUS_STYLE: Record<string, [string, string]> = {
  scheduled: ["#E6F1FB", "#185FA5"],
  completed: ["#D1FAE5", "#065F46"],
  cancelled: ["#FCE8E8", "#991B1B"],
};

const FILTER_EMPTY: Record<string, string> = {
  All:      "No assignments yet.",
  Pending:  "No pending assignments.",
  Accepted: "No accepted assignments.",
  Declined: "No declined assignments.",
};

function SchedulePage({ assignments, onUpdateStatus, onGoToReports }: { assignments: Assignment[]; onUpdateStatus: (id: number, status: string) => Promise<string | null>; onGoToReports: (matchId: number) => void }) {
  const [filter, setFilter] = useState<"All" | "Pending" | "Accepted" | "Declined">("All");
  const [optimistic, setOptimistic] = useState<Record<number, string>>({});
  const [cardErrors, setCardErrors] = useState<Record<number, string>>({});
  const [pending, setPending] = useState<Record<number, boolean>>({});

  const filters = ["All", "Pending", "Accepted", "Declined"] as const;

  const effectiveStatus = (a: Assignment) => optimistic[a.id] ?? a.status;

  const filtered = filter === "All"
    ? assignments
    : assignments.filter(a => effectiveStatus(a) === filter.toLowerCase());

  const handleStatusClick = async (id: number, newStatus: string) => {
    const prev = assignments.find(a => a.id === id)?.status ?? "";
    setOptimistic(o => ({ ...o, [id]: newStatus }));
    setCardErrors(e => { const n = { ...e }; delete n[id]; return n; });
    setPending(p => ({ ...p, [id]: true }));

    const err = await onUpdateStatus(id, newStatus);

    setPending(p => { const n = { ...p }; delete n[id]; return n; });
    if (err) {
      setOptimistic(o => { const n = { ...o }; n[id] = prev; return n; });
      setCardErrors(e => ({ ...e, [id]: err }));
    } else {
      setOptimistic(o => { const n = { ...o }; delete n[id]; return n; });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
        {filters.map(f => {
          const count = f === "All"
            ? assignments.length
            : assignments.filter(a => effectiveStatus(a) === f.toLowerCase()).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                whiteSpace: "nowrap", border: "none", fontWeight: filter === f ? 500 : 400,
                background: filter === f ? "#185FA5" : "#F3F4F6",
                color: filter === f ? "#fff" : "#6B7280",
              }}
            >
              {f} <span style={{ opacity: 0.75 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p style={{ fontSize: 13, color: "#6B7280" }}>{FILTER_EMPTY[filter]}</p>
      )}

      {filtered.map(a => {
        const status = effectiveStatus(a);
        const matchStatus = a.matches.status || "scheduled";
        const [msBg, msColor] = MATCH_STATUS_STYLE[matchStatus] ?? MATCH_STATUS_STYLE.scheduled;
        const isPending = !!pending[a.id];
        return (
          <div key={a.id} style={{ background: "#fff", border: `0.5px solid ${cardErrors[a.id] ? "#FBBFCA" : "#E5E7EB"}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1, marginRight: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{a.matches.home_team} vs {a.matches.away_team}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{a.matches.match_date} · {a.matches.match_time}</div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>{a.matches.venue}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <Badge status={status} />
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 4,
                  background: msBg, color: msColor, fontWeight: 500, textTransform: "capitalize",
                }}>
                  {matchStatus}
                </span>
              </div>
            </div>
            {cardErrors[a.id] && (
              <div style={{ fontSize: 12, color: "#991B1B", background: "#FCE8E8", borderRadius: 6, padding: "5px 10px", marginBottom: 8 }}>
                {cardErrors[a.id]}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <RoleBadge role={a.role} />
              {status === "pending" && (
                <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                  <button
                    onClick={() => handleStatusClick(a.id, "accepted")}
                    disabled={isPending}
                    style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "#D1FAE5", color: "#065F46", border: "none", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1 }}
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => handleStatusClick(a.id, "declined")}
                    disabled={isPending}
                    style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "#FCE8E8", color: "#991B1B", border: "none", cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.6 : 1 }}
                  >
                    ✕ Decline
                  </button>
                </div>
              )}
              {status === "accepted" && (
                <button
                  onClick={() => onGoToReports(a.matches.id)}
                  style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "#E6F1FB", color: "#185FA5", border: "none", cursor: "pointer", marginLeft: "auto" }}
                >
                  + Submit report
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


function ToolsPage() {
  const tools = [
    { label: "Official Volleyball Rules 2025–2028", desc: "FIVB indoor volleyball rulebook", url: "https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf", color: "#E6F1FB", tc: "#185FA5" },
    { label: "Volleyball Official Hand Signals", desc: "FIVB referee hand signals guide", url: "https://www.fivb.com/wp-content/uploads/2024/02/FIVB-Volleyball_Hand-Signals_2017.pdf", color: "#EAF3DE", tc: "#3B6D11" },
    { label: "Official Volleyball Scoresheet", desc: "FIVB standard match scoresheet", url: "https://www.fivb.com/wp-content/uploads/2024/02/FIVB_VB_OfficialScoresheet_2013_updated2.pdf", color: "#FAEEDA", tc: "#854F0B" },
    { label: "R-6 Libero Player Control", desc: "FIVB libero tracking form", url: "https://www.fivb.com/wp-content/uploads/2024/02/FIVB_R-6_LiberoPlayerControl-2011.pdf", color: "#EEEDFE", tc: "#534AB7" },
    { label: "R-5 Line-up Sheet", desc: "FIVB team line-up form", url: "https://www.fivb.com/wp-content/uploads/2024/02/FIVB_R-5_LineUpSheet-2010.pdf", color: "#E1F5EE", tc: "#0F6E56" },
    { label: "Official Beach Volleyball Rules 2025–2028", desc: "FIVB beach volleyball rulebook", url: "https://www.fivb.com/wp-content/uploads/2025/02/FIVB-BeachVolleyball_Rules2025_2028-EN-v01.pdf", color: "#FEF3E2", tc: "#92400E" },
    { label: "Beach Volleyball Refereeing Guidelines", desc: "FIVB beach referee instructions 2023", url: "https://www.fivb.com/wp-content/uploads/2024/03/2023_FIVB_Beach_Volleyball_Refereeing_Guidelines_and_Instructions.pdf", color: "#FDE8F0", tc: "#9B1D5A" },
    { label: "Reglamento Deportivo – Categorías Menores", desc: "FVP reglamento categorías menores", url: "https://1e969583-1419-4978-b099-fda1003dcd30.filesusr.com/ugd/899c91_43c4cdee8e364276b7f3a30fe946cfff.pdf", color: "#FCE8E8", tc: "#991B1B" },
  ];
  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 500 }}>Resources & tools</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {tools.map(t => (
          <a key={t.label} href={t.url} target="_blank" rel="noreferrer"
            style={{ background: t.color, borderRadius: 10, padding: "12px 14px", textDecoration: "none", display: "block" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: t.tc, marginBottom: 2 }}>{t.label}</div>
            <div style={{ fontSize: 11, color: t.tc, opacity: 0.8, marginBottom: 6 }}>{t.desc}</div>
            <span style={{ fontSize: 10, fontWeight: 600, color: t.tc, background: "rgba(0,0,0,0.07)", borderRadius: 4, padding: "2px 6px" }}>PDF ↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function ReportsPage({ userId, assignments, preselectedMatchId, onReportsChange }: {
  userId: string;
  assignments: Assignment[];
  preselectedMatchId?: number;
  onReportsChange: (reports: MatchReport[]) => void;
}) {
  const supabase = createClient();
  const [reports, setReports] = useState<MatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [form, setForm] = useState({
    match_id: preselectedMatchId ? String(preselectedMatchId) : "",
    sets_played: "3",
    final_score: "",
    mvp: "",
    incidents: "",
  });

  const setField = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const fetchReports = async () => {
    const { data } = await supabase
      .from("match_reports")
      .select("id, final_score, sets_played, created_at, match_id, matches(home_team, away_team, match_date)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) {
      const r = data as unknown as MatchReport[];
      setReports(r);
      onReportsChange(r);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchReports().then(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (preselectedMatchId) {
      setForm(p => ({ ...p, match_id: String(preselectedMatchId) }));
    }
  }, [preselectedMatchId]);

  const reportedMatchIds = new Set(reports.map(r => r.match_id));
  const availableAssignments = assignments.filter(
    a => a.status === "accepted" && !reportedMatchIds.has(a.matches.id)
  );

  const handleSubmit = async () => {
    if (!form.match_id) {
      setMsg({ text: "Please select a match.", error: true });
      return;
    }
    if (!form.final_score.trim()) {
      setMsg({ text: "Final score is required.", error: true });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("match_reports").insert([{
      user_id: userId,
      match_id: parseInt(form.match_id),
      sets_played: parseInt(form.sets_played),
      final_score: form.final_score.trim(),
      mvp: form.mvp.trim() || null,
      incidents: form.incidents.trim() || null,
    }]);
    setSubmitting(false);
    if (error) {
      setMsg({ text: "Error: " + error.message, error: true });
    } else {
      setMsg({ text: "Report submitted successfully.", error: false });
      setForm({ match_id: "", sets_played: "3", final_score: "", mvp: "", incidents: "" });
      await fetchReports();
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, fontSize: 13, color: "#6B7280" }}>
      Loading reports...
    </div>
  );

  return (
    <div>
      {msg && (
        <div style={{ background: msg.error ? "#FCE8E8" : "#D1FAE5", color: msg.error ? "#991B1B" : "#065F46", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 14 }}>✕</button>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>Report history</h3>
        {reports.length === 0 ? (
          <p style={{ fontSize: 13, color: "#6B7280" }}>No reports submitted yet. Complete a match to submit your first report.</p>
        ) : (
          reports.map(r => (
            <div key={r.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
                  {r.matches ? `${r.matches.home_team} vs ${r.matches.away_team}` : "Unknown match"}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  {r.matches?.match_date} · Score: {r.final_score} · {r.sets_played} sets
                </div>
              </div>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#D1FAE5", color: "#065F46", fontWeight: 500, flexShrink: 0 }}>Submitted</span>
            </div>
          ))
        )}
      </div>

      {availableAssignments.length === 0 ? (
        <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>No pending reports. All assigned matches have been reported.</p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 500 }}>Submit match report</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Match <span style={{ color: "#991B1B" }}>*</span></label>
              <select
                value={form.match_id}
                onChange={e => setField("match_id", e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}
              >
                <option value="">Select a match...</option>
                {availableAssignments.map(a => (
                  <option key={a.id} value={a.matches.id}>
                    {a.matches.home_team} vs {a.matches.away_team} — {a.matches.match_date}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Sets played</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["3", "4", "5"].map(v => (
                  <button
                    key={v}
                    onClick={() => setField("sets_played", v)}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer",
                      background: form.sets_played === v ? "#185FA5" : "#F3F4F6",
                      color: form.sets_played === v ? "#fff" : "#374151",
                      border: form.sets_played === v ? "none" : "0.5px solid #D1D5DB",
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Final score <span style={{ color: "#991B1B" }}>*</span></label>
              <input
                placeholder="e.g. 3-2"
                value={form.final_score}
                onChange={e => setField("final_score", e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>MVP <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <input
                placeholder="Player name"
                value={form.mvp}
                onChange={e => setField("mvp", e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Incidents / sanctions <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <textarea
                placeholder="Red cards, delays, protests..."
                value={form.incidents}
                onChange={e => setField("incidents", e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", height: 80, padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13, resize: "vertical" }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ background: submitting ? "#93C5FD" : "#185FA5", color: "#fff", border: "none", borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 500, cursor: submitting ? "not-allowed" : "pointer" }}
            >
              {submitting ? "Submitting..." : "Submit report"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfilePage({ profile: initialProfile, userId, userRole }: { profile: Profile | null; userId: string; userRole: string }) {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", license_number: "", level: "", region: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ role: "", status: "" });
  const [adminSaving, setAdminSaving] = useState(false);

  useEffect(() => {
    if (userRole === "admin") {
      supabase.from("profiles").select("*").then(({ data }) => {
        if (data) setAllProfiles(data as Profile[]);
      });
    }
  }, [userRole]);

  if (!profile) return (
    <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center", padding: "32px 16px" }}>
      Profile not set up yet. Please contact your administrator.
    </p>
  );

  const initials = profile.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  const startEdit = () => {
    setForm({ full_name: profile.full_name || "", license_number: profile.license_number || "", level: profile.level || "", region: profile.region || "" });
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", userId);
    setSaving(false);
    if (error) {
      setMsg({ text: "Error: " + error.message, error: true });
    } else {
      setProfile(p => p ? { ...p, ...form } : p);
      setEditing(false);
      setMsg({ text: "Profile updated.", error: false });
    }
  };

  const startEditUser = (p: Profile) => {
    setEditingUser(p.id);
    setUserForm({ role: p.role || "", status: p.status || "active" });
  };

  const saveUserProfile = async (id: string) => {
    setAdminSaving(true);
    const { error } = await supabase.from("profiles").update(userForm).eq("id", id);
    setAdminSaving(false);
    if (!error) {
      setAllProfiles(prev => prev.map(p => p.id === id ? { ...p, ...userForm } : p));
      setEditingUser(null);
    }
  };

  return (
    <div>
      {msg && (
        <div style={{ background: msg.error ? "#FCE8E8" : "#D1FAE5", color: msg.error ? "#991B1B" : "#065F46", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 14 }}>✕</button>
        </div>
      )}

      <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 16, color: "#185FA5" }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{profile.full_name || "No name set"}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>License #{profile.license_number || "N/A"}</div>
            <div style={{ fontSize: 12, color: "#185FA5", marginTop: 2 }}>{profile.level || "Referee"}</div>
          </div>
          {!editing && (
            <button onClick={startEdit} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, background: "#F3F4F6", color: "#374151", border: "0.5px solid #E5E7EB", cursor: "pointer" }}>Edit</button>
          )}
        </div>

        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {([["Full name", "full_name", "Your full name"], ["License number", "license_number", "e.g. FVP-1234"], ["Level", "level", "e.g. National, Regional"], ["Region", "region", "e.g. Metro, North"]] as [string, keyof typeof form, string][]).map(([label, key, ph]) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 3 }}>{label}</label>
                <input placeholder={ph} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button onClick={saveProfile} disabled={saving} style={{ flex: 1, background: saving ? "#93C5FD" : "#185FA5", color: "#fff", border: "none", borderRadius: 8, padding: 9, fontSize: 13, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button onClick={() => setEditing(false)} style={{ padding: "9px 14px", borderRadius: 8, background: "#F3F4F6", color: "#374151", border: "none", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {([["Role", profile.role], ["Region", profile.region || "N/A"], ["Status", profile.status || "active"]] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "0.5px solid #E5E7EB", fontSize: 13 }}>
                <span style={{ color: "#6B7280" }}>{k}</span>
                <span style={{ textTransform: "capitalize" }}>{v}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {userRole === "admin" && (
        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>Manage users</h3>
          {allProfiles.length === 0 && <p style={{ fontSize: 13, color: "#6B7280" }}>No users found.</p>}
          {allProfiles.map(p => (
            <div key={p.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
              {editingUser === p.id ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>{p.full_name || "No name"}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 3 }}>Role</label>
                      <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}>
                        {["referee", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 3 }}>Status</label>
                      <select value={userForm.status} onChange={e => setUserForm(f => ({ ...f, status: e.target.value }))} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}>
                        {["active", "inactive", "suspended"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => saveUserProfile(p.id)} disabled={adminSaving} style={{ flex: 1, background: adminSaving ? "#93C5FD" : "#185FA5", color: "#fff", border: "none", borderRadius: 6, padding: "7px 0", fontSize: 12, fontWeight: 500, cursor: adminSaving ? "not-allowed" : "pointer" }}>
                        {adminSaving ? "Saving..." : "Save"}
                      </button>
                      <button onClick={() => setEditingUser(null)} style={{ padding: "7px 12px", borderRadius: 6, background: "#F3F4F6", color: "#374151", border: "none", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.full_name || "No name"}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                      {p.license_number || "No license"} · <span style={{ textTransform: "capitalize" }}>{p.role}</span>
                      {p.status && p.status !== "active" && <span style={{ color: "#991B1B" }}> · {p.status}</span>}
                    </div>
                  </div>
                  <button onClick={() => startEditUser(p)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#F3F4F6", color: "#374151", border: "0.5px solid #E5E7EB", cursor: "pointer" }}>Edit</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [page, setPage] = useState("Dashboard");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [reports, setReports] = useState<MatchReport[]>([]);
  const [preselectedMatchId, setPreselectedMatchId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: profileData }, { data: assignmentData }, { data: announcementData }, { data: reportData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("assignments").select("*, matches(*)").eq("user_id", user.id),
        supabase.from("announcements").select("id, title, content, created_at").order("created_at", { ascending: false }),
        supabase.from("match_reports").select("id, final_score, sets_played, created_at, match_id, matches(home_team, away_team, match_date)").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (profileData) {
        setProfile(profileData);
        setUserRole(profileData.role);
      }
      if (assignmentData) setAssignments(assignmentData);
      if (announcementData) setAnnouncements(announcementData);
      if (reportData) setReports(reportData as unknown as MatchReport[]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleUpdateStatus = async (id: number, status: string): Promise<string | null> => {
    const { error } = await supabase.from("assignments").update({ status }).eq("id", id);
    if (error) return error.message;
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    return null;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";

  const pages: Record<string, React.ReactNode> = {
    Dashboard: <DashboardPage assignments={assignments} announcements={announcements} reports={reports} setPage={setPage} />,
    Schedule: <SchedulePage assignments={assignments} onUpdateStatus={handleUpdateStatus} onGoToReports={(matchId) => { setPreselectedMatchId(matchId); setPage("Reports"); }} />,
    Reports: <ReportsPage userId={userId} assignments={assignments} preselectedMatchId={preselectedMatchId} onReportsChange={setReports} />,
    Tools: <ToolsPage />,
    Profile: <ProfilePage profile={profile} userId={userId} userRole={userRole} />,
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#6B7280" }}>Loading...</div>;

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", fontFamily: "sans-serif", paddingBottom: 72, minHeight: "100vh", background: "#F9FAFB" }}>
      <div style={{ background: "#0C447C", color: "#fff", padding: "16px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>PROVO Officials Portal</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>{page}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {userRole === "admin" && (
            <button onClick={() => router.push("/admin")} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", background: "none", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
              Admin
            </button>
          )}
          <button onClick={handleLogout} style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", background: "none", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
            Sign out
          </button>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#185FA5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>
            {initials}
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