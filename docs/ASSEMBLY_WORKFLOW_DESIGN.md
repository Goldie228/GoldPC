# Дизайн функционала: Сборка ПК на заказ (полный жизненный цикл)

> Черновик концепции. После чтения кода добавлены ответы на вопросы `[КОД]`.
> Прочтение кода — 30.06.2026. Статус: обсуждение с заказчиком.

---

## 1. Идея (как я понял задачу)

Сквозной сценарий: клиент собирает ПК в конструкторе → оплачивает сборку (+100 BYN) → заказ автоматически уходит мастеру → мастер работает по статусам, при необходимости заказывая недостающие комплектующие, связываясь с клиентом → собирает ПК → сдаёт готовый ПК на склад → товар доставляется клиенту (курьер или ПВЗ).

### 1.1. Объединение товаров в «один продукт» (компьютер)

В конструкторе ПК пользователь подбирает комплектующие. При добавлении в корзину конфигурация должна стать **единым позиционным элементом заказа** (бандлом/комплектом), к которому добавляется **услуга сборки стоимостью 100 BYN**.

Предлагаемый подход — **бандл (kit), а не новый товар**:
- В заказе хранится один элемент «Сборка ПК #идентификатор», который ссылается на список комплектующих (N line-items) + одну услугу «Сборка» (100 BYN).
- В каталоге при этом **не плодится** виртуальных сущностей «Компьютер» — каталог остаётся чистым.
- Цена бандла = сумма комплектующих + 100 BYN.

### 1.2. Триггер создания заявки мастеру

После оплаты заказа, содержащего бандл сборки ПК, система **автоматически создаёт ServiceRequest** типа `assembly` («Сборка ПК на заказ») и связывает его с заказом (Order ↔ ServiceRequest, связь 1:N — в одном заказе может быть несколько ПК-сборок).

### 1.3. Жизненный цикл заявки (статусы мастера)

```
Created        — авто-создана из оплаченного заказа, без мастера
   │
Assigned       — мастер взял в работу (self-assign из пула доступных)
   │
AwaitingParts  — мастер запросил комплектующие со склада/у поставщика
   │
PartsReady     — все комплектующие в наличии у мастера
   │
InProgress     — идёт физическая сборка
   │
Assembled      — сборка завершена, нужен приёмкой контроль (QC)
   │
InWarehouse    — готовый ПК сдан на склад (новая складская единица)
   │
ReadyForDelivery — передан в доставку
   │
InDelivery     — курьер/ПВЗ забрали
   │
Delivered      — клиент получил
   │
Completed      — финальное закрытие заявки
```

Отмена возможна на нескольких этапах (с разными правилами возврата — см. критику).

### 1.4. Функционалы мастера

| Функция | Описание | Статус в проекте |
|---|---|---|
| Просмотр конфигурации ПК | Список комплектующих с совместимостью | частично есть (PCBuilderService) |
| Заказ комплектующих | Запрос со склада или заказ у поставщика | НЕ реализовано |
| Связь с клиентом (чат) | Реал-тайм чат + телефон | частично есть (SignalR чат) |
| Управление статусами | Переходы по схеме выше | частично есть (need расширить) |
| Сдача на склад | Создание складской единицы «Готовый ПК» | НЕ реализовано |
| Передача в доставку | Выбор курьер / ПВЗ | НЕ реализовано |

### 1.5. Доставка клиенту

После `InWarehouse` заказ переходит в фазу доставки:
- **Курьер** — доставка на адрес клиента.
- **ПВЗ** (пункт выдачи) — самовывоз клиентом из точки выдачи.

---

## 2. Критика твоей идеи (конструктивно)

Ты просил покритиковать, т.к. не компетентен в задаче. Вот слабые места и пробелы, которые надо закрыть **до реализации**:

### 2.1. «Мастер заказывает нужные товары» — логическая дыра

Если товары **уже оплачены клиентом** в корзине, мастер не должен их «заказывать» — они уже куплены. Возможны два варианта, и нужно выбрать один:

- **(A) Резервирование при оплате.** Оплата = комплектующие списываются/резервируются со склада. Мастеру остаётся только **получить их со склада** (внутреннее перемещение). Тогда «заказ товаров мастером» = «запрос со склада».
- **(B) Закупка под заказ.** Комплектующие могут быть **не на складе** в момент оплаты — тогда заказ идёт поставщику, и мастер ждёт поступления. Это уже полноценный **закупочный процесс (procurement)**, что сильно расширяет скоуп.

Сейчас ты сформулировал так, будто мастер «дозаказывает» — но это конфликтует с тем, что клиент уже заплатил. **Нужно решение: A или B, или гибрид.**

### 2.2. Плоская цена 100 BYN — упрощение

Сложность сборки разная: собрать офисный ПК и собрать игровой ПК с СВО и RGB — разные трудозатраты. Плоская цена приемлема как MVP, но заложи **возможность тарифной сетки** (по категориям: офис/игровой/рабочая станция) или хотя бы **настраиваемый коэффициент**, чтобы не переписывать логику ценообразования потом.

### 2.3. «Объединить в один продукт» — опасный путь

Если буквально создавать новую сущность «Product = Computer» в каталоге, получишь:
- засорение каталога виртуальными товарами;
- проблемы с остатками (у виртуального товара их нет);
- двойной учёт: комплектующие уже есть в каталоге, и их копия в «компьютере».

**Бандл/kit — правильнее.** Заказ хранит ссылку на конфигурацию + список SKU. Не плодим сущности.

### 2.4. Склад как промежуточный этап — зачем именно?

«Собрал → сдал на склад → доставил» — лишнее звено, если только склад не делает **приёмку (QC)** и **хранение до доставки**. Если доставка идёт сразу от мастера — шаг `InWarehouse` можно опустить. Нужна ясность: **обязателен ли склад для всех сборок** или опционален?

### 2.5. Возвраты и отмены — не продуманы

Что если:
- клиент отменяет заказ **после** начала сборки?
- комплектующие оказались бракованными?
- мастер не может собрать из-за несовместимости (хотя проверка совместимости есть)?

Нужны правила возврата на каждом статусе. Особенно критично: **возвращать деньги или нет** при отмене после `InProgress`.

### 2.6. Гарантия на собранный ПК

У отдельных комплектующих своя гарантия от производителя. А на **сборку как услугу**? 100 BYN — включает ли гарантию на работу мастера? Какой срок? Это юридический/бизнес-вопрос, но без него нельзя моделировать сущность «Готовый ПК».

