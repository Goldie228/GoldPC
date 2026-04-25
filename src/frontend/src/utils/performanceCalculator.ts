/**
 * Утилиты расчёта производительности ПК
 */
import type { Product, ProductSpecifications } from '../api/types';

export interface EstimatedFps { fps1080p: number; fps1440p: number; fps4k: number; }
export interface PerformanceResult {
  gamingScore: number;
  workstationScore: number;
  renderingScore: number;
  overallScore: number;
  estimatedFps: EstimatedFps;
  /** Нет CPU и GPU — оценка не строится (избегаем ложных «базовых» баллов). */
  isEmptyBuild: boolean;
}

function num(specs: ProductSpecifications | undefined, ...keys: string[]): number | null {
  if (!specs) return null;
  for (const k of keys) { const v = specs[k]; if (typeof v === 'number' && !isNaN(v)) return v; if (typeof v === 'string') { const n = parseFloat(v); if (!isNaN(n)) return n; } }
  return null;
}
function str(specs: ProductSpecifications | undefined, ...keys: string[]): string | null {
  if (!specs) return null;
  for (const k of keys) { const v = specs[k]; if (typeof v === 'string' && v.length > 0) return v; }
  return null;
}

export function estimateCpuSingleCore(specs: ProductSpecifications | undefined): number {
  const freq = num(specs, 'boostFrequency', 'boost_frequency', 'maksimalnaya_chastota') ?? num(specs, 'baseFrequency', 'base_frequency', 'bazovaya_chastota') ?? 3000;
  let score = freq * 0.13;
  const info = ((str(specs, 'model_series', 'modelSeries') ?? '') + ' ' + (str(specs, 'description') ?? '')).toLowerCase();
  if (/zen\s*4|ryzen\s*(7[0-9]{3}|9[0-9]{3})|raphael|granite/.test(info)) score *= 1.15;
  else if (/zen\s*3|ryzen\s*5[0-9]{3}|vermeer|cezanne/.test(info)) score *= 1.08;
  else if (/raptor\s*lake|13[0-9]{3}|14[0-9]{3}/.test(info)) score *= 1.12;
  else if (/alder\s*lake|12[0-9]{3}/.test(info)) score *= 1.05;
  return Math.min(score, 600);
}
function estimateCpuMultiCore(specs: ProductSpecifications | undefined): number {
  const cores = num(specs, 'cores', 'yadra') ?? 4;
  const threads = num(specs, 'threads', 'potoki') ?? cores;
  const freq = num(specs, 'boostFrequency', 'boost_frequency', 'maksimalnaya_chastota') ?? num(specs, 'baseFrequency', 'base_frequency', 'bazovaya_chastota') ?? 3000;
  let score = freq * 0.13 * cores * (threads > cores ? 0.75 : 0.85);
  const info = ((str(specs, 'model_series', 'modelSeries') ?? '') + ' ' + (str(specs, 'description') ?? '')).toLowerCase();
  if (/zen\s*4|granite/.test(info)) score *= 1.12;
  else if (/raptor\s*lake|14[0-9]{3}/.test(info)) score *= 1.10;
  else if (/zen\s*3|vermeer/.test(info)) score *= 1.05;
  return Math.min(score, 25000);
}

