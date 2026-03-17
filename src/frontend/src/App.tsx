import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage/HomePage';
import { CatalogPage } from './pages/CatalogPage/CatalogPage';
import { ProductPage } from './pages/ProductPage/ProductPage';
import { PCBuilderPage } from './pages/PCBuilderPage/PCBuilderPage';
import { CartPage } from './pages/CartPage/CartPage';
import { AccountPage } from './pages/AccountPage/AccountPage';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { StubManager } from './components/admin';
import { CoordinatorDashboard } from './pages/admin/CoordinatorDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { CatalogManagementPage } from './pages/admin/CatalogManagementPage';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
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
 * - /account              -> AccountPage (Profile, Orders, Wishlist)
 * - /login                -> LoginPage (Auth Form)
 * - /admin/*              -> Admin Pages
 */
function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        
        <main className="app-main">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/catalog/:category" element={<CatalogPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/builder" element={<PCBuilderPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Admin Routes */}
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/catalog" element={<CatalogManagementPage />} />
            <Route path="/admin/coordinator" element={<CoordinatorDashboard />} />
            <Route path="/admin/stubs" element={<StubManager />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;