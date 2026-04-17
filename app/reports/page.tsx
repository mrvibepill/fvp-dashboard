"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

type Assignment = {
  id: number;
  role: string;
  matches: {
    id: number;
    home_team: string;
    away_team: string;
    match_date: string;
  };
};

type Report = {
  id: number;
  sets_played: number;
  final_score: string;
  mvp: string | null;
  incidents: string | null;
  created_at: string;
  match_id: number | null;
};

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [form, setForm] = useState({
    match_id: searchParams.get("match_id") ?? "",
    sets_played: "3",
    final_score: "",
    mvp: "",
    incidents: "",
  });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: assignmentData }, { data: reportData }] = await Promise.all([
        supabase
          .from("assignments")
          .select("id, role, matches(id, home_team, away_team, match_date)")
          .eq("user_id", user.id)
          .eq("status", "accepted"),
        supabase
          .from("match_reports")
          .select("id, sets_played, final_score, mvp, incidents, created_at, match_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (assignmentData) setAssignments(assignmentData as unknown as Assignment[]);
      if (reportData) setReports(reportData);
      setLoading(false);
    };
    load();
  }, []);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.final_score.trim()) {
      setMsg({ text: "Final score is required.", error: true });
      return;
    }
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const payload: Record<string, unknown> = {
      user_id: user.id,
      sets_played: parseInt(form.sets_played),
      final_score: form.final_score.trim(),
      mvp: form.mvp.trim() || null,
      incidents: form.incidents.trim() || null,
    };
    if (form.match_id) payload.match_id = parseInt(form.match_id);

    const { error } = await supabase.from("match_reports").insert([payload]);
    setSubmitting(false);

    if (error) {
      setMsg({ text: "Error: " + error.message, error: true });
    } else {
      setMsg({ text: "Report submitted successfully.", error: false });
      setForm({ match_id: "", sets_played: "3", final_score: "", mvp: "", incidents: "" });
      // Refresh report list
      const { data: reportData } = await supabase
        .from("match_reports")
        .select("id, sets_played, final_score, mvp, incidents, created_at, match_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (reportData) setReports(reportData);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#6B7280" }}>
      Loading...
    </div>
  );

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", fontFamily: "sans-serif", minHeight: "100vh", background: "#F9FAFB", paddingBottom: 40 }}>
      <div style={{ background: "#0C447C", color: "#fff", padding: "16px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>PROVO Officials Portal</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Match Reports</div>
        </div>
        <button
          onClick={() => router.push("/")}
          style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", background: "none", border: "0.5px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
        >
          ← Dashboard
        </button>
      </div>

      {msg && (
        <div style={{ background: msg.error ? "#FCE8E8" : "#D1FAE5", color: msg.error ? "#991B1B" : "#065F46", padding: "10px 16px", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 14 }}>✕</button>
        </div>
      )}

      <div style={{ padding: 16 }}>
        <div style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 500 }}>Submit match report</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {assignments.length > 0 && (
              <div>
                <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Match (optional)</label>
                <select
                  value={form.match_id}
                  onChange={e => set("match_id", e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}
                >
                  <option value="">Select a match...</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.matches.id}>
                      {a.matches.home_team} vs {a.matches.away_team} — {a.matches.match_date}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Sets played</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["2", "3", "4", "5"].map(v => (
                  <button
                    key={v}
                    onClick={() => set("sets_played", v)}
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
                onChange={e => set("final_score", e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>MVP <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <input
                placeholder="Player name"
                value={form.mvp}
                onChange={e => set("mvp", e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 6, border: "0.5px solid #D1D5DB", fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Incidents / sanctions <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <textarea
                placeholder="Red cards, delays, protests..."
                value={form.incidents}
                onChange={e => set("incidents", e.target.value)}
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

        {reports.length > 0 && (
          <div>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 500 }}>Past reports</h3>
            {reports.map(r => (
              <div key={r.id} style={{ background: "#fff", border: "0.5px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Score: {r.final_score}</span>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>
                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>Sets: {r.sets_played}{r.mvp ? ` · MVP: ${r.mvp}` : ""}</div>
                {r.incidents && <div style={{ fontSize: 12, color: "#991B1B", marginTop: 4 }}>{r.incidents}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
