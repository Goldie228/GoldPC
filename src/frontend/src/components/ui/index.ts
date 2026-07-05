/**
 * Библиотека UI компонентов GoldPC
 * Переиспользуемые UI компоненты
 */

// Компонент кнопки (роскошный стиль GoldPC)
export { Button, default as ButtonDefault } from './Button';
export type { ButtonProps } from './Button';

// Компонент карточки
export { Card, default as CardDefault } from './Card';
export type { CardProps, CardVariant } from './Card';

// Компонент ввода
export { Input } from './Input';

// Поле пароля с переключателем видимости
export { PasswordField } from './PasswordField';
export type { PasswordFieldProps } from './PasswordField';

// Компонент иконки
export { Icon, default as IconDefault } from './Icon';
export type { IconProps, IconName, IconSize } from './Icon';

// Компонент модального окна
export { Modal } from './Modal';
export type { ModalProps, ModalSize } from './Modal';

// Компонент уведомлений
export { Toast, ToastContainer } from './Toast';

// Компонент скелетона
export { Skeleton, ProductCardSkeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

// Состояние ошибки API
export { ApiErrorBanner } from './ApiErrorBanner';
export type { ApiErrorBannerProps } from './ApiErrorBanner';

// Компонент прокрутки вверх
export { ScrollToTop } from './ScrollToTop';

// Компонент вкладок
export { Tabs, default as TabsDefault } from './Tabs';
export type { TabsProps, Tab } from './Tabs';

// Компонент ввода телефона
export { PhoneInput } from './PhoneInput';

// Компонент героя страницы
export { PageHero } from './PageHero';

// Компонент блока иконки
export { IconBox } from './IconBox';

// Компонент значка статуса
export { StatusBadge } from './StatusBadge';
export type { StatusVariant } from './StatusBadge';

// Компонент карточки статистики
export { StatCard } from './StatCard';

// Компонент нижней панели
export { BottomSheet } from './BottomSheet';
export type { BottomSheetProps } from './BottomSheet';

// Компонент загрузки изображений
export { ImageUpload } from './ImageUpload/ImageUpload';

// Компонент переключателя
export { ToggleSwitch } from './ToggleSwitch';

// Компонент карточки раздела
export { SectionCard } from './SectionCard';
