import { type ReactElement, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../../hooks/useCart';
import { hasValidProductImage } from '../../../utils/image';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * MiniCart - Dropdown корзины в хедере (Modern 2026 Redesign)
 *
 * Features:
 * - Список товаров с миниатюрами, названием, количеством и ценой
 * - Кнопка удаления (X) для каждого товара
 * - Общая сумма заказа
 * - Кнопки "Продолжить покупки" и "Оформить заказ"
 * - Пустое состояние с ссылкой на каталог
 */
export function MiniCart({ isOpen, onClose }: MiniCartProps): ReactElement {
  const { items, totalPrice, isEmpty, removeFromCart, itemCount, changeQuantity } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const prevActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    prevActiveRef.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    if (!panel) return;

    const getFocusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));

    requestAnimationFrame(() => {
      const focusables = getFocusables();
      focusables[0]?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusables();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      prevActiveRef.current?.focus?.();
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[140] transition-colors duration-250 ${isOpen ? 'bg-black/50 pointer-events-auto' : 'bg-transparent pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dropdown */}
      <div
        ref={panelRef}
        className={`fixed top-[72px] right-5 w-[400px] max-h-[calc(100vh-100px)] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl z-[150] flex flex-col shadow-lg transition-all duration-250 max-[768px]:right-2 max-[768px]:left-2 max-[768px]:w-auto max-[768px]:top-15 max-[768px]:max-h-[calc(100vh-80px)] ${isOpen ? 'translate-y-0 opacity-100 visible' : '-translate-y-2 opacity-0 invisible'}`}
        aria-hidden={!isOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Корзина"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <span className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-wider text-[var(--fg)]">
            <ShoppingBag size={20} />
            Корзина ({itemCount})
          </span>
          <button
            className="w-9 h-9 flex items-center justify-center bg-transparent border border-[var(--border)] rounded-lg text-[var(--fg-muted)] cursor-pointer transition-colors hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-500)] hover:bg-[rgba(252,213,53,0.08)]"
            onClick={onClose}
            aria-label="Закрыть"
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 gap-3 text-center">
            <ShoppingBag size={32} strokeWidth={1.5} />
            <p>Корзина пуста</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--fg-dim)', margin: 0 }}>
              Добавьте товары из каталога
            </p>
            <Link to="/catalog" className="text-sm font-medium text-[var(--color-gold-500)] no-underline px-5 py-2 border border-[var(--border-brand)] rounded-lg transition-colors hover:bg-[rgba(252,213,53,0.1)] hover:text-[var(--color-gold-400)] hover:border-[var(--color-gold-400)] inline-flex items-center gap-1.5" onClick={onClose}>
              Перейти в каталог
              <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </Link>
          </div>
        ) : (
          <>
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[52px_1fr_auto_auto] gap-3 items-center p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg transition-colors hover:border-[var(--border-brand)] max-[768px]:grid-cols-[44px_1fr_auto_auto] max-[768px]:gap-2.5 max-[768px]:p-2.5">
                  <div className="w-[52px] h-[52px] flex items-center justify-center bg-white rounded-lg overflow-hidden p-1 max-[768px]:w-11 max-[768px]:h-11">
                    {hasValidProductImage(item.imageUrl) ? (
                      <img src={item.imageUrl} alt={item.name} />
                    ) : (
                      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="15" y="15" width="70" height="70" rx="4" fill="#1a1a1e" stroke="#3a3a3e"/>
                        <text x="50" y="55" textAnchor="middle" fill="#FCD535" fontSize="10">Нет фото</text>
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <span className="text-[0.825rem] font-medium text-[var(--fg)] whitespace-nowrap overflow-hidden text-ellipsis leading-[1.3] max-[768px]:text-[0.8rem]">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        className="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-md text-[var(--fg)] text-base font-medium cursor-pointer transition-colors hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-500)] hover:bg-[rgba(252,213,53,0.08)] p-0 leading-[1] max-[768px]:w-7 max-[768px]:h-7"
                        onClick={() => changeQuantity(item.productId, -1)}
                        aria-label="Уменьшить количество"
                        type="button"
                      >
                        −
                      </button>
                      <span className="font-sans text-sm font-semibold text-[var(--fg)] min-w-[28px] text-center">{item.quantity}</span>
                      <button
                        className="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] rounded-md text-[var(--fg)] text-base font-medium cursor-pointer transition-colors hover:border-[var(--color-gold-400)] hover:text-[var(--color-gold-500)] hover:bg-[rgba(252,213,53,0.08)] p-0 leading-[1] max-[768px]:w-7 max-[768px]:h-7"
                        onClick={() => changeQuantity(item.productId, 1)}
                        aria-label="Увеличить количество"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <span className="font-sans text-[0.85rem] font-semibold text-[var(--color-gold-500)] whitespace-nowrap max-[768px]:text-[0.8rem]">
                    {(item.price * item.quantity).toLocaleString('ru-BY')} BYN
                  </span>
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-transparent border border-transparent rounded-md text-[var(--fg-dim)] cursor-pointer transition-colors hover:border-[var(--border-brand)] hover:text-[var(--color-gold-500)] hover:bg-[rgba(252,213,53,0.08)] max-[768px]:w-7 max-[768px]:h-7"
                    onClick={() => removeFromCart(item.productId)}
                    aria-label={`Удалить ${item.name}`}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[var(--border)] flex flex-col gap-4 bg-[var(--bg)] rounded-b-xl">
              <div className="flex justify-between items-center">
                <span>Итого:</span>
                <span className="font-sans text-[1.375rem] font-semibold text-[var(--color-gold-500)] max-[768px]:text-[1.2rem]">
                  {totalPrice.toLocaleString('ru-BY')} BYN
                </span>
              </div>
              <div className="flex gap-2.5">
                <Link to="/catalog" className="flex-1 inline-flex items-center justify-center px-4 py-2.5 font-sans text-[0.825rem] font-medium text-[var(--color-gold-500)] no-underline text-center bg-transparent border border-[var(--border-brand)] rounded-lg cursor-pointer transition-colors hover:bg-[rgba(252,213,53,0.1)] hover:text-[var(--color-gold-400)] hover:border-[var(--color-gold-400)]" onClick={onClose}>
                  Продолжить покупки
                </Link>
                <Link to="/cart" className="flex-1 inline-flex items-center justify-center px-4 py-2.5 font-sans text-[0.825rem] font-semibold text-[var(--bg)] no-underline bg-[var(--color-gold-500)] border border-[var(--color-gold-500)] rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-gold-400)] hover:border-[var(--color-gold-400)]" onClick={onClose}>
                  Перейти в корзину
                  <ArrowRight size={14} style={{ marginLeft: 6 }} />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
