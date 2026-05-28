# GoldPC — Account Redesign: Production-Grade Execution Roadmap

> **Версия:** 1.0  
> **Дата:** 24.05.2026  
> **Источники:** `.reports/account-system-audit.md` + `.reports/account-system-audit-extended.md`  
> **Режим:** Multi-Agent Sequential + Parallel Execution  
> **Общее время:** ~6-8 часов работы агентов  
> **Цель:** Production-ready account system, "клиенты в восторге"

---

## Как читать этот план

```
Каждая задача:
  ID: Фаза-Номер (например, P1-03)
  Название: что сделать
  Тип: exec | brainstorm | review
  Файлы: [точные пути файлов для изменения]
  Depends on: [ID задач, которые должны быть выполнены до]
  Parallel: true (если может выполняться параллельно с другими задачами этого же уровня)
  Acceptance: конкретные критерии приёмки
  Subagent: какой тип агента запускать
```

---

# PHASE 0: SPECIFICATION & BRAINSTORMING
> **Цель:** Создать единое видение для агентов. Утвердить дизайн-решения до начала кодинга.

---

### P0-01 — BRAINSTORM: Account UX Vision
**Тип:** brainstorm | **Subagent:** general (swarm из 3-4 раундов)  
**Depends on:** — | **Parallel:** —  
**Время:** 30 мин

**Prompt для агента:**
```
Проведи брейншторминг на тему:
"Каким должен быть идеальный личный кабинет GoldPC, чтобы клиенты были в восторге?"

У нас тёмная тема (DESIGN.md), gold #FCD535 только для primary CTA.
Целевая аудитория: геймеры, энтузиасты ПК, обычные пользователи.

Нам нужно ответить на вопросы:
1. Что пользователь видит сразу после входа? (dashboard layout)
2. Какие 3 главных действия на dashboard?
3. Как показать статус заказа так, чтобы это радовало?
4. Как должна выглядеть страница настроек? (Profile, Security, Notifications, Appearance)
5. Как объединить CustomerDashboard и AccountOverview?

Результат: 5-10 конкретных design decisions с обоснованием.
Сохранить в .tmp/account-swarm/p0-01-ux-vision.md
```

---

### P0-02 — BRAINSTORM: Mobile-First Account Experience
**Тип:** brainstorm | **Subagent:** general + OpenFrontendSpecialist  
**Depends on:** P0-01 | **Parallel:** —  
**Время:** 30 мин

**Prompt:**
```
Спроектируй mobile-first account experience.

У нас 15 mobile проблем (MOB-01..15). Нужны конкретные решения для:
1. Stats grid на 375px экране
2. Навигация по разделам аккаунта на mobile (swipe tabs vs bottom nav)
3. Детали заказа на мобильном — bottom sheet vs full page
4. Staff pages — как выглядят на телефоне (Manager, Master, Accountant)
5. Touch targets — все интерактивные элементы должны быть >= 44px

Результат: для каждой проблемы — конкретное UX решение.
Сохранить в .tmp/account-swarm/p0-02-mobile-ux.md
```

---

### P0-03 — BRAINSTORM: Signature Animations & Micro-interactions
**Тип:** brainstorm | **Subagent:** OpenFrontendSpecialist  
**Depends on:** P0-01 | **Parallel:** true (can run with P0-02)  
**Время:** 20 мин

**Prompt:**
```
Спланируй animation system для GoldPC account.

У нас Framer Motion + тёмная тема.
Нам нужны 5 signature micro-interactions:
1. Что должно анимироваться при загрузке dashboard?
2. Как анимировать смену статуса заказа? (pulse, glow, slide)
3. Stagger entrance — где и с какой задержкой?
4. Counting animation для цифр статистики
5. "Золотая искра" при добавлении в избранное — техническая реализация

Также спланируй TOAST систему с AnimatePresence.

Результат: конкретные implementation patterns с код-примерами.
Сохранить в .tmp/account-swarm/p0-03-animations.md
```

---

### P0-04 — BRAINSTORM: Admin Panel Redesign Vision
**Тип:** brainstorm | **Subagent:** general + OpenFrontendSpecialist  
**Depends on:** P0-01 | **Parallel:** true  
**Время:** 20 мин

**Prompt:**
```
Спроектируй redesign админ-панели GoldPC.

Текущие проблемы:
- SettingsPage, AuditLogPage, CatalogManagementPage — полностью светлая тема на тёмном сайте
- Эмодзи-иконки вместо lucide-react
- alert() вместо toast
- Mock data в AuditLogPage

Что нужно:
1. Dark theme для всех admin pages (белый → bg-card/bg-background)
2. Замена всей навигации на lucide-react иконки
3. Toast alert → toast notification
4. AuditLogPage — удалить или переписать с реальным API
5. CoordinatorDashboard (persona-3) — светлые карточки → тёмные

Результат: для каждой страницы — конкретный список изменений с токенами.
Сохранить в .tmp/account-swarm/p0-04-admin-vision.md
```

---

### P0-05 — Создать Style Reference для агентов
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P0-01, P0-02, P0-03, P0-04 | **Parallel:** —  
**Время:** 15 мин

**Action:** Собрать все результаты брейнштормингов в единый dispatch-файл
**Output:** `.tmp/account-swarm/STYLE-REFERENCE.md`

Содержимое:
- Mapping hex → token для всех account/admin/staff страниц
- Список lucide-react иконок для замены emoji
- Статус-бейдж: цветовая схема (не price-drop!)
- Mobile breakpoints и правила
- Animation patterns

---

# PHASE 1: DESIGN TOKEN MIGRATION (Foundation)
> **Цель:** Все hex → дизайн-токены. Заложить единую визуальную систему.
> **Правило:** Ни один hex `#......` не должен остаться в JSX после этой фазы.

