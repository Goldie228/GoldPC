/**
 * Пагинация каталога
 * — Блоки страниц с многоточием между ними
 * — Переход на страницу по номеру (валидация)
 */

import { useState, useEffect, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

type PageSegment = { kind: 'pages'; pages: number[] } | { kind: 'ellipsis' };

/** Группы страниц с разделителем «…» между блоками */
function buildPaginationSegments(current: number, total: number, isMobile: boolean): PageSegment[] {
  if (total <= 0) return [];
  if (total === 1) return [{ kind: 'pages', pages: [1] }];
  
  const mobileLimit = 3;
  const desktopLimit = 7;
  const limit = isMobile ? mobileLimit : desktopLimit;

  if (total <= limit) {
    return [{ kind: 'pages', pages: Array.from({ length: total }, (_, i) => i + 1) }];
  }

  const out: PageSegment[] = [];

  if (isMobile) {
    if (current <= 2) {
      out.push({ kind: 'pages', pages: [1, 2] });
      out.push({ kind: 'ellipsis' });
      out.push({ kind: 'pages', pages: [total] });
    } else if (current >= total - 1) {
      out.push({ kind: 'pages', pages: [1] });
      out.push({ kind: 'ellipsis' });
      out.push({ kind: 'pages', pages: [total - 1, total] });
    } else {
      out.push({ kind: 'pages', pages: [1] });
      out.push({ kind: 'ellipsis' });
      out.push({ kind: 'pages', pages: [current] });
      out.push({ kind: 'ellipsis' });
      out.push({ kind: 'pages', pages: [total] });
    }
    return out;
  }

  if (current <= 4) {
    out.push({ kind: 'pages', pages: [1, 2, 3, 4, 5] });
    out.push({ kind: 'ellipsis' });
    out.push({ kind: 'pages', pages: [total] });
  } else if (current >= total - 3) {
    out.push({ kind: 'pages', pages: [1] });
    out.push({ kind: 'ellipsis' });
    out.push({
      kind: 'pages',
      pages: [total - 4, total - 3, total - 2, total - 1, total],
    });
  } else {
    out.push({ kind: 'pages', pages: [1] });
    out.push({ kind: 'ellipsis' });
    out.push({ kind: 'pages', pages: [current - 1, current, current + 1] });
    out.push({ kind: 'ellipsis' });
    out.push({ kind: 'pages', pages: [total] });
  }
  return out;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  showFirstLast?: boolean;
  disabled?: boolean;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showFirstLast = true,
  disabled = false,
}: PaginationProps) {
  const [jumpInput, setJumpInput] = useState(String(page));
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const segments = buildPaginationSegments(page, totalPages, isMobile);
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  useEffect(() => {
    setJumpInput(String(page));
  }, [page]);

  if (totalPages <= 0) return null;

  const goToPage = (p: number) => {
    if (disabled) return;
    const clamped = Math.max(1, Math.min(p, totalPages));
    if (clamped !== page) onPageChange(clamped);
  };

  const submitJump = (e?: FormEvent) => {
    e?.preventDefault();
    const n = parseInt(jumpInput.trim(), 10);
    if (Number.isNaN(n) || n < 1) {
      setJumpInput(String(page));
      return;
    }
    goToPage(n);
  };

  return (
    <nav className="flex flex-col gap-4 mt-8 pt-6 border-t border-hairline-dark" aria-label="Навигация по страницам каталога">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-text">
          Показано {startItem}–{endItem} из {totalItems}
        </span>
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="catalog-page-size" className="text-xs text-muted-text whitespace-nowrap">
              На странице:
            </label>
            <select
              id="catalog-page-size"
              className="h-9 px-3 pr-8 bg-surface-elevated border border-hairline-dark rounded-lg text-sm text-body-text cursor-pointer transition-colors hover:border-muted-strong focus:outline-none focus:border-gold appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%2371717a%27%20stroke-width%3D%272%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpolyline%20points%3D%276%209%2012%2015%2018%209%27%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[position:right_10px_center] bg-no-repeat"
              value={pageSize}
              onChange={(e) =>
                onPageSizeChange(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])
              }
              disabled={disabled}
              aria-label="Количество товаров на странице"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {showFirstLast && totalPages > 5 && (
            <button
              type="button"
              className="flex items-center gap-1.5 min-w-[44px] min-h-[44px] px-3.5 bg-surface-card border border-hairline-dark rounded-lg text-sm font-medium text-body-text transition-all hover:border-gold hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => goToPage(1)}
              disabled={page <= 1 || disabled}
              aria-label="На первую страницу"
            >
              <ChevronsLeft size={18} />
            </button>
        )}
        <button
          type="button"
          className="flex items-center gap-1.5 min-w-[44px] min-h-[44px] px-3.5 bg-surface-card border border-hairline-dark rounded-lg text-sm font-medium text-body-text transition-all hover:border-gold hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1 || disabled}
          aria-label="Предыдущая страница"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Назад</span>
        </button>

        <ul className="flex items-center flex-wrap justify-center gap-0 list-none m-0 p-0" role="list">
          {segments.map((seg, segIdx) => {
            if (seg.kind === 'ellipsis') {
              return (
              <li
                   key={`ellipsis-${segIdx}`}
                   className="flex items-center justify-center min-w-[28px] h-11 px-1.5 list-none"
                   aria-hidden="true"
                 >
                   <span className="text-body-text text-lg tracking-[0.12em] select-none opacity-85">…</span>
                 </li>
              );
            }
             return (
               <li key={`seg-${segIdx}-${seg.pages.join('-')}`} className="flex items-center">
                 <div className="flex items-center gap-1" role="presentation">
                   {seg.pages.map((num) => (
                     <button
                       key={num}
                       type="button"
                       className={`min-w-[44px] h-11 flex items-center justify-center bg-transparent border border-hairline-dark rounded-lg text-sm font-medium text-body-text cursor-pointer transition-all hover:border-gold hover:text-gold ${num === page ? 'bg-gold/15 border-gold text-gold' : ''}`}
                       onClick={() => goToPage(num)}
                       disabled={disabled}
                       aria-current={num === page ? 'page' : undefined}
                       aria-label={`Страница ${num}`}
                     >
                       {num}
                     </button>
                   ))}
                 </div>
               </li>
             );
          })}
        </ul>

        <button
          type="button"
          className="flex items-center gap-1.5 min-w-[44px] min-h-[44px] px-3.5 bg-surface-card border border-hairline-dark rounded-lg text-sm font-medium text-body-text transition-all hover:border-gold hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages || disabled}
          aria-label="Следующая страница"
        >
          <span className="hidden sm:inline">Далее</span>
          <ChevronRight size={18} />
        </button>
        {showFirstLast && totalPages > 5 && (
          <button
            type="button"
            className="flex items-center gap-1.5 min-w-[44px] min-h-[44px] px-3.5 bg-surface-card border border-hairline-dark rounded-lg text-sm font-medium text-body-text transition-all hover:border-gold hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => goToPage(totalPages)}
            disabled={page >= totalPages || disabled}
            aria-label="На последнюю страницу"
          >
            <ChevronsRight size={18} />
          </button>
        )}
      </div>

      {totalPages > 1 && (
        <form className="flex flex-wrap items-center justify-center gap-2.5 mt-2 pt-3 border-t border-dashed border-hairline-dark" onSubmit={submitJump} aria-label="Переход на страницу по номеру">
          <label htmlFor="catalog-page-jump" className="text-sm text-muted-text">
            Страница
          </label>
          <input
            id="catalog-page-jump"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-14 h-10 text-center bg-surface-elevated border border-hairline-dark rounded-lg text-body-text text-sm tabular-nums focus:outline-none focus:border-gold disabled:opacity-50"
            value={jumpInput}
            disabled={disabled}
            onChange={(e) => setJumpInput(e.target.value.replace(/\D/g, ''))}
            onBlur={() => {
              const n = parseInt(jumpInput.trim(), 10);
              if (Number.isNaN(n) || n < 1) setJumpInput(String(page));
              else setJumpInput(String(Math.min(totalPages, Math.max(1, n))));
            }}
            aria-describedby="catalog-page-jump-hint"
          />
          <span id="catalog-page-jump-hint" className="text-xs text-muted-text">
            из {totalPages}
          </span>
          <button type="submit" className="h-10 px-4 bg-surface-card border border-hairline-dark rounded-lg text-sm font-medium text-body-text cursor-pointer transition-colors hover:border-gold hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed" disabled={disabled}>
            Перейти
          </button>
        </form>
      )}
    </nav>
  );
}
