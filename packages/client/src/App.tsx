import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { LogViewer } from './components/LogViewer';
import { LLMPanel } from './components/LLMPanel';
import type { FilterState, LogLevel } from './types';

const DEFAULT_WS_URL = 'ws://localhost:8080';

function App() {
  const { logs, status, isPaused, togglePause, clearLogs } = useWebSocket(DEFAULT_WS_URL);
  const [llmPanelOpen, setLlmPanelOpen] = useState(false);
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
      />
      
      <FilterBar filter={filter} onFilterChange={setFilter} />
      
      <div className="flex-1 flex overflow-hidden relative">
        <LogViewer logs={logs} filter={filter} />
        <LLMPanel 
          logs={logs} 
          isOpen={llmPanelOpen} 
          onClose={() => setLlmPanelOpen(false)} 
        />
      </div>
    </div>
  );
}

export default App;
