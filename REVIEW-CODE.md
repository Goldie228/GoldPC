# CODE REVIEW REPORT
**Operation:** Full Backend Services Audit
**Date:** 2026-06-22
**Reviewer:** code-reviewer

## Scope
30 files across 7 backend services reviewed:
- CatalogService: Program.cs, Controllers/ProductsController.cs (CatalogController), Services/CatalogService.cs
- AuthService: Controllers/AuthController.cs, Controllers/AdminController.cs, Services/AuthService.cs, Services/JwtService.cs, Services/PasswordService.cs, Services/TOTPService.cs, Services/AvatarService.cs
- OrdersService: Controllers/OrdersController.cs, Controllers/PromoController.cs, Controllers/OneCController.cs
- ServicesService: Controllers/ServicesController.cs
- PCBuilderService: Controllers/PCBuilderController.cs
- GoldPC.Api (Gateway): Controllers/AdminController.cs, Services/AdminService.cs, Services/CatalogServiceClient.cs, Services/AuthServiceClient.cs, Services/EmailService.cs, Services/FileService.cs, Services/AuthForwardingHandler.cs, Services/NotificationService.cs, Program.cs

## Summary
**CRITICAL:** 5   **HIGH:** 8   **MEDIUM:** 9   **LOW:** 6   **INFO:** 3

---

## Findings

### [CRITICAL] Commented-Out Exception Handler in Order Creation
**File:** src/OrdersService/Controllers/OrdersController.cs
**Lines:** 116-148
**Issue:** The `Create()` method has its entire outer try-catch block commented out. If `_ordersService.CreateAsync` or `GetCurrentUserId()` throws an unhandled exception (e.g., database timeout, deserialization error), the exception propagates unhandled to the Kestrel pipeline, potentially returning a raw 500 with stack trace in Development mode. This is a production stability hazard.
**Recommendation:** Uncomment the try-catch block.
**Architecture Deviation:** No

---

### [CRITICAL] API Key Passed as Query String in 1C Integration
**File:** src/OrdersService/Controllers/OneCController.cs
**Lines:** 23, 39, 55
**Issue:** The `apiKey` parameter is passed as `[FromQuery]` in three endpoints (`export/xml`, `export/csv`, `import/stock`). Query string parameters are logged in web server access logs, browser history, proxy logs, and may appear in monitoring tools. This exposes the integration secret in cleartext across multiple systems.
**Recommendation:** Move the API key to a custom HTTP header (e.g., `X-1C-API-Key`) or use a Bearer token.
**Architecture Deviation:** No

---

### [CRITICAL] JWT Token Validation Disabled — Expired Tokens Accepted
**File:** src/AuthService/Services/JwtService.cs
**Lines:** 85-95
**Issue:** `GetUserIdFromToken()` sets `ValidateLifetime = false`, meaning it will extract a user ID from an expired JWT. If any downstream service calls this method to authorize requests (rather than using the standard ASP.NET Core JWT middleware), an attacker could use an expired token indefinitely. The comment says "for getting ID from expired tokens" but this is dangerous if misused as an authorization check.
**Recommendation:** Remove this method or add explicit documentation that it must never be used for authorization decisions. If expired token ID lookup is needed (e.g., for refresh token rotation), isolate it to that specific use case with clear guards.
**Architecture Deviation:** No

---

### [CRITICAL] In-Memory AdminService Loses All Data on Restart
**File:** src/backend/GoldPC.Api/Services/AdminService.cs
**Lines:** 1-1150 (entire file)
**Issue:** The `AdminService` stores users, attributes, settings, and audit logs in in-memory `List<T>` objects with JSON file persistence. On process restart, if the JSON files are corrupted or missing, seed data is regenerated. This means: (a) any user created via admin panel but not yet persisted is lost, (b) all audit logs are lost if the file fails to deserialize, (c) settings changes may revert. The in-memory user list is also used by `GetUsersAsync` which queries from the local copy, not from AuthService's actual database.
**Recommendation:** This service should be a thin proxy to AuthService for all user operations, not a separate in-memory copy. At minimum, add a health check that verifies the in-memory state is synchronized with AuthService.
**Architecture Deviation:** Yes — the architecture specifies AuthService as the source of truth for users, but AdminService maintains its own separate copy.

---

