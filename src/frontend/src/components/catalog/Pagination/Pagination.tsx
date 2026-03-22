/**
 * Профессиональная пагинация для каталога
 * - Prev/Next
 * - Номера страниц с умными ellipsis
 * - Первая/Последняя для большого числа страниц
 * - Доступность (aria, keyboard)
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import styles from './Pagination.module.css';

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

/** Генерирует массив номеров страниц с ellipsis для отображения */
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
  if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}

export interface PaginationProps {
  /** Текущая страница (1-based) */
  page: number;
  /** Всего страниц */
  totalPages: number;
  /** Всего элементов */
  totalItems: number;
  /** Размер страницы */
  pageSize: number;
  /** Callback при смене страницы */
  onPageChange: (page: number) => void;
  /** Callback при смене размера страницы */
  onPageSizeChange?: (pageSize: number) => void;
  /** Показывать селектор размера страницы */
  showPageSizeSelector?: boolean;
  /** Показывать кнопки "В начало" / "В конец" */
  showFirstLast?: boolean;
  /** В состоянии загрузки (блокирует клики) */
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
  const pageNumbers = getPageNumbers(page, totalPages);
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  if (totalPages <= 0) return null;

  const goToPage = (p: number) => {
    if (disabled) return;
    const clamped = Math.max(1, Math.min(p, totalPages));
    if (clamped !== page) onPageChange(clamped);
  };

  return (
    <nav
      className={styles.pagination}
      aria-label="Навигация по страницам каталога"
    >
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
              onChange={(e) => onPageSizeChange(Number(e.target.value) as typeof PAGE_SIZE_OPTIONS[number])}
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
          {pageNumbers.map((num, idx) =>
            num === 'ellipsis' ? (
              <li key={`ellipsis-${idx}`} className={styles.ellipsis} aria-hidden="true">
                …
              </li>
            ) : (
              <li key={num}>
                <button
                  type="button"
                  className={`${styles.pageBtn} ${num === page ? styles.active : ''}`}
                  onClick={() => goToPage(num)}
                  disabled={disabled}
                  aria-current={num === page ? 'page' : undefined}
                  aria-label={`Страница ${num}`}
                >
                  {num}
                </button>
              </li>
            )
          )}
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
    </nav>
  );
}
