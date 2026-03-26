import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { LogViewer } from './components/LogViewer';
import { BucketViewer } from './components/BucketViewer';
import { LLMPanel } from './components/LLMPanel';
import { NamespaceLanding } from './components/NamespaceLanding';
import type { FilterState, LogLevel } from './types';

const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
// Accept both UUID-style and origin-hostname-style namespaces (e.g. www.domain1.com)
const NAMESPACE_PATH_RE = /^\/([a-zA-Z0-9][a-zA-Z0-9._-]+)\/?$/i;

function getNamespaceFromPath(): string | null {
  const match = window.location.pathname.match(NAMESPACE_PATH_RE);
  return match ? match[1].toLowerCase() : null;
}

type ViewMode = 'list' | 'bucket';

function LogConsole({ wsUrl }: { wsUrl: string }) {
  const { logs, status, isPaused, togglePause, clearLogs } = useWebSocket(wsUrl);
  const [llmPanelOpen, setLlmPanelOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<FilterState>({
    levels: new Set<LogLevel>(['log', 'info', 'warn', 'error', 'debug']),
    searchText: '',
    caseSensitive: false,
  });

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `logs-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d1117] text-white overflow-hidden">
      <Header
        status={status}
        isPaused={isPaused}
        onTogglePause={togglePause}
        onClearLogs={clearLogs}
        onExportLogs={handleExportLogs}
        onToggleLLMPanel={() => setLlmPanelOpen(!llmPanelOpen)}
        llmPanelOpen={llmPanelOpen}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(v => v === 'list' ? 'bucket' : 'list')}
      />

      <FilterBar filter={filter} onFilterChange={setFilter} />

      <div className="flex-1 flex overflow-hidden relative">
        {viewMode === 'list' ? (
          <LogViewer logs={logs} filter={filter} />
        ) : (
          <BucketViewer
            logs={logs}
            searchText={filter.searchText}
            caseSensitive={filter.caseSensitive}
          />
        )}
        <LLMPanel
          logs={logs}
          isOpen={llmPanelOpen}
          onClose={() => setLlmPanelOpen(false)}
        />
      </div>
    </div>
  );
}

function App() {
  const namespace = getNamespaceFromPath();

  if (!namespace) {
    return <NamespaceLanding />;
  }

  const wsUrl = `${wsProtocol}//${window.location.host}/${namespace}`;
  return <LogConsole wsUrl={wsUrl} />;
}

export default App;
