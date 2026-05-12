import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { useServiceTickets } from '../../hooks/useServiceTickets';
import type { CreateTicketRequest } from '../../api/service-tickets';

/**
 * Типы техники для ремонта
 */
const DEVICE_TYPES = [
  { value: 'pc', label: 'ПК', icon: '🖥️' },
  { value: 'laptop', label: 'Ноутбук', icon: '💻' },
  { value: 'printer', label: 'Принтер', icon: '🖨️' },
  { value: 'other', label: 'Другое', icon: '📦' },
] as const;

/**
 * Уровни срочности
 */
const URGENCY_OPTIONS = [
  { value: 'normal', label: 'Обычная (3-5 дней)' },
  { value: 'urgent', label: 'Срочная (1-2 дня) +50%' },
  { value: 'express', label: 'Экспресс (в тот же день) +100%' },
] as const;

/**
 * Интерфейс данных формы
 */
interface ServiceRequestFormData {
  deviceType: 'pc' | 'laptop' | 'printer' | 'other';
  brand: string;
  serial: string;
  problem: string;
  name: string;
  phone: string;
  email: string;
  urgency: 'low' | 'normal' | 'high';
  preferredContact: 'email' | 'phone' | 'whatsapp' | 'telegram';
}

/**
 * Интерфейс ответа API
 */
interface ServiceRequestResponse {
  id: string;
  ticketNumber: string;
  status: string;
  createdAt: string;
}

/**
 * Интерфейс ошибок валидации
 */
interface FormErrors {
  deviceType?: string;
  problem?: string;
  name?: string;
  phone?: string;
}

/**
 * Отправка заявки на ремонт
 */
async function submitServiceRequest(
  data: ServiceRequestFormData,
  createTicketFn: (req: CreateTicketRequest) => Promise<ServiceRequestResponse | null>
): Promise<ServiceRequestResponse | null> {
  return createTicketFn({
    deviceType: data.deviceType,
    brand: data.brand,
    model: data.brand,
    serialNumber: data.serial,
    issueDescription: data.problem,
    preferredContact: data.preferredContact,
  });
}

/**
 * Страница заявки на ремонт
 * Соответствует прототипу prototypes/service-request.html
 */
