import type { ConnectionStatus } from '../types';

interface StatusBarProps {
  status: ConnectionStatus;
}

export function StatusBar({ status }: StatusBarProps) {
  const statusConfig = {
    connected: {
      text: 'Connected',
      color: 'bg-green-500',
      textColor: 'text-green-400',
    },
    disconnected: {
      text: 'Disconnected',
      color: 'bg-gray-500',
      textColor: 'text-gray-400',
    },
    error: {
      text: 'Error',
      color: 'bg-red-500',
      textColor: 'text-red-400',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color} ${status === 'connected' ? 'animate-pulse' : ''}`}></div>
      <span className={`text-sm ${config.textColor}`}>{config.text}</span>
    </div>
  );
}
