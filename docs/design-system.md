# GoldPC Design System

## Обзор

Дизайн-система GoldPC — руководство по созданию современного, доступного и производительного интерфейса для магазина компьютерных компонентов. Вдохновлена трендами 2026 года: Glassmorphism, органические формы, мягкие градиенты.

**Референс:** NOVA Shop (Glassmorphism aesthetic)

---

## 1. Design Tokens

### 1.1 Цветовая палитра

#### Primary Colors (Зелёные тона)

| Token | Значение | Применение |
|-------|----------|------------|
| `--color-primary-50` | `#E8F5E9` | Фон активных состояний |
| `--color-primary-100` | `#C8E6C9` | Hover-состояния |
| `--color-primary-200` | `#A5D6A7` | Borders, акценты |
| `--color-primary-300` | `#81C784` | Иконки, декоративные элементы |
| `--color-primary-400` | `#66BB6A` | Secondary buttons |
| `--color-primary-500` | `#4CAF50` | **Primary brand color** |
| `--color-primary-600` | `#43A047` | Primary buttons (hover) |
| `--color-primary-700` | `#388E3C` | Active states |
| `--color-primary-800` | `#2E7D32` | Text on light backgrounds |
| `--color-primary-900` | `#1B5E20` | Headers, dark accents |

#### Accent Colors (Золотые/Оранжевые)

| Token | Значение | Применение |
|-------|----------|------------|
| `--color-accent-50` | `#FFF8E1` | Highlight backgrounds |
| `--color-accent-100` | `#FFECB3` | Tags, badges |
| `--color-accent-200` | `#FFE082` | Warnings (soft) |
| `--color-accent-300` | `#FFD54F` | Decorative elements |
| `--color-accent-400` | `#FFCA28` | CTAs, promotions |
| `--color-accent-500` | `#FFC107` | **Accent brand color** |
| `--color-accent-600` | `#FFB300` | Hover для accent |
| `--color-accent-700` | `#FFA000` | Active accent |
| `--color-accent-800` | `#FF8F00` | Text emphasis |
| `--color-accent-900` | `#FF6F00` | Strong emphasis |

#### Background Colors

| Token | Значение | Применение |
|-------|----------|------------|
| `--color-bg-base` | `#F5F0E8` | **Основной фон (тёплый бежевый)** |
| `--color-bg-surface` | `#FFFEF9` | Cards, modals |
| `--color-bg-elevated` | `#FFFFFF` | Dropdowns, popovers |
| `--color-bg-overlay` | `rgba(0, 0, 0, 0.5)` | Modal backdrop |

#### Glass Surfaces

| Token | Значение | Применение |
|-------|----------|------------|
| `--glass-surface-light` | `rgba(255, 255, 255, 0.55)` | Glassmorphism cards (light mode) |
| `--glass-surface-medium` | `rgba(255, 255, 255, 0.60)` | Glassmorphism panels |
| `--glass-surface-strong` | `rgba(255, 255, 255, 0.65)` | Glassmorphism modals |
| `--glass-surface-dark` | `rgba(0, 0, 0, 0.35)` | Dark glass variant |

#### Semantic Colors

| Token | Значение | Применение |
|-------|----------|------------|
| `--color-success` | `#2E7D32` | Success messages |
| `--color-warning` | `#F57C00` | Warning messages |
| `--color-error` | `#C62828` | Error messages |
| `--color-info` | `#1565C0` | Info messages |

#### Text Colors

| Token | Значение | Применение |
|-------|----------|------------|
| `--color-text-primary` | `#1A1A1A` | Основной текст |
| `--color-text-secondary` | `#5C5C5C` | Secondary text |
| `--color-text-muted` | `#8C8C8C` | Muted text, placeholders |
| `--color-text-inverse` | `#FFFFFF` | Text on dark backgrounds |

---

### 1.2 Типографика

#### Шрифты

| Категория | Шрифт | Источник |
|-----------|-------|----------|
| **Heading** | Playfair Display | Google Fonts |
| **Body** | Inter | Google Fonts |

```css
/* Подключение шрифтов */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
```

#### Заголовки

| Token | Размер | Line Height | Weight | Применение |
|-------|--------|-------------|--------|------------|
| `--font-h1` | `48px / 3rem` | `1.1` | 700 | Hero sections, page titles |
| `--font-h2` | `36px / 2.25rem` | `1.2` | 600 | Section titles |
| `--font-h3` | `28px / 1.75rem` | `1.3` | 600 | Subsections, card titles |
| `--font-h4` | `24px / 1.5rem` | `1.4` | 500 | Component titles |
| `--font-h5` | `20px / 1.25rem` | `1.4` | 500 | Small titles |
| `--font-h6` | `16px / 1rem` | `1.5` | 600 | Labels, small headings |

