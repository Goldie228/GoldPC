import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AuthGuard, RoleGuard } from './components/guards';
import { AuthModalContainer } from './components/auth';
import { RouteMeta } from './components/seo/RouteMeta';
import { useAuthStore } from './store/authStore';
import { useWishlistStore } from './store/wishlistStore';
import './App.css';

// Lazy load pages for better FCP/LCP performance
// Critical pages (HomePage, LoginPage) are loaded with higher priority
const HomePage = lazy(() => import('./pages/HomePage/HomePage').then(m => ({ default: m.HomePage })));
const CatalogPage = lazy(() => import('./pages/CatalogPage/CatalogPage').then(m => ({ default: m.CatalogPage })));
const ProductPage = lazy(() => import('./pages/ProductPage/ProductPage').then(m => ({ default: m.ProductPage })));
const PCBuilderPage = lazy(() => import('./pages/PCBuilderPage/PCBuilderPage').then(m => ({ default: m.PCBuilderPage })));
const CartPage = lazy(() => import('./pages/CartPage/CartPage').then(m => ({ default: m.CartPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage/WishlistPage').then(m => ({ default: m.WishlistPage })));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage/ComparisonPage').then(m => ({ default: m.ComparisonPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const AboutPage = lazy(() => import('./pages/AboutPage/AboutPage').then(m => ({ default: m.AboutPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const ServiceRequestPage = lazy(() => import('./pages/ServiceRequestPage').then(m => ({ default: m.ServiceRequestPage })));
const DeliveryPage = lazy(() => import('./pages/info/DeliveryPage').then(m => ({ default: m.DeliveryPage })));
const PaymentPage = lazy(() => import('./pages/info/PaymentPage').then(m => ({ default: m.PaymentPage })));
const WarrantyPage = lazy(() => import('./pages/info/WarrantyPage').then(m => ({ default: m.WarrantyPage })));
const ReturnsPage = lazy(() => import('./pages/info/ReturnsPage').then(m => ({ default: m.ReturnsPage })));
const FaqPage = lazy(() => import('./pages/info/FaqPage').then(m => ({ default: m.FaqPage })));

// Account pages - lazy loaded
const AccountPage = lazy(() => import('./pages/AccountPage/AccountPage').then(m => ({ default: m.AccountPage })));
const AccountLayout = lazy(() => import('./pages/AccountPage/AccountLayout').then(m => ({ default: m.AccountLayout })));
const AccountOverview = lazy(() => import('./pages/AccountPage/AccountOverview').then(m => ({ default: m.AccountOverview })));
const AccountProfile = lazy(() => import('./pages/AccountPage/AccountProfile').then(m => ({ default: m.AccountProfile })));
const AccountOrders = lazy(() => import('./pages/AccountPage/AccountOrders').then(m => ({ default: m.AccountOrders })));

// Admin pages - lazy loaded (less frequently accessed)
const StubManager = lazy(() => import('./components/admin').then(m => ({ default: m.StubManager })));
const CoordinatorDashboard = lazy(() => import('./pages/admin/CoordinatorDashboard').then(m => ({ default: m.CoordinatorDashboard })));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const UserFormPage = lazy(() => import('./pages/admin/UserFormPage').then(m => ({ default: m.UserFormPage })));
const CatalogManagementPage = lazy(() => import('./pages/admin/CatalogManagementPage').then(m => ({ default: m.CatalogManagementPage })));

// Manager/Master pages - lazy loaded
const OrdersPage = lazy(() => import('./pages/manager/OrdersPage').then(m => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('./pages/manager/OrderDetailPage').then(m => ({ default: m.OrderDetailPage })));
const TicketsPage = lazy(() => import('./pages/master').then(m => ({ default: m.TicketsPage })));
const TicketDetailPage = lazy(() => import('./pages/master').then(m => ({ default: m.TicketDetailPage })));

// Accountant pages - lazy loaded
const ReportsPage = lazy(() => import('./pages/accountant').then(m => ({ default: m.ReportsPage })));
const ExportPage = lazy(() => import('./pages/accountant').then(m => ({ default: m.ExportPage })));

// Error pages
const NotFoundPage = lazy(() => import('./pages/errors').then(m => ({ default: m.NotFoundPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="page-loader" style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    color: 'var(--fg-muted, #a1a1aa)'
  }}>
    <span>Загрузка...</span>
  </div>
);

/**
 * Главный компонент приложения GoldPC
 * 
 * Структура страниц:
 * - /                     -> HomePage (Hero, Featured Builds, Categories)
 * - /catalog              -> CatalogPage (Filters, Product Grid)
 * - /product/:id          -> ProductPage (Gallery, Specs, Add to Cart)
 * - /pc-builder           -> PCBuilderPage (Component Slots, Compatibility)
 * - /cart                 -> CartPage (Cart Items, Checkout)
 * - /login                -> LoginPage (Auth Form)
 * - /account/*            -> AccountPage (Profile, Orders, Wishlist) [AuthGuard]
 * - /admin/*              -> Admin Pages [RoleGuard: Admin]
 * - /manager/*            -> Manager Pages [RoleGuard: Manager, Admin]
 */
function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const syncWishlistWithServer = useWishlistStore((state) => state.syncWithServer);

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncWishlistWithServer();
  }, [isAuthenticated, syncWishlistWithServer]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <RouteMeta />
        {/* Global Auth Modals */}
        <AuthModalContainer />
        
        <Routes>
          {/* Routes wrapped in MainLayout */}
          <Route element={<MainLayout />}>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/:category" element={<CatalogPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/pc-builder" element={<PCBuilderPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/comparison" element={<ComparisonPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/service-request" element={<ServiceRequestPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/delivery" element={<DeliveryPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/warranty" element={<WarrantyPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
            <Route path="/faq" element={<FaqPage />} />

            {/* Account Routes - Protected by AuthGuard */}
            <Route element={<AuthGuard />}>
              <Route path="/account" element={<AccountLayout />}>
                <Route index element={<AccountOverview />} />
                <Route path="profile" element={<AccountProfile />} />
                <Route path="orders" element={<AccountOrders />} />
                <Route path="wishlist" element={<AccountPage />} />
                <Route path="settings" element={<AccountProfile />} />
              </Route>
            </Route>

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin Routes - Protected by RoleGuard (Admin only) */}
            <Route element={<RoleGuard allowedRoles={['Admin']} />}>
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/users/new" element={<UserFormPage />} />
              <Route path="/admin/users/:id/edit" element={<UserFormPage />} />
              <Route path="/admin/catalog" element={<CatalogManagementPage />} />
              <Route path="/admin/coordinator" element={<CoordinatorDashboard />} />
              <Route path="/admin/stubs" element={<StubManager />} />
            </Route>

            {/* Manager Routes - Protected by RoleGuard (Manager, Admin, Master) */}
            <Route element={<RoleGuard allowedRoles={['Manager', 'Admin', 'Master']} />}>
              <Route path="/manager/orders" element={<OrdersPage />} />
              <Route path="/manager/orders/:id" element={<OrderDetailPage />} />
            </Route>

            {/* Master Routes - Protected by RoleGuard (Master only) */}
            <Route element={<RoleGuard allowedRoles={['Master', 'Admin']} />}>
              <Route path="/master/tickets" element={<TicketsPage />} />
              <Route path="/master/tickets/:id" element={<TicketDetailPage />} />
            </Route>

            {/* Accountant Routes - Protected by RoleGuard (Accountant only) */}
            <Route element={<RoleGuard allowedRoles={['Accountant', 'Admin']} />}>
              <Route path="/accountant/reports" element={<ReportsPage />} />
              <Route path="/accountant/export" element={<ExportPage />} />
            </Route>

            {/* 404 Not Found - Catch-all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;