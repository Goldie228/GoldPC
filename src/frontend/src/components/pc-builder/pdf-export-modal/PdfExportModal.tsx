/**
 * PdfExportModal — генерация и скачивание PDF-файла конфигурации сборки.
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
  if (parts.length > 0) return "GoldPC \u2014 " + parts.join(' + ');
  return "GoldPC \u2014 " + new Date().toLocaleDateString('ru-BY');
}

function getImageUrl(product: { mainImage?: { url: string }; images?: Array<{ url: string }> }): string {
  const url = product.mainImage?.url ?? product.images?.[0]?.url;
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return "/api/v1" + (url.startsWith('/') ? '' : '/') + url;
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
  const fmt = (p: number) => p.toLocaleString('ru-BY') + " BYN";
  for (const slot of PC_BUILDER_SLOTS) {
    if (slot.key === 'ram') {
      if (s.ram.length === 0) { rows.push({ category: slot.label, name: '\u2014', price: '\u2014', imageUrl: '' }); }
      else { s.ram.forEach((r, i) => { rows.push({ category: s.ram.length > 1 ? "RAM " + (i + 1) : slot.label, name: r.product.name, price: fmt(r.product.price), imageUrl: getImageUrl(r.product) }); }); }
      continue;
    }
    if (slot.key === 'storage') {
      if (s.storage.length === 0) { rows.push({ category: slot.label, name: '\u2014', price: '\u2014', imageUrl: '' }); }
      else { s.storage.forEach((st, i) => { rows.push({ category: s.storage.length > 1 ? "Storage " + (i + 1) : slot.label, name: st.product.name, price: fmt(st.product.price), imageUrl: getImageUrl(st.product) }); }); }
      continue;
    }
    if (slot.key === 'fan') {
      const fans = s.fan;
      if (!fans || fans.length === 0) { rows.push({ category: slot.label, name: '\u2014', price: '\u2014', imageUrl: '' }); }
      else { fans.forEach((f: SelectedComponent, i: number) => { rows.push({ category: fans.length > 1 ? "Fan " + (i + 1) : slot.label, name: f.product.name, price: fmt(f.product.price), imageUrl: getImageUrl(f.product) }); }); }
      continue;
    }
    const comp = (s as unknown as Record<string, SelectedComponent | undefined>)[slot.key];
    if (comp?.product) { rows.push({ category: slot.label, name: comp.product.name, price: fmt(comp.product.price), imageUrl: getImageUrl(comp.product) }); }
    else { rows.push({ category: slot.label, name: '\u2014', price: '\u2014', imageUrl: '' }); }
  }
  return rows;
}

/* ---------- build HTML ---------- */

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
      : '<td class="pdf-img-cell"><div class="pdf-img-placeholder">N/A</div></td>';
    return '<tr>' + img
      + '<td class="pdf-cat-cell">' + esc(r.category) + '</td>'
      + '<td class="pdf-name-cell">' + esc(r.name) + '</td>'
      + '<td class="pdf-price-cell">' + esc(r.price) + '</td></tr>';
  }).join('');

  const errHtml = compatibilityErrors.length > 0
    ? '<div class="pdf-errors">' + compatibilityErrors.map(e => '<div class="pdf-error-item">x ' + esc(e) + '</div>').join('') + '</div>' : '';
  const warnHtml = compatibilityWarnings.length > 0
    ? '<div class="pdf-warnings">' + compatibilityWarnings.map(w => '<div class="pdf-warning-item">! ' + esc(w) + '</div>').join('') + '</div>' : '';

  const fpsHtml = perf.estimatedFps.fps1080p > 0
    ? '<div class="pdf-stat"><div class="pdf-stat-label">FPS</div><div class="pdf-stat-value">' + perf.estimatedFps.fps1080p + '<span class="pdf-stat-unit"> fps</span></div><div class="pdf-stat-sub">1080p</div></div>'
    : '';

  return '<div class="pdf-page">'
    + '<div class="pdf-header"><div><div class="pdf-logo">GOLDPC</div><div class="pdf-logo-sub">Konfigurator PK</div></div>'
    + '<div class="pdf-header-right"><div class="pdf-build-name">' + esc(autoName) + '</div><div class="pdf-date">' + now.toLocaleDateString('ru-BY', { day: 'numeric', month: 'long', year: 'numeric' }) + '</div></div></div>'
    + '<div class="pdf-status"><div class="pdf-badge ' + (isCompatible ? 'pdf-badge--ok' : 'pdf-badge--err') + '">'
    + (isCompatible ? 'OK: Komponenty sovmestimy' : 'ERR: ' + compatibilityErrors.length + ' oshibok')
    + '</div><div class="pdf-status-info">Power: ~' + Math.round(powerConsumption) + 'W | PSU: ' + recPsu + 'W</div></div>'
    + errHtml + warnHtml
    + '<div class="pdf-section-title">Komponenty</div>'
    + '<table class="pdf-table"><thead><tr><th style="width:48px"></th><th style="width:100px">Kategoriya</th><th>Komponent</th><th style="width:100px;text-align:right">Tsena</th></tr></thead><tbody>'
    + rowsHtml + '</tbody></table>'
    + '<div class="pdf-stats">'
    + '<div class="pdf-stat"><div class="pdf-stat-label">Proizvoditelnost</div><div class="pdf-stat-value">' + perf.gamingScore + '<span class="pdf-stat-unit">/100</span></div><div class="pdf-stat-sub">' + getPerformanceLabel(perf.gamingScore) + '</div></div>'
    + '<div class="pdf-stat"><div class="pdf-stat-label">Moshchnost</div><div class="pdf-stat-value">~' + Math.round(powerConsumption) + '<span class="pdf-stat-unit"> W</span></div><div class="pdf-stat-sub">PSU: ' + recPsu + 'W</div></div>'
    + fpsHtml + '</div>'
    + '<div class="pdf-total"><span class="pdf-total-label">Itogo:</span><span class="pdf-total-value">' + totalPrice.toLocaleString('ru-BY') + ' BYN</span></div>'
    + '<div class="pdf-footer"><span>GoldPC | goldpc.by</span><span>' + now.toLocaleString('ru-BY') + '</span></div>'
    + '</div>';
}

