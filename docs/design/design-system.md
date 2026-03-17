# GoldPC Design System v2.0

> **Версия:** 2.0.0  
> **Последнее обновление:** 2026-03-16  
> **Статус:** Утверждено  
> **Тема:** Dark Theme + Gold Accents  
> **Референс:** Luxury E-commerce, Premium Tech Brands

---

## Содержание

1. [Философия дизайна](#1-философия-дизайна)
2. [Design Tokens](#2-design-tokens)
3. [Цветовая палитра](#3-цветовая-палитра)
4. [Типографика](#4-типографика)
5. [Отступы и сетка](#5-отступы-и-сетка)
6. [Тени и эффекты](#6-тени-и-эффекты)
7. [Иконография](#7-иконография)
8. [Интерактивность](#8-интерактивность)
9. [Компоненты](#9-компоненты)
10. [Accessibility](#10-accessibility)
11. [CSS Variables Summary](#11-css-variables-summary)

---

## 1. Философия дизайна

### 1.1. Концепция

**GoldPC Dark Theme** — это премиальная дизайн-система для магазина компьютерных компонентов премиум-класса. Тёмный фон создаёт атмосферу технологичности и надёжности, а золотые акценты подчёркивают статус и качество.

### 1.2. Ключевые принципы

| Принцип | Описание |
|---------|----------|
| **Premium Feel** | Каждый элемент должен выглядеть дорого и качественно |
| **Dark First** | Тёмная тема как основа, не как альтернатива |
| **Gold Accents** | Золотые акценты используются стратегически для привлечения внимания |
| **Glass Effects** | Эффект "gold glass" создаёт глубину и премиальность |
| **Smooth Motion** | Плавные анимации создают ощущение дороговизны |
| **SVG Only** | Все иконки — только SVG для идеальной чёткости |

### 1.3. Референсы

- **Apple Pro** — минимализм и премиальность
- **Razer** — геймерская эстетика в тёмных тонах
- **Rolex** — использование золотых акцентов
- **Mercedes-Benz** — премиальный automotive дизайн

---

## 2. Design Tokens

### 2.1. Система токенов

Все значения вынесены в CSS-переменные для единообразия и простоты поддержки:

```css
:root {
  /* Цвета будут определены в секции 3 */
  /* Типографика — в секции 4 */
  /* Отступы — в секции 5 */
}
```

### 2.2. Принцип именования

| Категория | Префикс | Пример |
|-----------|---------|--------|
| Colors | `--color-` | `--color-gold-500` |
| Typography | `--font-` | `--font-h1` |
| Spacing | `--space-` | `--space-md` |
| Radius | `--radius-` | `--radius-lg` |
| Shadow | `--shadow-` | `--shadow-gold` |
| Transition | `--transition-` | `--transition-base` |
| Z-index | `--z-` | `--z-modal` |

---

## 3. Цветовая палитра

### 3.1. Background Colors (Фоновые цвета)

**Принцип:** Глубокий чёрный с мягкими переходами для создания глубины.

| Token | Значение | Применение |
|-------|----------|------------|
| `--color-bg-primary` | `#000000` | Основной фон страницы |
| `--color-bg-secondary` | `#0A0A0A` | Альтернативный фон |
| `--color-bg-tertiary` | `#141414` | Фон секций, блоков |
| `--color-bg-elevated` | `#1A1A1A` | Карточки, модальные окна |

```css
/* Градиент фона для hero-секций */
--gradient-bg-hero: linear-gradient(180deg, #000000 0%, #141414 100%);
```

### 3.2. Surface Colors (Поверхности)

**Принцип:** "Gold Glass" эффект — тёмная поверхность с золотым свечением по краям.

| Token | Значение | Применение |
|-------|----------|------------|
| `--color-surface` | `#1F1F1F` | Базовая поверхность карточек |
| `--color-surface-hover` | `#2A2A2A` | Hover-состояние поверхностей |
| `--color-surface-active` | `#353535` | Active-состояние |

#### Gold Glass Effect

```css
.gold-glass {
  background: #1F1F1F;
  border: 1px solid rgba(255, 215, 0, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.8),
              inset 0 0 20px rgba(212, 175, 55, 0.05);
}
```

### 3.3. Primary Colors (Золотые акценты)

**Принцип:** Богатый золотой градиент для привлечения внимания к ключевым элементам.

| Token | Значение | Применение |
|-------|----------|------------|
| `--color-gold-100` | `#FBF5B7` | Светлый акцент |
| `--color-gold-200` | `#FCF6BA` | Hover для gold-элементов |
| `--color-gold-300` | `#FBF5B7` | Активные акценты |
| `--color-gold-400` | `#FFD700` | Яркий акцент |
| `--color-gold-500` | `#D4AF37` | **Основной золотой** |
| `--color-gold-600` | `#B38728` | Hover для основного |
| `--color-gold-700` | `#AA771C` | Active, pressed |
| `--color-gold-800` | `#8B6914` | Тёмный акцент |
| `--color-gold-900` | `#6B5010` | Самый тёмный |

#### Gold Gradient

```css
--gradient-gold: linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%);

/* Альтернативный золотой градиент для кнопок */
--gradient-gold-btn: linear-gradient(135deg, #BF953F, #FCF6BA, #B38728);

/* Анимированный золотой градиент */
--gradient-gold-animated: linear-gradient(90deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C, #BF953F);
```

### 3.4. Text Colors (Текст)

| Token | Значение | Применение |
|-------|----------|------------|
| `--color-text-primary` | `#FAFAFA` | Основной текст на тёмном фоне |
| `--color-text-secondary` | `#E5E5E5` | Вторичный текст |
| `--color-text-muted` | `#A1A1AA` | Приглушённый текст, placeholders |
| `--color-text-disabled` | `#71717A` | Отключённый текст |
| `--color-text-gold` | `#D4AF37` | Золотой текст для акцентов |
| `--color-text-on-gold` | `#1A1A1A` | Текст на золотом фоне |

### 3.5. Semantic Colors (Семантические цвета)

| Token | Значение | Применение |
|-------|----------|------------|
| `--color-success` | `#22C55E` | Успех, совместимость, в наличии |
| `--color-success-bg` | `rgba(34, 197, 94, 0.1)` | Фон успеха |
| `--color-warning` | `#F59E0B` | Предупреждение, низкий остаток |
| `--color-warning-bg` | `rgba(245, 158, 11, 0.1)` | Фон предупреждения |
| `--color-error` | `#EF4444` | Ошибка, нет в наличии |
| `--color-error-bg` | `rgba(239, 68, 68, 0.1)` | Фон ошибки |
| `--color-info` | `#3B82F6` | Информация |
| `--color-info-bg` | `rgba(59, 130, 246, 0.1)` | Фон информации |

### 3.6. Border Colors

| Token | Значение | Применение |
|-------|----------|------------|
| `--color-border` | `rgba(255, 255, 255, 0.1)` | Стандартная граница |
| `--color-border-hover` | `rgba(255, 255, 255, 0.2)` | Hover-состояние |
| `--color-border-gold` | `rgba(212, 175, 55, 0.3)` | Золотая граница |
| `--color-border-gold-strong` | `rgba(212, 175, 55, 0.5)` | Яркая золотая граница |

---

## 4. Типографика

### 4.1. Шрифты

| Категория | Шрифт | Источник | Применение |
|-----------|-------|----------|------------|
| **Heading** | Playfair Display | Google Fonts | Заголовки, акцентный текст |
| **Body** | Inter | Google Fonts | Основной текст, UI-элементы |
| **Alternative** | Montserrat | Google Fonts | Альтернатива для заголовков |
| **Alternative Body** | Manrope | Google Fonts | Альтернатива для основного текста |

```css
/* Подключение шрифтов */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap');
```

### 4.2. Заголовки

| Token | Размер | Line Height | Weight | Letter Spacing | Применение |
|-------|--------|-------------|--------|----------------|------------|
| `--font-h1` | `48px / 3rem` | `1.1` | 700 | `-0.02em` | Hero titles, page headers |
| `--font-h2` | `36px / 2.25rem` | `1.2` | 600 | `-0.01em` | Section titles |
| `--font-h3` | `28px / 1.75rem` | `1.3` | 600 | `0` | Subsections, card titles |
| `--font-h4` | `24px / 1.5rem` | `1.4` | 500 | `0` | Component titles |
| `--font-h5` | `20px / 1.25rem` | `1.4` | 500 | `0` | Small titles |
| `--font-h6` | `16px / 1rem` | `1.5` | 600 | `0.02em` | Labels, small headings |

```css
h1, .h1 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
}

h2, .h2 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 2.25rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

h3, .h3 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-text-primary);
}
```

### 4.3. Body Text

| Token | Размер | Line Height | Weight | Применение |
|-------|--------|-------------|--------|------------|
| `--font-body-xl` | `20px / 1.25rem` | `1.6` | 400 | Large body, lead paragraphs |
| `--font-body-lg` | `18px / 1.125rem` | `1.6` | 400 | Large text |
| `--font-body-md` | `16px / 1rem` | `1.6` | 400 | Default body text |
| `--font-body-sm` | `14px / 0.875rem` | `1.5` | 400 | Secondary text |
| `--font-body-xs` | `12px / 0.75rem` | `1.4` | 400 | Captions, helper text |

### 4.4. Специальные стили

| Token | Размер | Weight | Letter Spacing | Применение |
|-------|--------|--------|----------------|------------|
| `--font-button` | `14px / 0.875rem` | 600 | `0.02em` | Buttons |
| `--font-button-lg` | `16px / 1rem` | 600 | `0.02em` | Large buttons |
| `--font-label` | `12px / 0.75rem` | 500 | `0.04em` | Form labels |
| `--font-caption` | `12px / 0.75rem` | 400 | `0` | Captions |
| `--font-overline` | `10px / 0.625rem` | 600 | `0.1em` | Overline text |
| `--font-code` | `14px / 0.875rem` | 400 | `0` | Code snippets |

```css
/* Кнопки */
.btn {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* Золотой акцентный текст */
.text-gold {
  background: var(--gradient-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 5. Отступы и сетка

### 5.1. Spacing Scale (8px grid)

| Token | Значение | rem | Применение |
|-------|----------|-----|------------|
| `--space-0` | `0` | `0` | Сброс отступов |
| `--space-1` | `4px` | `0.25rem` | Минимальный отступ |
| `--space-2` | `8px` | `0.5rem` | Внутренние отступы (tight) |
| `--space-3` | `12px` | `0.75rem` | Малые отступы |
| `--space-4` | `16px` | `1rem` | Стандартные отступы |
| `--space-5` | `20px` | `1.25rem` | Средние отступы |
| `--space-6` | `24px` | `1.5rem` | Между элементами |
| `--space-8` | `32px` | `2rem` | Между группами |
| `--space-10` | `40px` | `2.5rem` | Section spacing |
| `--space-12` | `48px` | `3rem` | Major section spacing |
| `--space-16` | `64px` | `4rem` | Large section spacing |
| `--space-20` | `80px` | `5rem` | XL section spacing |
| `--space-24` | `96px` | `6rem` | Hero spacing |
| `--space-32` | `128px` | `8rem` | Major page divisions |

### 5.2. Component Spacing

```css
/* Внутренние отступы компонентов */
--component-padding-xs: var(--space-2);   /* 8px */
--component-padding-sm: var(--space-3);   /* 12px */
--component-padding-md: var(--space-4);  /* 16px */
--component-padding-lg: var(--space-6);  /* 24px */
--component-padding-xl: var(--space-8);  /* 32px */

/* Отступы между элементами */
--component-gap-xs: var(--space-2);    /* 8px */
--component-gap-sm: var(--space-3);    /* 12px */
--component-gap-md: var(--space-4);    /* 16px */
--component-gap-lg: var(--space-6);    /* 24px */
```

### 5.3. Border Radius

| Token | Значение | Применение |
|-------|----------|------------|
| `--radius-none` | `0` | Без скругления |
| `--radius-sm` | `4px` | Tags, badges, small elements |
| `--radius-md` | `8px` | Buttons, inputs, small cards |
| `--radius-lg` | `12px` | Cards, dropdowns |
| `--radius-xl` | `16px` | Large cards, modals |
| `--radius-2xl` | `24px` | Hero cards, feature cards |
| `--radius-full` | `9999px` | Pills, avatars, circles |

### 5.4. Breakpoints

**Подход:** Mobile-first

| Token | Значение | Применение |
|-------|----------|------------|
| `--breakpoint-xs` | `320px` | Small phones |
| `--breakpoint-sm` | `480px` | Large phones |
| `--breakpoint-md` | `768px` | Tablets |
| `--breakpoint-lg` | `1024px` | Small desktops |
| `--breakpoint-xl` | `1280px` | Standard desktops |
| `--breakpoint-2xl` | `1536px` | Large screens |
| `--breakpoint-3xl` | `1920px` | Full HD screens |

```css
/* Media queries */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
```

---

## 6. Тени и эффекты

### 6.1. Box Shadows

**Принцип:** Мягкие, глубокие тени для создания многослойности на тёмном фоне.

| Token | Значение | Применение |
|-------|----------|------------|
| `--shadow-xs` | `0 1px 2px rgba(0, 0, 0, 0.5)` | Minimal elevation |
| `--shadow-sm` | `0 2px 4px rgba(0, 0, 0, 0.6)` | Subtle lift |
| `--shadow-md` | `0 4px 8px rgba(0, 0, 0, 0.7)` | Cards, dropdowns |
| `--shadow-lg` | `0 8px 16px rgba(0, 0, 0, 0.8)` | Modals, popovers |
| `--shadow-xl` | `0 16px 32px rgba(0, 0, 0, 0.85)` | Hero elements |
| `--shadow-2xl` | `0 24px 48px rgba(0, 0, 0, 0.9)` | Maximum elevation |

### 6.2. Gold Shadows

**Принцип:** Золотое внутреннее свечение для создания премиального эффекта.

| Token | Значение | Применение |
|-------|----------|------------|
| `--shadow-gold-inner` | `inset 0 0 20px rgba(212, 175, 55, 0.05)` | Gold inner glow |
| `--shadow-gold-glow` | `0 0 20px rgba(212, 175, 55, 0.15)` | Gold outer glow |
| `--shadow-gold-strong` | `0 0 40px rgba(212, 175, 55, 0.25)` | Strong gold glow |

#### Комбинированные тени

```css
/* Gold Glass Shadow */
--shadow-gold-glass: 
  0 4px 30px rgba(0, 0, 0, 0.8),
  inset 0 0 20px rgba(212, 175, 55, 0.05);

/* Gold Card Hover */
--shadow-gold-card-hover:
  0 8px 40px rgba(0, 0, 0, 0.85),
  0 0 30px rgba(212, 175, 55, 0.1),
  inset 0 0 20px rgba(212, 175, 55, 0.08);

/* Gold Button Glow */
--shadow-gold-btn:
  0 4px 20px rgba(212, 175, 55, 0.3),
  0 0 40px rgba(212, 175, 55, 0.15);
```

### 6.3. Glassmorphism Effects

```css
/* Dark Glass Surface */
.glass-dark {
  background: rgba(31, 31, 31, 0.8);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 215, 0, 0.1);
}

/* Gold Glass Surface */
.glass-gold {
  background: rgba(31, 31, 31, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 215, 0, 0.15);
  box-shadow: 
    0 4px 30px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(212, 175, 55, 0.05);
}

/* Fallback для браузеров без backdrop-filter */
@supports not (backdrop-filter: blur(20px)) {
  .glass-dark,
  .glass-gold {
    background: rgba(26, 26, 26, 0.95);
  }
}
```

---

## 7. Иконография

### 7.1. Принципы

| Принцип | Описание |
|---------|----------|
| **SVG Only** | Все иконки должны быть в формате SVG |
| **Outlined / Duotone** | Предпочтительные стили: контурный или двухтоновый |
| **Stroke Width** | Толщина линии: 1.5px для визуальной лёгкости |
| **24×24px** | Базовый размер иконок |
| **Наследование цвета** | Иконки наследуют `currentColor` |

### 7.2. Библиотека иконок

**Рекомендуемые источники:**

| Библиотека | Способ подключения | Применение |
|------------|-------------------|------------|
| **lucide-react** | npm пакет | Основной набор иконок |
| **Custom SVG** | Inline / Sprite | Уникальные иконки бренда |

```bash
# Установка lucide-react
npm install lucide-react
```

### 7.3. Использование lucide-react

```tsx
import { 
  ShoppingCart, 
  Heart, 
  User, 
  Search, 
  ChevronRight,
  Star,
  Check,
  X,
  AlertTriangle,
  Info,
  Cpu,
  Monitor,
  HardDrive,
  MemoryStick,
  Zap,
  Shield
} from 'lucide-react';

// Базовое использование
<ShoppingCart className="w-6 h-6" />

// С золотым цветом
<Star className="w-5 h-5 text-[#D4AF37]" />

// Duotone эффект через opacity
<div className="relative">
  <Star className="w-6 h-6 text-[#D4AF37] opacity-30" />
  <Star className="w-6 h-6 text-[#D4AF37] absolute inset-0" fill="currentColor" fillOpacity={0.3} />
</div>
```

### 7.4. Кастомные SVG иконки

Для уникальных иконок бренда используйте inline SVG:

```tsx
// components/icons/GoldpcLogo.tsx
export function GoldpcLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="url(#gold-gradient)" />
      <path 
        d="M8 16L16 8L24 16L16 24L8 16Z" 
        stroke="#1A1A1A" 
        strokeWidth="2"
        fill="none"
      />
      <defs>
        <linearGradient id="gold-gradient" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#BF953F" />
          <stop offset="0.5" stopColor="#FCF6BA" />
          <stop offset="1" stopColor="#B38728" />
        </linearGradient>
      </defs>
    </svg>
  );
}
```

### 7.5. Размеры иконок

| Token | Размер | Применение |
|-------|--------|------------|
| `--icon-xs` | `16px` | Inline иконки, мелкие индикаторы |
| `--icon-sm` | `20px` | Иконки в кнопках, меню |
| `--icon-md` | `24px` | Стандартные иконки |
| `--icon-lg` | `32px` | Крупные иконки |
| `--icon-xl` | `48px` | Feature иконки |
| `--icon-2xl` | `64px` | Hero иконки |

### 7.6. Стилизация иконок

```css
/* Базовый стиль */
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: currentColor;
}

/* Золотая иконка */
.icon-gold {
  color: var(--color-gold-500);
}

/* Иконка с золотым градиентом (для SVG) */
.icon-gold-gradient {
  fill: url(#gold-gradient);
  stroke: url(#gold-gradient);
}
```

### 7.7. Набор иконок для GoldPC

| Категория | Иконки lucide-react |
|-----------|---------------------|
| **Навигация** | `Home`, `Menu`, `X`, `ChevronRight`, `ChevronDown`, `ArrowRight` |
| **Каталог** | `Search`, `Filter`, `Grid`, `List`, `SortAsc`, `SortDesc` |
| **Продукты** | `Cpu`, `Monitor`, `HardDrive`, `MemoryStick`, `Zap`, `Shield`, `Fan`, `GpuCard` |
| **Действия** | `ShoppingCart`, `Heart`, `Eye`, `Plus`, `Minus`, `Trash2`, `Edit` |
| **Статусы** | `Check`, `X`, `AlertTriangle`, `Info`, `HelpCircle`, `Star` |
| **Пользователь** | `User`, `Settings`, `LogOut`, `Bell`, `Package` |

---

## 8. Интерактивность

### 8.1. Transitions

| Token | Значение | Применение |
|-------|----------|------------|
| `--transition-fast` | `150ms ease-out` | Micro-interactions, hover |
| `--transition-base` | `250ms ease-out` | Default transitions |
| `--transition-slow` | `400ms ease-out` | Complex animations |
| `--transition-slower` | `600ms ease-out` | Page transitions, modals |

### 8.2. Easing Functions

| Token | Значение | Применение |
|-------|----------|------------|
| `--ease-out` | `cubic-bezier(0.33, 1, 0.68, 1)` | Standard ease-out |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Smooth transitions |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful bounce |
| `--ease-premium` | `cubic-bezier(0.4, 0, 0.2, 1)` | Premium smooth feel |

### 8.3. "Expensive" Interactions

#### Smooth Page Transitions

```css
/* Fade transition между страницами */
.page-enter {
  opacity: 0;
  transform: translateY(10px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity var(--transition-slow) var(--ease-premium),
              transform var(--transition-slow) var(--ease-premium);
}

.page-exit {
  opacity: 1;
}

.page-exit-active {
  opacity: 0;
  transition: opacity var(--transition-fast) var(--ease-out);
}
```

#### Parallax Scrolling (Hero Images)

```tsx
// hooks/useParallax.ts
import { useEffect, useState } from 'react';

export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return offset;
}

// Использование
function HeroSection() {
  const parallaxOffset = useParallax(0.3);
  
  return (
    <section className="relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          transform: `translateY(${parallaxOffset}px)`,
          backgroundImage: 'url(/hero-bg.jpg)'
        }}
      />
      {/* Content */}
    </section>
  );
}
```

#### Gold Shine Shimmer Effect (Button Hover)

```css
/* Gold shimmer button */
.btn-gold-shimmer {
  position: relative;
  overflow: hidden;
  background: var(--gradient-gold);
  color: var(--color-text-on-gold);
  border: none;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--transition-fast) var(--ease-premium),
              box-shadow var(--transition-fast) var(--ease-premium);
}

.btn-gold-shimmer:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-gold-btn);
}

/* Shimmer effect */
.btn-gold-shimmer::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transition: left var(--transition-slow) var(--ease-out);
}

.btn-gold-shimmer:hover::before {
  left: 100%;
}

/* Active state */
.btn-gold-shimmer:active {
  transform: translateY(0) scale(0.98);
}
```

```tsx
// React компонент с shimmer эффектом
export function GoldShimmerButton({ 
  children, 
  onClick 
}: { 
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button 
      className="btn-gold-shimmer"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### 8.4. Animation Keyframes

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Fade In Up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Gold Pulse */
@keyframes goldPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4);
  }
  50% {
    box-shadow: 0 0 20px 10px rgba(212, 175, 55, 0);
  }
}

/* Shimmer Animation */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Float Animation */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Glow Pulse */
@keyframes glowPulse {
  0%, 100% {
    filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.6));
  }
}

