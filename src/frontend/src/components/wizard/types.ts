import type { PCComponentType } from '../../hooks';

export type Purpose = 'gaming' | 'office' | 'video' | 'universal';
export type Budget = 'low' | 'mid' | 'high' | 'ultra';
export type CpuPreference = 'amd' | 'intel' | 'any';
export type GpuPreference = 'amd' | 'nvidia' | 'any';

export interface WizardState {
  purpose: Purpose | null;
  budget: Budget | null;
  cpuPreference: CpuPreference;
  gpuPreference: GpuPreference;
  minRam: number;
}

export interface BuildTemplate {
  cpu: { minPrice: number; maxPrice: number; brands: string[] };
  gpu: { minPrice: number; maxPrice: number; brands: string[] };
  motherboard: { minPrice: number; maxPrice: number };
  ram: { minPrice: number; maxPrice: number; minCapacity: number };
  storage: { minPrice: number; maxPrice: number };
  psu: { minPrice: number; maxPrice: number };
  case: { minPrice: number; maxPrice: number };
  cooling: { minPrice: number; maxPrice: number };
}

export const PURPOSE_OPTIONS = [
  { id: 'gaming' as Purpose, label: 'Игры', description: 'Максимальная производительность в играх', icon: 'Monitor' },
  { id: 'office' as Purpose, label: 'Офис', description: 'Работа с документами и интернетом', icon: 'Briefcase' },
  { id: 'video' as Purpose, label: 'Видеомонтаж', description: 'Обработка видео и 3D-графики', icon: 'Film' },
  { id: 'universal' as Purpose, label: 'Универсальный', description: 'Для всех задач', icon: 'Sparkles' },
];

export const BUDGET_OPTIONS = [
  { id: 'low' as Budget, label: 'Эконом', range: 'до 1 500 BYN' },
  { id: 'mid' as Budget, label: 'Средний', range: '1 500 — 3 000 BYN' },
  { id: 'high' as Budget, label: 'Премиум', range: '3 000 — 5 000 BYN' },
  { id: 'ultra' as Budget, label: 'Максимум', range: 'от 5 000 BYN' },
];

export const STEP_LABELS = ['Назначение', 'Бюджет', 'Предпочтения'];

export const COMPONENT_LABELS: Record<PCComponentType, string> = {
  cpu: 'Процессор', gpu: 'Видеокарта', motherboard: 'Материнская плата', ram: 'ОЗУ',
  storage: 'Накопитель', psu: 'Блок питания', case: 'Корпус', cooling: 'Охлаждение',
};

export function getTemplate(purpose: Purpose, budget: Budget): BuildTemplate {
  const budgetMultiplier: Record<Budget, number> = { low: 0.5, mid: 1, high: 1.5, ultra: 2 };

  const baseTemplates: Record<Purpose, BuildTemplate> = {
    gaming: {
      cpu: { minPrice: 400, maxPrice: 1200, brands: ['AMD', 'Intel'] },
      gpu: { minPrice: 800, maxPrice: 3000, brands: ['NVIDIA', 'AMD'] },
      motherboard: { minPrice: 200, maxPrice: 600 },
      ram: { minPrice: 100, maxPrice: 400, minCapacity: 16 },
      storage: { minPrice: 100, maxPrice: 300 },
      psu: { minPrice: 150, maxPrice: 400 },
      case: { minPrice: 100, maxPrice: 300 },
      cooling: { minPrice: 50, maxPrice: 200 },
    },
    office: {
      cpu: { minPrice: 200, maxPrice: 500, brands: ['AMD', 'Intel'] },
      gpu: { minPrice: 0, maxPrice: 300, brands: ['NVIDIA', 'AMD'] },
      motherboard: { minPrice: 100, maxPrice: 300 },
      ram: { minPrice: 50, maxPrice: 150, minCapacity: 8 },
      storage: { minPrice: 50, maxPrice: 150 },
      psu: { minPrice: 80, maxPrice: 200 },
      case: { minPrice: 50, maxPrice: 150 },
      cooling: { minPrice: 20, maxPrice: 80 },
    },
    video: {
      cpu: { minPrice: 500, maxPrice: 1500, brands: ['AMD', 'Intel'] },
      gpu: { minPrice: 1000, maxPrice: 4000, brands: ['NVIDIA', 'AMD'] },
      motherboard: { minPrice: 250, maxPrice: 700 },
      ram: { minPrice: 200, maxPrice: 600, minCapacity: 32 },
      storage: { minPrice: 150, maxPrice: 500 },
      psu: { minPrice: 200, maxPrice: 500 },
      case: { minPrice: 150, maxPrice: 400 },
      cooling: { minPrice: 80, maxPrice: 300 },
    },
    universal: {
      cpu: { minPrice: 300, maxPrice: 800, brands: ['AMD', 'Intel'] },
      gpu: { minPrice: 500, maxPrice: 1500, brands: ['NVIDIA', 'AMD'] },
      motherboard: { minPrice: 150, maxPrice: 400 },
      ram: { minPrice: 80, maxPrice: 250, minCapacity: 16 },
      storage: { minPrice: 80, maxPrice: 250 },
      psu: { minPrice: 100, maxPrice: 300 },
      case: { minPrice: 80, maxPrice: 250 },
      cooling: { minPrice: 40, maxPrice: 150 },
    },
  };

  const template = { ...baseTemplates[purpose] };
  const multiplier = budgetMultiplier[budget];
  for (const key of Object.keys(template) as (keyof BuildTemplate)[]) {
    template[key].minPrice = Math.round(template[key].minPrice * multiplier);
    template[key].maxPrice = Math.round(template[key].maxPrice * multiplier);
  }
  return template;
}
