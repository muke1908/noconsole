export type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug' | 'group' | 'groupEnd' | 'groupCollapsed' | 'table' | 'time' | 'timeEnd' | 'timeLog' | 'count' | 'countReset' | 'assert' | 'clear' | 'dir' | 'dirxml' | 'trace';

export interface LogMessage {
  type: LogLevel;
  args: any[];
  timestamp: number;
  id: string;
}

export interface FilterState {
  levels: Set<LogLevel>;
  searchText: string;
  caseSensitive: boolean;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface LLMAnalysis {
  errors: string[];
  warnings: string[];
  performance: string[];
  recommendations: string[];
}
