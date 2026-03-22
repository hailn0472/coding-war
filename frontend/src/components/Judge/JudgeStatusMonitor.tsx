import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import type { JudgeStatus, JudgeQueue } from '@/types';
import { Server, Clock, Cpu, Wifi, WifiOff, Code } from 'lucide-react';
import { cn } from '@/utils';

interface JudgeStatusMonitorProps {
  className?: string;
}

const JudgeStatusMonitor: React.FC<JudgeStatusMonitorProps> = ({
  className,
}) => {
  const { subscribe, unsubscribe } = useWebSocket();
  const [judges, setJudges] = useState<JudgeStatus[]>([]);
  const [queue, setQueue] = useState<JudgeQueue | null>(null);

  useEffect(() => {
    const handleJudgeUpdate = (data: {
      judges: JudgeStatus[];
      queue: JudgeQueue;
    }) => {
      setJudges(data.judges);
      setQueue(data.queue);
    };

    subscribe('judge_status', handleJudgeUpdate);
    return () => unsubscribe('judge_status', handleJudgeUpdate);
  }, [subscribe, unsubscribe]);

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  const getLoadColor = (load: number) => {
    if (load < 0.3) return 'text-green-500';
    if (load < 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Queue Status */}
      {queue && (
        <div className="bg-card rounded-lg border p-4">
          <div className="mb-4 flex items-center space-x-2">
            <Clock className="text-muted-foreground h-5 w-5" />
            <h3 className="text-foreground font-medium">Queue Status</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-foreground text-2xl font-bold">
                {queue.total}
              </div>
              <div className="text-muted-foreground text-sm">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {queue.processing}
              </div>
              <div className="text-muted-foreground text-sm">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {queue.waiting}
              </div>
              <div className="text-muted-foreground text-sm">Waiting</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground text-2xl font-bold">
                {queue.estimatedWaitTime}s
              </div>
              <div className="text-muted-foreground text-sm">Est. Wait</div>
            </div>
          </div>

          {Object.keys(queue.byLanguage).length > 0 && (
            <div className="mt-4">
              <h4 className="text-foreground mb-2 text-sm font-medium">
                By Language
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(queue.byLanguage).map(([language, count]) => (
                  <span
                    key={language}
                    className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs"
                  >
                    {language}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Judges List */}
      <div className="bg-card rounded-lg border p-4">
        <div className="mb-4 flex items-center space-x-2">
          <Server className="text-muted-foreground h-5 w-5" />
          <h3 className="text-foreground font-medium">Judge Servers</h3>
          <span className="text-muted-foreground text-sm">
            ({judges.filter(j => j.online).length}/{judges.length} online)
          </span>
        </div>

        {judges.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <Server className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No judge servers available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {judges.map(judge => (
              <div
                key={judge.id}
                className={cn(
                  'rounded-lg border p-4 transition-colors',
                  judge.online
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {judge.online ? (
                        <Wifi className="h-4 w-4 text-green-500" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-foreground font-medium">
                        {judge.name}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'rounded px-2 py-1 text-xs font-medium',
                        judge.online
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      )}
                    >
                      {judge.online ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div className="text-muted-foreground text-sm">
                    Last seen: {formatLastSeen(judge.lastSeen)}
                  </div>
                </div>

                {judge.online && (
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                    <div className="flex items-center space-x-2">
                      <Cpu className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground">Load:</span>
                      <span
                        className={cn('font-medium', getLoadColor(judge.load))}
                      >
                        {(judge.load * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground">Ping:</span>
                      <span className="text-foreground font-medium">
                        {judge.ping}ms
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Code className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground">Languages:</span>
                      <span className="text-foreground font-medium">
                        {judge.languages.length}
                      </span>
                    </div>
                  </div>
                )}

                {judge.online && judge.languages.length > 0 && (
                  <div className="mt-3">
                    <div className="text-muted-foreground mb-1 text-xs">
                      Supported Languages:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {judge.languages.slice(0, 10).map(language => (
                        <span
                          key={language}
                          className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs"
                        >
                          {language}
                        </span>
                      ))}
                      {judge.languages.length > 10 && (
                        <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs">
                          +{judge.languages.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JudgeStatusMonitor;