---

### P1-01 — Миграция account pages: hex → tokens
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P0-05 | **Parallel:** —  
**Файлы:**
- `src/frontend/src/pages/account-page/AccountOverview.tsx`
- `src/frontend/src/pages/account-page/AccountOrders.tsx`
- `src/frontend/src/pages/account-page/AccountProfile.tsx`
- `src/frontend/src/pages/account-page/AccountRepairs.tsx`
- `src/frontend/src/pages/account-page/AccountWarranty.tsx`
- `src/frontend/src/pages/account-page/AccountSavedBuilds.tsx`
- `src/frontend/src/pages/account-page/CustomerDashboard.tsx`

**Acceptance:**
- [ ] Все `bg-[#...]` → `bg-background` / `bg-card` / `bg-surface-elevated`
- [ ] Все `text-[#...]` → `text-foreground` / `text-muted-foreground`
- [ ] Все `border-[#...]` → `border-border`
- [ ] Все `focus:border-gold` → `focus:border-info-blue`
- [ ] `npm run build` проходит без ошибок

---

### P1-02 — Миграция admin pages: светлая → тёмная тема
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P0-05 | **Parallel:** true (with P1-01)  
**Файлы:**
- `src/frontend/src/pages/admin/settings-page/SettingsPage.tsx`
- `src/frontend/src/pages/admin/catalog-management-page/CatalogManagementPage.tsx`
- `src/frontend/src/pages/admin/user-management-page/UserManagementPage.tsx`
- `src/frontend/src/pages/admin/audit-log-page/AuditLogPage.tsx`
- `src/frontend/src/pages/admin/dictionaries-page/DictionariesPage.tsx`
- `src/frontend/src/pages/admin/dashboard-coordinator/CoordinatorDashboard.tsx`

**Acceptance:**
- [ ] Ни одного `bg-white`, `text-gray-900`, `text-gray-600` в этих файлах
- [ ] Все страницы используют `bg-background`, `bg-card`, `text-foreground`
- [ ] Все emoji заменены на lucide-react компоненты
- [ ] Все `alert()` заменены на toast-уведомления
- [ ] `npm run build` проходит

---

### P1-03 — Миграция staff pages: hex → tokens
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P0-05 | **Parallel:** true  
**Файлы:**
- `src/frontend/src/pages/staff/manager/*.tsx`
- `src/frontend/src/pages/staff/master/*.tsx`
- `src/frontend/src/pages/staff/accountant/*.tsx`

**Acceptance:**
- [ ] Все hex-цвета заменены на дизайн-токены
- [ ] `npm run build` проходит

---

### P1-04 — Аудит index.css: добавить недостающие токены
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P0-05 | **Parallel:** true  
**Файлы:**
- `src/frontend/src/index.css`

**Acceptance:**
- [ ] Проверить, что все используемые токены (`bg-surface-elevated`, `border-hairline-dark`, `font-tabular` и т.д.) определены в `@theme`
- [ ] Если чего-то не хватает — добавить
- [ ] `npm run build` проходит

---

### P1-05 — Глобальный grep: нет забытых hex
**Тип:** review | **Subagent:** CodeReviewer  
**Depends on:** P1-01, P1-02, P1-03 | **Parallel:** —  
**Время:** 5 мин

**Action:**
```bash
rg '#[0-9a-fA-F]{6}' src/frontend/src/ --include '*.tsx' --include '*.ts' --include '*.css'
```
Проверить, не осталось ли хардкод-цветов. Если остались — зафиксировать и исправить.

**Acceptance:**
- [ ] Нет несанкционированных hex-цветов в JSX/TSX
- [ ] Допустимы hex в `@theme` блоке index.css (токены)

---

# PHASE 2: COMPONENT LIBRARY REFACTOR
> **Цель:** Создать переиспользуемые компоненты, убрать copy-paste.

---

### P2-01 — Создать компонент `<PageHero>`
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-01 | **Parallel:** —  
**Новый файл:** `src/frontend/src/components/ui/PageHero.tsx`

**Spec:**
```tsx
interface PageHeroProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  icon?: LucideIcon;
}
```
Без breadcrumb (используем существующий Breadcrumbs). Просто контейнер для h1 + description + опциональная иконка.

**Acceptance:**
- [ ] Компонент создан
- [ ] Использует дизайн-токены (bg-card, text-foreground, text-muted-foreground)
- [ ] Не ломает существующие страницы

---

### P2-02 — Создать компонент `<IconBox>`
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-01 | **Parallel:** true (with P2-01)  
**Новый файл:** `src/frontend/src/components/ui/IconBox.tsx`

**Spec:**
```tsx
interface IconBoxProps {
  icon: LucideIcon;
  size?: number; // default 24
  containerSize?: 'sm' | 'md' | 'lg'; // 40 | 48 | 56
  variant?: 'default' | 'gold'; // default = bg-surface-elevated, gold = только для brand moments
}
```

**Acceptance:**
- [ ] Заменяет паттерн `w-12 h-12 bg-gold/10 text-gold rounded-lg` на `variant="gold"`
- [ ] Дефолтный вариант — без gold

---

### P2-03 — Создать компонент `<StatusBadge>`
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-01 | **Parallel:** true  
**Новый файл:** `src/frontend/src/components/ui/StatusBadge.tsx`

**Цель:** Исправить DS-016..025 — price-drop/price-rise цвета используются для статусов.

