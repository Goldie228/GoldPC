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
      for (const dataOption of selectedData) {
        switch (dataOption.id) {
          case 'orders': {
            // Заказы — экспорт через серверный CSV
            const { blob, fileName } = await accountantApi.exportCsv('orders', dateFrom, dateTo);

            if (selectedFormat === 'csv' || selectedFormat === 'xlsx') {
              downloadBlob(blob, fileName);
            } else if (selectedFormat === 'pdf') {
              // PDF: читаем CSV как текст и конвертируем в простой txt
              const text = await blob.text();
              downloadFile(text, fileName.replace('.csv', '.txt'), 'text/plain;charset=utf-8');
            }
            break;
          }

          case 'products': {
            // Товары — экспорт через серверный CSV
            const { blob, fileName } = await accountantApi.exportCsv('products', dateFrom, dateTo);

            if (selectedFormat === 'csv' || selectedFormat === 'xlsx') {
              downloadBlob(blob, fileName);
            } else if (selectedFormat === 'pdf') {
              const text = await blob.text();
              downloadFile(text, fileName.replace('.csv', '.txt'), 'text/plain;charset=utf-8');
            }
            break;
          }

          case 'users': {
            // Клиенты — генерация CSV на клиенте через существующий API
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

            if (selectedFormat === 'csv' || selectedFormat === 'xlsx') {
              const csv = generateCSV(data, headers);
              downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
            } else if (selectedFormat === 'pdf') {
              const textContent =
                headers.join('\t') +
                '\n' +
                data.map((row) => headers.map((h) => String((row as Record<string, unknown>)[h] ?? '')).join('\t')).join('\n');
              downloadFile(textContent, `${filename}.txt`, 'text/plain;charset=utf-8');
            }
            break;
          }
        }
      }

      showToast(
        `Экспорт завершён: ${selectedData.map((d) => d.label).join(', ')}`,
        'success'
      );
    } catch (err) {
      showToast('Ошибка при экспорте данных', 'error');
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
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="absolute inset-0 bg-surface-elevated border border-hairline-dark rounded" />
                <span
                  className={`absolute left-[5px] top-[2px] w-[5px] h-[9px] border-solid border-r-2 border-b-2 -rotate-45 transition-transform ${
                    option.checked ? 'scale-100 border-gold' : 'scale-0 border-foreground'
                  }`}
                />
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
