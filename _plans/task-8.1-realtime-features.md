# Task 8.1: Real-time Features

## Mục tiêu

Implement các tính năng real-time cho DMOJ React application bao gồm WebSocket integration, live updates, notifications và activity feeds.

## Thời gian ước tính

**3 ngày**

## Dependencies

- Task 2.3: Modal & Dialog System (cho notifications)
- Task 4.1: Contest List Page (cho live contest updates)
- Task 6.1: Submission List (cho real-time submission status)

## Technical Requirements

### WebSocket Connection Management

```typescript
interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: Date;
    userId?: string;
    contestId?: string;
}

interface WebSocketState {
    connected: boolean;
    reconnecting: boolean;
    lastPing: Date;
    messageQueue: WebSocketMessage[];
    subscriptions: Set<string>;
}
```

### Real-time Event Types

```typescript
type RealTimeEvent =
    | "submission_update" // Submission status changes
    | "contest_update" // Contest information updates
    | "user_notification" // User notifications
    | "judge_status" // Judge server status
    | "leaderboard_update" // Contest leaderboard changes
    | "chat_message" // Contest chat messages
    | "system_announcement" // System-wide announcements
    | "problem_update" // Problem information changes
    | "user_activity"; // User activity updates
```

## Implementation Details

### 1. WebSocket Provider

**File**: `src/providers/WebSocketProvider.tsx`

- Connection management
- Auto-reconnection logic
- Message queuing
- Subscription management
- Error handling

### 2. WebSocket Hook

**File**: `src/hooks/useWebSocket.ts`

```typescript
const useWebSocket = () => {
    const subscribe = (eventType: string, callback: (data: any) => void) => {
        // Subscribe to specific event types
    };

    const unsubscribe = (eventType: string) => {
        // Unsubscribe from events
    };

    const send = (message: WebSocketMessage) => {
        // Send message through WebSocket
    };

    return { subscribe, unsubscribe, send, connected, reconnecting };
};
```

### 3. Real-time Submission Updates

**File**: `src/hooks/useRealtimeSubmissions.ts`

- Live submission status updates
- Queue position tracking
- Judge assignment notifications
- Result notifications

### 4. Live Contest Features

**File**: `src/hooks/useRealtimeContest.ts`

- Contest countdown updates
- Leaderboard live updates
- Participant count changes
- Contest announcements

### 5. Notification System

**File**: `src/components/Notifications/NotificationCenter.tsx`

- Real-time notification display
- Notification history
- Mark as read functionality
- Notification preferences

## Real-time Features Implementation

### Submission Status Updates

```typescript
const useSubmissionUpdates = (submissionId?: string) => {
    const { subscribe, unsubscribe } = useWebSocket();
    const [status, setStatus] = useState<SubmissionStatus>();

    useEffect(() => {
        if (!submissionId) return;

        const handleUpdate = (data: SubmissionUpdate) => {
            if (data.submissionId === submissionId) {
                setStatus(data.status);

                // Show notification for final results
                if (data.status.isFinal) {
                    showNotification({
                        type: data.status.result === "AC" ? "success" : "error",
                        title: `Submission ${data.status.result}`,
                        message: `Problem ${data.problemCode}: ${data.status.result}`,
                    });
                }
            }
        };

        subscribe("submission_update", handleUpdate);
        return () => unsubscribe("submission_update");
    }, [submissionId]);

    return status;
};
```

### Live Contest Leaderboard

```typescript
const useContestLeaderboard = (contestId: string) => {
    const { subscribe, unsubscribe } = useWebSocket();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        const handleUpdate = (data: LeaderboardUpdate) => {
            if (data.contestId === contestId) {
                setLeaderboard((prev) => {
                    const updated = [...prev];
                    data.changes.forEach((change) => {
                        const index = updated.findIndex(
                            (entry) => entry.userId === change.userId,
                        );
                        if (index >= 0) {
                            updated[index] = { ...updated[index], ...change };
                        }
                    });
                    return updated.sort((a, b) => b.score - a.score);
                });
            }
        };

        subscribe("leaderboard_update", handleUpdate);
        return () => unsubscribe("leaderboard_update");
    }, [contestId]);

    return leaderboard;
};
```

### Real-time Notifications

```typescript
interface Notification {
    id: string;
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
    actionText?: string;
}

const useNotifications = () => {
    const { subscribe } = useWebSocket();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const handleNotification = (data: Notification) => {
            setNotifications((prev) => [data, ...prev]);

            // Show toast notification
            toast({
                type: data.type,
                title: data.title,
                message: data.message,
                duration: data.type === "error" ? 0 : 5000,
            });
        };

        subscribe("user_notification", handleNotification);
    }, []);

    return { notifications, markAsRead, clearAll };
};
```

## Live Activity Feed

### Activity Types

```typescript
interface ActivityItem {
    id: string;
    type: "submission" | "contest_join" | "problem_solve" | "achievement";
    userId: string;
    username: string;
    avatar?: string;
    timestamp: Date;
    data: {
        problemCode?: string;
        problemName?: string;
        contestKey?: string;
        contestName?: string;
        result?: string;
        achievement?: string;
    };
}
```

### Activity Feed Component

```typescript
const ActivityFeed: React.FC = () => {
  const { subscribe } = useWebSocket();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const handleActivity = (activity: ActivityItem) => {
      setActivities(prev => [activity, ...prev.slice(0, 49)]); // Keep last 50
    };

    subscribe('user_activity', handleActivity);
  }, []);

  return (
    <div className="activity-feed">
      {activities.map(activity => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
};
```

