import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../context/useAuth.js";
import { apiRequest, API_URL } from "../../services/api.js";

const labels = {
  certificate: "Supreme Court enrolment certificate (PDF)",
  nicFront: "NIC front (JPG or PNG)",
  nicBack: "NIC back (JPG or PNG)",
  passport: "Passport identity page (JPG or PNG)",
};

const rejectionScopeLabels = {
  profile: "profile details",
  documents: "verification documents",
  both: "profile details and verification documents",
};

const readFile = (file) =>
  new Promise((resolve, reject) => {
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
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const closePreview = useCallback(() => {
    setPreview((current) => {
      if (current?.url) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  }, []);

  const load = useCallback(async () => {
    const data = await apiRequest("/lawyers/me/verification", { token });
    setRecord(data.verification);

    const latest = data.verification?.submissions.at(-1);
    if (latest) {
      setIdentityType(latest.identityType);
      setEnrolmentNumber(latest.enrolmentNumber);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load().catch((err) => setError(err.message));
    }, 0);

    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const previewUrl = preview?.url;

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [preview]);

  async function openFile(submission, file) {
    setError("");

    try {
      const profile = await apiRequest("/lawyers/me/profile", { token });
      const response = await fetch(
        `${API_URL}/lawyers/${profile.profile._id}/verification/submissions/${submission._id}/files/${file._id}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );

      if (!response.ok) {
        let message = "Could not open the document.";
        try {
          const data = await response.json();
          message = data.message || message;
        } catch {
          // The endpoint normally returns JSON errors, but keep a safe fallback.
        }
        throw new Error(message);
      }

      closePreview();
      const blob = await response.blob();
      setPreview({
        url: URL.createObjectURL(blob),
        name: labels[file.slot] || file.name,
        type: blob.type || file.mimeType,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const needed =
        identityType === "nic"
          ? ["certificate", "nicFront", "nicBack"]
          : ["certificate", "passport"];
      const uploaded = await Promise.all(
        needed.map(async (slot) => {
          const file = files[slot];
          if (!file || file.size > 3 * 1024 * 1024) {
            throw new Error(`Select a ${labels[slot]} file under 3 MB.`);
          }

          return {
            slot,
            name: file.name,
            mimeType: file.type,
            data: await readFile(file),
          };
        })
      );

      await apiRequest("/lawyers/me/verification", {
        method: "POST",
        token,
        body: { identityType, enrolmentNumber, files: uploaded },
      });
      setFiles({});
      closePreview();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const rejectionScope = record?.rejectionScope || "both";
  const canSubmit =
    !record ||
    (record.status === "rejected" && rejectionScope !== "profile");

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <Link to="/profile" className="underline">
        Back to profile
      </Link>
      <h1 className="mt-5 text-3xl font-bold">Lawyer verification</h1>
      <p className="mt-3">
        Status: <strong>{record?.status || "Not submitted"}</strong>
      </p>

      {record?.status === "rejected" && (
        <div className="mt-3 rounded-lg bg-red-50 p-4 text-red-800">
          <p>
            <strong>Changes requested:</strong>{" "}
            {record.reason || "Please correct the requested information."}
          </p>
          <p className="mt-2 text-sm">
            Required correction: {rejectionScopeLabels[rejectionScope]}.
          </p>
          {rejectionScope === "profile" && (
            <p className="mt-2 text-sm">
              You do not need to upload the same documents again. Update your{" "}
              <Link to="/profile/edit" className="font-semibold underline">
                professional profile
              </Link>{" "}
              and it will return to the admin review queue.
            </p>
          )}
          {rejectionScope === "both" && (
            <p className="mt-2 text-sm">
              Update your professional profile first if needed, then resubmit the
              corrected verification documents below.
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-red-700">
          {error}
        </p>
      )}

      {record?.submissions.map((submission) => (
        <section
          key={submission._id}
          className="mt-6 rounded-xl border bg-white p-5"
        >
          <h2 className="font-bold">
            Submission {submission.number},{" "}
            {new Date(submission.submittedAt).toLocaleString()}
          </h2>
          <p className="mt-2">
            Enrolment number: {submission.enrolmentNumber}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {submission.files.map((file) => (
              <button
                type="button"
                key={file._id}
                onClick={() => openFile(submission, file)}
                className="rounded border px-3 py-2 underline"
              >
                View {labels[file.slot]}
              </button>
            ))}
          </div>
        </section>
      ))}

      {preview && (
        <section className="mt-6 rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Preview: {preview.name}</h2>
            <button type="button" onClick={closePreview} className="underline">
              Close
            </button>
          </div>
          <p className="mt-2 text-sm text-brand-muted">
            Verification-document access is private and audited.
          </p>
          {preview.type === "application/pdf" ? (
            <iframe
              title={preview.name}
              src={preview.url}
              className="mt-4 h-[65vh] w-full rounded-lg border"
            />
          ) : (
            <img
              src={preview.url}
              alt={preview.name}
              className="mt-4 max-h-[65vh] w-full rounded-lg border object-contain"
            />
          )}
        </section>
      )}

      {canSubmit && (
        <form
          onSubmit={submit}
          className="mt-8 space-y-4 rounded-xl border bg-white p-5"
        >
          <h2 className="text-xl font-bold">
            {record ? "Resubmit verification" : "Submit verification"}
          </h2>
          <label className="block">
            Identity document
            <select
              value={identityType}
              onChange={(event) => {
                setIdentityType(event.target.value);
                setFiles({});
              }}
              className="ml-3 rounded border p-2"
            >
              <option value="nic">NIC</option>
              <option value="passport">Passport</option>
            </select>
          </label>
          <label className="block">
            Supreme Court enrolment number
            <input
              required
              maxLength={100}
              value={enrolmentNumber}
              onChange={(event) => setEnrolmentNumber(event.target.value)}
              className="block w-full rounded border p-2"
            />
          </label>
          {(identityType === "nic"
            ? ["certificate", "nicFront", "nicBack"]
            : ["certificate", "passport"]
          ).map((slot) => (
            <label key={slot} className="block">
              {labels[slot]}
              <input
                required
                type="file"
                accept={
                  slot === "certificate"
                    ? "application/pdf"
                    : "image/jpeg,image/png"
                }
                onChange={(event) =>
                  setFiles((old) => ({
                    ...old,
                    [slot]: event.target.files[0],
                  }))
                }
                className="block w-full p-2"
              />
            </label>
          ))}
          <button
            disabled={busy}
            className="rounded bg-brand-black px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {busy
              ? "Submitting..."
              : record
                ? "Resubmit for review"
                : "Submit for review"}
          </button>
        </form>
      )}
    </main>
  );
}
