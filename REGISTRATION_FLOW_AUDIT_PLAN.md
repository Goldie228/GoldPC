# GoldPC User Registration Flow Audit & Testing Plan

## Problem Overview
A user attempted registration without providing a phone number (which is not present in the frontend form), received backend validation errors for phone field, and was shown a misleading frontend error about email duplication.

---

## 1. Data Flow Mapping (Step-by-Step Trace)

**Execution Order:**
1.  User submits registration form with fields: firstName, lastName, email, password
2.  Frontend `RegisterModal.tsx` handles submit event
3.  Frontend runs client-side validation
4.  Frontend `authService.ts` constructs API request payload
5.  Request is sent to backend `/api/auth/register` endpoint
6.  Backend model binding deserializes request to `RegisterDto`
7.  Backend validation runs (data annotations + fluent validation)
8.  Controller action receives validated DTO
9.  Service layer processes registration
10. Database insert performed on `Users` table
11. Backend returns HTTP 400 validation response with phone errors
12. Frontend `useAuth.ts` / `RegisterModal.tsx` receives error response
13. Frontend error mapping logic runs
14. User sees "Ошибка регистрации. Попробуйте другой email." message

**Critical Touchpoints to Inspect:**
- [ ] Form submission handler in RegisterModal
- [ ] Client-side validation schema
- [ ] Payload construction in authService register method
- [ ] Backend RegisterDto class definition
- [ ] Validation attributes on RegisterDto
- [ ] Backend controller action signature
- [ ] Users database table schema
- [ ] EF Core entity configuration for User
- [ ] Database migration history for Users table
- [ ] Frontend error handling / mapping logic

---

## 2. Audit Checklist

### 🔍 Frontend Audit
| Check | File Locations | Instructions |
|-------|----------------|--------------|
| 2.1 Registration form fields | `src/frontend/src/components/auth/RegisterModal/RegisterModal.tsx` | List all input fields present. Confirm phone number field is NOT present. |
| 2.2 Client-side validation rules | Same file + any validation schemas | Document required fields. Verify phone is NOT marked as required client-side. |
| 2.3 API payload construction | `src/frontend/src/api/authService.ts` | Examine `register()` method. Show exact object that is sent to backend. Confirm `phone` field is NOT included. |
| 2.4 Error handling logic | `RegisterModal.tsx` + `useAuth.ts` | Trace how backend validation errors are processed. Find where error messages are mapped. Show code that selects which message to display to user. |
| 2.5 Error message constants | Any localization / error constants files | List all registration error messages defined in frontend. |

### 🔍 Backend Audit
| Check | File Locations | Instructions |
|-------|----------------|--------------|
| 2.6 RegisterDto definition | Search for `class RegisterDto` / `record RegisterDto` | Show full DTO including all properties, data types, and attributes. |
| 2.7 Validation attributes | Same file | List all `[Required]`, `[RegularExpression]`, or other validation attributes. Confirm if Phone property has `[Required]` attribute. |
| 2.8 Fluent validation rules | Search for `RegisterDtoValidator` | Check for additional validation rules configured via FluentValidation. |
| 2.9 Controller action | `AuthController.cs` / `AccountController.cs` | Show endpoint method signature. Verify it accepts `RegisterDto` as parameter. Check for any manual validation. |
| 2.10 Service layer | `AuthService.cs` / `UserService.cs` | Check for any additional validation or phone field processing in business logic. |

### 🔍 Database Audit
| Check | Instructions |
|-------|--------------|
| 2.11 Users table schema | Run SQL: `DESCRIBE Users;` or `SELECT column_name, is_nullable, data_type, column_default FROM information_schema.columns WHERE table_name = 'Users';` |
| 2.12 Phone column status | Confirm if `Phone` column exists, is marked `NOT NULL`, and has a default value. |
| 2.13 Migration history | Find database migrations. Check when Phone column was added. Verify if it was added as nullable or required. |
| 2.14 EF Core entity configuration | Check `User.cs` entity class and `OnModelCreating` configuration. Show configuration for Phone property. |

