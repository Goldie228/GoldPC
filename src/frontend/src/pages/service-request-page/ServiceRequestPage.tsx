import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { useServiceTickets } from '../../hooks/useServiceTickets';
import { useAuthStore } from '../../store/authStore';
import { ServiceSelector } from './ServiceSelector';
import { PhotoUploader } from './PhotoUploader';
import { SuccessScreen } from './SuccessScreen';
import type { CreateServiceRequest } from '../../api/services';

/**
 * Типы устройств для ремонта
 */
const DEVICE_TYPES = [
  { value: 'pc', label: 'ПК', icon: '🖥️' },
  { value: 'laptop', label: 'Ноутбук', icon: '💻' },
  { value: 'printer', label: 'Принтер', icon: '🖨️' },
  { value: 'other', label: 'Другое', icon: '📦' },
] as const;

/**
 * Названия шагов для индикатора
 */
const STEP_LABELS = ['Услуга', 'Устройство', 'Проблема', 'Контакты', 'Подтверждение'];

/**
 * Способы связи
 */
const CONTACT_METHODS = [
  { value: 'phone', label: 'По телефону' },
  { value: 'email', label: 'По email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
] as const;

/**
 * Начальное состояние формы
 */
const INITIAL_FORM_DATA = {
  deviceType: 'pc' as 'pc' | 'laptop' | 'printer' | 'other',
  brand: '',
  serial: '',
  problem: '',
  name: '',
  phone: '',
  email: '',
  preferredContact: 'phone' as 'phone' | 'email' | 'whatsapp' | 'telegram',
};

/**
 * Страница подачи заявки в сервисный центр
 * Пошаговая форма с 5 шагами: услуга → устройство → проблема → контакты → подтверждение
 * Данные отправляются на реальный бэкенд POST /api/v1/services (ServicesService, порт 5003)
 */
export function ServiceRequestPage() {
  const { showToast } = useToast();
  const { createService } = useServiceTickets();
  const { isAuthenticated } = useAuthStore();

  // --- Состояние формы ---
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [photos, setPhotos] = useState<File[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState('');
  const [selectedServiceSlug, setSelectedServiceSlug] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketNumber: string;
    status: string;
  } | null>(null);

  // --- Валидация шага ---
  function validateStep(step: number): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 1 && !selectedServiceId) {
      newErrors.service = 'Выберите услугу';
    }
    if (step === 3) {
      if (!formData.problem.trim()) {
        newErrors.problem = 'Опишите проблему';
      } else if (formData.problem.trim().length < 10) {
        newErrors.problem = 'Минимум 10 символов';
      }
    }
    if (step === 4) {
      if (!formData.name.trim()) newErrors.name = 'Укажите имя';
      if (!formData.phone.trim()) {
        newErrors.phone = 'Укажите телефон';
      } else if (!/^\+?[\d\s\-()]{7,}$/.test(formData.phone.trim())) {
        newErrors.phone = 'Некорректный формат';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // --- Флаг: можно ли перейти дальше ---
  const canProceed = (() => {
    if (currentStep === 1) return selectedServiceId !== null;
    if (currentStep === 2) return true;
    if (currentStep === 3) return formData.problem.trim().length >= 10;
    if (currentStep === 4) {
      return (
        formData.name.trim() !== '' &&
        formData.phone.trim() !== '' &&
        /^\+?[\d\s\-()]{7,}$/.test(formData.phone.trim())
      );
    }
    return true;
  })();

  // --- Обработчик изменения полей ---
  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // --- Навигация ---
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  };

  // --- Отправка формы ---
  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !selectedServiceId) return;

    if (!isAuthenticated) {
      showToast('Необходимо войти в систему', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateServiceRequest = {
        serviceTypeId: selectedServiceId,
        description: formData.problem,
        deviceModel: formData.brand || undefined,
        serialNumber: formData.serial || undefined,
      };

      const result = await createService(payload);

      if (result != null) {
        setSubmittedTicket({
          ticketNumber: result.requestNumber,
          status: result.status,
        });
      } else {
        showToast('Ошибка при отправке. Попробуйте позже.', 'error');
      }
    } catch {
      showToast('Ошибка при отправке. Попробуйте позже.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Сброс формы для новой заявки ---
  const handleNewRequest = () => {
    setSubmittedTicket(null);
    setCurrentStep(1);
    setSelectedServiceId(null);
    setSelectedServiceName('');
    setSelectedServiceSlug('');
    setFormData(INITIAL_FORM_DATA);
    setPhotos([]);
    setErrors({});
  };

  // ====================== ОТРИСОВКА ШАГОВ ======================

  /** Шаг 1 — выбор услуги */
  const renderStep1Service = () => (
    <div>
      <ServiceSelector
        selectedServiceId={selectedServiceId}
        onSelect={(id, slug, name) => {
          setSelectedServiceId(id);
          setSelectedServiceName(name);
          setSelectedServiceSlug(slug);
          setErrors((prev) => ({ ...prev, service: '' }));
        }}
      />
      {selectedServiceName && (
        <p className="text-[#0ecb81] text-sm mt-3">
          ✓ Выбрано: {selectedServiceName}
        </p>
      )}
      {errors.service && (
        <p className="text-[#f6465d] text-xs mt-2">{errors.service}</p>
      )}
    </div>
  );

  /** Шаг 2 — информация об устройстве */
  const renderStep2Device = () => (
    <div>
      <h2 className="text-[#eaecef] text-lg font-semibold mb-4">
        Информация об устройстве
      </h2>

      {/* Тип устройства */}
      <label className="block text-xs font-medium text-[#707a8a] mb-2.5 uppercase tracking-[0.05em]">
        Тип техники <span className="text-[#f6465d]">*</span>
      </label>
      <div className="flex gap-3 flex-wrap mb-6">
        {DEVICE_TYPES.map((type) => (
          <div key={type.value} className="relative">
            <input
              type="radio"
              name="deviceType"
              id={`device-${type.value}`}
              value={type.value}
              checked={formData.deviceType === type.value}
              onChange={handleFieldChange}
              className="sr-only"
            />
            <label
              htmlFor={`device-${type.value}`}
              className={`flex items-center gap-2 px-4 py-3 bg-[#2b3139] border rounded-lg cursor-pointer transition-all text-sm ${
                formData.deviceType === type.value
                  ? 'border-[#fcd535] bg-[#fcd535]/10 text-[#fcd535]'
                  : 'border-[#2b3139] text-[#707a8a] hover:border-[#707a8a] hover:text-[#eaecef]'
              }`}
            >
              <span className="text-lg">{type.icon}</span>
              {type.label}
            </label>
          </div>
        ))}
      </div>

      {/* Марка и серийный номер */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Марка / Модель"
          name="brand"
          value={formData.brand}
          onChange={handleFieldChange}
          placeholder="Например: ASUS ROG Strix"
        />
        <Input
          label="Серийный номер"
          name="serial"
          value={formData.serial}
          onChange={handleFieldChange}
          placeholder="Укажите при наличии"
        />
      </div>
    </div>
  );

  /** Шаг 3 — описание проблемы */
  const renderStep3Problem = () => (
    <div>
      <h2 className="text-[#eaecef] text-lg font-semibold mb-4">
        Опишите проблему
      </h2>

      <label
        className="block text-xs font-medium text-[#707a8a] mb-2.5 uppercase tracking-[0.05em]"
        htmlFor="problem"
      >
        Описание проблемы <span className="text-[#f6465d]">*</span>
      </label>
      <textarea
        id="problem"
        name="problem"
        value={formData.problem}
        onChange={handleFieldChange}
        placeholder="Опишите подробно, что не работает или какие проблемы вы заметили..."
        rows={5}
        className={`w-full p-3.5 bg-[#2b3139] border rounded-lg text-[#eaecef] font-inherit text-sm resize-y min-h-[120px] focus:outline-none transition-all ${
          errors.problem
            ? 'border-[#f6465d] focus:border-[#f6465d] focus:shadow-[0_0_0_3px_rgba(246,70,93,0.15)]'
            : 'border-[#2b3139] focus:border-[#fcd535] focus:shadow-[0_0_0_3px_rgba(252,213,53,0.1)]'
        }`}
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-[#707a8a]">
          {formData.problem.trim().length < 10
            ? `Минимум 10 символов (ещё ${10 - formData.problem.trim().length})`
            : `${formData.problem.trim().length} символов`}
        </span>
        {errors.problem && (
          <span className="text-xs text-[#f6465d]">{errors.problem}</span>
        )}
      </div>

      <div className="mt-6">
        <label className="block text-xs font-medium text-[#707a8a] mb-2.5 uppercase tracking-[0.05em]">
          Фотографии (необязательно)
        </label>
        <PhotoUploader files={photos} onFilesChange={setPhotos} />
      </div>
    </div>
  );

  /** Шаг 4 — контактные данные */
  const renderStep4Contact = () => (
    <div>
      <h2 className="text-[#eaecef] text-lg font-semibold mb-4">
        Контактные данные
      </h2>

      <div className="flex flex-col gap-4">
        <Input
          label="Имя"
          name="name"
          value={formData.name}
          onChange={handleFieldChange}
          placeholder="Ваше имя"
          required
          error={errors.name}
        />
        <Input
          label="Телефон"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleFieldChange}
          placeholder="+375 (__) ___-__-__"
          required
          error={errors.phone}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleFieldChange}
          placeholder="email@example.com"
        />

        {/* Предпочитаемый способ связи */}
        <div>
          <label
            className="block text-xs font-medium text-[#707a8a] mb-2.5 uppercase tracking-[0.05em]"
            htmlFor="preferredContact"
          >
            Предпочитаемый способ связи
          </label>
          <select
            id="preferredContact"
            name="preferredContact"
            value={formData.preferredContact}
            onChange={handleFieldChange}
            className="w-full p-3.5 bg-[#2b3139] border border-[#2b3139] rounded-lg text-[#eaecef] font-inherit text-sm cursor-pointer appearance-none focus:outline-none focus:border-[#fcd535] bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23707a8a%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_16px_center]"
          >
            {CONTACT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  /** Шаг 5 — подтверждение */
  const renderStep5Summary = () => (
    <div>
      <h2 className="text-[#eaecef] text-lg font-semibold mb-4">
        Подтверждение заявки
      </h2>

      <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg p-6 space-y-4">
        {/* Услуга */}
        <div className="flex justify-between">
          <span className="text-sm text-[#707a8a]">Услуга</span>
          <span className="text-sm text-[#eaecef] font-medium">
            {selectedServiceName}
          </span>
        </div>

        {/* Устройство */}
        <div className="flex justify-between">
          <span className="text-sm text-[#707a8a]">Тип устройства</span>
          <span className="text-sm text-[#eaecef] font-medium">
            {DEVICE_TYPES.find((d) => d.value === formData.deviceType)?.label}
          </span>
        </div>

        {formData.brand && (
          <div className="flex justify-between">
            <span className="text-sm text-[#707a8a]">Марка / Модель</span>
            <span className="text-sm text-[#eaecef] font-medium">
              {formData.brand}
            </span>
          </div>
        )}

        {formData.serial && (
          <div className="flex justify-between">
            <span className="text-sm text-[#707a8a]">Серийный номер</span>
            <span className="text-sm text-[#eaecef] font-medium">
              {formData.serial}
            </span>
          </div>
        )}

        {/* Проблема (обрезанная) */}
        <div className="pt-3 border-t border-[#2b3139]">
          <span className="text-sm text-[#707a8a] block mb-1">Описание проблемы</span>
          <span className="text-sm text-[#eaecef]">
            {formData.problem.length > 120
              ? formData.problem.slice(0, 120) + '...'
              : formData.problem}
          </span>
        </div>

        {/* Фото */}
        {photos.length > 0 && (
          <div className="pt-3 border-t border-[#2b3139]">
            <span className="text-sm text-[#707a8a]">
              Фотографии: {photos.length} шт.
            </span>
          </div>
        )}

        {/* Контакты */}
        <div className="pt-3 border-t border-[#2b3139] space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-[#707a8a]">Имя</span>
            <span className="text-sm text-[#eaecef] font-medium">
              {formData.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-[#707a8a]">Телефон</span>
            <span className="text-sm text-[#eaecef] font-medium">
              {formData.phone}
            </span>
          </div>
          {formData.email && (
            <div className="flex justify-between">
              <span className="text-sm text-[#707a8a]">Email</span>
              <span className="text-sm text-[#eaecef] font-medium">
                {formData.email}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-[#707a8a]">Способ связи</span>
            <span className="text-sm text-[#eaecef] font-medium">
              {CONTACT_METHODS.find((m) => m.value === formData.preferredContact)
                ?.label ?? formData.preferredContact}
            </span>
          </div>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mt-4 p-4 bg-[#2b3139] border border-[#fcd535]/30 rounded-lg text-center">
          <p className="text-[#eaecef] text-sm mb-3">
            Для отправки заявки необходимо войти в систему
          </p>
          <Link to="/login">
            <Button variant="primary">Войдите, чтобы оставить заявку</Button>
          </Link>
        </div>
      )}
    </div>
  );

  // ====================== ИНДИКАТОР ШАГОВ ======================

  const renderStepIndicator = () => (
    <div className="flex items-center mb-8">
      {STEP_LABELS.map((label, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isFuture = stepNum > currentStep;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            {/* Кружок + подпись */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  isActive || isCompleted
                    ? 'bg-[#fcd535] text-[#181a20]'
                    : 'bg-[#2b3139] text-[#707a8a]'
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs mt-1.5 whitespace-nowrap hidden md:block transition-colors ${
                  isActive ? 'text-[#fcd535]' : 'text-[#707a8a]'
                }`}
              >
                {label}
              </span>
            </div>

            {/* Линия-соединитель (кроме последнего) */}
            {index < STEP_LABELS.length - 1 && (
              <div
                className={`h-px flex-1 mx-2 md:mx-4 ${
                  isCompleted ? 'bg-[#fcd535]' : 'bg-[#2b3139]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // ====================== ОСНОВНОЙ РЕНДЕР ======================

  // Успешная отправка → SuccessScreen
  if (submittedTicket) {
    return (
      <main className="min-h-screen bg-[#0b0e11] pt-[100px] px-4 md:px-6 pb-15">
        <div className="max-w-[800px] mx-auto">
          <SuccessScreen
            ticketNumber={submittedTicket.ticketNumber}
            status={submittedTicket.status}
            onNewRequest={handleNewRequest}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] pt-[100px] px-4 md:px-6 pb-15">
      <div className="max-w-[800px] mx-auto">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#eaecef] mb-2">
            Заявка в сервисный центр
          </h1>
          <p className="text-sm text-[#707a8a]">
            Заполните форму, и наши специалисты свяжутся с вами
          </p>
        </div>

        {/* Индикатор шагов */}
        {renderStepIndicator()}

        {/* Содержимое шага */}
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-lg p-6 md:p-8">
          {currentStep === 1 && renderStep1Service()}
          {currentStep === 2 && renderStep2Device()}
          {currentStep === 3 && renderStep3Problem()}
          {currentStep === 4 && renderStep4Contact()}
          {currentStep === 5 && renderStep5Summary()}

          {/* Навигационные кнопки */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[#2b3139]">
            {currentStep > 1 ? (
              <Button variant="ghost" onClick={handlePrev}>
                ← Назад
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed}
              >
                Далее →
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || !isAuthenticated}
              >
                {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default ServiceRequestPage;
