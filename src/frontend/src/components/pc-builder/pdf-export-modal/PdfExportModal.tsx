/**
 * PdfExportModal — генерация и скачивание PDF-файла конфигурации сборки.
 * Использует html2canvas для рендера стилизованного HTML в canvas,
 * затем jsPDF для конвертации в PDF.
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

/* ---------- helpers ---------- */

function computePerformance(s: PCBuilderSelectedState) {
  const cpu = s.cpu?.product ?? null;
  const gpu = s.gpu?.product ?? null;
  const ram = s.ram[0]?.product ?? null;
  return calculatePerformance(cpu, gpu, ram);
}

function generateAutoname(s: PCBuilderSelectedState): string {
  const parts: string[] = [];
  if (s.cpu?.product) {
    const m = s.cpu.product.name.match(/\b(Ryzen\s+\d+\s+\w+|Core\s+i\d\s+\w+)/i);
    parts.push(m ? m[0] : s.cpu.product.name.split(' ').slice(0, 3).join(' '));
  }
  if (s.gpu?.product) {
    const m = s.gpu.product.name.match(/(RTX\s+\d+\s*\w*|GTX\s+\d+\s*\w*|RX\s+\d+\s*\w*)/i);
    parts.push(m ? m[0] : s.gpu.product.name.split(' ').slice(0, 3).join(' '));
  }
  if (parts.length > 0) return 'GoldPC \u2014 ' + parts.join(' + ');
  return 'GoldPC \u2014 \u0421\u0431\u043E\u0440\u043A\u0430 \u043E\u0442 ' + new Date().toLocaleDateString('ru-BY');
}

function getImageUrl(product: { mainImage?: { url: string }; images?: Array<{ url: string }> }): string {
  const url = product.mainImage?.url ?? product.images?.[0]?.url;
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return '/api/v1' + (url.startsWith('/') ? '' : '/') + url;
}

