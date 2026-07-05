import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  Package,
  Truck,
  Home,
  CreditCard,
  Clock,
  ShoppingBag,
  MapPin,
  PartyPopper,
} from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/api/orders';

/* */
/*  Framer Motion variants                                             */
/* */

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.3 },
  animate: { opacity: 1, scale: 1 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.12 },
  },
};

/* */
/*  Timeline steps                                                     */
/* */

const TIMELINE_STEPS = [
  { key: 'created', label: 'Создан', icon: Package },
  { key: 'processing', label: 'Обработка', icon: Clock },
  { key: 'shipping', label: 'Доставка', icon: Truck },
  { key: 'delivered', label: 'Получен', icon: Home },
] as const;

function getStepIndex(status: unknown): number {
  const s = String(status ?? '').toLowerCase();
  if (s.includes('deliver') || s.includes('received') || s.includes('complete')) return 3;
  if (s.includes('ship') || s.includes('transit') || s.includes('courier')) return 2;
  if (s.includes('process') || s.includes('confirm') || s.includes('paid')) return 1;
  return 0;
}

/* */
/*  Format helpers                                                     */
/* */

function formatPrice(n: number): string {
  return n.toLocaleString('ru-RU', { style: 'currency', currency: 'BYN', maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* */
/*  Confetti particles (pure CSS, gold themed)                         */
/* */

function ConfettiParticles() {
  const particles = Array.from({ length: 28 }, (_, i) => i);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const duration = 2.5 + Math.random() * 2;
        const size = 4 + Math.random() * 6;
        const drift = -40 + Math.random() * 80;
        const rotate = Math.random() * 360;

        return (
          <span
            key={i}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              background: i % 3 === 0 ? '#FCD535' : i % 3 === 1 ? '#f0b90b' : '#d4a574',
              opacity: 0,
              animation: `confetti-fall ${duration}s ${delay}s ease-out forwards`,
              ['--drift' as string]: `${drift}px`,
              ['--rotate' as string]: `${rotate}deg`,
            }}
          />
        );
      })}
    </div>
  );
}

/* */
/*  Main Компонент                                                     */
/* */

