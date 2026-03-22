import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ScrollToTop.module.css';

interface ScrollToTopProps {
  threshold?: number;
}

/**
 * Кнопка "Наверх" - появляется при прокрутке страницы вниз
 * Золотой круг со стрелкой вверх
 */
const FOOTER_ZONE = 140;

export function ScrollToTop({ threshold = 300 }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isNearFooter, setIsNearFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
      const scrolledToBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - FOOTER_ZONE;
      setIsNearFooter(scrolledToBottom);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          className={`${styles.button} ${isNearFooter ? styles.nearFooter : ''}`}
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Прокрутить наверх"
          title="Наверх"
        >
          <ArrowUp size={24} className={styles.icon} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default ScrollToTop;