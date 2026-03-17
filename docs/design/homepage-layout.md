# GoldPC — Макет главной страницы (Homepage Layout)

**Документ:** Wireframe Description  
**Версия:** 1.0  
**Дата:** 21.02.2025  
**Автор:** UX Architect

---

## 1. Обзор структуры страницы

Главная страница GoldPC состоит из следующих секций (сверху вниз):

| № | Секция | Высота | Приоритет |
|---|--------|--------|-----------|
| 1 | Header | 72px (sticky) | Критический |
| 2 | Hero Section (Bento Grid) | ~600px | Критический |
| 3 | Product Carousel | ~450px | Высокий |
| 4 | Advantages | ~300px | Средний |
| 5 | Footer | ~350px | Высокий |

**Общая структура:**

```
┌─────────────────────────────────────────────────────────────┐
│                         HEADER (sticky)                     │
│                    [Logo] [Nav] [Actions]                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     HERO SECTION                            │
│                    (Bento Grid Layout)                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                   PRODUCT CAROUSEL                          │
│                    "Popular Products"                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     ADVANTAGES                              │
│           [Delivery] [Guarantee] [Support]                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                        FOOTER                               │
│              [Wave Divider + Dark Green BG]                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Header (Навигационная панель)

### 2.1. Описание

**Тип:** Sticky навигация с эффектом glassmorphism при прокрутке.

**Поведение:**
- Начальное состояние: прозрачный фон (`transparent`)
- При прокрутке > 50px: glassmorphism эффект
- Всегда виден при прокрутке (position: fixed)

### 2.2. Структура Header

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo]     Каталог  Конструктор ПК  Услуги  О компании     [Search] [Cart] [Profile]  │
│  GoldPC                                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3. Детализация элементов

| Элемент | Позиция | Размеры | Описание |
|---------|---------|---------|----------|
| Logo | Левый край | 120×40px | Логотип GoldPC с иконкой |
| Nav Links | Центр-лево | auto | Ссылки: Каталог, Конструктор ПК, Услуги, О компании |
| Search Icon | Правый блок | 24×24px | Иконка поиска, открывает модальное окно |
| Cart Icon | Правый блок | 24×24px | Корзина с badge-счётчиком товаров |
| Profile Icon | Правый край | 24×24px | Иконка пользователя / Аватар |

### 2.4. Glassmorphism эффект

**CSS-параметры:**

```css
.header--scrolled {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
}
```

**Переход:**
- Duration: 300ms
- Easing: ease-out

### 2.5. Responsive поведение

| Breakpoint | Поведение |
|------------|-----------|
| Desktop (≥1280px) | Полное меню, все элементы видны |
| Tablet (768-1279px) | Hamburger меню, logo + cart + profile |
| Mobile (<768px) | Hamburger меню, минимальный набор |

---

## 3. Hero Section (Bento Grid Layout)

### 3.1. Концепция Bento Grid

Bento Grid — это современный подход к размещению контента в виде "японской коробки для еды" (bento box), где контент организован в прямоугольные блоки разного размера, создавая визуально привлекательную и функциональную композицию.

**Принципы построения (по аналогии с NOVA):**
- Использование CSS Grid для гибкого размещения
- Крупные блоки для приоритетного контента
- Меньшие блоки для дополнительной информации
- Визуальный баланс между размерами плиток

### 3.2. Структура Bento Grid

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌────────────────────────────────────────┐  ┌─────────────────────┐ │
│  │                                        │  │                     │ │
│  │          MAIN OFFER TILE               │  │   PC BUILDER        │ │
│  │          (Large: 2×1)                  │  │   PROMO TILE        │ │
│  │                                        │  │   (Small: 1×1)      │ │
│  │     "Соберите ПК мечты                 │  │                     │ │
│  │      с гарантией совместимости"        │  │   🖥️ Конструктор    │ │
│  │                                        │  │                      │ │
│  │      [Начать сборку]                   │  └─────────────────────┘ │
│  │                                        │  ┌─────────────────────┐ │
│  │                                        │  │   WARRANTY TILE     │ │
│  │                                        │  │   (Small: 1×1)      │ │
│  │                                        │  │                     │ │
│  │                                        │  │   🛡️ Гарантия       │ │
│  │                                        │  │   до 36 месяцев     │ │
│  └────────────────────────────────────────┘  └─────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3. Детализация плиток Bento Grid

#### 3.3.1. Main Offer Tile (Главная плитка)

| Параметр | Значение |
|----------|----------|
| Размер | 2 колонки × 1 строка (span 2) |
| Позиция | Левая часть grid |
| Пропорции | ~65% ширины на desktop |

**Содержимое:**
- Заголовок H1: "Соберите ПК мечты с гарантией совместимости"
- Подзаголовок: "Автоматическая проверка совместимости комплектующих, расчёт мощности и оптимизация под ваши задачи"
- CTA кнопка: "Начать сборку" (primary, gold accent)
- Фоновое изображение: Полупрозрачная иллюстрация компонентов ПК

**Стилизация:**
- Background: Градиент от brand-green (#1a5d1a) к dark-green (#0d3d0d)
- Text: White (#ffffff)
- Accent: Gold (#d4af37) для CTA кнопки
- Border-radius: 24px
- Padding: 48px

#### 3.3.2. PC Builder Promo Tile (Плитка конструктора)

| Параметр | Значение |
|----------|----------|
| Размер | 1 колонка × 1 строка |
| Позиция | Правый верхний угол |
| Пропорции | ~35% ширины на desktop |

**Содержимое:**
- Иконка: 🖥️ (или SVG иконка компьютера)
- Заголовок H3: "Конструктор ПК"
- Текст: "Соберите идеальную конфигурацию"
- CTA: Стрелка-ссылка "Попробовать →"

**Стилизация:**
- Background: Light gradient (#f8f9fa → #e9ecef)
- Text: Dark (#212529)
- Icon size: 48px
- Border-radius: 20px
- Hover: Лёгкий scale(1.02) и тень

#### 3.3.3. Warranty Tile (Плитка гарантии)

| Параметр | Значение |
|----------|----------|
| Размер | 1 колонка × 1 строка |
| Позиция | Правый нижний угол |
| Пропорции | ~35% ширины на desktop |

**Содержимое:**
- Иконка: 🛡️ (или SVG иконка щита)
- Заголовок H3: "Гарантия до 36 месяцев"
- Текст: "Расширенная гарантия на все комплектующие"
- CTA: "Подробнее →"

**Стилизация:**
- Background: Gold gradient (#d4af37 → #b8962e)
- Text: Dark (#1a1a1a)
- Icon size: 48px
- Border-radius: 20px

### 3.4. CSS Grid Layout

```css
.hero-bento-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 24px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

