import type { ConnectionStatus } from '../types';
import { StatusBar } from './StatusBar';

interface HeaderProps {
  status: ConnectionStatus;
  isPaused: boolean;
  onTogglePause: () => void;
  onClearLogs: () => void;
  onExportLogs: () => void;
  onToggleLLMPanel: () => void;
  llmPanelOpen: boolean;
}

export function Header({
  status,
  isPaused,
  onTogglePause,
  onClearLogs,
  onExportLogs,
  onToggleLLMPanel,
  llmPanelOpen,
}: HeaderProps) {
  return (
    <header className="bg-[#161b22] border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">
            <span className="text-blue-400">No</span>Console
          </h1>
          <StatusBar status={status} />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePause}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isPaused
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>

          <button
            onClick={onClearLogs}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md font-medium transition-colors"
          >
            🗑 Clear
          </button>

          <button
            onClick={onExportLogs}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md font-medium transition-colors"
          >
            📥 Export
          </button>

          <button
            onClick={onToggleLLMPanel}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              llmPanelOpen
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            🤖 AI Analysis
          </button>
        </div>
      </div>
    </header>
  );
}
