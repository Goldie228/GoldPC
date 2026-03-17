# GoldPC Visual Language — Стратегический исследовательский отчёт

> **Документ:** Research & Analysis Report  
> **Версия:** 1.0.0  
> **Дата:** 16.03.2026  
> **Автор:** Senior Market Researcher  
> **Статус:** Утверждено  

---

## Содержание

1. [Executive Summary](#1-executive-summary)
2. [Анализ конкурентов](#2-анализ-конкурентов)
3. [Анализ люксовых брендов](#3-анализ-люксовых-брендов)
4. [GoldPC Visual Language](#4-goldpc-visual-language)
5. [Расширение карты сайта](#5-расширение-карты-сайта)
6. [Рекомендации и выводы](#6-рекомендации-и-выводы)

---

## 1. Executive Summary

### 1.1. Цель исследования

Определить уникальную визуальную идентичность для бренда GoldPC, которая выделит его среди конкурентов в сегменте премиальных компьютерных комплектующих и услуг по сборке ПК.

### 1.2. Методология

- Компаративный анализ визуальных идентичностей конкурентов
- Изследование паттернов люксовых часовых брендов
- Синтез уникального визуального языка
- Проектирование архитектуры сайта

### 1.3. Ключевые выводы

| Область | Вывод |
|---------|-------|
| **Позиционирование** | Premium-сегмент между масс-маркетом и эксклюзивом |
| **Визуальный код** | Тёмный режим с золотыми акцентами = роскошь + технологии |
| **Дифференциация** | В отличие от конкурентов — элегантность, а не агрессия |
| **Целевая аудитория** | 25-45 лет, высокий доход, ценит качество и эстетику |

---

## 2. Анализ конкурентов

### 2.1. Razer — Агрессивный гейминг

```
┌──────────────────────────────────────────────────────────────┐
│                    RAZER VISUAL IDENTITY                     │
├──────────────────────────────────────────────────────────────┤
│  PRIMARY:   ▓▓▓▓▓▓▓▓▓▓  #000000 (Pure Black)               │
│  ACCENT:    ▓▓▓▓▓▓▓▓▓▓  #44D62C (Neon Green)               │
│  SECONDARY: ▓▓▓▓▓▓▓▓▓▓  #1A1A1A (Charcoal)                 │
└──────────────────────────────────────────────────────────────┘
```

#### Ключевые характеристики

| Элемент | Описание |
|---------|----------|
| **Цветовая палитра** | Чёрный + неоновый зелёный (#44D62C) |
| **Типографика** | Агрессивные гротески с острыми формами |
| **Формы** | Острые углы, агрессивные линии, "хищный" дизайн |
| **Иконография** | Трёхглавая змея, техногенные элементы |
| **Photography** | Dramatic lighting, RGB-подсветка, киберпанк-эстетика |
| **Mood** | Aggressive, Competitive, Gaming, "For Gamers. By Gamers." |

#### Анализ эмоционального воздействия

```
┌─────────────────────────────────────────────────────────────────┐
│  ЭМОЦИОНАЛЬНЫЙ СПЕКТР RAZER:                                    │
│                                                                 │
│  [Aggression ████████████████████░░░░] 80%                     │
│  [Energy     ████████████████████████] 100%                    │
│  [Competition███████████████████████░] 90%                     │
│  [Elegance   ████░░░░░░░░░░░░░░░░░░░░] 20%                    │
│  [Premium    ████████░░░░░░░░░░░░░░░░] 40%                    │
│                                                                 │
│  → ЦА: Геймеры 16-30 лет, ценят соревновательность            │
└─────────────────────────────────────────────────────────────────┘
```

#### Визуальные паттерны

```css
/* Razer Style Pattern */
:root {
  --razer-black: #000000;
  --razer-green: #44D62C;
  --razer-charcoal: #1A1A1A;
  
  /* Типичные эффекты */
  --razer-glow: 0 0 20px rgba(68, 214, 44, 0.6);
  --razer-border: 1px solid rgba(68, 214, 44, 0.3);
}

/* Агрессивные углы */
.razer-element {
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
```

#### SWOT-анализ Razer

| Strengths | Weaknesses |
|-----------|------------|
| Узнаваемый бренд | Слишком агрессивный для массового рынка |
| Лояльное сообщество | Ограниченная цветовая палитра |
| Качественная продукция | Воспринимается как "только для геймеров" |

| Opportunities | Threats |
|---------------|---------|
| Расширение аудитории | Конкуренция с ASUS ROG |
| New product categories | Усталость от RGB-эстетики |

---

### 2.2. ASUS ROG — Техно-ориентированный дизайн

```
┌──────────────────────────────────────────────────────────────┐
│                   ASUS ROG VISUAL IDENTITY                   │
├──────────────────────────────────────────────────────────────┤
│  PRIMARY:   ▓▓▓▓▓▓▓▓▓▓  #1A1A1A (Dark Grey)                │
│  ACCENT:    ▓▓▓▓▓▓▓▓▓▓  #FF0033 (ROG Red)                  │
│  SECONDARY: ▓▓▓▓▓▓▓▓▓▓  #6C00FF (ROG Purple)               │
└──────────────────────────────────────────────────────────────┘
```

#### Ключевые характеристики

| Элемент | Описание |
|---------|----------|
| **Цветовая палитра** | Тёмно-серый + красный/фиолетовый |
| **Типографика** | Современные гротески (ROG Font), техничный вид |
| **Формы** | Сложные геометрические паттерны, майя-стиль |
| **Иконография** | Логотип "глаз", кибернетические элементы |
| **Photography** | Product-focused, технические детали, specs-highlighting |
| **Mood** | Tech-heavy, Performance-driven, "For Those Who Dare" |

#### Анализ эмоционального воздействия

```
┌─────────────────────────────────────────────────────────────────┐
│  ЭМОЦИОНАЛЬНЫЙ СПЕКТР ASUS ROG:                                 │
│                                                                 │
│  [Technology ████████████████████████] 100%                    │
│  [Performance████████████████████████] 95%                     │
│  [Innovation █████████████████████░░░] 85%                     │
│  [Aggression ████████████░░░░░░░░░░░░] 50%                     │
│  [Elegance   ████████░░░░░░░░░░░░░░░░] 40%                    │
│                                                                 │
│  → ЦА: Техно-энтузиасты 20-40 лет, ценят характеристики       │
└─────────────────────────────────────────────────────────────────┘
```

#### Визуальные паттерны

```css
/* ASUS ROG Style Pattern */
:root {
  --rog-dark: #1A1A1A;
  --rog-red: #FF0033;
  --rog-purple: #6C00FF;
  --rog-gradient: linear-gradient(135deg, #FF0033 0%, #6C00FF 100%);
}

/* Техно-паттерны */
.rog-grid {
  background-image: 
    linear-gradient(rgba(255, 0, 51, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 0, 51, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

#### SWOT-анализ ASUS ROG

| Strengths | Weaknesses |
|-----------|------------|
| Широкий ассортимент | Визуальная перегруженность |
| Инновационность | Несогласованность между линееками |
| Сильный брендинг | Сложная навигация на сайте |

| Opportunities | Threats |
|---------------|---------|
| AI-интеграция | Razer, MSI, Corsair |
| Экосистема | Рост цен на компоненты |

---

### 2.3. Apple — Минималистичный премиум

```
┌──────────────────────────────────────────────────────────────┐
│                   APPLE VISUAL IDENTITY                      │
├──────────────────────────────────────────────────────────────┤
│  PRIMARY:   ▓▓▓▓▓▓▓▓▓▓  #FFFFFF (White)                    │
│  SECONDARY: ▓▓▓▓▓▓▓▓▓▓  #1D1D1F (Near Black)               │
│  ACCENT:    ▓▓▓▓▓▓▓▓▓▓  #0071E3 (Apple Blue)               │
│  GREY:      ▓▓▓▓▓▓▓▓▓▓  #F5F5F7 (Apple Grey)               │
└──────────────────────────────────────────────────────────────┘
```

#### Ключевые характеристики

| Элемент | Описание |
|---------|----------|
| **Цветовая палитра** | Белый + чёрный + минимизация акцентов |
| **Типографика** | San Francisco (SF Pro), системный, читаемый |
| **Формы** | Мягкие скругления, органичные линии |
| **Иконография** | Минималистичные line-icons, апплe-силуэт |
| **Photography** | Product hero shots, много whitespace, studio lighting |
| **Mood** | Minimalist, Premium, Refined, "Think Different" |

#### Анализ эмоционального воздействия

```
┌─────────────────────────────────────────────────────────────────┐
│  ЭМОЦИОНАЛЬНЫЙ СПЕКТР APPLE:                                    │
│                                                                 │
│  [Elegance   ████████████████████████] 100%                   │
│  [Simplicity ███████████████████████░░] 95%                   │
│  [Premium    ████████████████████████] 100%                   │
│  [Innovation ██████████████████████░░░] 90%                   │
│  [Aggression ░░░░░░░░░░░░░░░░░░░░░░░░] 0%                     │
│                                                                 │
│  → ЦА: Широкая аудитория 18-65 лет, ценит простоту и качество │
└─────────────────────────────────────────────────────────────────┘
```

#### Визуальные паттерны

```css
/* Apple Style Pattern */
:root {
  --apple-white: #FFFFFF;
  --apple-black: #1D1D1F;
  --apple-grey: #F5F5F7;
  --apple-blue: #0071E3;
}

/* Ключевые принципы */
.apple-card {
  background: var(--apple-white);
  border-radius: 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  /* Никаких острых углов */
  /* Много whitespace */
  /* Продукт — герой */
}

.apple-typography {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
```

#### SWOT-анализ Apple

| Strengths | Weaknesses |
|-----------|------------|
| Идеальный UX | Ограниченная кастомизация |
| Узнаваемость | Высокая цена |
| Экосистема | Закрытая платформа |

| Opportunities | Threats |
|---------------|---------|
| Новые рынки | Android, Windows |
| Services | Антимонопольные иски |

---

## 3. Анализ люксовых брендов

### 3.1. Rolex — Эталон золотого премиума

```
┌──────────────────────────────────────────────────────────────┐
│                   ROLEX VISUAL IDENTITY                      │
├──────────────────────────────────────────────────────────────┤
│  GOLD:      ▓▓▓▓▓▓▓▓▓▓  #D4AF37 (Metallic Gold)            │
│  CHAMPAGNE: ▓▓▓▓▓▓▓▓▓▓  #F7E7CE (Champagne Gold)            │
│  DARK:      ▓▓▓▓▓▓▓▓▓▓  #0A0A0A (Deep Black)               │
│  GREEN:     ▓▓▓▓▓▓▓▓▓▓  #006039 (Rolex Green)              │
└──────────────────────────────────────────────────────────────┘
```

#### Ключевые характеристики

| Элемент | Описание |
|---------|----------|
| **Цветовая палитра** | Золото + чёрный + signature green |
| **Типографика** | Классические serif (Gotham, Timeless), королевские пропорции |
| **Формы** | Овальные формы, корона, симметрия |
| **Иконография** | Корона, гербы, классические элементы |
| **Photography** | Macro-съёмка деталей, драматичное освещение металла |
| **Mood** | Heritage, Excellence, Prestige, "A Crown for Every Achievement" |

#### Визуальные паттерны

```css
/* Rolex Style Pattern */
:root {
  --rolex-gold: #D4AF37;
  --rolex-champagne: #F7E7CE;
  --rolex-black: #0A0A0A;
  --rolex-green: #006039;
}

/* Золотые градиенты (имитация металла) */
.rolex-gold-surface {
  background: linear-gradient(
    135deg,
    #B8860B 0%,   /* Dark Gold */
    #FFD700 25%,  /* Bright Gold */
    #D4AF37 50%,  /* Metallic Gold */
    #FFD700 75%,  /* Bright Gold */
    #B8860B 100%  /* Dark Gold */
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Золотая рамка */
.rolex-frame {
  border: 1px solid;
  border-image: linear-gradient(135deg, #B8860B, #FFD700, #D4AF37) 1;
}
```

#### Принципы применения золота

```
┌─────────────────────────────────────────────────────────────────┐
│              ПРАВИЛА ИСПОЛЬЗОВАНИЯ ЗОЛОТА (Rolex):              │
│                                                                 │
│  1. КОГДА ИСПОЛЬЗОВАТЬ:                                         │
│     • Логотип и branding элементы                               │
│     • CTA кнопки (ограниченно)                                  │
│     • Акценты на premium-элементах                              │
│     • Рамки и разделители                                       │
│                                                                 │
│  2. ПРОПОРЦИИ:                                                  │
│     • Золото: не более 10-15% от площади экрана                │
│     • Золото должно быть "драгоценным акцентом"                │
│                                                                 │
│  3. КОНТРАСТ:                                                   │
│     • Золото всегда на тёмном фоне для максимального эффекта   │
│     • Белый текст + золотые акценты = классика                 │
│                                                                 │
│  4. ИМИТАЦИЯ МЕТАЛЛА:                                          │
│     • Использовать градиенты для эффекта блеска                │
│     • Избегать flat gold — он выглядит дёшево                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.2. Patek Philippe — Ультра-люкс традиций

```
┌──────────────────────────────────────────────────────────────┐
│               PATEK PHILIPPE VISUAL IDENTITY                 │
├──────────────────────────────────────────────────────────────┤
│  GOLD:      ▓▓▓▓▓▓▓▓▓▓  #C5A028 (Rich Gold)                │
│  NAVY:      ▓▓▓▓▓▓▓▓▓▓  #1A237E (Deep Navy)                │
│  CREAM:     ▓▓▓▓▓▓▓▓▓▓  #FFF8E7 (Cream White)              │
│  BROWN:     ▓▓▓▓▓▓▓▓▓▓  #3E2723 (Dark Brown)               │
└──────────────────────────────────────────────────────────────┘
```

#### Ключевые характеристики

| Элемент | Описание |
|---------|----------|
| **Цветовая палитра** | Rich gold + navy + cream |
| **Типографика** | Классические serif, рукописные элементы |
| **Формы** | Овалы, мягкие скругления, калейдоскоп |
| **Иконография** | Calatrava cross, семейные гербы |
| **Photography** | Artistic, lifestyle, heritage stories |
| **Mood** | Timeless, Heritage, "You never actually own a Patek Philippe..." |

#### Применимые паттерны

```css
/* Patek Philippe Style Pattern */
:root {
  --patek-gold: #C5A028;
  --patek-navy: #1A237E;
  --patek-cream: #FFF8E7;
}

/* Наследие и традиция */
.heritage-text {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  color: var(--patek-gold);
}

/* Premium card treatment */
.patek-card {
  background: linear-gradient(180deg, #FFF8E7 0%, #FFFFFF 100%);
  border: 1px solid rgba(197, 160, 40, 0.3);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
```

---

### 3.3. Синтез люксовых паттернов для GoldPC

| Принцип | Rolex | Patek Philippe | Применение в GoldPC |
|---------|-------|----------------|---------------------|
| **Золото как акцент** | ✅ | ✅ | CTA кнопки, рамки, иконки |
| **Тёмный контраст** | ✅ | ✅ | Deep black фон |
| **Металлические градиенты** | ✅ | ✅ | Имитация золота на элементах |
| **Serif типографика** | Частично | ✅ | Заголовки product pages |
| **Минимизация элементов** | ✅ | ✅ | Clean UI, много whitespace |
| **Heritage storytelling** | ✅ | ✅ | Brand story, quality focus |

---

## 4. GoldPC Visual Language

### 4.1. Концепция бренда

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│     ██████╗  ██████╗ ██╗  ██╗ ██████╗███████╗██████╗ ██████╗ ██████╗    │
│    ██╔════╝ ██╔═══██╗╚██╗██╔╝██╔════╝██╔════╝██╔══██╗██╔══██╗╚════██╗   │
│    ██║      ██║   ██║ ╚███╔╝ ██║     █████╗  ██████╔╝██████╔╝ █████╔╝   │
│    ██║      ██║   ██║ ██╔██╗ ██║     ██╔══╝  ██╔══██╗██╔══██╗██╔═══╝    │
│    ╚██████╗ ╚██████╔╝██╔╝ ██╗╚██████╗███████╗██║  ██║██████╔╝███████╗   │
│     ╚═════╝  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝   │
│                                                                         │
│                    "ПРЕМИАЛЬНЫЕ КОМПЬЮТЕРЫ. ИСКЛЮЧИТЕЛЬНОЕ КАЧЕСТВО."  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Позиционирование

**GoldPC** — первый компьютерный магазин премиум-класса в Беларуси, где технологии встречаются с роскошью. Мы не продаём "железо" — мы создаём произведения искусства.

**Brand Promise:**
> "Каждый компьютер GoldPC — это инвестиция в качество, которая служит годами."

**Tone of Voice:**
- Authoritative (экспертность)
- Refined (утончённость)
- Exclusive (исключительность)
- Technical (техническая грамотность)

### 4.3. Визуальная стратегия

#### Mood Board

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GOLDPC MOOD BOARD                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐      │
│   │                 │   │                 │   │                 │      │
│   │   🌙 DARK       │   │   ✨ GOLD       │   │   💎 PREMIUM   │      │
│   │   Elegant       │   │   Metallic      │   │   Exclusive    │      │
│   │   Mysterious    │   │   Luxurious     │   │   Quality      │      │
│   │   Sophisticated │   │   Warm          │   │   Refined      │      │
│   │                 │   │                 │   │                 │      │
│   └─────────────────┘   └─────────────────┘   └─────────────────┘      │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                                                                 │  │
│   │   KEYWORDS:  Dark • Sleek • Powerful • Expensive • Gold        │  │
│   │              Premium • Performance • Exclusive • Quality       │  │
│   │                                                                 │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4. Цветовая палитра

#### Primary Colors

| Название | HEX | RGB | Применение |
|----------|-----|-----|------------|
| **Deep Black** | `#09090B` | 9, 9, 11 | Основной фон, body |
| **Charcoal** | `#18181B` | 24, 24, 27 | Cards, surfaces, elevated elements |
| **Surface** | `#27272A` | 39, 39, 42 | Higher elevation, hover states |
| **Border** | `#3F3F46` | 63, 63, 70 | Borders, dividers |

#### Accent Colors (Gold Palette)

| Название | HEX | RGB | Применение |
|----------|-----|-----|------------|
| **Metallic Gold** | `#D4AF37` | 212, 175, 55 | Primary accent, CTAs, highlights |
| **Champagne Gold** | `#F7E7CE` | 247, 231, 206 | Secondary accent, text on dark |
| **Dark Gold** | `#B8860B` | 184, 134, 11 | Hover states, shadows |
| **Bright Gold** | `#FFD700` | 255, 215, 0 | Special highlights, deals |

#### Semantic Colors

| Название | HEX | Применение |
|----------|-----|------------|
| **Success** | `#22C55E` | Успешные операции, совместимость |
| **Warning** | `#F59E0B` | Предупреждения, низкий остаток |
| **Error** | `#EF4444` | Ошибки, несовместимость |
| **Info** | `#3B82F6` | Информация, подсказки |

#### CSS Custom Properties

```css
:root {
  /* === PRIMARY PALETTE === */
  --color-bg-base: #09090B;           /* Deep Black - основной фон */
  --color-bg-surface: #18181B;        /* Charcoal - cards, panels */
  --color-bg-elevated: #27272A;       /* Surface - elevated elements */
  --color-bg-overlay: rgba(0, 0, 0, 0.8); /* Modal overlays */
  
  /* === GOLD ACCENTS === */
  --color-gold-primary: #D4AF37;      /* Metallic Gold */
  --color-gold-light: #F7E7CE;        /* Champagne Gold */
  --color-gold-dark: #B8860B;         /* Dark Gold */
  --color-gold-bright: #FFD700;      /* Bright Gold */
  
  /* === GOLD GRADIENTS === */
  --gradient-gold: linear-gradient(
    135deg,
    #B8860B 0%,
    #D4AF37 25%,
    #FFD700 50%,
    #D4AF37 75%,
    #B8860B 100%
  );
  --gradient-gold-shimmer: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 215, 0, 0.2) 50%,
    transparent 100%
  );
  
  /* === TEXT COLORS === */
  --color-text-primary: #FAFAFA;      /* White - основной текст */
  --color-text-secondary: #A1A1AA;    /* Gray 400 - вторичный текст */
  --color-text-muted: #71717A;        /* Gray 500 - приглушённый */
  --color-text-inverse: #09090B;      /* Deep Black - на светлом фоне */
  
  /* === BORDER COLORS === */
  --color-border: #3F3F46;            /* Gray 700 */
  --color-border-light: #52525B;      /* Gray 600 */
  --color-border-gold: rgba(212, 175, 55, 0.3);
  
  /* === SEMANTIC === */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* === GLASSMORPHISM === */
  --glass-surface: rgba(39, 39, 42, 0.7);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  
  /* === SHADOWS === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.6);
  --shadow-gold: 0 0 20px rgba(212, 175, 55, 0.3);
  
  /* === TYPOGRAPHY === */
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* === SPACING === */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* === BORDER RADIUS === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  
  /* === TRANSITIONS === */
  --transition-fast: 150ms ease-out;
  --transition-base: 250ms ease-out;
  --transition-slow: 350ms ease-out;
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 4.5. Типографика

#### Font Stack

```css
/* Headings — Serif для элегантности */
h1, h2, h3 {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 600;
  font-feature-settings: 'kern' 1, 'liga' 1;
}

/* Body — Sans-serif для читаемости */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 400;
  line-height: 1.6;
}

/* Code/Mono — для технических данных */
code, .mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
```

#### Type Scale

| Уровень | Размер (Desktop) | Размер (Mobile) | Вес | Line Height |
|---------|------------------|------------------|-----|-------------|
| **H1** | 48px / 3rem | 32px / 2rem | 700 | 1.1 |
| **H2** | 36px / 2.25rem | 28px / 1.75rem | 600 | 1.2 |
| **H3** | 24px / 1.5rem | 20px / 1.25rem | 600 | 1.3 |
| **H4** | 20px / 1.25rem | 18px / 1.125rem | 600 | 1.4 |
| **Body Large** | 18px / 1.125rem | 16px / 1rem | 400 | 1.6 |
| **Body** | 16px / 1rem | 16px / 1rem | 400 | 1.6 |
| **Small** | 14px / 0.875rem | 14px / 0.875rem | 400 | 1.5 |
| **Caption** | 12px / 0.75rem | 12px / 0.75rem | 500 | 1.4 |

#### Gold Text Effect

```css
/* Золотой текст с эффектом металла */
.gold-text {
  background: linear-gradient(
    135deg,
    #B8860B 0%,
    #D4AF37 20%,
    #FFD700 40%,
    #D4AF37 60%,
    #B8860B 80%,
    #D4AF37 100%
  );
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: goldShimmer 3s ease-in-out infinite;
}

@keyframes goldShimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Альтернативный вариант — без анимации */
.gold-heading {
  font-family: var(--font-heading);
  color: var(--color-gold-primary);
  text-shadow: 
    0 1px 0 rgba(255, 215, 0, 0.3),
    0 2px 4px rgba(212, 175, 55, 0.2);
}
```

### 4.6. Компоненты и паттерны

#### Кнопки

```css
/* Primary Button — Gold Accent */
.btn-primary {
  background: var(--gradient-gold);
  color: var(--color-bg-base);
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-gold);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Secondary Button — Outline */
.btn-secondary {
  background: transparent;
  color: var(--color-gold-primary);
  border: 1px solid var(--color-gold-primary);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  background: rgba(212, 175, 55, 0.1);
  border-color: var(--color-gold-light);
  color: var(--color-gold-light);
}

/* Ghost Button — Minimal */
.btn-ghost {
  background: var(--glass-surface);
  backdrop-filter: blur(10px);
  color: var(--color-text-primary);
  border: 1px solid var(--glass-border);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-ghost:hover {
  background: rgba(39, 39, 42, 0.9);
  border-color: var(--color-border-light);
}
```

#### Карточки товаров

```css
/* Product Card — Dark Theme */
.product-card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all var(--transition-base);
}

.product-card:hover {
  border-color: var(--color-border-gold);
  box-shadow: var(--shadow-lg), var(--shadow-gold);
  transform: translateY(-4px);
}

.product-card__image {
  background: var(--color-bg-base);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.product-card__content {
  padding: 16px;
}

.product-card__title {
  font-family: var(--font-heading);
  font-size: var(--font-h4);
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.product-card__price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-gold-primary);
}
```

#### Glassmorphism Elements

```css
/* Glass Panel */
.glass-panel {
  background: var(--glass-surface);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--glass-shadow);
}

/* Glass Card with Gold Border */
.glass-card--gold {
  background: var(--glass-surface);
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-border-gold);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

/* Gold shimmer effect on border */
.glass-card--gold::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: var(--gradient-gold);
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.5;
  transition: opacity var(--transition-fast);
}

.glass-card--gold:hover::before {
  opacity: 1;
}
```

### 4.7. Imagery Style Guide

#### Product Photography

| Аспект | Рекомендация |
|--------|--------------|
| **Фон** | Тёмный градиент (Deep Black → Charcoal) |
| **Освещение** | Dramatic rim lighting, золотые акценты |
| **Ракурс** | 3/4 view, показ текстуры и деталей |
| **Постобработка** | Контраст +20, Saturation -10 для gold accents |
| **Размеры** | 1:1 квадрат для карточек, 16:9 для hero |

#### Background Images

```css
/* Hero Background Pattern */
.hero-bg {
  background: 
    radial-gradient(ellipse at 20% 30%, rgba(212, 175, 55, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(184, 134, 11, 0.1) 0%, transparent 40%),
    linear-gradient(180deg, var(--color-bg-base) 0%, var(--color-bg-surface) 100%);
}

/* Abstract Tech Pattern */
.tech-pattern {
  background-image: 
    linear-gradient(rgba(212, 175, 55, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212, 175, 55, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

#### Icons

```css
/* Gold Icon */
.icon--gold {
  color: var(--color-gold-primary);
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.3));
}

/* Icon Button */
.icon-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass-surface);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  color: var(--color-gold-primary);
  border-color: var(--color-border-gold);
}
```

### 4.8. Motion Design

#### Hover Effects

```css
/* Подъём карточки */
.hover-lift {
  transition: transform var(--transition-base), 
              box-shadow var(--transition-base);
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Золотое свечение */
.hover-glow:hover {
  box-shadow: var(--shadow-gold);
}

/* Пульсация */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

#### Page Transitions

```css
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

/* Staggered Animation */
.stagger-container > * {
  opacity: 0;
  animation: fadeInUp 0.5s ease-out forwards;
}

.stagger-container > *:nth-child(1) { animation-delay: 0ms; }
.stagger-container > *:nth-child(2) { animation-delay: 100ms; }
.stagger-container > *:nth-child(3) { animation-delay: 200ms; }
.stagger-container > *:nth-child(4) { animation-delay: 300ms; }
.stagger-container > *:nth-child(5) { animation-delay: 400ms; }
```

#### Reduced Motion

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

### 4.9. Дифференциация от конкурентов

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    СРАВНИТЕЛЬНАЯ ТАБЛИЦА ВИЗУАЛЬНЫХ СТИЛЕЙ               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Аспект          │ Razer        │ ASUS ROG     │ Apple     │ GoldPC   │
│  ─────────────────────────────────────────────────────────────────────  │
│  Основной цвет   │ Неоновый зелёный│ Красный   │ Белый     │ Золотой  │
│  Фон            │ Чёрный        │ Тёмно-серый  │ Белый     │ Чёрный   │
│  Настроение     │ Агрессивный   │ Техничный   │ Минималист│ Элегантный│
│  ЦА             │ Геймеры       │ Энтузиасты  │ Массовый  │ Премиум  │
│  Формы          │ Острые углы   │ Геометрия   │ Скругления│ Смешанные│
│  Типографика    │ Гротеск       │ Гротеск     │ Sans-serif │ Serif+Sans│
│  Акценты        │ RGB-подсветка │ Specs       │ Продукт    │ Золото   │
│  Tone of Voice  │ "Winning"     │ "Power"     │ "Simple"  │ "Quality"│
│                                                                         │
│  ═════════════════════════════════════════════════════════════════════ │
│                                                                         │
│  УНИКАЛЬНОЕ ПОЗИЦИОНИРОВАНИЕ GOLDPC:                                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  "Мы не продаём компоненты — мы создаём премиальный опыт"     │   │
│  │                                                                 │   │
│  │  • Элегантность вместо агрессии                               │   │
│  │  • Золото как символ качества (как Rolex)                     │   │
│  │  • Тёмный режим как стандарт (вместо RGB-мрака Razer)         │   │
│  │  • Продукт как произведение искусства (вдохновлено Apple)      │   │
│  │  • Heritage и качество (вдохновлено Patek Philippe)            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Расширение карты сайта

### 5.1. Архитектура сайта

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GOLDPC SITEMAP                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  /                              HOME PAGE                              │
│  ├── /catalog                    КАТАЛОГ ТОВАРОВ                        │
│  │   ├── /catalog/[category]     Категория (процессоры, видеокарты...) │
│  │   └── /catalog/search        Поиск по каталогу                      │
│  │                                                                      │
│  ├── /products                   СТРАНИЦЫ ТОВАРОВ                       │
│  │   └── /products/[slug]        Карточка товара                        │
│  │                                                                      │
│  ├── /pc-builder                 КОНСТРУКТОР ПК                         │
│  │   ├── /pc-builder/new         Новая сборка                           │
│  │   ├── /pc-builder/[id]        Просмотр/редактирование сборки         │
│  │   └── /pc-builder/saved       Сохранённые сборки                     │
│  │                                                                      │
│  ├── /cart                       КОРЗИНА                                │
│  │   └── /cart/checkout          Оформление заказа                       │
│  │                                                                      │
│  ├── /account                    ЛИЧНЫЙ КАБИНЕТ                          │
│  │   ├── /account/login          Вход                                   │
│  │   ├── /account/register       Регистрация                            │
│  │   ├── /account/profile        Профиль                                │
│  │   ├── /account/orders          История заказов                       │
│  │   ├── /account/wishlist        Избранное                             │
│  │   └── /account/builds          Мои сборки                            │
│  │                                                                      │
│  ├── /about                      О КОМПАНИИ                             │
│  │                                                                      │
│  └── /contact                    КОНТАКТЫ                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2. Детализация страниц

#### 5.2.1. Home Page (Главная страница)

**Цель:** Показать premium-позиционирование, направить пользователя к ключевым действиям.

**Структура:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                              HOME PAGE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  1. HEADER (Sticky)                                                    │
│     ├── Logo (Gold)                                                    │
│     ├── Navigation: Каталог | Конструктор ПК | Услуги | О нас         │
│     ├── Search (Icon)                                                  │
│     ├── Cart (Icon + Badge)                                            │
│     └── Profile (Icon)                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  2. HERO SECTION (Bento Grid)                                          │
│     ├── Main Offer: "Соберите ПК мечты" — CTA "Начать сборку"          │
│     ├── PC Builder Promo — CTA "Попробовать"                           │
│     └── Warranty Promo — "Гарантия до 36 месяцев"                      │
├─────────────────────────────────────────────────────────────────────────┤
│  3. FEATURED CATEGORIES                                                 │
│     ├── Процессоры (Card with gold accent)                              │
│     ├── Видеокарты (Card with gold accent)                              │
│     ├── Материнские платы (Card with gold accent)                       │
│     └── Все категории →                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  4. POPULAR PRODUCTS (Carousel)                                         │
│     ├── Product Card 1                                                 │
│     ├── Product Card 2                                                 │
│     ├── Product Card 3                                                 │
│     ├── Product Card 4                                                 │
│     └── Navigation Arrows                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  5. PC BUILDER CTA                                                     │
│     ├── Illustration                                                   │
│     ├── Headline: "Создайте идеальную конфигурацию"                    │
│     ├── Features: Совместимость, Мощность, Гарантия                    │
│     └── CTA Button                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  6. ADVANTAGES                                                          │
│     ├── Доставка (Icon + Text)                                         │
│     ├── Гарантия (Icon + Text)                                         │
│     └── Поддержка (Icon + Text)                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  7. BRAND STORY (Optional)                                             │
│     ├── Heritage content                                               │
│     └── Quality commitment                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  8. FOOTER                                                              │
│     ├── Logo + Description                                             │
│     ├── Navigation Columns                                             │
│     ├── Contact Info                                                   │
│     ├── Social Links                                                   │
│     └── Copyright                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

**Необходимые компоненты:**
- Header (навигация с glassmorphism)
- Hero Bento Grid
- Category Cards (с золотыми акцентами)
- Product Card (dark theme)
- Product Carousel
- PC Builder Teaser
- Advantages Grid
- Footer

---

#### 5.2.2. Catalog Page (Страница каталога)

**Цель:** Помочь пользователю найти и выбрать нужный компонент.

**Структура:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                            CATALOG PAGE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  1. PAGE HEADER                                                        │
│     ├── Breadcrumb: Главная > Каталог > Процессоры                    │
│     ├── Page Title: "Процессоры"                                       │
│     └── Results count: "Найдено 248 товаров"                           │
├─────────────────────────────────────────────────────────────────────────┤
│  2. FILTERS SIDEBAR (Left)                                             │
│     ├── Category Filter (Tree)                                         │
│     ├── Price Range (Dual Slider)                                      │
│     ├── Manufacturer (Checkboxes)                                      │
│     ├── Specifications (Dynamic based on category)                     │
│     ├── Availability Toggle                                           │
│     └── Reset Filters Button                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  3. MAIN CONTENT                                                        │
│     ├── Toolbar                                                        │
│     │   ├── View Toggle (Grid | List)                                  │
│     │   ├── Sort Dropdown (Price, Name, Popularity)                    │
│     │   └── Per Page (24, 48, 96)                                     │
│     │                                                                   │
│     └── Product Grid                                                   │
│         ├── Product Card 1                                             │
│         ├── Product Card 2                                             │
│         ├── Product Card 3                                             │
│         └── ...                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  4. PAGINATION                                                          │
│     └── Page Numbers (Dark theme)                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

**Необходимые компоненты:**
- Breadcrumb Navigation
- Filter Sidebar (glassmorphism panel)
- Filter Group Component
- Price Range Slider
- Checkbox Filter
- Product Grid
- Product Card
- Sort Dropdown
- View Toggle
- Pagination
- Results Counter

---

#### 5.2.3. Product Detail Page (Страница товара)

**Цель:** Презентовать товар и мотивировать к покупке.

**Структура:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRODUCT DETAIL PAGE                             │
├─────────────────────────────────────────────────────────────────────────┤
│  1. BREADCRUMB                                                         │
│     └── Главная > Каталог > Процессоры > AMD Ryzen 9 7950X            │
├─────────────────────────────────────────────────────────────────────────┤
│  2. PRODUCT HERO                                                       │
│     ├── Image Gallery                                                  │
│     │   ├── Main Image (Large)                                         │
│     │   ├── Thumbnail Strip                                           │
│     │   └── Zoom Modal (on click)                                     │
│     │                                                                   │
│     └── Product Info                                                   │
│         ├── Manufacturer Badge                                         │
│         ├── Product Title (Serif)                                      │
│         ├── Rating + Reviews Count                                     │
│         ├── Price (Gold accent)                                        │
│         ├── Availability Status                                        │
│         ├── Add to Cart Button (Gold)                                  │
│         ├── Add to Wishlist (Icon)                                     │
│         └── Share Buttons                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  3. PRODUCT TABS                                                        │
│     ├── Specifications (Default active)                               │
│     │   └── Specs Table (Dark theme)                                   │
│     ├── Description                                                     │
│     │   └── Rich text content                                          │
│     ├── Compatibility                                                   │
│     │   └── Compatible components list                                 │
│     └── Reviews                                                         │
│         ├── Rating Summary                                             │
│         └── Review List                                                │
├─────────────────────────────────────────────────────────────────────────┤
│  4. RELATED PRODUCTS                                                    │
│     └── Carousel of similar items                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  5. RECENTLY VIEWED (Optional)                                         │
│     └── Horizontal scroll                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

**Необходимые компоненты:**
- Breadcrumb Navigation
- Image Gallery (with zoom)
- Product Title (Serif, gold accents)
- Rating Component
- Price Display (with discounts)
- Stock Status Indicator
- Add to Cart Button (Gold CTA)
- Add to Wishlist Button
- Tab Navigation
- Specifications Table
- Reviews List
- Rating Input Form
- Related Products Carousel

---

#### 5.2.4. PC Builder Page (Конструктор ПК)

**Цель:** Позволить пользователю собрать совместимую конфигурацию ПК.

**Структура:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PC BUILDER PAGE                                │
├─────────────────────────────────────────────────────────────────────────┤
│  1. HEADER                                                              │
│     ├── Build Name Input                                               │
│     ├── Save Button                                                    │
│     └── Share/Export Button                                            │
├─────────────────────────────────────────────────────────────────────────┤
│  2. TWO-COLUMN LAYOUT                                                  │
│                                                                         │
│  ┌─────────────────────────────┐  ┌────────────────────────────────┐   │
│  │ COMPONENT SLOTS             │  │ SUMMARY PANEL (Sticky)         │   │
│  │                             │  │                                │   │
│  │  ├── CPU Slot               │  │ ├── Total Price (Gold)          │   │
│  │  │   └── [Selected/Empty]   │  │ ├── Power Consumption           │   │
│  │  │                          │  │ ├── Compatibility Status         │   │
│  │  ├── Motherboard Slot       │  │ │   ├── ✓ All OK                │   │
│  │  │   └── [Selected/Empty]   │  │ │   ├── ⚠ Warning              │   │
│  │  │                          │  │ │   └── ✗ Error                │   │
│  │  ├── GPU Slot               │  │ ├── Actions                     │   │
│  │  │   └── [Selected/Empty]   │  │ │   ├── Add to Cart            │   │
│  │  │                          │  │ │   ├── Save Build             │   │
│  │  ├── RAM Slot               │  │ │   └── Export PDF             │   │
│  │  │   └── [Selected/Empty]   │  │ │                                │   │
│  │  │                          │  │ └────────────────────────────────┘   │
│  │  ├── Storage Slot           │  │                                │   │
│  │  │   └── [Selected/Empty]   │  │                                │   │
│  │  │                          │  │                                │   │
│  │  ├── PSU Slot               │  │                                │   │
│  │  │   └── [Selected/Empty]   │  │                                │   │
│  │  │                          │  │                                │   │
│  │  ├── Case Slot              │  │                                │   │
│  │  │   └── [Selected/Empty]   │  │                                │   │
│  │  │                          │  │                                │   │
│  │  └── Cooler Slot            │  │                                │   │
│  │      └── [Selected/Empty]   │  │                                │   │
│  │                             │  │                                │   │
│  └─────────────────────────────┘  └────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│  3. COMPONENT SELECTION MODAL                                          │
│     ├── Search Input                                                   │
│     ├── Filters (Manufacturer, Specs, Price)                           │
│     ├── Sort Dropdown                                                   │
│     ├── Component List                                                  │
│     │   └── Component Cards (with compatibility badge)                │
│     └── Pagination                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Необходимые компоненты:**
- Build Header (Name Input, Save, Share)
- Component Slot (в соответствии с components-spec.md)
- Component Selection Modal
- Summary Panel (Sticky)
- Compatibility Indicator
- Power Calculator
- Price Calculator
- Save/Load Build
- Export PDF
- Share Link Generator

---

#### 5.2.5. Cart Page (Корзина)

**Цель:** Показать выбранные товары и направить к оформлению.

**Структура:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                             CART PAGE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  1. PAGE HEADER                                                        │
│     └── Title: "Корзина" + Items count                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  2. CART ITEMS LIST                                                    │
│     ├── Cart Item 1                                                    │
│     │   ├── Image                                                      │
│     │   ├── Name + Link                                                │
│     │   ├── Price                                                       │
│     │   ├── Quantity Controls (+/-)                                    │
│     │   ├── Subtotal                                                    │
│     │   └── Remove Button                                              │
│     │                                                                   │
│     ├── Cart Item 2                                                    │
│     └── ...                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│  3. ORDER SUMMARY (Right Sidebar)                                      │
│     ├── Subtotal                                                        │
│     ├── Discount (if applied)                                          │
│     ├── Promo Code Input                                               │
│     ├── Delivery Cost                                                   │
│     ├── Total (Gold accent)                                            │
│     └── Checkout Button (Gold CTA)                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  4. CONTINUE SHOPPING LINK                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

**Необходимые компоненты:**
- Cart Item Row
- Quantity Selector
- Order Summary Panel
- Promo Code Input
- Checkout Button
- Empty Cart State

---

#### 5.2.6. Checkout Page (Оформление заказа)

**Цель:** Собрать информацию для доставки и оплаты.

**Структура:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CHECKOUT PAGE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  1. STEPS INDICATOR                                                    │
│     └── 1. Доставка → 2. Оплата → 3. Подтверждение                     │
├─────────────────────────────────────────────────────────────────────────┤
│  2. SHIPPING FORM                                                      │
│     ├── Contact Info                                                    │
│     │   ├── Name                                                        │
│     │   ├── Phone                                                       │
│     │   └── Email                                                       │
│     │                                                                   │
│     ├── Delivery Method                                                 │
│     │   ├── Pickup (Free)                                               │
│     │   ├── Courier (Price based on location)                          │
│     │   └── Post Service                                                 │
│     │                                                                   │
│     └── Address Form                                                    │
│         ├── City                                                         │
│         ├── Street                                                       │
│         ├── House                                                        │
│         ├── Apartment                                                    │
│         └── Postal Code                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  3. PAYMENT FORM                                                        │
│     ├── Payment Method                                                  │
│     │   ├── Card Online (Form)                                         │
│     │   ├── Card on Delivery                                           │
│     │   └── Cash on Delivery                                            │
│     │                                                                   │
│     └── Card Input (if card online)                                    │
│         ├── Card Number                                                 │
│         ├── Expiry Date                                                  │
│         └── CVV                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  4. ORDER REVIEW                                                        │
│     └── Order Summary (Collapsed)                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  5. PLACE ORDER BUTTON (Gold CTA)                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

**Необходимые компоненты:**
- Steps Indicator
- Form Input Fields
- Radio Group (Delivery Method)
- Radio Group (Payment Method)
- Card Input (Masked)
- Address Autocomplete
- Order Summary (Collapsible)
- Place Order Button

---

#### 5.2.7. User Profile (Личный кабинет)

**Цель:** Управление аккаунтом, историей заказов и избранным.

**Структура:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER PROFILE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  1. PROFILE HEADER                                                     │
│     ├── Avatar (Gold border)                                           │
│     ├── User Name                                                       │
│     └── Member Since Date                                               │
├─────────────────────────────────────────────────────────────────────────┤
│  2. NAVIGATION TABS                                                    │
│     ├── Profile                                                         │
│     ├── Orders                                                          │
│     ├── Wishlist                                                        │
│     ├── My Builds (from PC Builder)                                    │
│     └── Settings                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  3. TAB CONTENT                                                        │
│                                                                         │
│  ├── PROFILE TAB                                                        │
│  │   ├── Personal Info Form                                            │
│  │   ├── Password Change                                                │
│  │   └── Notification Preferences                                      │
│  │                                                                      │
│  ├── ORDERS TAB                                                         │
│  │   ├── Order List                                                     │
│  │   │   └── Order Card (Date, Status, Items, Total)                  │
│  │   └── Order Details Modal                                           │
│  │                                                                      │
│  ├── WISHLIST TAB                                                       │
│  │   └── Wishlist Grid (Product Cards)                                 │
│  │                                                                      │
│  ├── MY BUILDS TAB                                                      │
│  │   └── Saved PC Configurations                                       │
│  │       └── Build Card (Name, Components, Price, Actions)            │
│  │                                                                      │
│  └── SETTINGS TAB                                                       │
│      ├── Language                                                        │
│      ├── Theme (Dark/Light)                                             │
│      └── Privacy                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Необходимые компоненты:**
- Avatar Component (with gold border)
- Profile Navigation Tabs
- Personal Info Form
- Order History List
- Order Detail Card
- Wishlist Grid
- Saved Build Card
- Settings Panel

---

#### 5.2.8. About Us Page (О компании)

**Цель:** Рассказать историю бренда, показать ценности.

**Структура:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ABOUT US PAGE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  1. HERO BANNER                                                        │
│     ├── Background Image (Store/Team)                                   │
│     ├── Title: "О GoldPC"                                               │
│     └── Tagline: "Премиальные компьютеры с 2020 года"                  │
├─────────────────────────────────────────────────────────────────────────┤
│  2. BRAND STORY                                                        │
│     ├── Mission Statement                                               │
│     ├── History Timeline                                                │
│     └── Values (Grid)                                                   │
│         ├── Quality                                                     │
│         ├── Expertise                                                   │
│         ├── Service                                                     │
│         └── Trust                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  3. TEAM SECTION (Optional)                                            │
│     └── Team Member Cards                                              │
├─────────────────────────────────────────────────────────────────────────┤
│  4. CERTIFICATIONS & PARTNERS                                          │
│     ├── AMD Partner                                                     │
│     ├── Intel Partner                                                   │
│     ├── NVIDIA Partner                                                  │
│     └── Certifications Grid                                            │
├─────────────────────────────────────────────────────────────────────────┤
│  5. CONTACT CTA                                                        │
│     ├── "Свяжитесь с нами"                                              │
│     └── Contact Form                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Необходимые компоненты:**
- Hero Banner
- Story Section
- Value Card
- Timeline Component
- Team Member Card
- Partner Logo Grid
- Contact Form

---

### 5.3. Сводная таблица компонентов

| Категория | Компонент | Страницы | Приоритет |
|-----------|-----------|----------|-----------|
| **Navigation** | Header | Все | P0 |
| **Navigation** | Footer | Все | P0 |
| **Navigation** | Breadcrumb | Catalog, Product, Profile | P1 |
| **Navigation** | Pagination | Catalog, Reviews | P1 |
| **Product** | Product Card | Home, Catalog, Related | P0 |
| **Product** | Product Grid | Catalog | P0 |
| **Product** | Image Gallery | Product Detail | P0 |
| **Product** | Price Display | Product Card, Product Detail | P0 |
| **Product** | Rating | Product Card, Reviews | P1 |
| **Product** | Stock Status | Product Card, Product Detail | P0 |
| **Product** | Add to Cart Button | Product Card, Product Detail | P0 |
| **Product** | Wishlist Button | Product Card, Product Detail | P1 |
| **Filter** | Filter Sidebar | Catalog | P0 |
| **Filter** | Price Range Slider | Catalog | P0 |
| **Filter** | Checkbox Filter | Catalog | P0 |
| **Filter** | Category Tree | Catalog | P1 |
| **PC Builder** | Component Slot | PC Builder | P0 |
| **PC Builder** | Component Selection Modal | PC Builder | P0 |
| **PC Builder** | Summary Panel | PC Builder | P0 |
| **PC Builder** | Compatibility Indicator | PC Builder | P0 |
| **Cart** | Cart Item Row | Cart | P0 |
| **Cart** | Order Summary | Cart, Checkout | P0 |
| **Cart** | Quantity Selector | Cart | P0 |
| **Checkout** | Steps Indicator | Checkout | P1 |
| **Checkout** | Address Form | Checkout | P0 |
| **Checkout** | Payment Method | Checkout | P0 |
| **User** | Avatar | Profile | P1 |
| **User** | Order Card | Profile | P0 |
| **User** | Saved Build Card | Profile | P1 |
| **UI** | Button (Primary/Secondary/Ghost) | Все | P0 |
| **UI** | Input Field | Forms | P0 |
| **UI** | Select Dropdown | Forms | P0 |
| **UI** | Modal | Все модальные окна | P0 |
| **UI** | Toast Notification | Все | P1 |
| **UI** | Loading Spinner | Все | P1 |
| **UI** | Error State | Все | P0 |
| **UI** | Empty State | Cart, Wishlist, Orders | P1 |

---

## 6. Рекомендации и выводы

### 6.1. Ключевые рекомендации

#### Визуальная идентичность

1. **Тёмный режим как основа** — Использовать Deep Black (#09090B) как основной фон для создания премиального ощущения.

2. **Золото как акцент** — Ограничить использование золота 10-15% площади экрана для сохранения эксклюзивности.

3. **Металлические градиенты** — Применять градиенты для имитации реального металла на ключевых элементах (кнопки, рамки).

4. **Serif + Sans-serif** — Использовать Playfair Display для заголовков и Inter для основного текста для баланса элегантности и читаемости.

#### UX-принципы

1. **Product-first** — Товар всегда герой, минимизация отвлекающих элементов.

2. **Glassmorphism** — Использовать размытие для создания глубины без перегрузки.

3. **Micro-interactions** — Добавлять плавные анимации для premium-feeling.

4. **Accessibility** — Обеспечить контрастность 4.5:1 даже в тёмной теме.

### 6.2. Следующие шаги

| Приоритет | Задача | Срок |
|-----------|--------|------|
| P0 | Создать дизайн-систему с токенами | 1 неделя |
| P0 | Разработать компоненты Header, Footer | 1 неделя |
| P0 | Создать Product Card и Product Grid | 1 неделя |
| P1 | Разработать страницу Product Detail | 2 недели |
| P1 | Разработать PC Builder Interface | 3 недели |
| P2 | Создать страницу Catalog с фильтрами | 2 недели |
| P2 | Разработать Cart и Checkout | 2 недели |
| P3 | Создать User Profile | 1 неделя |
| P3 | Создать About Us | 1 неделя |

### 6.3. Метрики успеха

| Метрика | Цель | Измерение |
|---------|------|-----------|
| **Время на странице** | > 3 минут | Google Analytics |
| **Bounce rate** | < 40% | Google Analytics |
| **Conversion rate** | > 3% | E-commerce tracking |
| **Cart abandonment** | < 60% | E-commerce tracking |
| **PC Builder completion** | > 50% | Custom events |
| **User satisfaction** | > 4.5/5 | Post-purchase survey |

---

## Приложение A: Ссылки на существующие документы

| Документ | Путь | Описание |
|----------|------|----------|
| Design System | `docs/design-system.md` | Базовая дизайн-система |
| Components Spec | `docs/design/components-spec.md` | Спецификация UI-компонентов |
| Homepage Layout | `docs/design/homepage-layout.md` | Макет главной страницы |

---

## Приложение B: Источники исследования

1. **Razer Official Website** — razer.com — Визуальная идентичность, UI паттерны
2. **ASUS ROG Official Website** — rog.asus.com — UI паттерны, продуктовые страницы
3. **Apple Official Website** — apple.com — Минимализм, продуктовая фотография
4. **Rolex Official Website** — rolex.com — Золотые акценты, премиальный UX
5. **Patek Philippe Official Website** — patek.com — Heritage, сторителлинг

---

**Документ завершён.**

*Создано: 16.03.2026*  
*Версия: 1.0.0*  
*Проект: GoldPC*
