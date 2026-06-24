/**
 * Страница экспорта данных для бухгалтера
 * Заказы и товары — экспорт через ReportingService (CSV с сервера)
 * Клиенты — через usersAdminApi (клиентская генерация CSV)
 */

import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/useToast';
import { usersAdminApi } from '@/api/admin';
import { accountantApi } from '@/api/accountant';
import {
  Download,
  FileSpreadsheet,
  FileText,
  File,
  Loader2,
  Check,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

/* ─── Типы ─── */

type ExportFormat = 'csv' | 'xlsx' | 'pdf';

interface ExportOption {
  value: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface DataOption {
  id: string;
  label: string;
  checked: boolean;
}

/* ─── Константы ─── */

const EXPORT_OPTIONS: ExportOption[] = [
  {
    value: 'csv',
    name: 'CSV',
    description: 'Таблица с разделителями, открывается в Excel',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    value: 'xlsx',
    name: 'Excel (.xlsx)',
    description: 'Формат Microsoft Excel с форматированием',
    icon: <FileSpreadsheet className="w-5 h-5" />,
  },
  {
    value: 'pdf',
    name: 'PDF',
    description: 'Документ для печати и архивации',
    icon: <File className="w-5 h-5" />,
  },
];

const DEFAULT_DATA_OPTIONS: DataOption[] = [
  { id: 'orders', label: 'Заказы', checked: true },
  { id: 'products', label: 'Товары', checked: true },
  { id: 'users', label: 'Клиенты', checked: false },
];

/* ─── Утилиты ─── */

/** Генерация CSV на клиенте */
function generateCSV(data: Record<string, unknown>[], headers: string[]): string {
  const lines = [headers.join(';')];
  for (const row of data) {
    lines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';'));
  }
  return '\uFEFF' + lines.join('\n'); // BOM для корректной кодировки
}

