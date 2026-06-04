import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * 404 — страница с метафорой «сигнал потерян».
 */
export function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4">
      <div className="bg-surface-card border border-hairline-dark rounded-xl p-8 md:p-12 max-w-[480px] w-full text-center">
        <div className="mb-8 flex justify-center" aria-hidden="true">
          <FileQuestion size={80} className="text-gold" />
        </div>

        <div className="text-7xl md:text-8xl font-bold text-gold mb-4 leading-none" aria-hidden="true">
          404
        </div>
        <h1 className="text-display-sm md:text-display-md font-bold text-body-text mb-4">
          Страница не найдена
        </h1>
        <p className="text-base text-muted-text mb-8 leading-relaxed">
          Кажется, запрашиваемая страница была перемещена или больше не существует.
          Проверьте URL или вернитесь на главную.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-gold text-gold-ink font-semibold rounded-md hover:bg-gold-active transition-colors h-10 min-w-[180px]"
          >
            <ArrowLeft size={20} />
            На главную
          </Link>
          <Link
            to="/catalog"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-surface-card text-body-text border border-hairline-dark rounded-md hover:border-muted-text/50 hover:text-gold transition-colors h-10 min-w-[180px]"
          >
            Каталог
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