const GPU_SCORES: [RegExp, number][] = [
  [/rtx\s*5090/, 950], [/rtx\s*5080/, 870], [/rtx\s*5070\s*ti/, 840], [/rtx\s*5070/, 800],
  [/rtx\s*5060\s*ti/, 680], [/rtx\s*5060/, 620],
  [/rtx\s*4090/, 920], [/rtx\s*4080\s*super/, 840], [/rtx\s*4080/, 800],
  [/rtx\s*4070\s*ti\s*super/, 720], [/rtx\s*4070\s*t[ií]/, 680], [/rtx\s*4070\s*super/, 660], [/rtx\s*4070/, 600],
  [/rtx\s*4060\s*t[ií]/, 530], [/rtx\s*4060/, 450],
  [/rtx\s*3090/, 700], [/rtx\s*3080\s*ti/, 640], [/rtx\s*3080/, 600],
  [/rtx\s*3070\s*ti/, 530], [/rtx\s*3070/, 500],
  [/rtx\s*3060\s*t[ií]/, 430], [/rtx\s*3060/, 380], [/rtx\s*3050/, 280],
  [/rtx\s*2080/, 380], [/rtx\s*2070/, 320], [/rtx\s*2060/, 270],
  [/gtx\s*1660/, 230], [/gtx\s*1650/, 170],
  [/gtx\s*1080\s*ti/, 280], [/gtx\s*1080/, 250], [/gtx\s*1070/, 210], [/gtx\s*1060/, 170],
  [/rx\s*9070\s*xt/, 720], [/rx\s*9070/, 650],
  [/rx\s*7900\s*xt[x]?/, 780], [/rx\s*7900/, 700], [/rx\s*7800\s*xt/, 620], [/rx\s*7800/, 600],
  [/rx\s*7700\s*xt/, 520], [/rx\s*7700/, 500], [/rx\s*7600/, 400],
  [/rx\s*6950/, 620], [/rx\s*6900/, 580], [/rx\s*6800/, 520],
  [/rx\s*6700/, 430], [/rx\s*6600/, 330], [/rx\s*580|rx\s*590/, 170], [/rx\s*570/, 140],
  [/arc\s*a770/, 350], [/arc\s*a750/, 300], [/arc\s*a380/, 150],
];

export function estimateGpuGaming(specs: ProductSpecifications | undefined): number {
  if (!specs) return 0;
  const info = ((str(specs, 'gpu', 'graficheskiy_protsessor', 'chip') ?? '') + ' ' + (str(specs, 'name') ?? '')).toLowerCase();
  for (const [re, score] of GPU_SCORES) { if (re.test(info)) return score; }
  const vram = num(specs, 'vram', 'videopamyat');
  const clock = num(specs, 'boost_clock', 'boostClock', 'gpu_clock');
  let fallback = 0;
  if (vram != null) fallback += Math.min(vram * 12, 200);
  if (clock != null) fallback += clock * 0.05;
  return fallback;
}
function estimateGpuCompute(specs: ProductSpecifications | undefined): number {
  const gaming = estimateGpuGaming(specs);
  const info = ((str(specs, 'gpu', 'graficheskiy_protsessor', 'chip') ?? '') + ' ' + (str(specs, 'name') ?? '')).toLowerCase();
  if (/rtx|gtx/.test(info)) return gaming * 1.1;
  if (/rx/.test(info)) return gaming * 0.9;
  return gaming * 0.85;
}

function estimateRamFactor(specs: ProductSpecifications | undefined): number {
  if (!specs) return 1.0;
  const type = (str(specs, 'memoryType', 'type', 'tip_pamyati') ?? '').toUpperCase();
  const capacity = num(specs, 'capacity', 'obem');
  const freq = num(specs, 'frequency', 'chastota', 'speed');
  let factor = 1.0;
  if (type.includes('DDR5')) factor *= 1.1; else if (type.includes('DDR3')) factor *= 0.85;
  if (capacity != null) { if (capacity >= 32) factor *= 1.05; else if (capacity < 8) factor *= 0.85; }
  if (freq != null) { if (freq >= 6000) factor *= 1.05; else if (freq < 3200) factor *= 0.95; }
  return Math.min(Math.max(factor, 0.8), 1.2);
}

function estimateFps(cpuScore: number, gpuScore: number): EstimatedFps {
  // Balanced realistic FPS calculation with real world values
  const cpuLimit1080p = cpuScore * 0.18;
  const cpuLimit1440p = cpuScore * 0.13;
  const cpuLimit4k = cpuScore * 0.08;

  return {
    fps1080p: Math.round(Math.min(gpuScore * 0.09, cpuLimit1080p)),
    fps1440p: Math.round(Math.min(gpuScore * 0.065, cpuLimit1440p)),
    fps4k: Math.round(Math.min(gpuScore * 0.04, cpuLimit4k))
  };
}

