import type { LucideIcon } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeroProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  icon?: LucideIcon;
}

/**
 * PageHero — стандартный заголовок страницы.
 * Использует дизайн-токены (bg-card, text-foreground, text-muted-foreground).
 * Без breadcrumb (используется существующий Breadcrumbs).
 * Просто контейнер для h1 + description + опциональная иконка.
 */
export function PageHero({ title, description, icon: Icon }: PageHeroProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 mb-6">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
            <Icon size={24} className="text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