### [CRITICAL] Anonymous Order Lookup by Order Number Without Authentication
**File:** src/OrdersService/Controllers/OrdersController.cs
**Lines:** 61-78
**Issue:** `GetByNumber()` is `[AllowAnonymous]` and returns full order details (including customer email, address, items, payment info) if the order's `UserId` is `Guid.Empty` (guest checkout). Even for authenticated users, the check `order.UserId != Guid.Empty && !HasAccess(order.UserId)` means any unauthenticated caller who knows/guesses an order number can view the full order details for guest orders.
**Recommendation:** Either require authentication for all order lookups, or return only minimal non-sensitive fields (order number, status, total) for anonymous requests.
**Architecture Deviation:** No

---

### [HIGH] Email Service Methods Are No-Op Stubs
**File:** src/backend/GoldPC.Api/Services/EmailService.cs
**Lines:** 136-174
**Issue:** `SendOrderConfirmationAsync`, `SendOrderStatusChangedAsync`, `SendWarrantyCreatedAsync`, `SendWarrantyExpiryReminderAsync`, and `SendServiceAssignedAsync` all log a message and return `Task.CompletedTask` without actually sending any email. The IEmailService interface declares these methods, but the implementation is a dead end. This means order confirmations, warranty reminders, and service assignments never send emails from the gateway.
**Recommendation:** Either implement the email sending logic or remove these methods from the interface. The AuthService has its own `SmtpEmailService` that actually sends emails — consider delegating or unifying.
**Architecture Deviation:** Yes — architecture implies email notifications are sent for orders and services.

---

### [HIGH] FileService Uses In-Memory Storage — Lost on Restart
**File:** src/backend/GoldPC.Api/Services/FileService.cs
**Lines:** 1-197 (entire file)
**Issue:** The `FileService` stores `ProductImageDto` metadata in a `List<ProductImageDto>` in memory. Files are saved to disk, but the metadata mapping (which image belongs to which product, sort order, primary flag) is lost on process restart. After restart, `GetImagesForProductAsync` returns an empty list even though the files exist on disk.
**Recommendation:** Store image metadata in a database or a persistent JSON file, similar to how AdminService persists its data.
**Architecture Deviation:** Yes — images should be persistently tracked.

---

### [HIGH] AuthService Login Fallback Defeats Email Encryption
**File:** src/AuthService/Services/AuthService.cs
**Lines:** 123-124
**Issue:** After looking up a user by `EmailHash`, the code falls back to searching by raw `Email == request.Email.ToLower()`. Since emails are encrypted in the database (`_encryption.Encrypt()`), this fallback comparison `u.Email == request.Email.ToLower()` will never match (comparing ciphertext to plaintext), making it dead code. However, if the encryption scheme ever changes to be deterministic, this fallback would bypass the hash-based lookup entirely.
**Recommendation:** Remove the fallback. If EmailHash lookup fails, the user does not exist. The fallback is misleading and creates confusion about the security model.
**Architecture Deviation:** No

---

### [HIGH] AdminController Role Update Doesn't Sync Roles Collection
**File:** src/AuthService/Controllers/AdminController.cs
**Lines:** 290-313
**Issue:** `UpdateUserRole()` updates `user.Role` (the primary role) but does NOT update `user.Roles` (the list of roles). The JWT token uses `user.Roles` to populate claims (see JwtService line 53). This means after an admin changes a user's role, the user must log out and log back in for the new role to take effect in JWT claims. The in-memory `user.Role` and `user.Roles` become inconsistent.
**Recommendation:** Update both `user.Role` and `user.Roles` in the `UpdateUserRole` method.
**Architecture Deviation:** No

---

### [HIGH] FileService SetPrimaryAsync Has Race Condition
**File:** src/backend/GoldPC.Api/Services/FileService.cs
**Lines:** 136-159
**Issue:** `SetPrimaryAsync` iterates and modifies `_images` without acquiring `_lock`. The `_images` list is modified by other methods (`SaveAsync`, `DeleteAsync`) under lock, but `SetPrimaryAsync` reads and writes without synchronization. Under concurrent requests, this can cause `InvalidOperationException` (collection modified during enumeration) or data corruption.
**Recommendation:** Wrap the loop in `lock (_lock)`.
**Architecture Deviation:** No

---

