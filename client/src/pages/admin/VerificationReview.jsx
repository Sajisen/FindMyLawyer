import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiRequest, API_URL } from "../../services/api.js";

const labels = { certificate: "Enrolment certificate", nicFront: "NIC front", nicBack: "NIC back", passport: "Passport" };

export default function VerificationReview({ lawyerId, onReviewed }) {
  const { token, user } = useAuth();
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [checks, setChecks] = useState({ enrolment: false, identity: false });
  const [preview, setPreview] = useState(null);
  const load = useCallback(async () => {
    const result = await apiRequest(`/admin/lawyers/${lawyerId}/verification`, { token });
    setRecord(result.verification);
  }, [lawyerId, token]);
  useEffect(() => { const timer = setTimeout(() => { void load().catch((err) => setError(err.message)); }, 0); return () => clearTimeout(timer); }, [load]);
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url); }, [preview]);

  async function view(kind) {
    setBusy(true); setError(""); setPreview(null);
    try {
      const response = await fetch(`${API_URL}/admin/lawyers/${lawyerId}/verification/documents/${kind}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Could not open document.");
      }
      const blob = await response.blob();
      setPreview({ kind, url: URL.createObjectURL(blob), type: blob.type, openedAt: new Date().toLocaleString() });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function review(action) {
    setBusy(true); setError("");
    try {
      const result = await apiRequest(`/admin/lawyers/${lawyerId}/verification`, {
        method: "PATCH", token,
        body: action === "verify"
          ? { action, enrolmentConfirmed: checks.enrolment, identityConfirmed: checks.identity }
          : { action, note: note.trim() },
      });
      setRecord(result.verification); setPreview(null); onReviewed?.();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (!record) return <p className="mt-4">{error || "Loading verification..."}</p>;
  const visibleKinds = record.identityType === "passport" ? ["certificate", "passport"] : ["certificate", "nicFront", "nicBack"];
  return <section className="mt-6 rounded-xl border border-brand-border bg-brand-background p-5" aria-label="Verification documents">
    <h3 className="text-lg font-bold">Document verification</h3>
    <p className="mt-2 text-sm">Status: {record.status.replaceAll("_", " ")} · Enrolment number: {record.enrolmentNumber || "Not submitted"}</p>
    {record.reviewNote && <p className="mt-2 text-sm">Review note: {record.reviewNote}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <div className="mt-4 flex flex-wrap gap-2">{visibleKinds.map((kind) => <button key={kind} type="button" disabled={busy || !record.documents[kind]} onClick={() => view(kind)} className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50">View {labels[kind]}{!record.documents[kind] ? " (missing)" : ""}</button>)}</div>
    {preview && <div className="mt-4">
      <p className="text-sm font-semibold">Viewing {labels[preview.kind]}. Access is logged. Do not share this document.</p>
      <div className="relative mt-2 overflow-hidden rounded-lg border border-brand-border bg-white">
        {preview.type === "application/pdf"
          ? <iframe title="Enrolment certificate preview" src={`${preview.url}#toolbar=0&navpanes=0`} className="h-[650px] w-full" />
          : <img src={preview.url} alt={`${labels[preview.kind]} preview`} className="max-h-[650px] w-full object-contain" />}
        <div aria-hidden="true" className="pointer-events-none absolute bottom-4 right-4 rounded bg-white/80 px-3 py-2 text-xs font-bold text-black">Reviewed by {user?.email} · {preview.openedAt}</div>
      </div>
      <button type="button" onClick={() => setPreview(null)} className="mt-2 text-sm font-bold underline">Close viewer</button>
    </div>}
    {record.status === "pending_review" && <div className="mt-5 space-y-3 border-t border-brand-border pt-4 text-sm">
      <p>Check enrolment independently before marking verified.</p>
      <label className="flex items-center gap-2"><input type="checkbox" checked={checks.enrolment} onChange={(event) => setChecks((previous) => ({ ...previous, enrolment: event.target.checked }))} /> I independently confirmed the Supreme Court enrolment details.</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={checks.identity} onChange={(event) => setChecks((previous) => ({ ...previous, identity: event.target.checked }))} /> The identity document matches the enrolled lawyer.</label>
      <button type="button" disabled={busy || !checks.enrolment || !checks.identity} onClick={() => review("verify")} className="rounded-lg bg-brand-black px-4 py-2 font-bold text-white disabled:opacity-50">Mark documents verified</button>
      <label className="block font-semibold">Request corrected documents<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={2000} className="mt-1 block w-full rounded-lg border border-brand-border p-3" /></label>
      <button type="button" disabled={busy || !note.trim()} onClick={() => review("request_changes")} className="rounded-lg border border-brand-border bg-white px-4 py-2 font-bold disabled:opacity-50">Request changes</button>
    </div>}
  </section>;
}
