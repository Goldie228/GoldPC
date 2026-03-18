import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage/HomePage';
import { CatalogPage } from './pages/CatalogPage/CatalogPage';
import { ProductPage } from './pages/ProductPage/ProductPage';
import { PCBuilderPage } from './pages/PCBuilderPage/PCBuilderPage';
import { CartPage } from './pages/CartPage/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AccountPage } from './pages/AccountPage/AccountPage';
import { AccountLayout } from './pages/AccountPage/AccountLayout';
import { AccountOverview } from './pages/AccountPage/AccountOverview';
import { AccountProfile } from './pages/AccountPage/AccountProfile';
import { AccountOrders } from './pages/AccountPage/AccountOrders';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StubManager } from './components/admin';
import { CoordinatorDashboard } from './pages/admin/CoordinatorDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { CatalogManagementPage } from './pages/admin/CatalogManagementPage';
import { MainLayout } from './components/layout/MainLayout';
import { AuthGuard, RoleGuard } from './components/guards';
import { OrdersPage } from './pages/manager/OrdersPage';
import './App.css';

/**
 * Главный компонент приложения GoldPC
 * 
 * Структура страниц:
 * - /                     -> HomePage (Hero, Featured Builds, Categories)
 * - /catalog              -> CatalogPage (Filters, Product Grid)
 * - /product/:id          -> ProductPage (Gallery, Specs, Add to Cart)
 * - /builder              -> PCBuilderPage (Component Slots, Compatibility)
 * - /cart                 -> CartPage (Cart Items, Checkout)
 * - /account/*            -> AccountPage (Profile, Orders, Wishlist) [AuthGuard]
 * - /login                -> LoginPage (Auth Form)
 * - /admin/*              -> Admin Pages [RoleGuard: Admin]
 * - /manager/*            -> Manager Pages [RoleGuard: Manager, Admin]
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes wrapped in MainLayout */}
        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:category" element={<CatalogPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/builder" element={<PCBuilderPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

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
            <Route path="/admin/catalog" element={<CatalogManagementPage />} />
            <Route path="/admin/coordinator" element={<CoordinatorDashboard />} />
            <Route path="/admin/stubs" element={<StubManager />} />
          </Route>

          {/* Manager Routes - Protected by RoleGuard (Manager, Admin, Master) */}
          <Route element={<RoleGuard allowedRoles={['Manager', 'Admin', 'Master']} />}>
            <Route path="/manager/orders" element={<OrdersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;