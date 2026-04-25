/**
 * Accountant Export Page
 * Страница экспорта данных для бухгалтера
 * Основано на prototypes/accountant-export.html
 */

import { useState } from 'react';
import styles from './ExportPage.module.css';

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
      alert('Выберите хотя бы один тип данных для экспорта');
      return;
    }

    setIsExporting(true);

    // Имитация экспорта
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // В реальном приложении здесь будет запрос к API
    console.log('Exporting:', {
      format: selectedFormat,
      data: selectedData.map((d) => d.id),
    });

    alert(
      `Экспорт в формате ${selectedFormat.toUpperCase()} будет скачан.\n` +
        `Выбранные данные: ${selectedData.map((d) => d.label).join(', ')}`
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
    <div className="staff-page export-page">
      <header className="staff-page__header export-page__header">
        <div className="export-page__title-section">
          <h1 className="staff-page__title export-page__title">Экспорт данных</h1>
          <p className="staff-page__subtitle export-page__subtitle">
            Выберите формат и данные для экспорта
          </p>
        </div>
      </header>

      {/* Format Selection Card */}
      <div className="export-card">
        <div className="export-card__title">
          <svg
            className="export-card__icon"
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

        <div className="export-options">
          {EXPORT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`export-option ${
                selectedFormat === option.value ? 'export-option--selected' : ''
              }`}
            >
              <div className="export-option__radio">
                <input
                  type="radio"
                  name="format"
                  value={option.value}
                  checked={selectedFormat === option.value}
                  onChange={() => setSelectedFormat(option.value)}
                />
                <span className="radio-mark"></span>
              </div>
              <div
                className={`export-option__icon ${
                  selectedFormat === option.value ? 'export-option__icon--active' : ''
                }`}
              >
                {option.icon}
              </div>
              <div className="export-option__info">
                <div className="export-option__name">{option.name}</div>
                <div className="export-option__desc">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Data Selection Card */}
      <div className="export-card">
        <div className="export-card__title">
          <svg
            className="export-card__icon"
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

        <div className="checkbox-group">
          {dataOptions.map((option) => (
            <label key={option.id} className="checkbox-item">
              <div className="checkbox">
                <input
                  type="checkbox"
                  checked={option.checked}
                  onChange={() => handleToggleDataOption(option.id)}
                />
                <span className="checkbox-mark"></span>
              </div>
              <span className="checkbox-label">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="form-actions">
          <button
            className="btn btn--primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span className="loading-spinner"></span>
                Экспорт...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Экспортировать
              </>
            )}
          </button>
          <button className="btn btn--ghost" onClick={handleCancel}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportPage;