import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import { useSavedLawyers } from "../../context/SavedLawyersContext.jsx";
import logoIcon from "../../assets/findmylawyer-icon.png";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const { savedCount, canSave } = useSavedLawyers();

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function closeMenu() {
    setMenuOpen(false);
    setAccountOpen(false);
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
          {canSave && (
            <Link
              to="/saved-lawyers"
              aria-label={
                savedCount > 0
                  ? `Saved lawyers, ${savedCount} saved`
                  : "Saved lawyers"
              }
              title="Saved lawyers"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand-muted transition hover:bg-brand-background hover:text-brand-black"
            >
              <HeartIcon />
              {savedCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4.5 items-center justify-center rounded-full bg-brand-yellow px-1 py-0.5 text-[9px] font-extrabold leading-none text-brand-black ring-2 ring-white">
                  {savedCount > 99 ? "99+" : savedCount}
                </span>
              )}
            </Link>
          )}

          {!loading && user ? (
            <div className="relative" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((previous) => !previous)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full border border-brand-border bg-white p-1.5 pr-3 transition hover:bg-brand-background"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow-soft text-xs font-extrabold text-brand-black">
                  {getInitials(user.name)}
                </span>
                <span className="hidden max-w-32 truncate text-sm font-semibold text-brand-black lg:block">
                  {user.name}
                </span>
                <ChevronIcon />
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-brand-border bg-white p-2 shadow-xl shadow-black/10"
                >
                  <div className="border-b border-brand-border px-3 py-3">
                    <p className="truncate text-sm font-bold text-brand-black">
                      {user.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-brand-muted">
                      {user.email}
                    </p>
                  </div>

                  <div className="py-2">
                    <Link
                      to="/profile"
                      role="menuitem"
                      onClick={closeMenu}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-black transition hover:bg-brand-background"
                    >
                      <UserIcon />
                      Profile
                    </Link>

                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        onClick={closeMenu}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-black transition hover:bg-brand-background"
                      >
                        <AdminIcon />
                        Admin panel
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-brand-border pt-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-brand-muted transition hover:bg-brand-background hover:text-brand-black"
                    >
                      <SignOutIcon />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                className="rounded-xl bg-brand-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
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
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-5 sm:px-6">
            <MobileNavLink to="/" onClick={closeMenu}>
              Home
            </MobileNavLink>
            <MobileNavLink to="/find-lawyers" onClick={closeMenu}>
              Find Lawyers
            </MobileNavLink>

            {canSave && (
              <MobileNavLink to="/saved-lawyers" onClick={closeMenu}>
                <span className="flex w-full items-center justify-between">
                  <span>Saved lawyers</span>
                  {savedCount > 0 && (
                    <span className="rounded-full bg-brand-yellow-soft px-2 py-0.5 text-xs font-extrabold">
                      {savedCount}
                    </span>
                  )}
                </span>
              </MobileNavLink>
            )}

            <div className="my-2 border-t border-brand-border" />

            {!loading && user ? (
              <>
                <MobileNavLink to="/profile" onClick={closeMenu}>
                  Profile
                </MobileNavLink>
                {user.role === "admin" && (
                  <MobileNavLink to="/admin" onClick={closeMenu}>
                    Admin panel
                  </MobileNavLink>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 rounded-xl border border-brand-border px-4 py-3 text-center text-sm font-semibold text-brand-black"
                >
                  Sign out
                </button>
              </>
            ) : !loading ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="rounded-xl border border-brand-border px-4 py-3 text-center text-sm font-semibold text-brand-black"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="rounded-xl bg-brand-black px-4 py-3 text-center text-sm font-semibold text-white"
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

function MobileNavLink({ to, onClick, children }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
          isActive
            ? "bg-brand-yellow-soft text-brand-black"
            : "text-brand-black hover:bg-brand-background"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 20.2 4.9 13.6A4.8 4.8 0 0 1 11.7 6.8L12 7l.3-.2a4.8 4.8 0 0 1 6.8 6.8L12 20.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 19c.8-3.2 3.2-5 6.5-5s5.7 1.8 6.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 2.8 7.8 7 10 4.2-2.2 7-5.5 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m9.4 12 1.7 1.7 3.6-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 8.5 16.5 12 13 15.5M16 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 text-brand-muted" aria-hidden="true">
      <path d="m6.5 8 3.5 3.5L13.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
