interface PagePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PagePagination({ currentPage, totalPages, onPageChange }: PagePaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 text-sm rounded-lg border border-hairline-dark bg-surface-card text-foreground hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Назад
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 py-1.5 text-sm text-muted-foreground">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              p === currentPage
                ? 'bg-gold text-black border-gold font-medium'
                : 'border-hairline-dark bg-surface-card text-foreground hover:bg-surface-elevated'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 text-sm rounded-lg border border-hairline-dark bg-surface-card text-foreground hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Далее
      </button>
    </div>
  );
}
