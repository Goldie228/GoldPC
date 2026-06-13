/**
 * SectionCard — Shared reusable section card with icon and title
 *
 * Used in SettingsPage (admin) and NotificationsPage (account).
 * Supports optional `warning` prop for error/danger state styling.
 */

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  warning?: boolean;
}

export function SectionCard({ icon, title, children, warning }: SectionCardProps) {
  return (
    <div className="bg-surface-card rounded-xl p-6">
      <div className="flex items-center gap-3 pb-4 mb-5 border-b border-hairline-dark">
        <span className={warning ? 'text-price-rise' : 'text-gold'}>{icon}</span>
        <h2 className={`text-base font-semibold ${warning ? 'text-price-rise' : 'text-body-text'}`}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
