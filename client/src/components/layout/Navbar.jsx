import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

import logoIcon from "../../assets/findmylawyer-icon.png";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
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
        {/* Left: Brand */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-3"
        >
          <img
            src={logoIcon}
            alt="FindMyLawyer"
            className="h-10 w-10 rounded-xl object-contain"
          />

          <span className="text-lg font-extrabold tracking-tight text-brand-black">
            FindMyLawyer
          </span>
        </Link>

        {/* Center: Navigation */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          <NavLink
            to="/"
            end
            className={navLinkClass}
          >
            Home
          </NavLink>

          <NavLink
            to="/find-lawyers"
            className={navLinkClass}
          >
            Find Lawyers
          </NavLink>
        </nav>

        {/* Right: Register */}
        <Link
          to="/register"
          className="hidden rounded-lg bg-brand-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark md:inline-flex"
        >
          Register
        </Link>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-border text-xl md:hidden"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-brand-border bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 sm:px-6">
            <NavLink
              to="/"
              end
              onClick={closeMenu}
              className={navLinkClass}
            >
              Home
            </NavLink>

            <NavLink
              to="/find-lawyers"
              onClick={closeMenu}
              className={navLinkClass}
            >
              Find Lawyers
            </NavLink>

            <Link
              to="/register"
              onClick={closeMenu}
              className="rounded-lg bg-brand-black px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Register
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}