**Spec:**
```tsx
type StatusVariant = 
  | 'info'      // bg-info-blue/10 text-info-blue — "Активен", "Доставлен"
  | 'warning'   // bg-warning/10 text-warning — "В обработке", "Ожидает"
  | 'neutral'   // bg-muted/10 text-muted-foreground — "Отменён", "Истекла"
  | 'success'   // bg-price-drop/10 text-price-drop — ТОЛЬКО для оплачено 
  | 'pending'   // bg-surface-elevated text-foreground — "Черновик"

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  pulse?: boolean;
}
```

**Acceptance:**
- [ ] price-drop/price-rise используются ТОЛЬКО для ценовых сигналов
- [ ] Статусы используют info/warning/neutral
- [ ] Размер rounded-sm (4px) как в DESIGN.md
- [ ] `npm run build` проходит

---

### P2-04 — Создать компонент `<StatCard>`
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-01 | **Parallel:** true  
**Новый файл:** `src/frontend/src/components/ui/StatCard.tsx`

**Spec:**
```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: { direction: 'up' | 'down'; value: string };
  icon?: LucideIcon;
  variant?: 'default' | 'callout'; // callout = с gold акцентом для главной цифры
}
```

**Acceptance:**
- [ ] Не использует gold для value (только для callout variant)
- [ ] Использует font-tabular для цифр
- [ ] Responsive: на mobile 2 колонки

---

### P2-05 — Audit Button: заменить hex в button styles
**Тип:** exec | **Subagent:** CodeReviewer  
**Depends on:** P1-01 | **Parallel:** true  
**Файлы:** Все файлы `.tsx` с кнопками

**Action:**
```bash
rg 'bg-gold' src/frontend/src/ --include '*.tsx' --include '*.ts'
rg 'bg-blue' src/frontend/src/ --include '*.tsx' --include '*.ts'
rg 'bg-\[\#' src/frontend/src/ --include '*.tsx' --include '*.ts'
```
Заменить:
- `bg-gold text-gold-ink` → корректный CTA (gold — только для primary действий)
- `bg-blue-500` → `bg-accent` или `bg-surface-elevated`

---

# PHASE 3: ACCOUNT PAGES REDESIGN
> **Цель:** Переработать все страницы личного кабинета. Production quality.

---

### P3-01 — Merge CustomerDashboard → AccountOverview
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P2-01, P2-02, P2-03, P2-04 | **Parallel:** —  
**Файлы:**
- `src/frontend/src/pages/account-page/AccountOverview.tsx` (основная цель)
- `src/frontend/src/pages/account-page/CustomerDashboard.tsx` (удалить/реэкспорт)
- `src/frontend/src/App.tsx` (проверить маршруты)
- `src/frontend/src/components/layout/header/Header.tsx` (проверить ссылки)

**Action:**
1. Скопировать логику CustomerDashboard в AccountOverview
2. Переписать с использованием <PageHero>, <StatCard>, <StatusBadge>
3. CustomerDashboard.tsx — удалить (перенаправить маршрут)
4. Проверить, что `/account` и `/dashboard` ведут на один компонент

**Acceptance:**
- [ ] CustomerDashboard и AccountOverview — один компонент
- [ ] `/account` и `/dashboard` работают (redirect если нужно)
- [ ] Используются дизайн-токены, не hex
- [ ] `npm run build` проходит

---

### P3-02 — BRAINSTORM: Dashboard Layout
**Тип:** brainstorm | **Subagent:** OpenFrontendSpecialist  
**Depends on:** P3-01 | **Parallel:** —  
**Время:** 15 мин

**Prompt:**
```
AccountOverview (бывший CustomerDashboard) объединён.

Теперь спроектируй layout:
1. Что показываем на dashboard? Варианты:
   A) Виджеты: "Последний заказ", "Статус ремонта", "Гарантии", "Сохранённые сборки", "Акции"
   B) Карусель статусов вверху, список действий ниже
   C) Одно полотно с hero-секцией

2. Приоритет секций на dashboard (что пользователь хочет видеть в первую очередь)

3. Mobile layout — тот же контент но в 1 колонку с анимацией

Результат: финальный layout dashboard с wireframe-описанием.
Сохранить в .tmp/account-swarm/p3-02-dashboard-layout.md
```

---

### P3-03 — Redesign AccountOverview (dashboard)
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P3-02 | **Parallel:** —  
**Файл:**
- `src/frontend/src/pages/account-page/AccountOverview.tsx`

**Acceptance:**
- [ ] hero с приветствием пользователя и gold CTA
- [ ] Stats grid (2 колонки mobile, 4 колонки desktop) — через <StatCard>
- [ ] Секция "Последний заказ" с прогресс-баром
- [ ] Секция "Сохранённые сборки" (превью 3 шт.)
- [ ] Секция "Мои гарантии" (статус активных)
- [ ] Все статусы через <StatusBadge>
- [ ] Pull-to-refresh на mobile
- [ ] `npm run build` проходит

---

### P3-04 — Redesign AccountOrders
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P2-03, P2-04 | **Parallel:** true (with P3-05..P3-07)  
**Файл:**
- `src/frontend/src/pages/account-page/AccountOrders.tsx`

**Acceptance:**
- [ ] Статусы заказов через <StatusBadge> (не price-drop/price-rise)
- [ ] Mobile: карточки вместо таблицы, bottom-sheet для деталей
- [ ] Desktop: таблица с фильтрацией
- [ ] Infinite scroll / "Загрузить ещё" вместо numbered pagination
- [ ] Pull-to-refresh
- [ ] Touch targets >= 44px (заменить `w-8 h-8` на `w-11 h-11`)
- [ ] Поиск по номеру заказа
- [ ] `npm run build` проходит

---

### P3-05 — Redesign AccountProfile
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P2-01, P2-02 | **Parallel:** true  
**Файл:**
- `src/frontend/src/pages/account-page/AccountProfile.tsx`

