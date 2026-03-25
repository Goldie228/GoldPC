import { useCallback, useEffect, useId, useMemo, useState, type ReactElement } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import styles from './FaqPage.module.css';

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
    <main className={styles.page}>
      <h1 className={styles.title}>FAQ</h1>
      <p className={styles.lead}>
        Ответы на частые вопросы. Ссылку на конкретный вопрос можно скопировать из адресной строки
        после выбора пункта.
      </p>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toolbarBtn}
          onClick={allExpanded ? collapseAll : expandAll}
          aria-pressed={allExpanded}
        >
          {allExpanded ? 'Свернуть все' : 'Развернуть все'}
        </button>
      </div>

      <div className={styles.list}>
        {FAQ_ITEMS.map((item) => {
          const panelId = `${baseId}-${item.id}-panel`;
          const headerId = `${baseId}-${item.id}-header`;
          const expanded = openIds.has(item.id);
          return (
            <section key={item.id} id={item.id} className={styles.item} aria-labelledby={headerId}>
              <h2 className={styles.questionHeading}>
                <button
                  type="button"
                  id={headerId}
                  className={styles.trigger}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggle(item.id)}
                >
                  <span className={styles.triggerLabel}>{item.question}</span>
                  <ChevronDown
                    size={20}
                    className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
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
                className={`${styles.panelWrap} ${expanded ? styles.panelWrapOpen : ''}`}
              >
                <div className={styles.panelInner}>
                  <p className={styles.answer}>{item.answer}</p>
                  <p className={styles.permalink}>
                    <a href={`/faq#${item.id}`} className={styles.permalinkLink}>
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