.hero-tile--main {
  grid-column: 1;
  grid-row: 1 / 3; /* Занимает обе строки */
}

.hero-tile--builder {
  grid-column: 2;
  grid-row: 1;
}

.hero-tile--warranty {
  grid-column: 2;
  grid-row: 2;
}
```

### 3.5. Responsive поведение Bento Grid

| Breakpoint | Структура |
|------------|-----------|
| Desktop (≥1024px) | 2 колонки: Main (2×1), Builder (1×1), Warranty (1×1) |
| Tablet (768-1023px) | 2 колонки: Main (2×1), Builder и Warranty stacked |
| Mobile (<768px) | 1 колонка: Все плитки stacked вертикально |

**Mobile Layout:**

```
┌─────────────────────────────┐
│      MAIN OFFER TILE        │
│                             │
└─────────────────────────────┘
┌─────────────────────────────┐
│      PC BUILDER TILE        │
└─────────────────────────────┘
┌─────────────────────────────┐
│      WARRANTY TILE          │
└─────────────────────────────┘
```

---

## 4. Product Carousel ("Popular Products")

### 4.1. Описание

Карусель популярных товаров с горизонтальной прокруткой и навигационными стрелками.

### 4.2. Структура

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   Популярные товары                              [<] [>]            │
│                                                                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │  [Img]   │  │  [Img]   │  │  [Img]   │  │  [Img]   │            │
│   │          │  │          │  │          │  │          │            │
│   │ Product  │  │ Product  │  │ Product  │  │ Product  │            │
│   │  Name    │  │  Name    │  │  Name    │  │  Name    │            │
│   │          │  │          │  │          │  │          │            │
│   │  12 500₽ │  │  45 990₽ │  │  8 990₽  │  │  23 400₽ │            │
│   │ [В кор.] │  │ [В кор.] │  │ [В кор.] │  │ [В кор.] │            │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.3. Детализация элементов

| Элемент | Описание |
|---------|----------|
| Section Title | H2 "Популярные товары", слева |
| Navigation | Стрелки < > справа от заголовка |
| Product Card | Изображение 200×200px, название, цена, кнопка "В корзину" |
| Cards count | 4 видимых карточки на desktop |

### 4.4. Карточка товара

```
┌─────────────────────┐
│                     │
│    [Product Image]  │
│     200×200px       │
│                     │
├─────────────────────┤
│ NVIDIA RTX 4070     │
│ Graphics Card       │
│                     │
│    45 990 ₽         │
│                     │
│  [🛒 В корзину]     │
└─────────────────────┘
```

**Размеры:**
- Width: 280px (desktop), 220px (tablet), 160px (mobile)
- Border-radius: 16px
- Box-shadow: 0 4px 12px rgba(0,0,0,0.08)
- Hover: Трансформация translateY(-4px) + усиление тени

### 4.5. Навигация карусели

| Элемент | Поведение |
|---------|-----------|
| Arrow Left | Прокрутка на 1 карточку влево |
| Arrow Right | Прокрутка на 1 карточку вправо |
| Touch/Swipe | Горизонтальный свайп на мобильных |
| Pagination | Точки-индикаторы под каруселью (опционально) |

---

## 5. Advantages Section

### 5.1. Описание

Секция с ключевыми преимуществами магазина: Доставка, Гарантия, Поддержка.

### 5.2. Структура

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│   │                 │  │                 │  │                 │     │
│   │    🚚           │  │    🛡️           │  │    💬           │     │
│   │                 │  │                 │  │                 │     │
│   │   Доставка      │  │   Гарантия      │  │   Поддержка     │     │
│   │                 │  │                 │  │                 │     │
│   │  Бесплатная     │  │  До 36 месяцев  │  │  24/7 онлайн    │     │
│   │  от 5000₽       │  │  на товары      │  │  консультации   │     │
│   │                 │  │                 │  │                 │     │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.3. Детализация карточек преимуществ

| Карточка | Иконка | Заголовок | Описание |
|----------|--------|-----------|----------|
| Delivery | 🚚 | Доставка | Бесплатная доставка от 5000₽ по Минску |
| Guarantee | 🛡️ | Гарантия | До 36 месяцев на все комплектующие |
| Support | 💬 | Поддержка | Консультации специалистов 24/7 |

### 5.4. Стилизация

```css
.advantages-card {
  background: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s ease;
}