/** Конвертация CSV в настоящий XLSX */
function csvToXlsx(csvText: string): Blob {
  const lines = csvText.split('\n').filter(Boolean);
  const rows = lines.map((l) => l.split(';').map((c) => c.replace(/^"|"$/g, '')));
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Данные');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/** Генерация PDF из CSV через html2canvas (поддержка кириллицы) */
async function csvToPdfBlob(csvText: string, title: string): Promise<Blob> {
  const lines = csvText.split('\n').filter(Boolean);
  const rows = lines.map((l) => l.split(';').map((c) => c.replace(/^"|"$/g, '')));
  const [headers, ...dataRows] = rows;

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff;color:#000;padding:20px;font-family:Arial,sans-serif;width:1100px;';

  const h2 = document.createElement('h2');
  h2.style.margin = '0 0 12px';
  h2.style.fontSize = '18px';
  h2.textContent = title;
  container.appendChild(h2);

  const table = document.createElement('table');
  table.style.cssText = 'border-collapse:collapse;width:100%;font-size:11px;';

  const thead = document.createElement('thead');
  const headTr = document.createElement('tr');
  for (const h of headers) {
    const th = document.createElement('th');
    th.style.cssText = 'border:1px solid #ccc;padding:4px 6px;background:#f0f0f0;text-align:left;';
    th.textContent = h;
    headTr.appendChild(th);
  }
  thead.appendChild(headTr);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const row of dataRows.slice(0, 500)) {
    const tr = document.createElement('tr');
    for (const cell of row) {
      const td = document.createElement('td');
      td.style.cssText = 'border:1px solid #ddd;padding:3px 6px;';
      td.textContent = cell;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);

  if (dataRows.length > 500) {
    const p = document.createElement('p');
    p.style.cssText = 'margin:8px 0 0;color:#666;';
    p.textContent = `Показано 500 из ${dataRows.length} строк`;
    container.appendChild(p);
  }

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    const pageH = pdf.internal.pageSize.getHeight();
    let position = 0;

    while (position < pdfH) {
      pdf.addImage(imgData, 'PNG', 0, -position, pdfW, pdfH);
      position += pageH;
      if (position < pdfH) pdf.addPage();
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

/** Скачивание текстового файла */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Скачивание бинарного Blob */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Форматирование даты для period params */
function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/* ─── Компонент ─── */

export function ExportPage() {
  const { showToast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [dataOptions, setDataOptions] = useState<DataOption[]>(DEFAULT_DATA_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);

  // Период для экспорта заказов (по умолчанию — текущий месяц)
  const today = useMemo(() => new Date(), []);
  const firstDayOfMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );
  const [dateFrom, setDateFrom] = useState(toISODate(firstDayOfMonth));
  const [dateTo, setDateTo] = useState(toISODate(today));

  const handleToggleDataOption = (id: string) => {
    setDataOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, checked: !opt.checked } : opt))
    );
  };

  const handleExport = async () => {
    const selectedData = dataOptions.filter((opt) => opt.checked);
    if (selectedData.length === 0) {
      showToast('Выберите хотя бы один тип данных для экспорта', 'error');
      return;
    }

    setIsExporting(true);
    const timestamp = new Date().toISOString().slice(0, 10);

    try {
      let exportedCount = 0;

      for (const dataOption of selectedData) {
        try {
          switch (dataOption.id) {
            case 'orders': {
              const { blob, fileName } = await accountantApi.exportCsv('orders', dateFrom, dateTo);
              if (selectedFormat === 'pdf') {
                const csvText = await blob.text();
                const pdfBlob = await csvToPdfBlob(csvText, `Отчёт по заказам (${dateFrom} — ${dateTo})`);
                downloadBlob(pdfBlob, fileName.replace('.csv', '.pdf'));
              } else if (selectedFormat === 'xlsx') {
                const csvText = await blob.text();
                const xlsxBlob = csvToXlsx(csvText);
                downloadBlob(xlsxBlob, fileName.replace('.csv', '.xlsx'));
              } else {
                downloadBlob(blob, fileName);
              }
              exportedCount++;
              break;
            }

            case 'products': {
              const { blob, fileName } = await accountantApi.exportCsv('products', dateFrom, dateTo);
              if (selectedFormat === 'pdf') {
                const csvText = await blob.text();
                const pdfBlob = await csvToPdfBlob(csvText, `Отчёт по товарам (${dateFrom} — ${dateTo})`);
                downloadBlob(pdfBlob, fileName.replace('.csv', '.pdf'));
              } else if (selectedFormat === 'xlsx') {
                const csvText = await blob.text();
                const xlsxBlob = csvToXlsx(csvText);
                downloadBlob(xlsxBlob, fileName.replace('.csv', '.xlsx'));
              } else {
                downloadBlob(blob, fileName);
              }
              exportedCount++;
              break;
            }

            case 'users': {
              const response = await usersAdminApi.getUsers({ pageSize: 100 });
              const data = response.data.map((u) => ({
                id: String(u.id ?? ''),
                email: String(u.email ?? ''),
                firstName: String(u.firstName ?? ''),
                lastName: String(u.lastName ?? ''),
                role: String(u.role ?? ''),
                isActive: String(u.isActive ?? ''),
              }));
              const headers = ['id', 'email', 'firstName', 'lastName', 'role', 'isActive'];
              const filename = `users_${timestamp}`;

              if (data.length === 0) {
                showToast(`Нет данных для "${dataOption.label}"`, 'error');
                continue;
              }

              const csv = generateCSV(data, headers);
              downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
              exportedCount++;
              break;
            }
          }
        } catch {
          showToast(`Ошибка экспорта: ${dataOption.label}`, 'error');
        }
      }

      if (exportedCount > 0) {
        showToast(`Экспорт завершён: ${exportedCount} файл(ов)`, 'success');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    setSelectedFormat('csv');
    setDataOptions(DEFAULT_DATA_OPTIONS);
  };

  return (
    <div className="space-y-6 max-w-[800px]">
      {/* Заголовок */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Экспорт данных</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Выберите формат и данные для экспорта
        </p>
      </div>

      {/* Карточка выбора формата */}
      <div className="bg-surface-card border border-hairline-dark rounded-lg p-6">
        <div className="text-sm font-semibold mb-5 flex items-center gap-3 pb-4 border-b border-hairline-dark">
          <FileText className="w-[18px] h-[18px] text-gold" />
          Формат экспорта
        </div>

        <div className="flex flex-col gap-3">
          {EXPORT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-4 p-5 bg-surface-elevated border rounded-lg cursor-pointer transition-all ${
                selectedFormat === option.value
                  ? 'border-gold bg-gold/5'
                  : 'border-hairline-dark hover:border-gold'
              }`}
            >
              <div className="relative w-5 h-5 flex-shrink-0 mt-0.5">
                <input
                  type="radio"
                  name="format"
                  value={option.value}
                  checked={selectedFormat === option.value}
                  onChange={() => setSelectedFormat(option.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="absolute inset-0 bg-surface-card border border-hairline-dark rounded-full" />
                <span
                  className={`absolute top-1/2 left-1/2 w-2 h-2 bg-gold rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform ${
                    selectedFormat === option.value ? 'scale-100' : 'scale-0'
                  }`}
                />
              </div>
              <div
                className={`w-10 h-10 flex items-center justify-center bg-surface-card flex-shrink-0 rounded-lg ${
                  selectedFormat === option.value ? 'text-gold' : 'text-muted-foreground'
                }`}
              >
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium mb-1 text-foreground">{option.name}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
              {selectedFormat === option.value && (
                <Check className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Период для экспорта заказов */}
      <div className="bg-surface-card border border-hairline-dark rounded-lg p-6">
        <div className="text-sm font-semibold mb-5 flex items-center gap-3 pb-4 border-b border-hairline-dark">
          <FileSpreadsheet className="w-[18px] h-[18px] text-gold" />
          Период данных
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Дата начала
            </label>
            <input
              type="date"
              className="w-full p-3 bg-surface-elevated border border-hairline-dark rounded-lg text-foreground font-mono text-sm transition-colors focus:outline-none focus:border-gold [color-scheme:dark]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              Дата окончания
            </label>
            <input
              type="date"
              className="w-full p-3 bg-surface-elevated border border-hairline-dark rounded-lg text-foreground font-mono text-sm transition-colors focus:outline-none focus:border-gold [color-scheme:dark]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Период используется для экспорта заказов. Товары и клиенты экспортируются полностью.
        </p>
      </div>

      {/* Карточка выбора данных */}
      <div className="bg-surface-card border border-hairline-dark rounded-lg p-6">
        <div className="text-sm font-semibold mb-5 flex items-center gap-3 pb-4 border-b border-hairline-dark">
          <FileSpreadsheet className="w-[18px] h-[18px] text-gold" />
          Данные для экспорта
        </div>

        <div className="mt-6">
          {dataOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-3 py-3 border-b border-hairline-dark cursor-pointer last:border-b-0"
            >
              <div className="relative w-[18px] h-[18px]">
                <input
                  type="checkbox"
                  checked={option.checked}
                  onChange={() => handleToggleDataOption(option.id)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <span className={`absolute inset-0 border rounded transition-colors ${option.checked ? 'bg-gold/20 border-gold' : 'bg-surface-elevated border-white/20'}`} />
                {option.checked && (
                  <Check size={12} className="absolute inset-0 w-full h-full text-gold" strokeWidth={3} />
                )}
              </div>
              <span className="text-sm text-foreground">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-hairline-dark">
          <button
            className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold rounded-lg border-none cursor-pointer transition-all bg-gold text-gold-ink hover:bg-gold-active disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={() => void handleExport()}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Экспорт...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Экспортировать
              </>
            )}
          </button>
          <button
            className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold border border-hairline-dark rounded-lg cursor-pointer transition-all bg-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground"
            onClick={handleCancel}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportPage;
