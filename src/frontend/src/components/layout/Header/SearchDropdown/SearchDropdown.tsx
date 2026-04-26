import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchProducts } from '../../../../api/catalogService';
import type { ProductSummary } from '../../../../api/types';
import styles from './SearchDropdown.module.css';

interface SearchDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SearchDropdown({ isOpen, onToggle }: SearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await searchProducts(q.trim(), { page: 1, pageSize: 5 });
      setResults(res.products ?? []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onChange = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(q), 300);
  };

  const onSelect = (slug: string) => {
    navigate(`/product/${slug}`);
    setQuery('');
    setResults([]);
    onToggle();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      navigate(`/catalog?search=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setResults([]);
      onToggle();
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onToggle]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.inputWrapper}>
        <Search size={16} className={styles.searchIcon} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Поиск товаров..."
          className={styles.input}
        />
        {query && (
          <button
            className={styles.clearBtn}
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            type="button"
            aria-label="Очистить"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {(isLoading || results.length > 0) && (
        <div className={styles.results}>
          {isLoading && <div className={styles.loading}>Поиск...</div>}
          {!isLoading && results.map((p) => (
            <button
              key={p.id}
              className={styles.resultItem}
              onClick={() => onSelect(p.slug)}
              type="button"
            >
              <img
                src={p.mainImageUrl || '/placeholder.png'}
                alt={p.name}
                className={styles.resultImg}
              />
              <div className={styles.resultInfo}>
                <div className={styles.resultName}>{p.name}</div>
                <div className={styles.resultPrice}>{p.price?.toLocaleString('ru-RU')} ₽</div>
              </div>
            </button>
          ))}
          {!isLoading && results.length > 0 && (
            <button
              className={styles.viewAll}
              onClick={() => {
                navigate(`/catalog?search=${encodeURIComponent(query.trim())}`);
                setQuery('');
                setResults([]);
                onToggle();
              }}
              type="button"
            >
              Все результаты
            </button>
          )}
        </div>
      )}
    </div>
  );
}