.advantages-card:hover {
  border-color: var(--brand-gold);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.15);
}
```

### 5.5. Grid Layout

```css
.advantages-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1024px;
  margin: 0 auto;
}

/* Tablet */
@media (max-width: 768px) {
  .advantages-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
```

---

## 6. Footer

### 6.1. Описание

Футер с тёмно-зелёным фоном и wave-divider сверху. Содержит навигацию, контакты и копирайт.

### 6.2. Wave Divider

**SVG Wave Divider** — волновой разделитель между Advantages и Footer.

```svg
<svg viewBox="0 0 1440 120" preserveAspectRatio="none">
  <path d="M0,64 C288,120 576,0 864,64 C1152,128 1440,32 1440,64 L1440,120 L0,120 Z" 
        fill="#0d3d0d"/>
</svg>
```

**CSS:**

```css
.wave-divider {
  width: 100%;
  height: 80px;
  margin-top: -1px;
}

.wave-divider svg {
  display: block;
  width: 100%;
  height: 100%;
}
```

### 6.3. Структура Footer

```
┌──────────────────────────────────────────────────────────────────────┐
│                         [Wave Divider SVG]                           │
├──────────────────────────────────────────────────────────────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ DARK GREEN BACKGROUND ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Logo      │  │  Каталог    │  │   Услуги    │  │  Контакты   │ │
│  │   GoldPC    │  │             │  │             │  │             │ │
│  │             │  │  Процессоры │  │  Ремонт     │  │  📞 +375... │ │
│  │  Компьютер- │  │  Видеокарты │  │  Диагностика│  │  📧 info@   │ │
│  │  ный магазин│  │  Память     │  │  Сборка ПК  │  │  📍 Минск   │ │
│  │  с сервисом │  │  ...        │  │             │  │             │ │
│  │             │  │             │  │             │  │             │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│  © 2025 GoldPC. Все права защищены.    [Social Icons: TG, IG, VK]   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.4. Детализация колонок Footer

| Колонка | Содержимое |
|---------|------------|
| Logo | Логотип GoldPC + краткое описание |
| Catalog | Ссылки на категории товаров |
| Services | Ссылки на услуги (Ремонт, Диагностика, Сборка) |
| Contacts | Телефон, email, адрес, часы работы |

### 6.5. Стилизация Footer

```css
.footer {
  background: linear-gradient(180deg, #0d3d0d 0%, #1a5d1a 100%);
  color: #ffffff;
  padding: 64px 24px 24px;
}

.footer a {
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.2s ease;
}

.footer a:hover {
  color: var(--brand-gold);
}
```

---

## 7. Интерактивность и анимации

### 7.1. Scroll-Triggered Reveal

Все секции появляются при прокрутке с анимацией fade-in.

**Библиотека:** Intersection Observer API (нативный JS) или Framer Motion (React).

**Паттерн анимации:**

```css
.section {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.section--visible {
  opacity: 1;
  transform: translateY(0);
}
```

**JavaScript (Intersection Observer):**

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('section--visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.section').forEach((section) => {
  observer.observe(section);
});
```

**Задержки (staggered animation) для карточек:**

| Элемент | Delay |
|---------|-------|
| Карточка 1 | 0ms |
| Карточка 2 | 100ms |
| Карточка 3 | 200ms |
| Карточка 4 | 300ms |

### 7.2. Parallax на Blob-элементах

Декоративные blob-формы на фоне Hero секции с эффектом параллакса.

**HTML-структура:**

```html
<section class="hero">
  <div class="blob blob--1"></div>
  <div class="blob blob--2"></div>
  <div class="blob blob--3"></div>
  <!-- Content -->
</section>
```

**CSS для blob-элементов:**

```css
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  pointer-events: none;
}

