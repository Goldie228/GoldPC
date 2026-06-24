# BUILD NOTES: Service Request & Product Reviews Bug Fix
**Builder:** frontend-builder
**Sub-objective:** Bug fixes for service requests and product reviews
**Date:** 2026-06-22

## Implementation Status
| File | Status | Reason |
|------|--------|--------|
| `src/frontend/vite.config.ts` | MODIFIED | Added uppercase and lowercase proxy entries for `/api/v1/Services` and `/api/v1/[Cc]atalog` |
| `docker/nginx/nginx.conf` | MODIFIED | Changed catalog and services locations to case-insensitive regex matching |

## Root Cause Analysis

### Bug 1 & 3: Service request "Не удалось загрузить список услуг"
The generated OpenAPI client in `src/frontend/src/api/generated/api.ts` constructs URLs with uppercase paths like `/api/v1/Services/types`. The Vite dev proxy only had a lowercase entry `/api/v1/services`, so case-sensitive matching rejected the request. In Docker, nginx had the same lowercase-only issue.

### Bug 2: Reviews not working on product page
The generated API constructs URLs like `/api/v1/Catalog/Products/{id}/reviews` with uppercase `C`. The Vite dev proxy had NO entry for `/api/v1/catalog` at all, so all catalog review requests failed in development. In Docker, nginx only matched lowercase `/api/v1/catalog/`.

## Fixes Applied

### 1. Vite proxy (`src/frontend/vite.config.ts`)
Added three new proxy entries:
- `/api/v1/Services` -> `http://localhost:5003` (ServicesService, uppercase variant)
- `/api/v1/catalog` -> `http://localhost:5001` (CatalogService, lowercase)
- `/api/v1/Catalog` -> `http://localhost:5001` (CatalogService, uppercase)

### 2. Nginx (`docker/nginx/nginx.conf`)
Changed 4 location blocks from exact prefix to case-insensitive regex:
- `location /api/v1/catalog/` -> `location ~ ^/api/v1/[Cc]atalog/` (2 blocks: HTTP + HTTPS servers)
- `location /api/v1/services/` -> `location ~ ^/api/v1/[Ss]ervices/` (2 blocks: HTTP + HTTPS servers)

Changed `proxy_pass` to remove trailing slash for regex locations (nginx regex locations require this to preserve the original URI).

## API Integration Points
- `GET /api/v1/Services/types` - generates `/Services/types` (uppercase S, was failing)
- `GET /api/v1/Catalog/Products/{id}/reviews` - generates `/Catalog/Products/{id}/reviews` (uppercase C, was failing)
- `POST /api/v1/Catalog/Products/{id}/reviews` - same pattern
- `PUT /api/v1/Catalog/Reviews/{id}` - same pattern
- `DELETE /api/v1/Catalog/Reviews/{id}` - same pattern

## Deviations from Architecture
None. The frontend code (components, hooks, API layer) was already correctly implemented. The issue was purely in the reverse proxy configuration.

## Accessibility Notes
No accessibility changes needed for proxy configuration fixes.

## Browser/Environment Compatibility
- Dev mode (Vite): Fixed via vite.config.ts proxy entries
- Docker/Production: Fixed via nginx.conf regex location blocks

## Wire Points Ready
- Service request form: `ServiceSelector` component loads types via `servicesApi.getServiceTypes()`
- Product reviews: `ReviewSection` component loads/manages reviews via `useCatalog()` hook
- All review CRUD operations (add, update, delete, toggle helpful) wired through catalog API

## Known Issues
- The generated OpenAPI client uses uppercase paths (`/Services/types`, `/Catalog/Products/...`) while the actual controllers use lowercase (`/api/v1/catalog`). This mismatch is the root cause. Consider regenerating the OpenAPI client with lowercase path names.
- The HTTPS server block in nginx adds a trailing slash to `proxy_pass` for prefix locations (e.g., `proxy_pass http://backend_services/;`) which strips the `/api/v1` prefix before forwarding to the backend. Verify that the backend services expect paths without the `/api/v1` prefix when accessed through nginx.
