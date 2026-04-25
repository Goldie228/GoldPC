import { useState } from 'react';
import styles from "./AccountProfile.module.css";

/**
 * AccountProfile - User profile editing page
 * 
 * Features:
 * - Avatar section with upload/delete options
 * - Personal data form with dark inputs
 * - Security settings section
 */
export function AccountProfile() {
  const [formData, setFormData] = useState({
    firstName: 'Александр',
    lastName: 'Иванов',
    email: 'alex.ivanov@email.com',
    phone: '+375 (29) 123-45-67',
    address: 'Минск, ул. Примерная, д. 1, кв. 10',
    birthday: '1995-03-15',
    company: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log('Form submitted:', formData);
  };

  return (
    <div className="account-profile">
      {/* Page Header */}
      <div className="account-profile__header">
        <h1 className="account-profile__title">Профиль</h1>
        <p className="account-profile__subtitle">Управление личными данными</p>
      </div>

      {/* Avatar Section */}
      <div className="avatar-section">
        <div className="avatar-section__preview">АИ</div>
        <div className="avatar-section__info">
          <div className="avatar-section__title">Аватар профиля</div>
          <div className="avatar-section__desc">JPG, PNG или GIF. Максимум 2MB.</div>
          <div className="avatar-section__actions">
            <button className="btn btn--secondary">Загрузить</button>
            <button className="btn btn--ghost">Удалить</button>
          </div>
        </div>
      </div>

      {/* Personal Info Form */}
      <div className="form-card">
        <div className="form-card__header">
          <h2 className="form-card__title">Личные данные</h2>
          <span className="form-card__badge">VERIFIED</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">
                Имя
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="form-input"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Введите имя"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">
                Фамилия
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="form-input"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Введите фамилию"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="Введите email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Телефон
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+375 (XX) XXX-XX-XX"
              />
            </div>

            <div className="form-group form-group--full">
              <label className="form-label" htmlFor="address">
                Адрес доставки
              </label>
              <input
                type="text"
                id="address"
                name="address"
                className="form-input"
                value={formData.address}
                onChange={handleChange}
                placeholder="Город, улица, дом, квартира"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="birthday">
                Дата рождения
              </label>
              <input
                type="date"
                id="birthday"
                name="birthday"
                className="form-input"
                value={formData.birthday}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="company">
                Компания
              </label>
              <input
                type="text"
                id="company"
                name="company"
                className="form-input"
                value={formData.company}
                onChange={handleChange}
                placeholder="Название компании (опционально)"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--secondary">
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              Сохранить изменения
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Security Settings */}
      <div className="form-card">
        <div className="form-card__header">
          <h2 className="form-card__title">Безопасность</h2>
        </div>

        <div className="security-list">
          <div className="security-item">
            <div className="security-item__info">
              <div className="security-item__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <div className="security-item__title">Пароль</div>
                <div className="security-item__desc">Последнее изменение: 15 января 2026</div>
              </div>
            </div>
            <button className="btn btn--secondary">Изменить</button>
          </div>

          <div className="security-item">
            <div className="security-item__info">
              <div className="security-item__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <div className="security-item__title">Двухфакторная аутентификация</div>
                <div className="security-item__desc">Дополнительная защита аккаунта</div>
              </div>
            </div>
            <button className="btn btn--secondary">Включить</button>
          </div>

          <div className="security-item">
            <div className="security-item__info">
              <div className="security-item__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <div className="security-item__title">История входов</div>
                <div className="security-item__desc">Просмотр последних активностей</div>
              </div>
            </div>
            <button className="btn btn--ghost">Просмотреть</button>
          </div>
        </div>
      </div>
    </div>
  );
}