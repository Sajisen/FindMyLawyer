import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiRequest } from "../../services/api.js";

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : "Not available";

export default function AdminDashboardPage() {
  const { user, token } = useAuth();
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState("");
  const [tab, setTab] = useState("lawyers");

  const refresh = useCallback(async () => {
    try {
      const [pending, registered] = await Promise.all([
        apiRequest("/admin/lawyers/pending", { token }),
        apiRequest("/admin/clients", { token }),
      ]);
      setLawyers(pending.lawyers ?? []);
      setClients(registered.clients ?? []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => { void refresh(); }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  async function decide(lawyer, action) {
    if (busyId) return;
    const trimmedReason = reason.trim();
    if (action === "reject" && !trimmedReason) {
      setError("Enter a reason before rejecting this application.");
      return;
    }
    setBusyId(lawyer._id);
    setError("");
    setNotice("");
    try {
      const data = await apiRequest(`/admin/lawyers/${lawyer._id}/${action}`, {
        method: "PATCH",
        token,
        ...(action === "reject" ? { body: { reason: trimmedReason } } : {}),
      });
      setLawyers((previous) => previous.filter((item) => item._id !== lawyer._id));
      setNotice(data.message || `Application ${action === "approve" ? "approved" : "rejected"}.`);
      setSelectedId(null);
      setRejectId(null);
      setReason("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-[75vh] bg-brand-background">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">Administration</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 text-brand-muted">Welcome, {user?.name || "Admin"}. Review lawyer applications and registered clients.</p>
          </div>
          <button type="button" onClick={() => { setLoading(true); refresh(); }} disabled={loading || Boolean(busyId)} className="rounded-lg border border-brand-border bg-white px-5 py-3 text-sm font-semibold disabled:opacity-50">Refresh</button>
        </div>

        {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-800">{notice}</p>}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Summary label="Pending applications" value={loading ? "..." : lawyers.length} />
          <Summary label="Registered clients" value={loading ? "..." : clients.length} />
        </div>

        <div className="mt-8 flex gap-2 border-b border-brand-border" role="tablist" aria-label="Admin sections">
          <Tab active={tab === "lawyers"} onClick={() => setTab("lawyers")}>Lawyer applications</Tab>
          <Tab active={tab === "clients"} onClick={() => setTab("clients")}>Clients</Tab>
        </div>

        {loading ? <p className="py-10 text-brand-muted">Loading dashboard...</p> : tab === "lawyers" ? (
          <section className="mt-6 space-y-4" aria-label="Pending lawyer applications">
            {lawyers.length === 0 && <Empty text="No lawyer applications are waiting for review." />}
            {lawyers.map((lawyer) => (
              <article key={lawyer._id} className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-brand-black">{lawyer.displayName}</h2>
                    <p className="mt-1 text-sm text-brand-muted">{lawyer.professionalTitle || "Attorney-at-Law"} · {lawyer.primaryPracticeArea || "Practice area not provided"}</p>
                    <p className="mt-1 text-sm text-brand-muted">{[lawyer.officeCity, lawyer.district].filter(Boolean).join(", ") || "Location not provided"} · Applied {formatDate(lawyer.createdAt)}</p>
                  </div>
                  <span className="rounded-full bg-brand-yellow-soft px-3 py-1 text-xs font-bold text-brand-black">Pending review</span>
                </div>
                <button type="button" aria-expanded={selectedId === lawyer._id} onClick={() => { setSelectedId(selectedId === lawyer._id ? null : lawyer._id); setRejectId(null); setReason(""); }} className="mt-5 text-sm font-bold underline underline-offset-4">{selectedId === lawyer._id ? "Hide details" : "Review application"}</button>
                {selectedId === lawyer._id && <div className="mt-5 border-t border-brand-border pt-5">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Detail label="Account email" value={lawyer.userId?.email || lawyer.email} />
                    <Detail label="Contact email" value={lawyer.email} />
                    <Detail label="Phone" value={lawyer.phone} />
                    <Detail label="Experience" value={lawyer.yearsOfPractice != null ? `${lawyer.yearsOfPractice} years` : null} />
                    <Detail label="Practice areas" value={lawyer.practiceAreas?.join(", ")} />
                    <Detail label="Languages" value={lawyer.languages?.join(", ")} />
                    <Detail label="Consultation modes" value={lawyer.consultationModes?.join(", ")} />
                    <Detail label="Province" value={lawyer.province} />
                    <Detail label="Accepting new clients" value={lawyer.acceptingNewClients ? "Yes" : "No"} />
                  </div>
                  <div className="mt-5"><Detail label="About" value={lawyer.description} /></div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" disabled={Boolean(busyId)} onClick={() => decide(lawyer, "approve")} className="rounded-lg bg-brand-black px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busyId === lawyer._id ? "Saving..." : "Approve and publish"}</button>
                    <button type="button" disabled={Boolean(busyId)} onClick={() => { setRejectId(rejectId === lawyer._id ? null : lawyer._id); setReason(""); }} className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-bold text-red-700 disabled:opacity-50">Reject</button>
                  </div>
                  {rejectId === lawyer._id && <form onSubmit={(event) => { event.preventDefault(); decide(lawyer, "reject"); }} className="mt-5 max-w-xl">
                    <label htmlFor={`reason-${lawyer._id}`} className="block text-sm font-semibold">Reason for rejection</label>
                    <textarea id={`reason-${lawyer._id}`} required maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-brand-border p-3" placeholder="Explain what the lawyer needs to correct" />
                    <button disabled={Boolean(busyId) || !reason.trim()} className="mt-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">Confirm rejection</button>
                  </form>}
                </div>}
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-6" aria-label="Registered clients">
            {clients.length === 0 ? <Empty text="No clients have registered yet." /> : (
              <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brand-background text-brand-muted"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Registered</th></tr></thead>
                  <tbody>{clients.map((client) => <tr key={client._id} className="border-t border-brand-border"><td className="p-4 font-semibold">{client.name || "Unknown"}</td><td className="p-4">{client.email}</td><td className="p-4">{formatDate(client.createdAt)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function Summary({ label, value }) {
  return <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-brand-muted">{label}</p><p className="mt-2 text-3xl font-extrabold">{value}</p></div>;
}

function Tab({ active, onClick, children }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`border-b-2 px-4 py-3 text-sm font-bold ${active ? "border-brand-black text-brand-black" : "border-transparent text-brand-muted"}`}>{children}</button>;
}

function Detail({ label, value }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm text-brand-black">{value || "Not provided"}</p></div>;
}

function Empty({ text }) {
  return <p className="rounded-2xl border border-brand-border bg-white p-8 text-brand-muted">{text}</p>;
}
