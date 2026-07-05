import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/hooks/useToast';
import apiClient from '@/api/client';
import type { PCBuilderSelectedState } from '@/hooks';

/** Назначение ПК (соответствует PCPurpose из API) */
type PCPurpose = 'Gaming' | 'Office' | 'Workstation';

/** Опции назначения для dropdown */
const PURPOSE_OPTIONS: { value: PCPurpose; label: string }[] = [
  { value: 'Gaming', label: 'Игровой' },
  { value: 'Office', label: 'Офисный' },
  { value: 'Workstation', label: 'Рабочая станция' },
];

/** Тело запроса на сохранение конфигурации */
interface SaveConfigurationPayload {
  name: string;
  purpose?: PCPurpose;
  processorId?: string;
  motherboardId?: string;
  ramId?: string;
  gpuId?: string;
  psuId?: string;
  storageId?: string;
  caseId?: string;
  coolerId?: string;
  totalPrice?: number;
}

/** Ответ API на сохранение конфигурации */
interface SaveConfigurationResponse {
  id: string;
  name: string;
  purpose?: string;
  totalPrice: number;
  isCompatible: boolean;
  createdAt: string;
}

export interface SaveConfigurationModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Selected components from usePCBuilder */
  selectedComponents: PCBuilderSelectedState;
  /** Total price of the build */
  totalPrice: number;
  /** Compatibility result */
  isCompatible: boolean;
  /** Number of selected components */
  selectedCount: number;
  /** Total number of slots */
  totalCount: number;
  /** Compatibility errors */
  compatibilityErrors: string[];
  /** Compatibility warnings */
  compatibilityWarnings: string[];
  /** Callback after successful save */
  onSaved?: (configuration: SaveConfigurationResponse) => void;
}

/**
 * SaveConfigurationModal — модальное окно сохранения сборки ПК.
 *
 * Features:
 * - Название сборки (required, 2–100 символов)
 * - Назначение: Gaming / Office / Workstation
 * - Summary: компонентов X/8, совместимость, цена
 * - POST /api/v1/pcbuilder/configurations
 * - Toast при успехе/ошибке
 */
export function SaveConfigurationModal({
  isOpen,
  onClose,
  selectedComponents,
  totalPrice,
  isCompatible,
  selectedCount,
  totalCount,
  compatibilityErrors,
  compatibilityWarnings,
  onSaved,
}: SaveConfigurationModalProps) {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState<PCPurpose>('Gaming');
  const [nameError, setNameError] = useState('');

  const { showToast } = useToast();

  /** Формируем плоский payload для API (соответствует backend PCConfigurationDto). */
  const buildPayload = useCallback((): SaveConfigurationPayload => {
    const s = selectedComponents;
    return {
      name: '',
      purpose,
      processorId: s.cpu?.product.id,
      motherboardId: s.motherboard?.product.id,
      ramId: s.ram.length > 0 ? s.ram[0].product.id : undefined,
      gpuId: s.gpu?.product.id,
      psuId: s.psu?.product.id,
      storageId: s.storage.length > 0 ? s.storage[0].product.id : undefined,
      caseId: s.case?.product.id,
      coolerId: s.cooling?.product.id,
      totalPrice,
    };
  }, [selectedComponents, purpose, totalPrice]);

  /** Мутация сохранения конфигурации */
  const saveMutation = useMutation<SaveConfigurationResponse, Error, SaveConfigurationPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post<SaveConfigurationResponse>(
        '/pcbuilder/configurations',
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      showToast(`Сборка «${data.name}» успешно сохранена`, 'success');
      onSaved?.(data);
      handleClose();
    },
    onError: (error) => {
      const message = error.message || 'Не удалось сохранить конфигурацию';
      showToast(message, 'error');
    },
  });

  /** Валидация и отправка */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    // Валидация названия
    if (!trimmedName) {
      setNameError('Название сборки обязательно');
      return;
    }
    if (trimmedName.length < 2) {
      setNameError('Минимум 2 символа');
      return;
    }
    if (trimmedName.length > 100) {
      setNameError('Максимум 100 символов');
      return;
    }

    setNameError('');

    saveMutation.mutate({
      ...buildPayload(),
      name: trimmedName,
    });
  };

  /** Сброс состояния при закрытии */
  const handleClose = () => {
    setName('');
    setPurpose('Gaming');
    setNameError('');
    saveMutation.reset();
    onClose();
  };

  /** Форматирование цены */
  const formatPrice = (price: number): string => {
    return price.toLocaleString('ru-BY') + ' BYN';
  };

  /** Статус совместимости */
  const getCompatibilityStatus = (): { label: string; className: string } => {
    if (selectedCount === 0) {
      return { label: 'Нет компонентов', className: 'text-muted-foreground' };
    }
    if (compatibilityErrors.length > 0) {
      return { label: `Ошибки: ${compatibilityErrors.length}`, className: 'text-red-500' };
    }
    if (compatibilityWarnings.length > 0) {
      return { label: `Предупреждения: ${compatibilityWarnings.length}`, className: 'text-warning' };
    }
    return { label: 'Все совместимо', className: 'text-green-400' };
  };

  const compatibilityStatus = getCompatibilityStatus();
  const canSave = selectedCount > 0 && !saveMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Сохранить сборку"
      size="small"
    >
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {/* Название сборки */}
        <div className="flex flex-col gap-1.5">
          <Input
            label="Название сборки"
            placeholder="Моя игровая сборка"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            error={nameError}
            required
            disabled={saveMutation.isPending}
            maxLength={100}
            autoFocus
          />
        </div>

        {/* Назначение */}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="purpose-select">
            Назначение
          </label>
          <select
            id="purpose-select"
            className="w-full px-3.5 py-2.5 font-inherit text-[0.95rem] text-body-text bg-surface-card border border-border rounded-md outline-none cursor-pointer transition-colors appearance-none"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as PCPurpose)}
            disabled={saveMutation.isPending}
          >
            {PURPOSE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Summary */}
        <div className="bg-surface-card border border-border rounded-md p-4">
          <h3 className="m-0 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Сводка сборки</h3>

          <div className="flex flex-col gap-2 divide-y divide-border">
            {/* Компонентов */}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs text-muted-foreground">Компонентов</span>
              <span className="text-[0.95rem] font-semibold text-body-text">
                {selectedCount}/{totalCount}
              </span>
            </div>

            {/* Совместимость */}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs text-muted-foreground">Совместимость</span>
              <span className={`text-[0.95rem] font-semibold ${compatibilityStatus.className}`}>
                {compatibilityStatus.label}
              </span>
            </div>

            {/* Цена */}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs text-muted-foreground">Стоимость</span>
              <span className="text-[1.05rem] font-semibold text-gold">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          {/* Детали ошибок/предупреждений */}
          {(compatibilityErrors.length > 0 || compatibilityWarnings.length > 0) && (
            <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1.5">
              {compatibilityErrors.map((err, i) => (
                <p key={`err-${i}`} className="m-0 text-xs leading-normal text-red-500">
                  ✕ {err}
                </p>
              ))}
              {compatibilityWarnings.map((warn, i) => (
                <p key={`warn-${i}`} className="m-0 text-xs leading-normal text-warning">
                  ⚠ {warn}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Действия */}
        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={saveMutation.isPending}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!canSave}
          >
            {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default SaveConfigurationModal;
