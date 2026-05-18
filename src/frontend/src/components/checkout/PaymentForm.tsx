import { useState, type FormEvent, type ChangeEvent } from 'react';
import {
  validateCardNumberLuhn,
  validateCardExpiry,
  validateCVV,
  validateCardHolder,
  formatCardNumber,
  formatCardExpiry,
  getCardType,
} from '../../utils/cardValidation';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

interface PaymentFormProps {
  onSubmit: (data: PaymentData) => Promise<void>;
  onCancel: () => void;
}

export interface PaymentData {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
}

export function PaymentForm({ onSubmit, onCancel }: PaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<keyof PaymentData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PaymentData, boolean>>>({});

  const cardType = getCardType(cardNumber);

  const handleCardNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 19) {
      setCardNumber(value);
      if (touched.cardNumber) {
        validateField('cardNumber', value);
      }
    }
  };

  const handleExpiryChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setExpiry(value);
      if (touched.expiry) {
        validateField('expiry', formatCardExpiry(value));
      }
    }
  };

  const handleCvvChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCvv(value);
      if (touched.cvv) {
        validateField('cvv', value);
      }
    }
  };

  const handleCardHolderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCardHolder(value);
    if (touched.cardHolder) {
      validateField('cardHolder', value);
    }
  };

  const validateField = (field: keyof PaymentData, value: string): boolean => {
    let error = '';

    switch (field) {
      case 'cardNumber':
        if (!value) {
          error = 'Введите номер карты';
        } else if (!validateCardNumberLuhn(value)) {
          error = 'Неверный номер карты';
        }
        break;

      case 'cardHolder':
        if (!value) {
          error = 'Введите имя держателя';
        } else if (!validateCardHolder(value)) {
          error = 'Имя должно содержать только буквы';
        }
        break;

      case 'expiry':
        if (!value) {
          error = 'Введите срок действия';
        } else if (!validateCardExpiry(value)) {
          error = 'Неверный срок действия';
        }
        break;

      case 'cvv':
        if (!value) {
          error = 'Введите CVV';
        } else if (!validateCVV(value, cardType)) {
          error = 'CVV должен содержать 3 цифры';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleBlur = (field: keyof PaymentData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    let value = '';
    switch (field) {
      case 'cardNumber': value = cardNumber; break;
      case 'cardHolder': value = cardHolder; break;
      case 'expiry': value = formatCardExpiry(expiry); break;
      case 'cvv': value = cvv; break;
    }
    
    validateField(field, value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Валидация всех полей
    const formattedExpiry = formatCardExpiry(expiry);
    const isCardNumberValid = validateField('cardNumber', cardNumber);
    const isCardHolderValid = validateField('cardHolder', cardHolder);
    const isExpiryValid = validateField('expiry', formattedExpiry);
    const isCvvValid = validateField('cvv', cvv);

    setTouched({
      cardNumber: true,
      cardHolder: true,
      expiry: true,
      cvv: true,
    });

    if (!isCardNumberValid || !isCardHolderValid || !isExpiryValid || !isCvvValid) {
      return;
    }

    setIsProcessing(true);

    try {
      // Имитация обработки платежа (3 секунды)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 90% успех, 10% ошибка
      const success = Math.random() > 0.1;

      if (!success) {
        throw new Error('Ошибка обработки платежа. Попробуйте снова.');
      }

      await onSubmit({
        cardNumber,
        cardHolder,
        expiry: formattedExpiry,
        cvv,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка обработки платежа');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCardIcon = () => {
    switch (cardType) {
      case 'visa': return <Icon name="credit-card" size="sm" color="accent" />;
      case 'mastercard': return <Icon name="credit-card" size="sm" color="accent" />;
      case 'maestro': return <Icon name="credit-card" size="sm" color="accent" />;
      case 'mir': return <Icon name="credit-card" size="sm" color="accent" />;
      default: return <Icon name="credit-card" size="sm" color="accent" />;
    }
  };

  return (
    <form className="bg-card p-6 rounded-xl border border-border" onSubmit={(e) => void handleSubmit(e)}>
      <div className="mb-5">
        <label htmlFor="cardNumber" className="block mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Номер карты
          {cardType !== 'unknown' && <span className="ml-2 text-sm">{getCardIcon()}</span>}
        </label>
        <input
          id="cardNumber"
          type="text"
          placeholder="1234 5678 9012 3456"
          value={formatCardNumber(cardNumber)}
          onChange={handleCardNumberChange}
          onBlur={() => handleBlur('cardNumber')}
          className={`w-full p-3 text-sm border border-border rounded-lg bg-elevated text-foreground font-sans transition-all duration-200 hover:border-gold/15 focus:outline-none focus:border-gold focus:ring-3 focus:ring-gold/15 placeholder:text-foreground-dim ${touched.cardNumber && errors.cardNumber ? 'border-destructive/65 focus:ring-destructive/10' : ''}`}
          disabled={isProcessing}
          maxLength={19}
        />
        {touched.cardNumber && errors.cardNumber && (
          <span className="block mt-1.5 text-xs text-destructive">{errors.cardNumber}</span>
        )}
      </div>

      <div className="mb-5">
        <label htmlFor="cardHolder" className="block mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Имя держателя (как на карте)</label>
        <input
          id="cardHolder"
          type="text"
          placeholder="IVAN IVANOV"
          value={cardHolder}
          onChange={handleCardHolderChange}
          onBlur={() => handleBlur('cardHolder')}
          className={`w-full p-3 text-sm border border-border rounded-lg bg-elevated text-foreground font-sans transition-all duration-200 hover:border-gold/15 focus:outline-none focus:border-gold focus:ring-3 focus:ring-gold/15 placeholder:text-foreground-dim ${touched.cardHolder && errors.cardHolder ? 'border-destructive/65 focus:ring-destructive/10' : ''}`}
          disabled={isProcessing}
        />
        {touched.cardHolder && errors.cardHolder && (
          <span className="block mt-1.5 text-xs text-destructive">{errors.cardHolder}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="mb-5">
          <label htmlFor="expiry" className="block mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Срок действия</label>
          <input
            id="expiry"
            type="text"
            placeholder="MM/YY"
            value={formatCardExpiry(expiry)}
            onChange={handleExpiryChange}
            onBlur={() => handleBlur('expiry')}
            className={`w-full p-3 text-sm border border-border rounded-lg bg-elevated text-foreground font-sans transition-all duration-200 hover:border-gold/15 focus:outline-none focus:border-gold focus:ring-3 focus:ring-gold/15 placeholder:text-foreground-dim ${touched.expiry && errors.expiry ? 'border-destructive/65 focus:ring-destructive/10' : ''}`}
            disabled={isProcessing}
            maxLength={5}
          />
          {touched.expiry && errors.expiry && (
            <span className="block mt-1.5 text-xs text-destructive">{errors.expiry}</span>
          )}
        </div>

        <div className="mb-5">
          <label htmlFor="cvv" className="block mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">CVV</label>
          <input
            id="cvv"
            type="password"
            placeholder="123"
            value={cvv}
            onChange={handleCvvChange}
            onBlur={() => handleBlur('cvv')}
            className={`w-full p-3 text-sm border border-border rounded-lg bg-elevated text-foreground font-sans transition-all duration-200 hover:border-gold/15 focus:outline-none focus:border-gold focus:ring-3 focus:ring-gold/15 placeholder:text-foreground-dim ${touched.cvv && errors.cvv ? 'border-destructive/65 focus:ring-destructive/10' : ''}`}
            disabled={isProcessing}
            maxLength={4}
          />
          {touched.cvv && errors.cvv && (
            <span className="block mt-1.5 text-xs text-destructive">{errors.cvv}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-gold/5 border border-gold/15 rounded-lg text-sm text-muted-foreground text-center my-5">
        <Icon name="lock" size="sm" color="accent" /> Ваши платёжные данные защищены и не сохраняются на наших серверах
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
          type="submit"
          variant="primary"
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Обработка платежа...' : 'Оплатить'}
        </Button>
      </div>
    </form>
  );
}