async function fetchImageAsDataUrl(src: string): Promise<string> {
  try {
    const resp = await fetch(src, { credentials: 'include' });
    if (!resp.ok) return '';
    const blob = await resp.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch { return ''; }
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- component rows ---------- */

type Row = { category: string; name: string; price: string; imageUrl: string };

function getRows(s: PCBuilderSelectedState): Row[] {
  const rows: Row[] = [];
  const fmt = (p: number) => p.toLocaleString('ru-BY') + ' BYN';
  for (const slot of PC_BUILDER_SLOTS) {
    if (slot.key === 'ram') {
      if (s.ram.length === 0) { rows.push({ category: slot.label, name: '\u2014', price: '\u2014', imageUrl: '' }); }
      else { s.ram.forEach((r, i) => { rows.push({ category: s.ram.length > 1 ? '\u041E\u0417\u0423 (' + (i + 1) + ')' : slot.label, name: r.product.name, price: fmt(r.product.price), imageUrl: getImageUrl(r.product) }); }); }
      continue;
    }
    if (slot.key === 'storage') {
      if (s.storage.length === 0) { rows.push({ category: slot.label, name: '\u2014', price: '\u2014', imageUrl: '' }); }
      else { s.storage.forEach((st, i) => { rows.push({ category: s.storage.length > 1 ? '\u041D\u0430\u043A\u043E\u043F\u0438\u0442\u0435\u043B\u044C (' + (i + 1) + ')' : slot.label, name: st.product.name, price: fmt(st.product.price), imageUrl: getImageUrl(st.product) }); }); }
      continue;
    }
    if (slot.key === 'fan') {
      const fans = s.fan;
      if (!fans || fans.length === 0) { rows.push({ category: slot.label, name: '\u2014', price: '\u2014', imageUrl: '' }); }
      else { fans.forEach((f: SelectedComponent, i: number) => { rows.push({ category: fans.length > 1 ? '\u0412\u0435\u043D\u0442\u0438\u043B\u044F\u0442\u043E\u0440 (' + (i + 1) + ')' : slot.label, name: f.product.name, price: fmt(f.product.price), imageUrl: getImageUrl(f.product) }); }); }
      continue;
    }
    const comp = (s as unknown as Record<string, SelectedComponent | undefined>)[slot.key];
    if (comp?.product) { rows.push({ category: slot.label, name: comp.product.name, price: fmt(comp.product.price), imageUrl: getImageUrl(comp.product) }); }
    else { rows.push({ category: slot.label, name: '\u2014', price: '\u2014', imageUrl: '' }); }
  }
  return rows;
}

/* ---------- build HTML for canvas ---------- */

function buildHtml(props: PdfExportModalProps, imageMap: Record<string, string>): string {
  const { selectedComponents: s, totalPrice, powerConsumption, recommendedPsu, isCompatible, compatibilityErrors, compatibilityWarnings } = props;
  const perf = computePerformance(s);
  const autoName = generateAutoname(s);
  const now = new Date();
  const rows = getRows(s);
  const recPsu = recommendedPsu ?? Math.ceil(powerConsumption * 1.3);

  const rowsHtml = rows.map(r => {
    const img = r.imageUrl && imageMap[r.imageUrl]
      ? '<td class="pdf-img-cell"><img src="' + imageMap[r.imageUrl] + '" /></td>'
      : '<td class="pdf-img-cell"><div class="pdf-img-placeholder">\u2014</div></td>';
    return '<tr>' + img
      + '<td class="pdf-cat-cell">' + esc(r.category) + '</td>'
      + '<td class="pdf-name-cell">' + esc(r.name) + '</td>'
      + '<td class="pdf-price-cell">' + esc(r.price) + '</td></tr>';
  }).join('');

  const errHtml = compatibilityErrors.length > 0
    ? '<div class="pdf-errors">' + compatibilityErrors.map(e => '<div class="pdf-error-item">\u2715 ' + esc(e) + '</div>').join('') + '</div>' : '';
  const warnHtml = compatibilityWarnings.length > 0
    ? '<div class="pdf-warnings">' + compatibilityWarnings.map(w => '<div class="pdf-warning-item">\u26A0 ' + esc(w) + '</div>').join('') + '</div>' : '';

  const fpsHtml = perf.estimatedFps.fps1080p > 0
    ? '<div class="pdf-stat"><div class="pdf-stat-label">FPS</div><div class="pdf-stat-value">' + perf.estimatedFps.fps1080p + '<span class="pdf-stat-unit"> fps</span></div><div class="pdf-stat-sub">1080p</div></div>'
    : '';

  return '<div class="pdf-page">'
    + '<div class="pdf-header"><div><div class="pdf-logo">GOLDPC</div><div class="pdf-logo-sub">\u041A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u041F\u041A</div></div>'
    + '<div class="pdf-header-right"><div class="pdf-build-name">' + esc(autoName) + '</div><div class="pdf-date">' + now.toLocaleDateString('ru-BY', { day: 'numeric', month: 'long', year: 'numeric' }) + '</div></div></div>'
    + '<div class="pdf-status"><div class="pdf-badge ' + (isCompatible ? 'pdf-badge--ok' : 'pdf-badge--err') + '">'
    + (isCompatible ? '\u2713 \u0412\u0441\u0435 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u044B' : '\u2715 \u041E\u0448\u0438\u0431\u043A\u0438: ' + compatibilityErrors.length)
    + '</div><div class="pdf-status-info">\u042D\u043D\u0435\u0440\u0433\u043E\u043F\u043E\u0442\u0440\u0435\u0431\u043B\u0435\u043D\u0438\u0435: ~' + Math.round(powerConsumption) + ' \u0412\u0442 | \u0420\u0435\u043A. \u0411\u041F: ' + recPsu + ' \u0412\u0442</div></div>'
    + errHtml + warnHtml
    + '<div class="pdf-section-title">\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u044B</div>'
    + '<table class="pdf-table"><thead><tr><th style="width:48px"></th><th style="width:100px">\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F</th><th>\u041A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442</th><th style="width:100px;text-align:right">\u0426\u0435\u043D\u0430</th></tr></thead><tbody>'
    + rowsHtml + '</tbody></table>'
    + '<div class="pdf-stats">'
    + '<div class="pdf-stat"><div class="pdf-stat-label">\u041F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C</div><div class="pdf-stat-value">' + perf.gamingScore + '<span class="pdf-stat-unit">/100</span></div><div class="pdf-stat-sub">\u0418\u0433\u0440\u044B: ' + getPerformanceLabel(perf.gamingScore) + '</div></div>'
    + '<div class="pdf-stat"><div class="pdf-stat-label">\u042D\u043D\u0435\u0440\u0433\u043E\u043F\u043E\u0442\u0440\u0435\u0431\u043B\u0435\u043D\u0438\u0435</div><div class="pdf-stat-value">~' + Math.round(powerConsumption) + '<span class="pdf-stat-unit"> \u0412\u0442</span></div><div class="pdf-stat-sub">\u0420\u0435\u043A. \u0411\u041F: ' + recPsu + ' \u0412\u0442</div></div>'
    + fpsHtml + '</div>'
    + '<div class="pdf-total"><span class="pdf-total-label">\u0418\u0442\u043E\u0433\u043E:</span><span class="pdf-total-value">' + totalPrice.toLocaleString('ru-BY') + ' BYN</span></div>'
    + '<div class="pdf-footer"><span>GoldPC \u2014 \u041A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u041F\u041A | goldpc.by</span><span>' + now.toLocaleString('ru-BY') + '</span></div>'
    + '</div>';
}

/* ---------- PDF generation ---------- */

async function generatePdf(props: PdfExportModalProps): Promise<Blob> {
  const rows = getRows(props.selectedComponents);
  const uniqueUrls = [...new Set(rows.map(r => r.imageUrl).filter(Boolean))];
  const imageMap: Record<string, string> = {};
  await Promise.all(uniqueUrls.map(async url => {
    imageMap[url] = await fetchImageAsDataUrl(url);
  }));

  const html = buildHtml(props, imageMap);
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
  container.innerHTML = html;
  document.body.appendChild(container);
  const el = container.querySelector('.pdf-page') as HTMLElement;

  try {
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#0b0e11', width: 794, windowWidth: 794 });
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height * pw) / canvas.width;
    if (imgH <= ph) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pw, imgH);
    } else {
      const slices = Math.ceil(imgH / ph);
      for (let i = 0; i < slices; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -i * ph, pw, imgH);
      }
    }
    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