### 2.7. Доставка/курьер/ПВЗ — существует ли модуль?

Из сводки я **не видел** модуля доставки. Если его нет — это **крупный новый модуль**, а не доработка мастера. Нужно уточнить объём: заводим ли мы с нуля систему курьеров/ПВЗ, или интегрируемся с внешним сервисом (CDEK, Белпочта и т.п.)?

### 2.8. Валюта

Ты указал **100 BYN**, но в сид-данных услуга assembly имела `BasePrice: 50.00m` без явной валюты. Нужно проверить, в какой валюте хранятся цены в системе (BYN, USD, мультивалюта?) — иначе 100 BYN «магическое число» сломает отчёты.

### 2.9. Один заказ — несколько ПК

Если клиент покупает два собранных ПК в одном заказе — на каждый бандл своя заявка мастеру? Или одна заявка на весь заказ? Влияет на модель данных (Order↔ServiceRequest = 1:N или 1:1).

### 2.10. Назначение мастера

Сейчас в сервисном центре мастер **сам берёт** тикет из пула (self-assign, лимит 3). Для сборок ПК — тот же механизм, или **автоназначение** (менеджер/координатор распределяет)? От этого зависит, нужен ли диспетчер.

### 2.11. Телефон клиента и личные данные

«Позвонить клиенту» — значит, мастеру нужен доступ к телефону. Это **персональные данные** — нужен ли маскинг (скрывать часть номера)? Кто может видеть телефон? Учесть в ролях.

---

## 3. Результаты анализа кода

### 3.1. Корзина и заказы

| Вопрос | Ответ |
|---|---|
| **1. Поддерживает ли корзина бандлы/услуги?** | **Нет.** `OrderItem` хранит только `ProductId` (Guid) + `Quantity` + `UnitPrice`. Нет `ItemType`-дискриминатора. `CartItem` на фронте — аналогично, только товары. |
| **2. Сущность ProductKit/Bundle?** | **Нет.** Нет нигде. CatalogService: только `Product`, `Category`, `Manufacturer`. |
| **3. Связь Order ↔ ServiceRequest?** | **Не существует.** Два независимых микросервиса, разные БД, нет FK. `WarrantyService` — единственное, что ссылается на `ServiceRequestId`. |
| **4. Хранится ли PCConfigurationId в заказе?** | **Нет.** `Order` не ссылается на `PCBuilderService`. Конфигурация живёт отдельно в `PCConfiguration` (PCBuilderService). |

**Что нужно добавить:**
- Enum `OrderItemType` (Product, Bundle, Service)
- Поле `PCConfigurationId` (Guid?) на `OrderItem` или `Order`
- Связь Order ↔ ServiceRequest (junction-таблица или FK)
- Фронт: поддержка нескольких типов элементов в корзине

### 3.2. Каталог и цены

| Вопрос | Ответ |
|---|---|
| **5. Валюта цен?** | **BYN.** Поле `Product.Price` документировано как `/// <summary>Цена в BYN</summary>`. Мультивалюты нет — одна валюта, одно поле. |
| **6. Как смоделирована услуга assembly?** | **Отдельная сущность `ServiceType`** в ServicesService (не товар с флагом). Сиды: 7 типов услуг, assembly = slug `"assembly"`. |
| **7. Где цена сборки?** | **`ServiceType.BasePrice`** = 50.00 BYN сейчас. `ServiceRequest.EstimatedCost` при создании копирует `BasePrice`. |

**Закрываю бизнес-решение [23] (частично):** цена сборки хранится в `ServiceType.BasePrice`. Меняем 50 → 100 BYN. Плоская цена для MVP допустима — поле `BasePrice` настраиваемое, тарифная сетка возможна через `AssemblyTier`-поле позже.

### 3.3. Склад и остатки

| Вопрос | Ответ |
|---|---|
| **8. Модуль склада?** | **Нет.** Только `Product.Stock` (int). Нет `Warehouse`, `StockMovement`, `InventoryItem`. |
| **9. Когда списывается stock?** | **Нигде активно.** `ReserveStockAsync` в CatalogService закомментирован: `// Временно отключено пока CatalogService не будет настроен`. Только на отмене заказа `ReleaseStockAsync` работает. |
| **10. Резерв (reserved vs available)?** | **Нет.** Один `int Stock`. Нет `ReservedStock`. |
| **11. Складские перемещения / выдача мастеру?** | **Нет.** `ServicePart` — просто лог (ProductId, Name, Quantity, UnitPrice), без списания с inventory. |

**Важно:** склад — это серьёзный пробел. Для полного цикла «мастер получает комплектующие» нужно как минимум: `StockReservation` (reserved vs available), `StockMovement` (списание при выдаче), `StockIssuance` (выдача мастеру).

### 3.4. Доставка

| Вопрос | Ответ |
|---|---|
| **12. Модуль доставки?** | **Нет.** Только `CalculateDeliveryCost` в OrdersService (Minsk=5 BYN, other=10 BYN, Pickup=free). Хардкод. |
| **13. Интеграция с внешним сервисом?** | **Нет.** Нет клиентов для CDEK, Белпочты и т.п. |
| **14. Поле DeliveryMethod в заказе?** | **Да.** `Order.DeliveryMethod` = `"Pickup"` или `"Delivery"`. `Order.Address` (обязательно при Delivery). `Order.DeliveryCost`. Даты доставки (`DeliveryDate`, `DeliveryTimeSlot`) закомментированы при создании. |

### 3.5. Статусы заявки

| Вопрос | Ответ |
|---|---|
| **15. Enum статусов?** | 6 значений: `Submitted(0)`, `InProgress(1)`, `PartsPending(2)`, `ReadyForPickup(3)`, `Completed(4)`, `Cancelled(5)`. Допустимые переходы жёстко заданы в `ServicesService.cs`. |
| **16. Автосоздание ServiceRequest из Order?** | **Нет.** Нет event handlers / MassTransit consumers в ServicesService. `OrderPaidEvent` публикация закомментирована в OrdersService. |
| **17. Кто создаёт ServiceRequest?** | **Только клиент вручную** через `ServicesService.CreateAsync`. Нет системного пути создания. |

**Что нужно добавить:**
- Расширить enum `ServiceRequestStatus`: +`Assigned`, `AwaitingParts`, `PartsReady`, `Assembled`, `InWarehouse`, `ReadyForDelivery`, `InDelivery`, `Delivered`
- MassTransit consumer в ServicesService, слушающий `OrderPaidEvent`
- Фабрика создания `ServiceRequest` для assembly (с конфигурацией ПК)
- Расширить валидацию переходов статусов

