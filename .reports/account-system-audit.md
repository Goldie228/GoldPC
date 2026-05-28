# GoldPC — Полный UX/UI/Architecture аудит аккаунта пользователя

> **Дата:** 24.05.2026  
> **Автор:** Multi-Agent Swarm Analysis  
> **Версия кода:** Текущее состояние main  
> **Тип отчёта:** Production Readiness Audit

---

## Содержание

1. [Executive Summary](#1-executive-summary)
2. [UX Audit Findings](#2-ux-audit-findings)
3. [Mobile UX Findings](#3-mobile-ux-findings)
4. [Role & Permissions Findings](#4-role--permissions-findings)
5. [Information Architecture Findings](#5-information-architecture-findings)
6. [Product Logic Findings](#6-product-logic-findings)
7. [Frontend Architecture Findings](#7-frontend-architecture-findings)
8. [Accessibility Findings](#8-accessibility-findings)
9. [Visual Consistency Findings](#9-visual-consistency-findings)
10. [Error States Findings](#10-error-states-findings)
11. [Production Account System Design](#11-production-account-system-design)
12. [Navigation Architecture](#12-navigation-architecture)
13. [Dashboard Redesign](#13-dashboard-redesign)
14. [Settings Architecture](#14-settings-architecture)
15. [Admin UX Refactor](#15-admin-ux-refactor)
16. [Implementation Priority Matrix](#16-implementation-priority-matrix)

---

## 1. Executive Summary

### Critical Issues Count: 4
### Major Issues Count: 15
### Moderate Issues Count: 12
### Suggestions Count: 8

### Общая оценка: **MVP / Pre-Alpha**

Текущая система аккаунта GoldPC находится на уровне MVP с серьёзными проблемами консистентности, архитектуры и UX. Наиболее критичные проблемы:

1. **Три разные стилистические системы** одновременно — страницы используют разные цветовые схемы (тёмная с hex кодами, тёмная с CSS-переменными, светлая серая тема)
2. **Административные страницы используют свой отдельный "серый" дизайн** — полностью несовместимый с основным тёмным UI
3. **Сломанные ссылки** — `/account/settings` ведёт в никуда (404)
4. **Дублирование функциональности** — CustomerDashboard и AccountOverview делают одно и то же
5. **Нет админской навигации** — админ не видит путь к админ-панели из аккаунта
6. **Нет страницы настроек пользователя** — несмотря на ссылки в Header

---

## 2. UX Audit Findings

---

### Problem UX-001: AccountOverview и CustomerDashboard — дублирование

**Severity:** Critical  
**UX Impact:** High  
**Business Impact:** High — double maintenance, inconsistent UX  

**Root Cause:** Два параллельных компонента с одинаковой функциональностью:  
- `pages/account-page/AccountOverview.tsx` (внутри `/account`)  
- `pages/customer-dashboard/CustomerDashboard.tsx` (на `/dashboard`)

**Current Behavior:** Оба показывают:
- Welcome message
- Stats row (orders + repairs)
- Recent orders table
- Quick actions
- Saved builds section

**Expected Production Behavior:** Единый dashboard с role-aware контентом.

**Recommended Refactor:** Удалить CustomerDashboard, сделать AccountOverview главной точкой входа. `/dashboard` → redirect на `/account`.

---

### Problem UX-002: Пустая страница /account/settings

**Severity:** Critical  
**UX Impact:** High — dead link in header dropdown  
**Business Impact:** Medium — пользователь теряет доверие  

**Root Cause:** Ссылка `Settings` в header dropdown ведёт на `/account/settings`, но такого маршрута нет в `App.tsx`.

**Current Behavior:** Клик → 404 страница.

**Expected Production Behavior:** Полноценная страница настроек пользователя с разделами: профиль, безопасность, уведомления, интерфейс, privacy.

---

### Problem UX-003: Нет индикации роли пользователя

**Severity:** Major  
**UX Impact:** High  
**Business Impact:** High — админы не знают, что у них есть доступ к админке  

**Root Cause:** В AccountLayout sidebar нет role-based секции, в header dropdown нет ссылки на `/admin`.

**Current Behavior:** Пользователь с ролью Admin видит тот же sidebar, что и обычный Client. Нет визульного отличия, нет ссылки на админку.

**Expected Production Behavior:** Role-aware sidebar — Admin видит дополнительные ссылки "Администрирование" с подпунктами. Staff roles (Manager, Master, Accountant) видят свои секции.

---

### Problem UX-004: Нет breadcrumbs в аккаунте

**Severity:** Major  
**UX Impact:** Medium — пользователь теряет ориентацию  
**Business Impact:** Medium  

**Root Cause:** Компонент `Breadcrumbs` существует в `components/layout/`, но не используется на страницах аккаунта.

**Current Behavior:** Пользователь не видит путь навигации.

**Expected Production Behavior:** Breadcrumbs на каждой странице: `Главная / Личный кабинет / Заказы`

---

### Problem UX-005: "Загрузка..." текстовые loading states

**Severity:** Moderate  
**UX Impact:** Medium — дёшево выглядит  
**Business Impact:** Low  

**Root Cause:** Множество страниц используют простой текст "Загрузка..." вместо skeleton/loader.

**Аffected Pages:**
- AccountOverview — `"Загрузка..."` 
- AccountOrders — `"Загрузка..."`  
- AccountRepairs — `"Загрузка..."` (в начальной загрузке)
- AccountOrders — `"Загрузка деталей заказа..."` в модалке

**Expected Production Behavior:** Скелетоны/спиннеры в стиле проекта.

---

### Problem UX-006: Нет onboarding / first-use опыта

**Severity:** Moderate  
**UX Impact:** Medium  
**Business Impact:** Medium  

**Root Cause:** Нет туров, подсказок или welcome-флоу для нового пользователя.

**Current Behavior:** Новый пользователь видит пустой dashboard и должен сам догадаться, что делать.

**Expected Production Behavior:** Empty states с сильными CTAs, возможно onboarding flow при первом входе.

---

### Problem UX-007: AccountLayout — двойной скролл

**Severity:** Moderate  
**UX Impact:** Medium  
**Business Impact:** Low  

**Root Cause:** AccountOverview внутри AccountLayout имеет собственный `min-h-screen`, и каждая дочерняя страница тоже.

**Current Behavior:** Двойной скролл на страницах аккаунта (layout + content).

**Expected Production Behavior:** Только один scrolling container.

---

## 3. Mobile UX Findings

---

### Problem MOB-001: Таблицы не адаптивны на мобильных

**Severity:** Major  
**UX Impact:** High  
**Business Impact:** High — mobile users ~50% трафика  

**Affected Pages:**
- AccountOverview — таблица заказов
- AccountOrders — таблица заказов
- AccountRepairs — CSS grid с 12 колонками

**Current Behavior:** Таблицы `overflow-x-auto` без мобильной адаптации. На маленьких экранах пользователь вынужден горизонтально скроллить.

**Expected Production Behavior:** На mobile таблицы превращаются в card list или stacked layout.

**Mobile Solution:** 
- `< 768px`: card-based layout (каждый заказ — карточка)
- `> 768px`: таблица

---

### Problem MOB-002: Mobile sidebar AccountLayout — z-index конфликт

**Severity:** Major  
**UX Impact:** High  
**Business Impact:** Medium  

**Root Cause:** Sidebar использует `z-[110]` с `fixed inset-y-0 left-0 top-16`, а Header использует `z-[100]`. На mobile sidebar может перекрываться или быть перекрыт.

**Current Behavior:** Из-за sticky header (z-100) и sidebar (z-110) могут возникать конфликты перекрытия.

**Expected Production Behavior:** Mobile drawer должен быть fullscreen overlay.

---

### Problem MOB-003: Нет bottom navigation для staff ролей

**Severity:** Moderate  
**UX Impact:** Medium  
**Business Impact:** Low  

**Root Cause:** Staff-страницы (Manager, Master, Accountant) не имеют мобильной навигации.

**Current Behavior:** На mobile staff видят тот же header, что и обычные пользователи.

**Expected Production Behavior:** Bottom tab bar с role-specific actions для staff на mobile.

---

### Problem MOB-004: Touch targets меньше 44px

**Severity:** Moderate  
**UX Impact:** Low  
**Business Impact:** Low  

**Root Cause:** Некоторые иконки-кнопки имеют размер 32px (w-8 h-8) — меньше минимального touch target 44px.

**Expected Production Behavior:** Все touch targets минимум 44x44px на mobile.

---

## 4. Role & Permissions Findings

---

### Problem ROLE-001: Админ не видит админку из UI

**Severity:** Critical  
**UX Impact:** Critical  
**Business Impact:** Critical — админ не может найти админ-панель  

**Root Cause:** 
1. Header dropdown не показывает ссылку на `/admin`
2. AccountLayout sidebar не показывает admin-секцию
3. Нет role badge/indicator рядом с именем пользователя
4. `/admin` в URL не подсвечивается в навигации

**Current Behavior:** Пользователь с ролью Admin:
- Видит тот же sidebar, что и Client
- В header dropdown видит только: Панель управления, Профиль, Заказы, Настройки (битая ссылка)
- Должен вручную ввести `/admin/users` в адресной строке

**Expected Production Behavior:** 
- AccountLayout показывает секцию "Администрирование" для Admin
- Header dropdown показывает "Админ-панель" для Admin
- Staff roles (Manager, Master, Accountant) видят свои секции

---

### Problem ROLE-002: AdminRedirect не показывает manager/master при нескольких ролях

**Severity:** Major  
**UX Impact:** Medium  
**Business Impact:** Medium  

**Root Cause:** AdminRedirect направляет по первой подходящей роли, а `currentRole` в authStore берёт первую роль из массива.

**Current Behavior:** Пользователь с ролями ['Admin', 'Manager'] будет направлен на `/admin/users`, даже если хочет работать как Manager.

**Expected Production Behavior:** Role switcher в UI — пользователь с несколькими ролями может переключаться.

---

### Problem ROLE-003: RoleGuard — жёсткий редирект без объяснения

**Severity:** Major  
**UX Impact:** Medium  
**Business Impact:** Medium  

**Current Behavior:** Если роль не подходит — показывается 403 страница, которая не объясняет, как получить доступ.

**Expected Production Behavior:** 403 страница должна:
- Показывать текущую роль
- Показывать требуемые роли
- Предлагать контакты поддержки
- Предлагать switch role если доступны несколько ролей

---

### Problem ROLE-004: Guard components не имеют role-aware возврата

**Severity:** Moderate  
**UX Impact:** Medium  
**Business Impact:** Low  

**Current Behavior:** AuthGuard редиректит на `/login` без `from` location recovery.

**Expected Production Behavior:** После логина пользователь должен возвращаться на исходную страницу.

---

## 5. Information Architecture Findings

---

### Problem IA-001: Дублирование точек входа

**Severity:** Major  
**UX Impact:** High  
**Business Impact:** Medium  

**Current Behavior:**
- `/dashboard` — CustomerDashboard
- `/account` — AccountOverview  
- `/account/profile` — AccountProfile
- Нет `/profile` — редирект на `/account/profile`

Пользователь может попасть на два разных "dashboard" с одинаковой функциональностью.

**Expected Architecture:**
```
/account          → Dashboard (единый, role-aware)
/account/profile  → Профиль + безопасность
/account/settings → Все настройки
/account/orders   → Заказы
/account/repairs  → Ремонты
/account/warranty → Гарантия
/account/builds   → Сборки
/account/activity → История активности
/account/billing  → Платежи (future)
```

`/dashboard` → redirect на `/account`

---

### Problem IA-002: Нет группировки в sidebar навигации

**Severity:** Moderate  
**UX Impact:** Medium  
**Business Impact:** Medium  

**Current Behavior:** Flat список из 6 ссылок:
```
Обзор
Профиль
Заказы
Ремонты
Гарантия
Сборки
```

**Expected Architecture:**
```
📊 Обзор
👤 Профиль и безопасность
   ├── Профиль
   ├── Безопасность
   └── Настройки
📦 Заказы и покупки
   ├── Заказы
   ├── Гарантия
   └── Избранное
🔧 Сервис
   ├── Ремонты
   └── Запрос на ремонт
💻 Мои сборки
   └── Сборки ПК
🔐 Администрирование (только Admin)
   ├── Пользователи
   ├── Каталог
   ├── Настройки системы
   └── Журнал аудита
```

---

### Problem IA-003: Ссылка "Избранное" в account sidebar отсутствует

**Severity:** Moderate  
**UX Impact:** Low  
**Business Impact:** Low  

**Current Behavior:** В sidebar нет ссылки на wishlist, хотя это важная часть аккаунта.

**Expected Behavior:** Добавить `/account/wishlist` → redirect на `/wishlist`.

---

## 6. Product Logic Findings

---

### Problem LOG-001: Нет подтверждения email в UI профиля

**Severity:** Major  
**UX Impact:** Medium  
**Business Impact:** High — пользователи с неподтверждённым email  

**Current Behavior:** В профиле нет индикатора, подтверждён ли email. Компонент `EmailVerificationBanner` существует, но непонятно, на каких страницах показывается.

**Expected Behavior:** В профиле показывать статус верификации email с возможностью повторной отправки.

---

### Problem LOG-002: Состояние "нет заказов" — слабый CTA

**Severity:** Moderate  
**UX Impact:** Medium  
**Business Impact:** Medium  

**Current Behavior:** 
- AccountOverview: "У вас пока нет заказов"  
- AccountRepairs: "У вас пока нет заявок на ремонт" + кнопка создать

**Expected Behavior:** 
- Empty state → CTA "Перейти в каталог"  
- Smart suggestions на основе просмотренных товаров

---

### Problem LOG-003: Кэширование и stale data

**Severity:** Moderate  
**UX Impact:** Medium  
**Business Impact:** Medium  

**Current Behavior:** Ручное обновление данных через `setInterval` (polling) в AccountOrders и AccountRepairs, без кэширования и оптимизации.

**Expected Behavior:** Использовать TanStack Query (React Query) для кэширования, refetching и stale management.

---

## 7. Frontend Architecture Findings

---

### Problem ARCH-001: Три стилистические системы в одном проекте

**Severity:** Critical  
**UX Impact:** Critical  
**Business Impact:** High — бренд неконсистентен  

**Current State:**

| Система | Где используется | Примеры |
|---------|-----------------|---------|
| **Hardcoded hex** `bg-[#0b0e11]` | AccountOverview, AccountOrders, AccountRepairs, AccountProfile, CustomerDashboard | `bg-[#1e2329]`, `text-[#eaecef]` |
| **Design tokens** `bg-background` | AccountWarranty, AccountSavedBuilds | `bg-card`, `text-gold`, `text-muted-foreground` |
| **Светлая серая тема** `bg-white` | SettingsPage (admin), AuditLogPage, CatalogManagementPage | `text-gray-900`, `blue-500`, `bg-white` |

**Кроме того, используются:**
- Emoji как иконки в админке: `✏️`, `🗑️`, `🏠`
- `alert()` для уведомлений
- Разные паттерны кнопок

**Expected Production Behavior:** Единая система — тёмная тема через CSS-переменные, без hardcoded hex, без emoji-иконок, без `alert()`.

---

### Problem ARCH-002: SettingsPage — заражение серой темой

**Severity:** Critical  
**UX Impact:** Critical  
**Business Impact:** High  

**Root Cause:** `SettingsPage.tsx` написан в совершенно другом дизайне — серая тема с голубыми акцентами.

**Specific Issues:**
- `text-gray-900`, `text-gray-600`, `text-gray-400`
- `bg-blue-500`, `hover:bg-blue-600`
- `bg-white` для карточек
- Emoji в заголовках секций: `🏠`, `📦`, `🔒`, `🔔`, `⚙️`
- `alert()` вместо toast
- `border-gray-200` вместо `border-hairline-dark`
- Нет тёмной темы

**Expected Production Behavior:** Полный редизайн в соответствии с тёмной темой GoldPC.

---

### Problem ARCH-003: AuditLogPage — mock data + серая тема

**Severity:** Major  
**UX Impact:** High  
**Business Impact:** Medium  

**Root Cause:** Mock data + светлая тема + разные стили.

**Specific Issues:**
- Mock data вместо API
- `bg-white`, `text-gray-900`, `blue-500`
- `bg-green-50`, `bg-orange-50`, `bg-red-50` для строк
- Разные стили кнопок от основного UI
- Комментирован в App.tsx: `// AuditLogPage temporarily commented out`

---

### Problem ARCH-004: CatalogManagementPage — эмодзи и alert()

**Severity:** Major  
**UX Impact:** Medium  
**Business Impact:** Medium  

**Specific Issues:**
- Emoji-иконки `✏️ 🗑️ 🔄` вместо lucide-react
- `alert()` для уведомлений
- `bg-white`, `text-gray-900`, `blue-500`
- `bg-gray-50`, `border-gray-200`
- Inline modal вместо `Modal` компонента

---

### Problem ARCH-005: Дублирование маршрута /admin/users

**Severity:** Moderate  
**UX Impact:** Low  
**Business Impact:** Low  

**Location:** `App.tsx`, lines 257-259  
```tsx
{ path: '/admin/users', element: <UserManagementPage /> },
{ path: '/admin/users', element: <UserManagementPage /> },  // дубль!
```

---

### Problem ARCH-006: Все admin страницы — разные паттерны загрузки

**Severity:** Moderate  
**UX Impact:** Low  
**Business Impact:** Low  

**Current Behavior:**
- UserManagementPage — div with spinner
- SettingsPage — div with spinner + text
- CatalogManagementPage — spinner with `border-t-blue-500`
- AuditLogPage — spinner with `border-t-blue-500`

4 разных спиннера, 4 разных подхода.

---

### Problem ARCH-007: Нет React Query / TanStack Query в аккаунте

**Severity:** Major  
**UX Impact:** Medium  
**Business Impact:** Medium  

**Current Behavior:** Все data fetching через `useState + useEffect + manual API calls`. Нет кэширования, дедупликации, оптимистичных обновлений.

---

### Problem ARCH-008: Ручное localStorage в authStore

**Severity:** Moderate  
**UX Impact:** Low  
**Business Impact:** Low  

**Current Behavior:** Zustand persist middleware закомментирован, данные сохраняются вручную через `localStorage.setItem`.

---

## 8. Accessibility Findings

---

### Problem A11Y-001: Отсутствие aria-labels на action-кнопках

**Severity:** Major  
**UX Impact:** Medium  
**Business Impact:** Medium — screen reader users  

**Affected Pages:**
- AccountOrders: кнопки "Повторить", "Отследить" — есть aria-label
- AccountOverview: quick actions cards — нет aria-label
- AccountLayout: sidebar toggle — есть, но mobile overlay не объявляет role

---

### Problem A11Y-002: Цветовой контраст

**Severity:** Moderate  
**UX Impact:** Low  
**Business Impact:** Low  

**Specific Issues:**
- `text-[#707a8a]` на `bg-[#1e2329]` — низкий контраст
- `text-muted-text` на `bg-surface-card` — может быть недостаточным
- Status badges с прозрачностью могут иметь плохой контраст

---

### Problem A11Y-003: Нет skip-to-content на страницах аккаунта

**Severity:** Moderate  
**UX Impact:** Low  
**Business Impact:** Low  

**Current Behavior:** MainLayout имеет skip link, но AccountLayout его не использует.

---

### Problem A11Y-004: Фокус не виден на всех элементах

**Severity:** Moderate  
**UX Impact:** Low  
**Business Impact:** Low  

**Current Behavior:** Нет кастомных focus-visible стилей для keyboard navigation.

---

## 9. Visual Consistency Findings

---

### Problem VIS-001: Три паттерна карточек

**Severity:** Major  
**UX Impact:** High  
**Business Impact:** Medium  

**Current Behavior:**
1. `bg-[#1e2329] rounded-xl border border-[#2b3139]` — AccountOverview, AccountOrders, AccountRepairs, AccountProfile
2. `bg-card rounded-xl border border-border` — AccountWarranty, AccountSavedBuilds
3. `bg-white rounded-xl shadow-sm border border-gray-200` — Admin pages

---

### Problem VIS-002: Разные стили кнопок

**Severity:** Major  
**UX Impact:** Medium  
**Business Impact:** Medium  

**Current Behavior:**
- Gold buttons: `bg-gold text-gold-ink` (SavedBuilds)
- Yellow buttons: `bg-[#FCD535] text-[#181a20]` (Overview, Orders, Repairs)
- Blue buttons: `bg-blue-500 text-white` (Admin pages)
- Gray buttons: `bg-[#2b3139] text-[#eaecef]` (Profile)

---

### Problem VIS-003: Разные status badge паттерны

**Severity:** Moderate  
**UX Impact:** Low  
**Business Impact:** Low  

**Current Behavior:** 4 разных паттерна для бейджей статусов — в AccountOverview, AccountOrders, AccountWarranty, CustomerDashboard каждый имеет свою реализацию.

---

### Problem VIS-004: Нет единой системы иконок

**Severity:** Major  
**UX Impact:** Medium  
**Business Impact:** Medium  

**Current Behavior:**
- Lucide icons в аккаунте
- Emoji в админ-страницах `✏️ 🗑️ 🔄 🏠`
- SVG иконки inline в UserManagementPage
- Plus/minus SVG в AccountProfile

---

### Problem VIS-005: Typography не унифицирована

**Severity:** Moderate  
**UX Impact:** Medium  
**Business Impact:** Low  

**Current Behavior:** Заголовки используют:
- `text-2xl font-bold` в одних местах
- `text-2xl font-semibold` в других
- `text-lg font-semibold` для section headers
- Разные font sizes для подзаголовков

---

## 10. Error States Findings

---

### Problem ERR-001: Нет глобального ErrorBoundary

**Severity:** Major  
**UX Impact:** High  
**Business Impact:** High — ошибки не ловятся  

**Current Behavior:** Нет ErrorBoundary, обёртывающего приложение. Любая ошибка в компоненте — белый экран.

---

### Problem ERR-002: Сайлент-фейлы (silent catch)

**Severity:** Moderate  
**UX Impact:** Medium  
**Business Impact:** Medium  

**Current Behavior:**
```tsx
.catch(() => {})  // AccountOrders, AccountRepairs, CustomerDashboard
```

Ошибки API проглатываются, пользователь не видит проблему.

---

### Problem ERR-003: 404 страница не role-aware

**Severity:** Moderate  
**UX Impact:** Low  
**Business Impact:** Low  

**Current Behavior:** NotFoundPage красивая, но не показывает role-specific ссылки.

**Expected:** Если админ на 404 — показать ссылки на админ-панель.

---

### Problem ERR-004: Offline state не интегрирован

**Severity:** Moderate  
**UX Impact:** Medium  
**Business Impact:** Low  

**Current Behavior:** `OfflineBanner` существует, но не блокирует действия на страницах аккаунта.

---

## 11. Production Account System Design

### Account System Architecture

```
/account
├── (index)         → AccountDashboard (role-aware overview)
├── profile         → ProfilePage (личные данные, аватар)
├── security        → SecurityPage (пароль, 2FA, сессии, история входов)
├── settings         → SettingsPage (настройки пользователя)
│   ├── notifications → NotificationPreferences
│   ├── appearance    → Theme/Density/Language
│   └── privacy       → PrivacySettings
├── orders          → OrdersPage (история заказов)
├── repairs         → RepairsPage (мои ремонты)
├── warranty        → WarrantyPage (гарантийные талоны)
├── builds          → SavedBuildsPage (сборки ПК)
├── wishlist        → redirect к /wishlist
├── activity        → ActivityLog (история действий)
├── billing         → BillingPage (платежи, счета, подписки) [future]
└── devices         → DevicesPage (активные сессии, устройства)
```

### Settings Page — Complete Architecture

```
/account/settings
├── 📋 Profile
│   ├── Avatar (upload/crop)
│   ├── Display Name
│   ├── Username
│   ├── Bio (optional)
│   └── Public Profile Visibility
│
├── 🔒 Security
│   ├── Password Change
│   ├── Two-Factor Auth (TOTP/SMS)
│   ├── Active Sessions
│   ├── Login History
│   └── Suspicious Activity Alerts
│
├── 🔔 Notifications
│   ├── Email Notifications
│   ├── Push Notifications
│   ├── Telegram (integration)
│   ├── Order Updates
│   ├── Promotions & Marketing
│   └── System Alerts
│
├── 🎨 Appearance
│   ├── Theme (dark/light/system)
│   ├── Density (comfortable/compact)
│   ├── Language
│   └── Dashboard Layout
│
└── 🛡️ Privacy & Data
    ├── Profile Visibility
    ├── Data Export
    ├── Delete Account
    └── Connected Apps
```

---

## 12. Navigation Architecture

### Desktop Navigation (Header)

```
[Logo]  [Каталог] [Конструктор] [Сервис] [О нас]  [🛒] [❤️] [⇆] [👤 ▼]
                                                                    ├── Без авторизации:
                                                                    │   ├── Войти
                                                                    │   └── Регистрация
                                                                    │
                                                                    └── С авторизацией:
                                                                        ├── [Аватар] Имя Фамилия
                                                                        │           email@example.com
                                                                        ├── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                                                                        ├── 📊 Панель управления
                                                                        ├── 👤 Профиль и настройки
                                                                        ├── 📦 Мои заказы
                                                                        ├── 🔧 Мои ремонты
                                                                        ├── 💻 Мои сборки
                                                                        ├── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                                                                        ├── ⚙️ Администрирование (Admin only!)
                                                                        │   ├── Пользователи
                                                                        │   ├── Каталог
                                                                        │   ├── Настройки системы
                                                                        │   └── Журнал аудита
                                                                        ├── 🔧 Менеджмент (Manager only!)
                                                                        │   ├── Панель менеджера
                                                                        │   ├── Заказы
                                                                        │   └── Склад
                                                                        ├── 🔧 Мастер (Master only!)
                                                                        │   └── Заявки на ремонт
                                                                        ├── 📊 Бухгалтерия (Accountant only!)
                                                                        │   ├── Отчёты
                                                                        │   └── Экспорт
                                                                        ├── ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                                                                        └── 🚪 Выйти
```

### Account Sidebar (Desktop) — Role-Aware

```
┌──────────────────────┐
│    [Avatar]          │
│   Имя Фамилия        │
│   email@example.com  │
├──────────────────────┤
│ 📊  Обзор            │
├──────────────────────┤
│ 👤  Профиль          │
│ 🔒  Безопасность     │
│ ⚙️  Настройки        │
├──────────────────────┤
│ 📦  Заказы           │
│ 🛡️  Гарантия        │
│ 💛  Избранное        │
├──────────────────────┤
│ 🔧  Ремонты          │
├──────────────────────┤
│ 💻  Сборки ПК        │
│ ⏱️  История          │
├──────────────────────┤
│ ⚙️  Администрирование│ ← Только Admin
│  ├── Пользователи    │
│  ├── Каталог         │
│  ├── Настройки       │
│  └── Аудит           │
├──────────────────────┤
│ 📋  Управление       │ ← Manager/Master
│  ├── Заказы          │
│  └── Склад           │
├──────────────────────┤
│ 📊  Отчёты           │ ← Accountant
│  └── Экспорт         │
├──────────────────────┤
│ 🚪  Выйти            │
└──────────────────────┘
```

### Mobile Navigation — Bottom Tab Bar

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│   🏠     │   📋    │   🔍    │   💛    │   👤    │
│ Главная  │ Аккаунт  │ Каталог  │ Избран.  │ Профиль  │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

Для staff-ролей — дополнительная вкладка с role-specific действиями.

---

## 13. Dashboard Redesign

### AccountOverview → AccountDashboard

```
┌─────────────────────────────────────────────────────┐
│  📊 Панель управления                    [role badge]│
│  Добро пожаловать, Иван!                            │
├─────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Заказов │ │ Ремонтов│ │ Сборок  │ │ Награды │    │
│ │    5    │ │    2    │ │    1    │ │    ★    │    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
├─────────────────────────────────────────────────────┤
│ Быстрые действия                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │📦 Заказ  │ │🔧 Ремонт │ │💻 Сборка │ │🛡️ Гарант ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
├─────────────────────────────────────────────────────┤
│ ┌─── Последние заказы ─────┐ ┌─── Активные ремонты ┐│
│ │ #001 — 24.05    ✅ Достав│ │ #T3 — Диагностика... ││
│ │ #002 — 23.05    🚚 В пут│ │ #T2 — Ремонт...     ││
│ │ #003 — 22.05    ⏳ Обраб │ │                     ││
│ │ Все заказы →             │ │ Все ремонты →       ││
│ └──────────────────────────┘ └─────────────────────┘│
├─────────────────────────────────────────────────────┤
│ Уведомления                         [🔔 3 новых]    │
│ • Заказ #004 доставлен                           │
│ • Ремонт #T3: диагностика завершена                │
│ • Срок гарантии на RTX 4090 истекает через 30 дней │
└─────────────────────────────────────────────────────┘
```

**Role-aware additions:**
- **Admin:** Добавить виджеты "Новые пользователи", "Последние действия", "Статус системы"
- **Manager:** Добавить "Заказы на сегодня", "Низкий остаток"
- **Master:** Добавить "Очередь ремонтов", "Ожидают запчасти"
- **Accountant:** Добавить "Финансовые показатели", "Последние отчёты"

---

## 14. Settings Architecture

### Редизайн SettingsPage (admin + user)

```
┌─────────────────────────────────────────────────┐
│ ⚙️ Настройки системы                      [Сохр]│
├─────────────────────────────────────────────────┤
│ 📋 Основные                                      │
│ ┌───────────────────────────────────────────────┐│
│ │ Название магазина     [GoldPC               ] ││
│ │ Email для уведомлений [admin@goldpc.by      ] ││
│ │ Адрес магазина        [ул. Примерная, 123    ] ││
│ │ Телефон               [+375 (29) 123-45-67  ] ││
│ │ Режим работы           [Пн-Пт 9:00-18:00    ] ││
│ └───────────────────────────────────────────────┘│
│                                                   │
│ 📦 Доставка                                       │
│ ┌───────────────────────────────────────────────┐│
│ │ Бесплатно от (BYN)   [200                   ] ││
│ │ Стоимость доставки   [7.00                  ] ││
│ │ Сроки доставки       [1-3 рабочих дня ▼     ] ││
│ └───────────────────────────────────────────────┘│
│                                                   │
│ 🔒 Безопасность                                   │
│ ┌───────────────────────────────────────────────┐│
│ │ 2FA для админов        [═══●═══════════] Вкл  ││
│ │ Журналирование         [════●═════════] Вкл   ││
│ │ Уведомления о входе    [════════●═════] Выкл  ││
│ └───────────────────────────────────────────────┘│
│                                                   │
│ 🔔 Уведомления                                    │
│ ┌───────────────────────────────────────────────┐│
│ │ Email о заказах        [═══●═══════════] Вкл  ││
│ │ SMS клиентам           [════════●═════] Выкл  ││
│ │ Низкий остаток         [═══●═══════════] Вкл  ││
│ └───────────────────────────────────────────────┘│
│                                                   │
│ ⚙️ Режим обслуживания                             │
│ ┌───────────────────────────────────────────────┐│
│ │ Режим обслуживания     [════════●═════] Выкл  ││
│ └───────────────────────────────────────────────┘│
│                                                   │
│ [Сохранить изменения]  [Сбросить к умолчанию]    │
└─────────────────────────────────────────────────┘
```

**Ключевые изменения:**
- Тёмная тема вместо серой
- Lucide icons вместо emoji
- Toast вместо alert()
- Design tokens вместо hardcoded colors
- Toggle switches в стиле GoldPC

---

## 15. Admin UX Refactor

### Current Admin Pages Issues

| Страница | Проблема | Решение |
|----------|----------|---------|
| UserManagementPage | Inline SVG иконки вместо lucide | Заменить на lucide-react |
| UserManagementPage | Разные стили кнопок | Унифицировать |
| CatalogManagementPage | Emoji ✏️ 🗑️ 🔄 | Заменить на lucide |
| CatalogManagementPage | alert() | Заменить на toast |
| CatalogManagementPage | Inline modal | Использовать Modal компонент |
| SettingsPage | Полностью серая тема | Полный редизайн в тёмной теме |
| AuditLogPage | Mock data | Подключить API |
| AuditLogPage | Светлая тема | Перевести в тёмную тему |

### Admin Navigation Component

Создать единый `AdminLayout` с sidebar:

```
┌──────────────────────────────────────────────┐
│ ⚙️ Администрирование                         │
├──────────────────────────────────────────────┤
│ 👥  Пользователи              [UsersPage]     │
│ 📦  Каталог                  [CatalogPage]    │
│ ⚙️  Настройки                [SettingsPage]   │
│ 📋  Журнал аудита            [AuditLogPage]  │
│ 🤝  Координатор              [Coordinator]   │
│ 🗂️  Справочники              [Dictionaries]  │
├──────────────────────────────────────────────┤
│ ← Вернуться в личный кабинет                 │
└──────────────────────────────────────────────┘
```

---

## 16. Implementation Priority Matrix

### Phase 1 — Critical (немедленно)

| # | Issue | Файлы | Время |
|---|-------|-------|-------|
| 1 | SettingsPage — полный редизайн | `SettingsPage.tsx` | 2-3h |
| 2 | /account/settings — создать маршрут | `App.tsx` + новый компонент | 4-5h |
| 3 | Роль-специфичная навигация в sidebar | `AccountLayout.tsx` | 2h |
| 4 | Admin ссылки в header dropdown | `Header.tsx` | 1h |
| 5 | Дубль /admin/users в роутинге | `App.tsx` | 10min |

### Phase 2 — Major (следующая неделя)

| # | Issue | Файлы | Время |
|---|-------|-------|-------|
| 6 | Удалить дублирование Dashboard | `CustomerDashboard.tsx`, routing | 2h |
| 7 | AudiLogPage — реальные данные + тёмная тема | `AuditLogPage.tsx` | 4h |
| 8 | CatalogManagementPage — редизайн под тёмную тему | `CatalogManagementPage.tsx` | 3h |
| 9 | UserManagementPage — унификация иконок | `UserManagementPage.tsx` | 1.5h |
| 10 | Toast вместо alert() во всех admin pages | All admin pages | 2h |
| 11 | Таблицы → card layout на mobile | AccountOrders, AccountRepairs | 3h |
| 12 | Skeleton loading вместо "Загрузка..." | All account pages | 2h |

### Phase 3 — Moderate (в течение месяца)

| # | Issue | Время |
|---|-------|-------|
| 13 | ErrorBoundary — глобальный | 1h |
| 14 | React Query integration | 4h |
| 15 | Breadcrumbs на страницах аккаунта | 2h |
| 16 | Settings page — полная реализация (все разделы) | 8h |
| 17 | Унификация status badges в единый компонент | 3h |
| 18 | Accessibility audit fixes | 4h |
| 19 | Mobile bottom nav для staff | 4h |

### Phase 4 — Polish (постоянно)

| # | Issue | Время |
|---|-------|-------|
| 20 | Design token audit (hex → CSS vars) | 6h |
| 21 | Анимации и micro-interactions | 4h |
| 22 | Onboarding flow для новых пользователей | 6h |
| 23 | Activity log страница для пользователя | 4h |
| 24 | Device/session management | 3h |

---

## Appendices

### A: Mapping текущих файлов в новую архитектуру

```
Текущий файл                      → Новая архитектура
─────────────────────────────────────────────────────
AccountOverview.tsx               → AccountDashboard.tsx
AccountProfile.tsx                → ProfilePage.tsx
  (security section)              → AccountSecurity.tsx (new)
AccountOrders.tsx                 → OrdersPage.tsx (minor refactor)
AccountRepairs.tsx                → RepairsPage.tsx (minor refactor)
AccountWarranty.tsx               → WarrantyPage.tsx (minor refactor)
AccountSavedBuilds.tsx            → SavedBuildsPage.tsx (minor refactor)
CustomerDashboard.tsx             → REDIRECT to /account
UserManagementPage.tsx            → AdminUsersPage.tsx (refactor)
UserFormPage.tsx                  → AdminUserFormPage.tsx (refactor)
CatalogManagementPage.tsx         → AdminCatalogPage.tsx (refactor)
SettingsPage.tsx                  → AdminSettingsPage.tsx (REDESIGN)
AuditLogPage.tsx                  → AdminAuditLogPage.tsx (REDESIGN)
CoordinatorDashboard.tsx          → AdminCoordinatorPage.tsx (refactor)
```

### B: Технический долг по компонентам

| Компонент | Tech Debt | Priority |
|-----------|-----------|----------|
| SettingsPage.tsx | Полный редизайн | Critical |
| CatalogManagementPage.tsx | Полный редизайн | High |
| AuditLogPage.tsx | Mock → API + дизайн | High |
| AccountOverview.tsx | min-h-screen fix | Low |
| AccountRepairs.tsx | Missing deps in useCallback | Medium |

---

**Конец отчёта.**
