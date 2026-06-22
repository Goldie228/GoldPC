export function formatPrice(price: number): string {
  return price.toLocaleString('ru-BY') + ' BYN';
}

export function formatDateTime(dateStr: string | undefined): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('ru-BY', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('ru-BY', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('ru-BY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