#### Body Text

| Token | Размер | Line Height | Weight | Применение |
|-------|--------|-------------|--------|------------|
| `--font-body-lg` | `18px / 1.125rem` | `1.6` | 400 | Lead paragraphs |
| `--font-body-md` | `16px / 1rem` | `1.6` | 400 | Default body text |
| `--font-body-sm` | `14px / 0.875rem` | `1.5` | 400 | Secondary text |
| `--font-body-xs` | `12px / 0.75rem` | `1.4` | 400 | Captions, helper text |

#### Специальные стили

| Token | Размер | Weight | Применение |
|-------|--------|--------|------------|
| `--font-button` | `14px / 0.875rem` | 600 | Buttons |
| `--font-label` | `12px / 0.75rem` | 500 | Form labels |
| `--font-caption` | `12px / 0.75rem` | 400 | Captions |
| `--font-overline` | `10px / 0.625rem` | 600 | Overline text |

---

### 1.3 Отступы (Spacing)

**Система:** 8px grid

| Token | Значение | rem | Применение |
|-------|----------|-----|------------|
| `--space-xs` | `8px` | `0.5rem` | Minimal gaps, icon spacing |
| `--space-sm` | `16px` | `1rem` | Component internal padding |
| `--space-md` | `24px` | `1.5rem` | Between related elements |
| `--space-lg` | `32px` | `2rem` | Section spacing |
| `--space-xl` | `48px` | `3rem` | Major section spacing |
| `--space-2xl` | `64px` | `4rem` | Page section spacing |
| `--space-3xl` | `96px` | `6rem` | Hero spacing |
| `--space-4xl` | `128px` | `8rem` | Major page divisions |

#### Component Spacing Map

```css
--component-padding-sm: var(--space-xs);    /* 8px */
--component-padding-md: var(--space-sm);    /* 16px */
--component-padding-lg: var(--space-md);    /* 24px */
--component-gap: var(--space-xs);           /* 8px */
```

---

### 1.4 Border Radius

**Принцип:** Органические, асимметричные значения для создания "живого" интерфейса.

| Token | Значение | Применение |
|-------|----------|------------|
| `--radius-sm` | `8px` | Tags, badges |
| `--radius-md` | `12px` | Buttons, inputs |
| `--radius-lg` | `16px` | Cards |
| `--radius-xl` | `24px` | Large cards, modals |
| `--radius-full` | `9999px` | Pills, avatars |

#### Organic Border Radius

Для создания органических форм используются асимметричные радиусы:

| Token | Значение | Применение |
|-------|----------|------------|
| `--radius-organic-1` | `16px 24px 20px 28px` | Primary organic shape |
| `--radius-organic-2` | `24px 16px 28px 20px` | Alternative organic shape |
| `--radius-organic-3` | `20px 28px 16px 24px` | Mirror organic shape |
| `--radius-blob` | `60% 40% 30% 70% / 60% 30% 70% 40%` | Blob shapes (decorative) |

---

### 1.5 Тени (Shadows)

**Принцип:** Мягкие, размытые тени для glassmorphism эффекта.

| Token | Значение | Применение |
|-------|----------|------------|
| `--shadow-xs` | `0 1px 2px rgba(0, 0, 0, 0.04)` | Minimal elevation |
| `--shadow-sm` | `0 2px 8px rgba(0, 0, 0, 0.06)` | Subtle lift |
| `--shadow-md` | `0 4px 16px rgba(0, 0, 0, 0.08)` | Cards, dropdowns |
| `--shadow-lg` | `0 8px 32px rgba(0, 0, 0, 0.10)` | Modals, popovers |
| `--shadow-xl` | `0 16px 48px rgba(0, 0, 0, 0.12)` | Hero elements |

#### Glass Shadows

| Token | Значение | Применение |
|-------|----------|------------|
| `--shadow-glass` | `0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.4)` | Glass surfaces |
| `--shadow-glass-strong` | `0 16px 48px rgba(0, 0, 0, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.5)` | Elevated glass |
| `--shadow-glass-hover` | `0 12px 40px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.5)` | Glass hover state |

---

### 1.6 Анимации

**Принцип:** Минимальный JavaScript, CSS-first анимации.

#### Transitions

