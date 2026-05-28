# GoldPC — BRAINSTORMING SWARM: Дополнительный анализ

> **Дата:** 24.05.2026  
> **Режим:** Multi-Agent Swarm (5 sub-agents)  
> **Основание:** DESIGN.md, AGENTS.md, index.css

---

## Содержание

1. [DESIGN.md Аудит соответствия (45 нарушений)](#1-designmd-аудит-соответствия)
2. [UX Анти-паттерны (15 находок)](#2-ux-анти-паттерны)
3. [Mobile-first проблемы (15 находок)](#3-mobile-first-проблемы)
4. [Анимации и Micro-interactions (10+5 сигнатур)](#4-анимации-и-micro-interactions)
5. [Product Innovation (20 идей)](#5-product-innovation)
6. [Сводный план "анти-нейрослоп"](#6-сводный-план-анти-нейрослоп)

---

## 1. DESIGN.md Аудит соответствия

### 1.1 Hardcoded hex → дизайн-токены (критично)

| # | Нарушение | Файлы | Пример кода | Исправление |
|---|-----------|-------|-------------|-------------|
| **DS-001** | `bg-[#0b0e11]` | AccountOverview, AccountOrders, AccountProfile, AccountRepairs, CustomerDashboard | `bg-[#0b0e11]` | `bg-background` |
| **DS-002** | `bg-[#1e2329]` | Все hex-страницы | `bg-[#1e2329]` | `bg-card` |
| **DS-003** | `border-[#2b3139]` | Все hex-страницы | `border-[#2b3139]` | `border-border` |
| **DS-004** | `text-[#eaecef]` | Все hex-страницы | `text-[#eaecef]` | `text-foreground` |
| **DS-005** | `text-[#707a8a]` | Все hex-страницы | `text-[#707a8a]` | `text-muted-foreground` |

### 1.2 Gold (#FCD535) misuse (10 нарушений)

| # | Где | Что сейчас | DESIGN.md | Исправление |
|---|-----|-----------|-----------|-------------|
| **DS-006** | Декоративные иконки | `bg-gold/10` для иконок | Gold только для primary CTA | `bg-surface-elevated` |
| **DS-007** | Рамка аватара | `border-2 border-gold` | Gold не для рамок | `border-border` |
| **DS-008** | Фон инициалов | `bg-gold` для аватара-заглушки | Gold не для surface fills | `bg-surface-elevated` |
| **DS-009** | Номера заказов | `text-gold` для `#123` | Gold не для body text | `text-foreground` |
| **DS-010** | Цифры статистики | `text-gold font-bold` | Gold stat = stat-callout-card только | `text-foreground font-tabular` |
| **DS-011** | Цены и суммы | `text-gold font-bold` на ценах | Gold не для body text | `text-foreground font-tabular` |
| **DS-012** | Пагинация active | `bg-gold text-gold-ink` | Gold не для пагинации | `bg-surface-elevated text-foreground` |
| **DS-013** | Timeline статусов | `border-gold bg-gold` | Gold не для прогресс-баров | `border-border bg-card` |
| **DS-014** | Focus border inputs | `focus:border-gold` | Focus ring = info-blue | `focus:border-info-blue` |
| **DS-015** | Спиннер загрузки | `text-gold animate-spin` | Gold не для индикаторов | `text-muted-foreground` |

### 1.3 Price-drop/price-rise misuse (10 нарушений)

| # | Где | Что сейчас | DESIGN.md | Исправление |
|---|-----|-----------|-----------|-------------|
| **DS-016** | Статус "Доставлен" | `bg-[#0ecb81]/10 text-[#0ecb81]` | Price-drop = ценовой сигнал | `bg-info-blue/10 text-info-blue` |
| **DS-017** | Статус "Отменён" | `bg-[#f6465d]/10 text-[#f6465d]` | Price-rise = ценовой сигнал | `bg-muted/10 text-muted-foreground` |
| **DS-018** | Гарантия "Активна" | `bg-price-drop/10 text-price-drop` | Price-drop ≠ статус | `bg-info-blue/10 text-info-blue` |
| **DS-019** | Гарантия "Истекла" | `bg-price-rise/10 text-price-rise` | Price-rise ≠ статус | `bg-muted/10 text-muted-foreground` |
| **DS-020** | Цифра "Активных" гарантий | `text-price-drop` | Price-drop ≠ success | `text-foreground` |
| **DS-021** | Цифра "Истекло" гарантий | `text-price-rise` | Price-rise ≠ error | `text-muted-foreground` |
| **DS-022** | Иконка гарантии | `bg-[#0ecb81]/10` | Price-drop ≠ декорация | `bg-surface-elevated` |
| **DS-023** | Бейдж "Совместима" | `bg-[#0ecb81]/10 text-[#0ecb81]` | Price-drop ≠ success | `bg-info-blue/10 text-info-blue` |
| **DS-024** | Требования пароля (выполнено) | `text-[#0ecb81]` | Price-drop ≠ форма | `text-foreground` |
| **DS-025** | Статус входа "Успешно" | `text-[#0ecb81]` | Price-drop ≠ статус | `text-foreground` |

### 1.4 Typography (Nunito/Nunito Sans)

| # | Нарушение | Исправление |
|---|-----------|-------------|
| **DS-026** | Все числа используют Nunito Sans | Добавить `font-tabular` на цены, статистику, количества |
| **DS-027** | `font-mono` только в 1 месте | Использовать единый `font-tabular` класс |

### 1.5 Border-radius

| # | Нарушение | Файлы | Исправление |
|---|-----------|-------|-------------|
| **DS-028** | Кнопки `rounded-lg` (8px) вместо `rounded-md` (6px) | AccountOrders, AccountProfile, AccountRepairs, CustomerDashboard | `rounded-md` |
| **DS-029** | Инпуты `rounded-lg` (8px) вместо `rounded-md` (6px) | AccountProfile | `rounded-md` |
| **DS-030** | Статус-бейджи `rounded-lg` (8px) вместо `rounded-sm` (4px) | Все hex-страницы | `rounded-sm` |

### 1.6 Spacing (4px-base)

| # | Нарушение | Исправление |
|---|-----------|-------------|
| **DS-031** | `p-5` (20px), `gap-5` (20px), `mb-5` (20px) | `p-4` (16px) или `p-6` (24px) |
| **DS-032** | `px-2.5` (10px), `py-2.5` (10px) | `px-3` (12px) или `px-2` (8px), `py-3` (12px) |

### 1.7 Button hierarchy

| # | Нарушение | Исправление |
|---|-----------|-------------|
| **DS-033** | `bg-blue-500` для кнопок в админке | `bg-accent text-gold-ink` (gold CTA) |
| **DS-034** | Gold CTA для фильтров | `bg-surface-elevated text-foreground` |

### 1.8 Админка — светлая тема (5 файлов)

| # | Файл | Исправление |
|---|------|-------------|
| **DS-035** | SettingsPage — полностью `text-gray-900`, `bg-white` | `bg-background text-foreground`, `bg-card border-border` |
| **DS-036** | AuditLogPage — `bg-white`, `text-gray-900`, `blue-500` | Тёмные токены |
| **DS-037** | CatalogManagementPage — `bg-white`, `bg-gray-50` | Тёмные токены |
| **DS-038** | UserFormPage — `bg-gray-900 text-white` | Тёмные токены |
| **DS-039** | DictionariesPage — `bg-gray-800 text-gray-900` | Тёмные токены |

### 1.9 Emoji → Lucide

| # | Файл | Emoji | Замена |
|---|------|-------|--------|
| **DS-040** | SettingsPage, CatalogManagementPage, DictionariesPage, CoordinatorDashboard | `🏠 📦 🔒 🔔 ⚙️ ✏️ 🗑️ 🔄 🟢 🔴 🟡 📉 👥 🚨 ✅ ⚠️` | lucide-react компоненты |

### 1.10 Gradient/Glow

| # | Нарушение | Исправление |
|---|-----------|-------------|
| **DS-041** | `bg-accent-glow` в UserManagementPage | `bg-surface-elevated` |
| **DS-042** | `shadow-sm` на карточках AuditLog/CatalogManagement | Убрать shadow, использовать `border-border` |

### 1.11 Прямой fetch()

| # | Нарушение | Исправление |
|---|-----------|-------------|
| **DS-043** | `fetch('/api/internal/...')` в CoordinatorDashboard | Использовать `apiClient` |

---

## 2. UX Анти-паттерны (Anti-"нейрослоп")

### AP-01: NotificationCenter — тема-призрак
**Файл:** `components/notification-center/NotificationCenter.tsx`  
**Проблема:** `bg-white`, `text-gray-600`, `border-gray-100`, английские подписи "Notifications". Весь UI тёмный — это светлая вставка из Tailwind UI.  
**Решение:** Перевести на тёмную тему: `bg-surface-elevated`, `text-muted-text`, `border-hairline-dark`, русский язык.

### AP-02: ProductCardSkeleton — белый квадрат
**Файл:** `components/ui/Skeleton/ProductCardSkeleton.tsx`  
**Проблема:** `<div className="aspect-square bg-white">` — белый блок на тёмном фоне во время загрузки.  
**Решение:** `bg-white` → `bg-surface-elevated`.

### AP-03: WarrantyPage CTA ведёт не туда
**Файл:** `pages/info/WarrantyPage.tsx`  
**Проблема:** Кнопка "Перейти в каталог" на странице гарантии — copy-paste с другой страницы.  
**Решение:** CTA должен вести на `/service-request` или `/contacts`.

### AP-04: "No image" на английском
**Файл:** `components/product-card/ProductCard.tsx`  
**Проблема:** `<span className="text-gray-400 text-sm">No image</span>` среди русского UI.  
**Решение:** `text-muted-text` и "Нет изображения" (или убрать текст).

### AP-05: Footer — inline SVG вместо lucide
**Файл:** `components/layout/footer/Footer.tsx`  
**Проблема:** Telegram иконка — сырой `<path>` в `<svg>`, не соответствует остальным иконкам.  
**Решение:** Вынести в компонент через lucide-react.

### AP-06: Copy-paste заголовков (×10)
**Файлы:** DeliveryPage, PaymentPage, WarrantyPage, ReturnsPage, FaqPage, ContactsPage, AboutPage и др.  
**Проблема:** Один и тот же Tailwind-паттерн h1 скопирован на все info-страницы.  
**Решение:** Единый компонент `<PageHero>`.

### AP-07: Copy-paste иконок (×30+)
**Проблема:** Паттерн `w-12 h-12 bg-gold/10 text-gold rounded-lg` повторяется 30+ раз.  
**Решение:** Компонент `<IconBox icon={Icon} size={24} />`.

### AP-08: ServiceRequestPage — mix tokens + произвольные цвета
**Файл:** `pages/service-request-page/ServiceRequestPage.tsx`  
**Проблема:** `border-[#f6465d]` и `shadow-[0_0_0_3px_rgba(246,70,93,0.15)]` вместо токенов.  
**Решение:** Использовать `border-price-rise` и CSS-переменную.

### AP-09: AuditLogPage — 475 строк мёртвого AI-кода
**Файл:** `pages/admin/audit-log-page/AuditLogPage.tsx`  
**Проблема:** Полностью типизированный компонент с фильтрами, пагинацией, лейблами. API не существует, роут закомментирован.  
**Решение:** Удалить файл, если API не планируется, или перенести в черновик.

### AP-10: Login modal → Forgot password page (разрыв UX)
**Проблема:** Логин — модалка. "Забыли пароль?" — полный page navigation на `/forgot-password`.  
**Решение:** "Забыли пароль?" как модальный шаг внутри той же модалки (переключение состояния).

### AP-11: Inline base64 SVG в className
**Файл:** `pages/service-request-page/ServiceRequestPage.tsx`  
**Проблема:** `bg-[url('data:image/svg+xml,%3Csvg...')]` — 150+ символов base64.  
**Решение:** CSS-класс `.select-arrow` или выделенный SVG-компонент.

### AP-12: ProductCard — N+1 запросов
**Файл:** `components/product-card/ProductCard.tsx`  
**Проблема:** Каждый ProductCard вызывает `useQuery` для полного продукта. 20 товаров = 20+ запросов.  
**Решение:** Включить изображения в ответ `getProducts` или batch-запрос.

### AP-13: Component explosion скелетонов
**Файл:** `App.tsx` (3 отдельных скелетона: Staff, Wishlist, Comparison)  
**Проблема:** Много дублированного кода.  
**Решение:** Композиция из базового `PageSkeleton` + пропсы.

### AP-14: Toast — строковые иконки (не SVG)
**Файл:** `components/ui/Toast/Toast.tsx`  
**Проблема:** `success: '✓'`, `error: '✕'` — текст, не SVG.  
**Решение:** Заменить на lucide-react: `CheckCircle`, `XCircle`, `Info`, `AlertTriangle`.

### AP-15: ButtonConflict — два акцентных цвета CTA
**Файл:** `components/product-card/ProductCard.tsx`  
**Проблема:** "В корзину" = green (price-drop), "Собрать ПК" = gold. Два акцента.  
**Решение:** Единый primary CTA цвет (gold). "В корзину" — gold CTA или outline.

---

## 3. Mobile-first Проблемы

### MOB-01: 4-колоночные stats на mobile (Impact: 9)
**Где:** AccountOrders, AccountRepairs, AccountWarranty, CustomerDashboard  
**Проблема:** 4 колонки на 375px = ~80px на колонку. Цифры нечитаемы.  
**Решение:** ScrollSnap-карусель на mobile, 2×2 grid на tablet.

### MOB-02: Нет swipe-to-delete (Impact: 7)
**Где:** AccountSavedBuilds, AccountOrders  
**Проблема:** Удаление через `confirm()`, нет жестов.  
**Решение:** `useSwipeable` хук с абсолютным action button.

### MOB-03: Modal без full-screen на mobile (Impact: 8)
**Где:** Modal.tsx, AccountOrders (детали заказа)  
**Проблема:** Контент сжимается до 340px, таймлайн не помещается.  
**Решение:** `fullScreenOnMobile` prop → `fixed inset-0 rounded-none`.

### MOB-04: Нет pull-to-refresh (Impact: 7)
**Где:** AccountOrders, AccountRepairs, AccountOverview  
**Проблема:** Все списки только на mount или polling (30s).  
**Решение:** `PullToRefresh` wrapper с touch handlers.

### MOB-05: Staff pages без mobile adaptation (Impact: 10)
**Где:** Manager/, Master/, Accountant/, AuditLogPage  
**Проблема:** Чистые CSS-таблицы 6-8 колонок без карточной альтернативы.  
**Решение:** Media query: `thead { display: none }`, `td { display: flex }` с `data-label`.

### MOB-06: Фильтры не скроллятся горизонтально (Impact: 6)
**Где:** AccountOrders, AccountRepairs  
**Проблема:** 5-6 кнопок переносятся на 2-3 строки.  
**Решение:** `overflow-x-auto snap-x scrollbar-hide` на mobile.

### MOB-07: Touch targets < 44px (Impact: 8)
**Где:** AccountOrders (w-8 h-8 = 32px), AccountSavedBuilds (p-2), AccountLayout (p-1)  
**Проблема:** 8+ иконок действий 32px. WCAG violation.  
**Решение:** `p-3` (12px padding) или `::after` расширитель.

### MOB-08: Нет sticky bottom CTA (Impact: 7)
**Где:** AccountSavedBuilds, AccountRepairs  
**Проблема:** CTA в шапке — недоступен при скролле.  
**Решение:** FAB (fixed bottom-right) или sticky bottom bar на mobile.

### MOB-09: Нет bottom nav для staff (Impact: 9)
**Где:** Manager, Master, Accountant, Admin  
**Проблема:** Нет навигации на mobile для staff-ролей.  
**Решение:** `StaffBottomNav` с tabs по роли.

### MOB-10: Клавиатура перекрывает форму (Impact: 6)
**Где:** AccountProfile  
**Проблема:** Поля могут быть перекрыты, кнопка уходит под клавиатуру.  
**Решение:** VisualViewport API + scrollIntoView.

### MOB-11: Пагинация вместо infinite scroll (Impact: 6)
**Где:** AccountOrders, AccountRepairs, Manager/OrdersPage  
**Проблема:** Numbered pagination с 32px кнопками.  
**Решение:** "Load more" + IntersectionObserver.

### MOB-12: Нет bottom action sheet (Impact: 7)
**Где:** AccountOrders, AccountSavedBuilds  
**Проблема:** 32px иконки в таблице невозможно точно нажать.  
**Решение:** BottomSheet с действиями при тапе на строку.

### MOB-13: Avatar upload — невидимый target 24px (Impact: 5)
**Где:** AccountProfile  
**Проблема:** Кнопка "+" 24×24px на краю аватара.  
**Решение:** Overlay "Изменить" с opacity.

### MOB-14: Empty states без mobile adaptation (Impact: 5)
**Где:** AccountOrders, AccountRepairs, AccountWarranty  
**Проблема:** Одинаковы для desktop и mobile.  
**Решение:** Mobile empty state с иллюстрацией и CTA в thumb zone.

### MOB-15: Нет search на списках (Impact: 6)
**Где:** AccountOrders, AccountRepairs, AccountWarranty  
**Проблема:** На mobile нет Ctrl+F и поиска.  
**Решение:** Collapsible search bar через иконку в sticky header.

---

## 4. Анимации и Micro-interactions

### 4.1 Missing анимации

| # | Где | Что сейчас | Предложение |
|---|-----|-----------|-------------|
| **M-01** | Sidebar AccountLayout | CSS transition без overlay анимации | Framer Motion spring + overlay fade + stagger |
| **M-02** | Toast | Мгновенное появление/исчезновение | AnimatePresence + slide + scale |
| **M-03** | Status badges | Мгновенная смена цвета при polling | `motion.span layout` с pulse |
| **M-04** | Список заказов | Все строки появляются сразу | Stagger entrance 0.05s |
| **M-05** | Filter кнопки | Мгновенная смена активного | `layoutId="active-filter"` |
| **M-06** | Stats карточки | Все сразу | Stagger + counting animation |
| **M-07** | Empty states | Резкое появление | Fade + slide up |
| **M-08** | Modal | Нет exit анимации | AnimatePresence |
| **M-09** | Смена фильтров | Data snap без transition | AnimatePresence mode="popLayout" |
| **M-10** | Numbers (stats) | Финальное значение сразу | useMotionValue count animation |

### 4.2 Excessive/Broken

| # | Где | Проблема | Решение |
|---|-----|---------|---------|
| **E-01** | 28+ `transition-colors` | Нет `transition-all` для трансформаций | Унифицировать в Button |
| **B-01** | Все hex-страницы | Хардкод цветов анимировать нельзя | Заменить на дизайн-токены |

### 4.3 5 Signature Micro-interactions

#### S-01: Золотая искра при добавлении в избранное
```tsx
// Particle burst золотых искр при клике на heart
// useAnimationControls + stagger particles x/y на 40px, opacity 1→0
```
**Где:** Любая кнопка "В избранное"

#### S-02: Прогресс-бар заказа с pulse
```tsx
// Текущий активный шаг: boxShadow pulse
// Анимированная линия заполнения: motion.div scaleX
```
**Где:** Order Details Modal — status timeline

#### S-03: Notification с золотым glow при смене статуса ремонта
```tsx
// При детекте изменения статуса: toast с boxShadow gold
// Бейдж статуса: scale 1→1.15→1
```
**Где:** AccountRepairs — при polling

#### S-04: "Дышащий" border на активном nav
```tsx
// motion.div layoutId="active-nav" с opacity pulse 2.5s
```
**Где:** AccountLayout sidebar

#### S-05: Анимация "сборки ПК" — компоненты встают на место
```tsx
// Stagger entrance карточек с y: 20→0, scale: 0.95→1
```
**Где:** AccountSavedBuilds

---

## 5. Product Innovation

### Phase 0 — Quick Wins (2 недели)

| # | Идея | Сложность | "Вау" |
|---|------|-----------|-------|
| I-01 | **Warranty Hub 2.0** — прогресс-бар срока, продление, push за 30 дней | Easy | 8/10 |
| I-02 | **Onboarding Quest** — интерактивный квест для нового пользователя (XP, бейджи) | Easy | 7/10 |
| I-03 | **Dashboard Merge** — `/dashboard` → `/account`, кастомизация виджетов | Medium | 9/10 |
| I-04 | **Account Settings Page** — создать полноценную страницу настроек (fix 404) | Medium | 8/10 |

### Phase 1 — Core (1 месяц)

| # | Идея | Сложность | "Вау" |
|---|------|-----------|-------|
| I-05 | **Live Build Status** — канбан-лента сборки с фото от мастера | Medium | 10/10 |
| I-06 | **Price Drop Alerts** — слежение за ценой + автовыкуп при X BYN | Medium | 8/10 |
| I-07 | **Telegram Integration** — бот: статус, поиск, тикеты, чеки | Medium | 8/10 |
| I-08 | **B2B Account** — мультипользователь, approval flow, корп.цены | Hard | 8/10 |

### Phase 2 — Monetization (2 месяца)

| # | Идея | Сложность | "Вау" |
|---|------|-----------|-------|
| I-09 | **Gamification** — уровни, XP, бейджи "Энтузиаст", "Сборщик" | Medium | 9/10 |
| I-10 | **GoldPC Prime** — подписка ~20 BYN/мес: доставка, приоритет, кешбэк | Hard | 9/10 |
| I-11 | **ПК-Клиника** — подписка на ТО (чистка, термопаста, диагностика) | Medium | 7/10 |
| I-12 | **Trade-In** — оценка старого железа, кредит на новое | Hard | 9/10 |

### Phase 3 — Innovation (3 месяца)

| # | Идея | Сложность | "Вау" |
|---|------|-----------|-------|
| I-13 | **AI-Конфигуратор** — "Собери ПК для Cyberpunk за $1500" | Hard | 10/10 |
| I-14 | **Expert Consultations** — видео/чат с инженером, 20 BYN/30мин | Medium | 8/10 |
| I-15 | **AI-Ассистент** — персональные рекомендации в дашборде | Hard | 8/10 |
| I-16 | **Community Builds Gallery** — публичные сборки, лайки, топ недели | Medium | 7/10 |

---

## 6. Сводный план "анти-нейрослоп"

### Что делает GoldPC "нейрослопом" сейчас:

| Признак | Где проявляется | Severity |
|---------|----------------|----------|
| **Три стиля одновременно** | hex + tokens + gray theme | 🔴 Critical |
| **Эмодзи-иконки** в админке | `✏️ 🗑️ 🏠 🔄 🔒` | 🔴 Critical |
| **alert()** вместо toast | SettingsPage, CatalogManagement, Dictionaries | 🔴 Critical |
| **Mock data** как production | AuditLogPage | 🟠 Major |
| **Битая ссылка** | `/account/settings` → 404 | 🔴 Critical |
| **"Загрузка..."** текстом | AccountOverview, AccountOrders, AccountRepairs | 🟠 Major |
| **Светлая тема в админке** | 5 admin pages | 🔴 Critical |
| **Price-drop ≠ status** | Все статус-бейджи | 🟠 Major |
| **Gold misuse** | Декорации, фоны, рамки | 🟠 Major |
| **Сайлент-фейлы** | `catch(() => {})` | 🟠 Major |

### Рецепт "не нейрослоп":

1. **Единая дизайн-система** → заменить все hex на tokens (DS-001–005)
2. **Gold только для CTA** → убрать gold из декораций (DS-006–015)
3. **Price-drop/rise только для цен** → новые цвета для статусов (DS-016–025)
4. **Все admin страницы → тёмная тема** (DS-035–039)
5. **Emoji → lucide-react** (DS-040)
6. **Toast вместо alert()** во всех admin pages
7. **Skeleton вместо "Загрузка..."** на всех страницах
8. **ErrorBoundary** глобальный
9. **React Query** для data fetching
10. **Mobile-first таблицы** — card layout на mobile
11. **Pull-to-refresh** на всех списках
12. **Bottom sheet** вместо модалок на mobile
13. **Framer Motion** — микро-анимации: toast, modal, stagger, status pulse
14. **Единый компонент PageHero** для info-страниц
15. **Удалить мёртвый код** (AuditLogPage mock, duplicate routes)

---

*Отчёт сгенерирован swarm из 5 AI sub-agents: DESIGN.md Compliance Auditor, Product Innovator, Anti-Pattern Detective, Mobile UX Architect, Motion Design Lead.*