### 3.6. Чат и контактные данные

| Вопрос | Ответ |
|---|---|
| **18. Телефон клиента?** | Хранится: `User.Phone` (`+375XXXXXXXXX`) в AuthService + `Order.CustomerPhone` снапшот. **Но мастеру НЕ отдаётся** — `ServiceRequestDto` не маппит телефон. |
| **19. Чат привязан к ServiceRequest?** | **Да.** `ChatHub` джойнит `ticket:{serviceRequestId}`. `TicketMessage.ServiceRequestId` FK. **Переиспользовать для сборки можно** — нужно только создать `ServiceRequest` для assembly. |
| **20. Маскинг телефона?** | **Нет.** Нет маскирования PII. Телефон хранится и передаётся в открытом виде. |

**Что нужно добавить:**
- Маппинг телефона клиента в `ServiceRequestDto` (с опциональным маскированием: `+375****XX`)
- Право `ServicesViewPhone` в `RolePermissions` для Master
- Или показать телефон в UI только для assigned master

### 3.7. Гарантия

| Вопрос | Ответ |
|---|---|
| **21. Модель WarrantyService?** | `WarrantyCard` — **на один товар** (`ProductId` required). Нет концепта «гарантия на собранный ПК». При завершении ServiceRequest создаётся `WarrantyCard` для услуги (`ProductId = Guid.Empty`, `ProductName = "Услуга: ..."`) с индивидуальным `WarrantyMonths`. |

**Вариант для MVP:** создавать warranty на каждый компонент + warranty на услугу сборки. Связать через `ServiceRequestId`. Не нужна сущность «компьютер» — warranty уже диверсифицированы.

### 3.8. Бонус: что ещё нашёл

- **7 типов услуг** в сид-данных: ремонт компьютеров, ремонт ноутбуков, модернизация, диагностика, **сборка**, восстановление данных, чистка.
- **ProcurementService не существует** — заказ у поставщика нигде не реализован.
- **Master permissions**: `ProductsView, OrdersView, OrdersManage, UsersView, CategoriesView, ServicesView, ServicesManage, PcBuilderUse, WarrantyView, WarrantyManage`. Нет доступа к каталогу, нет создания заказов.

---

## 4. Бизнес-решения: что закрыто, что ждёт тебя

### Закрыто мной (на основе кода)

| # | Вопрос | Решение | Обоснование |
|---|---|---|---|
| 23 | Цена сборки | **100 BYN, плоско.** `ServiceType.BasePrice` настраиваемое поле — меняем 50→100 | Для MVP достаточно. Тарифная сетка возможна через `AssemblyTier`-поле потом |
| 28 | Гарантия на сборку | **MVP: warranty на каждый компонент + warranty на услугу сборки**, связь через `ServiceRequestId` | `WarrantyCard` уже поддерживает `ServiceRequestId`. Не нужна сущность «компьютер» |
| 32 | QC/приёмка | **QC опционален на MVP.** Статус `Assembled` = мастер сам проверил. Полноценный QC = отдельный статус с другим проверяющим — потом | Упрощает жизнь мастеру, не блокирует цикл |

---

## 5. Финальные решения (после обсуждения с заказчиком)

Контекст: **проект — курсач**, но требования высокие из-за ИИ-направления. Цель: спроектировать полный жизненный цикл сборки ПК, впечатляюще, но реализуемо в разумные сроки. Принцип: **максимум переиспользования** существующей инфраструктуры, минимум новых тяжёлых модулей.

### 5.1. Резервирование и работа со складом (вопросы 22, 24)

**Решение: «виртуальный склад» через ServicePart + статусы.** Полноценный WMS (warehouse management) для курсача — оверкилл. Вместо этого:

- При оплате заказа комплектующие **не списываются физически** (в каталоге `Stock` остаётся как есть — для курсача допустимо,假定 склад «по умолчанию» имеет всё).
- В ServiceRequest мастера появляется **список требуемых комплектующих** (расширение `ServicePart` или новая сущность `AssemblyPart`): каждый элемент имеет статус `Required → Collected → Installed`.
- «Заказ товаров мастером» = мастер отмечает в UI «взял со склада» (Collected), потом «установил» (Installed). Это покрывает сценарий «мастер заказывает нужные товары» без реального procurement-модуля.
- **Склад готовых ПК**: лёгкая сущность `AssembledUnit` (Id, ServiceRequestId, PCConfigurationId snapshot, SerialNumber, Status: Stored/Delivered). Когда мастер собирает ПК — создаётся `AssembledUnit` со статусом `Stored`. Доставка меняет статус на `Delivered`. Это даёт «склад» без полноценной WMS.

**Почему так:** курсач не требует реального учёта остатков на складе. Важен **следимый процесс** — видно, что мастер запросил, что получил, что собрал. `AssembledUnit` — это и есть «сданный на склад компьютер», который потом доставляется.

### 5.2. Автоназначение мастера как Kanban (вопрос 25)

**Решение: автоназначение least-loaded + Kanban-доска для координатора.**

- При создании заявки (из оплаченного заказа) система **автоматически назначает мастера** с наименьшей загрузкой (меньше всего активных заявок в статусах Assigned/InProgress), но не превышая лимит 3.
- Если все мастера заняты — заявка остаётся в очереди `Created` (статус «ждёт назначения»).
- **Kanban-доска** для менеджера/координатора: колонки по статусам, карточки-заявки можно перетаскивать (drag-n-drop) между мастерами или статусами. Это впечатляющая фронтенд-фича и удобный визуальный инструмент.
- Сохранить и ручной режим: координатор может переназначить заявку другому мастеру.

### 5.3. Один заказ — N ПК (вопрос 26)

**Решение: 1:N — на каждый ПК в заказе отдельная ServiceRequest.**

- В заказе может быть несколько бандлов сборки (например, клиент покупает 2 собранных ПК).
- При оплате для **каждого бандла** создаётся отдельная `ServiceRequest` типа assembly.
- Автоназначение распределяет их по разным мастерам (или одному, если загрузка позволяет).
- Это чище: один мастер = один ПК = один статус-трек. Параллельная сборка. Заказ остаётся единым на уровне оплаты/доставки.

### 5.4. Отмена и возврат (вопрос 27)

**Решение: поэтапная отмена с дифференцированным возвратом.**

