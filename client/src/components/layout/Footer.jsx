import { Link } from "react-router-dom";

import logoIcon from "../../assets/findmylawyer-icon.png";
import { useSavedLawyers } from "../../context/SavedLawyersContext.jsx";

export default function Footer() {
  const { canSave } = useSavedLawyers();

  return (
    <footer className="bg-brand-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.25fr_0.65fr_1fr] md:items-start md:gap-12">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <img
                src={logoIcon}
                alt="FindMyLawyer"
                className="h-10 w-10 rounded-xl object-contain"
              />

              <span className="text-lg font-extrabold">FindMyLawyer</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-400">
              Helping people find a clearer starting point when searching for
              legal assistance.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Quick Links</h3>

            <div className="mt-4 flex flex-col items-start gap-3 text-sm text-neutral-400">
              <Link to="/" className="transition hover:text-white">
                Home
              </Link>

              <Link
                to="/find-lawyers"
                className="transition hover:text-white"
              >
                Find Lawyers
              </Link>

              {canSave && (
                <Link
                  to="/saved-lawyers"
                  className="transition hover:text-white"
                >
                  Saved Lawyers
                </Link>
              )}

              <Link to="/login" className="transition hover:text-white">
                Sign in
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">
              Prototype Notice
            </h3>

            <p className="mt-4 max-w-md text-sm leading-6 text-neutral-400">
              Lawyer profiles displayed in this demonstration are fictional
              sample data and do not represent actual Attorneys-at-Law.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-neutral-800 pt-6 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 FindMyLawyer.</span>
          <span>Prototype lawyer-discovery project.</span>
        </div>
      </div>
    </footer>
  );
}
