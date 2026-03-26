import apiClient, { BASE_URL } from '../api/client';

type TelemetryProps = Record<string, unknown>;

type TelemetryEvent = {
  name: string;
  ts: string;
  props?: TelemetryProps;
};

const SESSION_KEY = 'telemetrySessionId';

function getOrCreateSessionId(): string {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

const queue: TelemetryEvent[] = [];
let flushTimer: number | null = null;

function scheduleFlush(): void {
  if (flushTimer != null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flush();
  }, 1500);
}

async function flush(): Promise<void> {
  if (queue.length === 0) return;
  const sessionId = getOrCreateSessionId();
  const events = queue.splice(0, Math.min(queue.length, 50));

  try {
    await apiClient.post('/catalog/telemetry/events', { sessionId, events });
  } catch {
    // Телеметрия не должна ломать UX. Тихо теряем события.
  }
}

export function telemetryTrack(name: string, props?: TelemetryProps): void {
  if (!name || !name.trim()) return;
  queue.push({ name, ts: new Date().toISOString(), props });
  scheduleFlush();
}

export function telemetryInitAutoFlush(): void {
  // Best-effort flush on page hide
  const handler = () => {
    if (queue.length === 0) return;
    const sessionId = getOrCreateSessionId();
    const events = queue.splice(0, queue.length);

    // Prefer sendBeacon if available
    const body = JSON.stringify({ sessionId, events });
    const url = `${BASE_URL}/catalog/telemetry/events`;
    if (navigator.sendBeacon) {
      try {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
        return;
      } catch {
        // ignore
      }
    }

    void apiClient.post('/catalog/telemetry/events', { sessionId, events }).catch(() => undefined);
  };

  window.addEventListener('pagehide', handler);
  window.addEventListener('beforeunload', handler);
}

