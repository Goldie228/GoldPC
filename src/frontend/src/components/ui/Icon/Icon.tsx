/**
 * GoldPC Icon Component
 * A wrapper around lucide-react icons with GoldPC theming support
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

// Icon name mapping to lucide icons
const iconMap = {
  // Navigation & UI
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
  // Product & Tech
  monitor: Monitor,
  cpu: Cpu,
  'hard-drive': HardDrive,
  memory: MemoryStick,
  wifi: Wifi,
  battery: Battery,
  power: Power,
  fan: Fan,
  // Status & Feedback
  star: Star,
  'star-half': StarHalf,
  loader: Loader2,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  bell: Bell,
  mail: Mail,
  // Media
  image: Image,
  'file-text': FileText,
  download: Download,
  upload: Upload,
  eye: Eye,
  'eye-off': EyeOff,
  // Misc
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
  // Services
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

/** All available icon names */
export type IconName = keyof typeof iconMap;

/** Predefined icon sizes following GoldPC design system */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Size mappings in pixels */
const sizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

/** GoldPC color scheme for icons */
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

/** Color CSS variable mappings */
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

/** Type guard to check if a value is a valid IconColor */
function isIconColor(value: string): value is IconColor {
  return Object.prototype.hasOwnProperty.call(colorMap, value as IconColor);
}

export interface IconProps {
  /** Name of the icon to display */
  name: IconName;
  /** Predefined size or custom pixel value */
  size?: IconSize | number;
  /** Predefined color from GoldPC palette or custom color value */
  color?: IconColor | string;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** Whether to animate the icon (e.g., spinner) */
  animated?: boolean;
  /** Stroke width */
  strokeWidth?: number;
  /** Click handler */
  onClick?: React.MouseEventHandler<SVGSVGElement>;
}

/**
 * GoldPC Icon Component
 *
 * A wrapper around lucide-react icons with GoldPC theming support.
 * Supports predefined sizes and colors following the design system.
 *
 * @example
 * // Basic usage with predefined size and color
 * <Icon name="cart" size="md" color="accent" />
 *
 * @example
 * // Custom size (number in pixels)
 * <Icon name="heart" size={28} color="#ef4444" />
 *
 * @example
 * // Animated loader icon
 * <Icon name="loader" size="lg" animated />
 *
 * @example
 * // With accessible label
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

  // Resolve size - either from predefined sizes or custom number
  const resolvedSize: number = typeof size === 'number' ? size : sizeMap[size];

  // Resolve color - either from predefined colors or custom string
  const resolvedColor: string = isIconColor(color) ? colorMap[color] : color;

  // Combine styles
  const combinedStyle: CSSProperties = {
    color: resolvedColor,
    ...style,
  };

  // Animation class for loader/spinner
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