import { useState, useEffect, useRef } from 'react';
import { Button, Input, PhoneInput } from '@/components/ui';
import { useToast } from '@/hooks/useToast';
import { useServiceTickets } from '@/hooks/useServiceTickets';
import { useAuthStore } from '@/store/authStore';
import { useAuthModal } from '@/hooks/useAuthModal';
import { ServiceSelector } from './ServiceSelector';
import { PhotoUploader } from './PhotoUploader';
import { SuccessScreen } from './SuccessScreen';
import type { CreateServiceRequest } from '@/api/services';

/**
 * Способы связи
 */
const CONTACT_METHODS = [
  { value: 'viber', label: 'По телефону и Viber' },
  { value: 'phone', label: 'По телефону' },
  { value: 'email', label: 'По email' },
] as const;

/**
 * Начальное состояние формы
 */
const INITIAL_FORM_DATA = {
  brand: '',
  serial: '',
  problem: '',
  name: '',
  phone: '',
  email: '',
  preferredContact: 'viber' as 'viber' | 'phone' | 'email',
};

/**
 * Страница подачи заявки в сервисный центр
 *
 * 2 шага:
 *   1. Услуга + описание проблемы
 *   2. Контакты + отправка
 */
export function ServiceRequestPage() {
  const { showToast } = useToast();
  const { createService } = useServiceTickets();
  const { isAuthenticated } = useAuthStore();
  const user = useAuthStore((s) => s.user);
  const { openLoginModal } = useAuthModal();

  // --- Состояние формы ---
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [photos, setPhotos] = useState<File[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAuthSubmit, setPendingAuthSubmit] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketNumber: string;
    status: string;
  } | null>(null);

  // Для отслеживания изменения isAuthenticated
  const prevAuth = useRef(isAuthenticated);

  // --- Авто-отправка после логина ---
  useEffect(() => {
    if (pendingAuthSubmit && isAuthenticated && !prevAuth.current) {
      setPendingAuthSubmit(false);
      performSubmit();
    }
    prevAuth.current = isAuthenticated;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, pendingAuthSubmit]);

  // --- Авто-заполнение контактов из профиля при входе на шаг 2 ---
  useEffect(() => {
    if (currentStep === 2 && user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || `${user.firstName} ${user.lastName ?? ''}`.trim(),
        phone: prev.phone || user.phone || '',
        email: user.email || prev.email,
        preferredContact: prev.preferredContact || 'viber',
      }));
    }
  }, [currentStep, user]);

  // --- Валидация шага ---
  function validateStep(step: number): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!selectedServiceId) newErrors.service = 'Выберите услугу';
      if (!formData.problem.trim()) {
        newErrors.problem = 'Опишите проблему';
      } else if (formData.problem.trim().length < 10) {
        newErrors.problem = 'Минимум 10 символов';
      }
    }
    if (step === 2) {
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
    if (currentStep === 1) {
      return selectedServiceId !== null && formData.problem.trim().length >= 10;
    }
    if (currentStep === 2) {
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
    if (validateStep(1)) {
      setCurrentStep(2);
    }
  };

  const handlePrev = () => {
    setCurrentStep(1);
    setErrors({});
  };

  // --- Отправка формы ---
  const performSubmit = async () => {
    if (!selectedServiceId) return;

    setIsSubmitting(true);

    try {
      const payload: CreateServiceRequest = {
        serviceTypeId: selectedServiceId,
        description: formData.problem,
        deviceModel: formData.brand || undefined,
        serialNumber: formData.serial || undefined,
      };

      // Логируем payload для отладки 500-х ошибок
      if (import.meta.env.DEV) {
        console.debug('[ServiceRequest] Payload:', JSON.stringify(payload, null, 2));
      }

      const result = await createService(payload);

      if (result != null) {
        setSubmittedTicket({
          ticketNumber: result.requestNumber,
          status: result.status,
        });
      } else {
        showToast('Ошибка при отправке. Попробуйте позже.', 'error');
      }
    } catch (err) {
      console.error('[ServiceRequest] Submit failed:', err);

      // Пытаемся извлечь статус и сообщение из Axios-ошибки
      let msg = 'Ошибка при отправке. Попробуйте позже.';
      if (err && typeof err === 'object' && 'response' in err) {
        const resp = (err as { response: { status: number; data?: { message?: string } } }).response;
        if (resp.status === 401) {
          msg = resp.data?.message || 'Ошибка авторизации. Попробуйте перелогиниться.';
        } else if (resp.status >= 500) {
          msg = resp.data?.message
            ? `Ошибка сервера: ${resp.data.message}`
            : 'Внутренняя ошибка сервера. Попробуйте позже.';
        } else {
          msg = resp.data?.message || 'Ошибка при отправке. Проверьте данные.';
        }
      } else if (err && typeof err === 'object' && 'request' in err) {
        msg = 'Нет соединения с сервером. Проверьте интернет.';
      }
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(2) || !selectedServiceId) return;

    if (!isAuthenticated) {
      setPendingAuthSubmit(true);
      openLoginModal();
      return;
    }

    performSubmit();
  };

  // --- Сброс формы для новой заявки ---
  const handleNewRequest = () => {
    setSubmittedTicket(null);
    setCurrentStep(1);
    setSelectedServiceId(null);
    setSelectedServiceName('');
    setFormData(INITIAL_FORM_DATA);
    setPhotos([]);
    setErrors({});
  };

  // ====================== ШАГ 1: Услуга + Проблема ======================

  const renderStep1Service = () => (
    <div>
      {/* Выбор услуги */}
      <div className="mb-8">
        <ServiceSelector
          selectedServiceId={selectedServiceId}
          onSelect={(id, _slug, name) => {
            setSelectedServiceId(id);
            setSelectedServiceName(name);
            setErrors((prev) => ({ ...prev, service: '' }));
          }}
        />
        {errors.service && (
          <p className="text-price-rise text-xs mt-2">{errors.service}</p>
        )}
      </div>

      {/* Марка / Модель + Серийный номер */}
      <div className="mb-6">
        <h3 className="text-foreground text-base font-semibold mb-4">
          Информация об устройстве
        </h3>
          <div className="flex flex-col gap-4">
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

      {/* Описание проблемы */}
      <div className="mb-6">
        <label
          className="block text-xs font-medium text-muted-text mb-2.5 uppercase tracking-[0.05em]"
          htmlFor="problem"
        >
          Описание проблемы <span className="text-price-rise">*</span>
        </label>
        <textarea
          id="problem"
          name="problem"
          value={formData.problem}
          onChange={handleFieldChange}
          placeholder="Опишите подробно, что не работает или какие проблемы вы заметили..."
          rows={5}
          className={`w-full p-3.5 bg-surface-elevated border rounded-lg text-foreground font-inherit text-sm resize-y min-h-[120px] focus:outline-none transition-all ${
            errors.problem
              ? 'border-price-rise focus:border-price-rise focus:ring-2 focus:ring-price-rise/20'
              : 'border-border focus:border-gold focus:ring-2 focus:ring-gold/10'
          }`}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-muted-text">
            {formData.problem.trim().length < 10
              ? `Минимум 10 символов (ещё ${10 - formData.problem.trim().length})`
              : `${formData.problem.trim().length} символов`}
          </span>
          {errors.problem && (
            <span className="text-xs text-price-rise">{errors.problem}</span>
          )}
        </div>
      </div>

      {/* Фотографии */}
      <div>
        <label className="block text-xs font-medium text-muted-text mb-2.5 uppercase tracking-[0.05em]">
          Фотографии (необязательно)
        </label>
        <PhotoUploader files={photos} onFilesChange={setPhotos} />
      </div>
    </div>
  );

  // ====================== ШАГ 2: Контакты + Отправка ======================

  const renderStep2Contact = () => (
    <div>
      <h2 className="text-foreground text-lg font-semibold mb-4">
        Контактные данные
      </h2>

      <div className="flex flex-col gap-4 mb-8">
        <Input
          label="Имя"
          name="name"
          value={formData.name}
          onChange={handleFieldChange}
          placeholder="Ваше имя"
          required
          error={errors.name}
        />
        <div>
          <label className="text-xs font-medium text-muted-text uppercase tracking-[0.05em]">
            Телефон <span className="text-price-rise">*</span>
          </label>
          <PhoneInput
            value={formData.phone}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, phone: value }));
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
            }}
          />
          {errors.phone && <span className="text-[0.75rem] leading-1.4 text-price-rise">{errors.phone}</span>}
        </div>
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleFieldChange}
          placeholder="email@example.com"
          readOnly={!!user?.email}
          className={user?.email ? 'opacity-60 cursor-not-allowed' : ''}
        />
        {user?.email && (
          <p className="text-xs text-muted-text -mt-2">
            Email из вашего профиля, его нельзя изменить
          </p>
        )}

        {/* Предпочитаемый способ связи */}
        <div>
          <label
            className="block text-xs font-medium text-muted-text mb-2.5 uppercase tracking-[0.05em]"
            htmlFor="preferredContact"
          >
            Предпочитаемый способ связи
          </label>
          <select
            id="preferredContact"
            name="preferredContact"
            value={formData.preferredContact}
            onChange={handleFieldChange}
            className="w-full p-3.5 bg-surface-elevated border border-border rounded-lg text-foreground font-inherit text-sm cursor-pointer appearance-none focus:outline-none focus:border-gold bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23707a8a%27 stroke-width=%272%27%3E%3Cpolyline points=%276 9 12 15 18 9%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_16px_center]"
          >
            {CONTACT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Сводка заявки */}
      <div className="bg-surface-card border border-border rounded-lg p-5 mb-6">
        <h3 className="text-foreground font-semibold text-sm mb-3">
          Сводка заявки
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-text">Услуга</span>
            <span className="text-foreground font-medium">
              {selectedServiceName}
            </span>
          </div>
          {formData.brand && (
            <div className="flex justify-between">
              <span className="text-muted-text">Модель</span>
              <span className="text-foreground">{formData.brand}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-text">Проблема</span>
            <span className="text-foreground text-right max-w-[60%] truncate">
              {formData.problem}
            </span>
          </div>
          {photos.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-text">Фото</span>
              <span className="text-foreground">{photos.length} шт.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ====================== ОСНОВНОЙ РЕНДЕР ======================

  // Успешная отправка → SuccessScreen
  if (submittedTicket) {
    return (
      <div className="max-w-[800px] w-full mx-auto px-4 md:px-6 pt-8 pb-12">
        <SuccessScreen
          ticketNumber={submittedTicket.ticketNumber}
          status={submittedTicket.status}
          onNewRequest={handleNewRequest}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[800px] w-full mx-auto px-4 md:px-6 pt-8 pb-12">
      {/* Заголовок страницы */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground mb-2">
          Заявка в сервисный центр
        </h1>
        <p className="text-sm text-muted-text">
          {currentStep === 1
            ? 'Выберите услугу и опишите проблему'
            : 'Укажите контактные данные и отправьте заявку'}
        </p>
      </div>

      {/* Метка шага */}
      <div className="flex items-center gap-3 mb-6">
        <span
          className={`text-xs font-semibold uppercase tracking-[0.08em] px-3 py-1 rounded-full ${
            currentStep === 1
              ? 'bg-gold/15 text-gold'
              : 'bg-surface-elevated text-muted-text'
          }`}
        >
          Шаг {currentStep} из 2
        </span>
        <span className="text-sm text-muted-text">
          {currentStep === 1 ? 'Услуга и описание' : 'Контакты и отправка'}
        </span>
      </div>

      {/* Блок авторизации — виден сразу, над карточкой */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 bg-surface-elevated border border-gold/30 rounded-lg flex items-center gap-3">
          <div className="shrink-0 w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">
              Требуется авторизация
            </p>
            <p className="text-muted-text text-xs mt-0.5">
              Войдите в аккаунт, чтобы заполнить и отправить заявку
            </p>
          </div>
        </div>
      )}

      {/* Содержимое */}
      <div className="bg-surface-card border border-border rounded-lg p-6 md:p-8 relative">
        {/* Контент шага — одинаковая обёртка для обоих шагов */}
        <div className={currentStep === 1 && !isAuthenticated ? 'pointer-events-none select-none opacity-30' : ''}>
          {currentStep === 1 && renderStep1Service()}
          {currentStep === 2 && renderStep2Contact()}
        </div>

        {/* Оверлей для неавторизованных — блокирует шаг 1 */}
        {currentStep === 1 && !isAuthenticated && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="bg-surface-card/95 border border-gold/30 rounded-xl p-8 text-center shadow-xl max-w-sm mx-auto">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <p className="text-foreground font-semibold text-lg mb-1">
                Требуется вход
              </p>
              <p className="text-muted-text text-sm mb-6">
                Войдите в аккаунт, чтобы оставить заявку
              </p>
              <Button variant="primary" onClick={openLoginModal} fullWidth>
                Войти или зарегистрироваться
              </Button>
            </div>
          </div>
        )}

        {/* Навигационные кнопки */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          {currentStep === 2 ? (
            <Button variant="ghost" onClick={handlePrev}>
              ← Назад
            </Button>
          ) : (
            <div />
          )}

          {currentStep === 1 ? (
            !isAuthenticated ? (
              <Button variant="primary" onClick={openLoginModal}>
                Войти →
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed}
              >
                Далее →
              </Button>
            )
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Отправка...'
                : isAuthenticated
                  ? 'Отправить заявку'
                  : 'Войти и отправить'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceRequestPage;
