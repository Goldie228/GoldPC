/**
 * AboutPage - Страница "О нас"
 * Информация о компании GoldPC
 */
import { motion } from 'framer-motion';
import {
  Award,
  Users,
  Clock,
  Shield,
  MapPin,
  Phone,
  Mail,
  Cpu,
  Heart,
  Target,
} from 'lucide-react';
// Статистика компании
const stats = [
  { id: 1, value: '10+', label: 'лет на рынке', icon: Clock },
  { id: 2, value: '15 000+', label: 'довольных клиентов', icon: Users },
  { id: 3, value: '50 000+', label: 'собранных ПК', icon: Cpu },
  { id: 4, value: '12', label: 'месяцев гарантии', icon: Shield },
];

// Преимущества
const advantages = [
  {
    id: 1,
    title: 'Качественные комплектующие',
    description:
      'Работаем только с проверенными поставщиками и официальными дистрибьюторами',
    icon: Award,
  },
  {
    id: 2,
    title: 'Экспертная сборка',
    description:
      'Наши специалисты имеют сертификаты от ведущих производителей и многолетний опыт',
    icon: Cpu,
  },
  {
    id: 3,
    title: 'Индивидуальный подход',
    description:
      'Поможем подобрать конфигурацию под ваши задачи и бюджет',
    icon: Target,
  },
  {
    id: 4,
    title: 'Честность и прозрачность',
    description:
      'Фиксированные цены, полная информация о комплектующих, никаких скрытых платежей',
    icon: Heart,
  },
];

// Контактная информация
const contacts = [
  { id: 1, label: 'Адрес', value: 'г. Минск, ул. Примерная, 123', icon: MapPin },
  { id: 2, label: 'Телефон', value: '+375 (29) 123-45-67', icon: Phone },
  { id: 3, label: 'Email', value: 'info@goldpc.by', icon: Mail },
];

// Анимации
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.33, 1, 0.68, 1] as const,
    },
  },
};

export function AboutPage() {
  return (
    <div className="min-h-screen bg-canvas-dark">
      {/* Hero Section */}
      <motion.header
        className="pt-32 pb-20 px-4 md:px-8 max-w-[1440px] mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-body-text mb-6">
          О компании <span className="text-gold">GoldPC</span>
        </h1>
        <p className="text-lg text-muted-text max-w-3xl">
          Мы создаём компьютеры мечты с 2014 года. От геймерских монстров до рабочих станций
          профессионалов — каждая сборка выполнена с любовью к деталям.
        </p>
      </motion.header>

      {/* Stats Section */}
      <motion.section
        className="py-20 px-4 md:px-8 max-w-[1440px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <motion.div key={stat.id} className="p-6 bg-surface-card rounded-xl border border-hairline-dark flex flex-col items-center text-center" variants={itemVariants}>
                <div className="w-12 h-12 flex items-center justify-center bg-gold/10 text-gold rounded-lg mb-4">
                  <IconComponent size={24} />
                </div>
                <div className="text-2xl font-bold text-gold mb-2">{stat.value}</div>
                <div className="text-sm text-muted-text">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Mission Section */}
      <motion.section
        className="py-20 px-4 md:px-8 max-w-[1440px] mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-body-text mb-8">Наша миссия</h2>
          <p className="text-lg text-muted-text mb-4">
            Мы верим, что каждый заслуживает компьютер, который идеально соответствует его
            потребностям. Наша миссия — сделать высокопроизводительные компьютеры доступными
            и понятными для каждого клиента.
          </p>
          <p className="text-lg text-muted-text mb-4">
            Команда GoldPC объединяет энтузиастов, которые сами увлечены технологиями.
            Мы не просто продаём комплектующие — мы помогаем воплотить ваши идеи в реальность.
          </p>
        </div>
      </motion.section>

      {/* Advantages Section */}
      <motion.section
        className="py-20 px-4 md:px-8 max-w-[1440px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <h2 className="text-2xl font-bold text-body-text mb-8">Почему выбирают нас</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {advantages.map((advantage) => {
            const IconComponent = advantage.icon;
            return (
              <motion.div
                key={advantage.id}
                className="p-6 bg-surface-card rounded-xl border border-hairline-dark"
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                <div className="w-14 h-14 flex items-center justify-center bg-gold/10 text-gold rounded-xl mb-4">
                  <IconComponent size={28} />
                </div>
                <h3 className="text-xl font-semibold text-body-text mb-3">{advantage.title}</h3>
                <p className="text-muted-text">{advantage.description}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        className="py-20 px-4 md:px-8 max-w-[1440px] mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-body-text mb-8">Связаться с нами</h2>
        <div className="pt-20 pb-16 px-4 md:px-8 max-w-[1440px] mx-auto">
          {contacts.map((contact) => {
            const IconComponent = contact.icon;
            return (
              <div key={contact.id} className="flex items-center gap-4 p-4 bg-surface-card rounded-xl border border-hairline-dark">
                <div className="w-10 h-10 flex items-center justify-center bg-gold/10 text-gold rounded-lg flex-shrink-0">
                  <IconComponent size={20} />
                </div>
                <div>
                  <span className="text-sm text-muted-text">{contact.label}</span>
                  <span className="text-body-text">{contact.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}