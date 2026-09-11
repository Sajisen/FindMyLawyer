import { Link } from "react-router-dom";

import logoIcon from "../../assets/findmylawyer-icon.png";

export default function Footer() {
  return (
    <footer className="bg-brand-black text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Link
              to="/"
              className="flex items-center gap-3"
            >
              <img
                src={logoIcon}
                alt="FindMyLawyer"
                className="h-10 w-10 rounded-xl"
              />

              <span className="text-lg font-extrabold">
                FindMyLawyer
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-400">
              Helping people find a clearer starting point
              when searching for legal assistance.
            </p>
          </div>

          <div>
            <h3 className="font-semibold">
              Quick Links
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-400">
              <Link
                to="/"
                className="transition hover:text-white"
              >
                Home
              </Link>

              <Link
                to="/find-lawyers"
                className="transition hover:text-white"
              >
                Find Lawyers
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">
              Prototype Notice
            </h3>

            <p className="mt-4 text-sm leading-6 text-neutral-400">
              Lawyer profiles displayed in this demonstration
              are fictional sample data and do not represent
              actual Attorneys-at-Law.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-800 pt-6 text-sm text-neutral-500">
          © 2026 FindMyLawyer. Prototype project.
        </div>
      </div>
    </footer>
  );
}