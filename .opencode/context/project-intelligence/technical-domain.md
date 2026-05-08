<!-- Context: project-intelligence/technical | Priority: critical | Version: 1.1 | Updated: 2026-05-08 -->

# Technical Domain

**Purpose**: Tech stack, architecture, and development patterns for GoldPC project.
**Last Updated**: 2026-05-08

## Quick Reference
**Update Triggers**: Tech stack changes | New patterns | Architecture decisions
**Audience**: Developers, AI agents

## Primary Stack
| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Frontend Framework | React | 19 | Modern UI, hooks-based |
| Build Tool | Vite | 8 | Fast HMR, modern tooling |
| Styling | Tailwind CSS | v4 | Utility-first, design tokens |
| State Management | Zustand | - | Minimalist, TypeScript-ready |
| Data Fetching | TanStack Query | - | Caching, background updates |
| Backend Framework | ASP.NET Core | 8 | High-performance, cross-platform |
| Database | PostgreSQL | 16 | Reliable, feature-rich |
| ORM | EF Core | 8 | Fluent API, migrations |
| Cache | Redis | 7 | Session storage, caching |
| Auth | ASP.NET Core Identity + JWT | - | Secure, standard |
| Real-time | SignalR | - | WebSockets abstraction |
| Testing (Frontend) | Vitest | - | Fast, Vite-native |
| Testing (Backend) | xUnit | - | Standard .NET testing |

## Architecture Pattern
```
Type: Microservices behind API Gateway
Pattern: Frontend (SPA) <-> GoldPC.Api (Gateway) <-> Microservices
Backend: ASP.NET Core 8 microservices
Database per service (PostgreSQL + EF Core)
```

### Why This Architecture?
Микросервисы позволяют независимо масштабировать корзину, каталог и заказы. Gateway (GoldPC.Api) централизует аутентификацию и маршрутизацию.

## Code Patterns

### API Layer (Frontend)
```typescript
// File: src/frontend/src/api/catalog.ts
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@/types';

export function useProducts(filters: ProductFilters) {
  return useQuery<Product[]>({
    queryKey: ['products', filters],
    queryFn: () => fetch(`/api/v1/products?${new URLSearchParams(filters)}`).then(res => {
      if (!res.ok) throw new Error('Ошибка загрузки');
      return res.json();
    }),
  });
}
```
**Key Rules**:
- All requests go through `/api/v1/` (Gateway)
- Use TanStack Query (never `useEffect + fetch`)
- Type responses with `@/types`

### Component Pattern
```tsx
// File: src/frontend/src/components/catalog/ProductCard.tsx
import { Card, Button } from '@/components/ui';
import type { Product } from '@/types';

export const ProductCard = ({ product }: { product: Product }) => {
  return (
    <Card className="p-lg">
      <h3 className="text-xl font-semibold text-primary">{product.name}</h3>
      <p className="text-muted-foreground">{product.description}</p>
      <Button variant="primary">В корзину</Button>
    </Card>
  );
};
```
**Key Rules**:
- Strict prop typing (never `any`)
- Use only `components/ui/` primitives
- Tailwind tokens only (`text-primary`, `p-lg`)

## Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase.tsx | `ProductCard.tsx` |
| Hooks | camelCase (use*) | `useProducts.ts` |
| API Controllers | PascalCaseController.cs | `ProductsController.cs` |
| Endpoints | kebab-case | `/api/v1/product-categories` |
| Styles | Utility-first (Tailwind) | `className="text-xl p-lg"` |

## Code Standards
- TypeScript strict mode
- Zod for all frontend validations
- react-hook-form + zod for forms
- Zustand for global state (minimal usage)
- TanStack Query for async (no `useEffect + fetch`)
- **No `any` types** — strict typing required
- No dead code (unused imports, vars, comments)
- **Styling ONLY via Tailwind tokens** (see `index.css @theme`)
- **Never edit `components/ui/` without approval**

## Security Requirements
- Backend validation: FluentValidation
- Frontend validation: Zod schemas
- Password hashing: bcrypt (cost >= 12)
- JWT: Access (15 min) + Refresh (7 days)
- CORS: Trusted origins only
- HTTPS/TLS 1.2+ required
- SQL Injection protection: EF Core parameterized queries
- Content Security Policy headers
- Audit: Critical ops (orders, user rights)

## 📂 Codebase References
**API Layer**: `src/frontend/src/api/` - TanStack Query patterns
**Components**: `src/frontend/src/components/` - UI primitives + features
**Types**: `src/frontend/src/types/` - TypeScript definitions
**Backend Gateway**: `src/backend/GoldPC.Api/` - API routing
**Config**: `package.json`, `vite.config.ts`, `tailwind.config.js`

## Related Files
- `business-domain.md` - Business context
- `business-tech-bridge.md` - Business to tech mapping
- `decisions-log.md` - Architecture decisions
- `living-notes.md` - Active issues