/* ---------- component ---------- */

export function PdfExportModal({
  isOpen, onClose, selectedComponents, totalPrice, powerConsumption,
  recommendedPsu, isCompatible, compatibilityErrors, compatibilityWarnings,
}: PdfExportModalProps) {
  const perf = computePerformance(selectedComponents);
  const [generating, setGenerating] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const urlRef = useRef<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const blob = await generatePdf({ isOpen: true, onClose: () => {}, selectedComponents, totalPrice, powerConsumption, recommendedPsu, isCompatible, compatibilityErrors, compatibilityWarnings });
      blobRef.current = blob;
      urlRef.current = URL.createObjectURL(blob);
    } catch (err) { console.error('PDF generation failed:', err); }
    finally { setGenerating(false); }
  }, [selectedComponents, totalPrice, powerConsumption, recommendedPsu, isCompatible, compatibilityErrors, compatibilityWarnings]);

  const handleDownload = useCallback(() => {
    if (!urlRef.current) return;
    const a = document.createElement('a');
    a.href = urlRef.current;
    a.download = generateAutoname(selectedComponents) + '.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onClose();
  }, [onClose, selectedComponents]);

  useEffect(() => { if (isOpen) handleGenerate(); }, [isOpen, handleGenerate]);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const buildName = generateAutoname(selectedComponents);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={'\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0432 PDF'} size="medium">
      <div className="flex flex-col gap-5 py-2">
        <div className="flex flex-col items-center gap-2 p-6 border border-dashed rounded-lg" style={{ background: 'rgba(252,213,53,0.06)', borderColor: 'rgba(252,213,53,0.2)' }}>
          {generating ? <Loader2 size={48} strokeWidth={1.5} className="animate-spin" style={{ color: '#fcd535' }} /> : <FileText size={48} strokeWidth={1.5} style={{ color: '#fcd535' }} />}
          <p className="text-xs font-semibold m-0" style={{ color: '#eaecef' }}>{buildName}.pdf</p>
          <p className="text-xs m-0 text-center" style={{ color: '#707a8a' }}>{generating ? '\u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F PDF-\u0444\u0430\u0439\u043B\u0430...' : '\u0413\u043E\u0442\u043E\u0432\u044B\u0439 PDF-\u0444\u0430\u0439\u043B \u0441 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0435\u0439 \u0441\u0431\u043E\u0440\u043A\u0438'}</p>
        </div>
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center gap-2.5 text-xs" style={{ color: '#eaecef' }}><CheckCircle size={16} color="#fcd535" /><span>{'\u0421\u043F\u0438\u0441\u043E\u043A \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432 \u0441 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F\u043C\u0438'}</span></div>
          <div className="flex items-center gap-2.5 text-xs" style={{ color: '#eaecef' }}><CheckCircle size={16} color="#fcd535" /><span>{'\u0426\u0435\u043D\u0430 \u043A\u043E\u043C\u043F\u043E\u043D\u0435\u043D\u0442\u043E\u0432: ' + totalPrice.toLocaleString('ru-BY') + ' BYN'}</span></div>
          <div className="flex items-center gap-2.5 text-xs" style={{ color: '#eaecef' }}>{isCompatible ? <CheckCircle size={16} color="#0ecb81" /> : <AlertTriangle size={16} color="#f6465d" />}<span>{'\u0421\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0441\u0442\u044C: ' + (isCompatible ? '\u0412\u0441\u0435 \u0441\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u043E' : '\u041E\u0448\u0438\u0431\u043A\u0438: ' + compatibilityErrors.length)}</span></div>
          <div className="flex items-center gap-2.5 text-xs" style={{ color: '#eaecef' }}><Zap size={16} color="#fcd535" /><span>{'\u042D\u043D\u0435\u0440\u0433\u043E\u043F\u043E\u0442\u0440\u0435\u0431\u043B\u0435\u043D\u0438\u0435: ~' + Math.round(powerConsumption) + ' \u0412\u0442'}</span></div>
          <div className="flex items-center gap-2.5 text-xs" style={{ color: '#eaecef' }}><BarChart3 size={16} color="#fcd535" /><span>{'\u0418\u0433\u0440\u043E\u0432\u043E\u0439 \u0440\u0435\u0439\u0442\u0438\u043D\u0433: ' + perf.gamingScore + '/100'}</span></div>
        </div>
        <div className="flex items-center gap-3 justify-end pt-2" style={{ borderTop: '1px solid #2b3139' }}>
          <Button variant="ghost" onClick={onClose}>{'\u041E\u0442\u043C\u0435\u043D\u0430'}</Button>
          <Button variant="primary" onClick={handleDownload} disabled={!blobRef.current || generating}
            icon={generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}>
            {generating ? '\u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F...' : '\u0421\u043A\u0430\u0447\u0430\u0442\u044C PDF'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PdfExportModal;
