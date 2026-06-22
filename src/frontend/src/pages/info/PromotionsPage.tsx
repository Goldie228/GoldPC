import { Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

const PROMOTIONS = [
  {
    id: 1,
    title: 'Скидка 15% на видеокарты NVIDIA RTX 4070',
    description: 'Только до конца месяца — скидка 15% на все видеокарты серии RTX 4070. Успейте обновить свою систему!',
    category: 'Видеокарты',
    discount: '15%',
    image: '/placeholders/services/graphics.svg',
  },
  {
    id: 2,
    title: 'Бесплатная сборка при покупке от 3 компонентов',
    description: 'Купите 3 или более компонентов для ПК и получите бесплатную сборку в нашем сервисном центре.',
    category: 'Конструктор ПК',
    discount: 'Бесплатно',
    image: '/placeholders/services/assembly.svg',
  },
  {
    id: 3,
    title: 'Trade-In: сдайте старое — получите скидку',
    description: 'Принесите ваш старый компонент и получите скидку до 20% на новый. Действует на весь каталог.',
    category: 'Все категории',
    discount: 'до 20%',
    image: '/placeholders/services/trade-in.svg',
  },
];

export function PromotionsPage() {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-surface-base">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-body-text mb-8">Акции и специальные предложения</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROMOTIONS.map((promo) => (
            <div
              key={promo.id}
              className="bg-surface-card border border-hairline-dark rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-48 bg-surface-elevated flex items-center justify-center">
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="h-32 w-32 object-contain opacity-80"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-gold" />
                  <span className="text-xs font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                    {promo.discount}
                  </span>
                  <span className="text-xs text-muted-text">{promo.category}</span>
                </div>
                <h2 className="text-lg font-semibold text-body-text mb-2">{promo.title}</h2>
                <p className="text-sm text-muted-text mb-4 leading-relaxed">{promo.description}</p>
                <Link
                  to="/catalog"
                  className="inline-flex items-center justify-center px-4 py-2 bg-gold text-gold-ink font-medium rounded-md hover:bg-gold-active transition-colors text-sm"
                >
                  Перейти в каталог
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PromotionsPage;
