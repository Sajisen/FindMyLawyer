import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="bg-brand-background">
      <section className="mx-auto flex min-h-[68vh] max-w-5xl items-center px-5 py-16 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-brand-border bg-white shadow-[0_24px_70px_-42px_rgba(20,20,20,0.35)] lg:grid-cols-[1fr_300px]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#806600]">
              Page not found
            </p>
            <h1 className="mt-3 max-w-xl text-3xl font-extrabold tracking-[-0.03em] text-brand-black sm:text-4xl">
              This page is not part of FindMyLawyer.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-brand-muted sm:text-[15px]">
              The address may be outdated or mistyped. You can return home or continue directly to lawyer discovery.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-yellow px-5 text-sm font-extrabold text-brand-black transition hover:bg-brand-yellow-dark"
              >
                Return home
              </Link>
              <Link
                to="/find-lawyers"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-border bg-white px-5 text-sm font-bold text-brand-black transition hover:bg-brand-background"
              >
                Find lawyers
              </Link>
            </div>
          </div>

          <div className="relative hidden items-center justify-center overflow-hidden bg-brand-black lg:flex">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[34px] border-brand-yellow/10" />
            <div className="text-center">
              <p className="text-7xl font-black tracking-[-0.06em] text-brand-yellow">404</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                Nothing here
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
