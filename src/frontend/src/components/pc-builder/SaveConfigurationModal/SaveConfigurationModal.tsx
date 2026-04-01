import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Modal } from '../../ui/Modal/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useToastStore } from '../../../store/toastStore';
import apiClient from '../../../api/client';
import type { PCBuilderSelectedState } from '../../../hooks';
import styles from './SaveConfigurationModal.module.css';

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

  const showToast = useToastStore((state) => state.showToast);

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
      return { label: 'Нет компонентов', className: styles.statusNeutral };
    }
    if (compatibilityErrors.length > 0) {
      return { label: `Ошибки: ${compatibilityErrors.length}`, className: styles.statusError };
    }
    if (compatibilityWarnings.length > 0) {
      return { label: `Предупреждения: ${compatibilityWarnings.length}`, className: styles.statusWarning };
    }
    return { label: 'Все совместимо', className: styles.statusSuccess };
  };

  const compatibilityStatus = getCompatibilityStatus();
  const canSave = selectedCount > 0 && !saveMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Сохранить сборку"
      size="small"
      className={styles.modal}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Название сборки */}
        <div className={styles.field}>
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
        <div className={styles.field}>
          <label className={styles.label} htmlFor="purpose-select">
            Назначение
          </label>
          <select
            id="purpose-select"
            className={styles.select}
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
        <div className={styles.summary}>
          <h3 className={styles.summaryTitle}>Сводка сборки</h3>

          <div className={styles.summaryGrid}>
            {/* Компонентов */}
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Компонентов</span>
              <span className={styles.summaryValue}>
                {selectedCount}/{totalCount}
              </span>
            </div>

            {/* Совместимость */}
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Совместимость</span>
              <span className={`${styles.summaryValue} ${compatibilityStatus.className}`}>
                {compatibilityStatus.label}
              </span>
            </div>

            {/* Цена */}
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Стоимость</span>
              <span className={`${styles.summaryValue} ${styles.price}`}>
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>

          {/* Детали ошибок/предупреждений */}
          {(compatibilityErrors.length > 0 || compatibilityWarnings.length > 0) && (
            <div className={styles.compatibilityDetails}>
              {compatibilityErrors.map((err, i) => (
                <p key={`err-${i}`} className={styles.errorDetail}>
                  ✕ {err}
                </p>
              ))}
              {compatibilityWarnings.map((warn, i) => (
                <p key={`warn-${i}`} className={styles.warningDetail}>
                  ⚠ {warn}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Действия */}
        <div className={styles.actions}>
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
