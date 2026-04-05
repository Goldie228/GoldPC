/**
 * Типы для декларативного движка правил совместимости.
 * @module config/compatibilityTypes
 */

// ──────────── BIOS Warning ────────────

export interface BiosWarningConfig {
  enabled: boolean;
  message?: string;
  probability?: string;
  affectedChipsets?: string[];
}

// ──────────── Socket ────────────

export interface SocketGroup {
  id: string;
  sockets: string[];
  chipsets: string[];
  ramType: string;
  ramTypeAlternate?: string;
  maxRamSpeed: number;
  biosWarning: BiosWarningConfig;
}

export interface SocketCompatibilityConfig {
  groups: SocketGroup[];
}

// ──────────── Form Factor ────────────

export interface FormFactorRule {
  caseFormFactor: string;
  supportedMotherboards: string[];
}

export interface FormFactorCompatibilityConfig {
  hierarchy: string[];
  rules: FormFactorRule[];
  aliases: Record<string, string>;
}

// ──────────── RAM ────────────

export interface RuleTemplate {
  severity: string;
  messageTemplate?: string;
  message?: string;
  suggestionTemplate?: string;
  suggestion?: string;
}

export interface RamCompatibilityConfig {
  validTypes: string[];
  generationMismatch: RuleTemplate;
  speedLimit: RuleTemplate;
  slotOverflow: RuleTemplate;
}

// ──────────── Power ────────────

export interface PowerCompatibilityConfig {
  baseSystemPower: number;
  psuBufferPercent: number;
  psuMinBufferPercent: number;
  roundingStep: number;
  insufficient: RuleTemplate;
  tightMargin: RuleTemplate;
}

// ──────────── Dimensions ────────────

export interface GpuLengthConfig {
  error: RuleTemplate;
  warningThresholdMm: number;
  warning: RuleTemplate;
}

export interface CoolerHeightConfig {
  airCoolerOnly: boolean;
  error: RuleTemplate;
}

export interface DimensionCompatibilityConfig {
  gpuLength: GpuLengthConfig;
  coolerHeight: CoolerHeightConfig;
}

// ──────────── Cooler ────────────

export interface CoolerCompatibilityConfig {
  socketMismatch: RuleTemplate;
  tdpInsufficient: RuleTemplate;
}

// ──────────── Bottleneck ────────────

export interface BottleneckRule {
  threshold: number;
  severity: string;
  messageTemplate: string;
  suggestion: string;
}

export interface IdealRatio {
  min: number;
  max: number;
}

export interface BottleneckCategory {
  cpuWeight: number;
  gpuWeight: number;
  idealRatio: IdealRatio;
}

export interface BottleneckDetectionConfig {
  cpuBound: BottleneckRule;
  gpuBound: BottleneckRule;
  categories: Record<string, BottleneckCategory>;
}

// ──────────── Performance Warnings ────────────

export interface RamThreshold {
  minCapacity: number;
  maxCapacity: number;
  severity: string;
  message: string;
  suggestion: string;
}

export interface InsufficientRamConfig {
  thresholds: RamThreshold[];
}

export interface NoIntegratedGraphicsConfig {
  severity: string;
  message: string;
  suggestion: string;
}

export interface PerformanceWarningsConfig {
  insufficientRam: InsufficientRamConfig;
  noIntegratedGraphics: NoIntegratedGraphicsConfig;
}

// ──────────── Storage Defaults ────────────

export interface StorageDefaultsConfig {
  mbDefaultM2Slots: number;
  mbDefaultSataPorts: number;
}

// ──────────── Root Config ────────────

export interface CompatibilityRulesConfig {
  version: string;
  description: string;
  socketCompatibility: SocketCompatibilityConfig;
  formFactorCompatibility: FormFactorCompatibilityConfig;
  ramCompatibility: RamCompatibilityConfig;
  powerCompatibility: PowerCompatibilityConfig;
  dimensionCompatibility: DimensionCompatibilityConfig;
  coolerCompatibility: CoolerCompatibilityConfig;
  bottleneckDetection: BottleneckDetectionConfig;
  performanceWarnings: PerformanceWarningsConfig;
  storageDefaults: StorageDefaultsConfig;
}