### 🔍 Integration Alignment Check
| Check | Instructions |
|-------|--------------|
| 2.15 Field name consistency | Verify field names match exactly between frontend payload, backend DTO, and database table. |
| 2.16 Required/optional alignment | Compare required status for every field across all 3 layers. Create comparison table. |
| 2.17 Validation rule consistency | Compare validation regex, length limits, and rules for every field between frontend and backend. |

---

## 3. Test Scenarios

Execute these tests in order:

### ✅ Basic Functionality Tests
1.  **Test 1: Valid registration attempt without phone**
    - Payload: `{ "firstName": "Test", "lastName": "User", "email": "test@example.com", "password": "TestPass123" }`
    - Expected: HTTP 200 / 201 success
    - Actual: Record actual response status and body

2.  **Test 2: Valid registration attempt with phone**
    - Payload: Add valid Belarusian phone number `"+375 (29) 123-45-67"` to previous payload
    - Expected: HTTP 200 / 201 success
    - Actual: Record actual response status and body

3.  **Test 3: Missing lastName field**
    - Payload: Omit lastName or send empty string
    - Expected: Successful registration (lastName should be optional)
    - Actual: Record actual response

### ✅ Error Handling Tests
4.  **Test 4: Verify backend phone validation message**
    - Send payload without phone. Confirm backend returns exactly the phone validation errors reported.

5.  **Test 5: Frontend error mapping test**
    - Simulate backend response with phone validation errors. Verify what message is shown to user.

6.  **Test 6: Duplicate email test**
    - Register same email twice. Verify correct "Email already exists" error is shown.

7.  **Test 7: Weak password test**
    - Send password that fails complexity rules. Verify correct error message is shown.

---

## 4. Expected Findings (Hypotheses)

Most likely root causes:
1.  ✅ **Hypothesis 1:** Backend `RegisterDto` has `[Required]` attribute on Phone property, but frontend does not send this field at all.
2.  ✅ **Hypothesis 2:** `Users` database table has `Phone` column defined as `NOT NULL` without a default value.
3.  ✅ **Hypothesis 3:** Frontend error handling only checks for email errors and falls back to "Try another email" message for all other error types, completely ignoring phone validation errors.
4.  ✅ **Hypothesis 4:** Phone field was added to backend/Database in a recent migration, but frontend registration form was never updated to include it.
5.  ✅ **Hypothesis 5:** Backend validation was updated to require phone, but no communication happened with frontend team.

---

## 5. Remediation Strategy Outline

Once root causes are confirmed, implement fixes in this order:

### Priority 1: Fix Error Messaging (Immediate)
- Update frontend error mapping logic to properly handle and display phone validation errors
- Remove the misleading "Try another email" fallback message
- Add generic error handler that displays actual backend validation messages

### Priority 2: Resolve Phone Field Misalignment
Choose **one** of these approaches based on product requirements:
- **Option A (Recommended):** Make Phone field optional
  - Remove `[Required]` attribute from RegisterDto.Phone
  - Make Phone column nullable in database
  - Update EF Core entity configuration
- **Option B:** Add phone field to frontend registration form
  - Add phone input with proper Belarusian format validation
  - Update payload to include phone field
  - Add client-side validation matching backend rules
- **Option C:** Make phone required but optional during registration
  - Set default value for Phone column in database
  - Allow empty phone on registration, require it later in onboarding

### Priority 3: Add Regression Tests
- Add unit test covering frontend error mapping
- Add integration test for registration endpoint with/without phone
- Add E2E test for successful registration flow

---

## 6. Execution Instructions for Next Agent

1.  Start by running `git status` to see recently modified files
2.  Execute all items in Audit Checklist first
3.  Document all findings with exact file paths and line numbers
4.  Run all Test Scenarios and record actual results
5.  Confirm or refute each hypothesis
6.  Select appropriate remediation approach
7.  Implement fixes and run all tests
8.  Create git commit with detailed description