/* ---------- PDF generation ---------- */

async function generatePdf(props: PdfExportModalProps): Promise<Blob> {
  // Pre-fetch all images to data URLs
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
    a.download = generateAutoname(selectedComponents) + ".pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onClose();
  }, [onClose, selectedComponents]);

  useEffect(() => { if (isOpen) handleGenerate(); }, [isOpen, handleGenerate]);
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const buildName = generateAutoname(selectedComponents);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export v PDF" size="medium">
      <div className="flex flex-col gap-5 py-2">
        <div className="flex flex-col items-center gap-2 p-6 border border-dashed rounded-lg" style={{ background: 'rgba(252,213,53,0.06)', borderColor: 'rgba(252,213,53,0.2)' }}>
          {generating ? <Loader2 size={48} strokeWidth={1.5} className="animate-spin" style={{ color: '#fcd535' }} /> : <FileText size={48} strokeWidth={1.5} style={{ color: '#fcd535' }} />}
          <p className="text-xs font-semibold m-0" style={{ color: '#eaecef' }}>{buildName}.pdf</p>
          <p className="text-xs m-0 text-center" style={{ color: '#707a8a' }}>{generating ? 'Generatsiya PDF...' : 'PDF-fayl s konfiguratsiey sborki'}</p>
        </div>
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center gap-2.5 text-xs" style={{ color: '#eaecef' }}><CheckCircle size={16} color="#fcd535" /><span>Spisok komponentov s izobrazheniyami</span></div>
          <div className="flex items-center gap-2.5 text-xs" style={{ color: '#eaecef' }}><CheckCircle size={16} color="#fcd535" /><span>Tsena: {totalPrice.toLocaleString('ru-BY')} BYN</span></div>
          <div className="flex items-center gap-2.5 text-xs" style={{ color: '#eaecef' }}>{isCompatible ? <CheckCircle size={16} color="#0ecb81" /> : <AlertTriangle size={16} color="#f6465d" />}<span>Sovmestimost: {isCompatible ? 'OK' : compatibilityErrors.length + ' oshibok'}</span></div>
          <div className="flex items-center gap-2.5 text-xs" style={{ color: '#eaecef' }}><Zap size={16} color="#fcd535" /><span>Moshchnost: ~{Math.round(powerConsumption)}W</span></div>
          <div className="flex items-center gap-2.5 text-xs" style={{ color: '#eaecef' }}><BarChart3 size={16} color="#fcd535" /><span>Reyting: {perf.gamingScore}/100</span></div>
        </div>
        <div className="flex items-center gap-3 justify-end pt-2" style={{ borderTop: '1px solid #2b3139' }}>
          <Button variant="ghost" onClick={onClose}>Otmena</Button>
          <Button variant="primary" onClick={handleDownload} disabled={!blobRef.current || generating}
            icon={generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}>
            {generating ? 'Generatsiya...' : 'Skachat PDF'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PdfExportModal;
