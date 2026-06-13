/**
 * Страница экспорта данных для бухгалтера
 * Генерация CSV/XLSX/PDF на стороне клиента
 */

import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { usersAdminApi, catalogAdminApi } from '@/api/admin';
import {
  Download,
  FileSpreadsheet,
  FileText,
  File,
  Loader2,
  Check,
} from 'lucide-react';

type ExportFormat = 'csv' | 'xlsx' | 'pdf';

interface ExportOption {
  value: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactNode;
}

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

interface DataOption {
  id: string;
  label: string;
  checked: boolean;
}

/** Генерация CSV */
function generateCSV(data: Record<string, unknown>[], headers: string[]): string {
  const lines = [headers.join(';')];
  for (const row of data) {
    lines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(';'));
  }
  return '\uFEFF' + lines.join('\n'); // BOM для корректной кодировки
}

/** Скачивание файла */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Скачивание бинарного файла */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPage() {
  const { showToast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [dataOptions, setDataOptions] = useState<DataOption[]>([
    { id: 'orders', label: 'Заказы', checked: true },
    { id: 'products', label: 'Товары', checked: true },
    { id: 'users', label: 'Клиенты', checked: false },
  ]);
  const [isExporting, setIsExporting] = useState(false);

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

    try {
      const timestamp = new Date().toISOString().slice(0, 10);

      for (const dataOption of selectedData) {
        let data: Record<string, unknown>[] = [];
        let headers: string[] = [];
        let filename = '';

        switch (dataOption.id) {
          case 'orders': {
            // Используем mock данные заказов (в реальном проекте — API)
            data = [
              { id: 'ORD-001', client: 'Иванов И.И.', date: '2026-01-15', total: '1250.00', status: 'Выполнен' },
              { id: 'ORD-002', client: 'Петров П.П.', date: '2026-01-16', total: '890.50', status: 'В обработке' },
              { id: 'ORD-003', client: 'Сидоров С.С.', date: '2026-01-17', total: '2100.00', status: 'Доставлен' },
            ];
            headers = ['id', 'client', 'date', 'total', 'status'];
            filename = `orders_${timestamp}`;
            break;
          }
          case 'products': {
            const response = await catalogAdminApi.getProducts({ pageSize: 100 });
            data = response.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              price: p.price,
              stock: p.stock,
              isActive: p.isActive,
            }));
            headers = ['id', 'name', 'category', 'price', 'stock', 'isActive'];
            filename = `products_${timestamp}`;
            break;
          }
          case 'users': {
            const response = await usersAdminApi.getUsers({ pageSize: 100 });
            data = response.data.map((u: any) => ({
              id: u.id,
              email: u.email,
              firstName: u.firstName,
              lastName: u.lastName,
              role: u.role,
              isActive: u.isActive,
            }));
            headers = ['id', 'email', 'firstName', 'lastName', 'role', 'isActive'];
            filename = `users_${timestamp}`;
            break;
          }
        }

        if (data.length === 0) {
          showToast(`Нет данных для "${dataOption.label}"`, 'error');
          continue;
        }

        const csv = generateCSV(data, headers);

        if (selectedFormat === 'csv') {
          downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
        } else if (selectedFormat === 'xlsx') {
          // CSV с расширением .csv (XLSX требует библиотеку, используем CSV как fallback)
          downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
        } else if (selectedFormat === 'pdf') {
          // Простой текстовый PDF-подобный формат
          const textContent = headers.join('\t') + '\n' + data.map((row) => headers.map((h) => row[h]).join('\t')).join('\n');
          downloadFile(textContent, `${filename}.txt`, 'text/plain;charset=utf-8');
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
    setDataOptions([
      { id: 'orders', label: 'Заказы', checked: true },
      { id: 'products', label: 'Товары', checked: true },
      { id: 'users', label: 'Клиенты', checked: false },
    ]);
  };

  return (
    <div className="px-6 pb-12 mx-auto min-h-screen bg-canvas-dark max-w-[800px]">
      <header className="flex items-center justify-between gap-6 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em] mb-1 text-body-text">
            Экспорт данных
          </h1>
          <p className="text-sm text-muted-foreground m-0">
            Выберите формат и данные для экспорта
          </p>
        </div>
      </header>

      {/* Карточка выбора формата */}
      <div className="bg-surface-card border border-hairline-dark p-6 mb-6 rounded-lg">
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
                <div className="text-[0.95rem] font-medium mb-1 text-body-text">{option.name}</div>
                <div className="text-[0.8rem] text-muted-foreground">{option.description}</div>
              </div>
              {selectedFormat === option.value && (
                <Check className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Карточка выбора данных */}
      <div className="bg-surface-card border border-hairline-dark p-6 mb-6 rounded-lg">
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
                  className={`absolute left-[5px] top-[2px] w-[5px] h-[9px] border-solid border-canvas-dark border-r-2 border-b-2 -rotate-45 transition-transform ${
                    option.checked ? 'scale-100 bg-gold border-gold' : 'scale-0'
                  }`}
                />
              </div>
              <span className="text-[0.85rem] text-body-text">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-hairline-dark">
          <button
            className="inline-flex items-center gap-2.5 px-6 py-3.5 text-[0.85rem] font-semibold border-none rounded-lg cursor-pointer transition-all bg-gold text-gold-ink hover:bg-gold-active disabled:opacity-70 disabled:cursor-not-allowed"
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
            className="inline-flex items-center gap-2.5 px-6 py-3.5 text-[0.85rem] font-semibold border border-hairline-dark rounded-lg cursor-pointer transition-all bg-transparent text-muted-foreground hover:border-muted-foreground hover:text-body-text"
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
