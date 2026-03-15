import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { CatalogPage } from './pages/CatalogPage/CatalogPage';
import { LoginPage } from './pages/LoginPage/LoginPage';
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
              <Link to="/" className="nav-link">
                Каталог
              </Link>
              <Link to="/login" className="nav-link">
                Войти
              </Link>
            </nav>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/login" element={<LoginPage />} />
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