import { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { LogMessage, FilterState } from '../types';
import { LogRow } from './LogRow';

interface LogViewerProps {
  logs: LogMessage[];
  filter: FilterState;
}

export function LogViewer({ logs, filter }: LogViewerProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const filteredLogs = logs.filter(log => {
    if (filter.levels.size > 0 && !filter.levels.has(log.type)) {
      return false;
    }

    if (filter.searchText) {
      const message = log.args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      const searchText = filter.caseSensitive ? filter.searchText : filter.searchText.toLowerCase();
      const messageText = filter.caseSensitive ? message : message.toLowerCase();
      
      if (!messageText.includes(searchText)) {
        return false;
      }
    }

    return true;
  });

  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  // Auto-scroll: use the virtualizer's scrollToIndex so virtual positions are respected
  useEffect(() => {
    if (autoScroll && filteredLogs.length > 0) {
      virtualizer.scrollToIndex(filteredLogs.length - 1, { align: 'end' });
    }
  }, [filteredLogs.length, autoScroll, virtualizer]);

  const handleScroll = () => {
    if (!parentRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
    setAutoScroll(isAtBottom);
  };

  return (
    // min-h-0 is critical: flex children don't shrink below their content size
    // by default. Without it, the scroll container never gets a bounded height
    // and the virtualizer has nothing to scroll within.
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div 
        ref={parentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0d1117] min-h-0"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">No logs to display</p>
              <p className="text-sm">Waiting for log messages...</p>
            </div>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const log = filteredLogs[virtualRow.index];
              return (
                <div
                  key={log.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <LogRow
                    log={log}
                    searchText={filter.searchText}
                    caseSensitive={filter.caseSensitive}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!autoScroll && (
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={() => {
              setAutoScroll(true);
              if (filteredLogs.length > 0) {
                virtualizer.scrollToIndex(filteredLogs.length - 1, { align: 'end' });
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-lg font-medium transition-colors flex items-center gap-2"
          >
            ⬇ Scroll to Bottom
          </button>
        </div>
      )}
    </div>
  );
}
