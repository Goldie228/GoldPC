import { useEffect, useState } from 'react';
import { XMarkIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { Notification, NotificationPriority } from '../../hooks/useNotifications';

interface ToastProps {
  notification: Notification;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem('notification_sound') !== 'false');

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getBackgroundColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.Critical: return 'bg-red-600';
      case NotificationPriority.High: return 'bg-orange-500';
      case NotificationPriority.Medium: return 'bg-yellow-500';
      case NotificationPriority.Low: return 'bg-blue-500';
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notification_sound', String(newValue));
  };

  return (
    <div className={`${getBackgroundColor(notification.priority)} text-white shadow-lg rounded-lg p-4 max-w-sm w-full flex items-start gap-3 animate-slide-in`}>
      <div className="flex-1">
        <p className="font-semibold">{notification.title}</p>
        <p className="text-sm opacity-90 mt-1">{notification.message}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSound}
          className="p-1 hover:bg-white/20 rounded"
          title={soundEnabled ? 'Mute notifications' : 'Enable notification sound'}
        >
          {soundEnabled ? <SpeakerWaveIcon className="h-4 w-4" /> : <SpeakerXMarkIcon className="h-4 w-4" />}
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {/* Toasts will be rendered here dynamically */}
    </div>
  );
};