export function ServiceRequestPage() {
  const { showToast } = useToast();
  const { createTicket } = useServiceTickets();

  // Состояние формы
  const [formData, setFormData] = useState<ServiceRequestFormData>({
    deviceType: 'pc',
    brand: '',
    serial: '',
    problem: '',
    name: '',
    phone: '',
    email: '',
    urgency: 'normal',
    preferredContact: 'phone',
  });

  // Ошибки валидации
  const [errors, setErrors] = useState<FormErrors>({});

  // Мутация для отправки формы
  const mutation = useMutation({
    mutationFn: (data: ServiceRequestFormData) => submitServiceRequest(data, createTicket),
    onSuccess: (result) => {
      if (!result) {
        showToast('Ошибка при отправке заявки. Сервер вернул пустой ответ.', 'error');
        return;
      }
      showToast(`Заявка #${result.ticketNumber} успешно создана!`, 'success');
      // Сброс формы
      setFormData({
        deviceType: 'pc',
        brand: '',
        serial: '',
        problem: '',
        name: '',
        phone: '',
        email: '',
        urgency: 'normal',
        preferredContact: 'phone',
      });
      setErrors({});
    },
    onError: () => {
      showToast('Ошибка при отправке заявки. Попробуйте позже.', 'error');
    },
  });

  /**
   * Валидация формы
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.deviceType) {
      newErrors.deviceType = 'Выберите тип техники';
    }

    if (!formData.problem.trim()) {
      newErrors.problem = 'Опишите проблему';
    } else if (formData.problem.trim().length < 10) {
      newErrors.problem = 'Описание должно содержать минимум 10 символов';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Укажите ваше имя';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Укажите номер телефона';
    } else if (!/^\+?[\d\s\-()]{7,}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Некорректный формат телефона';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Обработчик изменения полей
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Очистка ошибки при изменении поля
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Обработчик выбора типа устройства
   */
  const handleDeviceTypeChange = (value: 'pc' | 'laptop' | 'printer' | 'other') => {
    setFormData((prev) => ({ ...prev, deviceType: value }));
    if (errors.deviceType) {
      setErrors((prev) => ({ ...prev, deviceType: undefined }));
    }
  };

  /**
   * Обработчик отправки формы
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <main className="pt-[100px] px-6 pb-15 max-w-[800px] mx-auto min-h-screen">
      {/* Заголовок страницы */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] mb-3 text-[var(--fg)]">Заявка на ремонт</h1>
        <p className="text-[0.95rem] text-[var(--fg-muted)] leading-[1.6]">
          Опишите проблему с вашим компьютером, и наши специалисты свяжутся с вами для уточнения
          деталей.
        </p>
      </div>

      {/* Информационный блок */}
      <div className="flex gap-4 p-5 bg-[var(--accent-glow)] border border-[var(--border-accent)] mb-6">
        <svg
          className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div className="flex-1">
          <div className="text-[0.85rem] font-semibold mb-1.5 text-[var(--fg)]">Бесплатная диагностика</div>
          <div className="text-sm text-[var(--fg-muted)] leading-[1.6]">
            При сдаче техники в ремонт диагностика проводится бесплатно. Срок выполнения работ — от
            1 до 5 рабочих дней.
          </div>
        </div>
      </div>

      {/* Форма заявки */}
      <form className="bg-[var(--bg-card)] border border-[var(--border)] p-8 mb-6" onSubmit={handleSubmit}>
        {/* Секция: Информация о технике */}
        <div className="text-base font-semibold mb-6 flex items-center gap-3 pb-4 border-b border-[var(--border)] text-[var(--fg)] [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-[var(--accent)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Информация о технике
        </div>

        {/* Тип техники (Radio Group) */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-[var(--fg-muted)] mb-2.5 uppercase tracking-[0.05em]">
            Тип техники <span className="text-[var(--error)]">*</span>
          </label>
          <div className="flex gap-3 flex-wrap">
            {DEVICE_TYPES.map((type) => (
              <div key={type.value} className="relative">
                <input
                  type="radio"
                  name="deviceType"
                  id={`type-${type.value}`}
                  value={type.value}
                  checked={formData.deviceType === type.value}
                  onChange={() => handleDeviceTypeChange(type.value)}
                  className="sr-only"
                />
                <label
                  htmlFor={`type-${type.value}`}
                  className={`flex items-center gap-2.5 px-5 py-3 bg-[var(--bg-elevated)] border border-[var(--border-accent)] cursor-pointer transition-all text-[0.85rem] text-[var(--fg-muted)] hover:border-[var(--fg-dim)] hover:text-[var(--fg)] ${
                    formData.deviceType === type.value
                      ? 'border-[var(--accent)] bg-[var(--accent-glow)] text-[var(--fg)]'
                      : ''
                  }`}
                >
                  <span className="text-[1.1rem]">{type.icon}</span>
                  {type.label}
                </label>
              </div>
            ))}
          </div>
          {errors.deviceType && <span className="block text-[0.75rem] text-[var(--error)] mt-1.5">{errors.deviceType}</span>}
        </div>

        {/* Марка/Модель и Серийный номер */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          <Input
            label="Марка/Модель"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="Например: ASUS ROG Strix"
          />
          <Input
            label="Серийный номер"
            name="serial"
            value={formData.serial}
            onChange={handleChange}
            placeholder="Укажите при наличии"
          />
        </div>

        {/* Описание проблемы */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-[var(--fg-muted)] mb-2.5 uppercase tracking-[0.05em]" htmlFor="problem">
            Описание проблемы <span className="text-[var(--error)]">*</span>
          </label>
          <textarea
            id="problem"
            name="problem"
            className={`w-full p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-accent)] text-[var(--fg)] font-[var(--font-sans)] text-[0.9rem] transition-colors resize-y min-h-[120px] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow,var(--border-muted))] ${
              errors.problem ? 'border-[var(--error)] focus:border-[var(--error)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''
            }`}
            value={formData.problem}
            onChange={handleChange}
            placeholder="Опишите подробно, что не работает или какие проблемы вы заметили..."
            rows={5}
          />
          <div className="text-[0.75rem] text-[var(--fg-dim)] mt-2">
            Чем подробнее вы опишете проблему, тем быстрее мы сможем её диагностировать
          </div>
          {errors.problem && <span className="block text-[0.75rem] text-[var(--error)] mt-1.5">{errors.problem}</span>}
        </div>

        {/* Загрузка файлов (Placeholder) */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-[var(--fg-muted)] mb-2.5 uppercase tracking-[0.05em]">Фотографии (необязательно)</label>
          <div className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-[var(--border)] bg-[var(--bg-elevated)] cursor-pointer transition-all text-center hover:border-[var(--fg-dim)] hover:bg-[var(--bg-card)] [&>svg]:w-8 [&>svg]:h-8 [&>svg]:text-[var(--fg-dim)] [&>svg]:transition-colors [&:hover>svg]:text-[var(--accent)]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="text-[0.9rem] text-[var(--fg-muted)]">Перетащите файлы сюда или кликните для выбора</span>
            <span className="text-[0.75rem] text-[var(--fg-dim)]">PNG, JPG до 10MB</span>
          </div>
        </div>

        {/* Секция: Контактные данные */}
        <div className="text-base font-semibold mb-6 flex items-center gap-3 pb-4 border-b border-[var(--border)] text-[var(--fg)] [&>svg]:w-5 [&>svg]:h-5 [&>svg]:text-[var(--accent)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Контактные данные
        </div>

        {/* Имя и Телефон */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          <Input
            label="Имя"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ваше имя"
            required
            error={errors.name}
          />
          <Input
            label="Телефон"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+375 (__) ___-__-__"
            required
            error={errors.phone}
          />
        </div>

        {/* Email */}
        <div className="grid grid-cols-2 gap-5 mb-6">
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
          />
        </div>

        {/* Способ связи */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-[var(--fg-muted)] mb-2.5 uppercase tracking-[0.05em]" htmlFor="preferredContact">
            Предпочитаемый способ связи
          </label>
          <select
            id="preferredContact"
            name="preferredContact"
            className="w-full p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-accent)] text-[var(--fg)] font-[var(--font-sans)] text-[0.9rem] cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_16px_center] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow,var(--border-muted))] [&>option]:bg-[var(--bg-card)] [&>option]:text-[var(--fg)]"
            value={formData.preferredContact}
            onChange={handleChange}
          >
            <option value="phone">По телефону</option>
            <option value="email">По email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>

        {/* Срочность */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-[var(--fg-muted)] mb-2.5 uppercase tracking-[0.05em]" htmlFor="urgency">
            Срочность
          </label>
          <select
            id="urgency"
            name="urgency"
            className="w-full p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-accent)] text-[var(--fg)] font-[var(--font-sans)] text-[0.9rem] cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2371717a%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_16px_center] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow,var(--border-muted))] [&>option]:bg-[var(--bg-card)] [&>option]:text-[var(--fg)]"
            value={formData.urgency}
            onChange={handleChange}
          >
            {URGENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-[var(--border)]">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Отправка...' : 'Отправить заявку'}
            {!mutation.isPending && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setFormData({
            deviceType: 'pc',
            brand: '',
            serial: '',
            problem: '',
            name: '',
            phone: '',
            email: '',
            urgency: 'normal',
            preferredContact: 'phone',
          })}>
            Очистить форму
          </Button>
        </div>
      </form>
    </main>
  );
}

export default ServiceRequestPage;