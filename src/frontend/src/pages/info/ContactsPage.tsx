import { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix для иконок Leaflet в Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const STORE_POSITION: [number, number] = [53.876, 27.499];

const contactInfo = [
  {
    title: 'Телефон',
    value: '+375 (33) 314-92-83',
    description: 'Ежедневно с 10:00 до 20:00',
    icon: Phone,
  },
  {
    title: 'Email',
    value: 'goldpc.team@gmail.com',
    description: 'Ответим в течение 2 часов',
    icon: Mail,
  },
  {
    title: 'Адрес магазина',
    value: 'Минск, Улица Казимировская 21',
    description: 'Самовывоз в день подтверждения заказа',
    icon: MapPin,
  },
];

const schedule = [
  { day: 'Понедельник — пятница', hours: '10:00 — 20:00' },
  { day: 'Суббота', hours: '10:00 — 20:00' },
  { day: 'Воскресенье', hours: '10:00 — 18:00' },
];

export function ContactsPage(): ReactElement {
  return (
    <main className="min-h-screen bg-canvas-dark pt-24 md:pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-text mb-8">
          <Link to="/" className="hover:text-gold transition-colors">Главная</Link>
          <span className="text-muted-text">/</span>
          <span className="text-body-text">Контакты</span>
        </nav>

        {/* Hero */}
        <section className="mb-16">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-body-text mb-4 tracking-[-0.02em]">
            Контакты
          </h1>
          <p className="text-lg text-muted-text max-w-[600px] leading-relaxed">
            Свяжитесь с нами любым удобным способом. Мы всегда рады помочь с выбором и ответить на ваши вопросы.
          </p>
        </section>

        {/* Contact Cards */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactInfo.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-gold/10 text-gold rounded-lg mb-5">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-body-text mb-1">{item.title}</h3>
                  <p className="text-gold font-semibold text-base mb-1">{item.value}</p>
                  <p className="text-muted-text text-sm">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Schedule & Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Schedule */}
          <section className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-body-text mb-6 flex items-center gap-3">
              <Clock size={24} className="text-gold" />
              Режим работы
            </h2>
            <div className="space-y-3">
              {schedule.map((item) => (
                <div
                  key={item.day}
                  className="flex items-center justify-between pb-3 border-b border-hairline-dark last:border-b-0 last:pb-0"
                >
                  <span className="text-body-text text-sm">{item.day}</span>
                  <span className="text-muted-text text-sm">{item.hours}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Map */}
          <section className="bg-surface-card rounded-xl border border-hairline-dark p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-body-text mb-6 flex items-center gap-3">
              <MapPin size={24} className="text-gold" />
              Как нас найти
            </h2>
            <div className="rounded-lg overflow-hidden">
              <MapContainer
                center={STORE_POSITION}
                zoom={16}
                style={{ height: '280px', width: '100%' }}
                className="z-0"
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={STORE_POSITION}>
                  <Popup>
                    <div className="text-center">
                      <strong>GoldPC</strong>
                      <br />
                      Минск, ул. Казимировская 21
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
              <a
                href="https://yandex.by/maps/?text=Минск,+улица+Казимировская+21"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gold/10 text-gold text-sm font-semibold hover:bg-gold/20 transition-colors no-underline"
              >
                <ExternalLink size={16} />
                Открыть в Яндекс Картах
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
