import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { apiRequest, API_URL } from "../../services/api.js";

const labels = { certificate: "Supreme Court enrolment certificate (PDF)", nicFront: "NIC front (JPG or PNG)", nicBack: "NIC back (JPG or PNG)", passport: "Passport identity page (JPG or PNG)" };
const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1]);
  reader.onerror = () => reject(new Error("Could not read the file."));
  reader.readAsDataURL(file);
});
export default function LawyerVerificationPage() {
  const { token } = useAuth();
  const [record, setRecord] = useState(null);
  const [identityType, setIdentityType] = useState("nic");
  const [enrolmentNumber, setEnrolmentNumber] = useState("");
  const [files, setFiles] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const data = await apiRequest("/lawyers/me/verification", { token });
    setRecord(data.verification);
    const latest = data.verification?.submissions.at(-1);
    if (latest) { setIdentityType(latest.identityType); setEnrolmentNumber(latest.enrolmentNumber); }
  }, [token]);
  useEffect(() => { const timer = setTimeout(() => { load().catch((err) => setError(err.message)); }, 0); return () => clearTimeout(timer); }, [load]);
  async function openFile(submission, file) {
    try {
      const profile = await apiRequest("/lawyers/me/profile", { token });
      const response = await fetch(`${API_URL}/lawyers/${profile.profile._id}/verification/submissions/${submission._id}/files/${file._id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Could not open the document.");
      const url = URL.createObjectURL(await response.blob());
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) { setError(err.message); }
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const needed = identityType === "nic" ? ["certificate", "nicFront", "nicBack"] : ["certificate", "passport"];
      const uploaded = await Promise.all(needed.map(async (slot) => {
        const file = files[slot];
        if (!file || file.size > 3 * 1024 * 1024) throw new Error(`Select a ${labels[slot]} file under 3 MB.`);
        return { slot, name: file.name, mimeType: file.type, data: await readFile(file) };
      }));
      await apiRequest("/lawyers/me/verification", { method: "POST", token, body: { identityType, enrolmentNumber, files: uploaded } });
      setFiles({}); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  const canSubmit = !record || record.status === "rejected";
  return <main className="mx-auto max-w-4xl px-5 py-10">
    <Link to="/lawyer" className="underline">Back to dashboard</Link>
    <h1 className="mt-5 text-3xl font-bold">Lawyer verification</h1>
    <p className="mt-3">Status: <strong>{record?.status || "Not submitted"}</strong></p>
    {record?.reason && <p className="mt-3 rounded-lg bg-red-50 p-4 text-red-800">Admin feedback: {record.reason}</p>}
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    {record?.submissions.map((submission) => <section key={submission._id} className="mt-6 rounded-xl border bg-white p-5">
      <h2 className="font-bold">Submission {submission.number}, {new Date(submission.submittedAt).toLocaleString()}</h2>
      <p className="mt-2">Enrolment number: {submission.enrolmentNumber}</p>
      <div className="mt-3 flex flex-wrap gap-3">{submission.files.map((file) => <button type="button" key={file._id} onClick={() => openFile(submission, file)} className="rounded border px-3 py-2 underline">View {labels[file.slot]}</button>)}</div>
    </section>)}
    {canSubmit && <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border bg-white p-5">
      <h2 className="text-xl font-bold">{record ? "Resubmit verification" : "Submit verification"}</h2>
      <label className="block">Identity document <select value={identityType} onChange={(e) => { setIdentityType(e.target.value); setFiles({}); }} className="ml-3 rounded border p-2"><option value="nic">NIC</option><option value="passport">Passport</option></select></label>
      <label className="block">Supreme Court enrolment number <input required maxLength={100} value={enrolmentNumber} onChange={(e) => setEnrolmentNumber(e.target.value)} className="block w-full rounded border p-2" /></label>
      {(identityType === "nic" ? ["certificate", "nicFront", "nicBack"] : ["certificate", "passport"]).map((slot) => <label key={slot} className="block">{labels[slot]}<input required type="file" accept={slot === "certificate" ? "application/pdf" : "image/jpeg,image/png"} onChange={(e) => setFiles((old) => ({ ...old, [slot]: e.target.files[0] }))} className="block w-full p-2" /></label>)}
      <button disabled={busy} className="rounded bg-brand-black px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Submitting..." : record ? "Resubmit for review" : "Submit for review"}</button>
    </form>}
  </main>;
}