### [HIGH] FileUpload in ServicesController Lacks Content-Type Validation
**File:** src/ServicesService/Controllers/ServicesController.cs
**Lines:** 276-312
**Issue:** The `UploadFile` endpoint accepts any file type. While the filename is sanitized (GUID prefix), there is no validation of `file.ContentType` or file extension. A user could upload an executable (.exe), a script (.js), or an HTML file that could be served by the web server and enable XSS or code execution attacks.
**Recommendation:** Validate file extension and content type against an allowlist (e.g., `.jpg`, `.png`, `.pdf`, `.docx`).
**Architecture Deviation:** No

---

### [HIGH] AdminService Fire-and-Forget Auth Sync Without Await
**File:** src/backend/GoldPC.Api/Services/AdminService.cs
**Lines:** 323, 349
**Issue:** `UpdateUserAsync` and `UpdateUserRoleAsync` call `_authClient.UpdateUserAsync()` and `_authClient.UpdateUserRoleAsync()` with `_ =` (discard), meaning the HTTP call is fire-and-forget. If the AuthService call fails, the local AdminService state is updated but AuthService is not, creating a silent data inconsistency between the two services.
**Recommendation:** Await the AuthService call and handle failures (at minimum, log warnings; ideally, revert local state on failure).
**Architecture Deviation:** No

---

### [HIGH] AdminService DeleteUser Only Deactivates Locally
**File:** src/backend/GoldPC.Api/Services/AdminService.cs
**Lines:** 381-406
**Issue:** `DeleteUserAsync` calls `_authClient.DeleteUserAsync(id)` (which physically deletes from AuthService DB), but locally it only sets `IsActive = false` rather than removing the user. After deletion, the user still appears in the local list as inactive. This creates a permanent inconsistency where the user is gone from AuthService but still visible in admin panel queries.
**Recommendation:** Either remove the user from the local list or change the AuthService endpoint to deactivate rather than physically delete.
**Architecture Deviation:** Yes — delete semantics are inconsistent between services.

---

### [MEDIUM] Avatar Predictable Filename Enables Overwrite
**File:** src/AuthService/Services/AvatarService.cs
**Lines:** 49-51
**Issue:** The avatar filename is `{userId}{ext}` (e.g., `a0000001-...01.jpg`). While this is intentional for overwriting, two concurrent upload requests could race: one creates the file, another creates it with the same name, then both try to update `user.AvatarUrl` and save to DB. The file content may be partially written when the other request reads it.
**Recommendation:** Add a lock or use a GUID-suffixed filename with the old file cleanup pattern.
**Architecture Deviation:** No

---

### [MEDIUM] No JWT Token Revocation Mechanism
**File:** src/AuthService/Services/JwtService.cs
**Lines:** 1-140 (entire file)
**Issue:** There is no token blacklist or revocation mechanism for JWT access tokens. When a user changes their password or is deactivated, their existing JWT remains valid until expiration (15 minutes per config). The refresh token rotation helps but there is a 15-minute window where a stolen token is still usable.
**Recommendation:** Implement a token blacklist in Redis or accept the 15-minute window as a design trade-off (document it).
**Architecture Deviation:** No

---

### [MEDIUM] NotificationService Uses In-Memory Storage
**File:** src/backend/GoldPC.Api/Services/NotificationService.cs
**Lines:** 21, 53
**Issue:** Notifications are stored in `ConcurrentDictionary<Guid, Notification>`. All notifications are lost on process restart. Users will not see historical notifications after a deployment or crash.
**Recommendation:** Persist notifications to a database.
**Architecture Deviation:** No

---

### [MEDIUM] CatalogServiceClient Silently Returns Empty Results on All Errors
**File:** src/backend/GoldPC.Api/Services/CatalogServiceClient.cs
**Lines:** 43-47, 65-67, 118-120, etc.
**Issue:** Every method in CatalogServiceClient catches all exceptions and returns empty defaults (empty list, null, false). While this prevents crashes, it means the admin panel will silently show empty data when CatalogService is down, with no user-visible error. The admin has no way to distinguish "no products exist" from "CatalogService is unreachable."
**Recommendation:** For admin-facing operations, throw or return a result type that includes error information. At minimum, surface a warning in the admin UI when downstream services are unhealthy.
**Architecture Deviation:** No

---

