import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { CatalogPage } from './pages/CatalogPage/CatalogPage';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { StubManager } from './components/admin';
import { CoordinatorDashboard } from './pages/admin/CoordinatorDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { CatalogManagementPage } from './pages/admin/CatalogManagementPage';
import './App.css';

/**
 * Главный компонент приложения GoldPC
 */
function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <Link to="/" className="logo">
              <span className="logo-icon">🖥️</span>
              <span className="logo-text">GoldPC</span>
            </Link>
            
            <nav className="nav">
              <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}>
                Каталог
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `nav-link nav-link--admin ${isActive ? 'nav-link--active' : ''}`}>
                👥 Пользователи
              </NavLink>
              <NavLink to="/admin/catalog" className={({ isActive }) => `nav-link nav-link--admin ${isActive ? 'nav-link--active' : ''}`}>
                📦 Каталог
              </NavLink>
              <NavLink to="/admin/coordinator" className={({ isActive }) => `nav-link nav-link--admin ${isActive ? 'nav-link--active' : ''}`}>
                📊 Dashboard
              </NavLink>
              <NavLink to="/admin/stubs" className={({ isActive }) => `nav-link nav-link--admin ${isActive ? 'nav-link--active' : ''}`}>
                🎛️ Stubs
              </NavLink>
              <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}>
                Войти
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/catalog" element={<CatalogManagementPage />} />
            <Route path="/admin/coordinator" element={<CoordinatorDashboard />} />
            <Route path="/admin/stubs" element={<StubManager />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <p>© 2024 GoldPC. Все права защищены.</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;