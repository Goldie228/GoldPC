# GoldPC Wireframes Documentation

> **Версия:** 1.0.0  
> **Дата:** 16.03.2026  
> **Автор:** UX Architect  
> **Статус:** Утверждено  
> **Тема:** Dark Theme + Gold Accents (Design System v2.0)

---

## Содержание

1. [Обзор структуры сайта](#1-обзор-структуры-сайта)
2. [Homepage Layout](#2-homepage-layout)
3. [Product Detail Page](#3-product-detail-page)
4. [PC Builder Page](#4-pc-builder-page)
5. [Catalog Page](#5-catalog-page)
6. [Общие компоненты](#6-общие-компоненты)

---

## 1. Обзор структуры сайта

### 1.1. Карта страниц

```
GoldPC
├── Homepage (/)
│   ├── Hero Section (Video/Image Background)
│   ├── Featured Builds (Horizontal Scroll)
│   └── Categories Grid (Icon Grid with Gold Glow)
│
├── Catalog (/catalog)
│   ├── Filters Sidebar
│   ├── Product Grid
│   └── Pagination
│
├── Product Detail (/product/:id)
│   ├── Gallery (Left)
│   └── Specs + Add to Cart (Right)
│
├── PC Builder (/builder)
│   ├── Component Slots
│   ├── Compatibility Status
│   └── Summary Panel
│
├── Cart (/cart)
│   ├── Cart Items
│   └── Checkout Form
│
├── Account (/account)
│   ├── Profile
│   ├── Orders
│   └── Wishlist
│
├── Login (/login)
│   └── Auth Form
│
└── Admin (/admin/*)
    ├── Users
    ├── Catalog
    └── Dashboard
```

### 1.2. Навигационная структура

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo]     Каталог  Конструктор ПК  Услуги     [🔍] [🛒] [👤]         │
│  GoldPC                                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Homepage Layout

### 2.1. Структура страницы

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                     HEADER (Sticky, Dark Glass)                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         HERO SECTION                                    │
│              Full-screen Video / High-res Image                        │
│                   Gold Gradient Overlay                                 │
│                                                                         │
│                 "Performance in Gold"                                   │
│                    [CTA Button]                                         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    FEATURED BUILDS                                       │
│              Horizontal Scroll Carousel                                │
│                   "Gold Edition" PCs                                    │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                      CATEGORIES                                         │
│              Grid of Icons with Hover Gold Glow                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                       FOOTER                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Hero Section

#### Варианты фона

| Вариант | Описание | Применение |
|---------|----------|------------|
| **Video Background** | Полноэкранное видео сборки ПК | Премиальный эффект |
| **High-res Image** | Статичное изображение компонентов | Fallback / Performance |
| **Gold Gradient Overlay** | Полупрозрачный золотой градиент | Обязательный слой |

#### Структура Hero

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                                                                         │
│         ██████████████████████████████████████████████████████          │
│         █                                                    █          │
│         █   [Video/Image Background]                         █          │
│         █                                                    █          │
│         █   ░░░░░░░░░░░░░ GOLD GRADIENT OVERLAY ░░░░░░░░░░░  █          │
│         █                                                    █          │
│         █          P E R F O R M A N C E                     █          │
│         █              I N                                   █          │
│         █           G O L D                                  █          │
│         █                                                    █          │
│         █     "Соберите компьютер вашей мечты"               █          │
│         █                                                    █          │
│         █        [🚀 Начать сборку]                          █          │
│         █                                                    █          │
│         ██████████████████████████████████████████████████████          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Спецификация Hero

| Параметр | Значение |
|----------|----------|
| Высота | 100vh (full viewport) |
| Background | Video MP4 / WebM или изображение WebP |
| Overlay | `linear-gradient(135deg, rgba(212,175,55,0.3) 0%, rgba(0,0,0,0.7) 100%)` |
| Заголовок | Playfair Display, 72px, Gold Gradient Text |
| Подзаголовок | Inter, 20px, White (#FAFAFA) |
| CTA Button | Gold Shimmer Button (см. Design System) |

#### Gold Gradient Text (CSS)

```css
.hero-title {
  font-family: 'Playfair Display', serif;
  font-size: 4.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  line-height: 1.1;
}
```

### 2.3. Featured Builds Section

#### Структура

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│    Gold Edition Builds                                    [<] [>]      │
│                                                                         │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│    │ ░░░░░░░░░░░ │  │ ░░░░░░░░░░░ │  │ ░░░░░░░░░░░ │  │ ░░░░░░░░░░░ │  │
│    │ ░ [Image]  ░ │  │ ░ [Image]  ░ │  │ ░ [Image]  ░ │  │ ░ [Image]  ░ │  │
│    │ ░  of PC   ░ │  │ ░  of PC   ░ │  │ ░  of PC   ░ │  │ ░  of PC   ░ │  │
│    │ ░░░░░░░░░░░ │  │ ░░░░░░░░░░░ │  │ ░░░░░░░░░░░ │  │ ░░░░░░░░░░░ │  │
│    ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────────┤  │
│    │ AURORA X1   │  │ TITAN PRO   │  │ PHANTOM RGB │  │ ECLIPSE S   │  │
│    │ Gaming PC   │  │ Workstation │  │ Gaming PC   │  │ Mini ITX    │  │
│    │             │  │             │  │             │  │             │  │
│    │ 189 990 ₽   │  │ 345 990 ₽   │  │ 156 990 ₽   │  │ 98 990 ₽    │  │
│    │ [Подробнее] │  │ [Подробнее] │  │ [Подробнее] │  │ [Подробнее] │  │
│    └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                         │
│                     ○ ○ ● ○ ○  (Pagination Dots)                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Карточка "Gold Edition" Build

| Элемент | Спецификация |
|---------|--------------|
| Card Width | 320px |
| Card Height | 420px |
| Image Area | 280×280px, Object-fit: cover |
| Border | 1px solid `rgba(212,175,55,0.2)` |
| Background | `#1F1F1F` (Dark Surface) |
| Border-radius | 16px (--radius-xl) |
| Hover | Gold glow + translateY(-8px) |

#### Hover Gold Glow Effect

```css
.featured-build-card {
  background: #1F1F1F;
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.featured-build-card:hover {
  transform: translateY(-8px);
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(212, 175, 55, 0.15),
    inset 0 0 30px rgba(212, 175, 55, 0.05);
}
```

### 2.4. Categories Grid

#### Структура

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                           Категории                                     │
│                                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│   │          │  │          │  │          │  │          │             │
│   │   🖥️    │  │   🎮    │  │   💾    │  │   ⚡    │             │
│   │          │  │          │  │          │  │          │             │
│   │ Процессо-│  │ Видеокар-│  │  Память  │  │  Блоки   │             │
│   │   ры     │  │   ты     │  │          │  │ питания  │             │
│   │          │  │          │  │          │  │          │             │
│   │  42 шт   │  │  38 шт   │  │  89 шт   │  │  56 шт   │             │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
│                                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│   │          │  │          │  │          │  │          │             │
│   │   📦    │  │   🖨️    │  │   ❄️    │  │   🔧    │             │
│   │          │  │          │  │          │  │          │             │
│   │ Накопите-│  │ Корпуса  │  │ Охлажде- │  │ Аксессуа-│             │
│   │   ли     │  │          │  │   ние    │  │   ры     │             │
│   │          │  │          │  │          │  │          │             │
│   │  67 шт   │  │  34 шт   │  │  45 шт   │  │ 128 шт   │             │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Category Card с Hover Gold Glow

| Элемент | Спецификация |
|---------|--------------|
| Card Size | 200×200px |
| Icon Size | 64px (--icon-2xl) |
| Icon Color | `#D4AF37` (Gold 500) |
| Background | `#1F1F1F` |
| Border | 1px solid `rgba(255,255,255,0.1)` |
| Hover Border | 1px solid `rgba(212,175,55,0.5)` |
| Hover Glow | `0 0 30px rgba(212,175,55,0.2)` |

#### CSS для категорий

```css
.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #1F1F1F;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-card:hover {
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 30px rgba(212, 175, 55, 0.2);
  transform: translateY(-4px);
}

.category-card:hover .category-icon {
  filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5));
}
```

---

## 3. Product Detail Page

### 3.1. Общая структура

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          HEADER                                         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│    Breadcrumb: Главная / Каталог / Видеокарты / NVIDIA RTX 4070        │
│                                                                         │
│    ┌────────────────────────────┐  ┌────────────────────────────────┐  │
│    │                            │  │                                │  │
│    │                            │  │   NVIDIA                       │  │
│    │      GALLERY               │  │   GeForce RTX 4070 Super       │  │
│    │      (Left Panel)          │  │                                │  │
│    │                            │  │   ⭐⭐⭐⭐⭐ 4.9 (128 отзывов)   │  │
│    │    [Main Image]            │  │                                │  │
│    │                            │  │   ──────────────────────────── │  │
│    │    [thumb] [thumb] [thumb] │  │   Характеристики:              │  │
│    │                            │  │   • GPU: Ada Lovelace          │  │
│    │                            │  │   • VRAM: 12GB GDDR6X          │  │
│    │                            │  │   • Boost: 2475 MHz            │  │
│    │                            │  │   • TDP: 220W                  │  │
│    │                            │  │                                │  │
│    │                            │  │   ──────────────────────────── │  │
│    │                            │  │                                │  │
│    │                            │  │   58 990 ₽                     │  │
│    │                            │  │                                │  │
│    │                            │  │   ✓ В наличии (15 шт)          │  │
│    │                            │  │                                │  │
│    │                            │  │   ┌──────────────────────────┐  │  │
│    │                            │  │   │  ✨ Добавить в корзину   │  │  │
│    │                            │  │   │     (Gold Shimmer)      │  │  │
│    │                            │  │   └──────────────────────────┘  │  │
│    │                            │  │                                │  │
│    │                            │  │   [♡ В избранное]              │  │
│    │                            │  │                                │  │
│    └────────────────────────────┘  └────────────────────────────────┘  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         TABS: Описание | Характеристики | Отзывы       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Gallery Panel (Left)

#### Структура Gallery

```
┌────────────────────────────────────────┐
│                                        │
│                                        │
│           ┌──────────────────┐         │
│           │                  │         │
│           │   MAIN IMAGE     │         │
│           │   560×560px     │         │
│           │                  │         │
│           │   [Zoom 🔍]      │         │
│           └──────────────────┘         │
│                                        │
│   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐     │
│   │ 1   │ │ 2   │ │ 3   │ │ 4   │     │
│   │active│ │     │ │     │ │     │     │
│   └─────┘ └─────┘ └─────┘ └─────┘     │
│                                        │
│   Thumbnail: 80×80px                   │
│   Active Border: 2px Gold              │
│                                        │
└────────────────────────────────────────┘
```

#### Спецификация Gallery

| Элемент | Размер | Стиль |
|---------|--------|-------|
| Main Image | 560×560px | Object-contain, Dark BG |
| Thumbnails | 80×80px | Border-radius: 8px |
| Active Thumb | - | Border: 2px solid `#D4AF37` |
| Container BG | - | `#1F1F1F` |
| Border-radius | 16px | --radius-xl |

#### Интерактивность Gallery

1. **Thumbnail Click** — смена main image
2. **Zoom on Hover** — увеличение 1.5× с курсором-лупой
3. **Fullscreen** — модальное окно на весь экран
4. **Swipe (Mobile)** — свайп между изображениями

### 3.3. Specs Panel (Right)

#### Структура Specs

```
┌────────────────────────────────────────────────┐
│                                                │
│   NVIDIA                           [Badge: Hit]│
│   GeForce RTX 4070 Super Gaming                │
│                                                │
│   ★★★★★ 4.9  ·  128 отзывов  ·  156 продаж    │
│                                                │
│   ────────────────────────────────────────────│
│                                                │
│   Ключевые характеристики:                    │
│                                                │
│   ┌──────────────────────────────────────────┐│
│   │ GPU Architecture    Ada Lovelace         ││
│   │ Video Memory        12 GB GDDR6X         ││
│   │ Memory Bus          192-bit              ││
│   │ Base Clock          1980 MHz             ││
│   │ Boost Clock         2475 MHz             ││
│   │ CUDA Cores          7168                 ││
│   │ TDP                  220 W               ││
│   │ Power Connector     1× 8-pin             ││
│   │ Recommended PSU     650 W                ││
│   └──────────────────────────────────────────┘│
│                                                │
│   ────────────────────────────────────────────│
│                                                │
│                 58 990 ₽                      │
│                                                │
│         ✓ В наличии (15 шт)                   │
│                                                │
│   ┌──────────────────────────────────────────┐│
│   │                                          ││
│   │      ✨ Добавить в корзину               ││
│   │         (Gold Shimmer)                   ││
│   │                                          ││
│   └──────────────────────────────────────────┘│
│                                                │
│   [♡ В избранное]  [📈 Сравнить]              │
│                                                │
└────────────────────────────────────────────────┘
```

### 3.4. Gold Shimmer Button (Add to Cart)

#### Анимация Shimmer

```css
.btn-gold-shimmer {
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: 16px 32px;
  
  background: linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%);
  color: #1A1A1A;
  
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  
  border: none;
  border-radius: 12px;
  cursor: pointer;
  
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-gold-shimmer:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 24px rgba(212, 175, 55, 0.3),
    0 0 40px rgba(212, 175, 55, 0.15);
}

/* Shimmer Effect */
.btn-gold-shimmer::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  
  transition: left 0.6s ease;
}

.btn-gold-shimmer:hover::before {
  left: 100%;
}

/* Active State */
.btn-gold-shimmer:active {
  transform: translateY(0) scale(0.98);
}
```

#### Состояния кнопки

| Состояние | Визуальное изменение |
|-----------|---------------------|
| Default | Gold gradient, flat |
| Hover | Shimmer animation, lift, glow |
| Active | Scale 0.98, no lift |
| Loading | Spinner, disabled |
| Success | Checkmark icon, green flash |
| Disabled | 50% opacity, no cursor |

---

## 4. PC Builder Page

### 4.1. Общая структура

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          HEADER                                         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                      Конструктор ПК                                     │
│           "Соберите идеальный компьютер"                               │
│                                                                         │
│   [🎮 Игровой] [💼 Офисный] [🖥️ Рабочая станция] [🎬 Монтаж]          │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────┐  ┌─────────────────────────┐ │
│   │                                     │  │                         │ │
│   │      COMPONENT SLOTS                │  │    SUMMARY PANEL        │ │
│   │      (Dark Interface)               │  │    (Gold Glass)         │ │
│   │                                     │  │                         │ │
│   │   ┌───────────────────────────┐    │  │   Итого:                │ │
│   │   │ 📦 Процессор (CPU)    *   │    │  │   127 350 ₽            │ │
│   │   │ ✓ AMD Ryzen 7 7800X3D    │    │  │                         │ │
│   │   │   32 990 ₽        [Изм]  │    │  │   ─────────────────────│ │
│   │   └───────────────────────────┘    │  │                         │ │
│   │                                     │  │   ┌───────────────────┐ │ │
│   │   ┌───────────────────────────┐    │  │   │ ✓ Совместимость   │ │ │
│   │   │ 🎮 Видеокарта (GPU)   *   │    │  │   │   ОК              │ │ │
│   │   │ ✓ NVIDIA RTX 4070 Super  │    │  │   └───────────────────┘ │ │
│   │   │   58 990 ₽        [Изм]  │    │  │                         │ │
│   │   └───────────────────────────┘    │  │   ⚡ Питание:           │ │
│   │                                     │  │   Потребление: 520W    │ │
│   │   ┌───────────────────────────┐    │  │   БП: 750W ✓           │ │
│   │   │ 🖥️ Материнская плата  *   │    │  │                         │ │
│   │   │ ⚠ ASUS TUF B650-Plus      │    │  │   ─────────────────────│ │
│   │   │   ❌ Сокет несовместим!   │    │  │                         │ │
│   │   │   [Выбрать совместимый →] │    │  │   [🛒 Добавить в кор.]  │ │
│   │   └───────────────────────────┘    │  │   [📄 Сохранить сборку] │ │
│   │                                     │  │   [📋 Экспорт в PDF]   │ │
│   │   ┌───────────────────────────┐    │  │                         │ │
│   │   │ 💾 Оперативная память  *   │    │  │                         │ │
│   │   │ ✓ Kingston 32GB DDR5      │    │  │                         │ │
│   │   └───────────────────────────┘    │  │                         │ │
│   │                                     │  │                         │ │
│   │   ┌───────────────────────────┐    │  │                         │ │
│   │   │ 📦 Накопитель (SSD)    *   │    │  │                         │ │
│   │   │ + Выбрать накопитель      │    │  │                         │ │
│   │   └───────────────────────────┘    │  │                         │ │
│   │                                     │  │                         │ │
│   │   ... остальные слоты              │  │                         │ │
│   │                                     │  │                         │ │
│   └─────────────────────────────────────┘  └─────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Dark Interface Design

#### Цветовая схема PC Builder

| Элемент | Цвет | Token |
|---------|------|-------|
| Background | `#000000` | --color-bg-primary |
| Slot Background | `#1F1F1F` | --color-surface |
| Slot Border (default) | `rgba(255,255,255,0.1)` | --color-border |
| Slot Border (OK) | `#22C55E` | --color-success |
| Slot Border (Error) | `#EF4444` | --color-error |
| Slot Border (Warning) | `#F59E0B` | --color-warning |
| Gold Border | `rgba(212,175,55,0.3)` | --color-border-gold |

### 4.3. Component Slots

#### Список слотов

| Слот | Обязательный | Иконка |
|------|--------------|--------|
| Процессор (CPU) | Да | 🔧 |
| Видеокарта (GPU) | Да | 🎮 |
| Материнская плата | Да | 🖥️ |
| Оперативная память (RAM) | Да | 💾 |
| Накопитель (SSD) | Да | 📦 |
| Блок питания (PSU) | Да | ⚡ |
| Корпус | Да | 🖨️ |
| Охлаждение CPU | Нет | ❄️ |
| Доп. вентиляторы | Нет | 💨 |

#### Структура слота (Заполненный)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌─ OK Status ──────────────────────────────────────────────┐│
│   │ 📦 Процессор (CPU)                                *      ││
│   ├────────────────────────────────────────────────────────────┤│
│   │                                                            ││
│   │   ┌────────┐   AMD Ryzen 7 7800X3D                        ││
│   │   │  IMG   │   32 990 ₽                        [Изменить] ││
│   │   │ 60×60  │                                              ││
│   │   └────────┘                                              ││
│   │                                                            ││
│   └────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Структура слота (Пустой)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌─ Empty Slot ──────────────────────────────────────────────┐│
│   │ 📦 Накопитель (SSD)                                *      ││
│   ├────────────────────────────────────────────────────────────┤│
│   │                                                            ││
│   │   ┌──────────────────────────────────────────────────┐    ││
│   │   │                                                  │    ││
│   │   │      ┌─────────────────────────────────┐        │    ││
│   │   │      │    + Выбрать накопитель         │        │    ││
│   │   │      │      (Dashed Gold Border)       │        │    ││
│   │   │      └─────────────────────────────────┘        │    ││
│   │   │                                                  │    ││
│   │   └──────────────────────────────────────────────────┘    ││
│   │                                                            ││
│   └────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### CSS для слотов

```css
.slot {
  background: #1F1F1F;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

/* OK State - Green Border */
.slot.ok {
  border-color: #22C55E;
  background: rgba(34, 197, 94, 0.05);
}

/* Error State - Red Border */
.slot.error {
  border-color: #EF4444;
  background: rgba(239, 68, 68, 0.05);
}

/* Warning State - Orange Border */
.slot.warning {
  border-color: #F59E0B;
  background: rgba(245, 158, 11, 0.05);
}

/* Gold Border for Premium Effect */
.slot.gold-border {
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: inset 0 0 20px rgba(212, 175, 55, 0.05);
}
```

### 4.4. Compatibility Status

#### Индикатор совместимости

```
┌─────────────────────────────────────────┐
│                                         │
│   ┌── OK State ───────────────────────┐│
│   │                                   ││
│   │   ✓ Совместимость: ОК             ││
│   │   Все компоненты совместимы       ││
│   │                                   ││
│   └───────────────────────────────────┘│
│                                         │
│   ┌── Error State ────────────────────┐│
│   │                                   ││
│   │   ✕ Ошибка совместимости          ││
│   │   • Сокет материнской платы       ││
│   │     не совпадает с CPU             ││
│   │                                   ││
│   └───────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

#### Цветовые статусы

| Статус | Цвет | Background | Border |
|--------|------|------------|--------|
| OK (Green) | `#22C55E` | `rgba(34,197,94,0.1)` | `rgba(34,197,94,0.3)` |
| Error (Red) | `#EF4444` | `rgba(239,68,68,0.1)` | `rgba(239,68,68,0.3)` |
| Warning (Orange) | `#F59E0B` | `rgba(245,158,11,0.1)` | `rgba(245,158,11,0.3)` |

### 4.5. Summary Panel (Gold Glass)

#### CSS для Summary Panel

```css
.summary-panel {
  position: sticky;
  top: 100px;
  
  background: rgba(31, 31, 31, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 24px;
  
  box-shadow: 
    0 4px 30px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(212, 175, 55, 0.05);
  
  padding: 32px;
}

.summary-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent);
}
```

---

## 5. Catalog Page

### 5.1. Структура

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                          HEADER                                         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌───────────────────┐  ┌──────────────────────────────────────────┐  │
│   │                   │  │                                          │  │
│   │   FILTERS         │  │   Каталог комплектующих                  │  │
│   │   (Sidebar)       │  │   Найдено: 225 товаров                   │  │
│   │                   │  │                                          │  │
│   │   Категории       │  │   [Grid/List]  [Сортировка: По пулярн.]  │  │
│   │   ├─ Все товары   │  │                                          │  │
│   │   ├─ Процессоры   │  │   ┌────────┐ ┌────────┐ ┌────────┐      │  │
│   │   ├─ Видеокарты   │  │   │        │ │        │ │        │      │  │
│   │   └─ ...          │  │   │ Product│ │ Product│ │ Product│      │  │
│   │                   │  │   │        │ │        │ │        │      │  │
│   │   Цена            │  │   └────────┘ └────────┘ └────────┘      │  │
│   │   [min] - [max]   │  │                                          │  │
│   │                   │  │   ┌────────┐ ┌────────┐ ┌────────┐      │  │
│   │   Производители   │  │   │        │ │        │ │        │      │  │
│   │   ☑ AMD           │  │   │ Product│ │ Product│ │ Product│      │  │
│   │   ☐ Intel         │  │   │        │ │        │ │        │      │  │
│   │   ☑ NVIDIA        │  │   └────────┘ └────────┘ └────────┘      │  │
│   │                   │  │                                          │  │
│   │   Наличие         │  │          [Загрузить ещё...]             │  │
│   │   ○ В наличии     │  │                                          │  │
│   │   ○ Под заказ     │  │                                          │  │
│   │                   │  │                                          │  │
│   │   [Сбросить всё]  │  │                                          │  │
│   │                   │  │                                          │  │
│   └───────────────────┘  └──────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2. Product Card (Dark Theme)

```
┌───────────────────────────┐
│                           │
│   ┌───────────────────┐   │
│   │                   │   │
│   │    [Image]        │   │
│   │    280×280px      │   │
│   │                   │   │
│   │              [♡]  │   │
│   │   [Badge: New]    │   │
│   └───────────────────┘   │
│                           │
│   AMD                     │
│   Ryzen 7 7800X3D        │
│                           │
│   ★★★★★ 4.8 (42)         │
│                           │
│   ✓ В наличии (24 шт)    │
│                           │
│   32 990 ₽               │
│   ─────────────────────  │
│   ┌────────────────────┐ │
│   │ 🛒 В корзину        │ │
│   └────────────────────┘ │
│                           │
└───────────────────────────┘
```

---

## 6. Общие компоненты

### 6.1. Header (Dark Glass)

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.8);
}
```

### 6.2. Footer (Dark Gold)

```css
.footer {
  background: linear-gradient(180deg, #0A0A0A 0%, #000000 100%);
  border-top: 1px solid rgba(212, 175, 55, 0.15);
  padding: 64px 0 32px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 48px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}
```

### 6.3. Price Display

```css
.price {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  color: #D4AF37; /* Gold */
}

.price-lg {
  font-size: 1.5rem;
  line-height: 1.2;
}

.price-old {
  font-size: 0.875rem;
  color: #A1A1AA;
  text-decoration: line-through;
}

.price-discount {
  display: inline-flex;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  color: #FFFFFF;
  background: #EF4444;
  border-radius: 4px;
  margin-left: 8px;
}
```

### 6.4. Badge Variants

| Variant | Background | Text | Use Case |
|---------|------------|------|----------|
| Gold | Gold Gradient | Dark | Premium, Hit |
| New | `#3B82F6` | White | New products |
| Sale | `#EF4444` | White | Discounts |
| Low Stock | `#F59E0B` | White | Low quantity |
| Out of Stock | `#71717A` | White | Not available |

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop XL | ≥1536px | Max container 1400px |
| Desktop | 1280-1535px | Full layout |
| Laptop | 1024-1279px | Sidebar narrower |
| Tablet | 768-1023px | Single column, stacked |
| Mobile | <768px | Compact, hamburger menu |
| Mobile S | <375px | Minimal spacing |

---

## 8. Accessibility Checklist

- [ ] Контрастность текста: минимум 4.5:1 (WCAG AA)
- [ ] Focus indicators для всех интерактивных элементов
- [ ] Skip links для навигации
- [ ] ARIA labels для иконок и кнопок
- [ ] Alt text для всех изображений
- [ ] Keyboard navigation для каруселей
- [ ] Reduced motion support

---

**Документ завершён.**

**Связанные документы:**
- [Design System v2.0](./design-system.md)
- [Components Specification](./components-spec.md)
- [Homepage Layout](./homepage-layout.md)