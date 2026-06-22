import type { PCComponentType } from '@/features/pc-builder/logic/types';

export type Purpose = 'gaming' | 'office' | 'workstation';
export type Budget = 'economy' | 'optimal' | 'gaming' | 'max';
export type CpuBrand = 'amd' | 'intel' | 'any';
export type Resolution = '1080p' | '1440p' | '4k';

export interface WizardState {
  purpose: Purpose | null;
  budget: Budget | null;
  cpuBrand: CpuBrand;
  resolution: Resolution;
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
  { id: 'workstation' as Purpose, label: 'Работа / Студия', description: 'Монтаж видео, 3D-графика, разработка', icon: 'Film' },
];

export const BUDGET_OPTIONS = [
  { id: 'economy' as Budget, label: 'Эконом', range: '~2 000 BYN', description: 'Базовая сборка' },
  { id: 'optimal' as Budget, label: 'Оптимальная', range: '~3 500 BYN', description: 'Лучшее соотношение цена/качество' },
  { id: 'gaming' as Budget, label: 'Игровая', range: '~5 500 BYN', description: 'Высокая производительность' },
  { id: 'max' as Budget, label: 'Максимальная', range: 'Без ограничений', description: 'Топовые компоненты' },
];

export const STEP_LABELS = ['Назначение', 'Бюджет', 'Предпочтения'];

export const COMPONENT_LABELS: Record<string, string> = {
  cpu: 'Процессор',
  gpu: 'Видеокарта',
  motherboard: 'Материнская плата',
  ram: 'ОЗУ',
  storage: 'Накопитель',
  psu: 'Блок питания',
  case: 'Корпус',
  cooling: 'Охлаждение',
};

export const COMPONENT_ICONS: Record<string, string> = {
  cpu: 'Cpu',
  gpu: 'Monitor',
  motherboard: 'CircuitBoard',
  ram: 'MemoryStick',
  storage: 'HardDrive',
  psu: 'Zap',
  case: 'Box',
  cooling: 'Thermometer',
};

export const BUDGET_RANGES: Record<Budget, { min: number; max: number }> = {
  economy: { min: 0, max: 2000 },
  optimal: { min: 2000, max: 3500 },
  gaming: { min: 3500, max: 5500 },
  max: { min: 5500, max: 99999 },
};

export const PURPOSE_BUDGET_ALLOC: Record<Purpose, Partial<Record<PCComponentType, number>>> = {
  gaming: {
    cpu: 0.2,
    gpu: 0.35,
    motherboard: 0.1,
    ram: 0.1,
    storage: 0.08,
    psu: 0.08,
    case: 0.05,
    cooling: 0.04,
  },
  office: {
    cpu: 0.3,
    gpu: 0.05,
    motherboard: 0.15,
    ram: 0.12,
    storage: 0.15,
    psu: 0.08,
    case: 0.1,
    cooling: 0.05,
  },
  workstation: {
    cpu: 0.28,
    gpu: 0.25,
    motherboard: 0.12,
    ram: 0.13,
    storage: 0.08,
    psu: 0.07,
    case: 0.04,
    cooling: 0.03,
  },
};

export function getTemplate(purpose: Purpose, budget: Budget): BuildTemplate {
  const budgetMultiplier: Record<Budget, number> = {
    economy: 0.5,
    optimal: 1,
    gaming: 1.5,
    max: 2.5,
  };

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
    workstation: {
      cpu: { minPrice: 500, maxPrice: 1500, brands: ['AMD', 'Intel'] },
      gpu: { minPrice: 1000, maxPrice: 4000, brands: ['NVIDIA', 'AMD'] },
      motherboard: { minPrice: 250, maxPrice: 700 },
      ram: { minPrice: 200, maxPrice: 600, minCapacity: 32 },
      storage: { minPrice: 150, maxPrice: 500 },
      psu: { minPrice: 200, maxPrice: 500 },
      case: { minPrice: 150, maxPrice: 400 },
      cooling: { minPrice: 80, maxPrice: 300 },
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
