export interface LogMessage {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug' | 'group' | 'groupEnd' | 'groupCollapsed' | 'table' | 'time' | 'timeEnd' | 'timeLog' | 'count' | 'countReset' | 'assert' | 'clear' | 'dir' | 'dirxml' | 'trace';
  args: any[];
  timestamp: number;
  id: string;
}

export class WebSocketLogger implements Console {
  private ws: WebSocket;
  private timers: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();

  constructor(url: string | URL) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? event.data : '';
        const message = JSON.parse(data);
        if (message.type === 'namespace' && message.viewerUrl) {
          // Print to the real console so the developer knows which URL to open
          // eslint-disable-next-line no-console
          console.log(`[NoConsole] View logs at: ${message.viewerUrl}`);
        }
      } catch {
        // Ignore unparseable server messages
      }
    };
  }

  private send(type: LogMessage['type'], ...args: any[]) {
    const message: LogMessage = {
      type,
      args,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        // Fail silently if WebSocket is not ready
      }
    }
  }

  log(...args: any[]): void {
    this.send('log', ...args);
  }

  warn(...args: any[]): void {
    this.send('warn', ...args);
  }

  error(...args: any[]): void {
    this.send('error', ...args);
  }

  info(...args: any[]): void {
    this.send('info', ...args);
  }

  debug(...args: any[]): void {
    this.send('debug', ...args);
  }

  group(...args: any[]): void {
    this.send('group', ...args);
  }

  groupEnd(): void {
    this.send('groupEnd');
  }

  groupCollapsed(...args: any[]): void {
    this.send('groupCollapsed', ...args);
  }

  table(data?: any, columns?: string[]): void {
    this.send('table', data, columns);
  }

  time(label?: string): void {
    const key = label || 'default';
    this.timers.set(key, Date.now());
    this.send('time', label);
  }

  timeEnd(label?: string): void {
    const key = label || 'default';
    const startTime = this.timers.get(key);
    if (startTime !== undefined) {
      const duration = Date.now() - startTime;
      this.timers.delete(key);
      this.send('timeEnd', label, duration);
    }
  }

  timeLog(label?: string, ...data: any[]): void {
    const key = label || 'default';
    const startTime = this.timers.get(key);
    if (startTime !== undefined) {
      const duration = Date.now() - startTime;
      this.send('timeLog', label, duration, ...data);
    }
  }

  count(label?: string): void {
    const key = label || 'default';
    const current = (this.counters.get(key) || 0) + 1;
    this.counters.set(key, current);
    this.send('count', label, current);
  }

  countReset(label?: string): void {
    const key = label || 'default';
    this.counters.delete(key);
    this.send('countReset', label);
  }

  assert(condition?: boolean, ...data: any[]): void {
    if (!condition) {
      this.send('assert', ...data);
    }
  }

  clear(): void {
    this.send('clear');
  }

  dir(obj?: any, options?: any): void {
    this.send('dir', obj, options);
  }

  dirxml(...data: any[]): void {
    this.send('dirxml', ...data);
  }

  trace(...data: any[]): void {
    this.send('trace', ...data);
  }

  // Additional Console methods required by Console interface
  profile(label?: string): void {
    this.send('log', `Profile: ${label}`);
  }
  profileEnd(label?: string): void {
    this.send('log', `ProfileEnd: ${label}`);
  }
  timeStamp(label?: string): void {
    this.send('log', `TimeStamp: ${label}`);
  }
  
  // Console property - not implemented
  get Console(): typeof console.Console {
    return console.Console;
  }
}
