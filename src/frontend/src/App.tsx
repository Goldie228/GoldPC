import React, { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { MainLayout } from './components/layout/main-layout/MainLayout';
import { AuthGuard, RoleGuard, AdminRedirect } from './components/guards';
import { AdminLayout } from './components/layout/admin-layout/AdminLayout';
import { ManagerLayout } from './components/layout/manager-layout/ManagerLayout';
import { MasterLayout } from './components/layout/master-layout/MasterLayout';
import { AccountantLayout } from './components/layout/accountant-layout/AccountantLayout';
import { CourierLayout } from './components/layout/courier-layout/CourierLayout';
import { AuthModalContainer } from './components/auth';
import { ModalContainer } from './components/ui/Modal/ModalContainer';
import { RouteMeta } from './components/seo/RouteMeta';
import { ProductCardSkeleton, SimplePageLoader } from './components/ui/Skeleton';
import OfflineBanner from './components/offline-banner/OfflineBanner';
import { ErrorBoundary } from './components/errors/ErrorBoundary';
import { NotificationProvider } from './hooks/useNotifications';
import { useAuthStore } from './store/authStore';
import { useWishlistStore } from './store/wishlistStore';
import { useTokenRefresh } from './hooks/useTokenRefresh';
import { ScrollToTopOnNavigate } from '@/components/ui/ScrollToTopOnNavigate';
import './App.css';

// PC Builder — eager import. Lazy imports can fail intermittently due to
// Vite HMR cache invalidation (stale ?t= cache buster on chunk URL).
// React never retries a failed lazy() import, leaving страница blank until reload.
import { PCBuilderPage } from './pages/pc-builder-page/PCBuilderPage';

// Lazy load pages
const HomePage = lazy(() => import('./pages/home-page/HomePage').then(m => ({ default: m.HomePage })));
const CatalogPage = lazy(() => import('./pages/catalog-page/CatalogPage').then(m => ({ default: m.CatalogPage })));
// ... other lazy loads remain same ...
const ProductPage = lazy(() => import('./pages/product-page/ProductPage').then(m => ({ default: m.ProductPage })));
const BuildWizardPage = lazy(() => import('./pages/build-wizard-page/BuildWizardPage').then(m => ({ default: m.BuildWizardPage })));
const CartPage = lazy(() => import('./pages/cart-page/CartPage').then(m => ({ default: m.CartPage })));
const WishlistPage = lazy(() => import('./pages/wishlist-page/WishlistPage').then(m => ({ default: m.WishlistPage })));
const ComparisonPage = lazy(() => import('./pages/comparison-page/ComparisonPage').then(m => ({ default: m.ComparisonPage })));
const CheckoutPage = lazy(() => import('./pages/checkout-page/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('./pages/order-success-page/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const OrderTrackingPage = lazy(() => import('./pages/order-tracking-page/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));
const _RegisterPage = lazy(() => import('./pages/register-page/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password-page/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/reset-password-page/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPendingPage = lazy(() => import('./pages/verify-email-page/VerifyEmailPendingPage').then(m => ({ default: m.VerifyEmailPendingPage })));
const VerifyEmailTokenPage = lazy(() => import('./pages/verify-email-page/VerifyEmailTokenPage').then(m => ({ default: m.VerifyEmailTokenPage })));
const AboutPage = lazy(() => import('./pages/about-page/AboutPage').then(m => ({ default: m.AboutPage })));
const ServicesPage = lazy(() => import('./pages/services-page/ServicesPage').then(m => ({ default: m.ServicesPage })));
const ServiceDetailPage = lazy(() => import('./pages/service-detail-page/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const ServiceRequestPage = lazy(() => import('./pages/service-request-page/ServiceRequestPage').then(m => ({ default: m.ServiceRequestPage })));
const AccountRepairs = lazy(() => import('./pages/account-page/AccountRepairs').then(m => ({ default: m.AccountRepairs })));
const AccountWarranty = lazy(() => import('./pages/account-page/AccountWarranty').then(m => ({ default: m.AccountWarranty })));

const AccountSavedBuilds = lazy(() => import('./pages/account-page/AccountSavedBuilds').then(m => ({ default: m.AccountSavedBuilds })));
const AccountSettings = lazy(() => import('./pages/account-page/AccountSettings').then(m => ({ default: m.AccountSettings })));
const NotificationsPage = lazy(() => import('./pages/account/notifications-page/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const ClientTicketDetailPage = lazy(() => import('./pages/my-repairs/TicketDetailPage').then(m => ({ default: m.TicketDetailPage })));
const DeliveryPage = lazy(() => import('./pages/info/DeliveryPage').then(m => ({ default: m.DeliveryPage })));
const PaymentPage = lazy(() => import('./pages/info/PaymentPage').then(m => ({ default: m.PaymentPage })));
const WarrantyPage = lazy(() => import('./pages/info/WarrantyPage').then(m => ({ default: m.WarrantyPage })));
const ReturnsPage = lazy(() => import('./pages/info/ReturnsPage').then(m => ({ default: m.ReturnsPage })));
const FaqPage = lazy(() => import('./pages/info/FaqPage').then(m => ({ default: m.FaqPage })));
const ContactsPage = lazy(() => import('./pages/info/ContactsPage').then(m => ({ default: m.ContactsPage })));
const PrivacyPage = lazy(() => import('./pages/info/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/info/TermsPage').then(m => ({ default: m.TermsPage })));
const BrandsPage = lazy(() => import('./pages/info/BrandsPage').then(m => ({ default: m.BrandsPage })));
const SitemapPage = lazy(() => import('./pages/info/SitemapPage').then(m => ({ default: m.SitemapPage })));
const AccountLayout = lazy(() => import('./pages/account-page/AccountLayout').then(m => ({ default: m.AccountLayout })));
const AccountOverview = lazy(() => import('./pages/account-page/AccountOverview').then(m => ({ default: m.AccountOverview })));
const AccountProfile = lazy(() => import('./pages/account-page/AccountProfile').then(m => ({ default: m.AccountProfile })));
const AccountOrders = lazy(() => import('./pages/account-page/AccountOrders').then(m => ({ default: m.AccountOrders })));
const UserManagementPage = lazy(() => import('./pages/admin/user-management-page/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const UserFormPage = lazy(() => import('./pages/admin/user-form-page/UserFormPage').then(m => ({ default: m.UserFormPage })));
const CatalogManagementPage = lazy(() => import('./pages/admin/catalog-management-page/CatalogManagementPage').then(m => ({ default: m.CatalogManagementPage })));
const CoordinatorDashboard = lazy(() => import('./pages/admin/coordinator-dashboard/CoordinatorDashboard').then(m => ({ default: m.CoordinatorDashboard })));
const DictionariesPage = lazy(() => import('./pages/admin/dictionaries-page/DictionariesPage').then(m => ({ default: m.DictionariesPage })));
const SettingsPage = lazy(() => import('./pages/admin/settings-page/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AuditLogPage = lazy(() => import('./pages/admin/audit-log-page/AuditLogPage').then(m => ({ default: m.AuditLogPage })));
const ProductEditorPage = lazy(() => import('./components/admin/product-editor/ProductEditorPage').then(m => ({ default: m.ProductEditorPage })));
const OrdersPage = lazy(() => import('./pages/manager/OrdersPage').then(m => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('./pages/manager/OrderDetailPage').then(m => ({ default: m.OrderDetailPage })));
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const InventoryPage = lazy(() => import('./pages/manager/InventoryPage').then(m => ({ default: m.InventoryPage })));
const ServiceRequestsPage = lazy(() => import('./pages/manager/ServiceRequestsPage').then(m => ({ default: m.ServiceRequestsPage })));
const ServiceRequestDetailPage = lazy(() => import('./pages/manager/ServiceRequestDetailPage').then(m => ({ default: m.ServiceRequestDetailPage })));
const WarrantyClaimsPage = lazy(() => import('./pages/manager/WarrantyClaimsPage').then(m => ({ default: m.WarrantyClaimsPage })));
const WarrantyClaimDetailPage = lazy(() => import('./pages/manager/WarrantyClaimDetailPage').then(m => ({ default: m.WarrantyClaimDetailPage })));
const FeedbackPage = lazy(() => import('./pages/manager/FeedbackPage').then(m => ({ default: m.FeedbackPage })));
const ManagerCatalogPage = lazy(() => import('./pages/manager/ManagerCatalogPage').then(m => ({ default: m.ManagerCatalogPage })));
const ManagerDictionariesPage = lazy(() => import('./pages/manager/ManagerDictionariesPage').then(m => ({ default: m.ManagerDictionariesPage })));
const ManagerUsersPage = lazy(() => import('./pages/manager/ManagerUsersPage').then(m => ({ default: m.ManagerUsersPage })));
const AssemblyKanbanPage = lazy(() => import('./pages/manager/AssemblyKanbanPage').then(m => ({ default: m.AssemblyKanbanPage })));
const TicketsPage = lazy(() => import('./pages/master').then(m => ({ default: m.TicketsPage })));
const TicketDetailPage = lazy(() => import('./pages/master').then(m => ({ default: m.TicketDetailPage })));
const AvailableTicketsPage = lazy(() => import('./pages/master').then(m => ({ default: m.AvailableTicketsPage })));
const WorkHistoryPage = lazy(() => import('./pages/master').then(m => ({ default: m.WorkHistoryPage })));
const CourierDeliveriesPage = lazy(() => import('./pages/courier/CourierDeliveriesPage').then(m => ({ default: m.CourierDeliveriesPage })));
const ReportsPage = lazy(() => import('./pages/accountant').then(m => ({ default: m.ReportsPage })));
const ExportPage = lazy(() => import('./pages/accountant').then(m => ({ default: m.ExportPage })));
const NotFoundPage = lazy(() => import('./pages/errors').then(m => ({ default: m.NotFoundPage })));

function lastPathSegment(pathname: string): string {
  const seg = pathname.split('?')[0].split('/').filter(Boolean);
  return seg[seg.length - 1] ?? '';
}

/** Скелетон по типу маршрута (без Router: pathname из window при подгрузке чанка) */
function RouteAwarePageLoader(): React.ReactElement {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isStaffOrAccount =
    path.startsWith('/admin') ||
    path.startsWith('/manager') ||
    path.startsWith('/master') ||
    path.startsWith('/accountant') ||
    path.startsWith('/account');

  if (isStaffOrAccount) {
    return <StaffPageLoader />;
  }

  const leaf = lastPathSegment(path);

  if (leaf === 'wishlist') {
    return <WishlistPageLoader />;
  }

  if (leaf === 'comparison') {
    return <ComparisonPageLoader />;
  }

  return <SimplePageLoader />;
}

function StaffPageLoader(): React.ReactElement {
  return (
    <div className="page-loader page-loader--content" aria-busy="true" aria-label="Загрузка страницы">
      <div className="page-loader__bar page-loader__bar--long" />
      <div className="page-loader__bar page-loader__bar--medium" />
      <div className="page-loader__panel" />
    </div>
  );
}

function WishlistPageLoader(): React.ReactElement {
  return (
    <div className="page-loader page-loader--wishlist" aria-busy="true" aria-label="Загрузка страницы">
      <aside className="page-loader__wishlistSidebar" aria-hidden>
        <div className="page-loader__bar page-loader__bar--sidebarTitle" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="page-loader__bar page-loader__bar--sidebarRow" />
        ))}
        <div className="page-loader__wishlistSidebarBlock" />
      </aside>
      <div className="page-loader__wishlistMain">
        <div className="page-loader__bar page-loader__bar--long" />
        <div className="page-loader__bar page-loader__bar--short" />
        <div className="page-loader__wishlistToolbar">
          <div className="page-loader__bar page-loader__bar--toolbar" />
          <div className="page-loader__bar page-loader__bar--toolbarNarrow" />
        </div>
        <div className="page-loader__wishlistGrid">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ComparisonPageLoader(): React.ReactElement {
  return (
    <div className="page-loader page-loader--comparison" aria-busy="true" aria-label="Загрузка страницы">
      <div className="page-loader__bar page-loader__bar--long" />
      <div className="page-loader__bar page-loader__bar--medium" />
      <div className="page-loader__comparisonTable" role="presentation">
        <div className="page-loader__comparisonHead">
          <div className="page-loader__comparisonCorner">
            <div className="page-loader__bar page-loader__bar--cornerLabel" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="page-loader__comparisonProductCol">
              <div className="page-loader__comparisonImg" />
              <div className="page-loader__bar page-loader__bar--productTitle" />
              <div className="page-loader__bar page-loader__bar--productPrice" />
              <div className="page-loader__comparisonActions">
                <div className="page-loader__bar page-loader__bar--action" />
                <div className="page-loader__bar page-loader__bar--action" />
              </div>
            </div>
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="page-loader__comparisonRow">
            <div className="page-loader__comparisonLabel">
              <div className="page-loader__bar page-loader__bar--specLabel" />
            </div>
            {Array.from({ length: 3 }).map((_, col) => (
              <div key={col} className="page-loader__comparisonCell">
                <div className="page-loader__bar page-loader__bar--specValue" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: (
      <>
        <RouteMeta />
        <ScrollToTopOnNavigate />
        <AuthModalContainer />
        <ModalContainer />
        <MainLayout />
      </>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      { 
        path: '/catalog/:category?', 
        element: <CatalogPage />
      },
      { path: '/product/:slug', element: <ProductPage /> },
      { path: '/pc-builder', element: <PCBuilderPage /> },
      { path: '/build-wizard', element: <BuildWizardPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/wishlist', element: <WishlistPage /> },
      { path: '/comparison', element: <ComparisonPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/services', element: <ServicesPage /> },
      { path: '/services/:slug', element: <ServiceDetailPage /> },
      { path: '/service-request', element: <ServiceRequestPage /> },
      { path: '/my-repairs', element: <Navigate to="/account/repairs" replace /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/delivery', element: <DeliveryPage /> },
      { path: '/payment', element: <PaymentPage /> },
      { path: '/warranty', element: <WarrantyPage /> },
      { path: '/returns', element: <ReturnsPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/contacts', element: <ContactsPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '/brands', element: <BrandsPage /> },
      { path: '/sitemap', element: <SitemapPage /> },
      {
        element: <AuthGuard />,
        children: [
          { path: '/dashboard', element: <Navigate to="/account" replace /> },
          { path: '/orders', element: <Navigate to="/account/orders" replace /> },
          { path: '/repairs', element: <Navigate to="/account/repairs" replace /> },
          { path: '/profile', element: <Navigate to="/account/profile" replace /> },
          {
            path: '/account',
            element: <AccountLayout />,
            children: [
              { index: true, element: <AccountOverview /> },
              { path: 'profile', element: <AccountProfile /> },
              { path: 'orders', element: <AccountOrders /> },
              { path: 'repairs', element: <AccountRepairs /> },
              { path: 'wishlist', element: <Navigate to="/wishlist" replace /> },
              { path: 'warranty', element: <AccountWarranty /> },
              { path: 'saved-builds', element: <AccountSavedBuilds /> },
              { path: 'settings', element: <AccountSettings /> },
              { path: 'notifications', element: <NotificationsPage /> },

            ],
          },
        ],
      },
      { path: '/login', element: <Navigate to="/" replace /> },
      { path: '/register', element: <Navigate to="/" replace /> },
      {
        element: <RoleGuard allowedRoles={['Manager', 'Admin', 'Master']} />,
        children: [
          {
            element: <ManagerLayout />,
            children: [
              { path: '/manager', element: <Navigate to="/manager/dashboard" replace /> },
              { path: '/manager/dashboard', element: <ManagerDashboard /> },
              { path: '/manager/orders', element: <OrdersPage /> },
              { path: '/manager/orders/:id', element: <OrderDetailPage /> },
              { path: '/manager/inventory', element: <InventoryPage /> },
              { path: '/manager/services', element: <ServiceRequestsPage /> },
              { path: '/manager/services/:id', element: <ServiceRequestDetailPage /> },
              { path: '/manager/warranty', element: <WarrantyClaimsPage /> },
              { path: '/manager/warranty/:id', element: <WarrantyClaimDetailPage /> },
              { path: '/manager/feedback', element: <FeedbackPage /> },
              { path: '/manager/catalog', element: <ManagerCatalogPage /> },
              { path: '/manager/dictionaries', element: <ManagerDictionariesPage /> },
              { path: '/manager/users', element: <ManagerUsersPage /> },
              { path: '/manager/assembly-kanban', element: <AssemblyKanbanPage /> },
              { path: '/manager/products/:id/edit', element: <ProductEditorPage /> },
              { path: '/manager/notifications', element: <NotificationsPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['Master', 'Admin']} />,
        children: [
          {
            element: <MasterLayout />,
            children: [
              { path: '/master', element: <Navigate to="/master/tickets" replace /> },
              { path: '/master/tickets', element: <TicketsPage /> },
              { path: '/master/tickets/:ticketId', element: <TicketDetailPage /> },
              { path: '/master/available', element: <AvailableTicketsPage /> },
              { path: '/master/history', element: <WorkHistoryPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['Accountant', 'Admin']} />,
        children: [
          {
            element: <AccountantLayout />,
            children: [
              { path: '/accountant', element: <Navigate to="/accountant/reports" replace /> },
              { path: '/accountant/reports', element: <ReportsPage /> },
              { path: '/accountant/export', element: <ExportPage /> },
            ],
          },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['Courier', 'Admin']} />,
        children: [
          {
            element: <CourierLayout />,
            children: [
              { path: '/courier', element: <Navigate to="/courier/deliveries" replace /> },
              { path: '/courier/deliveries', element: <CourierDeliveriesPage /> },
            ],
          },
        ],
      },
      { path: '/orders/:orderNumber/success', element: <OrderSuccessPage /> },
      { path: '/orders/:orderNumber/tracking', element: <OrderTrackingPage /> },
      { path: '/my-repairs/:ticketId', element: <ClientTicketDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Auth pages — standalone, no header/footer
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },
  { path: '/verify-email', element: <VerifyEmailPendingPage /> },
  { path: '/verify-email/:token', element: <VerifyEmailTokenPage /> },
  // Админ-панель — с path="/admin" чтобы не матчить корневые URL
  {
    path: '/admin',
    children: [
      { index: true, element: <Navigate to="users" replace /> },
      // Все маршруты админки — только Admin (менеджерские версии на /manager/*)
      {
        element: <RoleGuard allowedRoles={['Admin']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: 'catalog', element: <CatalogManagementPage /> },
              { path: 'dictionaries', element: <DictionariesPage /> },
              { path: 'users', element: <UserManagementPage /> },
              { path: 'users/new', element: <UserFormPage /> },
              { path: 'users/:id/edit', element: <UserFormPage /> },
              { path: 'coordinator', element: <CoordinatorDashboard /> },
              { path: 'audit-log', element: <AuditLogPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
          // ProductEditor — отдельный route без AdminLayout (полноэкранный режим)
          { path: 'products/:id/edit', element: <ProductEditorPage /> },
        ],
      },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
});

function App(): React.ReactElement {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const syncWishlistWithServer = useWishlistStore((state) => state.syncWithServer);

  // Тихий рефреш токена при загрузке страницы
  useTokenRefresh();

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncWishlistWithServer();
  }, [isAuthenticated, syncWishlistWithServer]);

  return (
    <NotificationProvider>
      <Suspense fallback={<RouteAwarePageLoader />}>
        <OfflineBanner />
        <RouterProvider router={router} />
      </Suspense>
    </NotificationProvider>
  );
}


export default App;