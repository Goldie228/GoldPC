import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from "./NotFoundPage.module.css";

/**
 * 404 — запоминающаяся страница с лёгкой анимацией и метафорой «сигнал потерян».
 */
export function NotFoundPage() {
  return (
    <div className="not-found">
      <div className="not-found__bg-pattern" aria-hidden="true" />
      <div className="not-found__glow" aria-hidden="true" />

      <div className="not-found__container">
        <div className="not-found__visual" aria-hidden="true">
          <svg
            className="not-found__svg"
            viewBox="0 0 200 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className="not-found__wave"
              d="M8 60 Q 40 20, 72 60 T 136 60 T 192 60"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.35"
            />
            <circle className="not-found__dot not-found__dot--a" cx="52" cy="60" r="4" />
            <circle className="not-found__dot not-found__dot--b" cx="100" cy="60" r="4" />
            <line
              className="not-found__break"
              x1="118"
              y1="48"
              x2="142"
              y2="72"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
            />
            <circle className="not-found__dot not-found__dot--c" cx="160" cy="60" r="4" opacity="0.25" />
          </svg>
        </div>

        <div className="not-found__code" aria-hidden="true">
          404
        </div>
        <h1 className="not-found__title">Страница не найдена</h1>
        <p className="not-found__message">
          Кажется, запрашиваемая страница была перемещена или больше не существует.
          Проверьте URL или вернитесь на главную.
        </p>
        <div className="not-found__actions">
          <Link to="/" className="not-found__link not-found__link--primary">
            <ArrowLeft size={24} />
            На главную
          </Link>
          <Link to="/catalog" className="not-found__link not-found__link--ghost">
            Каталог
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
