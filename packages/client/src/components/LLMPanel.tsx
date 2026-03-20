import { useState } from 'react';
import type { LogMessage } from '../types';
import { useLLM } from '../hooks/useLLM';

interface LLMPanelProps {
  logs: LogMessage[];
  isOpen: boolean;
  onClose: () => void;
}

export function LLMPanel({ logs, isOpen, onClose }: LLMPanelProps) {
  const [model, setModel] = useState('llama3');
  const { analyze, isAnalyzing, analysis, error } = useLLM();

  if (!isOpen) return null;

  const handleAnalyze = () => {
    analyze(logs, model);
  };

  return (
    <div className="w-96 bg-[#161b22] border-l border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">AI Analysis</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-4 border-b border-gray-700">
        <label className="block text-sm text-gray-400 mb-2">Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full px-3 py-2 bg-[#0d1117] border border-gray-700 rounded-md text-white focus:outline-none focus:border-blue-500"
        >
          <option value="llama3">llama3</option>
          <option value="llama2">llama2</option>
          <option value="mistral">mistral</option>
          <option value="codellama">codellama</option>
        </select>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || logs.length === 0}
          className="mt-3 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-md font-medium transition-colors"
        >
          {isAnalyzing ? '🔄 Analyzing...' : '🤖 Analyze Logs'}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-md p-3 mb-4">
            <p className="text-red-400 text-sm">
              <strong>Error:</strong> {error}
            </p>
            <p className="text-red-300 text-xs mt-2">
              Make sure Ollama is running at localhost:11434
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">🔄</div>
              <p className="text-gray-400">Analyzing logs with AI...</p>
            </div>
          </div>
        )}

        {analysis && !isAnalyzing && (
          <div className="space-y-4">
            <Section title="Errors" items={analysis.errors} color="red" />
            <Section title="Warnings" items={analysis.warnings} color="yellow" />
            <Section title="Performance" items={analysis.performance} color="blue" />
            <Section title="Recommendations" items={analysis.recommendations} color="green" />
          </div>
        )}

        {!analysis && !isAnalyzing && !error && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No analysis yet</p>
            <p className="text-sm">Click "Analyze Logs" to get AI insights</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  items: string[];
  color: 'red' | 'yellow' | 'blue' | 'green';
}

function Section({ title, items, color }: SectionProps) {
  const colorClasses = {
    red: 'border-red-700 bg-red-900/20',
    yellow: 'border-yellow-700 bg-yellow-900/20',
    blue: 'border-blue-700 bg-blue-900/20',
    green: 'border-green-700 bg-green-900/20',
  };

  const headerColors = {
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
  };

  return (
    <div className={`border rounded-md p-3 ${colorClasses[color]}`}>
      <h3 className={`font-bold mb-2 ${headerColors[color]}`}>{title}</h3>
      <ul className="space-y-1 text-sm text-gray-300">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-gray-500">•</span>
            <span className="flex-1">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