.blob--1 {
  width: 400px;
  height: 400px;
  background: var(--brand-gold);
  top: -100px;
  right: 10%;
}

.blob--2 {
  width: 300px;
  height: 300px;
  background: var(--brand-green);
  bottom: 10%;
  left: 5%;
}

.blob--3 {
  width: 250px;
  height: 250px;
  background: #4a90a4;
  top: 40%;
  right: 30%;
}
```

**JavaScript (Parallax effect):**

```javascript
document.addEventListener('mousemove', (e) => {
  const blobs = document.querySelectorAll('.blob');
  const { clientX, clientY } = e;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  
  blobs.forEach((blob, index) => {
    const speed = (index + 1) * 0.02;
    const x = (clientX - centerX) * speed;
    const y = (clientY - centerY) * speed;
    
    blob.style.transform = `translate(${x}px, ${y}px)`;
  });
});
```

**Альтернатива (Scroll-based parallax):**

```javascript
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const blobs = document.querySelectorAll('.blob');
  
  blobs.forEach((blob, index) => {
    const speed = (index + 1) * 0.1;
    blob.style.transform = `translateY(${scrollY * speed}px)`;
  });
});
```

### 7.3. Микро-взаимодействия

| Элемент | Триггер | Анимация |
|---------|---------|----------|
| CTA кнопки | Hover | Scale 1.05, glow эффект |
| Карточки товаров | Hover | translateY(-4px), shadow |
| Nav links | Hover | Underline slide-in |
| Иконки | Hover | Rotate или pulse |
| Carousel arrows | Hover | Scale 1.1, color change |

---

## 8. Цветовая палитра

| Название | Значение | Применение |
|----------|----------|------------|
| Brand Green | `#1a5d1a` | Primary color, кнопки, акценты |
| Dark Green | `#0d3d0d` | Footer background, gradients |
| Brand Gold | `#d4af37` | Accent color, CTA buttons |
| White | `#ffffff` | Backgrounds, text on dark |
| Light Gray | `#f8f9fa` | Section backgrounds |
| Text Dark | `#212529` | Основной текст |
| Text Muted | `#6c757d` | Вторичный текст |

---

## 9. Типографика

| Элемент | Font | Size | Weight |
|---------|------|------|--------|
| H1 (Hero) | Inter / Montserrat | 48px / 3rem | 700 |
| H2 (Section) | Inter / Montserrat | 32px / 2rem | 600 |
| H3 (Card) | Inter / Montserrat | 20px / 1.25rem | 600 |
| Body | Inter | 16px / 1rem | 400 |
| Small | Inter | 14px / 0.875rem | 400 |
| Button | Inter | 16px / 1rem | 600 |

---

## 10. Responsive breakpoints