| Статус заявки | Можно отменить? | Возврат | Логика |
|---|---|---|---|
| Created | Да | Полный (включая 100 BYN) | ещё ничего не делали |
| Assigned | Да | Полный | мастер ещё не начал |
| AwaitingParts / PartsReady | Да | Полный | компоненты не установлены, вернуть на «склад» |
| InProgress | Да, но | **Без возврата 100 BYN** (компенсация мастеру за начатую работу), компоненты возвращаются | частичная компенсация |
| Assembled / InWarehouse | Нет | — | товар уже собран, только через рекламацию |
| InDelivery / Delivered | Нет | — | только через возврат товара после получения |

- Отмена до `InProgress` → полный возврат, компоненты «возвращаются на склад» (в курсаче — просто снимаем с заявки).
- Отмена после `InProgress` → клиент теряет 100 BYN (плата за работу мастера), компоненты возвращаются.
- После `Assembled` → отмена невозможна, только рекламация через сервис-центр.

### 5.5. Доставка: простой модуль (вопросы 29, 30, 31)

**Решение: лёгкий собственный модуль доставки, без внешних интеграций.**

- `Pickup` (самовывоз) — **уже есть**, клиент приходит в магазин. Оставляем как есть.
- `Delivery` (курьер) — расширяем: на заказе/заявке появляется поле `CourierId` (Guid?), курьер — это пользователь с новой ролью `Courier` (или менеджер с доп. правами).
- **ПВЗ не строим** — для курсача self-pickup заменяет ПВЗ. Если очень хочется — можно добавить справочник `PickupPoint` (адрес, название), но это опционально.
- Статусы доставки встраиваются в жизненный цикл ServiceRequest: `ReadyForDelivery → InDelivery → Delivered`.
- Курьер видит список заявок к доставке, отмечает «забрал» и «доставил».
- Без внешних интеграций — слишком сложно для курсача, и не в центре внимания.

### 5.6. Финальный жизненный цикл заявки

```
Created              — авто-создана из оплаченного заказа
   │  (автоназначение least-loaded)
Assigned             — мастер назначен
   │
AwaitingParts        — мастер отметил «нужны комплектующие» (ServicePart.Required)
   │
PartsReady           — мастер собрал всё (все ServicePart.Collected)
   │
InProgress           — идёт сборка (ServicePart.Installed)
   │
Assembled            — сборка завершена, создан AssembledUnit (Status=Stored)
   │  (опционально: QC-этап пропускаем, мастер сам проверил)
ReadyForDelivery     — заявка передана в доставку
   │  (курьер: Pickup = клиент приходит; Delivery = курьер назначен)
InDelivery           — курьер забрал / клиент уведомлён
   │
Delivered            — клиент получил
   │
Completed            — финальное закрытие, warranty созданы
```

Отмена: разрешена до `InProgress` (с полным или частичным возвратом по таблице 5.4).

### 5.7. Роли и права (дополнение)

- `Master` — сборка, чат, управление статусами до `Assembled`.
- `Courier` (новая роль) — просмотр заявок в доставке, отметка «забрал/доставил».
- `Manager` — Kanban-доска, переназначение мастеров, отмена после `InProgress`.
- `Client` — просмотр статуса своей заявки, чат с мастером, отмена до `InProgress`.

---

## 6. Предварительный план реализации

### Фаза 1: Модель данных (бэкенд)
1. `OrderItemType` enum (Product, Bundle, Service)
2. `OrderItem` расширить: `OrderItemType`, `PCConfigurationId` (Guid?)
3. Связь `Order ↔ ServiceRequest`: `Order.ServiceRequestIds` или junction `OrderServiceRequest`
4. Расширение `ServiceRequestStatus` (+Assigned, AwaitingParts, PartsReady, Assembled, ReadyForDelivery, InDelivery, Delivered)
5. Расширение валидации переходов статусов
6. `AssemblyPart` (или расширение `ServicePart`): статус Required/Collected/Installed
7. `AssembledUnit`: Id, ServiceRequestId, PCConfigurationId, SerialNumber, Status
8. `ServiceType.BasePrice` = 100 BYN (миграция сидов)
9. Роль `Courier` в `Roles.cs` + `RolePermissions.cs`
10. Телефон в `ServiceRequestDto` + право `ServicesViewPhone`

### Фаза 2: Триггер заказа → заявка (бэкенд)
11. `OrderPaidEvent` публикация (раскомментировать)
12. MassTransit consumer в ServicesService: создаёт ServiceRequest типа assembly
13. Автоназначение least-loaded при создании
14. Маппинг PCConfiguration → AssemblyPart (список комплектующих)

### Фаза 3: API мастера (бэкенд)
15. Endpoints: получить комплектующие заявки, отметить Collected/Installed
16. Endpoint: завершить сборку → создать AssembledUnit
17. Endpoint: передать в доставку
18. Расширение endpoint назначений: автоназначение + ручное переназначение

### Фаза 4: API курьера и доставки (бэкенд)
19. Endpoints курьера: список заявок к доставке, отметить InDelivery/Delivered
20. Расширение Order: `CourierId` (Guid?)

### Фаза 5: Фронтенд — конструктор → корзина
21. В конструкторе: «Добавить в корзину как сборку» — создаёт бандл + услугу 100 BYN
22. Корзина: поддержка `OrderItemType` (отображение бандла как единого элемента)
23. Checkout: передача бандла в CreateOrderRequest

### Фаза 6: Фронтенд — панель мастера
24. Расширение `TicketsPage`/`TicketDetailPage`: список комплектующих с кнопками Collected/Installed
25. Кнопка «Завершить сборку» → создаёт AssembledUnit
26. Кнопка «Передать в доставку»
27. Отображение телефона клиента (с маскированием)
28. Чат с клиентом (переиспользовать существующий)

### Фаза 7: Фронтенд — Kanban-доска координатора
29. Новая страница `/manager/assembly-kanban`
30. Колонки по статусам, drag-n-drop карточек
31. Переназначение мастера через drag

### Фаза 8: Фронтенд — клиент и курьер
32. Клиент: статус-трекинг заявки на сборку в `/account`
33. Курьер: страница `/courier` со списком доставок

### Фаза 9: Гарантия и финал
34. При `Completed`: создать WarrantyCard на каждый компонент + на услугу сборки
35. Связать warranty через ServiceRequestId

---

## 7. Что мне нужно прочитать в проекте (для оценки объёма)

Прежде чем назвать точный объём работ, мне нужно детально изучить:

