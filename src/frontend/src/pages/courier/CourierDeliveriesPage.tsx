import { useState, useEffect, useCallback } from 'react';
import { servicesApi } from '@/api/services';
import type { ServiceRequestWithAssembly } from '@/api/types';
import { Package, Truck, CheckCircle } from 'lucide-react';

type DeliveryTicket = ServiceRequestWithAssembly & {
  status: 'ReadyForDelivery' | 'InDelivery';
};

export default function CourierDeliveriesPage() {
  const [tickets, setTickets] = useState<DeliveryTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // TODO: Backend has a dedicated GetCourierDeliveriesAsync endpoint.
  // The generated API client doesn't expose it yet — using getAllServiceRequests + client-side filter for now.
  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await servicesApi.getAllServiceRequests({ page: 1, pageSize: 50 });
      const filtered = (result.items as ServiceRequestWithAssembly[]).filter(
        (r) =>
          r.status === 'ReadyForDelivery' || r.status === 'InDelivery',
      );
      setTickets(filtered as DeliveryTicket[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await servicesApi.updateRequestStatus(id, newStatus);
      await fetchDeliveries();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка обновления статуса');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FCD535] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/10 p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Мои доставки</h1>

      {tickets.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center">
          Нет заявок для доставки
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-lg border border-hairline-dark bg-[#1e2329] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  #{ticket.requestNumber}
                </span>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                    ticket.status === 'ReadyForDelivery'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {ticket.status === 'ReadyForDelivery' ? 'Готово к доставке' : 'В доставке'}
                </span>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                {ticket.clientPhone && (
                  <p>Телефон: {ticket.clientPhone}</p>
                )}
                {ticket.assembledSerialNumber && (
                  <p className="flex items-center gap-1">
                    <Package size={14} className="shrink-0" />
                    {ticket.assembledSerialNumber}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                {ticket.status === 'ReadyForDelivery' && (
                  <button
                    onClick={() => handleStatusUpdate(ticket.id, 'InDelivery')}
                    disabled={updatingId === ticket.id}
                    className="flex items-center gap-1.5 rounded-lg bg-[#FCD535] px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-[#e6c030] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Truck size={14} />
                    Забрал
                  </button>
                )}
                {ticket.status === 'InDelivery' && (
                  <button
                    onClick={() => handleStatusUpdate(ticket.id, 'Delivered')}
                    disabled={updatingId === ticket.id}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={14} />
                    Доставлен
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
