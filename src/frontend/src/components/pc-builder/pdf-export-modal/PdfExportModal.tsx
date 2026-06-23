/**
 * PdfExportModal — генерация и скачивание PDF-файла конфигурации сборки.
 *
 * Использует html2canvas для рендера стилизованного HTML в canvas,
 * затем jsPDF для конвертации в PDF. Поддержка кириллицы и картинок товаров.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button';
import type { PCBuilderSelectedState, SelectedComponent } from '@/hooks';
import { PC_BUILDER_SLOTS } from '@/hooks';
import {
  calculatePerformance,
  getPerformanceLabel,
} from '@/features/pc-builder/logic/performance';
import { Download, FileText, CheckCircle, AlertTriangle, Zap, BarChart3, Loader2 } from 'lucide-react';
import './pdf-render.css';

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

function computePerformance(s: PCBuilderSelectedState) {
  const cpu = s.cpu?.product ?? null;
  const gpu = s.gpu?.product ?? null;
  const ram = s.ram[0]?.product ?? null;
  return calculatePerformance(cpu, gpu, ram);
}

function generateAutoname(s: PCBuilderSelectedState): string {
  const parts: string[] = [];
  if (s.cpu?.product) {
    const cpuName = s.cpu.product.name;
    const m = cpuName.match(/\b(Ryzen\s+\d+\s+\w+|Core\s+i\d\s+\w+)/i);
    parts.push(m ? m[0] : cpuName.split(' ').slice(0, 3).join(' '));
  }
  if (s.gpu?.product) {
    const gpuName = s.gpu.product.name;
    const m = gpuName.match(/(RTX\s+\d+\s*\w*|GTX\s+\d+\s*\w*|RX\s+\d+\s*\w*)/i);
    parts.push(m ? m[0] : gpuName.split(' ').slice(0, 3).join(' '));
  }
  if (parts.length > 0) return "GoldPC — " + parts.join(' + ');
  return "GoldPC — Сборка от " + new Date().toLocaleDateString('ru-BY');
}

function getImageUrl(product: { mainImage?: { url: string }; images?: Array<{ url: string }> }): string {
  const url = product.mainImage?.url ?? product.images?.[0]?.url;
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return "/api/v1" + (url.startsWith('/') ? '' : '/') + url;
}

type ComponentRow = {
  category: string;
  name: string;
  price: string;
  imageUrl: string;
};

function getComponentRows(s: PCBuilderSelectedState): ComponentRow[] {
  const rows: ComponentRow[] = [];
  const fmt = (price: number) => price.toLocaleString('ru-BY') + " BYN";

  for (const slot of PC_BUILDER_SLOTS) {
    if (slot.key === 'ram') {
      if (s.ram.length === 0) {
        rows.push({ category: slot.label, name: '—', price: '—', imageUrl: '' });
      } else {
        s.ram.forEach((r, i) => {
          rows.push({
            category: s.ram.length > 1 ? "ОЗУ (" + (i + 1) + ")" : slot.label,
            name: r.product.name,
            price: fmt(r.product.price),
            imageUrl: getImageUrl(r.product),
          });
        });
      }
      continue;
    }
    if (slot.key === 'storage') {
      if (s.storage.length === 0) {
        rows.push({ category: slot.label, name: '—', price: '—', imageUrl: '' });
      } else {
        s.storage.forEach((st, i) => {
          rows.push({
            category: s.storage.length > 1 ? "Накопитель (" + (i + 1) + ")" : slot.label,
            name: st.product.name,
            price: fmt(st.product.price),
            imageUrl: getImageUrl(st.product),
          });
        });
      }
      continue;
    }
    if (slot.key === 'fan') {
      const fans = s.fan;
      if (!fans || fans.length === 0) {
        rows.push({ category: slot.label, name: '—', price: '—', imageUrl: '' });
      } else {
        fans.forEach((f: SelectedComponent, i: number) => {
          rows.push({
            category: fans.length > 1 ? "Вентилятор (" + (i + 1) + ")" : slot.label,
            name: f.product.name,
            price: fmt(f.product.price),
            imageUrl: getImageUrl(f.product),
          });
        });
      }
      continue;
    }
    const comp = (s as unknown as Record<string, SelectedComponent | undefined>)[slot.key];
    if (comp?.product) {
      rows.push({
        category: slot.label,
        name: comp.product.name,
        price: fmt(comp.product.price),
        imageUrl: getImageUrl(comp.product),
      });
    } else {
      rows.push({ category: slot.label, name: '—', price: '—', imageUrl: '' });
    }
  }
  return rows;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildRenderHtml(props: PdfExportModalProps): string {
  const { selectedComponents, totalPrice, powerConsumption, recommendedPsu, isCompatible, compatibilityErrors, compatibilityWarnings } = props;
  const performance = computePerformance(selectedComponents);
  const autoName = generateAutoname(selectedComponents);
  const now = new Date();
  const rows = getComponentRows(selectedComponents);

  const componentRowsHtml = rows.map(r => {
    const imgCell = r.imageUrl
      ? '<td class="comp-img"><img src="' + r.imageUrl + '" crossorigin="anonymous" /></td>'
      : '<td class="comp-img"><div class="no-img">📦</div></td>';
    return '<tr>' + imgCell +
      '<td class="comp-cat">' + escapeHtml(r.category) + '</td>' +
      '<td class="comp-name">' + escapeHtml(r.name) + '</td>' +
      '<td class="comp-price">' + escapeHtml(r.price) + '</td></tr>';
  }).join('');

  const errorsHtml = compatibilityErrors.length > 0
    ? '<div class="errors-block">' + compatibilityErrors.map(e => '<div class="error-item">✕ ' + escapeHtml(e) + '</div>').join('') + '</div>'
    : '';

  const warningsHtml = compatibilityWarnings.length > 0
    ? '<div class="warnings-block">' + compatibilityWarnings.map(w => '<div class="warning-item">⚠ ' + escapeHtml(w) + '</div>').join('') + '</div>'
    : '';

  const statsHtml = performance.estimatedFps.fps1080p > 0
    ? '<div class="stat-card"><div class="stat-label">Оценка FPS</div><div class="stat-value">' + performance.estimatedFps.fps1080p + '<span class="stat-unit"> FPS</span></div><div class="stat-sub">1080p</div></div>'
    : '';

  return '<div class="pdf-page">' +
    '<div class="header">' +
      '<div><div class="logo">GOLDPC</div><div class="subtitle">Конструктор ПК</div></div>' +
      '<div style="text-align:right"><div class="build-name">' + escapeHtml(autoName) + '</div><div class="date">' + now.toLocaleDateString('ru-BY', { day: 'numeric', month: 'long', year: 'numeric' }) + '</div></div>' +
    '</div>' +
    '<div class="status-row">' +
      '<div class="status-badge ' + (isCompatible ? 'ok' : 'err') + '">' +
        (isCompatible ? '✓ Все компоненты совместимы' : '✕ Ошибки совместимости: ' + compatibilityErrors.length) +
      '</div>' +
      '<div class="stat-line">Энергопотребление: ~' + Math.round(powerConsumption) + ' Вт | Рек. БП: ' + (recommendedPsu ?? Math.ceil(powerConsumption * 1.3)) + ' Вт</div>' +
    '</div>' +
    errorsHtml + warningsHtml +
    '<div class="section-title">Компоненты</div>' +
    '<table class="comp-table"><thead><tr>' +
      '<th style="width:56px"></th>' +
      '<th style="width:100px;text-align:left">Категория</th>' +
      '<th style="text-align:left">Компонент</th>' +
      '<th style="width:100px;text-align:right">Цена</th>' +
    '</tr></thead><tbody>' + componentRowsHtml + '</tbody></table>' +
    '<div class="stats-row">' +
      '<div class="stat-card"><div class="stat-label">Производительность</div><div class="stat-value">' + performance.gamingScore + '<span class="stat-unit">/100</span></div><div class="stat-sub">Игры: ' + getPerformanceLabel(performance.gamingScore) + '</div></div>' +
      '<div class="stat-card"><div class="stat-label">Энергопотребление</div><div class="stat-value">~' + Math.round(powerConsumption) + '<span class="stat-unit"> Вт</span></div><div class="stat-sub">Рек. БП: ' + (recommendedPsu ?? Math.ceil(powerConsumption * 1.3)) + ' Вт</div></div>' +
      statsHtml +
    '</div>' +
    '<div class="total-row"><span class="total-label">Итого:</span><span class="total-price">' + totalPrice.toLocaleString('ru-BY') + ' BYN</span></div>' +
    '<div class="footer"><span>GoldPC — Конструктор ПК</span><span>Сгенерировано ' + now.toLocaleString('ru-BY') + '</span></div>' +
  '</div>';
}

async function generatePdf(props: PdfExportModalProps): Promise<Blob> {
  const html = buildRenderHtml(props);

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
  container.innerHTML = html;
  document.body.appendChild(container);

  const el = container.querySelector('.pdf-page') as HTMLElement;

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0f0f12',
      width: 794,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * pageW) / canvas.width;

    if (imgH <= pageH) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
    } else {
      const sliceH = pageH;
      const totalSlices = Math.ceil(imgH / sliceH);
      for (let i = 0; i < totalSlices; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -i * sliceH, imgW, imgH);
      }
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

export function PdfExportModal({
  isOpen, onClose, selectedComponents, totalPrice, powerConsumption,
  recommendedPsu, isCompatible, compatibilityErrors, compatibilityWarnings,
}: PdfExportModalProps) {
  const perf = computePerformance(selectedComponents);
  const [generating, setGenerating] = useState(false);
  const generatedBlobRef = useRef<Blob | null>(null);
  const generatedUrlRef = useRef<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      if (generatedUrlRef.current) URL.revokeObjectURL(generatedUrlRef.current);

      const blob = await generatePdf({
        isOpen: true,
        onClose: () => {},
        selectedComponents,
        totalPrice,
        powerConsumption,
        recommendedPsu,
        isCompatible,
        compatibilityErrors,
        compatibilityWarnings,
      });
      generatedBlobRef.current = blob;
      generatedUrlRef.current = URL.createObjectURL(blob);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [selectedComponents, totalPrice, powerConsumption, recommendedPsu,
    isCompatible, compatibilityErrors, compatibilityWarnings]);

  const handleDownload = useCallback(() => {
    const url = generatedUrlRef.current;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    const buildName = generateAutoname(selectedComponents);
    a.download = buildName + ".pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onClose();
  }, [onClose, selectedComponents]);

  useEffect(() => {
    if (isOpen) handleGenerate();
  }, [isOpen, handleGenerate]);

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
      <div className="flex flex-col gap-5 py-2">
        <div className="flex flex-col items-center gap-2 p-6 bg-gold/15 border border-dashed border-gold/15 rounded-lg">
          {generating ? (
            <Loader2 size={48} strokeWidth={1.5} className="text-gold opacity-90 animate-spin" />
          ) : (
            <FileText size={48} strokeWidth={1.5} className="text-gold opacity-90" />
          )}
          <p className="text-xs font-semibold text-body-text m-0">{buildName}.pdf</p>
          <p className="text-xs text-muted-foreground m-0 text-center">
            {generating ? 'Генерация PDF-файла...' : 'Готовый PDF-файл с конфигурацией вашей сборки'}
          </p>
        </div>

        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center gap-2.5 text-xs text-body-text">
            <CheckCircle size={16} color="var(--color-gold-300)" />
            <span>Список всех компонентов с изображениями</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-body-text">
            <CheckCircle size={16} color="var(--color-gold-300)" />
            <span>Цена компонентов: {totalPrice.toLocaleString('ru-BY')} BYN</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-body-text">
            {isCompatible
              ? <CheckCircle size={16} color="var(--color-gold-300)" />
              : <AlertTriangle size={16} color="var(--color-warning)" />
            }
            <span>Совместимость: {isCompatible ? 'Все совместимо' : "Ошибки: " + compatibilityErrors.length}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-body-text">
            <Zap size={16} color="var(--color-gold-300)" />
            <span>Энергопотребление: ~{Math.round(powerConsumption)} Вт</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-body-text">
            <BarChart3 size={16} color="var(--color-gold-300)" />
            <span>Игровой рейтинг: {perf.gamingScore}/100</span>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end pt-2 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={!generatedBlobRef.current || generating}
            icon={generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          >
            {generating ? 'Генерация...' : 'Скачать PDF'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PdfExportModal;
