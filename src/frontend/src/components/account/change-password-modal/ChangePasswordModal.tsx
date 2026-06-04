import { useState } from 'react';
import { Modal } from '../../ui/Modal/Modal';
import { Button } from '../../ui/Button';
import { useToast } from '../../../hooks/useToast';
import { authService, getAuthErrorMessage } from '../../../api/authService';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Поле ввода пароля с кнопкой показа/скрытия.
 * Input не поддерживает rightIcon, поэтому оборачиваем вручную.
 */
function PasswordField({
  label,
  value,
  onChange,
  error,
  placeholder,
  disabled,
  show,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder: string;
  disabled: boolean;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 font-sans text-xs font-medium uppercase tracking-wider text-body-text mb-1.5">
        {label}
        <span className="text-gold" aria-hidden="true">*</span>
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 pr-11 font-sans text-base text-body-text bg-surface-elevated border border-hairline-dark rounded-md outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-canvas-dark focus:border-gold focus:shadow-[0_0_0_3px_var(--border-brand)] focus:bg-surface-card ${
            error ? 'border-price-rise focus:border-price-rise focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : ''
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-body-text transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 font-sans text-xs text-price-rise mt-1" role="alert">
          <AlertCircle className="flex-shrink-0 w-3.5 h-3.5" aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  );
}

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Введите текущий пароль';
    }
    if (!newPassword) {
      newErrors.newPassword = 'Введите новый пароль';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Минимум 8 символов';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Нужна хотя бы одна заглавная буква';
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = 'Нужна хотя бы одна строчная буква';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Нужна хотя бы одна цифра';
    }
    if (newPassword === currentPassword) {
      newErrors.newPassword = 'Новый пароль должен отличаться от текущего';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });
      showToast('Пароль успешно изменён', 'success');
      handleClose();
    } catch (error) {
      const message = getAuthErrorMessage(error);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Смена пароля" size="small">
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-5">
        {/* Текущий пароль */}
        <PasswordField
          label="Текущий пароль"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            if (errors.currentPassword) setErrors((prev) => ({ ...prev, currentPassword: '' }));
          }}
          error={errors.currentPassword}
          placeholder="Введите текущий пароль"
          disabled={saving}
          show={showCurrent}
          onToggleShow={() => setShowCurrent(!showCurrent)}
        />

        {/* Новый пароль */}
        <PasswordField
          label="Новый пароль"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
          }}
          error={errors.newPassword}
          placeholder="Минимум 8 символов"
          disabled={saving}
          show={showNew}
          onToggleShow={() => setShowNew(!showNew)}
        />

        {/* Подтверждение пароля */}
        <PasswordField
          label="Подтвердите пароль"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
          }}
          error={errors.confirmPassword}
          placeholder="Повторите новый пароль"
          disabled={saving}
          show={showConfirm}
          onToggleShow={() => setShowConfirm(!showConfirm)}
        />

        {/* Password requirements hint */}
        <div className="bg-surface-elevated border border-hairline-dark rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={14} className="text-muted-text" />
            <span className="text-xs font-medium text-muted-text">Требования к паролю:</span>
          </div>
          <ul className="text-xs text-muted-text space-y-1 ml-6 list-disc">
            <li className={newPassword.length >= 8 ? 'text-info-blue' : ''}>Минимум 8 символов</li>
            <li className={/[A-Z]/.test(newPassword) ? 'text-info-blue' : ''}>Заглавная буква (A-Z)</li>
            <li className={/[a-z]/.test(newPassword) ? 'text-info-blue' : ''}>Строчная буква (a-z)</li>
            <li className={/[0-9]/.test(newPassword) ? 'text-info-blue' : ''}>Цифра (0-9)</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={saving}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Изменить пароль'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ChangePasswordModal;
