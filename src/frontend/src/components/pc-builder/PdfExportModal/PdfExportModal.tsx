/**
 * PdfExportModal — генерация и скачивание PDF-файла конфигурации сборки.
 *
 * При открытии модалки автоматически генерирует PDF и предлагает скачать.
 * Без промежуточных форм — один клик «Сохранить» = скачивание.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Modal } from '../../ui/Modal/Modal';
import { Button } from '../../ui/Button';
import type { PCBuilderSelectedState } from '../../../hooks';
import { PC_BUILDER_SLOTS } from '../../../hooks';
import {
  calculatePerformance,
  getPerformanceLabel,
} from '../../../utils/performanceCalculator';
import { Download, FileText, CheckCircle, AlertTriangle, Zap, BarChart3 } from 'lucide-react';
import styles from './PdfExportModal.module.css';

// Cyrillic-compatible font configuration for jsPDF
const CYRILLIC_FONT = 'Roboto';
const FONT_BASE_URL = import.meta.env.BASE_URL;

/**
 * Loads Roboto Cyrillic fonts into jsPDF's virtual file system.
 * Must be called before generating PDFs with Cyrillic text.
 */
async function loadCyrillicFonts(): Promise<void> {
  // Check if fonts are already loaded
  if (jsPDF.API.getFont(CYRILLIC_FONT, 'normal')) return;

  const [regularRes, boldRes] = await Promise.all([
    fetch(`${FONT_BASE_URL}Roboto-Regular.ttf`),
    fetch(`${FONT_BASE_URL}Roboto-Bold.ttf`),
  ]);

  if (!regularRes.ok || !boldRes.ok) {
    throw new Error('Failed to load Cyrillic fonts for PDF export');
  }

  const regularBytes = new Uint8Array(await regularRes.arrayBuffer());
  const boldBytes = new Uint8Array(await boldRes.arrayBuffer());

  // Add fonts to jsPDF VFS and register them
  const pdf = new jsPDF();
  pdf.addFileToVFS('Roboto-Regular.ttf', regularBytes);
  pdf.addFileToVFS('Roboto-Bold.ttf', boldBytes);
  pdf.addFont('Roboto-Regular.ttf', CYRILLIC_FONT, 'normal');
  pdf.addFont('Roboto-Bold.ttf', CYRILLIC_FONT, 'bold');
}

export interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComponents: PCBuilderSelectedState;
  totalPrice: number;
  powerConsumption: number;
  recommendedPsu?: number;
  isCompatible: boolean;
  compatibilityErrors: string[];
  compatibilityWarnings: string[];
}

/** Internal performance computation for use inside the modal. */
function computePerformance(s: PCBuilderSelectedState) {
  const cpu = s.cpu?.product ?? null;
  const gpu = s.gpu?.product ?? null;
  const ram = s.ram[0]?.product ?? null;
  return calculatePerformance(cpu, gpu, ram);
}

type ComponentRow = { category: string; name: string; price: string };

function getComponentRows(s: PCBuilderSelectedState): ComponentRow[] {
  const rows: ComponentRow[] = [];
  const fmt = (price: number) => `${price.toLocaleString('ru-BY')} BYN`;
  for (const slot of PC_BUILDER_SLOTS) {
    if (slot.key === 'ram') {
      if (s.ram.length === 0) {
        rows.push({ category: slot.label, name: '—', price: '—' });
      } else {
        s.ram.forEach((r, i) => {
          rows.push({
            category: s.ram.length > 1 ? `ОЗУ (${i + 1})` : slot.label,
            name: r.product.name,
            price: fmt(r.product.price),
          });
        });
      }
      continue;
    }
    if (slot.key === 'storage') {
      if (s.storage.length === 0) {
        rows.push({ category: slot.label, name: '—', price: '—' });
      } else {
        s.storage.forEach((st, i) => {
          rows.push({
            category: s.storage.length > 1 ? `Накопитель (${i + 1})` : slot.label,
            name: st.product.name,
            price: fmt(st.product.price),
          });
        });
      }
      continue;
    }
    if (slot.key === 'fan') {
      const fans = (s as any).fan;
      if (!fans || fans.length === 0) {
        rows.push({ category: slot.label, name: '—', price: '—' });
      } else {
        fans.forEach((f: any, i: number) => {
          rows.push({
            category: fans.length > 1 ? `Вентилятор (${i + 1})` : slot.label,
            name: f.product.name,
            price: fmt(f.product.price),
          });
        });
      }
      continue;
    }
    const comp = (s as Record<string, any>)[slot.key];
    if (comp?.product) {
      rows.push({
        category: slot.label,
        name: comp.product.name,
        price: fmt(comp.product.price),
      });
    } else {
      rows.push({ category: slot.label, name: '—', price: '—' });
    }
  }
  return rows;
}

