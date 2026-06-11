/**
 * StockBadge — бейдж наличия товара.
 * Показывает три состояния: нет в наличии, мало, в наличии.
 */
export function StockBadge({ stock }: { stock: number }) {
  let config;
  if (stock === 0) {
    config = { dot: 'bg-price-rise', text: 'text-price-rise', label: 'Нет в наличии' };
  } else if (stock <= 3) {
    config = { dot: 'bg-gold', text: 'text-gold', label: 'Мало' };
  } else {
    config = { dot: 'bg-price-drop', text: 'text-price-drop', label: 'В наличии' };
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-elevated/80 backdrop-blur-sm ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