export function calculatePerformance(cpu: Product | null, gpu: Product | null, ram: Product | null): PerformanceResult {
  if (!cpu && !gpu) {
    return {
      gamingScore: 0,
      workstationScore: 0,
      renderingScore: 0,
      overallScore: 0,
      estimatedFps: { fps1080p: 0, fps1440p: 0, fps4k: 0 },
      isEmptyBuild: true,
    };
  }

  const cpuSC = cpu ? estimateCpuSingleCore(cpu.specifications) : 0;
  const cpuMC = cpu ? estimateCpuMultiCore(cpu.specifications) : 0;
  const gpuGaming = gpu ? estimateGpuGaming(gpu.specifications) : 0;
  const gpuCompute = gpu ? estimateGpuCompute(gpu.specifications) : 0;
  const ramFactor = ram ? estimateRamFactor(ram.specifications) : 1.0;
  const gamingScore = Math.round(Math.min((gpuGaming * 0.7 + cpuSC * 0.4 + cpuMC * 0.02) * ramFactor / 10, 100));
  const workstationScore = Math.round(Math.min((cpuMC * 0.008 + cpuSC * 0.3) * ramFactor / 8, 100));
  const renderingScore = Math.round(Math.min((cpuMC * 0.005 + gpuCompute * 0.3 + cpuSC * 0.1) * ramFactor / 8, 100));
  const overallScore = Math.round(gamingScore * 0.4 + workstationScore * 0.3 + renderingScore * 0.3);
  return {
    gamingScore,
    workstationScore,
    renderingScore,
    overallScore,
    estimatedFps: estimateFps(cpuSC, gpuGaming),
    isEmptyBuild: false,
  };
}

export function getPerformanceLabel(score: number): string {
  if (score <= 0) return '—';
  if (score >= 90) return 'Экстремальный';
  if (score >= 75) return 'Высокий';
  if (score >= 55) return 'Средний';
  if (score >= 35) return 'Начальный';
  return 'Базовый';
}
/** Градации золотой шкалы (без красного «danger» для низких баллов). */
export interface GameFpsEntry {
  gameId: string;
  gameName: string;
  resolutions: {
    resolution1080p: number;
    resolution1440p: number;
    resolution4k: number;
  };
}

const GAME_FPS_SCALES: [string, string, number, number, number][] = [
  ['counter-strike-2', 'Counter-Strike 2', 1.25, 0.95, 0.65],
  ['grand-theft-auto-v', 'Grand Theft Auto V', 1.10, 0.80, 0.50],
  ['cyberpunk-2077', 'Cyberpunk 2077', 0.75, 0.55, 0.35],
  ['fortnite', 'Fortnite', 1.15, 0.85, 0.55],
  ['minecraft-vanilla', 'Minecraft (Vanilla)', 1.35, 1.10, 0.80],
  ['valorant', 'Valorant', 1.30, 1.00, 0.70],
  ['red-dead-redemption-2', 'Red Dead Redemption 2', 0.70, 0.50, 0.30],
  ['baldurs-gate-3', "Baldur's Gate 3", 0.75, 0.55, 0.35],
];

export function calculateLocalGameFps(gpuScore: number, cpuSingleCore: number): GameFpsEntry[] {
  const cpuLimit = cpuSingleCore * 0.18;
  const baseFps = Math.min(gpuScore * 0.09, cpuLimit);

  return GAME_FPS_SCALES.map(([gameId, gameName, scale1080p, scale1440p, scale4k]) => ({
    gameId,
    gameName,
    resolutions: {
      resolution1080p: Math.max(0, Math.round(baseFps * scale1080p)),
      resolution1440p: Math.max(0, Math.round(baseFps * scale1440p)),
      resolution4k: Math.max(0, Math.round(baseFps * scale4k)),
    }
  }));
}

export function getPerformanceColor(score: number): string {
  if (score <= 0) return 'performance-none';
  if (score >= 90) return 'performance-extreme';
  if (score >= 75) return 'performance-high';
  if (score >= 55) return 'performance-medium';
  if (score >= 35) return 'performance-entry';
  return 'performance-basic';
}
