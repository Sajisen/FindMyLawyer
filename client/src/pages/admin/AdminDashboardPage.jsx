import { useCallback, useEffect, useMemo, useState } from "react";

import LawyerAvatar from "../../features/lawyers/components/LawyerAvatar.jsx";
import { useAuth } from "../../context/useAuth.js";
import { apiRequest, API_URL } from "../../services/api.js";

const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Changes requested",
};

const actionNames = {
  verification_decision_updated: "Verification decision updated",
  verification_resubmitted: "Verification resubmitted",
  verification_submitted: "Verification submitted",
  profile_updated: "Profile updated",
  profile_image_updated: "Profile image updated",
  profile_image_removed: "Profile image removed",
  admin_created: "Admin created",
  location_created: "Location created",
  location_updated: "Location updated",
  location_archived: "Location archived",
  location_restored: "Location restored",
  location_deleted: "Location deleted",
  user_status_updated: "Account status updated",
};

const fileNames = {
  certificate: "Enrolment certificate",
  nicFront: "NIC front",
  nicBack: "NIC back",
  passport: "Passport",
};

const emptyLocationForm = {
  city: "",
  district: "",
  province: "",
};

const th =
  "bg-brand-background px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-brand-muted";
const td = "border-t border-brand-border px-4 py-3 text-sm align-top";
const secondaryButton =
  "rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-bold text-brand-black transition hover:bg-brand-background disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton =
  "rounded-xl bg-brand-yellow px-5 py-2.5 text-sm font-extrabold text-brand-black transition hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:opacity-50";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "Not available";
}

