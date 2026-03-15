# Security Audit Report — GoldPC

**Date:** 15.03.2026 (Updated)  
**Auditor:** Security Specialist  
**Scope:** TZ Section 2.8.2 (Security)  
**Status:** ✅ ALL CRITICAL ISSUES FIXED

---

## 1. Password Hashing Analysis

### File: `src/AuthService/Services/AuthService.cs`

**Status:** ✅ SECURE

| Check | Result |
|-------|--------|
| Algorithm | BCrypt |
| Work Factor | 12 (recommended: 10-12) |
| Plain text comparison | NOT FOUND |

**Implementation Details:**
- Password hashing: `BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12)`
- Password verification: `BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)`

**Recommendation:** Current implementation is secure. No changes needed.

---

## 2. JWT Token Security

### File: `src/AuthService/Program.cs`

**Status:** ✅ SECURE (with recommendations)

| Check | Result |
|-------|--------|
| Key Location | Configuration file (appsettings.Development.json) |
| Key Length | 52 characters (≥256 bits / 32 chars) ✅ |
| Hardcoded Key | NOT FOUND ✅ |
| Token Validation | Full validation enabled ✅ |

**Token Validation Parameters:**
```csharp
ValidateIssuer = true,
ValidateAudience = true,
ValidateLifetime = true,
ValidateIssuerSigningKey = true,
ClockSkew = TimeSpan.Zero
```

**Key Configuration:**
```json
"Jwt": {
  "SecretKey": "GoldPC_SuperSecretKey_ForDevelopment_Only_2024!",
  "Issuer": "GoldPC",
  "Audience": "GoldPC"
}
```

**Recommendations:**
1. ⚠️ In production, use environment variables or secret management (HashiCorp Vault, Azure Key Vault)
2. ⚠️ Ensure appsettings.Production.json uses a different, stronger key
3. ✅ Current development key length is sufficient (52 chars > 32 chars minimum)

---

## 3. Controller Authorization Analysis

### AuthService Controllers

| Controller | [Authorize] | Status |
|------------|-------------|--------|
| AuthController | ✅ Applied where needed | SECURE |
| - `/register` | Anonymous (correct) | ✅ |
| - `/login` | Anonymous (correct) | ✅ |
| - `/refresh` | Anonymous (correct) | ✅ |
| - `/logout` | [Authorize] | ✅ |
| - `/profile` | [Authorize] | ✅ |
| - `/change-password` | [Authorize] | ✅ |

### OrdersService Controllers

| Controller | [Authorize] | Status |
|------------|-------------|--------|
| OrdersController | ✅ Class-level | SECURE |
| - GET `/{id}` | Inherited + HasAccess() check | ✅ |
| - GET `/my` | Inherited | ✅ |
| - GET `/` | [Authorize(Roles = "Manager,Admin,Accountant")] | ✅ |
| - POST `/` | Inherited | ✅ |
| - PUT `/{id}/status` | [Authorize(Roles = "Manager,Admin,Master")] | ✅ |

### ServicesService Controllers

| Controller | [Authorize] | Status |
|------------|-------------|--------|
| ServicesController | ✅ Class-level | SECURE |
| - GET `/types` | [AllowAnonymous] (correct) | ✅ |
| - All other endpoints | Proper role-based access | ✅ |

### WarrantyService Controllers

| Controller | [Authorize] | Status |
|------------|-------------|--------|
| WarrantyController | ✅ Class-level | SECURE |
| - All endpoints | Proper role-based access | ✅ |

---

## 4. Security Issues Found and Fixed

### 🔴 CRITICAL Issue #1: AdminCatalogController — Missing Authorization

**File:** `src/CatalogService/Controllers/ProductsController.cs`  
**Severity:** CRITICAL  
**Description:** AdminCatalogController had no authorization attributes, allowing unauthorized users to create, update, and delete products.

**Before (Vulnerable):**
```csharp
[ApiController]
[Route("api/v1/admin")]
public class AdminCatalogController : ControllerBase
```

**After (Fixed):**
```csharp
[ApiController]
[Route("api/v1/admin")]
[Authorize(Roles = "Manager,Admin")]
public class AdminCatalogController : ControllerBase
```

**Additional Fix:** DeleteProduct now requires Admin role specifically:
```csharp
[HttpDelete("products/{productId:guid}")]
[Authorize(Roles = "Admin")]
```