| Token | Значение | Применение |
|-------|----------|------------|
| `--transition-fast` | `150ms ease-out` | Micro-interactions |
| `--transition-base` | `250ms ease-out` | Default transitions |
| `--transition-slow` | `400ms ease-out` | Complex animations |
| `--transition-slower` | `600ms ease-out` | Page transitions |

#### Easing Functions

| Token | Значение | Применение |
|-------|----------|------------|
| `--ease-out` | `cubic-bezier(0.33, 1, 0.68, 1)` | Standard ease-out |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Smooth transitions |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful bounce |

#### Animation Tokens

```css
--animation-fade-in: fade-in var(--transition-base) var(--ease-out);
--animation-slide-up: slide-up var(--transition-slow) var(--ease-out);
--animation-scale-in: scale-in var(--transition-fast) var(--ease-bounce);
```

---

### 1.7 Breakpoints

**Подход:** Mobile-first

| Token | Значение | Применение |
|-------|----------|------------|
| `--breakpoint-xs` | `320px` | Small phones |
| `--breakpoint-sm` | `480px` | Large phones |
| `--breakpoint-md` | `768px` | Tablets |
| `--breakpoint-lg` | `1024px` | Small desktops |
| `--breakpoint-xl` | `1280px` | Standard desktops |
| `--breakpoint-2xl` | `1536px` | Large screens |

---

## 2. Принципы дизайна

### 2.1 Mobile-First

- **Базовые стили для мобильных устройств:** Все стили пишутся сначала для мобильных экранов
- **Прогрессивное улучшение:** Добавляем стили для больших экранов через `min-width` media queries
- **Touch-friendly:** Минимальный размер touch-цели — 44×44px
- **Производительность:** Оптимизация изображений и ресурсов для мобильных сетей

```css
/* Пример mobile-first подхода */
.card {
  padding: var(--space-sm);
  border-radius: var(--radius-md);
}

@media (min-width: 768px) {
  .card {
    padding: var(--space-md);
    border-radius: var(--radius-lg);
  }
}

@media (min-width: 1024px) {
  .card {
    padding: var(--space-lg);
  }
}
```

### 2.2 Accessibility (WCAG 2.1 AA)

#### Контрастность

| Уровень | Минимальный контраст |
|---------|---------------------|
| AA Normal Text | 4.5:1 |
| AA Large Text | 3:1 |
| AA UI Components | 3:1 |

#### Требования

- **Keyboard Navigation:** Все интерактивные элементы доступны с клавиатуры
- **Focus Indicators:** Видимые индикаторы фокуса (минимум 2px outline)
- **Alt Text:** Все изображения имеют описательный alt-текст
- **ARIA Labels:** Семантическая разметка с ARIA атрибутами
- **Color Independence:** Информация не передаётся только цветом
- **Motion Preferences:** Уважение `prefers-reduced-motion`

```css
/* Focus styles */
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2.3 Performance

- **CSS-first анимации:** Использование `transform` и `opacity` для анимаций
- **Минимальный JavaScript:** Анимации на CSS, интерактивность на минимальном JS
- **Lazy Loading:** Отложенная загрузка изображений и компонентов
- **Critical CSS:** Inline критических стилей для above-the-fold контента
- **Font Display:** `font-display: swap` для веб-шрифтов

```css
/* Оптимизированная анимация */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-glass-hover);
  transition: transform var(--transition-fast), 
              box-shadow var(--transition-fast);
}

/* Font loading */
@font-face {
  font-family: 'Inter';
  font-display: swap;
  src: url('/fonts/inter-var.woff2') format('woff2');
}
```

---

## 3. Стандартные компоненты

### 3.1 Button

#### Варианты

| Вариант | Применение |
|---------|------------|
| **Primary** | Основные действия |
| **Secondary** | Второстепенные действия |
| **Outline** | Альтернативные действия |
| **Ghost** | Минимальные действия |
| **Danger** | Деструктивные действия |

#### Размеры

| Размер | Высота | Padding | Font Size |
|--------|--------|---------|-----------|
| `sm` | 32px | 8px 16px | 13px |
| `md` | 40px | 12px 20px | 14px |
| `lg` | 48px | 16px 24px | 16px |

#### Спецификация

```css
.btn {
  /* Base */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  
  /* Typography */
  font-family: var(--font-body);
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  
  /* Appearance */
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  
  /* Animation */
  transition: all var(--transition-fast) var(--ease-out);
}

