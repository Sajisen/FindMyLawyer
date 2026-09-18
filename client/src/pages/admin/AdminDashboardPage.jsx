import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/useAuth.js";
import { apiRequest, API_URL } from "../../services/api.js";

const labels = { pending: "Pending", approved: "Approved", rejected: "Changes requested" };
const actionNames = { verification_decision_updated: "Decision updated", verification_resubmitted: "Verification resubmitted", verification_submitted: "Verification submitted", profile_updated: "Profile updated", admin_created: "Admin created" };
const fileNames = { certificate: "Enrolment certificate", nicFront: "NIC front", nicBack: "NIC back", passport: "Passport" };
const date = (value) => value ? new Date(value).toLocaleString() : "Not available";
const th = "bg-brand-background px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-brand-muted";
const td = "border-t border-brand-border px-4 py-3 text-sm align-top";
const button = "rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold hover:bg-brand-background disabled:opacity-50";
function Status({ value }) { return <span className={`rounded-full px-3 py-1 text-xs font-bold ${value === "approved" ? "bg-green-50 text-green-800" : value === "rejected" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>{labels[value] || value}</span>; }
function Table({ headers, rows, empty }) { return <div className="overflow-x-auto rounded-xl border border-brand-border bg-white"><table className="w-full min-w-[650px] text-left"><thead><tr>{headers.map((head) => <th key={head} className={th}>{head}</th>)}</tr></thead><tbody>{rows}</tbody></table>{!rows.length && <p className="p-6 text-center text-brand-muted">{empty}</p>}</div>; }

export default function AdminDashboardPage() {
  const { user, token } = useAuth();
  const [lawyers, setLawyers] = useState([]);
  const [clients, setClients] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [activity, setActivity] = useState([]);
  const [tab, setTab] = useState("lawyers");
  const [userTab, setUserTab] = useState("clients");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [verification, setVerification] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [preview, setPreview] = useState(null);
  const [decision, setDecision] = useState("pending");
  const [reason, setReason] = useState("");
  const [rejectionScope, setRejectionScope] = useState("both");
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const refresh = useCallback(async () => {
    const [people, customers, staff, logs] = await Promise.all([apiRequest("/admin/lawyers", { token }), apiRequest("/admin/clients", { token }), apiRequest("/admin/admins", { token }), apiRequest("/admin/activity", { token })]);
    const nextLawyers = people.lawyers || [];
    setLawyers(nextLawyers); setClients(customers.clients || []); setAdmins(staff.admins || []); setActivity(logs.entries || []);
    return nextLawyers;
  }, [token]);
  useEffect(() => { const timer = setTimeout(() => { refresh().catch((err) => setError(err.message)).finally(() => setLoading(false)); }, 0); return () => clearTimeout(timer); }, [refresh]);
  const counts = { all: lawyers.length, pending: lawyers.filter((row) => row.reviewStatus === "pending").length, resubmitted: lawyers.filter((row) => row.resubmitted && row.reviewStatus === "pending").length, approved: lawyers.filter((row) => row.reviewStatus === "approved").length, rejected: lawyers.filter((row) => row.reviewStatus === "rejected").length };
  const visible = useMemo(() => lawyers.filter((row) => (filter === "all" || (filter === "resubmitted" ? row.resubmitted && row.reviewStatus === "pending" : row.reviewStatus === filter)) && `${row.displayName} ${row.userId?.email || row.email} ${row.primaryPracticeArea}`.toLowerCase().includes(query.trim().toLowerCase())), [lawyers, filter, query]);
  const names = Object.fromEntries(lawyers.map((row) => [row._id, row.displayName]));
  const canApprove = Boolean(verification?.submissions?.length || selected?.isPublished || history.some((entry) => entry.previous?.status === "approved"));
  function closePreview() { if (preview?.url) URL.revokeObjectURL(preview.url); setPreview(null); }
  async function toggleProfile(row) {
    if (selected?._id === row._id) { closePreview(); setSelected(null); return; }
    closePreview(); setSelected(row); setVerification(null); setHistory([]); setShowHistory(false); setDetailsLoading(true); setError(""); setDecision(row.reviewStatus); setReason(row.rejectionReason || ""); setRejectionScope("both");
    try {
      const [docs, log] = await Promise.all([apiRequest(`/admin/lawyers/${row._id}/verification`, { token }), apiRequest(`/admin/lawyers/${row._id}/activity`, { token })]);
      setVerification(docs.verification); setHistory(log.entries || []); setReason(docs.verification?.reason || row.rejectionReason || ""); setRejectionScope(docs.verification?.rejectionScope || "both");
    } catch (err) { setError(err.message); } finally { setDetailsLoading(false); }
  }
  async function openDocument(submission, file) {
    closePreview(); setError("");
    try {
      const response = await fetch(`${API_URL}/admin/lawyers/${selected._id}/verification/submissions/${submission._id}/files/${file._id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Could not load the document.");
      setPreview({ url: URL.createObjectURL(await response.blob()), name: fileNames[file.slot] || file.name, type: file.mimeType });
    } catch (err) { setError(err.message); }
  }
  async function saveDecision(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const result = await apiRequest(`/admin/lawyers/${selected._id}/decision`, { method: "PATCH", token, body: { decision, reason, rejectionScope } });
      const refreshedLawyers = await refresh();
      const [docs, log] = await Promise.all([apiRequest(`/admin/lawyers/${selected._id}/verification`, { token }), apiRequest(`/admin/lawyers/${selected._id}/activity`, { token })]);
      setVerification(docs.verification); setHistory(log.entries || []); setRejectionScope(docs.verification?.rejectionScope || "both"); setSelected(refreshedLawyers.find((row) => row._id === selected._id) || result.lawyer || selected); setNotice(result.message || "Decision saved.");
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function addAdmin(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { const result = await apiRequest("/admin/admins", { method: "POST", token, body: newAdmin }); setNewAdmin({ name: "", email: "", password: "" }); setShowAdminForm(false); await refresh(); setNotice(result.message || "Admin created."); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function reload() { setLoading(true); try { await refresh(); setNotice("Data refreshed."); } catch (err) { setError(err.message); } finally { setLoading(false); } }
  return <main className="min-h-[75vh] bg-brand-background px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-widest text-amber-800">Administration</p><h1 className="mt-2 text-3xl font-extrabold">Admin dashboard</h1><p className="mt-2 text-brand-muted">Welcome, {user?.name || "Admin"}. Review lawyers and manage users.</p></div><button className={button} disabled={loading || busy} type="button" onClick={reload}>Refresh</button></header>
    {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}{notice && <p role="status" className="mt-5 rounded-lg bg-green-50 p-4 text-green-800">{notice}</p>}
    <section aria-label="Lawyer analytics" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{[["all", "All lawyers"], ["pending", "Pending"], ["resubmitted", "Resubmitted"], ["approved", "Approved"], ["rejected", "Changes requested"]].map(([key, label]) => <button type="button" key={key} onClick={() => { setTab("lawyers"); setFilter(key); closePreview(); setSelected(null); }} className={`rounded-xl border bg-white p-5 text-left shadow-sm hover:border-brand-black ${tab === "lawyers" && filter === key ? "border-brand-black" : "border-brand-border"}`}><p className="text-sm text-brand-muted">{label}</p><p className="mt-2 text-3xl font-extrabold">{loading ? "..." : counts[key]}</p></button>)}</section>
    <nav aria-label="Admin sections" className="mt-8 flex gap-2 border-b border-brand-border">{[["lawyers", "Lawyer reviews"], ["users", "Users"], ["activity", "Admin activity"]].map(([key, label]) => <button key={key} type="button" onClick={() => setTab(key)} aria-current={tab === key ? "page" : undefined} className={`border-b-2 px-4 py-3 text-sm font-bold ${tab === key ? "border-brand-black" : "border-transparent text-brand-muted"}`}>{label}</button>)}</nav>
    {tab === "lawyers" && <section className="mt-6"><h2 className="text-xl font-bold">Lawyer profiles</h2><p className="text-sm text-brand-muted">Open a profile in the list to review it.</p><div className="mt-4 flex flex-wrap gap-3"><label className="sr-only" htmlFor="lawyer-search">Search lawyers</label><input id="lawyer-search" type="search" placeholder="Search name, email or practice area" value={query} onChange={(event) => setQuery(event.target.value)} className="w-full max-w-lg rounded-lg border border-brand-border bg-white p-3" /><label className="sr-only" htmlFor="lawyer-filter">Status</label><select id="lawyer-filter" value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-brand-border bg-white p-3"><option value="all">All statuses</option><option value="pending">Pending</option><option value="resubmitted">Resubmitted</option><option value="approved">Approved</option><option value="rejected">Changes requested</option></select></div><p className="my-4 text-sm text-brand-muted">{visible.length} profiles shown</p>
      <div className="space-y-3">{!visible.length && <p className="rounded-xl border bg-white p-6">No matching lawyers.</p>}{visible.map((row) => <article key={row._id} className="overflow-hidden rounded-xl border border-brand-border bg-white"><button type="button" aria-expanded={selected?._id === row._id} onClick={() => toggleProfile(row)} className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left hover:bg-brand-background"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-lg">{row.displayName}</strong><Status value={row.reviewStatus} />{row.resubmitted && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">Resubmitted</span>}</div><p className="mt-1 text-sm text-brand-muted">{row.userId?.email || row.email} · {row.primaryPracticeArea || "No practice area"} · {row.officeCity || "No city"}</p></div><strong className="text-sm">{selected?._id === row._id ? "Collapse ↑" : "View profile ↓"}</strong></button>
      {selected?._id === row._id && <div className="border-t border-brand-border p-5 sm:p-7">{detailsLoading ? <p>Loading details...</p> : <><h3 className="text-lg font-bold">Profile details</h3><div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><p><strong>Phone:</strong> {row.phone || "Not provided"}</p><p><strong>Location:</strong> {[row.officeCity, row.district].filter(Boolean).join(", ") || "Not provided"}</p><p><strong>Experience:</strong> {row.yearsOfPractice ?? "Not provided"} years</p><p><strong>Practice areas:</strong> {row.practiceAreas?.join(", ") || "Not provided"}</p></div>{row.description && <p className="mt-4 rounded-lg bg-brand-background p-4 text-sm">{row.description}</p>}
        {row.pendingProfileChanges && <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm"><h3 className="font-bold">Professional profile update awaiting review</h3><p className="mt-1">The already approved public profile stays live while these requested changes are reviewed.</p><dl className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(row.pendingProfileChanges).map(([key, value]) => <div key={key}><dt className="font-semibold">{key.replaceAll(/([A-Z])/g, " $1")}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value)}</dd></div>)}</dl></div>}
        <h3 className="mt-7 text-lg font-bold">Verification documents</h3>{!verification?.submissions?.length && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm">No documents submitted. New lawyers need a submission before approval.</p>}{verification?.submissions.slice().reverse().map((submission) => <div key={submission._id} className="mt-3 rounded-lg border border-brand-border p-4"><p className="font-semibold">Submission {submission.number} <span className="font-normal text-brand-muted">· {date(submission.submittedAt)}</span></p><p className="mt-1 text-sm">Enrolment: {submission.enrolmentNumber} · {submission.identityType?.toUpperCase()}</p><div className="mt-3 flex flex-wrap gap-2">{submission.files.map((file) => <button type="button" key={file._id} onClick={() => openDocument(submission, file)} className={button}>View {fileNames[file.slot] || file.slot}</button>)}</div></div>)}
        {preview && <div className="mt-4 rounded-xl border border-brand-border bg-brand-background p-4"><div className="mb-3 flex justify-between gap-2"><h4 className="font-bold">Preview: {preview.name}</h4><button type="button" className={button} onClick={closePreview}>Close</button></div>{preview.type === "application/pdf" ? <iframe title={preview.name} src={preview.url} className="h-[65vh] w-full rounded-lg border bg-white" /> : <img src={preview.url} alt={preview.name} className="max-h-[65vh] max-w-full rounded-lg border bg-white object-contain" />}</div>}
        <form onSubmit={saveDecision} className="mt-7 rounded-xl border border-brand-border bg-brand-background p-5"><h3 className="text-lg font-bold">Review decision</h3><p className="mt-1 text-sm text-brand-muted">You can correct a decision later. Changes are recorded in profile history.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Decision<select value={decision} onChange={(event) => setDecision(event.target.value)} className="mt-2 block w-full rounded-lg border p-3"><option value="pending">Keep pending</option><option value="approved">Approve and publish</option><option value="rejected">Request changes</option></select></label><label className="text-sm font-semibold">Reason<textarea rows={3} maxLength={2000} required={decision === "rejected"} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 block w-full rounded-lg border p-3" placeholder="Explain what needs correction" /></label></div>{decision === "rejected" && !selected?.isPublished && <label className="mt-4 block text-sm font-semibold">What needs correction?<select value={rejectionScope} onChange={(event) => setRejectionScope(event.target.value)} className="mt-2 block w-full max-w-md rounded-lg border p-3"><option value="profile">Profile details only</option><option value="documents">Verification documents only</option><option value="both">Profile details and verification documents</option></select><span className="mt-1 block font-normal text-brand-muted">This controls whether the lawyer must upload new documents or only edit the profile before returning to review.</span></label>}{decision === "approved" && !canApprove && <p className="mt-2 text-sm text-amber-900">Documents must be submitted first.</p>}<button disabled={busy || (decision === "approved" && !canApprove)} className="mt-4 rounded-lg bg-brand-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Saving..." : "Save decision"}</button></form>
        <div className="mt-7"><button className={button} type="button" aria-expanded={showHistory} onClick={() => setShowHistory((open) => !open)}>Profile history ({history.length}) {showHistory ? "↑" : "↓"}</button>{showHistory && <div className="mt-4"><Table headers={["Date", "User", "Action", "Change", "Reason"]} empty="No history yet." rows={history.map((entry) => <tr key={entry._id}><td className={td}>{date(entry.createdAt)}</td><td className={td}>{entry.actorName} ({entry.actorRole})</td><td className={td}>{actionNames[entry.action] || entry.action}</td><td className={td}>{entry.previous?.status || "New"} → {entry.next?.status || "Updated"}</td><td className={td}>{entry.reason || "—"}</td></tr>)} /></div>}</div>
      </>}</div>}</article>)}</div></section>}
    {tab === "activity" && <section className="mt-6"><h2 className="mb-4 text-xl font-bold">Admin activity</h2><Table headers={["Date", "Admin", "Action", "Lawyer", "Change", "Reason"]} empty="No admin actions recorded." rows={activity.map((entry) => <tr key={entry._id}><td className={td}>{date(entry.createdAt)}</td><td className={td}>{entry.actorName}</td><td className={td}>{actionNames[entry.action] || entry.action}</td><td className={td}>{entry.lawyer ? names[String(entry.lawyer)] || "Lawyer profile" : "—"}</td><td className={td}>{entry.previous?.status || "New"} → {entry.next?.status || entry.next?.name || "Updated"}</td><td className={td}>{entry.reason || "—"}</td></tr>)} /></section>}
    {tab === "users" && <section className="mt-6"><h2 className="text-xl font-bold">Users</h2><div className="my-5 flex flex-wrap gap-2">{[["clients", clients.length], ["lawyers", lawyers.length], ["admins", admins.length]].map(([key, count]) => <button key={key} type="button" onClick={() => setUserTab(key)} className={`${button} ${userTab === key ? "border-brand-black" : ""}`}>{key[0].toUpperCase() + key.slice(1)} ({count})</button>)}</div>
      {userTab === "clients" && <Table headers={["Name", "Email", "Registered"]} empty="No clients registered." rows={clients.map((row) => <tr key={row._id}><td className={td}>{row.name}</td><td className={td}>{row.email}</td><td className={td}>{date(row.createdAt)}</td></tr>)} />}
      {userTab === "lawyers" && <Table headers={["Name", "Email", "Status", "Registered"]} empty="No lawyers registered." rows={lawyers.map((row) => <tr key={row._id}><td className={td}>{row.displayName}</td><td className={td}>{row.userId?.email || row.email}</td><td className={td}><Status value={row.reviewStatus} /></td><td className={td}>{date(row.createdAt)}</td></tr>)} />}
      {userTab === "admins" && <><div className="mb-4 flex justify-end"><button type="button" className={button} onClick={() => setShowAdminForm((open) => !open)}>{showAdminForm ? "Cancel" : "Add admin"}</button></div>{showAdminForm && <form onSubmit={addAdmin} className="mb-5 max-w-xl space-y-4 rounded-xl border bg-white p-5"><h3 className="font-bold">Add an admin</h3>{[["name", "Full name", "text"], ["email", "Email", "email"], ["password", "Password", "password"]].map(([key, label, type]) => <label key={key} className="block text-sm font-semibold">{label}<input type={type} required minLength={key === "password" ? 8 : undefined} value={newAdmin[key]} onChange={(event) => setNewAdmin((old) => ({ ...old, [key]: event.target.value }))} className="mt-2 block w-full rounded-lg border p-3" /></label>)}<button disabled={busy} className="rounded-lg bg-brand-black px-5 py-3 font-bold text-white disabled:opacity-50">Create admin</button></form>}<Table headers={["Name", "Email", "Created"]} empty="No admins found." rows={admins.map((row) => <tr key={row._id}><td className={td}>{row.name}</td><td className={td}>{row.email}</td><td className={td}>{date(row.createdAt)}</td></tr>)} /></>}
    </section>}
  </div></main>;
}
