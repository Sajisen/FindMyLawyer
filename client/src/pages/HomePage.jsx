import { Link } from "react-router-dom";

const practiceAreas = [
  {
    id: "property",
    name: "Land & Property",
    description:
      "Property ownership, boundary disputes, transfers and related matters.",
  },
  {
    id: "family",
    name: "Family & Matrimonial",
    description:
      "Family disputes, maintenance, custody and matrimonial matters.",
  },
  {
    id: "criminal",
    name: "Criminal Law",
    description:
      "Legal assistance relating to criminal matters and proceedings.",
  },
  {
    id: "employment",
    name: "Employment & Labour",
    description:
      "Employment disputes, termination, workplace and labour matters.",
  },
  {
    id: "business",
    name: "Business & Commercial",
    description:
      "Commercial agreements, businesses and related legal matters.",
  },
  {
    id: "civil",
    name: "Civil Disputes",
    description:
      "Civil claims, compensation and disputes between parties.",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* TOP BANNER */}
      <section className="border-b border-yellow-200 bg-brand-yellow-soft">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="text-sm font-semibold text-brand-black">
              Not sure which type of legal help you need?
            </p>

            <p className="mt-0.5 text-sm text-brand-muted">
              Start with a guided search and find a relevant area of practice.
            </p>
          </div>

          <Link
            to="/find-lawyers"
            className="w-fit shrink-0 text-sm font-bold text-brand-black transition hover:underline"
          >
            Start Search
          </Link>
        </div>
      </section>

      {/* HERO */}
      <section className="overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-24">
          {/* Hero Content */}
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight text-brand-black sm:text-5xl lg:text-6xl lg:leading-[1.08]">
              Find the legal help{" "}
              <span className="relative inline-block">
                you need
                <span className="absolute bottom-1 left-0 -z-10 h-3 w-full bg-brand-yellow sm:h-4" />
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-brand-muted sm:text-lg">
              Search for Attorneys-at-Law by area of practice and preferred
              location, then explore profiles relevant to your needs.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/find-lawyers"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-yellow px-6 font-bold text-brand-black transition hover:bg-brand-yellow-dark"
              >
                Find a Lawyer
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-brand-border bg-white px-6 font-semibold text-brand-black transition hover:border-neutral-400"
              >
                How It Works
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-brand-muted">
              <span>✓ Search by practice area</span>
              <span>✓ Choose your location</span>
              <span>✓ Explore relevant profiles</span>
            </div>
          </div>

          {/* Search Preview */}
          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-3xl border border-brand-border bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
              <div className="border-b border-brand-border pb-5">
                <p className="text-sm font-medium text-brand-muted">
                  Lawyer Search
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-brand-black">
                  Find legal assistance
                </h2>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-brand-black">
                  Area of Practice
                </label>

                <div className="flex min-h-14 items-center justify-between rounded-xl border border-brand-border bg-brand-background px-4">
                  <span className="text-sm text-brand-black">
                    Land, Property & Notarial Matters
                  </span>

                  <span className="text-brand-muted">
                    ▾
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold text-brand-black">
                  Preferred Location
                </label>

                <div className="flex min-h-14 items-center justify-between rounded-xl border border-brand-border bg-brand-background px-4">
                  <span className="text-sm text-brand-black">
                    Panadura
                  </span>

                  <span className="text-brand-muted">
                    ▾
                  </span>
                </div>
              </div>

              <Link
                to="/find-lawyers"
                className="mt-6 flex min-h-13 items-center justify-center rounded-xl bg-brand-black px-5 font-bold text-white transition hover:bg-brand-dark"
              >
                Find Matching Lawyers
              </Link>

              <div className="mt-6 rounded-xl border border-brand-border bg-brand-background p-4">
                <p className="text-sm font-semibold text-brand-black">
                  Not sure which area of practice to choose?
                </p>

                <p className="mt-1 text-sm leading-6 text-brand-muted">
                  Start your search and we&apos;ll help you narrow down a
                  relevant category.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIMPLE BENEFITS */}
      <section className="border-y border-brand-border bg-brand-background">
        <div className="mx-auto grid max-w-7xl px-5 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="border-b border-brand-border py-6 sm:border-b-0 sm:border-r sm:pr-8">
            <h3 className="font-bold text-brand-black">
              Search by legal need
            </h3>

            <p className="mt-1 text-sm leading-6 text-brand-muted">
              Begin with a relevant area of practice.
            </p>
          </div>

          <div className="border-b border-brand-border py-6 sm:border-b-0 sm:border-r sm:px-8">
            <h3 className="font-bold text-brand-black">
              Choose your location
            </h3>

            <p className="mt-1 text-sm leading-6 text-brand-muted">
              Find profiles based on where you prefer assistance.
            </p>
          </div>

          <div className="py-6 sm:pl-8">
            <h3 className="font-bold text-brand-black">
              Compare profiles clearly
            </h3>

            <p className="mt-1 text-sm leading-6 text-brand-muted">
              Review useful profile information before proceeding.
            </p>
          </div>
        </div>
      </section>

      {/* PRACTICE AREAS */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
              Areas of Practice
            </p>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
              Start with the legal help you need
            </h2>

            <p className="mt-4 text-base leading-7 text-brand-muted sm:text-lg">
              Explore commonly searched areas of practice available through
              FindMyLawyer.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {practiceAreas.map((area) => (
              <Link
                to={`/find-lawyers?category=${area.id}`}
                key={area.id}
              >
                <div className="mb-5 h-1 w-10 rounded-full bg-brand-yellow" />

                <h3 className="text-lg font-bold text-brand-black">
                  {area.name}
                </h3>

                <p className="mt-3 text-sm leading-6 text-brand-muted">
                  {area.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="bg-brand-black py-20 text-white lg:py-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-brand-yellow">
              How It Works
            </p>

            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
              A straightforward way to begin
            </h2>

            <p className="mt-4 text-base leading-7 text-neutral-400 sm:text-lg">
              FindMyLawyer keeps the search process simple and easy to
              understand.
            </p>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <article>
              <div className="text-sm font-extrabold text-brand-yellow">
                01
              </div>

              <h3 className="mt-4 text-xl font-bold">
                Choose what you need
              </h3>

              <p className="mt-3 leading-7 text-neutral-400">
                Select an area of practice or begin with a guided search when
                you are unsure.
              </p>
            </article>

            <article>
              <div className="text-sm font-extrabold text-brand-yellow">
                02
              </div>

              <h3 className="mt-4 text-xl font-bold">
                Select your location
              </h3>

              <p className="mt-3 leading-7 text-neutral-400">
                Choose where you would prefer to find legal assistance.
              </p>
            </article>

            <article>
              <div className="text-sm font-extrabold text-brand-yellow">
                03
              </div>

              <h3 className="mt-4 text-xl font-bold">
                Explore profiles
              </h3>

              <p className="mt-3 leading-7 text-neutral-400">
                Review matching profiles and decide which ones you want to
                explore further.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="bg-white py-20 lg:py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#806600]">
              About FindMyLawyer
            </p>

            <h2 className="mt-4 max-w-lg text-3xl font-extrabold tracking-tight text-brand-black sm:text-4xl">
              A clearer starting point for finding legal help
            </h2>
          </div>

          <div className="space-y-5 text-base leading-8 text-brand-muted sm:text-lg">
            <p>
              FindMyLawyer is a Sri Lankan lawyer-discovery platform designed
              to make it easier to begin searching for legal assistance.
            </p>

            <p>
              Users can search based on areas of practice, preferred location
              and other relevant preferences before reviewing lawyer profiles.
            </p>

            <p>
              The platform helps with discovery and routing. It does not
              replace professional legal advice.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-brand-background py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-brand-yellow px-7 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-brand-black">
                Ready to begin your search?
              </h2>

              <p className="mt-3 leading-7 text-black/70">
                Choose the legal help you need and explore relevant lawyer
                profiles.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3 lg:mt-0">
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-black/20 px-5 font-bold text-brand-black transition hover:border-brand-black"
              >
                Register
              </Link>

              <Link
                to="/find-lawyers"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-black px-6 font-bold text-white transition hover:bg-brand-dark"
              >
                Find Lawyers
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}