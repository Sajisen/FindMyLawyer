import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import logoIcon from "../../assets/findmylawyer-icon.png";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleLogout() {
    logout();
    closeMenu();
    navigate("/");
  }

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? "text-brand-black"
        : "text-brand-muted hover:text-brand-black"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
          <img
            src={logoIcon}
            alt="FindMyLawyer"
            className="h-10 w-10 rounded-xl object-contain"
          />

          <span className="text-lg font-extrabold tracking-tight text-brand-black">
            FindMyLawyer
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

          <NavLink to="/find-lawyers" className={navLinkClass}>
            Find Lawyers
          </NavLink>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!loading && user ? (
            <>
              {user.role === "lawyer" && (
                <Link
                  to="/lawyer"
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-black transition hover:bg-brand-background"
                >
                  Dashboard
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-brand-border px-4 py-2.5 text-sm font-semibold text-brand-black transition hover:border-neutral-400"
              >
                Sign out
              </button>
            </>
          ) : !loading ? (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-black transition hover:bg-brand-background"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-brand-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Register
              </Link>
            </>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border text-xl md:hidden"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-brand-border bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 sm:px-6">
            <NavLink
              to="/"
              end
              onClick={closeMenu}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-black hover:bg-brand-background"
            >
              Home
            </NavLink>

            <NavLink
              to="/find-lawyers"
              onClick={closeMenu}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-black hover:bg-brand-background"
            >
              Find Lawyers
            </NavLink>

            {!loading && user ? (
              <>
                {user.role === "lawyer" && (
                  <Link
                    to="/lawyer"
                    onClick={closeMenu}
                    className="rounded-lg px-3 py-2.5 text-sm font-semibold text-brand-black hover:bg-brand-background"
                  >
                    Dashboard
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 rounded-lg border border-brand-border px-4 py-3 text-center text-sm font-semibold text-brand-black"
                >
                  Sign out
                </button>
              </>
            ) : !loading ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-lg border border-brand-border px-4 py-3 text-center text-sm font-semibold text-brand-black"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="rounded-lg bg-brand-black px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
