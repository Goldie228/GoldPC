import { useCallback, useEffect, useId, useMemo, useState, type ReactElement } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'order-confirm',
    question: 'Как быстро подтверждается заказ?',
    answer:
      'Обычно менеджер подтверждает заказ в течение 15–30 минут в рабочее время. После подтверждения вы получите уведомление на email и в личном кабинете.',
  },
  {
    id: 'order-change',
    question: 'Можно ли изменить состав заказа после оформления?',
    answer: 'Да, до передачи в доставку заказ можно скорректировать через поддержку. Свяжитесь с нами по телефону или email, и мы внесём необходимые изменения.',
  },
  {
    id: 'compatibility',
    question: 'Есть ли проверка совместимости комплектующих?',
    answer:
      'Да, в конструкторе ПК выполняется автоматическая проверка совместимости компонентов. Система предупредит вас, если выбранные детали несовместимы друг с другом.',
  },
  {
    id: 'warranty-service',
    question: 'Как воспользоваться гарантийным обслуживанием?',
    answer:
      'Для гарантийного обслуживания необходимо предоставить товар, гарантийный талон и документ о покупке в наш сервисный центр по адресу: Минск, Улица Казимировская 21. Срок диагностики — до 14 дней.',
  },
  {
    id: 'payment-methods',
    question: 'Какие способы оплаты доступны?',
    answer:
      'Мы принимаем онлайн-оплату банковскими картами (Visa, Mastercard, МИР), наличные и карты при получении, а также оплату через ЕРИП для заказов по Беларуси.',
  },
  {
    id: 'delivery-terms',
    question: 'Какие сроки доставки?',
    answer:
      'По Минску — доставка курьером в день заказа или на следующий день. По Беларуси — 1–3 рабочих дня. Самовывоз из магазина — в день подтверждения заказа.',
  },
  {
    id: 'return-policy',
    question: 'Как вернуть товар?',
    answer:
      'Возврат возможен в течение 14 дней с момента покупки при условии сохранения товарного вида и комплектации. Свяжитесь с поддержкой для оформления возврата.',
  },
  {
    id: 'pc-build-time',
    question: 'Сколько времени занимает сборка ПК?',
    answer:
      'Стандартная сборка ПК занимает 1–2 рабочих дня. Сложные конфигурации с кабель-менеджментом и настройкой BIOS могут потребовать до 3–4 дней.',
  },
  {
    id: 'diagnostics-free',
    question: 'Диагностика платная или бесплатная?',
    answer:
      'Диагностика проводится бесплатно при условии последующего ремонта в нашем сервисном центре. Если вы решите отказаться от ремонта, стоимость диагностики составит 20 BYN.',
  },
  {
    id: 'pickup-address',
    question: 'Где находится магазин GoldPC?',
    answer:
      'Наш магазин и сервисный центр находятся по адресу: Минск, Улица Казимировская 21. Режим работы: ежедневно с 10:00 до 20:00.',
  },
];

export function FaqPage(): ReactElement {
  const baseId = useId();
  const location = useLocation();
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const allExpanded = useMemo(
    () => openIds.size === FAQ_ITEMS.length && FAQ_ITEMS.length > 0,
    [openIds]
  );

  const expandAll = useCallback(() => {
    setOpenIds(new Set(FAQ_ITEMS.map((i) => i.id)));
  }, []);

  const collapseAll = useCallback(() => {
    setOpenIds(new Set());
  }, []);

  const toggle = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Якорь из URL: /faq#order-confirm — раскрыть и прокрутить к вопросу
  useEffect(() => {
    const hash = location.hash.replace(/^#/, '');
    if (!hash) return;
    const exists = FAQ_ITEMS.some((i) => i.id === hash);
    if (!exists) return;
    setOpenIds((prev) => new Set(prev).add(hash));
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash]);

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 pt-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
        <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
        <span className="text-muted-text">/</span>
        <span className="text-body-text">FAQ</span>
      </nav>

        {/* Hero */}
        <section className="mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-body-text mb-4 tracking-[-0.02em]">
            FAQ
          </h1>
          <p className="text-lg text-muted-text leading-relaxed max-w-[600px]">
            Ответы на самые частые вопросы о нашем магазине, доставке, оплате и сервисном обслуживании.
          </p>
        </section>

        {/* Toggle All */}
        <div className="mb-8">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-hairline-dark bg-surface-card text-body-text hover:bg-surface-elevated transition-colors"
            onClick={allExpanded ? collapseAll : expandAll}
            aria-pressed={allExpanded}
          >
            {allExpanded ? 'Свернуть все' : 'Развернуть все'}
          </button>
        </div>

        {/* FAQ Items */}
        <div className="divide-y divide-hairline-dark">
          {FAQ_ITEMS.map((item) => {
            const panelId = `${baseId}-${item.id}-panel`;
            const headerId = `${baseId}-${item.id}-header`;
            const expanded = openIds.has(item.id);
            return (
              <section
                key={item.id}
                id={item.id}
                className="py-5"
                aria-labelledby={headerId}
              >
                <h2 className="text-base font-semibold text-body-text">
                  <button
                    type="button"
                    id={headerId}
                    className="w-full flex items-center justify-between text-left hover:text-gold transition-colors"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => toggle(item.id)}
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      size={18}
                      className={`text-muted-text transition-transform duration-200 shrink-0 ml-4 ${
                        expanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                  </button>
                </h2>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  aria-hidden={!expanded}
                  inert={!expanded ? true : undefined}
                  className={`overflow-hidden transition-all duration-200 ${
                    expanded ? 'max-h-screen' : 'max-h-0'
                  }`}
                >
                  <div className="pt-4">
                    <p className="text-muted-text text-sm leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    );
  }