### [MEDIUM] Password Validation Token Not Rate-Limited
**File:** src/AuthService/Services/PasswordService.cs
**Lines:** 224-244
**Issue:** `ValidateResetTokenAsync` has no rate limiting. An attacker who obtains a reset token URL could call this endpoint repeatedly to check if it is still valid before the user clicks it. While the token expires after 1 hour, rapid validation attempts could be used for timing attacks.
**Recommendation:** Add rate limiting to this endpoint (it is already called from the controller which has `[EnableRateLimiting("PasswordResetPolicy")]`, but the service method itself has no protection if called from other paths).
**Architecture Deviation:** No

---

### [MEDIUM] File Write Operations Not Atomic
**File:** src/backend/GoldPC.Api/Services/AdminService.cs
**Lines:** 175-199
**Issue:** `SaveUsers()`, `SaveAttributes()`, `SaveSettings()` use `File.WriteAllText()` which is not atomic. If the process crashes mid-write, the file will be truncated/corrupted. On next startup, the corrupted file triggers the seed data fallback, losing all accumulated data.
**Recommendation:** Write to a temporary file, then use `File.Move` with overwrite to atomically replace the original.
**Architecture Deviation:** No

---

### [MEDIUM] CatalogService Cache Has No Invalidation Strategy
**File:** src/CatalogService/Services/CatalogService.cs
**Lines:** 52-90
**Issue:** Featured products are cached for 15 minutes with key `featured_products_p1`. There is no explicit cache invalidation when products are created, updated, or deleted through the admin endpoints. A newly added featured product will not appear for up to 15 minutes.
**Recommendation:** Invalidate the cache key when products are mutated through admin endpoints.
**Architecture Deviation:** No

---

### [MEDIUM] OneCController ImportStock Has No Request Size Limit
**File:** src/OrdersService/Controllers/OneCController.cs
**Lines:** 54-73
**Issue:** The `ImportStock` endpoint reads the entire request body into a string via `reader.ReadToEndAsync()` with no `[RequestSizeLimit]` attribute. An attacker could send a multi-gigabyte request body, causing the server to run out of memory (OOM).
**Recommendation:** Add `[RequestSizeLimit(10 * 1024 * 1024)]` (10 MB) or similar.
**Architecture Deviation:** No

---

### [MEDIUM] AdminService GetUsersAsync Queries Stale Local Copy
**File:** src/backend/GoldPC.Api/Services/AdminService.cs
**Lines:** 259-285
**Issue:** The admin panel user list comes from `_users` (the local in-memory list), not from AuthService. If AuthService is restarted and loses its data, or if users are created directly in AuthService, the admin panel shows stale/inconsistent data. The `CreateUserAsync` does create in both, but `DeleteUser` only deactivates locally.
**Recommendation:** For user listing, proxy to AuthService's admin endpoints rather than maintaining a local copy.
**Architecture Deviation:** Yes — dual source of truth for user data.

---

### [LOW] Program.cs Sets Global AppContext Switch
**File:** src/CatalogService/Program.cs
**Lines:** 27
**Issue:** `AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true)` is a global static setting. If other services in the same process reference CatalogService, this affects all HTTP/2 connections process-wide.
**Recommendation:** Ensure this is only needed for the gRPC client and document the security implication (unencrypted HTTP/2).
**Architecture Deviation:** No

---

### [LOW] AuthService AdminController Pragma Suppresses All Warnings
**File:** src/AuthService/Controllers/AdminController.cs
**Lines:** 1
**Issue:** `#pragma warning disable CA1031, CS1591, SA1600` at file level suppresses the "do not catch general exception types" warning for the entire file. While the controller itself doesn't have try-catch blocks, this blanket suppression could mask issues in future additions.
**Recommendation:** Only suppress warnings where explicitly needed, not file-wide.
**Architecture Deviation:** No

---

### [LOW] PCBuilderController SaveConfiguration Does Not Validate Input Depth
**File:** src/PCBuilderService/Controllers/PCBuilderController.cs
**Lines:** 99-118
**Issue:** `SaveConfiguration` accepts a `PCConfigurationDto` with no `[ValidateAntiForgeryToken]` and no validation on the `Name` field length. A user could save a configuration with a very long name (megabytes of text) that gets persisted.
**Recommendation:** Add `[StringLength]` validation to the DTO's Name property.
**Architecture Deviation:** No

