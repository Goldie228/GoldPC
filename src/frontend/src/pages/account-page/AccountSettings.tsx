import { useState } from 'react';
import { Settings, Lock, AlertTriangle } from 'lucide-react';
import { PageHero } from '@/components/ui/PageHero';
import { ChangePasswordModal } from '@/components/account/change-password-modal/ChangePasswordModal';
import { DeleteAccountModal } from '@/components/account/delete-account-modal/DeleteAccountModal';

const sectionClass = 'bg-card rounded-xl p-6 border border-border space-y-4';

/**
 * AccountSettings — страница настроек личного кабинета.
 *
 * Секции: безопасность, опасная зона.
 */
export function AccountSettings() {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHero title="Настройки" icon={Settings} />

      {/* Security */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold text-foreground">Безопасность</h2>

        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center shrink-0">
              <Lock size={20} className="text-muted-foreground" />
            </div>
            <div>
              <div className="text-foreground font-medium">Пароль</div>
              <div className="text-sm text-muted-foreground">
                Изменить пароль аккаунта
              </div>
            </div>
          </div>
          <button
            onClick={() => setPasswordModalOpen(true)}
            className="bg-elevated text-foreground px-4 py-2 rounded-lg text-sm transition-colors hover:bg-elevated/80 shrink-0"
          >
            Изменить
          </button>
        </div>

        {/* Password requirements hint */}
        <div className="bg-elevated rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Требования к паролю:
            </span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc ml-5">
            <li>Минимум 8 символов</li>
            <li>Заглавная буква (A-Z)</li>
            <li>Строчная буква (a-z)</li>
            <li>Цифра (0-9)</li>
          </ul>
        </div>
      </div>

      {/* Danger Zone */}
      <div className={sectionClass}>
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">
            Опасная зона
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          После удаления аккаунта все данные будут безвозвратно удалены. Это
          действие нельзя отменить.
        </p>
        <button
          onClick={() => setDeleteModalOpen(true)}
          className="bg-destructive text-white px-6 py-2.5 rounded-lg font-medium hover:bg-destructive/90 transition-colors"
        >
          Удалить аккаунт
        </button>
      </div>

      {/* Change password modal */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />

      {/* Delete account modal */}
      <DeleteAccountModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