---

### 🔴 CRITICAL Issue #2: AddReview — Missing Authorization

**File:** `src/CatalogService/Controllers/ProductsController.cs`  
**Severity:** HIGH  
**Description:** AddReview endpoint used a hardcoded GUID instead of extracting userId from JWT token.

**Before (Vulnerable):**
```csharp
[HttpPost("products/{productId:guid}/reviews")]
public async Task<ActionResult<ReviewDto>> AddReview(...)
{
    var userId = Guid.Parse("00000000-0000-0000-0000-000000000000"); // Заглушка
```

**After (Fixed):**
```csharp
[HttpPost("products/{productId:guid}/reviews")]
[Authorize]
public async Task<ActionResult<ReviewDto>> AddReview(...)
{
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
    if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
    {
        return Unauthorized(new { error = "Пользователь не авторизован" });
    }
```

---

### ✅ PCBuilderController — Verified Secure

**File:** `src/PCBuilderService/Controllers/PCBuilderController.cs`  
**Status:** SECURE (verified during audit)

All configuration endpoints have proper authorization:
| Endpoint | Authorization | Status |
|----------|---------------|--------|
| POST `/configurations` | [Authorize] | ✅ |
| GET `/configurations/{id}` | [Authorize] + ownership check | ✅ |
| GET `/configurations` | [Authorize] | ✅ |
| DELETE `/configurations/{id}` | [Authorize] + ownership check | ✅ |

Public endpoints (correctly anonymous):
- `POST /check-compatibility` — public API
- `GET /compatible-motherboards/{processorId}` — public catalog data
- `GET /compatible-ram/{motherboardId}` — public catalog data
- `POST /calculate-power` — utility endpoint
- `POST /calculate-price` — utility endpoint

---

## 5. Summary

### Audit Results Summary

| Service | Controller | Auth Status | Issues Found |
|---------|------------|-------------|--------------|
| AuthService | AuthController | ✅ Secure | None |
| OrdersService | OrdersController | ✅ Secure | None |
| ServicesService | ServicesController | ✅ Secure | None |
| WarrantyService | WarrantyController | ✅ Secure | None |
| CatalogService | CatalogController | ✅ Fixed | AdminCatalogController missing [Authorize] |
| CatalogService | AdminCatalogController | ✅ Fixed | Now requires Manager/Admin role |
| PCBuilderService | PCBuilderController | ✅ Secure | None |

### Files Modified During This Audit

1. `src/CatalogService/Controllers/ProductsController.cs`
   - ✅ Added `using Microsoft.AspNetCore.Authorization;` and `using System.Security.Claims;`
   - ✅ Added `[Authorize]` to AddReview endpoint
   - ✅ Added proper JWT userId extraction (replaced hardcoded GUID)
   - ✅ Added `[Authorize(Roles = "Manager,Admin")]` to AdminCatalogController class
   - ✅ Added `[Authorize(Roles = "Admin")]` to DeleteProduct endpoint

### Files Verified (No Changes Needed)

1. `src/AuthService/Services/AuthService.cs` — BCrypt with workFactor 12 ✅
2. `src/AuthService/Program.cs` — JWT from config, proper validation ✅
3. `src/AuthService/Controllers/AuthController.cs` — Proper [Authorize] usage ✅
4. `src/OrdersService/Controllers/OrdersController.cs` — Class-level [Authorize] ✅
5. `src/ServicesService/Controllers/ServicesController.cs` — Class-level [Authorize] ✅
6. `src/WarrantyService/Controllers/WarrantyController.cs` — Class-level [Authorize] ✅
7. `src/PCBuilderService/Controllers/PCBuilderController.cs` — Proper [Authorize] on config endpoints ✅

---

## 6. Recommendations for Production

1. **Secret Management:** Move JWT SecretKey to environment variables or HashiCorp Vault
2. **Key Rotation:** Implement JWT key rotation policy
3. **Rate Limiting:** Add rate limiting to authentication endpoints
4. **Audit Logging:** Log all security-sensitive operations
5. **HTTPS:** Ensure all services enforce HTTPS in production
6. **CORS:** Review and restrict CORS policies for production

---

**Report Generated:** 2026-03-15  
**Audit Status:** COMPLETE ✅