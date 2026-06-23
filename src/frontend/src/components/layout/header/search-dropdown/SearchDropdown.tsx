import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchProducts } from '@/api/catalog';
import type { ProductSummary } from '@/api/types';

interface SearchDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SearchDropdown({ isOpen, onToggle }: SearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_isFocused, setIsFocused] = useState(false);
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
      setResults(res.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onChange = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void doSearch(q), 300);
  };

  const onSelect = (slug: string) => {
    void navigate(`/product/${slug}`);
    setQuery('');
    setResults([]);
    onToggle();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      void navigate(`/catalog?search=${encodeURIComponent(query.trim())}`);
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
    <div className="absolute top-[calc(100%+8px)] right-0 w-[400px] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg z-[200] overflow-hidden max-[640px]:fixed max-[640px]:top-16 max-[640px]:left-0 max-[640px]:right-0 max-[640px]:w-full max-[640px]:rounded-none max-[640px]:border-l-0 max-[640px]:border-r-0" ref={containerRef}>
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[var(--border)]">
        <Search size={16} className="w-4 h-4 text-[var(--fg-muted)] flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Поиск товаров..."
          className="flex-1 border-none bg-transparent font-sans text-sm text-[var(--fg)] outline-none placeholder:text-[var(--fg-muted)]"
        />
        {query && (
            <button
            className="flex items-center justify-center w-6 h-6 bg-transparent border-none rounded-md text-[var(--fg-muted)] cursor-pointer transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)]"
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            type="button"
            aria-label="Очистить"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {(isLoading || results.length > 0) && (
        <div className="max-h-[320px] overflow-y-auto">
          {isLoading && <div className="p-4 text-sm text-[var(--fg-muted)] text-center">Поиск...</div>}
          {!isLoading && results.map((p) => (
            <button
              key={p.id}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-transparent border-none border-b border-[var(--border)] cursor-pointer text-left font-sans transition-colors hover:bg-[var(--bg-elevated)]"
              onClick={() => p.slug && onSelect(p.slug)}
              type="button"
            >
                <img
                src={p.mainImage?.url || '/placeholder.png'}
                alt={p.name}
                className="w-10 h-10 object-contain rounded-md bg-[var(--bg-elevated)] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--fg)] whitespace-nowrap overflow-hidden text-ellipsis">{p.name}</div>
                <div className="text-xs text-[var(--color-gold-500)] font-semibold mt-0.5">{p.price?.toLocaleString('ru-RU')} BYN</div>
              </div>
            </button>
          ))}
          {!isLoading && results.length > 0 && (
            <button
              className="block w-full px-3.5 py-2.5 bg-transparent border-none border-t border-[var(--border)] text-[var(--color-gold-500)] font-sans text-sm font-medium cursor-pointer text-center transition-colors hover:bg-[var(--bg-elevated)]"
              onClick={() => {
      void navigate(`/catalog?search=${encodeURIComponent(query.trim())}`);
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
