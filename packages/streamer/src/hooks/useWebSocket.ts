import { useState, useEffect, useRef, useCallback } from 'react';
import type { LogMessage, ConnectionStatus } from '../types';

const MAX_PAUSED_LOGS = 10000;

export function useWebSocket(url: string) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isPaused, setIsPaused] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pausedLogsRef = useRef<LogMessage[]>([]);
  // Track isPaused in a ref so the WebSocket message handler always reads
  // the current value without needing to be in the connect() closure.
  // Without this, toggling pause would force a reconnect and lose in-flight messages.
  const isPausedRef = useRef(false);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const raw = event.data;
          if (typeof raw !== 'string' || !raw.trim().startsWith('{')) {
            return;
          }
          const message: LogMessage = JSON.parse(raw);
          // Validate the message has the required fields
          if (!message.type || !Array.isArray(message.args) || typeof message.timestamp !== 'number') {
            return;
          }

          if (isPausedRef.current) {
            if (pausedLogsRef.current.length >= MAX_PAUSED_LOGS) {
              pausedLogsRef.current.shift();
            }
            pausedLogsRef.current.push(message);
          } else {
            setLogs(prev => [...prev, message]);
          }
        } catch (error) {
          // Silently drop unparseable messages
        }
      };

      ws.onerror = () => {
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus('disconnected');
        setTimeout(() => {
          if (wsRef.current === ws) {
            connect();
          }
        }, 3000);
      };

      wsRef.current = ws;
    } catch (error) {
      setStatus('error');
    }
  }, [url]);

  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Keep isPausedRef in sync with the isPaused state
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => {
      if (prev) {
        // Resuming - add paused logs
        if (pausedLogsRef.current.length > 0) {
          setLogs(currentLogs => [...currentLogs, ...pausedLogsRef.current]);
          pausedLogsRef.current = [];
        }
      }
      return !prev;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    pausedLogsRef.current = [];
  }, []);

  return {
    logs,
    status,
    isPaused,
    togglePause,
    clearLogs,
  };
}
