import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button, Input } from '../../components/ui';
import { useToastStore } from '../../store/toastStore';
import apiClient from '../../api/client';
import styles from './ServiceRequestPage.module.css';

/**
 * Типы техники для ремонта
 */
const DEVICE_TYPES = [
  { value: 'pc', label: 'ПК', icon: '🖥️' },
  { value: 'laptop', label: 'Ноутбук', icon: '💻' },
  { value: 'monitor', label: 'Монитор', icon: '🖥️' },
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
  deviceType: string;
  brand: string;
  serial: string;
  problem: string;
  name: string;
  phone: string;
  email: string;
  urgency: string;
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
async function submitServiceRequest(data: ServiceRequestFormData): Promise<ServiceRequestResponse> {
  const response = await apiClient.post<ServiceRequestResponse>('/service-requests', data);
  return response.data;
}

/**
 * Страница заявки на ремонт
 * Соответствует прототипу prototypes/service-request.html
 */
export function ServiceRequestPage() {
  const showToast = useToastStore((state) => state.showToast);

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
  });

  // Ошибки валидации
  const [errors, setErrors] = useState<FormErrors>({});

  // Мутация для отправки формы
  const mutation = useMutation({
    mutationFn: submitServiceRequest,
    onSuccess: (data) => {
      showToast(`Заявка #${data.ticketNumber} успешно создана!`, 'success');
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
  const handleDeviceTypeChange = (value: string) => {
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
    <main className={styles.main}>
      {/* Заголовок страницы */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Заявка на ремонт</h1>
        <p className={styles.pageSubtitle}>
          Опишите проблему с вашим компьютером, и наши специалисты свяжутся с вами для уточнения
          деталей.
        </p>
      </div>

      {/* Информационный блок */}
      <div className={styles.infoBox}>
        <svg
          className={styles.infoIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div className={styles.infoContent}>
          <div className={styles.infoTitle}>Бесплатная диагностика</div>
          <div className={styles.infoText}>
            При сдаче техники в ремонт диагностика проводится бесплатно. Срок выполнения работ — от
            1 до 5 рабочих дней.
          </div>
        </div>
      </div>

      {/* Форма заявки */}
      <form className={styles.card} onSubmit={handleSubmit}>
        {/* Секция: Информация о технике */}
        <div className={styles.cardTitle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Информация о технике
        </div>

        {/* Тип техники (Radio Group) */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Тип техники <span className={styles.required}>*</span>
          </label>
          <div className={styles.radioGroup}>
            {DEVICE_TYPES.map((type) => (
              <div key={type.value} className={styles.radioItem}>
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
                  className={`${styles.radioLabel} ${
                    formData.deviceType === type.value ? styles.radioLabelActive : ''
                  }`}
                >
                  <span className={styles.radioIcon}>{type.icon}</span>
                  {type.label}
                </label>
              </div>
            ))}
          </div>
          {errors.deviceType && <span className={styles.fieldError}>{errors.deviceType}</span>}
        </div>

        {/* Марка/Модель и Серийный номер */}
        <div className={styles.formRow}>
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
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="problem">
            Описание проблемы <span className={styles.required}>*</span>
          </label>
          <textarea
            id="problem"
            name="problem"
            className={`${styles.textarea} ${errors.problem ? styles.textareaError : ''}`}
            value={formData.problem}
            onChange={handleChange}
            placeholder="Опишите подробно, что не работает или какие проблемы вы заметили..."
            rows={5}
          />
          <div className={styles.formHint}>
            Чем подробнее вы опишете проблему, тем быстрее мы сможем её диагностировать
          </div>
          {errors.problem && <span className={styles.fieldError}>{errors.problem}</span>}
        </div>

        {/* Загрузка файлов (Placeholder) */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Фотографии (необязательно)</label>
          <div className={styles.fileUpload}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className={styles.fileUploadText}>Перетащите файлы сюда или кликните для выбора</span>
            <span className={styles.fileUploadHint}>PNG, JPG до 10MB</span>
          </div>
        </div>

        {/* Секция: Контактные данные */}
        <div className={styles.cardTitle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Контактные данные
        </div>

        {/* Имя и Телефон */}
        <div className={styles.formRow}>
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
        <div className={styles.formRow}>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
          />
        </div>

        {/* Срочность */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel} htmlFor="urgency">
            Срочность
          </label>
          <select
            id="urgency"
            name="urgency"
            className={styles.select}
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
        <div className={styles.formActions}>
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
          })}>
            Очистить форму
          </Button>
        </div>
      </form>
    </main>
  );
}

export default ServiceRequestPage;