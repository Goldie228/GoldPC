/**
 * ToggleSwitch — Shared reusable toggle switch component
 *
 * Used in SettingsPage (admin) and NotificationsPage (account).
 * Generic: `name` is typed as `string` to work with any settings interface.
 */

interface ToggleSwitchProps {
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  description?: string;
}

export function ToggleSwitch({ name, checked, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="pr-4">
        <div className="text-sm font-medium text-body-text">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </div>
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          name={name}
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
          aria-label={label}
        />
        <div className="w-11 h-6 bg-surface-elevated rounded-full peer peer-checked:bg-gold peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-gold transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
      </label>
    </div>
  );
}
