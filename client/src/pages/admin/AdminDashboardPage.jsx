import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../context/AuthContext.jsx";
import { apiRequest } from "../../services/api.js";
import useLegalCategories from "../../features/search/hooks/useLegalCategories.js";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Not available";

export default function AdminDashboardPage() {
  const { user, token } = useAuth();
  const { categories } = useLegalCategories();
  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category.name])),
    [categories]
  );

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
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  async function decide(lawyer, action) {
    if (busyId) return;

    const trimmedReason = reason.trim();
    if (action === "reject" && !trimmedReason) {
      setError("Enter a reason before rejecting this review.");
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

      setLawyers((previous) =>
        previous.filter((item) => item._id !== lawyer._id)
      );
      setNotice(
        data.message ||
          `Review ${action === "approve" ? "approved" : "rejected"}.`
      );
      setSelectedId(null);
      setRejectId(null);
      setReason("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-[75vh] bg-brand-background">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
          Administration
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
              Admin panel
            </h1>
            <p className="mt-2 text-brand-muted">
              Welcome, {user?.name || "Admin"}. Review lawyer applications,
              profile updates and registered clients.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void refresh();
            }}
            disabled={loading || Boolean(busyId)}
            className="rounded-xl border border-brand-border bg-white px-5 py-3 text-sm font-semibold transition hover:bg-brand-background disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-800"
          >
            {notice}
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Summary label="Pending reviews" value={loading ? "..." : lawyers.length} />
          <Summary label="Registered clients" value={loading ? "..." : clients.length} />
        </div>

        <div
          className="mt-8 flex gap-2 border-b border-brand-border"
          role="tablist"
          aria-label="Admin sections"
        >
          <Tab active={tab === "lawyers"} onClick={() => setTab("lawyers")}>
            Lawyer reviews
          </Tab>
          <Tab active={tab === "clients"} onClick={() => setTab("clients")}>
            Clients
          </Tab>
        </div>

        {loading ? (
          <p className="py-10 text-brand-muted">Loading administration data...</p>
        ) : tab === "lawyers" ? (
          <section className="mt-6 space-y-4" aria-label="Pending lawyer reviews">
            {lawyers.length === 0 && (
              <Empty text="No lawyer applications or profile updates are waiting for review." />
            )}

            {lawyers.map((lawyer) => {
              const isProfileUpdate = Boolean(
                lawyer.isPublished && lawyer.pendingProfileChanges
              );

              return (
                <article
                  key={lawyer._id}
                  className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-brand-black">
                        {lawyer.displayName}
                      </h2>
                      <p className="mt-1 text-sm text-brand-muted">
                        {lawyer.professionalTitle || "Attorney-at-Law"} ·{" "}
                        {categoryNames[lawyer.primaryPracticeArea] ||
                          lawyer.primaryPracticeArea ||
                          "Practice area not provided"}
                      </p>
                      <p className="mt-1 text-sm text-brand-muted">
                        {[lawyer.officeCity, lawyer.district]
                          .filter(Boolean)
                          .join(", ") || "Location not provided"}
                        {" · "}
                        {isProfileUpdate ? "Submitted" : "Applied"}{" "}
                        {formatDate(
                          isProfileUpdate
                            ? lawyer.pendingProfileChangesSubmittedAt
                            : lawyer.createdAt
                        )}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isProfileUpdate
                          ? "bg-amber-50 text-amber-800"
                          : "bg-brand-yellow-soft text-brand-black"
                      }`}
                    >
                      {isProfileUpdate ? "Profile update" : "New application"}
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-expanded={selectedId === lawyer._id}
                    onClick={() => {
                      setSelectedId(
                        selectedId === lawyer._id ? null : lawyer._id
                      );
                      setRejectId(null);
                      setReason("");
                    }}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-black hover:text-[#806600]"
                  >
                    {selectedId === lawyer._id
                      ? "Hide review details"
                      : "Review details"}
                    <span aria-hidden="true">
                      {selectedId === lawyer._id ? "↑" : "↓"}
                    </span>
                  </button>

                  {selectedId === lawyer._id && (
                    <div className="mt-5 border-t border-brand-border pt-5">
                      {isProfileUpdate ? (
                        <ProfileUpdateReview
                          lawyer={lawyer}
                          categoryNames={categoryNames}
                        />
                      ) : (
                        <NewApplicationDetails
                          lawyer={lawyer}
                          categoryNames={categoryNames}
                        />
                      )}

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => decide(lawyer, "approve")}
                          className="rounded-xl bg-brand-yellow px-5 py-2.5 text-sm font-bold text-brand-black transition hover:bg-brand-yellow-dark disabled:opacity-50"
                        >
                          {busyId === lawyer._id
                            ? "Saving..."
                            : isProfileUpdate
                              ? "Approve update"
                              : "Approve and publish"}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => {
                            setRejectId(
                              rejectId === lawyer._id ? null : lawyer._id
                            );
                            setReason("");
                          }}
                          className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {isProfileUpdate ? "Reject update" : "Reject"}
                        </button>
                      </div>

                      {rejectId === lawyer._id && (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            void decide(lawyer, "reject");
                          }}
                          className="mt-5 max-w-xl rounded-xl bg-brand-background p-4"
                        >
                          <label
                            htmlFor={`reason-${lawyer._id}`}
                            className="block text-sm font-semibold"
                          >
                            Reason for rejection
                          </label>
                          <textarea
                            id={`reason-${lawyer._id}`}
                            required
                            maxLength={2000}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            rows={3}
                            className="mt-2 w-full rounded-lg border border-brand-border bg-white p-3 outline-none focus:border-brand-yellow-dark"
                            placeholder={
                              isProfileUpdate
                                ? "Explain why the requested profile changes were not approved"
                                : "Explain what the lawyer needs to correct"
                            }
                          />
                          <button
                            disabled={Boolean(busyId) || !reason.trim()}
                            className="mt-2 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                          >
                            Confirm rejection
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        ) : (
          <section className="mt-6" aria-label="Registered clients">
            {clients.length === 0 ? (
              <Empty text="No clients have registered yet." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brand-background text-brand-muted">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client._id} className="border-t border-brand-border">
                        <td className="p-4 font-semibold">
                          {client.name || "Unknown"}
                        </td>
                        <td className="p-4">{client.email}</td>
                        <td className="p-4">{formatDate(client.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function NewApplicationDetails({ lawyer, categoryNames }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Account email" value={lawyer.userId?.email || lawyer.email} />
        <Detail label="Contact email" value={lawyer.email} />
        <Detail label="Phone" value={lawyer.phone} />
        <Detail
          label="Experience"
          value={
            lawyer.yearsOfPractice != null
              ? `${lawyer.yearsOfPractice} years`
              : null
          }
        />
        <Detail
          label="Practice areas"
          value={lawyer.practiceAreas
            ?.map((area) => categoryNames[area] || area)
            .join(", ")}
        />
        <Detail label="Languages" value={lawyer.languages?.join(", ")} />
        <Detail
          label="Consultation modes"
          value={lawyer.consultationModes?.join(", ")}
        />
        <Detail label="Province" value={lawyer.province} />
        <Detail
          label="Accepting new clients"
          value={lawyer.acceptingNewClients ? "Yes" : "No"}
        />
      </div>
      <div className="mt-5">
        <Detail label="About" value={lawyer.description} />
      </div>
    </>
  );
}

function ProfileUpdateReview({ lawyer, categoryNames }) {
  const pending = lawyer.pendingProfileChanges || {};
  const rows = getProfileUpdateRows(lawyer, pending, categoryNames);

  return (
    <div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        This lawyer is already approved. Their current public profile stays live
        until these requested professional changes are approved.
      </div>

      {rows.length > 0 ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-brand-border">
          <div className="hidden grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] bg-brand-background px-4 py-3 text-xs font-bold uppercase tracking-wide text-brand-muted sm:grid">
            <span>Field</span>
            <span>Current</span>
            <span>Requested</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-1 gap-2 border-t border-brand-border px-4 py-4 text-sm sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] sm:gap-4"
            >
              <p className="font-bold text-brand-black">{row.label}</p>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted sm:hidden">
                  Current
                </p>
                <p className="mt-1 whitespace-pre-wrap text-brand-muted sm:mt-0">
                  {row.current || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-muted sm:hidden">
                  Requested
                </p>
                <p className="mt-1 whitespace-pre-wrap font-medium text-brand-black sm:mt-0">
                  {row.requested || "Not provided"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-brand-muted">
          No reviewable changes were provided.
        </p>
      )}
    </div>
  );
}

function getProfileUpdateRows(lawyer, pending, categoryNames) {
  const rows = [];

  function add(label, field, formatter = (value) => value) {
    if (!Object.prototype.hasOwnProperty.call(pending, field)) return;
    rows.push({
      label,
      current: formatter(lawyer[field]),
      requested: formatter(pending[field]),
    });
  }

  add("Display name", "displayName");
  add("Professional title", "professionalTitle");

  if (pending.officeCity || pending.district || pending.province) {
    rows.push({
      label: "Office location",
      current: [lawyer.officeCity, lawyer.district, lawyer.province]
        .filter(Boolean)
        .join(", "),
      requested: [pending.officeCity, pending.district, pending.province]
        .filter(Boolean)
        .join(", "),
    });
  }

  add(
    "Primary practice area",
    "primaryPracticeArea",
    (value) => categoryNames[value] || value
  );
  add(
    "Practice areas",
    "practiceAreas",
    (value) =>
      Array.isArray(value)
        ? value.map((area) => categoryNames[area] || area).join(", ")
        : value
  );
  add(
    "Areas of focus",
    "subAreas",
    (value) => (Array.isArray(value) ? value.join(", ") : value)
  );
  add("Years of practice", "yearsOfPractice", (value) =>
    value !== undefined && value !== null ? String(value) : value
  );
  add("About", "description");

  return rows;
}

function Summary({ label, value }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-brand-muted">{label}</p>
      <p className="mt-2 text-3xl font-extrabold">{value}</p>
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`border-b-2 px-4 py-3 text-sm font-bold ${
        active
          ? "border-brand-black text-brand-black"
          : "border-transparent text-brand-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-brand-black">
        {value || "Not provided"}
      </p>
    </div>
  );
}

function Empty({ text }) {
  return (
    <p className="rounded-2xl border border-brand-border bg-white p-8 text-brand-muted">
      {text}
    </p>
  );
}
