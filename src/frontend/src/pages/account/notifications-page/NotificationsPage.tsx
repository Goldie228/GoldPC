/**
 * NotificationsPage — Страница настройки типов уведомлений пользователя
 *
 * Показывает список типов уведомлений с ToggleSwitch для каждого.
 * Автосохранение при переключении (как в SettingsPage для админа).
 *
 * Стилизация: Tailwind DESIGN.md токены (SectionCard, ToggleSwitch).
 * Загрузка/сохранение: TanStack Query (useQuery / useMutation).
 * Иконки: lucide-react.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { notificationPreferencesApi } from '@/api/notifications';
import type { UserNotificationPreferences } from '@/api/notifications';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { SectionCard } from '@/components/ui/SectionCard';

// 
// Типы уведомлений с описаниями
// 

interface NotificationTypeInfo {
  key: keyof UserNotificationPreferences;
  label: string;
  description: string;
}

const NOTIFICATION_TYPES: NotificationTypeInfo[] = [
  {
    key: 'orderStatusChanged',
    label: 'Изменение статуса заказа',
    description: 'Уведомлять при изменении статуса заказа',
  },
  {
    key: 'lowStockAlert',
    label: 'Низкий остаток товаров',
    description: 'Предупреждать о товарах с низким остатком',
  },
  {
    key: 'loginNotification',
    label: 'Вход с нового устройства',
    description: 'Уведомлять при входе с нового устройства',
  },
  {
    key: 'systemAnnouncement',
    label: 'Системные уведомления',
    description: 'Важные объявления и обновления системы',
  },
  {
    key: 'newSupportMessage',
    label: 'Новые сообщения поддержки',
    description: 'Уведомления о новых сообщениях в тикетах',
  },
];

// 
// Skeleton загрузки
// 

function NotificationsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-surface-card rounded-xl p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-hairline-dark">
            <div className="w-5 h-5 bg-surface-elevated rounded" />
            <div className="h-5 bg-surface-elevated rounded w-40" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="flex items-center justify-between py-3">
                <div className="pr-4 flex-1">
                  <div className="h-4 bg-surface-elevated rounded w-48 mb-1" />
                  <div className="h-3 bg-surface-elevated rounded w-64" />
                </div>
                <div className="w-11 h-6 bg-surface-elevated rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// 
// NotificationsPage
// 

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // ---- загрузка текущих предпочтений ----

  const {
    data: preferences,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: () => notificationPreferencesApi.getPreferences(),
    staleTime: 30_000,
  });

  // ---- мутация автосохранения ----

  const saveMutation = useMutation({
    mutationFn: (data: Partial<UserNotificationPreferences>) =>
      notificationPreferencesApi.updatePreferences(data),
    onSuccess: (result) => {
      queryClient.setQueryData(['notificationPreferences'], result);
      showToast('Настройки уведомлений сохранены', 'success');
    },
    onError: () => {
      showToast('Не удалось сохранить настройки', 'error');
    },
  });

  // ---- обработчик переключения (автосохранение) ----

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const key = name as keyof UserNotificationPreferences;

    // Оптимистичное обновление кэша
    queryClient.setQueryData<UserNotificationPreferences>(
      ['notificationPreferences'],
      (old) => (old ? { ...old, [key]: checked } : old)
    );

    saveMutation.mutate({ [key]: checked });
  };

  // ====== Состояние: загрузка ======

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-dark p-6">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-8">
            <div className="mb-2 h-7 w-56 animate-pulse rounded bg-surface-elevated" />
            <div className="h-4 w-72 animate-pulse rounded bg-surface-elevated" />
          </div>
          <NotificationsSkeleton />
        </div>
      </div>
    );
  }

  // ====== Состояние: ошибка загрузки ======

  if (isError || !preferences) {
    return (
      <div className="min-h-screen bg-canvas-dark p-6">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex flex-col items-center justify-center rounded-xl bg-surface-card p-12 text-center">
            <AlertTriangle className="mb-4 h-12 w-12 text-price-rise" />
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Ошибка загрузки настроек
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Не удалось загрузить настройки уведомлений. Сервис уведомлений временно недоступен.
            </p>
            <button
              onClick={() => refetch()}
              className="rounded-md bg-gold px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-gold-hover"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSaving = saveMutation.isPending;

  // ====== Основной рендер ======

  return (
    <div className="min-h-screen bg-canvas-dark p-6">
      <div className="mx-auto max-w-[1280px]">
        {/* Шапка страницы */}
        <header className="mb-8">
          <h1 className="flex items-center gap-3 text-lg font-semibold text-foreground">
            <Bell className="h-5 w-5 text-gold" />
            Настройки уведомлений
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Управляйте типами уведомлений, которые вы хотите получать
          </p>
        </header>

        {/* Индикатор сохранения */}
        {isSaving && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Сохранение...</span>
          </div>
        )}

        {/* Секция с переключателями */}
        <SectionCard icon={<Bell className="h-5 w-5" />} title="Типы уведомлений">
          <div className="divide-y divide-hairline-dark">
            {NOTIFICATION_TYPES.map((item) => (
              <ToggleSwitch
                key={item.key}
                name={item.key}
                checked={preferences[item.key]}
                onChange={handleToggle}
                label={item.label}
                description={item.description}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default NotificationsPage;
