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
import styles from './AboutPage.module.css';

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
      ease: [0.33, 1, 0.68, 1],
    },
  },
};

export function AboutPage() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <motion.header
        className={styles.hero}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={styles.heroTitle}>
          О компании <span className={styles.accent}>GoldPC</span>
        </h1>
        <p className={styles.heroDesc}>
          Мы создаём компьютеры мечты с 2014 года. От геймерских монстров до рабочих станций
          профессионалов — каждая сборка выполнена с любовью к деталям.
        </p>
      </motion.header>

      {/* Stats Section */}
      <motion.section
        className={styles.stats}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={styles.statsGrid}>
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <motion.div key={stat.id} className={styles.statCard} variants={itemVariants}>
                <div className={styles.statIcon}>
                  <IconComponent size={24} />
                </div>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Mission Section */}
      <motion.section
        className={styles.mission}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className={styles.missionContent}>
          <h2 className={styles.sectionTitle}>Наша миссия</h2>
          <p className={styles.missionText}>
            Мы верим, что каждый заслуживает компьютер, который идеально соответствует его
            потребностям. Наша миссия — сделать высокопроизводительные компьютеры доступными
            и понятными для каждого клиента.
          </p>
          <p className={styles.missionText}>
            Команда GoldPC объединяет энтузиастов, которые сами увлечены технологиями.
            Мы не просто продаём комплектующие — мы помогаем воплотить ваши идеи в реальность.
          </p>
        </div>
      </motion.section>

      {/* Advantages Section */}
      <motion.section
        className={styles.advantages}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <h2 className={styles.sectionTitle}>Почему выбирают нас</h2>
        <div className={styles.advantagesGrid}>
          {advantages.map((advantage) => {
            const IconComponent = advantage.icon;
            return (
              <motion.div
                key={advantage.id}
                className={styles.advantageCard}
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                <div className={styles.advantageIcon}>
                  <IconComponent size={28} />
                </div>
                <h3 className={styles.advantageTitle}>{advantage.title}</h3>
                <p className={styles.advantageDesc}>{advantage.description}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Contact Section */}
      <motion.section
        className={styles.contacts}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.sectionTitle}>Связаться с нами</h2>
        <div className={styles.contactsList}>
          {contacts.map((contact) => {
            const IconComponent = contact.icon;
            return (
              <div key={contact.id} className={styles.contactItem}>
                <div className={styles.contactIcon}>
                  <IconComponent size={20} />
                </div>
                <div className={styles.contactInfo}>
                  <span className={styles.contactLabel}>{contact.label}</span>
                  <span className={styles.contactValue}>{contact.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}