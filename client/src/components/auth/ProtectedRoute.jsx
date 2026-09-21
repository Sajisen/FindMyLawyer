import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/useAuth.js";

export default function ProtectedRoute({
  children,
  roles = [],
}) {
  const location = useLocation();
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  if (loading) {
    return (
      <main className="min-h-[68vh] bg-brand-background">
        <div className="mx-auto flex max-w-5xl items-center justify-center px-5 py-20 sm:px-6 lg:px-8">
          <div className="w-full max-w-sm rounded-[22px] border border-brand-border bg-white p-7 text-center shadow-[0_18px_45px_-34px_rgba(20,20,20,0.35)]">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-brand-border border-t-brand-yellow-dark" />
            <p className="mt-4 text-sm font-bold text-brand-black">Checking your account</p>
            <p className="mt-1 text-xs leading-5 text-brand-muted">
              Restoring your secure session before opening this page.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  if (
    roles.length > 0 &&
    !roles.includes(user?.role)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}
