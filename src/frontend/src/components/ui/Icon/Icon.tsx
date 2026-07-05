/**
 * GoldPC Компонент иконок
 * Обёртка вокруг иконок lucide-react с поддержкой темизации GoldPC
 */

import {
  Home,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Search,
  Filter,
  Settings,
  User,
  LogIn,
  LogOut,
  UserPlus,
  ShoppingCart,
  Heart,
  Package,
  CreditCard,
  Trash2,
  Plus,
  Minus,
  Check,
  XCircle,
  AlertCircle,
  Info,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  Battery,
  Power,
  Fan,
  Star,
  StarHalf,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Bell,
  Mail,
  Image,
  FileText,
  Download,
  Upload,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Lock,
  Unlock,
  HelpCircle,
  MoreHorizontal,
  MoreVertical,
  Copy,
  Edit,
  Save,
  RefreshCw,
  Zap,
  Building2,
  Briefcase,
  Wrench,
  TrendingUp,
  Database,
  Box,
  Sun,
  ShieldCheck,
  Users,
  GitCompare,
  LayoutGrid,
  List,
  Table,
} from 'lucide-react';
import React from 'react';
import type { CSSProperties } from 'react';

// Сопоставление названий иконок с иконками lucide
const iconMap = {
  // Навигация и UI
  home: Home,
  menu: Menu,
  close: X,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'external-link': ExternalLink,
  search: Search,
  filter: Filter,
  settings: Settings,
  user: User,
  login: LogIn,
  logout: LogOut,
  'user-plus': UserPlus,
  // E-commerce
  cart: ShoppingCart,
  heart: Heart,
  compare: GitCompare,
  package: Package,
  'credit-card': CreditCard,
  trash: Trash2,
  plus: Plus,
  minus: Minus,
  check: Check,
  'x-circle': XCircle,
  'alert-circle': AlertCircle,
  info: Info,
  // Товары и Техника
  monitor: Monitor,
  cpu: Cpu,
  'hard-drive': HardDrive,
  memory: MemoryStick,
  wifi: Wifi,
  battery: Battery,
  power: Power,
  fan: Fan,
  // Статус и Обратная связь
  star: Star,
  'star-half': StarHalf,
  loader: Loader2,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  bell: Bell,
  mail: Mail,
  // Медиа
  image: Image,
  'file-text': FileText,
  download: Download,
  upload: Upload,
  eye: Eye,
  'eye-off': EyeOff,
  // Разное
  clock: Clock,
  calendar: Calendar,
  'map-pin': MapPin,
  phone: Phone,
  lock: Lock,
  unlock: Unlock,
  'help-circle': HelpCircle,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  copy: Copy,
  edit: Edit,
  save: Save,
  refresh: RefreshCw,
  zap: Zap,
  building: Building2,
  briefcase: Briefcase,
  // Услуги
  wrench: Wrench,
  'trending-up': TrendingUp,
  database: Database,
  box: Box,
  sun: Sun,
  'shield-check': ShieldCheck,
  users: Users,
  grid: LayoutGrid,
  list: List,
  table: Table,
} as const;

/** Все доступные названия иконок */
export type IconName = keyof typeof iconMap;

/** Предопределённые размеры иконок в соответствии с дизайн-системой GoldPC */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Соответствие размеров в пикселях */
const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

/** Цветовая схема GoldPC для иконок */
export type IconColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'gold'
  | 'gold-bright';

/** Соответствие CSS-переменных цветов */
const colorMap: Record<IconColor, string> = {
  default: 'currentColor',
  primary: 'var(--color-text-primary, #FAFAFA)',
  secondary: 'var(--fg-muted, #71717a)',
  accent: 'var(--accent, #d4a574)',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  gold: 'var(--accent, #d4a574)',
  'gold-bright': 'var(--accent-bright, #e8c4a0)',
};

/** Проверка типа: является ли значение допустимым IconColor */
function isIconColor(value: string): value is IconColor {
  return Object.prototype.hasOwnProperty.call(colorMap, value as IconColor);
}

export interface IconProps {
  /** Название иконки для отображения */
  name: IconName;
  /** Предопределённый размер или произвольное значение в пикселях */
  size?: IconSize | number;
  /** Предопределённый цвет из палитры GoldPC или произвольное значение цвета */
  color?: IconColor | string;
  /** Дополнительный CSS-класс */
  className?: string;
  /** Inline-стили */
  style?: CSSProperties;
  /** Доступная метка для скринридеров */
  'aria-label'?: string;
  /** Нужно ли анимировать иконку (например, спиннер) */
  animated?: boolean;
  /** Толщина обводки */
  strokeWidth?: number;
  /** Обработчик клика */
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

/**
 * GoldPC Компонент иконок
 *
 * Обёртка вокруг иконок lucide-react с поддержкой темизации GoldPC.
 * Поддерживает предопределённые размеры и цвета в соответствии с дизайн-системой.
 *
 * @example
 * // Базовое использование с предопределённым размером и цветом
 * <Иконка name="cart" размер="md" color="accent" />
 *
 * @example
 * // Произвольный размер (число в пикселях)
 * <Иконка name="heart" размер={28} color="#ef4444" />
 *
 * @example
 * // Анимированная иконка загрузки
 * <Иконка name="loader" размер="lg" animated />
 *
 * @example
 * // С доступной меткой
 * <Icon name="search" aria-label="Поиск товаров" />
 */
export function Icon({
  name,
  size = 'md',
  color = 'default',
  className,
  style,
  animated = false,
  strokeWidth,
  'aria-label': ariaLabel,
  onClick,
}: IconProps): React.ReactNode {
  const IconComponent = iconMap[name];

  // Определяем размер — либо из предопределённых размеров, либо произвольное число
  const resolvedSize: number = typeof size === 'number' ? size : sizeMap[size];

  // Определяем цвет — либо из предопределённых цветов, либо произвольная строка
  const resolvedColor: string = isIconColor(color) ? colorMap[color] : color;

  // Объединяем стили
  const combinedStyle: CSSProperties = {
    color: resolvedColor,
    ...style,
  };

  // Класс анимации для загрузчика/спиннера
  const animationClass = animated || name === 'loader' ? 'animate-spin' : '';

  const combinedClassName = [className, animationClass].filter(Boolean).join(' ');

  return (
    <IconComponent
      size={resolvedSize}
      strokeWidth={strokeWidth}
      className={combinedClassName}
      style={combinedStyle}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel === undefined}
      role={ariaLabel !== undefined ? 'img' : undefined}
      onClick={onClick}
    />
  );
}

export default Icon;