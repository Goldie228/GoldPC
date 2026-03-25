/**
 * Пагинация каталога
 * — Блоки страниц с многоточием между ними
 * — Переход на страницу по номеру (валидация)
 */

import { useState, useEffect, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import styles from './Pagination.module.css';

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
    <nav className={styles.pagination} aria-label="Навигация по страницам каталога">
      <div className={styles.paginationInfo}>
        <span className={styles.rangeText}>
          Показано {startItem}–{endItem} из {totalItems}
        </span>
        {showPageSizeSelector && onPageSizeChange && (
          <div className={styles.pageSizeGroup}>
            <label htmlFor="catalog-page-size" className={styles.pageSizeLabel}>
              На странице:
            </label>
            <select
              id="catalog-page-size"
              className={styles.pageSizeSelect}
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

      <div className={styles.paginationControls}>
        {showFirstLast && totalPages > 5 && (
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => goToPage(1)}
            disabled={page <= 1 || disabled}
            aria-label="На первую страницу"
          >
            <ChevronsLeft size={18} />
          </button>
        )}
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1 || disabled}
          aria-label="Предыдущая страница"
        >
          <ChevronLeft size={18} />
          <span className={styles.navBtnText}>Назад</span>
        </button>

        <ul className={styles.pageNumbers} role="list">
          {segments.map((seg, segIdx) => {
            if (seg.kind === 'ellipsis') {
              return (
                <li
                  key={`ellipsis-${segIdx}`}
                  className={styles.ellipsisBetween}
                  aria-hidden="true"
                >
                  <span className={styles.ellipsisDots}>…</span>
                </li>
              );
            }
            return (
              <li key={`seg-${segIdx}-${seg.pages.join('-')}`} className={styles.pageGroup}>
                <div className={styles.pageGroupInner} role="presentation">
                  {seg.pages.map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`${styles.pageBtn} ${num === page ? styles.active : ''}`}
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
          className={styles.navBtn}
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages || disabled}
          aria-label="Следующая страница"
        >
          <span className={styles.navBtnText}>Далее</span>
          <ChevronRight size={18} />
        </button>
        {showFirstLast && totalPages > 5 && (
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => goToPage(totalPages)}
            disabled={page >= totalPages || disabled}
            aria-label="На последнюю страницу"
          >
            <ChevronsRight size={18} />
          </button>
        )}
      </div>

      {totalPages > 1 && (
        <form className={styles.jumpForm} onSubmit={submitJump} aria-label="Переход на страницу по номеру">
          <label htmlFor="catalog-page-jump" className={styles.jumpLabel}>
            Страница
          </label>
          <input
            id="catalog-page-jump"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={styles.jumpInput}
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
          <span id="catalog-page-jump-hint" className={styles.jumpHint}>
            из {totalPages}
          </span>
          <button type="submit" className={styles.jumpBtn} disabled={disabled}>
            Перейти
          </button>
        </form>
      )}
    </nav>
  );
}
