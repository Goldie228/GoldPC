import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import styles from './QRCodePayment.module.css';

interface QRCodePaymentProps {
  amount: number;
  orderNumber: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function QRCodePayment({ amount, orderNumber, onConfirm, onCancel, isProcessing = false }: QRCodePaymentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 минут

  useEffect(() => {
    generateQRCode();
  }, [amount, orderNumber]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    try {
      // Генерируем fake СБП ссылку
      // В реальности это была бы настоящая ссылка из банковского API
      const sbpData = {
        type: 'sbp',
        merchant: 'GoldPC',
        amount: amount.toFixed(2),
        currency: 'BYN',
        orderNumber,
        timestamp: Date.now(),
      };

      const qrData = `sbp://payment?data=${encodeURIComponent(JSON.stringify(sbpData))}`;

      await QRCode.toCanvas(canvasRef.current, qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrGenerated(true);
    } catch (error) {
      console.error('Ошибка генерации QR-кода:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.qrPayment}>
      <div className={styles.qrContainer}>
        <h3>Оплата через СБП</h3>
        
        <div className={styles.qrWrapper}>
          <canvas ref={canvasRef} className={styles.qrCanvas} />
          {!qrGenerated && (
            <div className={styles.qrLoading}>Генерация QR-кода...</div>
          )}
        </div>

        <div className={styles.amount}>
          <span className={styles.amountLabel}>К оплате:</span>
          <span className={styles.amountValue}>{amount.toFixed(2)} BYN</span>
        </div>

        <div className={styles.timer}>
          <Icon name="clock" size="sm" color="accent" />
          <span>Время действия: {formatTime(timeLeft)}</span>
        </div>

        <div className={styles.instructions}>
          <div className={styles.instructionsTitle}>Как оплатить:</div>
          <ol>
            <li>Откройте мобильное приложение вашего банка</li>
            <li>Найдите раздел "Оплата по QR" или "СБП"</li>
            <li>Отсканируйте QR-код камерой телефона</li>
            <li>Подтвердите платёж в приложении</li>
            <li>Нажмите кнопку "Я оплатил" после успешной оплаты</li>
          </ol>
        </div>

        <div className={styles.supportedBanks}>
          <div className={styles.supportedBanksTitle}>Поддерживаемые банки:</div>
          <div className={styles.bankLogos}>
            <span><Icon name="building" size="sm" color="accent" /> Беларусбанк</span>
            <span><Icon name="building" size="sm" color="accent" /> Альфа-Банк</span>
            <span><Icon name="building" size="sm" color="accent" /> БелВЭБ</span>
            <span><Icon name="building" size="sm" color="accent" /> МТБанк</span>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Отмена
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? 'Оформляем заказ...' : 'Я оплатил'}
        </Button>
      </div>

      <div className={styles.note}>
        <Icon name="info" size="sm" color="accent" /> Это демонстрационный QR-код. Реальная оплата не производится.
      </div>
    </div>
  );
}
