/**
 * Accountant Export Page
 * Страница экспорта данных для бухгалтера
 * Основано на prototypes/accountant-export.html
 */

import { useState } from 'react';
import { useToast } from '../../hooks/useToast';

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
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    value: 'xlsx',
    name: 'Excel (.xlsx)',
    description: 'Формат Microsoft Excel с форматированием',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    value: 'pdf',
    name: 'PDF',
    description: 'Документ для печати и архивации',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 15l2 2 4-4" />
      </svg>
    ),
  },
];

interface DataOption {
  id: string;
  label: string;
  checked: boolean;
}

export function ExportPage() {
  const { showToast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [dataOptions, setDataOptions] = useState<DataOption[]>([
    { id: 'orders', label: 'Заказы', checked: true },
    { id: 'services', label: 'Оказанные услуги', checked: true },
    { id: 'returns', label: 'Возвраты', checked: false },
    { id: 'inventory', label: 'Складские остатки', checked: false },
    { id: 'clients', label: 'Клиенты', checked: false },
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

    // Имитация экспорта
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Export logic here
    // TODO: Implement actual export logic
    // const exportPayload = {
    //   format: selectedFormat,
    //   data: selectedData.map((d) => d.id),
    // };

    showToast(
      `Экспорт в формате ${selectedFormat.toUpperCase()} будет скачан: ${selectedData.map((d) => d.label).join(', ')}`,
      'success'
    );

    setIsExporting(false);
  };

  const handleCancel = () => {
    setSelectedFormat('csv');
    setDataOptions([
      { id: 'orders', label: 'Заказы', checked: true },
      { id: 'services', label: 'Оказанные услуги', checked: true },
      { id: 'returns', label: 'Возвраты', checked: false },
      { id: 'inventory', label: 'Складские остатки', checked: false },
      { id: 'clients', label: 'Клиенты', checked: false },
    ]);
  };

  return (
    <div className="px-[var(--space-md)] pb-12 mx-auto min-h-screen bg-background text-foreground max-w-[800px]">
      <header className="flex items-center justify-between gap-[var(--space-md)] mb-[var(--space-lg)] flex-wrap">
        <div>
          <h1 className="font-[var(--font-display)] text-[var(--text-3xl)] font-[var(--font-semibold)] tracking-[-0.02em] mb-1 text-foreground">
            Экспорт данных
          </h1>
          <p className="text-[var(--text-sm)] text-muted-foreground m-0">
            Выберите формат и данные для экспорта
          </p>
        </div>
      </header>

      {/* Format Selection Card */}
      <div className="bg-card border border-border p-6 mb-6">
        <div className="text-sm font-semibold mb-5 flex items-center gap-3 pb-4 border-b border-border">
          <svg
            className="w-[18px] h-[18px] text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Формат экспорта
        </div>

        <div className="flex flex-col gap-3">
          {EXPORT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-4 p-5 bg-elevated border border-border cursor-pointer transition-all duration-[var(--transition-base)] ${
                selectedFormat === option.value ? 'border-accent bg-accent/10' : 'hover:border-accent'
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
                <span className="absolute inset-0 bg-card border border-border rounded-full"></span>
                <span
                  className={`absolute top-1/2 left-1/2 w-2 h-2 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform duration-[var(--transition-base)] ${
                    selectedFormat === option.value ? 'scale-100' : 'scale-0'
                  }`}
                ></span>
              </div>
              <div
                className={`w-10 h-10 flex items-center justify-center bg-card flex-shrink-0 ${
                  selectedFormat === option.value ? 'text-accent' : 'text-muted-foreground'
                }`}
              >
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="text-[0.95rem] font-medium mb-1">{option.name}</div>
                <div className="text-[0.8rem] text-muted-foreground">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Data Selection Card */}
      <div className="bg-card border border-border p-6 mb-6">
        <div className="text-sm font-semibold mb-5 flex items-center gap-3 pb-4 border-b border-border">
          <svg
            className="w-[18px] h-[18px] text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          Данные для экспорта
        </div>

        <div className="mt-6">
          {dataOptions.map((option) => (
            <label key={option.id} className="flex items-center gap-3 py-3 border-b border-border cursor-pointer last:border-b-0">
              <div className="relative w-[18px] h-[18px]">
                <input
                  type="checkbox"
                  checked={option.checked}
                  onChange={() => handleToggleDataOption(option.id)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <span className="absolute inset-0 bg-elevated border border-border"></span>
                <span
                  className={`absolute left-[5px] top-[2px] w-[5px] h-[9px] border-solid border-background border-r-2 border-b-2 -rotate-45 transition-transform duration-[var(--transition-base)] ${
                    option.checked ? 'scale-100 bg-accent border-accent' : 'scale-0'
                  }`}
                ></span>
              </div>
              <span className="text-[0.85rem]">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-border">
          <button
            className="inline-flex items-center gap-2.5 px-6 py-3.5 font-[var(--font-sans)] text-[0.85rem] font-semibold border-none cursor-pointer transition-all duration-[var(--transition-base)] bg-accent text-background hover:bg-accent-bright disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={() => void handleExport()}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span className="w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin"></span>
                Экспорт...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Экспортировать
              </>
            )}
          </button>
          <button
            className="inline-flex items-center gap-2.5 px-6 py-3.5 font-[var(--font-sans)] text-[0.85rem] font-semibold border-none cursor-pointer transition-all duration-[var(--transition-base)] bg-transparent text-[var(--fg-muted)] border border-[var(--border)] hover:border-[var(--fg-dim)] hover:text-[var(--fg)]"
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