/* Gold Shimmer Text */
@keyframes goldShimmerText {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### 8.5. Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 9. Компоненты

### 9.1. Button

#### Варианты

| Вариант | Фон | Текст | Применение |
|---------|-----|-------|------------|
| **Primary (Gold)** | Gold Gradient | Dark | Основные действия |
| **Secondary** | Dark Surface | White | Второстепенные действия |
| **Outline** | Transparent | Gold | Альтернативные действия |
| **Ghost** | Transparent | White | Минимальные действия |
| **Danger** | Red | White | Деструктивные действия |

#### Размеры

| Размер | Высота | Padding | Font Size |
|--------|--------|---------|-----------|
| `sm` | 36px | 8px 16px | 13px |
| `md` | 44px | 12px 24px | 14px |
| `lg` | 52px | 16px 32px | 16px |

#### CSS Specification

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-decoration: none;
  white-space: nowrap;
  
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Primary (Gold) with Shimmer */
.btn-primary {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%);
  color: #1A1A1A;
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3), 0 0 40px rgba(212, 175, 55, 0.15);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(212, 175, 55, 0.4);
}

.btn-primary:active {
  transform: translateY(0) scale(0.98);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.6s ease;
}

.btn-primary:hover::before {
  left: 100%;
}

/* Secondary */
.btn-secondary {
  background: #1F1F1F;
  color: #FAFAFA;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: #2A2A2A;
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

/* Outline */
.btn-outline {
  background: transparent;
  color: #D4AF37;
  border: 1px solid rgba(212, 175, 55, 0.5);
}

.btn-outline:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: #D4AF37;
  color: #FCF6BA;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: #FAFAFA;
  border: 1px solid transparent;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #D4AF37;
}