**Acceptance:**
- [ ] Форма использует дизайн-токены (не hex)
- [ ] Avatar upload — "Изменить" overlay (не 24px кнопка)
- [ ] Password requirements — не price-drop цвет
- [ ] Mobile: клавиатура не перекрывает поля (VisualViewport API)
- [ ] `npm run build` проходит

---

### P3-06 — Redesign AccountRepairs
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P2-01, P2-03 | **Parallel:** true  
**Файл:**
- `src/frontend/src/pages/account-page/AccountRepairs.tsx`

**Acceptance:**
- [ ] Timeline ремонта с анимированным прогресс-баром
- [ ] Статусы через <StatusBadge>
- [ ] Mobile: карточки, pull-to-refresh
- [ ] Sticky CTA "Создать заявку" (FAB на mobile)
- [ ] `npm run build` проходит

---

### P3-07 — Redesign AccountWarranty
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P2-01, P2-03 | **Parallel:** true  
**Файл:**
- `src/frontend/src/pages/account-page/AccountWarranty.tsx`

**Acceptance:**
- [ ] Прогресс-бар оставшегося срока
- [ ] Статусы через <StatusBadge> (не price-drop/price-rise)
- [ ] CTA ведёт на `/service-request` (не в каталог!)
- [ ] Корректные дизайн-токены
- [ ] Mobile: карточки
- [ ] `npm run build` проходит

---

### P3-08 — Redesign AccountSavedBuilds
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P2-01, P2-03, P2-04 | **Parallel:** true  
**Файл:**
- `src/frontend/src/pages/account-page/AccountSavedBuilds.tsx`

**Acceptance:**
- [ ] Grid карточек сборок (2 колонки mobile, 4 desktop)
- [ ] Swipe-to-delete на mobile
- [ ] Touch targets >= 44px
- [ ] Sticky "Новая сборка" FAB на mobile
- [ ] Анимация stagger entrance
- [ ] `npm run build` проходит

---

### P3-09 — Создать AccountSettings (fix 404)
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P2-01, P2-02 | **Parallel:** —  
**Новый файл:** `src/frontend/src/pages/account-page/AccountSettings.tsx`
**Модификация:** `src/frontend/src/App.tsx`
**Модификация:** `src/frontend/src/pages/account-page/AccountLayout.tsx`

**Spec:**
```
Страница /account/settings с секциями:
1. Profile — имя, email, телефон (редактирование)
2. Security — смена пароля, 2FA (заглушка)
3. Notifications — email/push/telegram уведомления
4. Appearance — тема (dark/light — заглушка на будущее)
5. Privacy — настройки видимости (заглушка)

Можно начать с 2-3 готовыми секциями, остальные заглушка "Скоро"
```

**Acceptance:**
- [ ] `/account/settings` не 404
- [ ] Ссылка в Header dropdown ведёт на `/account/settings`
- [ ] Секции Profile + Security функциональны
- [ ] Использует <PageHero> и дизайн-токены
- [ ] `npm run build` проходит

---

### P3-10 — AccountLayout sidebar role-aware
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P3-09 | **Parallel:** —  
**Файл:**
- `src/frontend/src/pages/account-page/AccountLayout.tsx`

**Action:**
В зависимости от роли пользователя (user, admin, manager, master, accountant) показывать разные пункты sidebar:
- **user:** Обзор, Заказы, Профиль, Сборки, Гарантии, Ремонт, Настройки
- **admin:** + Управление пользователями, Каталог, Настройки сайта, Аудит
- **manager:** + Заказы (все), Склад
- **master:** + Тикеты, Ремонт
- **accountant:** + Отчёты

**Acceptance:**
- [ ] Sidebar адаптируется под роль
- [ ] Нет ссылок на недоступные страницы
- [ ] Mobile sidebar с блюром и анимацией
- [ ] `npm run build` проходит

---

# PHASE 4: ADMIN PANEL REDESIGN
> **Цель:** Все админ-страницы → единая тёмная тема, без emoji, с toast вместо alert().

---

### P4-01 — Redesign UserManagementPage
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-02, P2-05 | **Parallel:** true (with P4-02..P4-04)  
**Файл:**
- `src/frontend/src/pages/admin/user-management-page/UserManagementPage.tsx`

**Acceptance:**
- [ ] Тёмная тема (bg-background, bg-card, border-border)
- [ ] Таблица с ролями, статусами, датой регистрации
- [ ] Никаких `bg-accent-glow`
- [ ] `npm run build` проходит

---

### P4-02 — Redesign SettingsPage (admin)
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-02 | **Parallel:** true  
**Файл:**
- `src/frontend/src/pages/admin/settings-page/SettingsPage.tsx`

**Acceptance:**
- [ ] Полностью тёмная тема (была `bg-white text-gray-900`)
- [ ] Никаких emoji-иконок (заменить на lucide)
- [ ] Toast вместо `alert()`
- [ ] `npm run build` проходит

---

### P4-03 — Redesign CatalogManagementPage
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-02 | **Parallel:** true  
**Файл:**
- `src/frontend/src/pages/admin/catalog-management-page/CatalogManagementPage.tsx`

**Acceptance:**
- [ ] Тёмная тема
- [ ] Emoji → lucide-react
- [ ] `alert()` → toast
- [ ] `npm run build` проходит

---

### P4-04 — AuditLogPage: переписать или удалить
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-02 | **Parallel:** true  
**Файл:**
- `src/frontend/src/pages/admin/audit-log-page/AuditLogPage.tsx`

**Decision:**
- Если API `/api/admin/audit-log` существует → переписать с реальными данными
- Если API не существует → удалить компонент и маршрут

