import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

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
    void generateQRCode();
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
    <div className="bg-card p-6 rounded-xl border border-border">
      <div className="text-center">
        <h3 className="mb-6 text-xl font-semibold text-foreground">Оплата через СБП</h3>

        <div className="relative inline-block p-4 bg-white rounded-xl my-4">
          <canvas ref={canvasRef} className="block" />
          {!qrGenerated && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground text-sm">Генерация QR-кода...</div>
          )}
        </div>

        <div className="flex justify-center items-center gap-2 my-6 text-lg">
          <span className="text-muted-foreground">К оплате:</span>
          <span className="font-bold text-gold text-2xl">{amount.toFixed(2)} BYN</span>
        </div>

        <div className="flex justify-center items-center gap-2 my-4 p-2.5 px-4 bg-gold/5 border border-gold/15 rounded-lg text-muted-foreground text-sm">
          <Icon name="clock" size="sm" color="accent" />
          <span>Время действия: {formatTime(timeLeft)}</span>
        </div>

        <div className="text-left my-6 p-5 bg-elevated rounded-lg">
          <div className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Как оплатить:</div>
          <ol className="m-0 pl-5 text-muted-foreground">
            <li className="mb-2 leading-relaxed text-sm">Откройте мобильное приложение вашего банка</li>
            <li className="mb-2 leading-relaxed text-sm">Найдите раздел "Оплата по QR" или "СБП"</li>
            <li className="mb-2 leading-relaxed text-sm">Отсканируйте QR-код камерой телефона</li>
            <li className="mb-2 leading-relaxed text-sm">Подтвердите платёж в приложении</li>
            <li className="mb-2 leading-relaxed text-sm">Нажмите кнопку "Я оплатил" после успешной оплаты</li>
          </ol>
        </div>

        <div className="text-left my-5 p-4 bg-elevated rounded-lg">
          <div className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Поддерживаемые банки:</div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 p-2 py-1.5 px-3.5 bg-card border border-border rounded-md text-sm text-muted-foreground"><Icon name="building" size="sm" color="accent" /> Беларусбанк</span>
            <span className="inline-flex items-center gap-1.5 p-2 py-1.5 px-3.5 bg-card border border-border rounded-md text-sm text-muted-foreground"><Icon name="building" size="sm" color="accent" /> Альфа-Банк</span>
            <span className="inline-flex items-center gap-1.5 p-2 py-1.5 px-3.5 bg-card border border-border rounded-md text-sm text-muted-foreground"><Icon name="building" size="sm" color="accent" /> БелВЭБ</span>
            <span className="inline-flex items-center gap-1.5 p-2 py-1.5 px-3.5 bg-card border border-border rounded-md text-sm text-muted-foreground"><Icon name="building" size="sm" color="accent" /> МТБанк</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Отмена
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => void onConfirm()}
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Оформляем заказ...' : 'Я оплатил'}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 mt-5 p-3 px-4 bg-gold/5 border border-gold/15 rounded-lg text-sm text-muted-foreground text-center">
        <Icon name="info" size="sm" color="accent" /> Это демонстрационный QR-код. Реальная оплата не производится.
      </div>
    </div>
  );
}