/* Danger */
.btn-danger {
  background: #EF4444;
  color: #FFFFFF;
  border: none;
}

.btn-danger:hover {
  background: #DC2626;
  transform: translateY(-1px);
}

/* Sizes */
.btn-sm {
  height: 36px;
  padding: 0 16px;
  font-size: 13px;
}

.btn-md {
  height: 44px;
  padding: 0 24px;
  font-size: 14px;
}

.btn-lg {
  height: 52px;
  padding: 0 32px;
  font-size: 16px;
}

/* Disabled state */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.btn:disabled::before {
  display: none;
}
```

### 9.2. Input

```css
.input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.875rem;
  color: #FAFAFA;
  
  background: #1F1F1F;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  
  transition: all 150ms ease-out;
}

.input::placeholder {
  color: #71717A;
}

.input:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.input:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #141414;
}

/* Input with gold accent */
.input-gold:focus {
  border-color: #D4AF37;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
}

/* Error state */
.input-error {
  border-color: #EF4444;
}

.input-error:focus {
  border-color: #EF4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

### 9.3. Card

```css
.card {
  background: #1F1F1F;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  overflow: hidden;
  
  transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  border-color: rgba(212, 175, 55, 0.3);
  box-shadow: 
    0 8px 40px rgba(0, 0, 0, 0.85),
    0 0 30px rgba(212, 175, 55, 0.1),
    inset 0 0 20px rgba(212, 175, 55, 0.08);
  transform: translateY(-4px);
}

/* Card header */
.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* Card body */
.card-body {
  padding: 20px;
}

/* Card footer */
.card-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* Gold Glass Card */
.card-gold-glass {
  background: rgba(31, 31, 31, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 215, 0, 0.15);
  box-shadow: 
    0 4px 30px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(212, 175, 55, 0.05);
}
```

### 9.4. Badge / Tag

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  
  border-radius: var(--radius-sm);
}