### Бэкенд
- `src/OrdersService/` — вся структура: `Order.cs`, `OrderItem.cs`, `OrdersService.cs`, `OrdersController.cs`, `CreateOrderRequest.cs`, DbContext, миграции. Как создаются заказы, как оплачиваются, события.
- `src/ServicesService/` — `ServiceRequest.cs`, `ServicesService.cs`, `ServicesController.cs`, `ChatHub.cs`, `TicketMessage.cs`, DbContext, миграции. Как назначаются мастера, валидация статусов.
- `src/SharedKernel/DTOs/` — все DTO, особенно `CreateOrderRequest`, `ServiceRequestDto`, `UpdateServiceRequestRequest`.
- `src/Shared/Authorization/` — `Roles.cs`, `RolePermissions.cs` — чтобы добавить роль Courier и права.
- `src/PCBuilderService/` — `PCBuilderModels.cs` (сущность PCConfiguration), `PCBuilderController.cs` — чтобы понять, какие данные конфигурации передавать в заявку.
- `src/CatalogService/` — `Product.cs`, `CatalogService.cs` (ReserveStockAsync) — для интеграции склада.
- `src/WarrantyService/` — `WarrantyCard.cs`, как создаётся warranty, чтобы переиспользовать логику.
- Масс-транзит/события: `src/OrdersService/` — поиск `OrderPaidEvent`, `OrderPlacedEvent`, как публикуются. `src/ServicesService/` — есть ли consumers.
- Миграции: структура всех DbContext-ов, чтобы понять, как добавлять поля.

### Фронтенд
- `src/frontend/src/api/` — `cartApi`, `ordersApi`, `servicesApi`, `pcbuilder.ts` — как формируются запросы.
- `src/frontend/src/store/` — `cartStore.ts` — структура корзины, как добавить bundle.
- `src/frontend/src/pages/pc-builder-page/PCBuilderPage.tsx` — как добавляется в корзину сейчас.
- `src/frontend/src/pages/master/` — все страницы мастера, чтобы понять, куда встраивать новый UI.
- `src/frontend/src/pages/checkout-page/` — чекаут, как передаётся заказ.
- `src/frontend/src/hooks/useServiceTickets.ts`, `useTicketChat.ts` — переиспользование для сборок.
- `src/frontend/src/components/layout/` — как добавить layout курьера и Kanban-страницу.
- Маршрутизация: где регистрируются routes (найти createBrowserRouter).
- `src/frontend/src/config/` — роль-гварды, как добавляется новая роль.

### Инфраструктура
- `docker/` — compose-файлы, чтобы понять, как поднимаются сервисы (для тестирования).
- `src/Shared/` — shared email, shared utils для переиспользования.
- Тесты: `tests/` — структура, чтобы знать, как писать тесты для новых фич.

---

## 8. Детальный анализ объёма работ

Всё прочитано. Ниже — конкретика по каждому файлу, что менять, сколько строк, какие зависимости. Объём оценён по количеству **изменённых/добавленных строк** в файлах (не включая миграции).

### Общая оценка

| Компонент | Файлов | Строк изменений | Приоритет |
|---|---|---|---|
| Бэкенд: модель данных | 10 | ~250 | 🔴 Критичный |
| Бэкенд: триггер Order→ServiceRequest | 4 | ~200 | 🔴 Критичный |
| Бэкенд: API мастера | 3 | ~250 | 🔴 Критичный |
| Бэкенд: API курьера + доставка | 3 | ~150 | 🟡 Средний |
| Бэкенд: авторизация/роли | 2 | ~40 | 🔴 Критичный |
| Бэкенд: миграции | 2 | ~100 | 🔴 Критичный |
| Фронт: корзина/checkout | 4 | ~200 | 🔴 Критичный |
| Фронт: панель мастера | 3 | ~250 | 🔴 Критичный |
| Фронт: Kanban-доска | 2 | ~300 | 🟡 Средний |
| Фронт: курьер + клиент | 3 | ~250 | 🟡 Средний |
| Фронт: маршрутизация/типы | 3 | ~60 | 🔴 Критичный |
| **ИТОГО** | **~39 файлов** | **~2250** | |

---

### 8.1. Бэкенд: модель данных

#### `SharedKernel/Enums/ServiceRequestStatus.cs`
**Статус:** EXISTS, расширить
**Изменение:** добавить 8 новых значений
```
Submitted=0, InProgress=1, PartsPending=2, ReadyForPickup=3, Completed=4, Cancelled=5
→ Assigned=6, AwaitingParts=7, PartsReady=8, Assembled=9,
  ReadyForDelivery=10, InDelivery=11, Delivered=12
```
**Строк:** ~10

#### `SharedKernel/Enums/OrderItemType.cs` (НОВЫЙ)
**Статус:** NEW
**Содержимое:** `Product=0, PCBundle=1, Service=2`
**Строк:** ~10

#### `SharedKernel/Events/OrderPaidEvent.cs`
**Статус:** EXISTS, расширить
**Изменение:** добавить `Guid? PCConfigurationId`, `int BundleIndex`, `decimal AssemblyFee`
**Строк:** ~5

#### `OrdersService/Entities/OrderItem.cs`
**Статус:** EXISTS, расширить
**Изменение:** добавить `OrderItemType ItemType`, `Guid? PCConfigurationId`, `decimal? AssemblyFee`
**Строк:** ~15

#### `ServicesService/Entities/ServiceRequest.cs`
**Статус:** EXISTS, расширить
**Изменение:** добавить `Guid? OrderId` (связь с заказом), `Guid? PCConfigurationId`, `string? ClientPhone` (снапшот), `Guid? CourierId`
**Строк:** ~15

#### `ServicesService/Entities/AssemblyPart.cs` (НОВЫЙ)
**Статус:** NEW
**Содержимое:** сущность для отслеживания статуса каждой комплектующей
```
Id, ServiceRequestId (FK), ProductId, ProductName, Quantity, UnitPrice,
PartStatus (enum: Required=0, Collected=1, Installed=2)
```
**Строк:** ~25

#### `ServicesService/Entities/AssembledUnit.cs` (НОВЫЙ)
**Статус:** NEW
**Содержимое:** складская единица «Готовый ПК»
```
Id, ServiceRequestId (FK), PCConfigurationId, SerialNumber,
Status (enum: Stored=0, Delivered=1), AssembledAt, DeliveredAt
```
**Строк:** ~20

