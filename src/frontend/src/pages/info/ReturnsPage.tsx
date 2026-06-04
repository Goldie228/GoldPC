import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, FileText, PackageCheck, RefreshCw, MessageCircle, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const conditions = [
  {
    title: 'Срок возврата',
    description: 'Возврат товара возможен в течение 14 дней с момента покупки, если товар не был в употреблении.',
    icon: Clock,
  },
  {
    title: 'Сохранность товара',
    description: 'Товар должен быть в полной комплектации, с сохранением товарного вида и потребительских свойств.',
    icon: PackageCheck,
  },
  {
    title: 'Документы',
    description: 'Необходимо предоставить кассовый чек или товарную накладную, подтверждающие покупку.',
    icon: FileText,
  },
  {
    title: 'Законодательство',
    description: 'Возврат и обмен осуществляется в соответствии с законодательством Республики Беларусь.',
    icon: AlertTriangle,
  },
];

const steps = [
  {
    title: 'Свяжитесь с поддержкой',
    description: 'Опишите причину возврата или обмена. Наш менеджер проконсультирует вас по дальнейшим действиям.',
    icon: MessageCircle,
  },
  {
    title: 'Подготовьте товар',
    description: 'Упакуйте товар в полной комплектации со всеми документами и аксессуарами.',
    icon: PackageCheck,
  },
  {
    title: 'Передайте товар',
    description: 'Привезите товар в магазин или передайте курьеру. Мы проверим состояние и комплектацию.',
    icon: RefreshCw,
  },
  {
    title: 'Получите решение',
    description: 'После проверки мы оформим возврат средств или обмен на другой товар.',
    icon: CheckCircle,
  },
];

function Clock({ size, className }: { size?: number; className?: string }) {
  const s = size ?? 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function ReturnsPage(): ReactElement {
  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
        <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
        <span className="text-muted-text">/</span>
        <span className="text-body-text">Возврат и обмен</span>
      </nav>

        {/* Hero */}
        <section className="mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-body-text mb-4 tracking-[-0.02em]">
            Возврат и обмен
          </h1>
          <p className="text-lg text-muted-text max-w-[600px] leading-relaxed">
            Мы делаем возврат и обмен максимально простыми и прозрачными для наших клиентов.
          </p>
        </section>

        {/* Conditions */}
        <section className="mb-16">
          <h2 className="text-xl md:text-2xl font-semibold text-body-text mb-8 flex items-center gap-3">
            <RotateCcw size={24} className="text-gold" />
            Условия возврата
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {conditions.map((condition) => {
              const Icon = condition.icon;
              return (
                <article
                  key={condition.title}
                  className="bg-surface-card rounded-xl border border-hairline-dark p-6 flex items-start gap-4"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-gold/10 text-gold rounded-lg shrink-0 mt-0.5">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-body-text mb-1">{condition.title}</h3>
                    <p className="text-sm text-muted-text leading-relaxed">{condition.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Procedure */}
        <section>
          <h2 className="text-xl md:text-2xl font-semibold text-body-text mb-8 flex items-center gap-3">
            <RefreshCw size={24} className="text-gold" />
            Порядок действий
          </h2>
          <div className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold text-gold-ink text-sm font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-body-text font-semibold text-sm mb-1 flex items-center gap-2">
                        <Icon size={16} className="text-gold" />
                        {step.title}
                      </h4>
                      <p className="text-muted-text text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

{/* Help links */}
        <section className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/faq"
            className="inline-flex items-center gap-2 px-5 py-3 bg-surface-card border border-hairline-dark rounded-lg text-sm text-body-text hover:text-gold hover:border-gold/30 transition-colors"
          >
            Частые вопросы
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/contacts"
            className="inline-flex items-center gap-2 px-5 py-3 bg-surface-card border border-hairline-dark rounded-lg text-sm text-body-text hover:text-gold hover:border-gold/30 transition-colors"
          >
            Связаться с поддержкой
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    );
  }