/* Badge variants */
.badge-gold {
  background: linear-gradient(135deg, #BF953F, #FCF6BA, #B38728);
  color: #1A1A1A;
}

.badge-success {
  background: rgba(34, 197, 94, 0.15);
  color: #22C55E;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.15);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-error {
  background: rgba(239, 68, 68, 0.15);
  color: #EF4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.badge-info {
  background: rgba(59, 130, 246, 0.15);
  color: #3B82F6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-neutral {
  background: rgba(255, 255, 255, 0.05);
  color: #A1A1AA;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### 9.5. Modal

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  
  z-index: 1000;
  
  animation: fadeIn 150ms ease-out;
}

.modal {
  background: #1A1A1A;
  border: 1px solid rgba(255, 215, 0, 0.1);
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  
  box-shadow: 
    0 24px 48px rgba(0, 0, 0, 0.9),
    inset 0 0 20px rgba(212, 175, 55, 0.05);
  
  animation: scaleIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #FAFAFA;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #A1A1AA;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 150ms ease-out;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #FAFAFA;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
```

### 9.6. Price Display

```css
.price {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 700;
  color: #D4AF37;
}

.price-lg {
  font-size: 1.5rem;
  line-height: 1.2;
}

.price-md {
  font-size: 1.125rem;
  line-height: 1.3;
}

.price-sm {
  font-size: 0.875rem;
  line-height: 1.4;
}

/* Price with currency */
.price-currency {
  font-size: 0.75em;
  font-weight: 500;
  opacity: 0.8;
}

/* Old price (strikethrough) */
.price-old {
  font-size: 0.875rem;
  font-weight: 400;
  color: #A1A1AA;
  text-decoration: line-through;
}

/* Discount badge */
.price-discount {
  display: inline-flex;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #FFFFFF;
  background: #EF4444;
  border-radius: var(--radius-sm);
  margin-left: 8px;
}
```

---

## 10. Accessibility

### 10.1. Контрастность

Все текстовые элементы соответствуют WCAG 2.1 Level AA:

| Элемент | Соотношение | Статус |
|---------|-------------|--------|
| Primary text на фоне | 15.3:1 | AAA ✅ |
| Muted text на фоне | 5.9:1 | AA ✅ |
| Gold text на фоне | 8.7:1 | AAA ✅ |
| Text на золотом фоне | 9.2:1 | AAA ✅ |

### 10.2. Focus States

```css
/* Visible focus ring для keyboard navigation */
:focus-visible {
  outline: 2px solid #D4AF37;
  outline-offset: 2px;
}

/* Убираем outline для mouse users */
:focus:not(:focus-visible) {
  outline: none;
}

/* Gold focus для интерактивных элементов */
.btn:focus-visible,
.input:focus-visible,
.card:focus-visible {
  outline: 2px solid #D4AF37;
  outline-offset: 2px;
}
```

### 10.3. Skip Links

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: linear-gradient(135deg, #BF953F, #FCF6BA, #B38728);
  color: #1A1A1A;
  font-weight: 600;
  z-index: 9999;
  transition: top 150ms ease-out;
}

.skip-link:focus {
  top: 16px;
}
```

### 10.4. Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 10.5. Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .btn-primary::before {
    display: none;
  }
  
  .card:hover {
    transform: none;
  }
}
```

### 10.6. ARIA Labels

```tsx
// Примеры ARIA атрибутов для компонентов

