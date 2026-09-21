import { Link } from "react-router-dom";

import logoIcon from "../../assets/findmylawyer-icon.png";
import { useAuth } from "../../context/useAuth.js";
import { useSavedLawyers } from "../../context/useSavedLawyers.js";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="M4 10h11m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group flex min-h-10 items-center justify-between gap-4 rounded-xl px-3 py-2 text-[13px] font-semibold text-neutral-300 transition hover:bg-white/[0.055] hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-yellow/40"
    >
      <span>{children}</span>
      <span className="text-neutral-600 transition group-hover:translate-x-0.5 group-hover:text-brand-yellow">
        <ArrowIcon />
      </span>
    </Link>
  );
}

function FooterGroup({ title, children }) {
  return (
    <div>
      <p className="px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-neutral-500">
        {title}
      </p>
      <nav className="mt-3 space-y-1" aria-label={`${title} footer links`}>
        {children}
      </nav>
    </div>
  );
}

export default function Footer() {
  const { user, loading: authLoading } = useAuth();
  const { canSave } = useSavedLawyers();

  return (
    <footer className="relative overflow-hidden border-t border-neutral-800 bg-brand-black text-white">
      <div className="pointer-events-none absolute -bottom-40 -left-28 h-80 w-80 rounded-full bg-brand-yellow/[0.035] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-11">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_0.72fr_0.72fr_1.05fr] lg:gap-8 xl:gap-12">
          <div className="max-w-[390px]">
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-yellow/40"
              aria-label="FindMyLawyer home"
            >
              <img
                src={logoIcon}
                alt=""
                className="h-9 w-9 rounded-[11px] object-contain"
              />

              <span className="text-[1.08rem] font-extrabold tracking-[-0.025em]">
                FindMyLawyer
              </span>
            </Link>

            <p className="mt-4 text-[13px] leading-6 text-neutral-400">
              A structured starting point for discovering lawyers by legal area,
              location and practical preferences in Sri Lanka.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                Sri Lanka
              </span>
              <span className="rounded-full border border-brand-yellow/20 bg-brand-yellow/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#d9bd4b]">
                Discovery prototype
              </span>
            </div>
          </div>

          <FooterGroup title="Discover">
            <FooterLink to="/">Home</FooterLink>
            <FooterLink to="/find-lawyers">Find lawyers</FooterLink>
            {canSave && (
              <FooterLink to="/saved-lawyers">Saved lawyers</FooterLink>
            )}
          </FooterGroup>

          <FooterGroup title={user ? "Your account" : "Account"}>
            {!authLoading && user ? (
              <>
                <FooterLink to="/profile">Profile</FooterLink>
                <FooterLink to="/account-security">
                  Sign-in & security
                </FooterLink>
                {user.role === "admin" && (
                  <FooterLink to="/admin">Admin panel</FooterLink>
                )}
                {user.role === "lawyer" && (
                  <FooterLink to="/lawyer/verification">Verification</FooterLink>
                )}
              </>
            ) : !authLoading ? (
              <>
                <FooterLink to="/login">Sign in</FooterLink>
                <FooterLink to="/register">Create account</FooterLink>
                <FooterLink to="/register-lawyer">Join as a lawyer</FooterLink>
              </>
            ) : (
              <div className="mx-3 h-10 animate-pulse rounded-xl bg-white/[0.035]" />
            )}
          </FooterGroup>

          <div className="rounded-[18px] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-yellow/20 bg-brand-yellow/10 text-[13px] font-black text-brand-yellow">
                i
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-neutral-500">
                  Demonstration environment
                </p>
                <h3 className="mt-1 text-sm font-bold text-white">
                  Prototype notice
                </h3>
              </div>
            </div>

            <p className="mt-4 text-[12.5px] leading-6 text-neutral-400">
              Lawyer profiles shown in this demonstration are fictional sample
              data and do not represent actual Attorneys-at-Law.
            </p>

            <div className="mt-4 border-t border-white/[0.08] pt-4 text-[11px] leading-5 text-neutral-500">
              FindMyLawyer supports lawyer discovery and does not provide legal
              advice.
            </div>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-white/[0.08] pt-5 text-[11px] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 FindMyLawyer. Prototype project.</span>

          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow/70" />
            Clearer lawyer discovery, without replacing legal advice
          </span>
        </div>
      </div>
    </footer>
  );
}
