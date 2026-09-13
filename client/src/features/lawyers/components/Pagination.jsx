function getVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);

  if (currentPage > 1) {
    pages.add(currentPage - 1);
  }

  if (currentPage < totalPages) {
    pages.add(currentPage + 1);
  }

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      items.push(`ellipsis-${page}`);
    }

    items.push(page);
  });

  return items;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <nav
      aria-label="Search result pages"
      className="flex flex-wrap items-center justify-center gap-2 border-t border-brand-border bg-white px-4 py-5"
    >
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="h-10 rounded-lg border border-brand-border px-3 text-sm font-semibold text-brand-black transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>

      {visiblePages.map((item) =>
        typeof item === "string" ? (
          <span
            key={item}
            className="flex h-10 min-w-8 items-center justify-center text-sm text-brand-muted"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            disabled={disabled}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold transition ${
              item === page
                ? "bg-brand-black text-white"
                : "border border-brand-border bg-white text-brand-black hover:border-neutral-400"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="h-10 rounded-lg border border-brand-border px-3 text-sm font-semibold text-brand-black transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}