#### `ServicesService/Entities/AssemblyPartStatus.cs` (НОВЫЙ)
**Статус:** NEW
**Содержимое:** `Required=0, Collected=1, Installed=2`
**Строк:** ~8

#### `ServicesService/Entities/AssembledUnitStatus.cs` (НОВЫЙ)
**Статус:** NEW
**Содержимое:** `Stored=0, Delivered=1`
**Строк:** ~8

#### `OrdersService/Entities/OrderItemConfiguration.cs`
**Статус:** EXISTS (в DbContext), расширить
**Изменение:** конфигурация новых полей `ItemType`, `PCConfigurationId`, `AssemblyFee`
**Строк:** ~10

#### `ServicesService/Data/ServicesDbContext.cs`
**Статус:** EXISTS, расширить
**Изменение:** DbSet для `AssemblyParts`, `AssembledUnits`. Связи каскадное удаление.
**Строк:** ~20

**Итого модель данных: ~136 строк**

---

### 8.2. Бэкенд: триггер Order→ServiceRequest

#### `OrdersService/Services/OrdersService.cs`
**Статус:** EXISTS, доработка
**Изменения:**
1. В `CreateAsync`: раскомментировать публикацию `OrderPlacedEvent` (строка 304-317)
2. В `UpdateStatusAsync` (при Paid): раскомментировать публикацию `OrderPaidEvent` (строка 353-365)
3. В `CreateAsync`: для `OrderItemType.PCBundle` — вычислить `AssemblyFee` (100 BYN), добавить `OrderItem.PCConfigurationId`
4. В `ReleaseOrderStockAsync`: учесть что `PCBundle` items не имеют реального `ProductId` для списания

**Строк:** ~60

#### `ServicesService/Consumers/OrderPaidConsumer.cs` (НОВЫЙ)
**Статус:** NEW
**Логика:**
1. Получает `OrderPaidEvent`
2. Фильтрует items с `ItemType == PCBundle`
3. Для каждого bundle: читает `PCConfiguration` из PCBuilderService (через gRPC или HTTP)
4. Создаёт `ServiceRequest` типа assembly
5. Создаёт `AssemblyPart` для каждой комплектующей из конфигурации
6. Вызывает `AutoAssignMasterAsync` — назначает мастера least-loaded
7. Если мастер не найден — оставляет статус `Created`

**Зависимости:** Needs gRPC/HTTP client к PCBuilderService для чтения конфигурации. PCBuilderService уже имеет gRPC-сервер (`CatalogGrpc`). Нужно либо добавить gRPC-эндпоинт для PCConfiguration, либо использовать HTTP REST (`GET /api/v1/pcbuilder/configurations/{id}`).

**Строк:** ~100

#### `ServicesService/Services/ServicesService.cs`
**Статус:** EXISTS, доработка
**Изменения:**
1. Новый метод `AutoAssignMasterAsync(Guid serviceRequestId)`: ищет Master с min(activeCount), где activeCount = количество заявок в статусах Assigned/InProgress/PartsReady. Если `activeCount < 3` — назначает.
2. Расширить `IsValidStatusTransition()`: добавить переходы для новых статусов
3. Расширить `CreateAsync`: новая перегрузка для системного создания (безClientId, с PCConfigurationId, OrderId)
4. Расширить `UpdateStatusAsync`: обработка `Assembled` → создание `AssembledUnit`

**Строк:** ~120

#### `ServicesService/Controllers/ServicesController.cs`
**Статус:** EXISTS, доработка
**Изменения:**
1. Endpoint `POST /api/v1/services/{id}/parts/{partId}/collect` — отметить комплектующую как Collected
2. Endpoint `POST /api/v1/services/{id}/parts/{partId}/install` — отметить как Installed
3. Endpoint `POST /api/v1/services/{id}/assemble` — завершить сборку (InProgress→Assembled)
4. Endpoint `POST /api/v1/services/{id}/hand-to-delivery` — передать в доставку (Assembled→ReadyForDelivery)
5. Endpoint `POST /api/v1/services/{id}/assign/{masterId}` — расширить для поддержки автоназначения
6. Endpoint `GET /api/v1/services/{id}/assembly-parts` — список комплектующих с их статусами
7. Endpoint `GET /api/v1/services/{id}/assembled-unit` — информация о собранном ПК
8. Маппинг `ClientPhone` в `ServiceRequestDto` (при просмотре assigned master)

**Строк:** ~130

#### `SharedKernel/DTOs/AssemblyPartDto.cs` (НОВЫЙ)
**Статус:** NEW
**Содержимое:** `Id, ProductId, ProductName, Quantity, UnitPrice, PartStatus`

#### `SharedKernel/DTOs/AssembledUnitDto.cs` (НОВЫЙ)
**Статус:** NEW
**Содержимое:** `Id, ServiceRequestId, SerialNumber, Status, AssembledAt, DeliveredAt`

#### `SharedKernel/DTOs/ServiceRequestDto.cs`
**Статус:** EXISTS, расширить
**Изменение:** добавить `Guid? OrderId, Guid? PCConfigurationId, string? ClientPhone, Guid? CourierId, ICollection<AssemblyPartDto> AssemblyParts, AssembledUnitDto? AssembledUnit`

**Строк:** ~20

**Итого триггер: ~430 строк**

---

### 8.3. Бэкенд: авторизация/роли

#### `Shared/Authorization/Roles.cs`
**Статус:** EXISTS, расширить
**Изменение:** `public const string Courier = "Courier";` + добавить в `AllRoles`
**Строк:** ~3

#### `Shared/Authorization/RolePermissions.cs`
**Статус:** EXISTS, расширить
**Изменения:**
- `Courier`: `["ServicesView", "OrdersView"]` (только просмотр заявок для доставки + заказов)
- `Master`: добавить `ServicesManageAssembly` (доступ к новым endpoints сборки)
- `Manager`: добавить `ServicesManageAssembly`, `ServicesAssignMaster` (Kanban)

**Строк:** ~30

#### `AuthService` — миграция для роли
**Статус:** нужно проверить, как роли хранятся в AuthService. Если в БД — нужна миграция/сид.

**Итого роли: ~33 строки**

---

### 8.4. Бэкенд: миграции

#### `OrdersService/Migrations/XXXXXX_AddOrderItemType.cs`
**Содержимое:** ALTER TABLE `order_items` ADD `item_type` int DEFAULT 0, `pc_configuration_id` uuid NULL, `assembly_fee` numeric(12,2) NULL

