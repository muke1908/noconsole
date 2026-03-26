import { useMemo, useRef, useEffect } from 'react';
import type { LogMessage } from '../types';

interface BucketViewerProps {
  logs: LogMessage[];
  searchText: string;
  caseSensitive: boolean;
}

const BUCKET_SIZE_MS = 10_000; // 10-second buckets

const BUCKET_LEVELS = ['error', 'debug', 'info', 'warn'] as const;
type BucketLevel = (typeof BUCKET_LEVELS)[number];

interface BucketData {
  bucketStart: number;
  error: LogMessage[];
  debug: LogMessage[];
  info: LogMessage[];
  warn: LogMessage[];
}

const levelTextColors: Record<BucketLevel, string> = {
  error: 'text-red-400',
  debug: 'text-purple-400',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
};

const levelHeaderColors: Record<BucketLevel, string> = {
  error: 'bg-red-950 text-red-300 border-red-800',
  debug: 'bg-purple-950 text-purple-300 border-purple-800',
  info: 'bg-blue-950 text-blue-300 border-blue-800',
  warn: 'bg-yellow-950 text-yellow-300 border-yellow-800',
};

function formatArgs(args: any[]): string {
  return args
    .map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(' ');
}

function formatBucketTime(bucketStart: number): string {
  const fmt = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  return `${fmt(bucketStart)} – ${fmt(bucketStart + BUCKET_SIZE_MS)}`;
}

export function BucketViewer({ logs, searchText, caseSensitive }: BucketViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const buckets = useMemo<BucketData[]>(() => {
    const map = new Map<number, BucketData>();

    for (const log of logs) {
      if (!(BUCKET_LEVELS as readonly string[]).includes(log.type)) continue;

      if (searchText) {
        const msg = formatArgs(log.args);
        const haystack = caseSensitive ? msg : msg.toLowerCase();
        const needle = caseSensitive ? searchText : searchText.toLowerCase();
        if (!haystack.includes(needle)) continue;
      }

      const key = Math.floor(log.timestamp / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;
      if (!map.has(key)) {
        map.set(key, { bucketStart: key, error: [], debug: [], info: [], warn: [] });
      }
      (map.get(key)![log.type as BucketLevel] as LogMessage[]).push(log);
    }

    return Array.from(map.values()).sort((a, b) => a.bucketStart - b.bucketStart);
  }, [logs, searchText, caseSensitive]);

  // Auto-scroll to the latest bucket
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [buckets.length]);

  if (buckets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d1117] text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No logs to display</p>
          <p className="text-sm">Waiting for log messages…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#0d1117] min-h-0">
      <table className="w-full border-collapse text-sm table-fixed">
        <colgroup>
          <col className="w-36" />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="px-3 py-2 text-left text-gray-400 font-medium bg-[#161b22] border-b border-r border-gray-700">
              Time Bucket
            </th>
            {BUCKET_LEVELS.map(level => (
              <th
                key={level}
                className={`px-3 py-2 text-left font-semibold border-b border-r uppercase tracking-wide ${levelHeaderColors[level]}`}
              >
                {level}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket, i) => (
            <tr
              key={bucket.bucketStart}
              className={i % 2 === 0 ? 'bg-[#0d1117]' : 'bg-[#111820]'}
            >
              <td className="px-3 py-2 text-gray-500 font-mono text-xs align-top border-b border-r border-gray-800 whitespace-nowrap">
                {formatBucketTime(bucket.bucketStart)}
              </td>
              {BUCKET_LEVELS.map(level => (
                <td
                  key={level}
                  className="px-3 py-2 align-top border-b border-r border-gray-800"
                >
                  {bucket[level].length === 0 ? (
                    <span className="text-gray-700 text-xs italic">n/a</span>
                  ) : (
                    <div className="space-y-1">
                      {bucket[level].map(log => (
                        <div
                          key={log.id}
                          className={`font-mono text-xs break-words ${levelTextColors[level]}`}
                        >
                          {formatArgs(log.args)}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div ref={bottomRef} />
    </div>
  );
}
