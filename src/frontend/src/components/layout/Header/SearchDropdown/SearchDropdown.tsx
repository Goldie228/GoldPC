/**
 * SearchDropdown — живой поиск с выпадающим списком результатов
 *
 * Features:
 * - Debounce input (300ms)
 * - Search by name, brand, manufacturer
 * - Top 5 results with thumbnail, highlighted name, price
 * - Empty state: "Popular queries" when input is empty
 * - Footer link: "View all results" → /catalog?search=...
 * - Click outside / Escape to close
 * - Keyboard navigation support
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, TrendingUp, Loader2, Image } from 'lucide-react';
import { useDebounce } from '../../../../hooks/useDebounce';
import { hasValidProductImage } from '../../../../utils/image';
import { useProducts } from '../../../../hooks/useProducts';
import styles from './SearchDropdown.module.css';

/** Популярные запросы для empty state */
const POPULAR_QUERIES = [
  'RTX 4090',
  'Процессор AMD',
  'Оперативная память DDR5',
  'SSD NVMe',
  'Монитор 27"',
];

/** Подсветка совпадений в тексте */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className={styles.highlight}>
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SearchDropdown() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 300);

  // Запрос продуктов при наличии debounced запроса
  const { data, isLoading } = useProducts({
    search: debouncedQuery.trim() || undefined,
    pageSize: 5,
  });

  const results = data?.data ?? [];
  const hasQuery = debouncedQuery.trim().length > 0;
  const showResults = isOpen && hasQuery && results.length > 0;
  const showEmpty = isOpen && hasQuery && !isLoading && results.length === 0;
  const showPopular = isOpen && !hasQuery;

  // Открытие dropdown при фокусе
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
  }, []);

  // Закрытие dropdown
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsFocused(false);
    setQuery('');
  }, []);

  // Клик по результату
  const handleResultClick = useCallback(
    (productId: string) => {
      navigate(`/product/${productId}`);
      handleClose();
    },
    [navigate, handleClose]
  );

  // Клик по популярному запросу
  const handlePopularClick = useCallback((popularQuery: string) => {
    setQuery(popularQuery);
    inputRef.current?.focus();
  }, []);

  // Переход ко всем результатам
  const handleViewAll = useCallback(() => {
    if (debouncedQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(debouncedQuery.trim())}`);
    }
    handleClose();
  }, [navigate, debouncedQuery, handleClose]);

  // Обработка Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Клик вне компонента
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={dropdownRef}>
      {/* Search Input */}
      <div className={`${styles.inputWrapper} ${isFocused ? styles.inputWrapperFocused : ''}`}>
        <Search className={styles.searchIcon} />
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="Поиск товаров..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          aria-label="Поиск товаров"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        {query && (
          <button
            className={styles.clearBtn}
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Очистить поиск"
            type="button"
          >
            <X />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {/* Loading */}
          {isLoading && hasQuery && (
            <div className={styles.loading}>
              <Loader2 className={styles.spinner} />
              <span>Поиск...</span>
            </div>
          )}

          {/* Search Results */}
          {showResults && (
            <>
              <ul className={styles.resultsList}>
                {results.map((product) => (
                  <li key={product.id}>
                    <button
                      className={styles.resultItem}
                      onClick={() => handleResultClick(product.id)}
                      type="button"
                      role="option"
                    >
                      {/* Thumbnail */}
                      <div className={styles.thumbnail}>
                        {hasValidProductImage(product.mainImage?.url) ? (
                          <img
                            src={product.mainImage.url}
                            alt={product.mainImage.alt || product.name}
                            className={styles.thumbnailImg}
                          />
                        ) : (
                          <div className={styles.thumbnailPlaceholder}>
                            <Image size={20} strokeWidth={1.5} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className={styles.resultInfo}>
                        <span className={styles.resultName}>
                          {highlightMatch(product.name, debouncedQuery)}
                        </span>
                        {product.manufacturer && (
                          <span className={styles.resultBrand}>
                            {highlightMatch(product.manufacturer.name, debouncedQuery)}
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className={styles.resultPrice}>
                        {product.oldPrice && (
                          <span className={styles.oldPrice}>
                            {product.oldPrice.toLocaleString('ru-RU')} BYN
                          </span>
                        )}
                        <span className={styles.price}>
                          {product.price.toLocaleString('ru-RU')} BYN
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <button className={styles.footer} onClick={handleViewAll} type="button">
                Все результаты →
              </button>
            </>
          )}

          {/* Empty State */}
          {showEmpty && (
            <div className={styles.emptyState}>
              <p className={styles.emptyText}>
                По запросу «{debouncedQuery}» ничего не найдено
              </p>
              <p className={styles.emptyHint}>Попробуйте изменить запрос</p>
            </div>
          )}

          {/* Popular Queries */}
          {showPopular && (
            <div className={styles.popularSection}>
              <div className={styles.popularHeader}>
                <TrendingUp />
                <span>Популярные запросы</span>
              </div>
              <ul className={styles.popularList}>
                {POPULAR_QUERIES.map((q) => (
                  <li key={q}>
                    <button
                      className={styles.popularItem}
                      onClick={() => handlePopularClick(q)}
                      type="button"
                    >
                      <Search className={styles.popularIcon} />
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}