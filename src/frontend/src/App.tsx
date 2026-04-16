import { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AuthGuard, RoleGuard } from './components/guards';
import { AuthModalContainer } from './components/auth';
import { ModalContainer } from './components/ui/Modal/ModalContainer';
import { RouteMeta } from './components/seo/RouteMeta';
import { ProductCardSkeleton, SimplePageLoader } from './components/ui/Skeleton';
import { useAuthStore } from './store/authStore';
import { useWishlistStore } from './store/wishlistStore';
import './App.css';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage/HomePage').then(m => ({ default: m.HomePage })));
const CatalogPage = lazy(() => import('./pages/CatalogPage/CatalogPage').then(m => ({ default: m.CatalogPage })));
// ... other lazy loads remain same ...
const ProductPage = lazy(() => import('./pages/ProductPage/ProductPage').then(m => ({ default: m.ProductPage })));
const PCBuilderPage = lazy(() => import('./pages/PCBuilderPage/PCBuilderPage').then(m => ({ default: m.PCBuilderPage })));
const BuildWizardPage = lazy(() => import('./pages/BuildWizardPage/BuildWizardPage').then(m => ({ default: m.BuildWizardPage })));
const CartPage = lazy(() => import('./pages/CartPage/CartPage').then(m => ({ default: m.CartPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage/WishlistPage').then(m => ({ default: m.WishlistPage })));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage/ComparisonPage').then(m => ({ default: m.ComparisonPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const AboutPage = lazy(() => import('./pages/AboutPage/AboutPage').then(m => ({ default: m.AboutPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const ServiceRequestPage = lazy(() => import('./pages/ServiceRequestPage').then(m => ({ default: m.ServiceRequestPage })));
const AccountRepairs = lazy(() => import('./pages/AccountPage/AccountRepairs').then(m => ({ default: m.AccountRepairs })));
const TicketDetailPage = lazy(() => import('./pages/MyRepairs/TicketDetailPage').then(m => ({ default: m.TicketDetailPage })));
const DeliveryPage = lazy(() => import('./pages/info/DeliveryPage').then(m => ({ default: m.DeliveryPage })));
const PaymentPage = lazy(() => import('./pages/info/PaymentPage').then(m => ({ default: m.PaymentPage })));
const WarrantyPage = lazy(() => import('./pages/info/WarrantyPage').then(m => ({ default: m.WarrantyPage })));
const ReturnsPage = lazy(() => import('./pages/info/ReturnsPage').then(m => ({ default: m.ReturnsPage })));
const FaqPage = lazy(() => import('./pages/info/FaqPage').then(m => ({ default: m.FaqPage })));
const AccountLayout = lazy(() => import('./pages/AccountPage/AccountLayout').then(m => ({ default: m.AccountLayout })));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard/CustomerDashboard').then(m => ({ default: m.CustomerDashboard })));
const AccountOverview = lazy(() => import('./pages/AccountPage/AccountOverview').then(m => ({ default: m.AccountOverview })));
const AccountProfile = lazy(() => import('./pages/AccountPage/AccountProfile').then(m => ({ default: m.AccountProfile })));
const AccountOrders = lazy(() => import('./pages/AccountPage/AccountOrders').then(m => ({ default: m.AccountOrders })));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const UserFormPage = lazy(() => import('./pages/admin/UserFormPage').then(m => ({ default: m.UserFormPage })));
const CatalogManagementPage = lazy(() => import('./pages/admin/CatalogManagementPage').then(m => ({ default: m.CatalogManagementPage })));
const CoordinatorDashboard = lazy(() => import('./pages/admin/CoordinatorDashboard').then(m => ({ default: m.CoordinatorDashboard })));
const StubManager = lazy(() => import('./components/admin').then(m => ({ default: m.StubManager })));
const OrdersPage = lazy(() => import('./pages/manager/OrdersPage').then(m => ({ default: m.OrdersPage })));
const OrderDetailPage = lazy(() => import('./pages/manager/OrderDetailPage').then(m => ({ default: m.OrderDetailPage })));
const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const InventoryPage = lazy(() => import('./pages/manager/InventoryPage').then(m => ({ default: m.InventoryPage })));
const TicketsPage = lazy(() => import('./pages/master').then(m => ({ default: m.TicketsPage })));
const TicketDetailPage = lazy(() => import('./pages/master').then(m => ({ default: m.TicketDetailPage })));
const ReportsPage = lazy(() => import('./pages/accountant').then(m => ({ default: m.ReportsPage })));
const ExportPage = lazy(() => import('./pages/accountant').then(m => ({ default: m.ExportPage })));
const NotFoundPage = lazy(() => import('./pages/errors').then(m => ({ default: m.NotFoundPage })));

function lastPathSegment(pathname: string): string {
  const seg = pathname.split('?')[0].split('/').filter(Boolean);
  return seg[seg.length - 1] ?? '';
}

/** Скелетон по типу маршрута (без Router: pathname из window при подгрузке чанка) */
function RouteAwarePageLoader() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isStaffOrAccount =
    path.startsWith('/admin') ||
    path.startsWith('/manager') ||
    path.startsWith('/master') ||
    path.startsWith('/accountant') ||
    path.startsWith('/account');

  if (isStaffOrAccount) {
    return (
      <div className="page-loader page-loader--content" aria-busy="true" aria-label="Загрузка страницы">
        <div className="page-loader__bar page-loader__bar--long" />
        <div className="page-loader__bar page-loader__bar--medium" />
        <div className="page-loader__panel" />
      </div>
    );
  }

  const leaf = lastPathSegment(path);

  if (leaf === 'wishlist') {
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

  if (leaf === 'comparison') {
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

  return <SimplePageLoader />;
}

const router = createBrowserRouter([
  {
    element: (
      <>
        <RouteMeta />
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
      {
        element: <AuthGuard />,
        children: [
          { path: '/dashboard', element: <CustomerDashboard /> },
          {
            path: '/account',
            element: <AccountLayout />,
            children: [
              { index: true, element: <AccountOverview /> },
              { path: 'profile', element: <AccountProfile /> },
              { path: 'orders', element: <AccountOrders /> },
              { path: 'repairs', element: <AccountRepairs /> },
              { path: 'wishlist', element: <Navigate to="/wishlist" replace /> },
              { path: 'settings', element: <AccountProfile /> },
            ],
          },
        ],
      },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        element: <RoleGuard allowedRoles={['Admin']} />,
        children: [
          { path: '/admin/users', element: <UserManagementPage /> },
          { path: '/admin/users/new', element: <UserFormPage /> },
          { path: '/admin/users/:id/edit', element: <UserFormPage /> },
          { path: '/admin/catalog', element: <CatalogManagementPage /> },
          { path: '/admin/coordinator', element: <CoordinatorDashboard /> },
          { path: '/admin/stubs', element: <StubManager /> },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['Manager', 'Admin', 'Master']} />,
        children: [
          { path: '/manager', element: <Navigate to="/manager/dashboard" replace /> },
          { path: '/manager/dashboard', element: <ManagerDashboard /> },
          { path: '/manager/orders', element: <OrdersPage /> },
          { path: '/manager/orders/:id', element: <OrderDetailPage /> },
          { path: '/manager/inventory', element: <InventoryPage /> },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['Master', 'Admin']} />,
        children: [
          { path: '/master/tickets', element: <TicketsPage /> },
          { path: '/master/tickets/:id', element: <TicketDetailPage /> },
        ],
      },
      {
        element: <RoleGuard allowedRoles={['Accountant', 'Admin']} />,
        children: [
          { path: '/accountant/reports', element: <ReportsPage /> },
          { path: '/accountant/export', element: <ExportPage /> },
        ],
      },
      { path: '/orders/:orderNumber/success', element: <OrderSuccessPage /> },
      { path: '/orders/:orderNumber/tracking', element: <OrderTrackingPage /> },
      { path: '/my-repairs/:ticketId', element: <TicketDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
});

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const syncWishlistWithServer = useWishlistStore((state) => state.syncWithServer);

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncWishlistWithServer();
  }, [isAuthenticated, syncWishlistWithServer]);

  return (
    <Suspense fallback={<RouteAwarePageLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}


export default App;