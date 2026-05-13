import { useState, useRef } from 'react';

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
  const dateInputRef = useRef<HTMLInputElement>(null);

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
    } catch {
      return 'Выберите дату';
    }
  };

  return (
    <div className="my-4">
      <div className="mb-5">
        <label className="block mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Дата доставки</label>
        <div className="relative w-full">
          {/* Hidden native date input — клик по display-диву открывает пикер */}
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            min={minDate}
            max={maxDateStr}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-1"
          />
          {/* Display-див — показывает отформатированную дату, клик идёт в input */}
          <div
            className="w-full p-3 text-sm border border-border rounded-lg bg-elevated text-foreground transition-all duration-200 flex justify-between items-center cursor-pointer hover:border-gold/30"
            onClick={() => dateInputRef.current?.showPicker()}
          >
            {formatDisplayDate(date)}
            <div className="text-gold flex items-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Доставка доступна с завтрашнего дня</p>
      </div>

      {date && (
        <div className="mb-5">
          <label className="block mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Временной интервал</label>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            {TIME_SLOTS.map((timeSlot) => (
              <button
                key={timeSlot.id}
                type="button"
                className={`flex flex-col items-center p-3.5 bg-elevated border border-border rounded-lg cursor-pointer transition-all duration-200 hover:border-gold/30 hover:bg-gold/5 ${slot === timeSlot.id ? 'border-gold/50 bg-gold/5 ring-1 ring-gold/30' : ''}`}
                onClick={() => handleSlotSelect(timeSlot.id)}
              >
                <div className="font-semibold text-sm text-foreground mb-1">{timeSlot.label}</div>
                <div className="text-xs text-muted-foreground">{timeSlot.time}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