**Acceptance:**
- [ ] Нет mock-данных
- [ ] Тёмная тема
- [ ] Маршрут закомментирован если API нет
- [ ] `npm run build` проходит

---

### P4-05 — Redesign DictionariesPage
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-02 | **Parallel:** true  
**Файл:**
- `src/frontend/src/pages/admin/dictionaries-page/DictionariesPage.tsx`

**Acceptance:**
- [ ] Тёмная тема
- [ ] Emoji → lucide
- [ ] `alert()` → toast
- [ ] `npm run build` проходит

---

### P4-06 — Redesign CoordinatorDashboard
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-02 | **Parallel:** true  
**Файл:**
- `src/frontend/src/pages/admin/dashboard-coordinator/CoordinatorDashboard.tsx`

**Acceptance:**
- [ ] Тёмная тема
- [ ] `fetch('/api/internal/...')` → `apiClient`
- [ ] `npm run build` проходит

---

### P4-07 — Audit admin pages (QA review)
**Тип:** review | **Subagent:** CodeReviewer  
**Depends on:** P4-01..P4-06 | **Parallel:** —  
**Время:** 10 мин

**Action:** Проверить все admin страницы на:
- Нет забытых `bg-white`, `text-gray-*`
- Нет emoji в JSX
- Нет `alert()` 
- Все иконки через lucide-react
- `npm run build` проходит

---

# PHASE 5: MOBILE UX OVERHAUL
> **Цель:** Все account страницы работают идеально на 375px.

---

### P5-01 — Stats grid → ScrollSnap carousel on mobile
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P3-03, P2-04 | **Parallel:** true (with P5-02..P5-09)  
**Файлы для изменения:**
- AccountOverview.tsx (stats секция)
- AccountOrders.tsx (stats)
- AccountRepairs.tsx (stats)
- AccountWarranty.tsx (stats)

**Acceptance:**
- [ ] На mobile (< 640px): горизонтальная carousel с snap-scroll
- [ ] На tablet (640-1024): 2×2 grid
- [ ] На desktop (> 1024): 4 колонки
- [ ] `npm run build` проходит

---

### P5-02 — Swipe-to-delete для списков
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P3-08 | **Parallel:** true  
**Файлы:**
- AccountSavedBuilds.tsx
- AccountOrders.tsx

**Action:** Добавить `useSwipeable` (из библиотеки или самописный) для жестового удаления/архивирования.

**Acceptance:**
- [ ] Свайп влево показывает кнопку действия
- [ ] Работает на touch-устройствах
- [ ] Не ломает desktop (там hover)
- [ ] `npm run build` проходит

---

### P5-03 — Modal full-screen on mobile
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P3-04 | **Parallel:** true  
**Файлы:**
- `src/frontend/src/components/ui/Modal.tsx`
- AccountOrders.tsx (детали заказа)

**Action:** Добавить проп `fullScreenOnMobile` или определить через `useMediaQuery`. На mobile modal = `fixed inset-0 rounded-none`.

**Acceptance:**
- [ ] Mobile: modal на весь экран
- [ ] Desktop: обычный modal
- [ ] `npm run build` проходит

---

### P5-04 — Pull-to-refresh wrapper
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P3-03, P3-04, P3-06 | **Parallel:** true  
**Новый файл:** `src/frontend/src/components/ui/PullToRefresh.tsx`

**Action:** Обёртка для списков. На mobile: touch-жест pull-to-refresh → refetch данных.

**Acceptance:**
- [ ] Работает на AccountOrders, AccountRepairs, AccountOverview
- [ ] Показывает индикатор обновления
- [ ] Не конфликтует с вертикальным скроллом
- [ ] `npm run build` проходит

---

### P5-05 — Staff pages: table → card layout on mobile
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-03 | **Parallel:** true  
**Файлы:**
- `src/frontend/src/pages/staff/manager/*.tsx`
- `src/frontend/src/pages/staff/master/*.tsx`
- `src/frontend/src/pages/staff/accountant/*.tsx`

**Action:** CSS media query: на mobile (`< 768px`) таблицы превращаются в карточки. `thead { display: none }`, каждая `td` — строка карточки с `data-label` через `::before`.

**Acceptance:**
- [ ] На mobile — карточки
- [ ] На desktop — таблицы
- [ ] `npm run build` проходит

---

### P5-06 — Horizontal filter scroll
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P3-04, P3-06 | **Parallel:** true  
**Файлы:**
- AccountOrders.tsx
- AccountRepairs.tsx

**Action:** Фильтры на mobile: `overflow-x-auto snap-x scrollbar-hide` вместо переноса на 2-3 строки.

**Acceptance:**
- [ ] Фильтры скроллятся горизонтально
- [ ] Hidden scrollbar
- [ ] Active фильтр выделен
- [ ] `npm run build` проходит

---

### P5-07 — Touch targets >= 44px
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P3-04, P3-08 | **Parallel:** true  
**Файлы:**
- AccountOrders.tsx (кнопки действий в таблице)
- AccountSavedBuilds.tsx (кнопки на карточках)
- AccountLayout.tsx (иконки боковой панели)

**Action:** Все `w-8 h-8` (32px) → `w-11 h-11` (44px) или `p-3`. Использовать `::after` расширитель если нужно.

**Acceptance:**
- [ ] Hет touch targets < 44px на mobile
- [ ] `npm run build` проходит

---

### P5-08 — Sticky CTA / FAB
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P3-08, P3-06 | **Parallel:** true  
**Файлы:**
- AccountSavedBuilds.tsx (FAB "Новая сборка")
- AccountRepairs.tsx (FAB "Заявка на ремонт")