| Breakpoint | Ширина | Изменения |
|------------|--------|-----------|
| Desktop XL | ≥1440px | Max-width контейнера 1280px |
| Desktop | 1024-1439px | Полный layout |
| Tablet | 768-1023px | Bento grid 2→1 колонка |
| Mobile | <768px | Single column, hamburger menu |
| Mobile S | <375px | Уменьшенные размеры элементов |

---

## 11. Accessibility (a11y)

### 11.1. Требования WCAG 2.1 AA

- **Контрастность:** Минимум 4.5:1 для обычного текста, 3:1 для крупного
- **Keyboard navigation:** Все интерактивные элементы доступны с клавиатуры
- **Focus indicators:** Видимые индикаторы фокуса (outline: 2px solid)
- **ARIA labels:** Для иконок, кнопок без текста
- **Alt text:** Для всех изображений товаров

### 11.2. Примеры ARIA-атрибутов

```html
<!-- Carousel navigation -->
<button aria-label="Предыдущий товар" class="carousel-arrow carousel-arrow--prev">
  <ChevronLeft />
</button>

<!-- Product card -->
<article role="article" aria-labelledby="product-name-123">
  <img src="..." alt="NVIDIA RTX 4070 Graphics Card" />
  <h3 id="product-name-123">NVIDIA RTX 4070</h3>
</article>

<!-- Search button -->
<button aria-label="Поиск по каталогу">
  <SearchIcon />
</button>
```

---

## 12. Производительность

### 12.1. Оптимизация изображений

| Формат | Применение |
|--------|------------|
| WebP | Основной формат для фотографий товаров |
| AVIF | При поддержке браузера |
| SVG | Иконки, blob-формы, wave divider |
| PNG | Только для прозрачности, если WebP не подходит |

### 12.2. Lazy Loading

```html
<img src="product.webp" loading="lazy" decoding="async" />
```

### 12.3. Critical CSS

- Inline критического CSS для above-the-fold контента
- Асинхронная загрузка остальных стилей

---

## 13. Итоговая диаграмма макета

```
╔══════════════════════════════════════════════════════════════════════╗
║                           HEADER (sticky)                            ║
║  [Logo]  Каталог  Конструктор  Услуги  О нас    [🔍] [🛒] [👤]       ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ┌────────────────────────────────────────┐  ┌───────────────────┐  ║
║  │                                        │  │ 🖥️ Конструктор ПК │  ║
║  │    🎮 СОБЕРИТЕ ПК МЕЧТЫ                │  │   Попробовать →   │  ║
║  │       с гарантией совместимости        │  └───────────────────┘  ║
║  │                                        │  ┌───────────────────┐  ║
║  │    Автоматическая проверка             │  │ 🛡️ Гарантия       │  ║
║  │    совместимости комплектующих         │  │   до 36 месяцев   │  ║
║  │                                        │  │   Подробнее →     │  ║
║  │         [🚀 Начать сборку]             │  └───────────────────┘  ║
║  └────────────────────────────────────────┘                         ║
║                         HERO SECTION (Bento Grid)                   ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   Популярные товары                                         [<] [>] ║
║   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐               ║
║   │  [img]  │  │  [img]  │  │  [img]  │  │  [img]  │               ║
║   │ Product │  │ Product │  │ Product │  │ Product │               ║
║   │ 12 500₽ │  │ 45 990₽ │  │  8 990₽ │  │ 23 400₽ │               ║
║   │[В корз.]│  │[В корз.]│  │[В корз.]│  │[В корз.]│               ║
║   └─────────┘  └─────────┘  └─────────┘  └─────────┘               ║
║                         PRODUCT CAROUSEL                            ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 ║
║   │     🚚      │  │     🛡️      │  │     💬      │                 ║
║   │   Доставка  │  │   Гарантия  │  │  Поддержка  │                 ║
║   │  от 5000₽   │  │ до 36 мес.  │  │   24/7     │                 ║
║   └─────────────┘  └─────────────┘  └─────────────┘                 ║
║                           ADVANTAGES                                ║
╠══════════════════════════════════════════════════════════════════════╣
║                      ∿∿∿ Wave Divider ∿∿∿                          ║
╠══════════════════════════════════════════════════════════════════════╣
║  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ DARK GREEN FOOTER ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ║
║  [Logo]     [Каталог]    [Услуги]    [Контакты]                    ║
║                                                                    ║
║  © 2025 GoldPC                          [TG] [IG] [VK]            ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

**Документ завершён.**

Для вопросов и уточнений обращайтесь к UX Architect проекта GoldPC.
