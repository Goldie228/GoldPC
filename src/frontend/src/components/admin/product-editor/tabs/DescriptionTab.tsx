/**
 * DescriptionTab — вкладка «Описание»
 * Markdown-редактор с панелью инструментов, предпросмотром и счётчиком символов
 */

import { useState, useCallback, useRef } from 'react';
import type { ProductEditForm } from '../types';

interface DescriptionTabProps {
  form: ProductEditForm;
  onChange: (field: string, value: string) => void;
}

const MAX_CHARS = 5000;

/** Тип кнопки панели инструментов */
type InsertType = 'bold' | 'italic' | 'bullet' | 'numbered' | 'heading';

interface ToolbarButton {
  type: InsertType;
  label: string;
  title: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { type: 'bold', label: 'B', title: 'Жирный (Ctrl+B)' },
  { type: 'italic', label: 'I', title: 'Курсив (Ctrl+I)' },
  { type: 'bullet', label: '≡', title: 'Маркированный список' },
  { type: 'numbered', label: '1.', title: 'Нумерованный список' },
  { type: 'heading', label: 'H', title: 'Заголовок (##)' },
];

/**
 * Простой парсер Markdown → HTML (без внешних библиотек).
 * Поддерживает: **жирный**, *курсив*, ## заголовки, - списки, 1. списки.
 */
function parseMarkdown(text: string): string {
  const lines = text.split('\n');

  const htmlLines = lines.map((line) => {
    // Заголовок ##
    const headingMatch = line.match(/^##\s+(.*)$/);
    if (headingMatch) {
      return `<h3 style="font-size:1.125rem;font-weight:600;color:var(--color-body-text,#eaecef);margin:1rem 0 0.5rem">${escapeHtml(headingMatch[1])}</h3>`;
    }

    // Маркированный список
    const bulletMatch = line.match(/^-\s+(.*)$/);
    if (bulletMatch) {
      return `<li style="font-size:0.875rem;color:var(--color-body-text,#eaecef);margin-left:1rem;list-style-type:disc">${escapeHtml(bulletMatch[1])}</li>`;
    }

    // Нумерованный список
    const numberedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (numberedMatch) {
      return `<li style="font-size:0.875rem;color:var(--color-body-text,#eaecef);margin-left:1rem;list-style-type:decimal">${escapeHtml(numberedMatch[1])}</li>`;
    }

    // Жирный **text**
    let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600">$1</strong>');

    // Курсив *text*
    processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');

    return escapeHtml(processed);
  });

  return htmlLines.join('<br/>');
}

/** Экранирование HTML-спецсимволов */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Вставляет Markdown-разметку в текст, учитывая выделение.
 */
function insertIntoText(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  type: InsertType,
): { text: string; cursorPos: number } {
  const before = text.substring(0, selectionStart);
  const selected = text.substring(selectionStart, selectionEnd);
  const after = text.substring(selectionEnd);

  let replacement: string;
  let cursorOffset: number;

  switch (type) {
    case 'bold':
      replacement = `**${selected || 'text'}**`;
      cursorOffset = replacement.length - (selected ? 4 : 2);
      break;
    case 'italic':
      replacement = `*${selected || 'text'}*`;
      cursorOffset = replacement.length - (selected ? 2 : 1);
      break;
    case 'bullet':
      replacement = `- ${selected || 'item'}`;
      cursorOffset = replacement.length;
      break;
    case 'numbered':
      replacement = `1. ${selected || 'item'}`;
      cursorOffset = replacement.length;
      break;
    case 'heading':
      replacement = `## ${selected || 'text'}`;
      cursorOffset = replacement.length;
      break;
    default:
      replacement = '';
      cursorOffset = 0;
  }

  const newText = before + replacement + after;
  const cursorPos = selectionStart + (selected ? replacement.length : replacement.length - cursorOffset);

  return { text: newText, cursorPos };
}

export function DescriptionTab({ form, onChange }: DescriptionTabProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const handleInsert = useCallback(
    (type: InsertType) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { text, cursorPos } = insertIntoText(
        form.description,
        textarea.selectionStart,
        textarea.selectionEnd,
        type,
      );

      onChange('description', text);

      // Восстанавливаем фокус и курсор
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [form.description, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        handleInsert('bold');
      } else if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        handleInsert('italic');
      }
    },
    [handleInsert],
  );

  const charCount = form.description.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="pe-description" className="text-sm font-medium text-muted-foreground">
        Описание
      </label>

      {/* Переключатель Edit/Preview */}
      <div className="flex items-center gap-1 border-b border-hairline-dark">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors cursor-pointer ${
            mode === 'edit'
              ? 'text-gold border-b-2 border-gold bg-surface-card'
              : 'text-muted-foreground hover:text-body-text border-b-2 border-transparent'
          }`}
        >
          Редактировать
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors cursor-pointer ${
            mode === 'preview'
              ? 'text-gold border-b-2 border-gold bg-surface-card'
              : 'text-muted-foreground hover:text-body-text border-b-2 border-transparent'
          }`}
        >
          Предпросмотр
        </button>
      </div>

      {/* Режим редактирования */}
      {mode === 'edit' && (
        <>
          {/* Панель инструментов */}
          <div className="flex items-center gap-1 px-2 py-1.5 bg-surface-card border border-hairline-dark rounded-t-md border-b-0">
            {TOOLBAR_BUTTONS.map((btn) => (
              <button
                key={btn.type}
                type="button"
                title={btn.title}
                onClick={() => handleInsert(btn.type)}
                className="w-8 h-7 flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-body-text hover:bg-surface-elevated rounded transition-colors cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id="pe-description"
            rows={10}
            className="bg-surface-card border border-hairline-dark rounded-b-md px-3 py-2 text-sm text-body-text placeholder:text-muted-foreground focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors resize-y min-h-[200px]"
            placeholder="Полное описание товара... (поддерживает Markdown)"
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </>
      )}

      {/* Режим предпросмотра */}
      {mode === 'preview' && (
        <div className="bg-surface-card border border-hairline-dark rounded-md px-4 py-3 min-h-[200px]">
          {form.description.trim() ? (
            <div
              className="text-sm text-body-text leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(form.description),
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">Нет описания</p>
          )}
        </div>
      )}

      {/* Счётчик символов */}
      <div className="flex justify-end">
        <span
          className={`text-xs ${isOverLimit ? 'text-price-rise' : 'text-muted-foreground'}`}
        >
          {charCount.toLocaleString('ru-RU')} / {MAX_CHARS.toLocaleString('ru-RU')}
        </span>
      </div>
    </div>
  );
}
