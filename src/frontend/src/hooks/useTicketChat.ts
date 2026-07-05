import { useState, useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

export interface TicketMessage {
  id: string;
  serviceRequestId: string;
  authorId: string;
  authorRole: 'Client' | 'Master' | 'Manager' | 'System';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
  createdAt: string;
  readAt?: string;
}

interface UseTicketChatOptions {
  ticketId: string | undefined;
  /** @default 50 */
  pageSize?: number;
}

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

interface UseTicketChatReturn {
  messages: TicketMessage[];
  loading: boolean;
  sending: boolean;
  uploading: boolean;
  error: string | null;
  hasMore: boolean;
  typingUserId: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  sendMessage: (content: string, fileInfo?: { fileUrl: string; fileName: string; fileSize?: number; contentType?: string }) => Promise<void>;
  uploadFile: (file: File) => Promise<UploadResult | null>;
  loadMore: () => Promise<void>;
  markRead: () => Promise<void>;
}

/**
 * Хук для чата тикетов в реальном времени через SignalR + история REST
 */
export function useTicketChat({ ticketId, pageSize = 50 }: UseTicketChatOptions): UseTicketChatReturn {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const pageRef = useRef(1);
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Get auth token from storage
  const getToken = useCallback((): string | null => {
    return localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
  }, []);

  // Load messages from REST API
  const loadMessages = useCallback(async (page: number, append: boolean = false) => {
    if (!ticketId) return;

    try {
      setError(null);
      const token = getToken();
      const response = await fetch(`/api/v1/services/${ticketId}/messages?page=${page}&pageSize=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to load messages');

      const json = await response.json();
      let data: TicketMessage[] = json.data || [];

      // Backend returns OrderByDescending(CreatedAt) — newest first.
      // Reverse to oldest-first for chat display.
      data = data.reverse();

      setHasMore(data.length >= pageSize);

      if (append) {
        // data is older messages (страница N+1) → prepend before current (newer) messages
        setMessages(prev => [...data, ...prev]);
      } else {
        setMessages(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [ticketId, pageSize, getToken]);

  // Initial load
  useEffect(() => {
    if (!ticketId) return;

    pageRef.current = 1;
    setMessages([]);
    setLoading(true);
    loadMessages(1);
  }, [ticketId, loadMessages]);

  // SignalR connection
  useEffect(() => {
    if (!ticketId) return;

    const token = getToken();
    if (!token) return;

    let isMounted = true;

    const startConnection = async () => {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/chat', {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      connection.on('ReceiveMessage', (message: TicketMessage) => {
        if (!isMounted) return;
        setMessages(prev => {
          // Skip duplicates
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      });

      connection.on('UserTyping', (data: { ticketId: string; userId: string }) => {
        if (!isMounted) return;
        setTypingUserId(data.userId);

        // Auto-clear after 4s of no typing signal
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          if (isMounted) setTypingUserId(null);
        }, 4000);
      });

      connection.on('MessageRead', (data: { ticketId: string; userId: string }) => {
        if (!isMounted) return;
        // Could mark messages as read in UI
      });

      connection.onreconnecting(() => {
        if (isMounted) setConnectionStatus('connecting');
      });

      connection.onreconnected(() => {
        if (isMounted) {
          setConnectionStatus('connected');
          // Re-join ticket group after reconnect
          connection.invoke('JoinTicket', ticketId).catch(() => {});
        }
      });

      connection.onclose(() => {
        if (isMounted) setConnectionStatus('disconnected');
      });

      try {
        if (isMounted) setConnectionStatus('connecting');
        await connection.start();
        await connection.invoke('JoinTicket', ticketId);
        if (isMounted) {
          setConnectionStatus('connected');
          connectionRef.current = connection;
        }
      } catch (e) {
        if (isMounted) {
          console.error('SignalR connection failed:', e);
          setConnectionStatus('error');
        }
      }
    };

    startConnection();

    return () => {
      isMounted = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (connectionRef.current) {
        connectionRef.current.invoke('LeaveTicket', ticketId).catch(() => {});
        connectionRef.current.off('ReceiveMessage');
        connectionRef.current.off('UserTyping');
        connectionRef.current.off('MessageRead');
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      }
    };
  }, [ticketId, getToken]);

  const sendMessage = useCallback(async (content: string, fileInfo?: { fileUrl: string; fileName: string; fileSize?: number; contentType?: string }) => {
    if (!ticketId || (!content.trim() && !fileInfo) || !connectionRef.current) return;

    const payload = {
      content: content.trim(),
      fileUrl: fileInfo?.fileUrl,
      fileName: fileInfo?.fileName,
      fileSize: fileInfo?.fileSize,
      contentType: fileInfo?.contentType,
    };

    setSending(true);
    try {
      await connectionRef.current.invoke('SendMessage', ticketId, payload.content, payload.fileUrl, payload.fileName, payload.fileSize, payload.contentType);
    } catch (e) {
      // Запасной вариант to REST
      try {
        const token = getToken();
        const response = await fetch(`/api/v1/services/${ticketId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to send message');
        const json = await response.json();
        const message = json.data;
        if (message) {
          setMessages(prev => [...prev, message]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to send message');
      }
    } finally {
      setSending(false);
    }
  }, [ticketId, getToken]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    pageRef.current += 1;
    await loadMessages(pageRef.current, true);
  }, [hasMore, loading, loadMessages]);

  const markRead = useCallback(async () => {
    if (!ticketId || !connectionRef.current) return;
    try {
      await connectionRef.current.invoke('MarkRead', ticketId);
    } catch {
      // Silent fail
    }
  }, [ticketId]);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult | null> => {
    if (!ticketId) return null;

    setUploading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/v1/services/${ticketId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.message || 'Ошибка загрузки файла');
      }

      const json = await response.json();
      return json.data as UploadResult;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки файла');
      return null;
    } finally {
      setUploading(false);
    }
  }, [ticketId, getToken]);

  return {
    messages,
    loading,
    sending,
    uploading,
    error,
    hasMore,
    typingUserId,
    connectionStatus,
    sendMessage,
    uploadFile,
    loadMore,
    markRead,
  };
}
