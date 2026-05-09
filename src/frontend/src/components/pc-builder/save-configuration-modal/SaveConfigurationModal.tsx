import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal } from '../../ui/Modal/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useToast } from '../../../hooks/useToast';
import apiClient from '../../../api/client';
import type { PCBuilderSelectedState } from '../../../hooks';

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
  components: Record<string, string>;
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

  /** Формируем components map для API (несколько ОЗУ/накопителей — id через запятую). */
  const buildComponentsMap = useCallback((): Record<string, string> => {
    const map: Record<string, string> = {};
    const s = selectedComponents;
    if (s.cpu) map.cpu = s.cpu.product.id;
    if (s.gpu) map.gpu = s.gpu.product.id;
    if (s.motherboard) map.motherboard = s.motherboard.product.id;
    if (s.psu) map.psu = s.psu.product.id;
    if (s.case) map.case = s.case.product.id;
    if (s.cooling) map.cooling = s.cooling.product.id;
    if (s.ram.length > 0) map.ram = s.ram.map((r) => r.product.id).join(',');
    if (s.storage.length > 0) map.storage = s.storage.map((x) => x.product.id).join(',');
    return map;
  }, [selectedComponents]);

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
      name: trimmedName,
      purpose,
      components: buildComponentsMap(),
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
      return { label: 'Нет компонентов', className: 'text-[var(--fg-secondary)]' };
    }
    if (compatibilityErrors.length > 0) {
      return { label: `Ошибки: ${compatibilityErrors.length}`, className: 'text-[var(--error)]' };
    }
    if (compatibilityWarnings.length > 0) {
      return { label: `Предупреждения: ${compatibilityWarnings.length}`, className: 'text-[#fbbf24]' };
    }
    return { label: 'Все совместимо', className: 'text-[#4ade80]' };
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
          <label className="flex items-center gap-1 text-xs font-medium text-[var(--fg-secondary)] uppercase tracking-wider" htmlFor="purpose-select">
            Назначение
          </label>
          <select
            id="purpose-select"
            className="w-full px-3.5 py-2.5 font-inherit text-[0.95rem] text-[var(--fg-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-md outline-none cursor-pointer transition-colors appearance-none"
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
        <div className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-md p-4">
          <h3 className="m-0 mb-3 text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">Сводка сборки</h3>

          <div className="flex flex-col gap-2 divide-y divide-[var(--border-default)]">
            {/* Компонентов */}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs text-[var(--fg-secondary)]">Компонентов</span>
              <span className="text-[0.95rem] font-semibold text-[var(--fg-primary)]">
                {selectedCount}/{totalCount}
              </span>
            </div>

            {/* Совместимость */}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs text-[var(--fg-secondary)]">Совместимость</span>
              <span className={`text-[0.95rem] font-semibold ${compatibilityStatus.className}`}>
                {compatibilityStatus.label}
              </span>
            </div>

            {/* Цена */}
            <div className="flex justify-between items-center py-1.5">
              <span className="text-xs text-[var(--fg-secondary)]">Стоимость</span>
              <span className="text-[1.05rem] font-semibold text-[var(--brand-primary)]">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          {/* Детали ошибок/предупреждений */}
          {(compatibilityErrors.length > 0 || compatibilityWarnings.length > 0) && (
            <div className="mt-3 pt-3 border-t border-[var(--border-default)] flex flex-col gap-1.5">
              {compatibilityErrors.map((err, i) => (
                <p key={`err-${i}`} className="m-0 text-xs leading-normal text-[var(--error)]">
                  ✕ {err}
                </p>
              ))}
              {compatibilityWarnings.map((warn, i) => (
                <p key={`warn-${i}`} className="m-0 text-xs leading-normal text-[#fbbf24]">
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
