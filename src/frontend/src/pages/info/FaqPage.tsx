import { useCallback, useEffect, useId, useMemo, useState, type ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
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
      'Обычно менеджер подтверждает заказ в течение 15–30 минут в рабочее время.',
  },
  {
    id: 'order-change',
    question: 'Можно ли изменить состав заказа после оформления?',
    answer: 'Да, до передачи в доставку заказ можно скорректировать через поддержку.',
  },
  {
    id: 'compatibility',
    question: 'Есть ли проверка совместимости комплектующих?',
    answer:
      'Да, в конструкторе ПК выполняется автоматическая проверка совместимости компонентов.',
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
    <main className="min-h-screen bg-canvas-dark">
      <h1 className="text-3xl md:text-4xl font-bold text-body-text mb-6">FAQ</h1>
      <p className="text-lg text-muted-text max-w-3xl mb-8">
        Ответы на частые вопросы. Ссылку на конкретный вопрос можно скопировать из адресной строки
        после выбора пункта.
      </p>

      <div className="mb-6">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-hairline-dark bg-surface-elevated hover:bg-surface-card transition-colors"
          onClick={allExpanded ? collapseAll : expandAll}
          aria-pressed={allExpanded}
        >
          {allExpanded ? 'Свернуть все' : 'Развернуть все'}
        </button>
      </div>

      <div className="space-y-4">
        {FAQ_ITEMS.map((item) => {
          const panelId = `${baseId}-${item.id}-panel`;
          const headerId = `${baseId}-${item.id}-header`;
          const expanded = openIds.has(item.id);
          return (
            <section key={item.id} id={item.id} className="bg-surface-card rounded-xl border border-hairline-dark" aria-labelledby={headerId}>
              <h2 className="text-lg font-semibold text-body-text">
                <button
                  type="button"
                  id={headerId}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-elevated transition-colors rounded-xl"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggle(item.id)}
                >
                  <span className="text-body-text">{item.question}</span>
                  <ChevronDown
                    size={20}
                    className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
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
                className={`overflow-hidden transition-all ${expanded ? 'max-h-screen' : 'max-h-0'}`}
              >
                <div className="px-5 pb-5">
                  <p className="text-body-text mb-4">{item.answer}</p>
                  <p className="text-sm text-muted-text">
                    <a href={`#${item.id}`} className="text-gold hover:text-gold-active transition-colors">
                      Ссылка на этот вопрос
                    </a>
                  </p>
                </div>
              </div>
            </section>
 );

        })}
      </div>
    </main>
  );
}