export function OrderSuccessPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { getOrderByNumber } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orderNumber) {
      getOrderByNumber(orderNumber)
        .then((result) => result && setOrder(result))
        .catch(() => {});
    }
  }, [orderNumber, getOrderByNumber]);

  const activeStep = order ? getStepIndex(order.status) : 0;

  return (
    <>
      {/* Confetti keyframes — injected once */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(calc(100vh * 0.6)) translateX(var(--drift)) rotate(var(--rotate));
          }
        }
      `}</style>

      <div className="min-h-[calc(100vh-200px)] bg-background pt-5 pb-12 text-foreground">
        <div className="w-full max-w-[var(--layout-page-wide)] mx-auto px-[var(--layout-page-pad-x)]">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="text-muted-foreground no-underline transition-colors hover:text-gold">
              Главная
            </Link>
            <span>/</span>
            <Link to="/catalog" className="text-muted-foreground no-underline transition-colors hover:text-gold">
              Каталог
            </Link>
            <span>/</span>
            <span className="text-foreground">Заказ оформлен</span>
          </nav>

          {/* ---- Hero card ---- */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="flex flex-col gap-7 max-w-[720px] mx-auto"
          >
            {/* Success header with confetti */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="relative flex flex-col items-center gap-5 p-10 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
            >
              <ConfettiParticles />

              {/* Animated checkmark */}
              <motion.div
                variants={scaleIn}
                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.2 }}
                className="relative z-10"
              >
                <div className="w-[80px] h-[80px] rounded-full bg-gold/10 border-2 border-gold/30 inline-flex items-center justify-center shadow-[0_0_30px_rgba(252,213,53,0.15)]">
                  <motion.div
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <Check size={36} className="text-gold" strokeWidth={2.5} />
                  </motion.div>
                </div>
              </motion.div>

              <div className="relative z-10 text-center">
                <h1 className="m-0 mb-2 text-[var(--text-display-md)] font-bold text-foreground">
                  Заказ оформлен!
                </h1>
                <p className="m-0 text-muted-foreground text-[var(--text-body-md)] leading-relaxed">
                  Спасибо за покупку! Мы уже начали обработку вашего заказа.
                </p>
              </div>

              {/* Order number badge */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="relative z-10 flex items-center gap-3 px-5 py-3 bg-elevated border border-border rounded-lg"
              >
                <span className="text-muted-foreground text-sm">Номер заказа</span>
                <span className="font-mono text-gold font-bold text-sm px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/20">
                  #{order?.orderNumber || orderNumber}
                </span>
                {order && (
                  <span className="text-muted-text text-xs">
                    от {formatDate(order.createdAt)}
                  </span>
                )}
              </motion.div>
            </motion.div>

            {/* ---- Timeline ---- */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 bg-card border border-border rounded-xl shadow-lg"
            >
              <h2 className="m-0 mb-5 text-[var(--text-title-lg)] font-semibold text-foreground">
                Статус заказа
              </h2>
              <div className="flex items-center justify-between relative">
                {/* Connector line */}
                <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-border" />
                <div
                  className="absolute top-5 left-[10%] h-0.5 bg-gold transition-all duration-700"
                  style={{ width: `${(activeStep / (TIMELINE_STEPS.length - 1)) * 80}%` }}
                />

                {TIMELINE_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = idx <= activeStep;
                  const isCurrent = idx === activeStep;

                  return (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="relative z-10 flex flex-col items-center gap-2 flex-1"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCurrent
                            ? 'bg-gold border-gold text-gold-ink shadow-[0_0_16px_rgba(252,213,53,0.3)]'
                            : isActive
                              ? 'bg-gold/15 border-gold/40 text-gold'
                              : 'bg-surface-elevated border-border text-muted-foreground'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <span
                        className={`text-xs font-medium text-center ${
                          isActive ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* ---- Order Summary ---- */}
            {order && order.items.length > 0 && (
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="p-6 bg-card border border-border rounded-xl shadow-lg"
              >
                <h2 className="m-0 mb-4 text-[var(--text-title-lg)] font-semibold text-foreground">
                  Состав заказа
                </h2>

                {/* Items */}
                <div className="flex flex-col gap-0 divide-y divide-border">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="m-0 text-sm font-medium text-foreground truncate">
                          {item.productName}
                        </p>
                        <p className="m-0 text-xs text-muted-foreground mt-0.5">
                          {item.quantity} шт. × {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gold whitespace-nowrap">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Товары</span>
                    <span className="text-foreground">{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Доставка</span>
                    <span className="text-foreground">
                      {order.deliveryCost > 0 ? formatPrice(order.deliveryCost) : 'Бесплатно'}
                    </span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Скидка</span>
                      <span className="text-price-drop">−{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold mt-1 pt-2 border-t border-border">
                    <span className="text-foreground">Итого</span>
                    <span className="text-gold">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ---- Delivery & payment info ---- */}
            {order && (
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {/* Delivery */}
                <div className="p-5 bg-card border border-border rounded-xl shadow-lg">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Truck size={18} className="text-gold" />
                    <h3 className="m-0 text-sm font-semibold text-foreground">Доставка</h3>
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">
                      {order.deliveryMethod === 'Pickup' ? 'Самовывоз' : 'Курьером'}
                    </span>
                    {order.address && (
                      <span className="flex items-center gap-1.5 text-foreground">
                        <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
                        {order.address}
                      </span>
                    )}
                    {order.deliveryDate && (
                      <span className="text-muted-foreground">
                        {order.deliveryDate}
                        {order.deliveryTimeSlot ? `, ${order.deliveryTimeSlot}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Payment */}
                <div className="p-5 bg-card border border-border rounded-xl shadow-lg">
                  <div className="flex items-center gap-2.5 mb-3">
                    <CreditCard size={18} className="text-gold" />
                    <h3 className="m-0 text-sm font-semibold text-foreground">Оплата</h3>
                  </div>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground">
                      {order.paymentMethod === 'Online' ? 'Онлайн на сайте' : 'При получении'}
                    </span>
                    {order.customerEmail && (
                      <span className="text-foreground">{order.customerEmail}</span>
                    )}
                    {order.customerPhone && (
                      <span className="text-foreground">{order.customerPhone}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ---- CTA Buttons ---- */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              {orderNumber && (
                <Link to={`/orders/${orderNumber}/tracking`} className="flex-1">
                  <Button variant="primary" size="lg" fullWidth leftIcon={<Package size={18} />}>
                    Отследить заказ
                  </Button>
                </Link>
              )}
              <Link to="/catalog" className="flex-1">
                <Button variant="secondary" size="lg" fullWidth leftIcon={<ShoppingBag size={18} />}>
                  Продолжить покупки
                </Button>
              </Link>
            </motion.div>

            {/* ---- Reassurance ---- */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5, delay: 0.65 }}
              className="text-center text-xs text-muted-foreground pb-4"
            >
              <p className="m-0">
                Подтверждение отправлено на{' '}
                <span className="text-foreground font-medium">{order?.customerEmail || 'вашу почту'}</span>.
               {' '}
                Если у вас есть вопросы, свяжитесь с нами по телефону.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