/* Primary Variant */
.btn-primary {
  background: var(--color-primary-500);
  color: var(--color-text-inverse);
}

.btn-primary:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  background: var(--color-primary-700);
  transform: translateY(0);
}

/* Secondary Variant */
.btn-secondary {
  background: var(--glass-surface-light);
  color: var(--color-text-primary);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Outline Variant */
.btn-outline {
  background: transparent;
  color: var(--color-primary-600);
  border: 2px solid var(--color-primary-500);
}

/* Ghost Variant */
.btn-ghost {
  background: transparent;
  color: var(--color-text-primary);
}

.btn-ghost:hover {
  background: rgba(0, 0, 0, 0.04);
}

/* Danger Variant */
.btn-danger {
  background: var(--color-error);
  color: var(--color-text-inverse);
}

/* Disabled State */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

---

### 3.2 Card

#### Варианты

| Вариант | Применение |
|---------|------------|
| **Default** | Стандартные карточки |
| **Glass** | Glassmorphism карточки |
| **Product** | Карточки товаров |
| **Feature** | Карточки характеристик |

#### Спецификация

```css
.card {
  /* Base */
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  
  /* Shadow */
  box-shadow: var(--shadow-md);
  
  /* Animation */
  transition: transform var(--transition-fast) var(--ease-out),
              box-shadow var(--transition-fast) var(--ease-out);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Glass Variant */
.card-glass {
  background: var(--glass-surface-medium);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-glass);
}

.card-glass:hover {
  box-shadow: var(--shadow-glass-hover);
}

/* Organic Shape Variant */
.card-organic {
  border-radius: var(--radius-organic-1);
}

/* Product Card */
.card-product {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-product__image {
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.card-product__content {
  padding: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.card-product__title {
  font-family: var(--font-heading);
  font-size: var(--font-h5);
  font-weight: 500;
  color: var(--color-text-primary);
}

.card-product__price {
  font-size: var(--font-body-lg);
  font-weight: 700;
  color: var(--color-accent-600);
}

/* Feature Card */
.card-feature {
  text-align: center;
  padding: var(--space-lg);
}

.card-feature__icon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--space-sm);
  color: var(--color-primary-500);
}
```

---

### 3.3 Input

#### Варианты

| Вариант | Применение |
|---------|------------|
| **Default** | Стандартные поля ввода |
| **Glass** | Glassmorphism поля |
| **Filled** | Закрашенные поля |

#### Состояния

| Состояние | Описание |
|-----------|----------|
| **Default** | Базовое состояние |
| **Hover** | Наведение курсора |
| **Focus** | Фокус на элементе |
| **Error** | Ошибка валидации |
| **Disabled** | Отключено |

#### Спецификация

```css
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.input-label {
  font-size: var(--font-label);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.input {
  /* Box */
  width: 100%;
  height: 48px;
  padding: 0 var(--space-sm);
  
  /* Typography */
  font-family: var(--font-body);
  font-size: var(--font-body-md);
  color: var(--color-text-primary);
  
  /* Appearance */
  background: var(--color-bg-surface);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  
  /* Animation */
  transition: border-color var(--transition-fast),
              box-shadow var(--transition-fast);
}

.input::placeholder {
  color: var(--color-text-muted);
}

.input:hover {
  border-color: rgba(0, 0, 0, 0.24);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
}

/* Glass Variant */
.input-glass {
  background: var(--glass-surface-light);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Filled Variant */
.input-filled {
  background: rgba(0, 0, 0, 0.04);
  border: none;
  border-bottom: 2px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
}

/* Error State */
.input--error {
  border-color: var(--color-error);
}

.input--error:focus {
  box-shadow: 0 0 0 3px rgba(198, 40, 40, 0.15);
}

.input-error-text {
  font-size: var(--font-body-xs);
  color: var(--color-error);
}

/* Disabled State */
.input:disabled {
  background: rgba(0, 0, 0, 0.04);
  cursor: not-allowed;
  opacity: 0.6;
}

/* Helper Text */
.input-helper-text {
  font-size: var(--font-body-xs);
  color: var(--color-text-muted);
}

/* Textarea */
.textarea {
  min-height: 120px;
  padding: var(--space-sm);
  resize: vertical;
}
```

---

### 3.4 Modal

#### Размеры

| Размер | Max Width | Padding |
|--------|-----------|---------|
| `sm` | 400px | 16px |
| `md` | 560px | 24px |
| `lg` | 720px | 32px |
| `xl` | 960px | 32px |
| `full` | 95vw | 24px |

#### Спецификация

```css
/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay);
  backdrop-filter: blur(4px);
  z-index: 100;
  
  /* Animation */
  animation: fade-in var(--transition-fast) var(--ease-out);
}

/* Modal Container */
.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  z-index: 101;
  
  /* Box */
  max-width: 560px;
  width: 90%;
  max-height: 90vh;
  
  /* Appearance */
  background: var(--color-bg-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  
  /* Animation */
  animation: modal-enter var(--transition-base) var(--ease-out);
}

.modal--glass {
  background: var(--glass-surface-strong);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.modal-title {
  font-family: var(--font-heading);
  font-size: var(--font-h4);
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: background var(--transition-fast);
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.04);
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--space-md);
  overflow-y: auto;
  max-height: calc(90vh - 160px);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

/* Modal Animations */
@keyframes modal-enter {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

## 4. CSS Variables Summary

Полный список CSS-переменных для подключения в проект:

```css
:root {
  /* ========== COLORS ========== */
  
  /* Primary (Green) */
  --color-primary-50: #E8F5E9;
  --color-primary-100: #C8E6C9;
  --color-primary-200: #A5D6A7;
  --color-primary-300: #81C784;
  --color-primary-400: #66BB6A;
  --color-primary-500: #4CAF50;
  --color-primary-600: #43A047;
  --color-primary-700: #388E3C;
  --color-primary-800: #2E7D32;
  --color-primary-900: #1B5E20;
  
  /* Accent (Gold/Orange) */
  --color-accent-50: #FFF8E1;
  --color-accent-100: #FFECB3;
  --color-accent-200: #FFE082;
  --color-accent-300: #FFD54F;
  --color-accent-400: #FFCA28;
  --color-accent-500: #FFC107;
  --color-accent-600: #FFB300;
  --color-accent-700: #FFA000;
  --color-accent-800: #FF8F00;
  --color-accent-900: #FF6F00;
  
  /* Backgrounds */
  --color-bg-base: #F5F0E8;
  --color-bg-surface: #FFFEF9;
  --color-bg-elevated: #FFFFFF;
  --color-bg-overlay: rgba(0, 0, 0, 0.5);
  
  /* Glass Surfaces */
  --glass-surface-light: rgba(255, 255, 255, 0.55);
  --glass-surface-medium: rgba(255, 255, 255, 0.60);
  --glass-surface-strong: rgba(255, 255, 255, 0.65);
  --glass-surface-dark: rgba(0, 0, 0, 0.35);
  
  /* Semantic */
  --color-success: #2E7D32;
  --color-warning: #F57C00;
  --color-error: #C62828;
  --color-info: #1565C0;
  
  /* Text */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #5C5C5C;
  --color-text-muted: #8C8C8C;
  --color-text-inverse: #FFFFFF;
  
  /* ========== TYPOGRAPHY ========== */
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* ========== SPACING (8px grid) ========== */
  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 24px;
  --space-lg: 32px;
  --space-xl: 48px;
  --space-2xl: 64px;
  --space-3xl: 96px;
  --space-4xl: 128px;
  
  /* ========== BORDER RADIUS ========== */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
  --radius-organic-1: 16px 24px 20px 28px;
  --radius-organic-2: 24px 16px 28px 20px;
  --radius-organic-3: 20px 28px 16px 24px;
  
  /* ========== SHADOWS ========== */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.10);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.12);
  --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.4);
  --shadow-glass-hover: 0 12px 40px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.5);
  
  /* ========== TRANSITIONS ========== */
  --transition-fast: 150ms ease-out;
  --transition-base: 250ms ease-out;
  --transition-slow: 400ms ease-out;
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  
  /* ========== BREAKPOINTS ========== */
  --breakpoint-xs: 320px;
  --breakpoint-sm: 480px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

---

## 5. Ресурсы

### Шрифты
- [Playfair Display (Google Fonts)](https://fonts.google.com/specimen/Playfair+Display)
- [Inter (Google Fonts)](https://fonts.google.com/specimen/Inter)

### Инструменты
- [Contrast Checker (WCAG)](https://webaim.org/resources/contrastchecker/)
- [Glassmorphism CSS Generator](https://css.glass/)
- [Organic Blob Generator](https://www.blobmaker.app/)

### Референсы
- NOVA Shop — Glassmorphism inspiration
- Material Design 3 — Color system
- Tailwind CSS — Utility-first approach

---

*Документ создан: Март 2026*  
*Версия: 1.0.0*  
*Проект: GoldPC*