#### `ServicesService/Migrations/XXXXXX_AddAssemblyEntities.cs`
**Содержимое:** 
- ALTER TABLE `service_requests` ADD `order_id` uuid NULL, `pc_configuration_id` uuid NULL, `client_phone` varchar(20) NULL, `courier_id` uuid NULL
- CREATE TABLE `assembly_parts` (...)
- CREATE TABLE `assembled_units` (...)
- UPDATE `service_types` SET `base_price` = 100 WHERE `slug` = 'assembly'

**Итого миграции: ~100 строк**

---

### 8.5. Фронтенд: корзина/checkout

#### `frontend/src/store/cartStore.ts`
**Статус:** EXISTS, доработка
**Изменения:**
1. Расширить `CartItem`: добавить `itemType?: 'product' | 'pcbundle' | 'service'`, `pcConfigurationId?: string`, `assemblyFee?: number`, `bundleComponents?: CartItem[]`
2. `addItem()`: поддержка нового типа (если itemType === 'pcbundle' — добавлять как один элемент с вложенными компонентами)
3. `getTotal()`: учитывать `assemblyFee`
4. Новый селектор `getBundleItems()`

**Строк:** ~40

#### `frontend/src/features/pc-builder/logic/actions.ts`
**Статус:** EXISTS, доработка
**Изменения:**
1. Новая функция `addToCartAsAssembly(selectedComponents, addItemToCart)`: создаёт bundle-структуру, вызывает `addItem` с типом `pcbundle`
2. Помимо компонентов — добавляет услугу сборки как отдельный line-item

**Строк:** ~35

#### `frontend/src/hooks/usePCBuilder.ts`
**Статус:** EXISTS, доработка
**Изменения:**
1. Новый action `addToCartAsAssembly` — вызывает `addToCartAsAssembly()` из actions
2. Обновить `addToCart` (существующий): оставить как есть для отдельных товаров

**Строк:** ~10

#### `frontend/src/pages/pc-builder-page/PCBuilderPage.tsx`
**Статус:** EXISTS, доработка
**Изменения:**
1. Добавить кнопку «Добавить сборку в корзину» (отдельно от «Добавить комплектующие»)
2. При нажатии — вызов `addToCartAsAssembly`, toast «Сборка добавлена в корзину (+100 BYN за сборку)»
3. Навигация на `/cart`

**Строк:** ~20

#### `frontend/src/pages/checkout-page/CheckoutPage.tsx`
**Статус:** EXISTS, доработка
**Изменения:**
1. При формировании `CreateOrderRequest`: для `pcbundle` items — передавать `ItemType: 'PCBundle'`, `PCConfigurationId`, `AssemblyFee`
2. Отображение bundle-элемента в подтверждении заказа (список компонентов + сборка)

**Строк:** ~30

#### `frontend/src/api/types.ts`
**Статус:** EXISTS, расширить
**Изменения:** добавить типы `CartItemExtended`, `OrderItemType`, `AssemblyPart`, `AssembledUnit`

**Строк:** ~20

**Итого корзина/checkout: ~155 строк**

---

### 8.6. Фронтенд: панель мастера

#### `frontend/src/pages/master/TicketDetailPage.tsx`
**Статус:** EXISTS, доработка
**Изменения:**
1. Секция «Конфигурация ПК»: если заявка assembly — показать список компонентов (CPU, GPU, RAM и т.д.) из `AssemblyParts`
2. Секция «Комплектующие»: список `AssemblyPart` с кнопками:
   - `Required` → кнопка «Забрал со склада» → `Collected`
   - `Collected` → кнопка «Установил» → `Installed`
3. Кнопки статусов — расширить для новых переходов:
   - `Assigned` → кнопка «Начать сборку» → `InProgress`
   - `InProgress` → кнопка «Собрал» → `Assembled`
   - `Assembled` → кнопка «Передать в доставку» → `ReadyForDelivery`
4. Секция «Телефон клиента»: показать `ClientPhone` (маскированный)
5. При завершении сборки — показать `AssembledUnit` (серийный номер)

**Строк:** ~200

#### `frontend/src/pages/master/TicketsPage.tsx`
**Статус:** EXISTS, доработка
**Изменения:**
1. Расширить `QuickStatusButton`: новые переходы для assembly-заявок
2. Фильтр по типу заявки (assembly / service-ремонт)
3. Индикатор сборки: показать прогресс (сколько компонентов установлено)

**Строк:** ~50

#### `frontend/src/pages/master/AvailableTicketsPage.tsx`
**Статус:** EXISTS, доработка
**Изменения:** минимальные — автоназначение делается на бэкенде, UI может не меняться (оставить self-assign кнопку как fallback)

**Строк:** ~10

#### `frontend/src/hooks/useServiceTickets.ts`
**Статус:** EXISTS, расширить
**Изменения:** добавить `getAssemblyParts(serviceId)`, `collectPart(serviceId, partId)`, `installPart(serviceId, partId)`, `assemblePc(serviceId)`, `handToDelivery(serviceId)`

**Строк:** ~30

#### `frontend/src/api/services.ts`
**Статус:** EXISTS, расширить
**Изменения:** добавить API-клиенты для новых endpoints (assembly parts, collect, install, assemble, hand-to-delivery, assembled-unit)

**Строк:** ~50

**Итого панель мастера: ~340 строк**

---

### 8.7. Фронтенд: Kanban-доска координатора

#### `frontend/src/pages/manager/AssemblyKanbanPage.tsx` (НОВЫЙ)
**Статус:** NEW
**Содержимое:** полная Kanban-доска
- Колонки: Created → Assigned → AwaitingParts → PartsReady → InProgress → Assembled → ReadyForDelivery → InDelivery → Delivered → Completed
- Карточки: ID заявки, имя клиента, мастер, компоненты (кратко), дата создания
- Drag-n-drop: библиотека `@dnd-kit/core` (легковесная) или `react-beautiful-dnd` (deprecated, но работает)
- При drag карточки между мастерами — вызов `assignMaster` API
- При drag между статусами — вызов `updateStatus` API (только допустимые переходы)

**Строк:** ~300

#### `frontend/src/components/layout/manager-layout/ManagerLayout.tsx`
**Статус:** EXISTS (предполагаю), расширить
**Изменение:** добавить nav-item «Сборка ПК» → `/manager/assembly-kanban`

**Строк:** ~5

**Итого Kanban: ~305 строк**

---

### 8.8. Фронтенд: курьер + клиент