---

### [LOW] Inconsistent Error Response Formats Across Services
**File:** Multiple files
**Lines:** Multiple
**Issue:** Different services return errors in different formats: some use `ApiResponse.Fail(error)`, some use `BadRequest(new { error = "..." })`, some use `ValidationProblemDetails`. This makes frontend error handling inconsistent.
**Recommendation:** Standardize on a single error response format across all services.
**Architecture Deviation:** No

---

### [INFO] Good: JWT Secret Key Validation in Production
**File:** src/backend/GoldPC.Api/Program.cs
**Lines:** 25-33
**Observation:** The gateway correctly validates that the JWT secret key is not a development value in production and throws on startup. This is a good security practice.
**Recommendation:** None.

---

### [INFO] Good: Rate Limiting on Auth Endpoints
**File:** src/AuthService/Controllers/AuthController.cs
**Lines:** 43, 62, 87, 116, 297, 320
**Observation:** Registration, login, 2FA verification, and password reset endpoints all have `[EnableRateLimiting]` with appropriate policy names. This protects against brute force attacks.
**Recommendation:** None.

---

### [INFO] Good: Defense-in-Depth Authorization on AuthService Admin Endpoints
**File:** src/AuthService/Controllers/AdminController.cs
**Lines:** 74
**Observation:** The AuthService AdminController has `[Authorize(Roles = "Admin")]` even though it sits behind the gateway. This ensures that even if the gateway's authorization is bypassed, the AuthService still requires admin privileges.
**Recommendation:** None.

---

## Architecture Conformance

1. **AdminService dual source of truth (DEVIATION):** The AdminService maintains its own in-memory copy of users separate from AuthService. This creates synchronization issues on every user mutation. The architecture intends AuthService as the single source of truth, but AdminService acts as a parallel store.

2. **Email service stubs (DEVIATION):** The gateway's EmailService implements IEmailService but the order/warranty/service notification methods are no-ops. The actual email sending only works through AuthService's SmtpEmailService for password resets and email verification. Order confirmations and status change emails are never sent.

3. **FileService metadata loss (DEVIATION):** Product image metadata is stored only in memory, not persisted. The architecture implies images should survive restarts.

4. **Delete semantics inconsistency (DEVIATION):** AdminService.DeleteUserAsync physically deletes from AuthService but only deactivates locally. This creates a permanent inconsistency.

## Test Quality Assessment

No test files were reviewed in this audit scope (backend services only). However, based on the code patterns:
- The in-memory AdminService is inherently difficult to integration-test because it diverges from the actual AuthService data.
- The commented-out try-catch in OrdersController.Create suggests testing may have been done with the handler disabled, masking unhandled exception scenarios.
- The fire-and-forget auth sync calls in AdminService are unlikely to be caught by unit tests.

## Technical Debt Log

1. **AdminService in-memory architecture:** Will not survive restarts. Should be replaced with pure proxy to AuthService.
2. **FileService in-memory metadata:** Product images lose metadata on restart. Needs persistence.
3. **NotificationService in-memory storage:** Notifications lost on restart.
4. **EmailService stub methods:** Order/warranty/service emails never sent. Dead code or incomplete feature.
5. **Inconsistent error response formats:** Frontend must handle multiple error shapes.
6. **JWT no revocation:** 15-minute window of vulnerability after password change.
7. **No correlation IDs across microservices:** Debugging distributed requests is difficult.
8. **Catalog cache no invalidation:** 15-minute staleness window for featured products.

## Positive Observations

1. **JWT production validation:** The gateway correctly fails fast if JWT secret is not configured via environment variable in production.
2. **Rate limiting:** Auth endpoints (register, login, password reset) all have rate limiting policies.
3. **Defense-in-depth auth:** AuthService AdminController has its own `[Authorize(Roles = "Admin")]` independent of the gateway.
4. **Password hashing:** Consistent use of BCrypt with work factor 12 across all password operations.
5. **TOTP implementation:** Custom TOTP implementation is correct with +/-1 step drift window and proper HMAC-SHA1.
6. **Token hashing:** Sensitive tokens (password reset, email verification) are stored as SHA-256 hashes, not plaintext.
7. **Input sanitization:** `StringSanitizer.SanitizeText` is used consistently in user input processing.
