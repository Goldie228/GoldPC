import { Link } from 'react-router-dom';
import { Button } from '../../components/ui';
import { TICKET_STATUSES } from '../../api/services';

export interface SuccessScreenProps {
  ticketNumber: string;
  status: string;
  onNewRequest: () => void;
}

/**
 * Color classes map for each status color from TICKET_STATUSES.
 */
const statusColorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-[#3b82f6]/20', text: 'text-[#3b82f6]' },
  yellow: { bg: 'bg-[#fcd535]/20', text: 'text-[#fcd535]' },
  green: { bg: 'bg-[#0ecb81]/20', text: 'text-[#0ecb81]' },
  red: { bg: 'bg-[#f6465d]/20', text: 'text-[#f6465d]' },
  orange: { bg: 'bg-[#f59e0b]/20', text: 'text-[#f59e0b]' },
  purple: { bg: 'bg-[#8b5cf6]/20', text: 'text-[#8b5cf6]' },
  cyan: { bg: 'bg-[#06b6d4]/20', text: 'text-[#06b6d4]' },
  gray: { bg: 'bg-[#707a8a]/20', text: 'text-[#707a8a]' },
};

/**
 * SuccessScreen — shown after a service ticket has been successfully created.
 *
 * Displays a green checkmark, the ticket number, its status badge, a "What's next?"
 * section with numbered steps, and three action buttons.
 */
export function SuccessScreen({ ticketNumber, status, onNewRequest }: SuccessScreenProps) {
  const statusEntry = TICKET_STATUSES.find((s) => s.key === status);
  const statusLabel = statusEntry?.label ?? status;
  const colorKey = statusEntry?.color ?? 'gray';
  const colorClasses = statusColorMap[colorKey] ?? statusColorMap.gray;

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
      <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-8 max-w-[480px] w-full">
        {/* Success icon — green circle with checkmark */}
        <svg
          className="w-16 h-16 text-[#0ecb81] mb-6 mx-auto"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="16 8 10 16 7 13" />
        </svg>

        {/* Headline */}
        <h2 className="text-[#fcd535] text-2xl font-semibold mb-2">
          Заявка создана!
        </h2>

        {/* Ticket number */}
        <p className="text-[#ffffff] text-4xl font-bold mb-1">
          #{ticketNumber}
        </p>

        {/* Status badge */}
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClasses.bg} ${colorClasses.text}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#2b3139] my-8" />

        {/* What's next section */}
        <div className="text-left">
          <h3 className="text-[#eaecef] font-semibold text-base mb-4">
            Что дальше?
          </h3>

          <div className="flex items-start gap-3 mb-3">
            <span className="w-6 h-6 rounded-full bg-[#2b3139] flex items-center justify-center text-xs text-[#707a8a] shrink-0 mt-0.5">
              1
            </span>
            <span className="text-[#eaecef] text-sm">
              Наш мастер свяжется с вами в ближайшее время
            </span>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#2b3139] flex items-center justify-center text-xs text-[#707a8a] shrink-0 mt-0.5">
              2
            </span>
            <span className="text-[#eaecef] text-sm">
              Вы можете отслеживать статус заявки в личном кабинете
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mt-8">
          <Link to="/account/repairs" className="w-full">
            <Button variant="primary" fullWidth>
              Отслеживать статус
            </Button>
          </Link>
          <Link to="/" className="w-full">
            <Button variant="secondary" fullWidth>
              На главную
            </Button>
          </Link>
          <Button variant="outline" fullWidth onClick={onNewRequest}>
            Ещё заявка
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SuccessScreen;
