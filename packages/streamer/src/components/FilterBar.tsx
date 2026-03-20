import type { LogLevel, FilterState } from '../types';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
}

const LOG_LEVELS: { level: LogLevel; label: string; color: string }[] = [
  { level: 'log', label: 'Log', color: 'bg-gray-600 text-white' },
  { level: 'info', label: 'Info', color: 'bg-blue-600 text-white' },
  { level: 'warn', label: 'Warn', color: 'bg-yellow-600 text-white' },
  { level: 'error', label: 'Error', color: 'bg-red-600 text-white' },
  { level: 'debug', label: 'Debug', color: 'bg-purple-600 text-white' },
];

export function FilterBar({ filter, onFilterChange }: FilterBarProps) {
  const toggleLevel = (level: LogLevel) => {
    const newLevels = new Set(filter.levels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    onFilterChange({ ...filter, levels: newLevels });
  };

  const toggleAllLevels = () => {
    const allLevels = new Set<LogLevel>(LOG_LEVELS.map(l => l.level));
    const hasAll = LOG_LEVELS.every(l => filter.levels.has(l.level));
    onFilterChange({ ...filter, levels: hasAll ? new Set() : allLevels });
  };

  return (
    <div className="bg-[#161b22] border-b border-gray-700 px-6 py-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 font-medium">Filters:</span>
          <button
            onClick={toggleAllLevels}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full text-sm font-medium transition-colors"
          >
            All
          </button>
          {LOG_LEVELS.map(({ level, label, color }) => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                filter.levels.has(level)
                  ? color
                  : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search logs..."
            value={filter.searchText}
            onChange={(e) => onFilterChange({ ...filter, searchText: e.target.value })}
            className="flex-1 px-4 py-1.5 bg-[#0d1117] border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={filter.caseSensitive}
              onChange={(e) => onFilterChange({ ...filter, caseSensitive: e.target.checked })}
              className="rounded"
            />
            Aa
          </label>
        </div>
      </div>
    </div>
  );
}
