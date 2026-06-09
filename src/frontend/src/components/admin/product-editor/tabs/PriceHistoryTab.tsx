/**
 * PriceHistoryTab — таб с историей изменений цены товара
 */

import { useQuery } from '@tanstack/react-query';
import { catalogAdminApi } from '@/api/admin';
import type { PriceHistoryDto } from '@/api/types';
import { Loader2 } from 'lucide-react';

interface PriceHistoryTabProps {
  productId: string;
  currentPrice: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-BY', {
    style: 'currency',
    currency: 'BYN',
    minimumFractionDigits: 2,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PriceHistoryTab({ productId, currentPrice }: PriceHistoryTabProps) {
  const { data: history, isLoading, error } = useQuery<PriceHistoryDto[]>({
    queryKey: ['price-history', productId],
    queryFn: () => catalogAdminApi.getPriceHistory(productId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Ошибка загрузки истории цен
      </div>
    );
  }

  const entries = history ?? [];

  return (
    <div className="space-y-6">
      {/* Текущая цена */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-surface-card">
        <div className="text-sm text-muted-foreground">Текущая цена:</div>
        <div className="text-lg font-semibold text-gold">{formatPrice(currentPrice)}</div>
      </div>

      {/* История изменений */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          История цен пуста
        </div>
      ) : (
        <div className="relative">
          {/* Линия таймлайна */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-[var(--border-muted)]" />

          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="relative pl-10">
                {/* Точка на таймлайне */}
                <div className="absolute left-3 top-3 w-3 h-3 rounded-full bg-gold border-2 border-[var(--bg-primary)]" />

                <div className="p-4 rounded-lg bg-surface-card">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {formatDate(entry.changedAt)}
                    </div>
                    {entry.changedBy && (
                      <div className="text-xs text-muted-foreground">
                        ID: {entry.changedBy}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    {entry.oldPrice != null && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(entry.oldPrice)}
                      </span>
                    )}
                    {entry.oldPrice != null && (
                      <span className="text-muted-foreground">→</span>
                    )}
                    <span className="text-base font-semibold text-gold">
                      {formatPrice(entry.price)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
