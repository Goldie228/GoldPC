import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Database, Trash2, Mail } from 'lucide-react';

const sections = [
  {
    title: '1. Общие положения',
    icon: Shield,
    paragraphs: [
      'Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок обработки и защиты персональных данных пользователей сайта GoldPC (далее — «Сайт»).',
      'Используя Сайт, вы даёте согласие на сбор и обработку ваших персональных данных в соответствии с настоящей Политикой.',
      'Если вы не согласны с условиями Политики, пожалуйста, прекратите использование Сайта.',
    ],
  },
  {
    title: '2. Какие данные мы собираем',
    icon: Database,
    paragraphs: [
      'При регистрации и оформлении заказа мы собираем следующие данные: имя, номер телефона, адрес электронной почты, адрес доставки.',
      'Автоматически собирается информация об устройстве и браузере, IP-адрес, файлы cookie и данные о посещённых страницах.',
      'Мы не собираем специальные категории персональных данных (расовую принадлежность, политические взгляды, состояние здоровья).',
    ],
  },
  {
    title: '3. Как мы используем ваши данные',
    icon: Lock,
    paragraphs: [
      'Для обработки и выполнения заказов, доставки товаров и предоставления услуг.',
      'Для связи с вами по вопросам заказа, гарантийного обслуживания и поддержки.',
      'Для улучшения работы Сайта, анализа поведения пользователей и персонализации предложений.',
      'Для отправки информационных и рекламных сообщений (только с вашего согласия).',
    ],
  },
  {
    title: '4. Защита данных',
    icon: Lock,
    paragraphs: [
      'Мы принимаем все необходимые организационные и технические меры для защиты ваших персональных данных от несанкционированного доступа, изменения, раскрытия или уничтожения.',
      'Передача данных третьим лицам осуществляется только в рамках исполнения заказа (службы доставки, платёжные системы) и в случаях, предусмотренных законодательством Республики Беларусь.',
      'Мы не продаём и не передаём ваши персональные данные третьим лицам в маркетинговых целях.',
    ],
  },
  {
    title: '5. Срок хранения данных',
    icon: Trash2,
    paragraphs: [
      'Мы храним ваши персональные данные в течение срока, необходимого для достижения целей их обработки, но не дольше, чем это требуется законодательством Республики Беларусь.',
      'После прекращения необходимости в обработке данных мы удаляем или обезличиваем их.',
      'Вы можете запросить удаление ваших данных в любое время, обратившись в службу поддержки.',
    ],
  },
  {
    title: '6. Контакты для вопросов',
    icon: Mail,
    paragraphs: [
      'Если у вас есть вопросы по поводу обработки персональных данных, вы можете связаться с нами:',
      'Email: goldpc.team@gmail.com',
      'Телефон: +375 (33) 314-92-83',
      'Адрес: Минск, Улица Казимировская 21',
    ],
  },
];

export function PrivacyPage(): ReactElement {
  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 pt-8 pb-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
        <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
        <span className="text-muted-text">/</span>
        <span className="text-body-text">Политика конфиденциальности</span>
      </nav>

      {/* Hero */}
      <section className="mb-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-body-text mb-4 tracking-[-0.02em]">
          Политика конфиденциальности
        </h1>
        <p className="text-lg text-muted-text leading-relaxed">
          Как мы обрабатываем, храним и защищаем ваши персональные данные.
        </p>
      </section>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section
              key={section.title}
              className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8"
            >
              <h2 className="text-lg font-semibold text-body-text mb-4 flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-gold/10 text-gold rounded-lg shrink-0">
                  <Icon size={18} />
                </div>
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-muted-text text-sm leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
