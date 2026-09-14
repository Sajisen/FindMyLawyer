import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "./AuthContext.jsx";
import { getLawyersByIds } from "../features/lawyers/lawyerApi.js";
import {
  getSavedLawyers,
  removeLawyerFromAccount,
  saveLawyerToAccount,
  syncGuestSavedLawyers,
} from "../features/savedLawyers/savedLawyerApi.js";

const SavedLawyersContext = createContext(null);

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
  const requestVersionRef = useRef(0);

  const isClient = !authLoading && user?.role === "client";
  const isGuest = !authLoading && !user;
  const canSave = isGuest || isClient;

  const applyCollection = useCallback((data) => {
    const lawyers = Array.isArray(data?.lawyers) ? data.lawyers : [];
    const ids = Array.isArray(data?.savedIds)
      ? normalizeIds(data.savedIds)
      : lawyers.map((lawyer) => String(lawyer._id));

    setSavedIds(ids);
    setSavedLawyers(lawyers);
  }, []);

  const refreshSaved = useCallback(async () => {
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    setLoading(true);
    setError("");

    try {
      let data;
      let clearGuestAfterSuccess = false;

      if (isClient && token) {
        const guestIds = readGuestSavedIds();
        data = guestIds.length
          ? await syncGuestSavedLawyers(guestIds, token)
          : await getSavedLawyers(token);
        clearGuestAfterSuccess = guestIds.length > 0;
      } else if (isGuest) {
        data = await loadGuestCollection(readGuestSavedIds());
      } else {
        data = { savedIds: [], lawyers: [] };
      }

      if (requestVersion !== requestVersionRef.current) {
        return;
      }

      if (clearGuestAfterSuccess) {
        clearGuestSavedIds();
      }

      if (isGuest) {
        // Remove local IDs whose profiles are no longer publicly available.
        writeGuestSavedIds(data.savedIds);
      }

      applyCollection(data);
    } catch (requestError) {
      if (requestVersion === requestVersionRef.current) {
        setError(requestError.message || "Unable to load saved lawyers.");
      }
    } finally {
      if (requestVersion === requestVersionRef.current) {
        setLoading(false);
      }
    }
  }, [applyCollection, isClient, isGuest, token]);

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
          const guestIds = readGuestSavedIds();
          const data = guestIds.length
            ? await syncGuestSavedLawyers(guestIds, token)
            : await getSavedLawyers(token);

          if (cancelled || requestVersion !== requestVersionRef.current) {
            return;
          }

          applyCollection(data);

          // Do not keep account-linked saves in guest storage. This prevents
          // one account's saved list leaking into another account on a shared
          // browser. Guest IDs are cleared only after a successful union sync.
          if (guestIds.length) {
            clearGuestSavedIds();
          }
          return;
        }

        if (isGuest) {
          const data = await loadGuestCollection(readGuestSavedIds());

          if (cancelled || requestVersion !== requestVersionRef.current) {
            return;
          }

          writeGuestSavedIds(data.savedIds);
          applyCollection(data);
          return;
        }

        if (!cancelled && requestVersion === requestVersionRef.current) {
          applyCollection({ savedIds: [], lawyers: [] });
        }
      } catch (requestError) {
        if (cancelled || requestVersion !== requestVersionRef.current) {
          return;
        }

        setError(
          requestError.message || "Unable to synchronize saved lawyers."
        );

        // Guest IDs stay in localStorage so synchronization can be retried.
        // Do not present unsynchronized guest IDs as account saves because that
        // could make a later remove action look successful while the pending
        // local ID silently remains. Prefer the canonical account list when
        // it can still be loaded.
        if (isClient && token) {
          try {
            const accountData = await getSavedLawyers(token);

            if (!cancelled && requestVersion === requestVersionRef.current) {
              applyCollection(accountData);
            }
          } catch {
            if (!cancelled && requestVersion === requestVersionRef.current) {
              applyCollection({ savedIds: [], lawyers: [] });
            }
          }
        }
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
  }, [applyCollection, authLoading, isClient, isGuest, token]);

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
            setError(
              requestError.message || "Unable to refresh saved lawyers."
            );
          }
        });
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [applyCollection, isGuest]);

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

            // If this ID is also waiting in guest storage after an earlier
            // failed synchronization, remove it there too so a retry cannot
            // unexpectedly re-save a lawyer the client just removed.
            const pendingGuestIds = readGuestSavedIds();
            if (pendingGuestIds.includes(lawyerId)) {
              writeGuestSavedIds(
                pendingGuestIds.filter((id) => id !== lawyerId)
              );
            }

            setSavedIds((previous) =>
              previous.filter((id) => id !== lawyerId)
            );
            setSavedLawyers((previous) =>
              previous.filter((item) => String(item._id) !== lawyerId)
            );
          } else {
            const data = await saveLawyerToAccount(lawyerId, token);

            // A direct account save makes any matching pending guest ID
            // redundant. Removing it keeps future synchronization idempotent
            // and easier to reason about.
            const pendingGuestIds = readGuestSavedIds();
            if (pendingGuestIds.includes(lawyerId)) {
              writeGuestSavedIds(
                pendingGuestIds.filter((id) => id !== lawyerId)
              );
            }

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
        setBusyIds((previous) =>
          previous.filter((id) => id !== lawyerId)
        );
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
    </SavedLawyersContext.Provider>
  );
}

export function useSavedLawyers() {
  const context = useContext(SavedLawyersContext);

  if (!context) {
    throw new Error(
      "useSavedLawyers must be used inside SavedLawyersProvider"
    );
  }

  return context;
}