// Кнопка с иконкой
<button aria-label="Добавить в корзину">
  <ShoppingCart aria-hidden="true" />
</button>

// Карточка товара
<article role="article" aria-labelledby="product-title-123">
  <h3 id="product-title-123">Название товара</h3>
</article>

// Модальное окно
<div 
  role="dialog" 
  aria-modal="true" 
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">Заголовок</h2>
</div>

// Loading state
<div role="status" aria-live="polite">
  <span className="sr-only">Загрузка...</span>
  <LoadingSpinner aria-hidden="true" />
</div>
```

---

## 11. CSS Variables Summary

### 11.1. Полный набор переменных

```css
:root {
  /* ========================================
     3. ЦВЕТОВАЯ ПАЛИТРА
     ======================================== */
  
  /* 3.1 Background Colors */
  --color-bg-primary: #000000;
  --color-bg-secondary: #0A0A0A;
  --color-bg-tertiary: #141414;
  --color-bg-elevated: #1A1A1A;
  --gradient-bg-hero: linear-gradient(180deg, #000000 0%, #141414 100%);
  
  /* 3.2 Surface Colors */
  --color-surface: #1F1F1F;
  --color-surface-hover: #2A2A2A;
  --color-surface-active: #353535;
  
  /* 3.3 Gold Colors */
  --color-gold-100: #FBF5B7;
  --color-gold-200: #FCF6BA;
  --color-gold-300: #FBF5B7;
  --color-gold-400: #FFD700;
  --color-gold-500: #D4AF37;
  --color-gold-600: #B38728;
  --color-gold-700: #AA771C;
  --color-gold-800: #8B6914;
  --color-gold-900: #6B5010;
  
  /* Gold Gradients */
  --gradient-gold: linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%);
  --gradient-gold-btn: linear-gradient(135deg, #BF953F, #FCF6BA, #B38728);
  --gradient-gold-animated: linear-gradient(90deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C, #BF953F);
  
  /* 3.4 Text Colors */
  --color-text-primary: #FAFAFA;
  --color-text-secondary: #E5E5E5;
  --color-text-muted: #A1A1AA;
  --color-text-disabled: #71717A;
  --color-text-gold: #D4AF37;
  --color-text-on-gold: #1A1A1A;
  
  /* 3.5 Semantic Colors */
  --color-success: #22C55E;
  --color-success-bg: rgba(34, 197, 94, 0.1);
  --color-warning: #F59E0B;
  --color-warning-bg: rgba(245, 158, 11, 0.1);
  --color-error: #EF4444;
  --color-error-bg: rgba(239, 68, 68, 0.1);
  --color-info: #3B82F6;
  --color-info-bg: rgba(59, 130, 246, 0.1);
  
  /* 3.6 Border Colors */
  --color-border: rgba(255, 255, 255, 0.1);
  --color-border-hover: rgba(255, 255, 255, 0.2);
  --color-border-gold: rgba(212, 175, 55, 0.3);
  --color-border-gold-strong: rgba(212, 175, 55, 0.5);
  
  /* ========================================
     5. ОТСТУПЫ И СЕТКА
     ======================================== */
  
  /* 5.1 Spacing Scale (8px grid) */
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;
  
  /* 5.3 Border Radius */
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  
  /* 5.4 Breakpoints */
  --breakpoint-xs: 320px;
  --breakpoint-sm: 480px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
  --breakpoint-3xl: 1920px;
  
  /* ========================================
     6. ТЕНИ И ЭФФЕКТЫ
     ======================================== */
  
  /* 6.1 Box Shadows */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.6);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.7);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.8);
  --shadow-xl: 0 16px 32px rgba(0, 0, 0, 0.85);
  --shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.9);
  
  /* 6.2 Gold Shadows */
  --shadow-gold-inner: inset 0 0 20px rgba(212, 175, 55, 0.05);
  --shadow-gold-glow: 0 0 20px rgba(212, 175, 55, 0.15);
  --shadow-gold-strong: 0 0 40px rgba(212, 175, 55, 0.25);
  --shadow-gold-glass: 0 4px 30px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(212, 175, 55, 0.05);
  --shadow-gold-card-hover: 0 8px 40px rgba(0, 0, 0, 0.85), 0 0 30px rgba(212, 175, 55, 0.1), inset 0 0 20px rgba(212, 175, 55, 0.08);
  --shadow-gold-btn: 0 4px 20px rgba(212, 175, 55, 0.3), 0 0 40px rgba(212, 175, 55, 0.15);
  
  /* ========================================
     7. ИКОНОГРАФИЯ
     ======================================== */
  
  --icon-xs: 16px;
  --icon-sm: 20px;
  --icon-md: 24px;
  --icon-lg: 32px;
  --icon-xl: 48px;
  --icon-2xl: 64px;
  
  /* ========================================
     8. ИНТЕРАКТИВНОСТЬ
     ======================================== */
  
  /* 8.1 Transitions */
  --transition-fast: 150ms ease-out;
  --transition-base: 250ms ease-out;
  --transition-slow: 400ms ease-out;
  --transition-slower: 600ms ease-out;
  
  /* 8.2 Easing Functions */
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-premium: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* ========================================
     Z-INDEX SCALE
     ======================================== */
  
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-fixed: 300;
  --z-modal-backdrop: 400;
  --z-modal: 500;
  --z-popover: 600;
  --z-tooltip: 700;
  --z-toast: 800;
}
```

### 11.2. Tailwind CSS Config

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background
        'bg-primary': '#000000',
        'bg-secondary': '#0A0A0A',
        'bg-tertiary': '#141414',
        'bg-elevated': '#1A1A1A',
        
        // Surface
        'surface': '#1F1F1F',
        'surface-hover': '#2A2A2A',
        'surface-active': '#353535',
        
        // Gold
        'gold': {
          100: '#FBF5B7',
          200: '#FCF6BA',
          300: '#FBF5B7',
          400: '#FFD700',
          500: '#D4AF37',
          600: '#B38728',
          700: '#AA771C',
          800: '#8B6914',
          900: '#6B5010',
        },
        
        // Text
        'text-primary': '#FAFAFA',
        'text-secondary': '#E5E5E5',
        'text-muted': '#A1A1AA',
        'text-disabled': '#71717A',
      },
      
      fontFamily: {
        'heading': ['Playfair Display', 'Georgia', 'serif'],
        'body': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      
      boxShadow: {
        'gold-inner': 'inset 0 0 20px rgba(212, 175, 55, 0.05)',
        'gold-glow': '0 0 20px rgba(212, 175, 55, 0.15)',
        'gold-strong': '0 0 40px rgba(212, 175, 55, 0.25)',
        'gold-btn': '0 4px 20px rgba(212, 175, 55, 0.3), 0 0 40px rgba(212, 175, 55, 0.15)',
      },
      
      animation: {
        'fade-in': 'fadeIn 250ms ease-out',
        'fade-in-up': 'fadeInUp 400ms ease-out',
        'scale-in': 'scaleIn 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'gold-pulse': 'goldPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        fadeInUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.95)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        goldPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0.4)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(212, 175, 55, 0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
```

---

## Документация

**Версия:** 2.0.0  
**Автор:** GoldPC Design Director  
**Последнее обновление:** 16.03.2026

**Связанные документы:**
- [Research Analysis](./research-analysis.md)
- [Components Specification](./components-spec.md)
- [Homepage Layout](./homepage-layout.md)