function formatFieldName(value) {
  return value
    .replaceAll(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

function describeActivityChange(entry) {
  if (entry.previous?.status || entry.next?.status) {
    return `${entry.previous?.status || "New"} → ${entry.next?.status || "Updated"}`;
  }

  if (entry.action === "location_created") return "Created";
  if (entry.action === "location_deleted") return "Deleted";
  if (entry.action === "location_archived") return "Active → Archived";
  if (entry.action === "location_restored") return "Archived → Active";
  if (entry.action === "location_updated") {
    return `${entry.previous?.city || "Location"} → ${entry.next?.city || "Updated"}`;
  }
  if (entry.action === "admin_created") return "Administrator created";
  if (entry.action === "user_status_updated") {
    return `${entry.previous?.isActive === false ? "Disabled" : "Active"} → ${entry.next?.isActive === false ? "Disabled" : "Active"}`;
  }

  return "Updated";
}

function Status({ value }) {
  const className =
    value === "approved"
      ? "bg-green-50 text-green-800"
      : value === "rejected"
        ? "bg-red-50 text-red-800"
        : "bg-amber-50 text-amber-800";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {statusLabels[value] || value}
    </span>
  );
}

function Table({ headers, rows, empty }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-brand-border bg-white shadow-sm">
      <table className="w-full min-w-[650px] text-left">
        <thead>
          <tr>
            {headers.map((head) => (
              <th key={head} className={th}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      {rows.length === 0 && (
        <p className="p-8 text-center text-sm text-brand-muted">{empty}</p>
      )}
    </div>
  );
}

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
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [locations, setLocations] = useState([]);
  const [locationDivisions, setLocationDivisions] = useState({
    provinces: [],
    districts: [],
  });
  const [locationQuery, setLocationQuery] = useState("");
  const [locationStatus, setLocationStatus] = useState("all");
  const [locationPage, setLocationPage] = useState(1);
  const [locationMeta, setLocationMeta] = useState({
    total: 0,
    totalPages: 1,
  });
  const [locationForm, setLocationForm] = useState(emptyLocationForm);
  const [editingLocationId, setEditingLocationId] = useState("");
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const closePreview = useCallback(() => {
    setPreview(null);
  }, []);

  useEffect(() => {
    const url = preview?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [preview?.url]);

  const refreshCoreData = useCallback(async () => {
    const [people, customers, staff, logs, divisions] = await Promise.all([
      apiRequest("/admin/lawyers", { token }),
      apiRequest("/admin/clients", { token }),
      apiRequest("/admin/admins", { token }),
      apiRequest("/admin/activity", { token }),
      apiRequest("/admin/locations/divisions", { token }),
    ]);

    const nextLawyers = people.lawyers || [];
    setLawyers(nextLawyers);
    setClients(customers.clients || []);
    setAdmins(staff.admins || []);
    setActivity(logs.entries || []);
    setLocationDivisions({
      provinces: divisions.provinces || [],
      districts: divisions.districts || [],
    });
    return nextLawyers;
  }, [token]);

  const loadLocations = useCallback(async (overrides = {}) => {
    const requestedPage = overrides.page ?? locationPage;
    const requestedStatus = overrides.status ?? locationStatus;
    const requestedQuery = overrides.query ?? locationQuery;
    const params = new URLSearchParams({
      page: String(requestedPage),
      limit: "25",
      status: requestedStatus,
    });

    if (requestedQuery.trim()) {
      params.set("query", requestedQuery.trim());
    }

    const data = await apiRequest(`/admin/locations?${params.toString()}`, {
      token,
    });
    setLocations(data.locations || []);
    setLocationMeta({
      total: data.total || 0,
      totalPages: data.totalPages || 1,
    });
  }, [locationPage, locationQuery, locationStatus, token]);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        await refreshCoreData();
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [refreshCoreData]);

  useEffect(() => {
    if (tab !== "locations") {
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        if (active) setLocationLoading(true);
        await loadLocations();
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLocationLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadLocations, tab]);

  const counts = useMemo(
    () => ({
      all: lawyers.length,
      pending: lawyers.filter((row) => row.reviewStatus === "pending").length,
      resubmitted: lawyers.filter(
        (row) => row.resubmitted && row.reviewStatus === "pending"
      ).length,
      approved: lawyers.filter((row) => row.reviewStatus === "approved").length,
      rejected: lawyers.filter((row) => row.reviewStatus === "rejected").length,
    }),
    [lawyers]
  );

  const visibleLawyers = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return lawyers.filter((row) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "resubmitted"
          ? row.resubmitted && row.reviewStatus === "pending"
          : row.reviewStatus === filter);
      const haystack = `${row.displayName} ${row.userId?.email || row.email} ${row.primaryPracticeArea} ${row.officeCity}`.toLowerCase();

      return matchesFilter && haystack.includes(cleanQuery);
    });
  }, [filter, lawyers, query]);

  const lawyerNames = useMemo(
    () => Object.fromEntries(lawyers.map((row) => [row._id, row.displayName])),
    [lawyers]
  );

  const availableDistricts = useMemo(
    () =>
      locationDivisions.districts.filter(
        (entry) => entry.province === locationForm.province
      ),
    [locationDivisions.districts, locationForm.province]
  );

  const canApprove = Boolean(
    verification?.submissions?.length ||
      selected?.isPublished ||
      history.some((entry) => entry.previous?.status === "approved")
  );
  const isProfileUpdateReview = Boolean(
    selected?.isPublished && selected?.pendingProfileChanges
  );

  async function toggleProfile(row) {
    if (selected?._id === row._id) {
      closePreview();
      setSelected(null);
      return;
    }

    closePreview();
    setSelected(row);
    setVerification(null);
    setHistory([]);
    setShowHistory(false);
    setDetailsLoading(true);
    setError("");
    setDecision(row.reviewStatus);
    setReason(row.rejectionReason || row.profileUpdateRejectionReason || "");
    setRejectionScope("both");

    try {
      const [docs, log] = await Promise.all([
        apiRequest(`/admin/lawyers/${row._id}/verification`, { token }),
        apiRequest(`/admin/lawyers/${row._id}/activity`, { token }),
      ]);
      setVerification(docs.verification);
      setHistory(log.entries || []);
      setReason(
        docs.verification?.reason ||
          row.rejectionReason ||
          row.profileUpdateRejectionReason ||
          ""
      );
      setRejectionScope(docs.verification?.rejectionScope || "both");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function openDocument(submission, file) {
    closePreview();
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/admin/lawyers/${selected._id}/verification/submissions/${submission._id}/files/${file._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Could not load the document.");
      }

      setPreview({
        url: URL.createObjectURL(await response.blob()),
        name: fileNames[file.slot] || file.name,
        type: file.mimeType,
      });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function saveDecision(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(
        `/admin/lawyers/${selected._id}/decision`,
        {
          method: "PATCH",
          token,
          body: {
            decision,
            reason: decision === "rejected" ? reason : "",
            rejectionScope:
              decision === "rejected" && !isProfileUpdateReview
                ? rejectionScope
                : undefined,
          },
        }
      );
      const refreshedLawyers = await refreshCoreData();
      const [docs, log] = await Promise.all([
        apiRequest(`/admin/lawyers/${selected._id}/verification`, { token }),
        apiRequest(`/admin/lawyers/${selected._id}/activity`, { token }),
      ]);
      const refreshedSelected =
        refreshedLawyers.find((row) => row._id === selected._id) ||
        result.lawyer ||
        selected;

      setVerification(docs.verification);
      setHistory(log.entries || []);
      setRejectionScope(docs.verification?.rejectionScope || "both");
      setSelected(refreshedSelected);
      setDecision(refreshedSelected.reviewStatus || decision);
      setReason(
        docs.verification?.reason ||
          refreshedSelected.rejectionReason ||
          refreshedSelected.profileUpdateRejectionReason ||
          ""
      );
      setNotice(result.message || "Decision saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function addAdmin(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest("/admin/admins", {
        method: "POST",
        token,
        body: newAdmin,
      });
      setNewAdmin({ name: "", email: "", password: "" });
      setShowAdminForm(false);
      await refreshCoreData();
      setNotice(result.message || "Admin created.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleUserStatus(target, nextActive) {
    const targetId = target?._id || target?.id;
    const label = target?.displayName || target?.name || target?.email || "this account";

    if (!targetId) {
      setError("This account is missing its user identifier.");
      return;
    }

    const confirmed = window.confirm(
      nextActive
        ? `Re-enable ${label}? They will need to sign in again.`
        : `Disable ${label}? Existing sessions will stop working and the account will not be able to sign in.`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/admin/users/${targetId}/status`, {
        method: "PATCH",
        token,
        body: { isActive: nextActive },
      });
      await refreshCoreData();
      setNotice(result.message || "Account status updated.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  function openAddLocation() {
    setEditingLocationId("");
    setLocationForm(emptyLocationForm);
    setShowLocationForm(true);
    setError("");
    setNotice("");
  }

  function openEditLocation(location) {
    setEditingLocationId(location.id || location._id);
    setLocationForm({
      city: location.city,
      district: location.district,
      province: location.province,
    });
    setShowLocationForm(true);
    setError("");
    setNotice("");
  }

  function closeLocationForm() {
    setShowLocationForm(false);
    setEditingLocationId("");
    setLocationForm(emptyLocationForm);
  }

  async function saveLocation(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const endpoint = editingLocationId
        ? `/admin/locations/${editingLocationId}`
        : "/admin/locations";
      const result = await apiRequest(endpoint, {
        method: editingLocationId ? "PATCH" : "POST",
        token,
        body: locationForm,
      });

      closeLocationForm();
      setLocationPage(1);
      await Promise.all([refreshCoreData(), loadLocations({ page: 1 })]);
      setNotice(result.message || "Location saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeLocation(location) {
    const confirmed = window.confirm(
      `Remove ${location.city}, ${location.district}? If it is already used by lawyer data it will be archived instead of permanently deleted.`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/admin/locations/${location.id}`, {
        method: "DELETE",
        token,
      });
      setLocationPage(1);
      await Promise.all([refreshCoreData(), loadLocations({ page: 1 })]);
      setNotice(result.message || "Location removed.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function restoreLocation(location) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(`/admin/locations/${location.id}`, {
        method: "PATCH",
        token,
        body: {
          city: location.city,
          district: location.district,
          province: location.province,
          isActive: true,
        },
      });
      await Promise.all([refreshCoreData(), loadLocations()]);
      setNotice(result.message || "Location restored.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function reload() {
    setLoading(true);
    setError("");

    try {
      await refreshCoreData();
      if (tab === "locations") await loadLocations();
      setNotice("Data refreshed.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[75vh] bg-brand-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-amber-800">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-extrabold">Admin dashboard</h1>
            <p className="mt-2 max-w-2xl text-brand-muted">
              Welcome, {user?.name || "Admin"}. Review lawyer applications,
              manage users, and maintain the controlled location catalogue.
            </p>
          </div>
          <button
            className={secondaryButton}
            disabled={loading || busy}
            type="button"
            onClick={reload}
          >
            {loading ? "Refreshing..." : "Refresh data"}
          </button>
        </header>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {notice}
          </p>
        )}

        <section
          aria-label="Lawyer analytics"
          className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          {[
            ["all", "All lawyers"],
            ["pending", "Pending"],
            ["resubmitted", "Resubmitted"],
            ["approved", "Approved"],
            ["rejected", "Changes requested"],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() => {
                setTab("lawyers");
                setFilter(key);
                closePreview();
                setSelected(null);
              }}
              className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-black ${
                tab === "lawyers" && filter === key
                  ? "border-brand-black ring-1 ring-brand-black"
                  : "border-brand-border"
              }`}
            >
              <p className="text-sm text-brand-muted">{label}</p>
              <p className="mt-2 text-3xl font-extrabold">
                {loading ? "..." : counts[key]}
              </p>
            </button>
          ))}
        </section>

        <nav
          aria-label="Admin sections"
          className="mt-8 flex gap-1 overflow-x-auto border-b border-brand-border"
        >
          {[
            ["lawyers", "Lawyer reviews"],
            ["users", "Users"],
            ["locations", "Locations"],
            ["activity", "Admin activity"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-current={tab === key ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold ${
                tab === key
                  ? "border-brand-black text-brand-black"
                  : "border-transparent text-brand-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {tab === "lawyers" && (
          <LawyerReviewSection
            visibleLawyers={visibleLawyers}
            query={query}
            setQuery={setQuery}
            filter={filter}
            setFilter={setFilter}
            selected={selected}
            toggleProfile={toggleProfile}
            detailsLoading={detailsLoading}
            verification={verification}
            preview={preview}
            closePreview={closePreview}
            openDocument={openDocument}
            decision={decision}
            setDecision={setDecision}
            reason={reason}
            setReason={setReason}
            rejectionScope={rejectionScope}
            setRejectionScope={setRejectionScope}
            canApprove={canApprove}
            isProfileUpdateReview={isProfileUpdateReview}
            busy={busy}
            saveDecision={saveDecision}
            history={history}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
          />
        )}

        {tab === "users" && (
          <UsersSection
            userTab={userTab}
            setUserTab={setUserTab}
            clients={clients}
            lawyers={lawyers}
            admins={admins}
            showAdminForm={showAdminForm}
            setShowAdminForm={setShowAdminForm}
            newAdmin={newAdmin}
            setNewAdmin={setNewAdmin}
            addAdmin={addAdmin}
            busy={busy}
            currentUserId={user?.id}
            onToggleUserStatus={toggleUserStatus}
          />
        )}

        {tab === "locations" && (
          <LocationsSection
            locations={locations}
            loading={locationLoading}
            query={locationQuery}
            onQueryChange={(value) => {
              setLocationQuery(value);
              setLocationPage(1);
            }}
            status={locationStatus}
            onStatusChange={(value) => {
              setLocationStatus(value);
              setLocationPage(1);
            }}
            meta={locationMeta}
            page={locationPage}
            setPage={setLocationPage}
            showForm={showLocationForm}
            editingId={editingLocationId}
            form={locationForm}
            setForm={setLocationForm}
            divisions={locationDivisions}
            availableDistricts={availableDistricts}
            openAdd={openAddLocation}
            openEdit={openEditLocation}
            closeForm={closeLocationForm}
            saveLocation={saveLocation}
            removeLocation={removeLocation}
            restoreLocation={restoreLocation}
            busy={busy}
          />
        )}

        {tab === "activity" && (
          <section className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Admin activity</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Recent administrative actions across lawyer review and metadata management.
              </p>
            </div>
            <Table
              headers={["Date", "Admin", "Action", "Subject", "Change", "Reason"]}
              empty="No admin actions recorded."
              rows={activity.map((entry) => (
                <tr key={entry._id}>
                  <td className={td}>{formatDate(entry.createdAt)}</td>
                  <td className={td}>{entry.actorName}</td>
                  <td className={td}>{actionNames[entry.action] || entry.action}</td>
                  <td className={td}>
                    {entry.lawyer
                      ? lawyerNames[String(entry.lawyer)] || entry.next?.name || entry.previous?.name || "Lawyer profile"
                      : entry.next?.city ||
                        entry.previous?.city ||
                        entry.next?.name ||
                        entry.previous?.name ||
                        "System"}
                  </td>
                  <td className={td}>{describeActivityChange(entry)}</td>
                  <td className={td}>{entry.reason || "—"}</td>
                </tr>
              ))}
            />
          </section>
        )}
      </div>
    </main>
  );
}

function LawyerReviewSection({
  visibleLawyers,
  query,
  setQuery,
  filter,
  setFilter,
  selected,
  toggleProfile,
  detailsLoading,
  verification,
  preview,
  closePreview,
  openDocument,
  decision,
  setDecision,
  reason,
  setReason,
  rejectionScope,
  setRejectionScope,
  canApprove,
  isProfileUpdateReview,
  busy,
  saveDecision,
  history,
  showHistory,
  setShowHistory,
}) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold">Lawyer profiles</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Search, inspect verification documents, and review profile changes.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="lawyer-search">
          Search lawyers
        </label>
        <input
          id="lawyer-search"
          type="search"
          placeholder="Search name, email, practice area or city"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full max-w-lg rounded-xl border border-brand-border bg-white px-4 py-3 outline-none focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
        />
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-xl border border-brand-border bg-white px-4 py-3"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="resubmitted">Resubmitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Changes requested</option>
        </select>
      </div>

      <p className="my-4 text-sm text-brand-muted">
        {visibleLawyers.length} profiles shown
      </p>

      <div className="space-y-3">
        {visibleLawyers.length === 0 && (
          <p className="rounded-2xl border border-brand-border bg-white p-7 text-brand-muted">
            No matching lawyers.
          </p>
        )}

        {visibleLawyers.map((row) => (
          <article
            key={row._id}
            className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-sm"
          >
            <button
              type="button"
              aria-expanded={selected?._id === row._id}
              onClick={() => toggleProfile(row)}
              className="flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left transition hover:bg-brand-background"
            >
              <div className="flex min-w-0 items-center gap-4">
                <LawyerAvatar lawyer={row} className="h-14 w-14 rounded-2xl text-base" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-lg">{row.displayName}</strong>
                    <Status value={row.reviewStatus} />
                    {row.resubmitted && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                        Resubmitted
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-brand-muted">
                    {row.userId?.email || row.email} · {row.primaryPracticeArea || "No practice area"} · {row.officeCity || "No city"}
                  </p>
                </div>
              </div>
              <strong className="text-sm">
                {selected?._id === row._id ? "Collapse ↑" : "Review ↓"}
              </strong>
            </button>

            {selected?._id === row._id && (
              <div className="border-t border-brand-border p-5 sm:p-7">
                {detailsLoading ? (
                  <p>Loading details...</p>
                ) : (
                  <>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      <LawyerAvatar lawyer={row} className="h-24 w-24 rounded-3xl text-2xl" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold">Profile details</h3>
                        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                          <p><strong>Phone:</strong> {row.phone || "Not provided"}</p>
                          <p><strong>Location:</strong> {[row.officeCity, row.district].filter(Boolean).join(", ") || "Not provided"}</p>
                          <p><strong>Experience:</strong> {row.yearsOfPractice ?? "Not provided"} years</p>
                          <p><strong>Practice areas:</strong> {row.practiceAreas?.join(", ") || "Not provided"}</p>
                        </div>
                        {row.description && (
                          <p className="mt-4 rounded-xl bg-brand-background p-4 text-sm leading-6">
                            {row.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {row.pendingProfileChanges && (
                      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                        <h3 className="font-bold">Professional profile update awaiting review</h3>
                        <p className="mt-1 text-amber-900/80">
                          The currently approved public profile stays live until these changes are approved.
                        </p>
                        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                          {Object.entries(row.pendingProfileChanges)
                            .filter(([key]) => key !== "locationId")
                            .map(([key, value]) => (
                              <div key={key}>
                                <dt className="font-semibold">{formatFieldName(key)}</dt>
                                <dd>{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
                              </div>
                            ))}
                        </dl>
                      </div>
                    )}

                    <h3 className="mt-7 text-lg font-bold">Verification documents</h3>
                    {!verification?.submissions?.length && (
                      <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                        No documents submitted. New lawyers need a verification submission before approval.
                      </p>
                    )}
                    {verification?.submissions
                      ?.slice()
                      .reverse()
                      .map((submission) => (
                        <div
                          key={submission._id}
                          className="mt-3 rounded-xl border border-brand-border p-4"
                        >
                          <p className="font-semibold">
                            Submission {submission.number}{" "}
                            <span className="font-normal text-brand-muted">
                              · {formatDate(submission.submittedAt)}
                            </span>
                          </p>
                          <p className="mt-1 text-sm">
                            Enrolment: {submission.enrolmentNumber} · {submission.identityType?.toUpperCase()}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {submission.files.map((file) => (
                              <button
                                type="button"
                                key={file._id}
                                onClick={() => openDocument(submission, file)}
                                className={secondaryButton}
                              >
                                View {fileNames[file.slot] || file.slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                    {preview && (
                      <div className="mt-4 rounded-2xl border border-brand-border bg-brand-background p-4">
                        <div className="mb-3 flex justify-between gap-2">
                          <h4 className="font-bold">Preview: {preview.name}</h4>
                          <button type="button" className={secondaryButton} onClick={closePreview}>
                            Close
                          </button>
                        </div>
                        {preview.type === "application/pdf" ? (
                          <iframe
                            title={preview.name}
                            src={preview.url}
                            className="h-[65vh] w-full rounded-xl border bg-white"
                          />
                        ) : (
                          <img
                            src={preview.url}
                            alt={preview.name}
                            className="max-h-[65vh] max-w-full rounded-xl border bg-white object-contain"
                          />
                        )}
                      </div>
                    )}

                    <form
                      onSubmit={saveDecision}
                      className="mt-7 rounded-2xl border border-brand-border bg-brand-background p-5"
                    >
                      <h3 className="text-lg font-bold">Review decision</h3>
                      <p className="mt-1 text-sm text-brand-muted">
                        Decisions and later corrections are recorded in the audit history.
                      </p>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <label className="text-sm font-semibold">
                          Decision
                          <select
                            value={decision}
                            onChange={(event) => setDecision(event.target.value)}
                            className="mt-2 block w-full rounded-xl border border-brand-border bg-white p-3"
                          >
                            {selected?.reviewStatus === "pending" && (
                              <option value="pending">Keep pending</option>
                            )}
                            <option value="approved">
                              {isProfileUpdateReview ? "Approve profile changes" : "Approve and publish"}
                            </option>
                            <option value="rejected">Request changes</option>
                          </select>
                        </label>
                        <label className="text-sm font-semibold">
                          Reason
                          <textarea
                            rows={3}
                            maxLength={2000}
                            required={decision === "rejected"}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            className="mt-2 block w-full rounded-xl border border-brand-border bg-white p-3"
                            placeholder={
                              decision === "rejected"
                                ? "Explain exactly what needs correction"
                                : "Only required when requesting changes"
                            }
                          />
                        </label>
                      </div>

                      {decision === "rejected" && !isProfileUpdateReview && (
                        <label className="mt-4 block text-sm font-semibold">
                          What needs correction?
                          <select
                            value={rejectionScope}
                            onChange={(event) => setRejectionScope(event.target.value)}
                            className="mt-2 block w-full max-w-md rounded-xl border border-brand-border bg-white p-3"
                          >
                            <option value="profile">Profile details only</option>
                            <option value="documents">Verification documents only</option>
                            <option value="both">Profile details and verification documents</option>
                          </select>
                          <span className="mt-1 block font-normal text-brand-muted">
                            This determines whether corrected documents are required before the application returns to review.
                          </span>
                        </label>
                      )}

                      {decision === "approved" && !canApprove && (
                        <p className="mt-3 text-sm text-amber-900">
                          Verification documents must be submitted before a new lawyer can be approved.
                        </p>
                      )}

                      <button
                        disabled={busy || (decision === "approved" && !canApprove)}
                        className={`mt-4 ${primaryButton}`}
                      >
                        {busy ? "Saving..." : "Save decision"}
                      </button>
                    </form>

                    <div className="mt-7">
                      <button
                        className={secondaryButton}
                        type="button"
                        aria-expanded={showHistory}
                        onClick={() => setShowHistory((open) => !open)}
                      >
                        Profile history ({history.length}) {showHistory ? "↑" : "↓"}
                      </button>
                      {showHistory && (
                        <div className="mt-4">
                          <Table
                            headers={["Date", "User", "Action", "Change", "Reason"]}
                            empty="No history yet."
                            rows={history.map((entry) => (
                              <tr key={entry._id}>
                                <td className={td}>{formatDate(entry.createdAt)}</td>
                                <td className={td}>{entry.actorName} ({entry.actorRole})</td>
                                <td className={td}>{actionNames[entry.action] || entry.action}</td>
                                <td className={td}>
                                  {entry.previous?.status || "Previous"} → {entry.next?.status || "Updated"}
                                </td>
                                <td className={td}>{entry.reason || "—"}</td>
                              </tr>
                            ))}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function UsersSection({
  userTab,
  setUserTab,
  clients,
  lawyers,
  admins,
  showAdminForm,
  setShowAdminForm,
  newAdmin,
  setNewAdmin,
  addAdmin,
  busy,
  currentUserId,
  onToggleUserStatus,
}) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-bold">Users</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Review registered account groups and create additional administrators.
      </p>
      <div className="my-5 flex flex-wrap gap-2">
        {[
          ["clients", clients.length],
          ["lawyers", lawyers.length],
          ["admins", admins.length],
        ].map(([key, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setUserTab(key)}
            className={`${secondaryButton} ${userTab === key ? "border-brand-black ring-1 ring-brand-black" : ""}`}
          >
            {key[0].toUpperCase() + key.slice(1)} ({count})
          </button>
        ))}
      </div>

      {userTab === "clients" && (
        <Table
          headers={["Name", "Email", "Account", "Registered", "Action"]}
          empty="No clients registered."
          rows={clients.map((row) => {
            const active = row.isActive !== false;
            return (
              <tr key={row._id}>
                <td className={td}>{row.name}</td>
                <td className={td}>{row.email}</td>
                <td className={td}><AccountStatus active={active} /></td>
                <td className={td}>{formatDate(row.createdAt)}</td>
                <td className={td}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onToggleUserStatus(row, !active)}
                    className={secondaryButton}
                  >
                    {active ? "Disable" : "Re-enable"}
                  </button>
                </td>
              </tr>
            );
          })}
        />
      )}

      {userTab === "lawyers" && (
        <Table
          headers={["Name", "Email", "Review", "Account", "Registered", "Action"]}
          empty="No lawyers registered."
          rows={lawyers.map((row) => {
            const active = row.userId?.isActive !== false;
            return (
              <tr key={row._id}>
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <LawyerAvatar lawyer={row} className="h-10 w-10 rounded-xl text-xs" />
                    <span>{row.displayName}</span>
                  </div>
                </td>
                <td className={td}>{row.userId?.email || row.email}</td>
                <td className={td}><Status value={row.reviewStatus} /></td>
                <td className={td}><AccountStatus active={active} /></td>
                <td className={td}>{formatDate(row.createdAt)}</td>
                <td className={td}>
                  {row.userId?._id ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        onToggleUserStatus(
                          { ...row.userId, displayName: row.displayName },
                          !active
                        )
                      }
                      className={secondaryButton}
                    >
                      {active ? "Disable" : "Re-enable"}
                    </button>
                  ) : (
                    <span className="text-xs text-brand-muted">Demo profile</span>
                  )}
                </td>
              </tr>
            );
          })}
        />
      )}

      {userTab === "admins" && (
        <>
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              className={secondaryButton}
              onClick={() => setShowAdminForm((open) => !open)}
            >
              {showAdminForm ? "Cancel" : "Add admin"}
            </button>
          </div>
          {showAdminForm && (
            <form
              onSubmit={addAdmin}
              className="mb-5 max-w-xl space-y-4 rounded-2xl border border-brand-border bg-white p-5 shadow-sm"
            >
              <h3 className="font-bold">Add an administrator</h3>
              {[
                ["name", "Full name", "text"],
                ["email", "Email", "email"],
                ["password", "Password", "password"],
              ].map(([key, label, type]) => (
                <label key={key} className="block text-sm font-semibold">
                  {label}
                  <input
                    type={type}
                    required
                    minLength={key === "password" ? 8 : undefined}
                    value={newAdmin[key]}
                    onChange={(event) =>
                      setNewAdmin((old) => ({ ...old, [key]: event.target.value }))
                    }
                    className="mt-2 block w-full rounded-xl border border-brand-border p-3"
                  />
                </label>
              ))}
              <button disabled={busy} className={primaryButton}>
                {busy ? "Creating..." : "Create admin"}
              </button>
            </form>
          )}
          <Table
            headers={["Name", "Email", "Account", "Created", "Action"]}
            empty="No admins found."
            rows={admins.map((row) => {
              const active = row.isActive !== false;
              const isCurrent = String(row._id) === String(currentUserId);
              return (
                <tr key={row._id}>
                  <td className={td}>{row.name}</td>
                  <td className={td}>{row.email}</td>
                  <td className={td}><AccountStatus active={active} /></td>
                  <td className={td}>{formatDate(row.createdAt)}</td>
                  <td className={td}>
                    {isCurrent ? (
                      <span className="text-xs font-semibold text-brand-muted">Current account</span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onToggleUserStatus(row, !active)}
                        className={secondaryButton}
                      >
                        {active ? "Disable" : "Re-enable"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          />
        </>
      )}
    </section>
  );
}

function AccountStatus({ active }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        active ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-700"
      }`}
    >
      {active ? "Active" : "Disabled"}
    </span>
  );
}

function LocationsSection({
  locations,
  loading,
  query,
  onQueryChange,
  status,
  onStatusChange,
  meta,
  page,
  setPage,
  showForm,
  editingId,
  form,
  setForm,
  divisions,
  availableDistricts,
  openAdd,
  openEdit,
  closeForm,
  saveLocation,
  removeLocation,
  restoreLocation,
  busy,
}) {
  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Location catalogue</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-brand-muted">
            Public search, registration, and profile location controls read from this database catalogue. Referenced locations are archived instead of hard-deleted so existing lawyer data remains consistent.
          </p>
        </div>
        <button type="button" onClick={openAdd} className={primaryButton}>
          Add city
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={saveLocation}
          className="mt-5 rounded-2xl border border-brand-border bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold">
                {editingId ? "Edit location" : "Add a city"}
              </h3>
              <p className="mt-1 text-sm text-brand-muted">
                District and province values are constrained to Sri Lanka's administrative divisions.
              </p>
            </div>
            <button type="button" onClick={closeForm} className={secondaryButton}>
              Cancel
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold">
              Province
              <select
                required
                value={form.province}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    province: event.target.value,
                    district: "",
                  }))
                }
                className="mt-2 block w-full rounded-xl border border-brand-border bg-white p-3"
              >
                <option value="">Select province</option>
                {divisions.provinces.map((province) => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold">
              District
              <select
                required
                disabled={!form.province}
                value={form.district}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    district: event.target.value,
                  }))
                }
                className="mt-2 block w-full rounded-xl border border-brand-border bg-white p-3 disabled:bg-neutral-100"
              >
                <option value="">Select district</option>
                {availableDistricts.map((entry) => (
                  <option key={entry.district} value={entry.district}>
                    {entry.district}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold">
              City
              <input
                required
                maxLength={120}
                value={form.city}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    city: event.target.value,
                  }))
                }
                placeholder="e.g. Wadduwa"
                className="mt-2 block w-full rounded-xl border border-brand-border p-3"
              />
            </label>
          </div>

          <button disabled={busy} className={`mt-5 ${primaryButton}`}>
            {busy ? "Saving..." : editingId ? "Save location" : "Add city"}
          </button>
        </form>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search city, district or province"
          className="w-full max-w-lg rounded-xl border border-brand-border bg-white px-4 py-3 outline-none focus:border-brand-yellow-dark focus:ring-2 focus:ring-brand-yellow/20"
        />
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          className="rounded-xl border border-brand-border bg-white px-4 py-3"
        >
          <option value="all">All locations</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="my-4 flex flex-wrap items-center justify-between gap-3 text-sm text-brand-muted">
        <p>{loading ? "Loading locations..." : `${meta.total} locations found`}</p>
        <p>Page {page} of {meta.totalPages}</p>
      </div>

      <Table
        headers={["City", "District", "Province", "Status", "Updated", "Actions"]}
        empty={loading ? "Loading locations..." : "No locations match these filters."}
        rows={locations.map((location) => (
          <tr key={location.id}>
            <td className={`${td} font-semibold text-brand-black`}>{location.city}</td>
            <td className={td}>{location.district}</td>
            <td className={td}>{location.province}</td>
            <td className={td}>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${location.isActive ? "bg-green-50 text-green-800" : "bg-neutral-100 text-neutral-700"}`}>
                {location.isActive ? "Active" : "Archived"}
              </span>
            </td>
            <td className={td}>{formatDate(location.updatedAt)}</td>
            <td className={td}>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  className={secondaryButton}
                  onClick={() => openEdit(location)}
                >
                  Edit
                </button>
                {location.isActive ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                    onClick={() => removeLocation(location)}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    className={secondaryButton}
                    onClick={() => restoreLocation(location)}
                  >
                    Restore
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      />

      {meta.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className={secondaryButton}
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-brand-muted">
            {page} / {meta.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= meta.totalPages || loading}
            onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
            className={secondaryButton}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