**Action:** На mobile: fixed bottom-right FAB с основным действием. На desktop: кнопка в шапке или sticky sidebar.

**Acceptance:**
- [ ] FAB виден при скролле на mobile
- [ ] Не перекрывает контент внизу страницы
- [ ] `npm run build` проходит

---

### P5-09 — Infinite scroll / Load more
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P3-04 | **Parallel:** true  
**Файлы:**
- AccountOrders.tsx
- AccountRepairs.tsx

**Action:** Заменить numbered pagination на IntersectionObserver + "Загрузить ещё" кнопку. Первые 10 элементов, при достижении конца → подгрузка.

**Acceptance:**
- [ ] Нет numbered pagination на mobile
- [ ] "Загрузить ещё" работает
- [ ] Показывает спиннер при загрузке
- [ ] `npm run build` проходит

---

# PHASE 6: ANTI-PATTERNS & BUG FIXES
> **Цель:** Убрать весь "нейрослоп".

---

### P6-01 — Fix NotificationCenter: светлая → тёмная тема
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-01 | **Parallel:** true (with P6-02..P6-09)  
**Файл:**
- `src/frontend/src/components/notification-center/NotificationCenter.tsx`

**Action:** `bg-white` → `bg-surface-elevated`, `text-gray-600` → `text-muted-foreground`, `border-gray-100` → `border-hairline-dark`. Английские подписи → русские.

**Acceptance:**
- [ ] Тёмная тема
- [ ] Русский язык
- [ ] `npm run build` проходит

---

### P6-02 — Fix ProductCardSkeleton white
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P1-01 | **Parallel:** true  
**Файл:**
- `src/frontend/src/components/ui/Skeleton/ProductCardSkeleton.tsx`

**Action:** `bg-white` → `bg-surface-elevated`

**Acceptance:**
- [ ] Скелетон тёмный
- [ ] `npm run build` проходит

---

### P6-03 — Fix WarrantyPage CTA
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** — | **Parallel:** true  
**Файл:**
- `src/frontend/src/pages/info/WarrantyPage.tsx`

**Action:** CTA вместо "Перейти в каталог" → "Подать заявку" (ссылка `/service-request`).

**Acceptance:**
- [ ] CTA ведёт на `/service-request`
- [ ] `npm run build` проходит

---

### P6-04 — Fix "No image" → русский
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** — | **Parallel:** true  
**Файл:**
- `src/frontend/src/components/product-card/ProductCard.tsx`

**Action:** `<span>No image</span>` → `<span>Нет изображения</span>` и `text-muted-foreground` вместо `text-gray-400`.

**Acceptance:**
- [ ] Русский текст
- [ ] Дизайн-токены
- [ ] `npm run build` проходит

---

### P6-05 — Fix Toast icons (string → lucide)
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** — | **Parallel:** true  
**Файл:**
- `src/frontend/src/components/ui/Toast/Toast.tsx`

**Action:** `success: '✓'` → `CheckCircle`, `error: '✕'` → `XCircle`, `info: 'ℹ'` → `Info`, `warning: '⚠'` → `AlertTriangle`. Все через lucide-react.

**Acceptance:**
- [ ] Иконки — lucide-react компоненты
- [ ] `npm run build` проходит

---

### P6-06 — Fix ButtonConflict (two CTAs)
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P2-05 | **Parallel:** true  
**Файл:**
- `src/frontend/src/components/product-card/ProductCard.tsx`

**Action:** "В корзину" → gold CTA (primary). "Собрать ПК" → outline/secondary. Единый accent цвет.

**Acceptance:**
- [ ] Один primary CTA (gold)
- [ ] Второй secondary (outline)
- [ ] `npm run build` проходит

---

### P6-07 — Fix Footer inline SVG → lucide
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** — | **Parallel:** true  
**Файл:**
- `src/frontend/src/components/layout/footer/Footer.tsx`

**Action:** Заменить сырой `<path>` Telegram иконки на компонент из lucide-react или на самописный `<TelegramIcon />`.

**Acceptance:**
- [ ] Telegram иконка — компонент, не inline path
- [ ] `npm run build` проходит

---

### P6-08 — Fix ServiceRequestPage: произвольные цвета
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** — | **Parallel:** true  
**Файл:**
- `src/frontend/src/pages/service-request-page/ServiceRequestPage.tsx`

**Action:** `border-[#f6465d]` → `border-price-rise`, `shadow-[0_0_0_3px_rgba(246,70,93,0.15)]` → CSS-переменную. Inline base64 SVG → CSS class.

**Acceptance:**
- [ ] Нет произвольных hex
- [ ] `npm run build` проходит

---

### P6-09 — Fix Login/Forgot password: modal flow
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** — | **Parallel:** true  
**Файлы:**
- LoginModal (найти компонент модалки логина)
- ForgotPasswordPage

**Action:** "Забыли пароль?" — не переход на страницу, а переключение внутри модалки (состояние: `login | forgot | reset`).

**Acceptance:**
- [ ] Весь flow внутри одной модалки
- [ ] Анимация переключения между состояниями
- [ ] `npm run build` проходит

---

# PHASE 7: ANIMATIONS & MICRO-INTERACTIONS
> **Цель:** Framer Motion анимации для production.

---

### P7-01 — Setup Framer Motion + layout animations
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P3-10, P3-03 | **Parallel:** —  
**Время:** 15 мин

**Action:** Установить framer-motion (если ещё нет) — `npm i framer-motion`. Импортировать `motion`, `AnimatePresence` в нужные файлы.

**Acceptance:**
- [ ] framer-motion в package.json
- [ ] `npm run build` проходит

---

