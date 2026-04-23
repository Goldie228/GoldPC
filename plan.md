# GoldPC Authentication System Implementation Plan

## Research Findings

### Current State
- **Frontend**: React app with Vite, already has auth-related components (LoginModal, RegisterModal, AuthModalBase)
- **Backend**: .NET microservices with AuthService, CatalogService, etc.
- **Database**: PostgreSQL with goldpc database
- **Testing**: Chrome DevTools available for end-to-end testing

### Existing Auth Components
- LoginModal - handles user login with email/password
- RegisterModal - handles new user registration
- AuthModalBase - shared modal wrapper
- AuthModalStore - manages auth modal state
- AuthService - backend authentication service
- Auth API endpoints: /auth/login, /auth/register, /auth/logout, /auth/refresh, /auth/me

### Current Flow
1. User registers via RegisterModal → AuthService → POST /auth/register
2. User logs in via LoginModal → AuthService → POST /auth/login
3. On success: token stored, user redirected to /account

## Implementation Plan

### Phase 1: Setup and Configuration
- [ ] Configure CORS for frontend-backend communication
- [ ] Set up JWT token configuration
- [ ] Configure identity provider
- [ ] Set up database context for user management

### Phase 2: Backend Authentication Services
- [ ] Implement AuthService with registration, login, logout
- [ ] Add JWT token generation and validation
- [ ] Implement password hashing (bcrypt)
- [ ] Add user validation and duplicate checking
- [ ] Implement refresh token mechanism
- [ ] Add rate limiting for login attempts

### Phase 3: Frontend Authentication
- [ ] Enhance LoginModal with better UX and validation
- [ ] Enhance RegisterModal with phone number support
- [ ] Add password visibility toggle
- [ ] Implement "Remember Me" functionality
- [ ] Add form validation with proper error messages
- [ ] Implement loading states during authentication

### Phase 4: Security and Authorization
- [ ] Implement role-based access control (RBAC)
- [ ] Add route guards for protected pages
- [ ] Implement token refresh mechanism
- [ ] Add session management
- [ ] Implement logout functionality

### Phase 5: Testing and Polish
- [ ] Test registration flow end-to-end
- [ ] Test login flow end-to-end
- [ ] Test password reset flow
- [ ] Test role-based access
- [ ] Test security features
- [ ] Polish UI/UX
- [ ] Fix any bugs discovered during testing

## Files to Create/Modify

### Backend
- AuthService.cs - Authentication service
- User.cs - User model
- LoginRequest.cs - Login DTO
- RegisterRequest.cs - Registration DTO
- AuthController.cs - Auth endpoints
- IdentityConfig.cs - Identity configuration

### Frontend
- LoginModal.tsx - Login form component
- RegisterModal.tsx - Registration form component
- authStore.ts - Auth state management
- authService.ts - API calls for auth
- useAuth.ts - Custom authentication hook

## Success Criteria
- Users can register with email, password, and phone
- Users can login with email and password
- JWT tokens are properly generated and validated
- Passwords are securely hashed
- Rate limiting is implemented for login attempts
- Role-based access control works correctly
- All forms have proper validation
- Error messages are user-friendly
- Loading states are implemented
- The system is secure and production-ready
