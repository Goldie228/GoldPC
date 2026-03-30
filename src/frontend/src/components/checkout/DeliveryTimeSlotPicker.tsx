import { useState } from 'react';
import styles from './DeliveryTimeSlotPicker.module.css';

interface TimeSlot {
  id: string;
  label: string;
  time: string;
}

const TIME_SLOTS: TimeSlot[] = [
  { id: 'morning', label: 'Утро', time: '9:00-13:00' },
  { id: 'afternoon', label: 'День', time: '13:00-18:00' },
  { id: 'evening', label: 'Вечер', time: '18:00-21:00' },
  { id: 'asap', label: 'Как можно скорее', time: 'Ближайшее время' },
];

interface DeliveryTimeSlotPickerProps {
  onSelect: (date: string, slot: string) => void;
  selectedDate?: string;
  selectedSlot?: string;
}

export function DeliveryTimeSlotPicker({ onSelect, selectedDate, selectedSlot }: DeliveryTimeSlotPickerProps) {
  const [date, setDate] = useState(selectedDate || '');
  const [slot, setSlot] = useState(selectedSlot || '');

  // Минимальная дата - завтра
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Максимальная дата - через 2 недели
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (slot) {
      onSelect(newDate, slot);
    }
  };

  const handleSlotSelect = (newSlot: string) => {
    setSlot(newSlot);
    if (date) {
      onSelect(date, newSlot);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Выберите дату';
    try {
      const [year, month, day] = dateStr.split('-');
      if (!year || !month || !day) return 'Выберите дату';
      return `${day}.${month}.${year}`;
    } catch (e) {
      return 'Выберите дату';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <label className={styles.formLabel}>Дата доставки</label>
        <div className={styles.dateInputWrapper}>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            min={minDate}
            max={maxDateStr}
            className={styles.nativeDateInput}
          />
          <div className={styles.formattedDate}>
            {formatDisplayDate(date)}
            <div className={styles.calendarIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
        </div>
        <p className={styles.hint}>Доставка доступна с завтрашнего дня</p>
      </div>

      {date && (
        <div className={styles.section}>
          <label className={styles.formLabel}>Временной интервал</label>
          <div className={styles.slots}>
            {TIME_SLOTS.map((timeSlot) => (
              <button
                key={timeSlot.id}
                type="button"
                className={`${styles.slot} ${slot === timeSlot.id ? styles.slotSelected : ''}`}
                onClick={() => handleSlotSelect(timeSlot.id)}
              >
                <div className={styles.slotLabel}>{timeSlot.label}</div>
                <div className={styles.slotTime}>{timeSlot.time}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
