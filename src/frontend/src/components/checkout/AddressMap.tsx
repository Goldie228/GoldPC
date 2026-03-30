import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './AddressMap.module.css';

// Fix для иконок Leaflet в Webpack/Vite
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

interface PickupPoint {
  id: string;
  name: string;
  address: string;
  position: [number, number];
  workingHours: string;
}

interface AddressMapProps {
  onAddressSelect?: (address: string, position: [number, number]) => void;
  onPickupPointSelect?: (point: PickupPoint) => void;
  mode: 'delivery' | 'pickup';
  city: string;
}

// Координаты центров городов Беларуси
const CITY_CENTERS: Record<string, [number, number]> = {
  'Минск': [53.9045, 27.5615],
  'Брест': [52.0976, 23.7340],
  'Гродно': [53.6693, 23.8131],
  'Витебск': [55.1904, 30.2049],
  'Гомель': [52.4411, 30.9878],
  'Могилёв': [53.9007, 30.3313],
};

// Моковые пункты выдачи
const PICKUP_POINTS: Record<string, PickupPoint[]> = {
  'Минск': [
    { id: '1', name: 'ТЦ "Столица"', address: 'пр-т Независимости, 3', position: [53.8938, 27.5471], workingHours: '10:00-22:00' },
    { id: '2', name: 'ТЦ "Галерея"', address: 'пр-т Победителей, 9', position: [53.9206, 27.5819], workingHours: '10:00-22:00' },
    { id: '3', name: 'ТЦ "Арена-Сити"', address: 'пр-т Победителей, 84', position: [53.9135, 27.4355], workingHours: '10:00-22:00' },
  ],
  'Брест': [
    { id: '4', name: 'ТЦ "Варшавский"', address: 'ул. Варшавское шоссе, 6', position: [52.0890, 23.7255], workingHours: '10:00-21:00' },
  ],
  'Гродно': [
    { id: '5', name: 'ТЦ "Тринити"', address: 'ул. Победы, 3', position: [53.6756, 23.8272], workingHours: '10:00-21:00' },
  ],
  'Витебск': [
    { id: '6', name: 'ТЦ "Марко-Сити"', address: 'ул. Чкалова, 20', position: [55.1856, 30.1935], workingHours: '10:00-21:00' },
  ],
  'Гомель': [
    { id: '7', name: 'ТЦ "Секрет"', address: 'ул. Советская, 13', position: [52.4278, 30.9872], workingHours: '10:00-21:00' },
  ],
  'Могилёв': [
    { id: '8', name: 'ТЦ "Атриум"', address: 'ул. Первомайская, 63', position: [53.8983, 30.3386], workingHours: '10:00-21:00' },
  ],
};

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function AddressMap({ onAddressSelect, onPickupPointSelect, mode, city }: AddressMapProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const center = CITY_CENTERS[city] || CITY_CENTERS['Минск'];
  const pickupPoints = PICKUP_POINTS[city] || [];

  const handleMapClick = async (lat: number, lng: number) => {
    if (mode !== 'delivery') return;

    setSelectedPosition([lat, lng]);
    setIsLoadingAddress(true);

    try {
      // Используем Nominatim API для reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`
      );
      const data = await response.json();

      if (data.display_name) {
        const address = data.address;
        const formattedAddress = [
          address.road || address.suburb,
          address.house_number,
        ].filter(Boolean).join(', ');

        onAddressSelect?.(formattedAddress || data.display_name, [lat, lng]);
      }
    } catch (error) {
      console.error('Ошибка геокодирования:', error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handlePickupPointClick = (point: PickupPoint) => {
    onPickupPointSelect?.(point);
  };

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '400px', width: '100%', borderRadius: '8px' }}
        className={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mode === 'delivery' && <MapClickHandler onMapClick={handleMapClick} />}

        {mode === 'delivery' && selectedPosition && (
          <Marker position={selectedPosition}>
            <Popup>
              {isLoadingAddress ? 'Загрузка адреса...' : 'Выбранный адрес'}
            </Popup>
          </Marker>
        )}

        {mode === 'pickup' && pickupPoints.map((point) => (
          <Marker
            key={point.id}
            position={point.position}
            eventHandlers={{
              click: () => handlePickupPointClick(point),
            }}
          >
            <Popup>
              <div className={styles.popupContent}>
                <h4>{point.name}</h4>
                <p>{point.address}</p>
                <p className={styles.workingHours}>{point.workingHours}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {mode === 'delivery' && (
        <p className={styles.hint}>
          Нажмите на карту, чтобы выбрать адрес доставки
        </p>
      )}

      {mode === 'pickup' && pickupPoints.length > 0 && (
        <div className={styles.pointsList}>
          <div className={styles.pointsListTitle}>Пункты выдачи:</div>
          {pickupPoints.map((point) => (
            <button
              key={point.id}
              className={styles.pointItem}
              onClick={() => handlePickupPointClick(point)}
            >
              <strong>{point.name}</strong>
              <span>{point.address}</span>
              <span className={styles.workingHours}>{point.workingHours}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
