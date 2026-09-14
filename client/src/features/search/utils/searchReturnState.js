const STORAGE_KEY = "findmylawyer.searchReturnState.v1";
const MAX_AGE_MS = 30 * 60 * 1000;

function isValidState(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.path === "string" &&
    value.path.startsWith("/find-lawyers") &&
    Number.isFinite(value.scrollY)
  );
}

export function rememberSearchReturnState(state) {
  if (typeof window === "undefined") {
    return;
  }

  const nextState = {
    ...state,
    scrollY: Number.isFinite(state?.scrollY) ? Math.max(0, state.scrollY) : 0,
    createdAt: Date.now(),
  };

  if (!isValidState(nextState)) {
    return;
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // Search restoration is a convenience only. Navigation should still work
    // when storage is unavailable or restricted by the browser.
  }
}

export function readSearchReturnState(path) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");

    if (!isValidState(stored)) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (stored.path !== path || Date.now() - Number(stored.createdAt || 0) > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return stored;
  } catch {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
    return null;
  }
}

export function clearSearchReturnState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
}
