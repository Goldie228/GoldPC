import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/ui/Modal/Modal';
import { Button } from '@/ui/Button';
import { useToast } from '@/hooks/useToast';
import apiClient from '@/api/client';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONFIRM_TEXT = 'УДАЛИТЬ';

/**
 * DeleteAccountModal — модальное окно подтверждения удаления аккаунта.
 *
 * Пользователь должен ввести слово "УДАЛИТЬ" для активации кнопки.
 * После подтверждения отправляется DELETE /api/v1/account.
 */
const styles = `.modal--no-header-line .modal__header { border-bottom: none; }`;

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const isConfirmValid = confirmInput === CONFIRM_TEXT;

  const handleClose = () => {
    setConfirmInput('');
    onClose();
  };

  const handleDelete = async () => {
    if (!isConfirmValid) return;

    setSaving(true);
    try {
      await apiClient.delete('/api/v1/account');
      showToast('Аккаунт удалён', 'success');
      handleClose();
      window.location.href = '/';
    } catch (error) {
      const message =
        error != null && typeof error === 'object' && 'response' in error
          ? ((error as { response: { data?: { message?: string } } }).response?.data?.message ?? 'Ошибка при удалении аккаунта')
          : 'Ошибка при удалении аккаунта';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <Modal isOpen={isOpen} onClose={handleClose} title="" size="small" className="modal--no-header-line">
      <div className="flex flex-col gap-5">
        {/* Header with icon */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle size={22} className="text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Удаление аккаунта
          </h3>
        </div>

        {/* Warning text */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          Это действие <strong className="text-foreground">необратимо</strong>. Все ваши данные (заявки, история, профиль) будут безвозвратно удалены.
        </p>

        {/* Confirmation input */}
        <div>
          <label
            htmlFor="delete-confirm"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Введите <strong className="text-destructive">{CONFIRM_TEXT}</strong> для подтверждения
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder={CONFIRM_TEXT}
            disabled={saving}
            className="w-full bg-elevated border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-destructive focus:ring-1 focus:ring-destructive outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={saving}>
            Отмена
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={!isConfirmValid || saving}
            onClick={() => void handleDelete()}
          >
            {saving ? 'Удаление...' : 'Удалить аккаунт'}
          </Button>
        </div>
      </div>
      </Modal>
    </>
  );
}

export default DeleteAccountModal;