#### `frontend/src/pages/courier/CourierDeliveriesPage.tsx` (НОВЫЙ)
**Статус:** NEW
**Содержимое:**
- Список заявок в статусе `ReadyForDelivery` / `InDelivery` назначенному курьеру
- Карточки с: номер заявки, адрес клиента, телефон, список ПК (номера серийников)
- Кнопки: «Забрал» (ReadyForDelivery → InDelivery), «Доставлен» (InDelivery → Delivered)
- Простая карточная раскладка

**Строк:** ~180

#### `frontend/src/components/layout/courier-layout/CourierLayout.tsx` (НОВЫЙ)
**Статус:** NEW
**Содержимое:** Layout по аналогии с `MasterLayout.tsx` — sidebar + Outlet. Nav: «Мои доставки».

**Строк:** ~50

#### `frontend/src/components/layout/courier-layout/CourierDeliveriesPage.tsx` — уже описан выше

#### `frontend/src/pages/account/AccountAssemblyTracking.tsx` (НОВЫЙ)
**Статус:** NEW
**Содержимое:** для клиента — страница трекинга заявки на сборку
- Статус-бар (stepper): Created → Assigned → InProgress → Assembled → ReadyForDelivery → Delivered
- Информация: что собрано, какой мастер,预期ная дата
- Кнопка «Отменить заявку» (до InProgress)
- Ссылка на чат с мастером

**Строк:** ~150

#### `frontend/src/api/courier.ts` (НОВЫЙ)
**Статус:** NEW
**Содержимое:** API-клиент для курьера: `getMyDeliveries()`, `markAsPickedUp(id)`, `markAsDelivered(id)`

**Строк:** ~30

**Итого курьер+клиент: ~410 строк**

---

### 8.9. Фронтенд: маршрутизация и типы

#### `frontend/src/App.tsx`
**Статус:** EXISTS, доработка
**Изменения:**
1. Добавить route `/courier` → `RoleGuard(['Courier'])` → `CourierLayout` → `CourierDeliveriesPage`
2. Добавить route `/manager/assembly-kanban` в секцию Manager
3. Добавить route `/account/assembly-tracking` в секцию Account

**Строк:** ~20

#### `frontend/src/api/types.ts`
**Статус:** EXISTS, расширить
**Изменения:** новые типы (см. п.8.5)

#### `frontend/src/types/user.ts` или аналог
**Статус:** EXISTS, расширить
**Изменение:** добавить `'Courier'` в union-тип ролей

**Строк:** ~5

**Итого маршрутизация: ~25 строк**

---

### 8.10. Инфраструктура и сиды

#### `ServicesService/Migrations/...SeedAssemblyPrice.cs`
**Содержимое:** UPDATE `service_types` SET `base_price` = 100 WHERE `slug` = 'assembly'

#### `AuthService` — сид роли Courier
**Содержимое:** INSERT роли 'Courier' (если роли хранятся в БД)

---

## 9. Зависимости и порядок реализации

```
Фаза 1: Модель данных + миграции
  ├── SharedKernel enums (ServiceRequestStatus, OrderItemType)
  ├── OrderItem расширение
  ├── ServiceRequest расширение
  ├── AssemblyPart + AssembledUnit (новые сущности)
  ├── Roles + RolePermissions
  └── Миграции (OrdersService, ServicesService)

Фаза 2: Триггер (бэкенд)
  ├── OrderPaidEvent расширение
  ├── OrderPaidConsumer (ServicesService) — ЖДЁТ Phase 1
  ├── OrderPaidEvent раскомментирование (OrdersService)
  ├── AutoAssignMasterAsync (ServicesService)
  └── Расширение валидации статусов

Фаза 3: API мастера (бэкенд) — ЖДЁТ Phase 1-2
  ├── Endpoints комплектующих (collect/install)
  ├── Endpoints сборки (assemble, hand-to-delivery)
  ├── AssembledUnit создание
  └── Маппинг ClientPhone в DTO

Фаза 4: Корзина (фронтенд) — ЖДЁТ Phase 1
  ├── CartItem расширение
  ├── addToCartAsAssembly action
  ├── CheckoutPage доработка
  └── PCBuilderPage: кнопка «Добавить сборку»

Фаза 5: Панель мастера (фронтенд) — ЖДЁТ Phase 3
  ├── TicketDetailPage: assembly UI
  ├── TicketsPage: расширение
  └── API-клиенты новых endpoints

Фаза 6: Kanban + курьер + клиент (фронтенд) — ЖДЁТ Phase 3
  ├── AssemblyKanbanPage
  ├── CourierDeliveriesPage + CourierLayout
  ├── AccountAssemblyTracking
  └── App.tsx маршруты

Фаза 7: Гарантия и финал
  └── При Completed: создание WarrantyCard (расширение OrderPaidConsumer)
```

**Критический путь:** Фаза 1 → Фаза 2 → Фаза 3 → Фаза 5 (панель мастера — главная фича).

**Оценка времени (условные единицы):**
- Фаза 1: ~2-3 часа
- Фаза 2: ~3-4 часа
- Фаза 3: ~3-4 часа
- Фаза 4: ~2-3 часа
- Фаза 5: ~3-4 часа
- Фаза 6: ~4-5 часов (Kanban — сложный UI)
- Фаза 7: ~1 час
- **Итого: ~18-24 часа чистой работы**

---

## 10. Риски и открытые вопросы

1. **gRPC-клиент к PCBuilderService** — нужно ли добавлять gRPC-эндпоинт в PCBuilderService для чтения конфигурации в `OrderPaidConsumer`? Или использовать HTTP REST (проще, но менее elegant)?
2. **Docker-compose** — нужно ли добавлять ServicesService в `docker-compose.yml` (сейчас он в dev на порту 5003)?
3. **@dnd-kit** — Kanban требует drag-n-drop библиотеку. Нужно проверить, установлена ли она, или добавить зависимость.
4. **Типы в cartStore** — `CartItem` используется во многих местах. Расширение типа может вызвать ошибки компиляции в других компонентах. Нужен careful refactoring.
5. **Сид роли Courier** — если роли хранятся в БД AuthService (а не в Keycloak/config), нужна отдельная миграция/сид.
6. **OrderHistory** — при отмене assembly-заявки нужно ли обновлять и `OrdersService.OrderHistory`? Вероятно, да.

---

## 11. Следующий шаг

После твоего подтверждения документа — **приступаю к Фазе 1** (модель данных + миграции). Начну с SharedKernel enums → OrderItem → ServiceRequest → новые сущности → Roles → миграции.
