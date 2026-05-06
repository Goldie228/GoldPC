import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className="text-sm text-muted-foreground mb-4" aria-label="Хлебные крошки">
      <ol className="flex flex-wrap items-center gap-1 list-none m-0 p-0">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="text-muted-foreground/70 select-none" size={14} aria-hidden />
              )}
              {isLast || !item.to ? (
                <span className="text-foreground font-medium max-w-[42ch] overflow-hidden text-ellipsis whitespace-nowrap" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link className="text-muted-foreground no-underline rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-primary focus-visible:outline-offset-2" to={item.to}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
