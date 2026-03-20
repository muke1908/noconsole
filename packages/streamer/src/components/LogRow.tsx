import type { LogMessage } from '../types';
import { highlightText } from '../utils/highlight';

interface LogRowProps {
  log: LogMessage;
  searchText: string;
  caseSensitive: boolean;
}

export function LogRow({ log, searchText, caseSensitive }: LogRowProps) {
  const levelColors = {
    log: 'text-white',
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    debug: 'text-purple-400',
    group: 'text-cyan-400',
    groupEnd: 'text-cyan-400',
    groupCollapsed: 'text-cyan-400',
    table: 'text-green-400',
    time: 'text-orange-400',
    timeEnd: 'text-orange-400',
    timeLog: 'text-orange-400',
    count: 'text-pink-400',
    countReset: 'text-pink-400',
    assert: 'text-red-400',
    clear: 'text-gray-400',
    dir: 'text-cyan-400',
    dirxml: 'text-cyan-400',
    trace: 'text-gray-400',
  };

  const levelBadges = {
    log: 'bg-gray-700 text-gray-200',
    info: 'bg-blue-900 text-blue-200',
    warn: 'bg-yellow-900 text-yellow-200',
    error: 'bg-red-900 text-red-200',
    debug: 'bg-purple-900 text-purple-200',
    group: 'bg-cyan-900 text-cyan-200',
    groupEnd: 'bg-cyan-900 text-cyan-200',
    groupCollapsed: 'bg-cyan-900 text-cyan-200',
    table: 'bg-green-900 text-green-200',
    time: 'bg-orange-900 text-orange-200',
    timeEnd: 'bg-orange-900 text-orange-200',
    timeLog: 'bg-orange-900 text-orange-200',
    count: 'bg-pink-900 text-pink-200',
    countReset: 'bg-pink-900 text-pink-200',
    assert: 'bg-red-900 text-red-200',
    clear: 'bg-gray-900 text-gray-200',
    dir: 'bg-cyan-900 text-cyan-200',
    dirxml: 'bg-cyan-900 text-cyan-200',
    trace: 'bg-gray-900 text-gray-200',
  };

  const timestamp = new Date(log.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const milliseconds = String(log.timestamp % 1000).padStart(3, '0');
  const fullTimestamp = `${timestamp}.${milliseconds}`;

  const message = log.args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');

  const highlightedMessage = searchText 
    ? highlightText(message, searchText, caseSensitive)
    : message;

  return (
    <div className="group flex items-start gap-3 px-4 py-2 hover:bg-gray-900/50 transition-colors border-b border-gray-800/50 animate-fadeIn">
      <span className="text-xs text-gray-500 font-mono shrink-0 w-24">
        {fullTimestamp}
      </span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase shrink-0 ${levelBadges[log.type]}`}>
        {log.type}
      </span>
      <pre className={`flex-1 font-mono text-sm whitespace-pre-wrap break-words ${levelColors[log.type]}`}>
        {highlightedMessage}
      </pre>
    </div>
  );
}
