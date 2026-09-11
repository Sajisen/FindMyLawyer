import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({
  children,
  roles = [],
}) {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-brand-background">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <p className="text-brand-muted">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    roles.length > 0 &&
    !roles.includes(user?.role)
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}