import { Link } from "react-router-dom";

import LawyerCard from "../features/lawyers/components/LawyerCard.jsx";
import { useSavedLawyers } from "../context/useSavedLawyers.js";
import { useAuth } from "../context/useAuth.js";
import useLegalCategories from "../features/search/hooks/useLegalCategories.js";

export default function SavedLawyersPage() {
  const { user } = useAuth();
  const { categories } = useLegalCategories();
  const {
    savedLawyers,
    savedCount,
    loading,
    error,
    canSave,
    isGuest,
    refreshSaved,
  } = useSavedLawyers();

  if (!canSave && user) {
    return (
      <main className="min-h-[70vh] bg-brand-background">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-brand-border bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-extrabold text-brand-black">
              Saved Lawyers is for client accounts
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-brand-muted">
              Lawyer and administrator accounts do not use the client saved-list feature.
            </p>
            <Link
              to="/find-lawyers"
              className="mt-6 inline-flex rounded-lg bg-brand-black px-5 py-3 text-sm font-bold text-white"
            >
              Find lawyers
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-background">
      <section className="border-b border-brand-border bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
                Your shortlist
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
                Saved Lawyers
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted sm:text-base">
                Keep useful profiles here while you compare your options.
              </p>
            </div>

            {!loading && savedCount > 0 && (
              <span className="rounded-full bg-brand-yellow-soft px-4 py-2 text-sm font-bold text-brand-black">
                {savedCount} {savedCount === 1 ? "saved profile" : "saved profiles"}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">
        {isGuest && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-brand-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-brand-muted">
              Saved on this device. Sign in to merge these profiles with your client account.
            </p>
            <Link
              to="/login"
              state={{ from: "/saved-lawyers" }}
              className="shrink-0 text-sm font-bold text-brand-black underline decoration-brand-yellow-dark underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void refreshSaved()}
              className="shrink-0 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-brand-border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-brand-border border-t-brand-yellow-dark" />
            <p className="mt-4 text-sm text-brand-muted">Loading saved lawyers...</p>
          </div>
        ) : savedLawyers.length === 0 ? (
          <div className="rounded-2xl border border-brand-border bg-white p-10 text-center shadow-sm sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-yellow-soft">
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
                <path
                  d="M12 20.2 4.9 13.6A4.8 4.8 0 0 1 11.7 6.8L12 7l.3-.2a4.8 4.8 0 0 1 6.8 6.8L12 20.2Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="mt-5 text-xl font-bold text-brand-black">
              No saved lawyers yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-muted">
              Save profiles from search results or a lawyer profile page and they will appear here.
            </p>
            <Link
              to="/find-lawyers"
              className="mt-6 inline-flex rounded-lg bg-brand-black px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Find lawyers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedLawyers.map((lawyer) => (
              <LawyerCard
                key={lawyer._id}
                lawyer={lawyer}
                categories={categories}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