## Judge Status Monitoring

### Judge Status Interface

```typescript
interface JudgeStatus {
    id: string;
    name: string;
    online: boolean;
    load: number;
    ping: number;
    languages: string[];
    problems: string[];
    lastSeen: Date;
}

interface JudgeQueue {
    total: number;
    processing: number;
    waiting: number;
    byLanguage: Record<string, number>;
    estimatedWaitTime: number;
}
```

### Judge Status Component

```typescript
const JudgeStatusMonitor: React.FC = () => {
  const { subscribe } = useWebSocket();
  const [judges, setJudges] = useState<JudgeStatus[]>([]);
  const [queue, setQueue] = useState<JudgeQueue>();

  useEffect(() => {
    const handleJudgeUpdate = (data: { judges: JudgeStatus[], queue: JudgeQueue }) => {
      setJudges(data.judges);
      setQueue(data.queue);
    };

    subscribe('judge_status', handleJudgeUpdate);
  }, []);

  return (
    <div className="judge-status">
      <div className="queue-info">
        <h3>Queue Status</h3>
        <p>Waiting: {queue?.waiting} | Processing: {queue?.processing}</p>
        <p>Estimated wait: {queue?.estimatedWaitTime}s</p>
      </div>

      <div className="judges-list">
        {judges.map(judge => (
          <JudgeCard key={judge.id} judge={judge} />
        ))}
      </div>
    </div>
  );
};
```

## Connection Management

### Auto-reconnection Logic

```typescript
class WebSocketManager {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;

    connect() {
        try {
            this.ws = new WebSocket(WS_URL);

            this.ws.onopen = () => {
                this.reconnectAttempts = 0;
                this.onConnected();
            };

            this.ws.onclose = () => {
                this.onDisconnected();
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                this.onError(error);
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };
        } catch (error) {
            this.onError(error);
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(
                () => {
                    this.reconnectAttempts++;
                    this.connect();
                },
                this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
            );
        }
    }
}
```

### Message Queuing

```typescript
class MessageQueue {
    private queue: WebSocketMessage[] = [];
    private processing = false;

    enqueue(message: WebSocketMessage) {
        this.queue.push(message);
        this.process();
    }

    private async process() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;

        while (this.queue.length > 0) {
            const message = this.queue.shift()!;
            await this.handleMessage(message);
        }

        this.processing = false;
    }
}
```

## Performance Optimizations

### Message Throttling

```typescript
const useThrottledWebSocket = (
    eventType: string,
    callback: Function,
    delay = 100,
) => {
    const { subscribe, unsubscribe } = useWebSocket();
    const throttledCallback = useCallback(throttle(callback, delay), [
        callback,
        delay,
    ]);

    useEffect(() => {
        subscribe(eventType, throttledCallback);
        return () => unsubscribe(eventType);
    }, [eventType, throttledCallback]);
};
```

### Selective Subscriptions

```typescript
const useConditionalSubscription = (
    eventType: string,
    condition: boolean,
    callback: Function,
) => {
    const { subscribe, unsubscribe } = useWebSocket();

    useEffect(() => {
        if (condition) {
            subscribe(eventType, callback);
        }

        return () => {
            if (condition) {
                unsubscribe(eventType);
            }
        };
    }, [eventType, condition, callback]);
};
```

## Security Considerations

### Authentication

- JWT token trong WebSocket connection
- User-specific event filtering
- Permission-based subscriptions
- Rate limiting

### Data Validation

- Message schema validation
- XSS prevention trong notifications
- CSRF protection
- Input sanitization

## Testing Strategy

### Unit Tests

- WebSocket hook functionality
- Message handling logic
- Reconnection behavior
- Subscription management

### Integration Tests

- Real-time data flow
- Component updates
- Error handling
- Performance under load

### E2E Tests

- Live submission updates
- Contest real-time features
- Notification system
- Multi-user scenarios

## Deliverables

### Core Infrastructure

- [ ] WebSocketProvider component
- [ ] useWebSocket hook
- [ ] Connection management
- [ ] Message queuing system

### Real-time Features

- [ ] Submission status updates
- [ ] Contest live updates
- [ ] Notification system
- [ ] Activity feed
- [ ] Judge status monitoring

### Components

- [ ] NotificationCenter
- [ ] ActivityFeed
- [ ] JudgeStatusMonitor
- [ ] LiveSubmissionStatus
- [ ] ContestCountdown

### Hooks

- [ ] useRealtimeSubmissions
- [ ] useRealtimeContest
- [ ] useNotifications
- [ ] useActivityFeed
- [ ] useJudgeStatus

### Utils

- [ ] WebSocket message handlers
- [ ] Event type definitions
- [ ] Connection utilities
- [ ] Performance helpers

### Tests

- [ ] WebSocket integration tests
- [ ] Real-time feature tests
- [ ] Performance tests
- [ ] E2E scenarios

## Success Criteria

### Functionality

- ✅ Stable WebSocket connections
- ✅ Real-time submission updates
- ✅ Live contest features
- ✅ Notification system working

### Performance

- ✅ Connection latency < 100ms
- ✅ Message processing < 50ms
- ✅ No memory leaks
- ✅ Efficient reconnection

### Reliability

- ✅ Auto-reconnection working
- ✅ Message queue functioning
- ✅ Error recovery
- ✅ Graceful degradation

### User Experience

- ✅ Smooth real-time updates
- ✅ Clear notification system
- ✅ Responsive interactions
- ✅ Offline handling