function generateAutoname(s: PCBuilderSelectedState): string {
  const parts: string[] = [];
  if (s.cpu?.product) {
    const cpuName = s.cpu.product.name;
    const m = cpuName.match(/(?<=\b)(Ryzen\s+\d+\s+\w+|Core\s+i\d\s+\w+|\b\w+\b.*)/i);
    parts.push(m ? m[0] : cpuName.split(' ').slice(0, 3).join(' '));
  }
  if (s.gpu?.product) {
    const gpuName = s.gpu.product.name;
    const m = gpuName.match(/(RTX\s+\d+\s*\w*|GTX\s+\d+\s*\w*|RX\s+\d+\s*\w*)/i);
    parts.push(m ? m[0] : gpuName.split(' ').slice(0, 3).join(' '));
  }
  if (parts.length > 0) return `GoldPC — ${parts.join(' + ')}`;
  const now = new Date();
  return `GoldPC — Сборка от ${now.toLocaleDateString('ru-BY')}`;
}

function generatePdf(props: PdfExportModalProps): Blob {
  const {
    selectedComponents, totalPrice, powerConsumption, recommendedPsu,
    isCompatible, compatibilityErrors, compatibilityWarnings,
  } = props;
  const performance = computePerformance(selectedComponents);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont(CYRILLIC_FONT, 'normal');
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const accent = [212, 165, 116]; // #d4a574
  const dark = [24, 24, 27]; // #18181b
  const text = [250, 250, 250]; // #fafafa
  const muted = [113, 113, 122]; // #71717a
  const red = [239, 68, 68]; // #ef4444
  const yellow = [234, 179, 8]; // #eab308
  let y = 0;

  // === Header ===
  doc.setFillColor(...dark);
  doc.rect(0, 0, pageW, 48, 'F');
  doc.setFillColor(...accent);
  doc.rect(0, 48, pageW, 1.2, 'F');

  doc.setTextColor(...accent);
  doc.setFontSize(22);
  doc.setFont(CYRILLIC_FONT, "bold");
  doc.text('GOLDPC', margin, 20);

  doc.setFontSize(11);
  doc.setFont(CYRILLIC_FONT, "normal");
  doc.setTextColor(...muted);
  const autoName = generateAutoname(selectedComponents);
  doc.text(autoName, margin, 30);

  const now = new Date();
  doc.setFontSize(8);
  doc.text(`Экспорт конфигурации — ${now.toLocaleDateString('ru-BY', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, 38);

  y = 56;

  // === Compatibility Status ===
  doc.setFontSize(13);
  doc.setFont(CYRILLIC_FONT, "bold");
  doc.setTextColor(...text);
  doc.text('Совместимость', margin, y);
  y += 6;

  if (isCompatible) {
    doc.setFillColor(...accent);
    doc.roundedRect(margin, y - 4, 8, 8, 2, 2, 'F');
    doc.setTextColor(...accent);
    doc.setFontSize(10);
    doc.setFont(CYRILLIC_FONT, "bold");
    doc.text('  Все компоненты совместимы', margin + 10, y + 1);
  } else {
    doc.setFillColor(...red);
    doc.roundedRect(margin, y - 4, 8, 8, 2, 2, 'F');
    doc.setTextColor(...red);
    doc.setFontSize(10);
    doc.setFont(CYRILLIC_FONT, "bold");
    doc.text(`  Ошибки: ${compatibilityErrors.length}`, margin + 10, y + 1);
  }
  y += 12;

  if (compatibilityErrors.length > 0) {
    doc.setFontSize(8.5);
    doc.setTextColor(...red);
    doc.setFont(CYRILLIC_FONT, "normal");
    compatibilityErrors.forEach((err) => {
      doc.text(`— ${err}`, margin + 4, y);
      y += 4.5;
    });
    y += 2;
  }
  if (compatibilityWarnings.length > 0) {
    doc.setFontSize(8.5);
    doc.setTextColor(...yellow);
    compatibilityWarnings.forEach((w) => {
      doc.text(`! ${w}`, margin + 4, y);
      y += 4.5;
    });
    y += 2;
  }
  y += 4;

  // === Component Table ===
  const rows = getComponentRows(selectedComponents);
  doc.setFontSize(13);
  doc.setFont(CYRILLIC_FONT, "bold");
  doc.setTextColor(...text);
  doc.text('Компоненты', margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Категория', 'Компонент', 'Цена']],
    body: rows.map((r) => [r.category, r.name, r.price]),
    theme: 'grid',
    headStyles: {
      fillColor: dark as [number, number, number],
      textColor: accent as [number, number, number],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: text as [number, number, number],
      cellPadding: 3.5,
      lineColor: [60, 60, 66] as [number, number, number],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [20, 20, 23] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'normal', textColor: muted as [number, number, number] },
      1: { cellWidth: contentW - 80 },
      2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  // === Power & Performance Side by Side ===
  const sectionW = (contentW - 10) / 2;

  // Power Section
  doc.setFillColor(20, 20, 23);
  doc.roundedRect(margin, y, sectionW, 36, 3, 3, 'F');
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, sectionW, 36, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setFont(CYRILLIC_FONT, "bold");
  doc.setTextColor(...accent);
  doc.text('Затраты электричества', margin + 6, y + 9);

  doc.setFontSize(8);
  doc.setFont(CYRILLIC_FONT, "normal");
  doc.setTextColor(...text);
  doc.text(`Потребление: ~${Math.round(powerConsumption)} Вт`, margin + 6, y + 17);
  doc.text(`Рекомендуемый БП: ${recommendedPsu ?? Math.ceil(powerConsumption * 1.3)} Вт`, margin + 6, y + 25);

  // Performance Section
  const perfX = margin + sectionW + 10;
  doc.setFillColor(20, 20, 23);
  doc.roundedRect(perfX, y, sectionW, 36, 3, 3, 'F');
  doc.setDrawColor(...accent);
  doc.roundedRect(perfX, y, sectionW, 36, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setFont(CYRILLIC_FONT, "bold");
  doc.setTextColor(...accent);
  doc.text('Производительность', perfX + 6, y + 9);

  doc.setFontSize(8);
  doc.setFont(CYRILLIC_FONT, "normal");
  doc.setTextColor(...text);
  doc.text(`Игры: ${performance.gamingScore}/100`, perfX + 6, y + 17);
  doc.text(`Работа: ${performance.workstationScore}/100`, perfX + 6, y + 25);

  y += 44;

  // FPS estimates
  if (performance.estimatedFps.fps1080p > 0) {
    doc.setFontSize(11);
    doc.setFont(CYRILLIC_FONT, "bold");
    doc.setTextColor(...text);
    doc.text('Оценка FPS', margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [['Разрешение', 'Оценка FPS']],
      body: [
        ['1920×1080', `${performance.estimatedFps.fps1080p} FPS`],
        ['2560×1440', `${performance.estimatedFps.fps1440p} FPS`],
        ['3840×2160', `${performance.estimatedFps.fps4k} FPS`],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: dark as [number, number, number],
        textColor: accent as [number, number, number],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: text as [number, number, number],
        cellPadding: 4,
        lineColor: [60, 60, 66] as [number, number, number],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // === Total Price ===
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(...dark);
  doc.roundedRect(margin, y, contentW, 22, 3, 3, 'F');
  doc.setDrawColor(...accent);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, contentW, 22, 3, 3, 'S');

  doc.setFontSize(11);
  doc.setFont(CYRILLIC_FONT, "normal");
  doc.setTextColor(...text);
  doc.text('Итого:', margin + 8, y + 14);

  doc.setFontSize(16);
  doc.setTextColor(...accent);
  doc.setFont(CYRILLIC_FONT, "bold");
  doc.text(`${totalPrice.toLocaleString('ru-BY')} BYN`, pageW - margin - 8, y + 14, { align: 'right' });

  // === Footer ===
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setFontSize(7);
  doc.setFont(CYRILLIC_FONT, "normal");
  doc.setTextColor(...muted);
  doc.text('GoldPC — Конструктор ПК  |  goldpc.by', margin, footerY);
  doc.text(`Сгенерировано ${now.toLocaleString('ru-BY')}`, pageW - margin, footerY, { align: 'right' });

  return doc.output('blob');
}

export function PdfExportModal({
  isOpen, onClose, selectedComponents, totalPrice, powerConsumption,
  recommendedPsu, isCompatible, compatibilityErrors, compatibilityWarnings,
}: PdfExportModalProps) {
  const perf = computePerformance(selectedComponents);
  const generatedBlobRef = useRef<Blob | null>(null);
  const generatedUrlRef = useRef<string | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Load Cyrillic fonts on mount
  useEffect(() => {
    loadCyrillicFonts().then(() => setFontsLoaded(true)).catch(console.error);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (generatedUrlRef.current) {
      URL.revokeObjectURL(generatedUrlRef.current);
    }
    // Ensure fonts are loaded before generating PDF
    if (!fontsLoaded) {
      await loadCyrillicFonts();
    }
    const blob = generatePdf({
      selectedComponents, totalPrice, powerConsumption, recommendedPsu,
      isCompatible, compatibilityErrors, compatibilityWarnings,
    });
    generatedBlobRef.current = blob;
    generatedUrlRef.current = URL.createObjectURL(blob);
  }, [selectedComponents, totalPrice, powerConsumption, recommendedPsu,
    isCompatible, compatibilityErrors, compatibilityWarnings, fontsLoaded]);

  const handleDownload = useCallback(() => {
    const url = generatedUrlRef.current;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    const buildName = generateAutoname(selectedComponents);
    a.download = `${buildName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onClose();
  }, [onClose, selectedComponents]);

  // Auto-generate on open
  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen, handleGenerate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (generatedUrlRef.current) URL.revokeObjectURL(generatedUrlRef.current);
    };
  }, []);

  const buildName = generateAutoname(selectedComponents);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Экспорт сборки в PDF"
      size="medium"
    >
      <div className={styles.container}>
        <div className={styles.preview}>
          <FileText size={48} strokeWidth={1.5} className={styles.previewIcon} />
          <p className={styles.fileName}>{buildName}.pdf</p>
          <p className={styles.fileInfo}>
            Готовый PDF-файл с конфигурацией вашей сборки
          </p>
        </div>

        <div className={styles.checklist}>
          <div className={styles.checkItem}>
            <CheckCircle size={16} color="#d4a574" />
            <span>Список всех компонентов ({Object.values(selectedComponents).flat().filter(Boolean).length || selectedComponents.cpu ? '✓' : '—'})</span>
          </div>
          <div className={styles.checkItem}>
            <CheckCircle size={16} color="#d4a574" />
            <span>Цена компонентов: {totalPrice.toLocaleString('ru-BY')} BYN</span>
          </div>
          <div className={styles.checkItem}>
            {isCompatible
              ? <CheckCircle size={16} color="#d4a574" />
              : <AlertTriangle size={16} color="#eab308" />
            }
            <span>Совместимость: {isCompatible ? 'Все совместимо' : `Ошибки: ${compatibilityErrors.length}`}</span>
          </div>
          <div className={styles.checkItem}>
            <Zap size={16} color="#d4a574" />
            <span>Энергопотребление: ~{Math.round(powerConsumption)} Вт</span>
          </div>
          <div className={styles.checkItem}>
            <BarChart3 size={16} color="#d4a574" />
            <span>Игровой рейтинг: {perf.gamingScore}/100</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={!generatedBlobRef.current}
            icon={<Download size={16} />}
          >
            Скачать PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PdfExportModal;