### P7-02 — Toast с AnimatePresence
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P7-01 | **Parallel:** true (with P7-03..P7-08)  
**Файл:**
- `src/frontend/src/components/ui/Toast/Toast.tsx`

**Action:** Toast появление: slide + fade. Исчезание: slide out + scale down. Использовать AnimatePresence.

**Acceptance:**
- [ ] Toast анимирован
- [ ] Exit animation работает
- [ ] `npm run build` проходит

---

### P7-03 — Stagger entrance lists
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P7-01 | **Parallel:** true  
**Файлы:**
- AccountOverview.tsx (stats, секции)
- AccountOrders.tsx (список заказов)
- AccountSavedBuilds.tsx (карточки сборок)

**Action:** `motion.div` с `variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}` + `staggerChildren: 0.05`.

**Acceptance:**
- [ ] Элементы появляются с задержкой
- [ ] `npm run build` проходит

---

### P7-04 — Status badge pulse
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P7-01, P2-03 | **Parallel:** true  
**Файлы:**
- AccountOrders.tsx (статусы заказов)
- AccountRepairs.tsx (статусы ремонта)
- StatusBadge.tsx (pulse prop)

**Action:** `motion.span` с `animate={{ scale: [1, 1.05, 1] }}` на badge.

**Acceptance:**
- [ ] Pulse анимация на статусах
- [ ] `npm run build` проходит

---

### P7-05 — Stats counting animation
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P7-01, P2-04 | **Parallel:** true  
**Файлы:**
- StatCard.tsx
- AccountOverview.tsx

**Action:** При монтировании — числа в StatCard анимированно считают от 0 до финального значения (useMotionValue + useSpring).

**Acceptance:**
- [ ] Цифры анимируются
- [ ] `npm run build` проходит

---

### P7-06 — Sidebar overlay animation
**Тип:** exec | **Subagent:** CoderAgent  
**Depends on:** P7-01, P3-10 | **Parallel:** true  
**Файл:**
- AccountLayout.tsx

**Action:** На mobile: sidebar slide in + backdrop fade. Использовать `AnimatePresence` для overlay.

**Acceptance:**
- [ ] Sidebar анимирован
- [ ] Backdrop fade
- [ ] `npm run build` проходит

---

### P7-07 — Gold sparkle on favorite (SIGNATURE)
**Тип:** exec | **Subagent:** OpenFrontendSpecialist  
**Depends on:** P7-01 | **Parallel:** true  
**Файл:** Компонент кнопки избранного

**Action:**
```tsx
// Particle burst золотых искр при клике на heart
// useAnimationControls + stagger частицы на 40px, opacity: 1→0
```

**Acceptance:**
- [ ] При нажатии "В избранное" — золотые частицы
- [ ] Не ломает production
- [ ] `npm run build` проходит

---

### P7-08 — Breathing border on active nav (SIGNATURE)
**Тип:** exec | **Subagent:** OpenFrontendSpecialist  
**Depends on:** P7-01, P3-10 | **Parallel:** true  
**Файл:**
- AccountLayout.tsx (sidebar)

**Action:** `motion.div layoutId="active-nav"` с `animate={{ opacity: [1, 0.4, 1] }}` длительностью 2.5s.

**Acceptance:**
- [ ] Активный nav элемент "дышит"
- [ ] `npm run build` проходит

---

# PHASE 8: QA & PRODUCTION POLISH
> **Цель:** Финальная проверка перед production. Никаких "Загрузка...", никаких белых экранов, никаких ошибок в консоли.

---

### P8-01 — Global ErrorBoundary audit
**Тип:** exec + review | **Subagent:** CodeReviewer  
**Depends on:** Всё PHASE 1-7 | **Parallel:** —  
**Время:** 15 мин

**Action:**
1. Проверить, есть ли глобальный ErrorBoundary
2. Если нет — создать `src/frontend/src/components/error-boundary/GlobalErrorBoundary.tsx`
3. Обернуть App
4. Все catch блоки должны показывать toast, не молчать

**Acceptance:**
- [ ] Глобальный ErrorBoundary есть
- [ ] Нет пустых `catch(() => {})`
- [ ] `npm run build` проходит

---

### P8-02 — Loading states audit
**Тип:** review | **Subagent:** CodeReviewer  
**Depends on:** Всё PHASE 1-7 | **Parallel:** —  
**Время:** 10 мин

**Action:**
```bash
rg '"Загрузка' src/frontend/src/
rg 'Loading' src/frontend/src/
rg 'isLoading &&' src/frontend/src/
```

Заменить все текстовые "Загрузка..." на Skeleton-компоненты.

**Acceptance:**
- [ ] Нет текстовых "Загрузка..."
- [ ] Все данные имеют skeleton при загрузке
- [ ] `npm run build` проходит

---

### P8-03 — Accessibility audit
**Тип:** review | **Subagent:** CodeReviewer  
**Depends on:** Всё PHASE 1-7 | **Parallel:** —  
**Время:** 15 мин

**Checklist:**
- [ ] Все button/input имеют aria-label где нужно
- [ ] Focus visible на всех интерактивных элементах
- [ ] Цветовой контраст (проверить gold на тёмном — WCAG AA)
- [ ] Tab order на формах
- [ ] Role attributes на динамических элементах

**Acceptance:**
- [ ] Accessibility checklist пройден
- [ ] `npm run build` проходит

---

### P8-04 — Console error cleanup
**Тип:** review | **Subagent:** CodeReviewer  
**Depends on:** Всё PHASE 1-7 | **Parallel:** —  
**Время:** 10 мин

**Action:**
```bash
npm run dev
```
Открыть браузер, проверить консоль. Нет:
- React key warnings
- Missing dependency warnings
- 404 requests
- Uncaught promises

