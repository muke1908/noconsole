import { useState, useEffect, useRef, useCallback } from 'react';
import type { LogMessage, ConnectionStatus } from '../types';

export function useWebSocket(url: string) {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isPaused, setIsPaused] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pausedLogsRef = useRef<LogMessage[]>([]);

  const MAX_PAUSED_LOGS = 10000;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const message: LogMessage = JSON.parse(event.data);
          
          if (isPaused) {
            if (pausedLogsRef.current.length >= MAX_PAUSED_LOGS) {
              pausedLogsRef.current.shift();
            }
            pausedLogsRef.current.push(message);
          } else {
            setLogs(prev => [...prev, message]);
          }
        } catch (error) {
          console.error('Failed to parse log message:', error);
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
  }, [url, isPaused]);

  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

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
