import React from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { getConnectionStatus, getConnectionColor } from '@/utils/websocket';
import { Wifi, WifiOff, RotateCw } from 'lucide-react';
import { cn } from '@/utils';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className,
  showText = false,
}) => {
  const { state } = useWebSocket();
  const status = getConnectionStatus(state.connected, state.reconnecting);
  const colorClass = getConnectionColor(status);

  const getIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'reconnecting':
        return <RotateCw className="h-4 w-4 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className={cn(colorClass)}>{getIcon()}</div>
      {showText && (
        <span className={cn('text-sm', colorClass)}>{getStatusText()}</span>
      )}
    </div>
  );
};

export default ConnectionStatus;