**Acceptance:**
- [ ] Чистая консоль (0 errors, 0 warnings)
- [ ] `npm run build` проходит

---

### P8-05 — Routes audit
**Тип:** review | **Subagent:** CodeReviewer  
**Depends on:** Всё PHASE 1-7 | **Parallel:** —  
**Время:** 10 мин

**Action:**
```bash
rg 'path:' src/frontend/src/App.tsx
rg '<Route' src/frontend/src/App.tsx
```
Проверить:
- Нет dead routes
- Все routes существуют (не 404)
- Правильные lazy imports
- Нет дублирующихся путей

**Acceptance:**
- [ ] Маршруты валидны
- [ ] Нет 404 страниц кроме NotFound
- [ ] `npm run build` проходит

---

### P8-06 — Build validation
**Тип:** exec | **Subagent:** BuildAgent  
**Depends on:** P8-01..P8-05 | **Parallel:** —  
**Время:** 5 мин

**Action:**
```bash
npm run build
npm run typecheck
```

**Acceptance:**
- [ ] build: success
- [ ] typecheck: success (если существует)
- [ ] No warnings

---

### P8-07 — Final Code Review
**Тип:** review | **Subagent:** CodeReviewer  
**Depends on:** P8-06 | **Parallel:** —  
**Время:** 20 мин

**Action:** Финальный код-ревью всех изменений:
1. `git diff --stat` — проверить, что изменены только нужные файлы
2. `git diff` — беглый просмотр ключевых файлов
3. Проверить соответствие AGENTS.md (surgical changes, no hex, no emoji)
4. No `console.log` в production

**Acceptance:**
- [ ] Code review passed
- [ ] Только целевые изменения
- [ ] Нет debug-кода

---

# EXECUTION ORDER SUMMARY

```
P0-01 (brainstorm) ──────┐
P0-02 (brainstorm) ──────┤──── P0-05 (style-ref) ──┐
P0-03 (brainstorm) ──────┤                         │
P0-04 (brainstorm) ──────┘                         │
                                                   │
           ┌── P1-01 (account hex→token) ──────────┤
           │   P1-02 (admin dark)     ─────────────┤
           │   P1-03 (staff hex→token) ────────────┤
           │   P1-04 (index.css audit) ────────────┘
           │
           │   P1-05 (grep review) ←── P1-01..P1-04
           │
P0-05 ────┼── P2-01 (PageHero) ──────────────────┐
           │   P2-02 (IconBox)  ──────────────────┤
           │   P2-03 (StatusBadge) ───────────────┤
           │   P2-04 (StatCard) ──────────────────┤
           │   P2-05 (Button audit) ──────────────┘
           │
           └── P3-01 (Merge Dashboard) ←── P2-01..P2-04
                               │
                    P3-02 (brainstorm layout) ←── P3-01
                               │
                    ┌── P3-03 (AccountOverview) ←── P3-02
           ┌────────┤   P3-04 (AccountOrders)  ────┐
           │        │   P3-05 (AccountProfile) ─────┤
           │        │   P3-06 (AccountRepairs) ─────┤── P2-01..P2-04
           │        │   P3-07 (AccountWarranty) ────┤
           │        │   P3-08 (AccountSavedBuilds) ─┘
           │        │
           │        └── P3-09 (AccountSettings) ──┐
           │            P3-10 (sidebar roles) ←────┘
           │
P1-02 ────┤── P4-01..P4-06 (Admin redesign, ALL parallel)
           │       │
           │       └── P4-07 (Admin audit review)
           │
P3-04..08 ── P5-01..P5-09 (Mobile UX, ALL parallel)
           │
           └── P6-01..P6-09 (Anti-patterns, ALL parallel)
           │
P3-03, P3-10 ── P7-01 (Framer setup)
                    │
                    └── P7-02..P7-08 (Animations, ALL parallel)
                    │
ALL PHASES ── P8-01..P8-07 (QA, sequential)
```

# PARALLEL BATCHES

| Batch | Tasks | Когда запускать |
|-------|-------|----------------|
| **Batch 1** | P0-01, P0-02, P0-03, P0-04 | Сразу |
| **Batch 2** | P0-05 (зависит от Batch 1) | После Batch 1 |
| **Batch 3** | P1-01, P1-02, P1-03, P1-04 | После P0-05 |
| **Batch 4** | P1-05 (зависит от Batch 3) | После Batch 3 |
| **Batch 5** | P2-01, P2-02, P2-03, P2-04, P2-05 | После P1-05 |
| **Batch 6** | P3-01 (зависит от Batch 5) | После Batch 5 |
| **Batch 7** | P3-02 (зависит от P3-01) | После P3-01 |
| **Batch 8** | P3-03 (зависит от P3-02), P3-04, P3-05, P3-06, P3-07, P3-08 (зависят от Batch 5) | После P3-02 |
| **Batch 9** | P3-09 (зависит от Batch 5), P3-10 (зависит от P3-09) | После Batch 8 (или параллельно с Batch 8) |
| **Batch 10** | P4-01..P4-06, P5-01..P5-09, P6-01..P6-09 (все параллельно) | После P3-10 |
| **Batch 11** | P4-07, P5-*, P6-* (review, идет после exec) | После Batch 10 |
| **Batch 12** | P7-01 (зависит от P3-03, P3-10) | После Batch 10 |
| **Batch 13** | P7-02..P7-08 (зависит от P7-01) | После P7-01 |
| **Batch 14** | P8-01..P8-07 (QA, sequential) | После всех |

---

*Конец документа. Этот roadmap будет использоваться для последовательного запуска агентов через TaskManager.*
