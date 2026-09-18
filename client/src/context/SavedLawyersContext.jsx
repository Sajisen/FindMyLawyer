import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import SavedLawyersContext from "./savedLawyersContext.js";
import { useAuth } from "./useAuth.js";
import { getLawyersByIds } from "../features/lawyers/lawyerApi.js";
import {
  getSavedLawyers,
  removeLawyerFromAccount,
  saveLawyerToAccount,
  syncGuestSavedLawyers,
} from "../features/savedLawyers/savedLawyerApi.js";

const STORAGE_KEY = "findmylawyer.guestSavedLawyers.v1";
const MAX_GUEST_SAVED = 100;

function normalizeIds(ids = []) {
  return [
    ...new Set(
      ids
        .map((id) => String(id || "").trim())
        .filter(Boolean)
    ),
  ];
}

function readGuestSavedIds() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value)
      ? normalizeIds(value).slice(0, MAX_GUEST_SAVED)
      : [];
  } catch {
    return [];
  }
}

function writeGuestSavedIds(ids) {
  const normalized = normalizeIds(ids).slice(0, MAX_GUEST_SAVED);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

function clearGuestSavedIds() {
  localStorage.removeItem(STORAGE_KEY);
}

function mergeLawyerIntoList(lawyers, lawyer) {
  if (!lawyer?._id) {
    return lawyers;
  }

  const id = String(lawyer._id);
  return [
    lawyer,
    ...lawyers.filter((item) => String(item._id) !== id),
  ];
}

async function loadGuestCollection(ids) {
  const normalized = normalizeIds(ids);

  if (normalized.length === 0) {
    return {
      savedIds: [],
      lawyers: [],
    };
  }

  const data = await getLawyersByIds(normalized);
  const lawyers = Array.isArray(data.lawyers) ? data.lawyers : [];

  return {
    savedIds: lawyers.map((lawyer) => String(lawyer._id)),
    lawyers,
  };
}

export function SavedLawyersProvider({ children }) {
  const {
    user,
    token,
    loading: authLoading,
  } = useAuth();

  const [savedIds, setSavedIds] = useState(() => readGuestSavedIds());
  const [savedLawyers, setSavedLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState([]);
  const [guestMergePrompt, setGuestMergePrompt] = useState(null);
  const [mergeBusy, setMergeBusy] = useState(false);
  const requestVersionRef = useRef(0);
  const dismissedMergeUserRef = useRef("");

  const isClient = !authLoading && user?.role === "client";
  const isGuest = !authLoading && !user;
  const canSave = isGuest || isClient;
  const userKey = String(user?.id || user?._id || "");

  const applyCollection = useCallback((data) => {
    const lawyers = Array.isArray(data?.lawyers) ? data.lawyers : [];
    const ids = Array.isArray(data?.savedIds)
      ? normalizeIds(data.savedIds)
      : lawyers.map((lawyer) => String(lawyer._id));

    setSavedIds(ids);
    setSavedLawyers(lawyers);
  }, []);

  const offerGuestMergeIfNeeded = useCallback(
    (guestIds) => {
      if (
        !isClient ||
        !userKey ||
        !guestIds.length ||
        dismissedMergeUserRef.current === userKey
      ) {
        setGuestMergePrompt(null);
        return;
      }

      setGuestMergePrompt({
        count: guestIds.length,
        accountName: user?.name || user?.email || "this account",
      });
    },
    [isClient, user?.email, user?.name, userKey]
  );

  const refreshSaved = useCallback(async () => {
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    setLoading(true);
    setError("");

    try {
      let data;

      if (isClient && token) {
        data = await getSavedLawyers(token);
      } else if (isGuest) {
        data = await loadGuestCollection(readGuestSavedIds());
      } else {
        data = { savedIds: [], lawyers: [] };
      }

      if (requestVersion !== requestVersionRef.current) {
        return;
      }

      if (isGuest) {
        // Remove IDs whose profiles are no longer publicly available.
        writeGuestSavedIds(data.savedIds);
      }

      applyCollection(data);

      if (isClient) {
        offerGuestMergeIfNeeded(readGuestSavedIds());
      }
    } catch (requestError) {
      if (requestVersion === requestVersionRef.current) {
        setError(requestError.message || "Unable to load saved lawyers.");
      }
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setLoading(false);
      }
    }
  }, [applyCollection, isClient, isGuest, offerGuestMergeIfNeeded, token]);

  useEffect(() => {
    if (authLoading) {
      return undefined;
    }

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    let cancelled = false;

    async function hydrate() {
      setLoading(true);
      setError("");

      try {
        if (isClient && token) {
          // Privacy rule: device-level guest saves are never merged merely
          // because somebody logged in. Load the account first, then ask for
          // explicit consent before performing the union sync.
          const data = await getSavedLawyers(token);

          if (cancelled || requestVersion !== requestVersionRef.current) {
            return;
          }

          applyCollection(data);
          offerGuestMergeIfNeeded(readGuestSavedIds());
          return;
        }

        if (isGuest) {
          // Logging out starts a new guest session. If the same client later
          // logs in again, ask again rather than carrying an old dismissal
          // across authentication sessions on a shared device.
          dismissedMergeUserRef.current = "";
          setGuestMergePrompt(null);

          const data = await loadGuestCollection(readGuestSavedIds());

          if (cancelled || requestVersion !== requestVersionRef.current) {
            return;
          }

          writeGuestSavedIds(data.savedIds);
          applyCollection(data);
          return;
        }

        setGuestMergePrompt(null);
        if (!cancelled && requestVersion === requestVersionRef.current) {
          applyCollection({ savedIds: [], lawyers: [] });
        }
      } catch (requestError) {
        if (cancelled || requestVersion !== requestVersionRef.current) {
          return;
        }

        setError(requestError.message || "Unable to load saved lawyers.");
        applyCollection({ savedIds: [], lawyers: [] });
      } finally {
        if (!cancelled && requestVersion === requestVersionRef.current) {
          setLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [applyCollection, authLoading, isClient, isGuest, offerGuestMergeIfNeeded, token]);

  useEffect(() => {
    if (!isGuest) {
      return undefined;
    }

    function handleStorage(event) {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      const requestVersion = requestVersionRef.current + 1;
      requestVersionRef.current = requestVersion;

      void loadGuestCollection(readGuestSavedIds())
        .then((data) => {
          if (requestVersion !== requestVersionRef.current) {
            return;
          }
          writeGuestSavedIds(data.savedIds);
          applyCollection(data);
          setError("");
        })
        .catch((requestError) => {
          if (requestVersion === requestVersionRef.current) {
            setError(requestError.message || "Unable to refresh saved lawyers.");
          }
        });
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [applyCollection, isGuest]);

  const mergeGuestSaved = useCallback(async () => {
    if (!isClient || !token || mergeBusy) {
      return;
    }

    const guestIds = readGuestSavedIds();

    if (!guestIds.length) {
      setGuestMergePrompt(null);
      return;
    }

    setMergeBusy(true);
    setError("");

    try {
      const data = await syncGuestSavedLawyers(guestIds, token);
      applyCollection(data);

      // Clear only after the server confirms the union. A network/server
      // failure leaves the device saves intact so the user can retry safely.
      clearGuestSavedIds();
      dismissedMergeUserRef.current = userKey;
      setGuestMergePrompt(null);
    } catch (requestError) {
      setError(requestError.message || "Unable to merge saved lawyers.");
    } finally {
      setMergeBusy(false);
    }
  }, [applyCollection, isClient, mergeBusy, token, userKey]);

  const keepGuestSavedSeparate = useCallback(() => {
    dismissedMergeUserRef.current = userKey;
    setGuestMergePrompt(null);
  }, [userKey]);

  const isSaved = useCallback(
    (lawyerId) => savedIds.includes(String(lawyerId)),
    [savedIds]
  );

  const isBusy = useCallback(
    (lawyerId) => busyIds.includes(String(lawyerId)),
    [busyIds]
  );

  const toggleSaved = useCallback(
    async (lawyerOrId) => {
      const lawyer =
        typeof lawyerOrId === "object" && lawyerOrId !== null
          ? lawyerOrId
          : null;
      const lawyerId = String(lawyer?._id || lawyerOrId || "");

      if (!lawyerId || !canSave || isBusy(lawyerId)) {
        return;
      }

      const actionSavedIds = isGuest ? readGuestSavedIds() : savedIds;
      const currentlySaved = actionSavedIds.includes(lawyerId);
      setBusyIds((previous) => [...new Set([...previous, lawyerId])]);
      setError("");

      try {
        if (isClient && token) {
          if (currentlySaved) {
            await removeLawyerFromAccount(lawyerId, token);
            setSavedIds((previous) => previous.filter((id) => id !== lawyerId));
            setSavedLawyers((previous) =>
              previous.filter((item) => String(item._id) !== lawyerId)
            );
          } else {
            const data = await saveLawyerToAccount(lawyerId, token);
            setSavedIds((previous) => normalizeIds([lawyerId, ...previous]));
            setSavedLawyers((previous) =>
              mergeLawyerIntoList(previous, data.lawyer || lawyer)
            );
          }
          return;
        }

        if (isGuest) {
          if (!currentlySaved && actionSavedIds.length >= MAX_GUEST_SAVED) {
            throw new Error(
              `You can save up to ${MAX_GUEST_SAVED} lawyers on this device.`
            );
          }

          if (currentlySaved) {
            const nextIds = writeGuestSavedIds(
              actionSavedIds.filter((id) => id !== lawyerId)
            );
            setSavedIds(nextIds);
            setSavedLawyers((previous) =>
              previous.filter((item) => String(item._id) !== lawyerId)
            );
          } else {
            const nextIds = writeGuestSavedIds([lawyerId, ...actionSavedIds]);
            setSavedIds(nextIds);

            if (lawyer) {
              setSavedLawyers((previous) =>
                mergeLawyerIntoList(previous, lawyer)
              );
            }
          }
        }
      } catch (requestError) {
        setError(requestError.message || "Unable to update saved lawyers.");
        throw requestError;
      } finally {
        setBusyIds((previous) => previous.filter((id) => id !== lawyerId));
      }
    },
    [canSave, isBusy, isClient, isGuest, savedIds, token]
  );

  const value = useMemo(
    () => ({
      savedIds,
      savedLawyers,
      savedCount: savedIds.length,
      loading: authLoading || loading,
      error,
      canSave,
      isClient,
      isGuest,
      isSaved,
      isBusy,
      toggleSaved,
      refreshSaved,
    }),
    [
      authLoading,
      canSave,
      error,
      isBusy,
      isClient,
      isGuest,
      isSaved,
      loading,
      refreshSaved,
      savedIds,
      savedLawyers,
      toggleSaved,
    ]
  );

  return (
    <SavedLawyersContext.Provider value={value}>
      {children}
      {guestMergePrompt && isClient && (
        <GuestSaveMergeDialog
          accountName={guestMergePrompt.accountName}
          count={guestMergePrompt.count}
          busy={mergeBusy}
          onMerge={mergeGuestSaved}
          onKeepSeparate={keepGuestSavedSeparate}
        />
      )}
    </SavedLawyersContext.Provider>
  );
}

function GuestSaveMergeDialog({
  accountName,
  count,
  busy,
  onMerge,
  onKeepSeparate,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-[2px]"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-lawyer-merge-title"
        aria-describedby="saved-lawyer-merge-description"
        className="w-full max-w-lg rounded-3xl border border-brand-border bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-yellow-soft text-xl" aria-hidden="true">
          ★
        </div>
        <h2
          id="saved-lawyer-merge-title"
          className="mt-5 text-2xl font-extrabold tracking-tight text-brand-black"
        >
          Merge saved lawyers into {accountName}?
        </h2>
        <p
          id="saved-lawyer-merge-description"
          className="mt-3 text-sm leading-6 text-brand-muted"
        >
          {count} {count === 1 ? "lawyer was" : "lawyers were"} saved on this
          device while nobody was signed in. Because this may be a shared
          computer, FindMyLawyer will not add them to your account without your
          confirmation.
        </p>
        <div className="mt-5 rounded-2xl border border-brand-border bg-brand-background p-4 text-sm leading-6 text-brand-muted">
          <strong className="text-brand-black">Merge</strong> adds the device
          saves to your existing account saves without removing anything.
          <strong className="ml-1 text-brand-black">Keep separate</strong> leaves
          them on this device for the signed-out guest session.
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onKeepSeparate}
            className="rounded-xl border border-brand-border bg-white px-5 py-3 text-sm font-bold text-brand-black transition hover:bg-brand-background disabled:opacity-60"
          >
            Keep separate
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onMerge}
            className="rounded-xl bg-brand-yellow px-5 py-3 text-sm font-extrabold text-brand-black transition hover:bg-brand-yellow-dark disabled:opacity-60"
          >
            {busy ? "Merging..." : `Merge into ${accountName}`}
          </button>
        </div>
      </section>
    </div>
  );
}
