import type {
  WebSocketMessage,
  Notification,
  ActivityItem,
  JudgeStatus,
  JudgeQueue,
  SubmissionUpdate,
} from '@/types';

// Mock WebSocket server for development
export class MockWebSocketServer {
  private clients: Set<WebSocket> = new Set();
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.startMockData();
  }

  addClient(ws: WebSocket) {
    this.clients.add(ws);

    // Send initial data
    this.sendToClient(ws, {
      type: 'judge_status',
      data: {
        judges: this.generateMockJudges(),
        queue: this.generateMockQueue(),
      },
      timestamp: new Date(),
    });
  }

  removeClient(ws: WebSocket) {
    this.clients.delete(ws);
  }

  private broadcast(message: WebSocketMessage) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private sendToClient(client: WebSocket, message: WebSocketMessage) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  private startMockData() {
    // Send periodic notifications
    this.intervals.push(
      setInterval(() => {
        if (Math.random() < 0.3) {
          // 30% chance every 10 seconds
          this.broadcast({
            type: 'user_notification',
            data: this.generateMockNotification(),
            timestamp: new Date(),
          });
        }
      }, 10000)
    );

    // Send periodic activity updates
    this.intervals.push(
      setInterval(() => {
        if (Math.random() < 0.5) {
          // 50% chance every 5 seconds
          this.broadcast({
            type: 'user_activity',
            data: this.generateMockActivity(),
            timestamp: new Date(),
          });
        }
      }, 5000)
    );

    // Send periodic submission updates
    this.intervals.push(
      setInterval(() => {
        if (Math.random() < 0.4) {
          // 40% chance every 3 seconds
          this.broadcast({
            type: 'submission_update',
            data: this.generateMockSubmissionUpdate(),
            timestamp: new Date(),
          });
        }
      }, 3000)
    );

    // Send periodic judge status updates
    this.intervals.push(
      setInterval(() => {
        this.broadcast({
          type: 'judge_status',
          data: {
            judges: this.generateMockJudges(),
            queue: this.generateMockQueue(),
          },
          timestamp: new Date(),
        });
      }, 15000)
    );

    // Send ping every 30 seconds
    this.intervals.push(
      setInterval(() => {
        this.broadcast({
          type: 'ping',
          data: null,
          timestamp: new Date(),
        });
      }, 30000)
    );
  }

  private generateMockNotification(): Notification {
    const types: Notification['type'][] = [
      'info',
      'success',
      'warning',
      'error',
    ];
    const notifications = [
      {
        title: 'Contest Starting',
        message: 'Weekly Contest #42 starts in 5 minutes!',
      },
      {
        title: 'New Problem',
        message: 'A new problem "Graph Traversal" has been added.',
      },
      {
        title: 'System Maintenance',
        message: 'Scheduled maintenance in 1 hour.',
      },
      {
        title: 'Achievement Unlocked',
        message: 'You earned the "Problem Solver" badge!',
      },
    ];

    const notification =
      notifications[Math.floor(Math.random() * notifications.length)];

    return {
      id: `notif-${Date.now()}-${Math.random()}`,
      type: types[Math.floor(Math.random() * types.length)],
      title: notification.title,
      message: notification.message,
      timestamp: new Date(),
      read: false,
    };
  }

  private generateMockActivity(): ActivityItem {
    const types: ActivityItem['type'][] = [
      'submission',
      'contest_join',
      'problem_solve',
      'achievement',
    ];
    const usernames = ['alice', 'bob', 'charlie', 'diana', 'eve'];
    const problems = [
      'two-sum',
      'graph-bfs',
      'dynamic-programming',
      'binary-search',
    ];
    const contests = ['weekly-42', 'monthly-challenge', 'beginner-round'];
    const results = ['AC', 'WA', 'TLE', 'MLE'];

    const type = types[Math.floor(Math.random() * types.length)];
    const username = usernames[Math.floor(Math.random() * usernames.length)];

    let data: ActivityItem['data'] = {};

    switch (type) {
      case 'submission':
        data = {
          problemCode: problems[Math.floor(Math.random() * problems.length)],
          problemName: 'Sample Problem',
          result: results[Math.floor(Math.random() * results.length)],
        };
        break;
      case 'contest_join':
        data = {
          contestKey: contests[Math.floor(Math.random() * contests.length)],
          contestName: 'Sample Contest',
        };
        break;
      case 'problem_solve':
        data = {
          problemCode: problems[Math.floor(Math.random() * problems.length)],
          problemName: 'Sample Problem',
        };
        break;
      case 'achievement':
        data = {
          achievement: 'Problem Solver',
        };
        break;
    }

    return {
      id: `activity-${Date.now()}-${Math.random()}`,
      type,
      userId: `user-${username}`,
      username,
      timestamp: new Date(),
      data,
    };
  }

  private generateMockSubmissionUpdate(): SubmissionUpdate {
    const results = ['AC', 'WA', 'TLE', 'MLE', 'RE', 'CE'];
    const problems = ['two-sum', 'graph-bfs', 'dynamic-programming'];

    return {
      submissionId: `sub-${Date.now()}`,
      status: {
        result: results[Math.floor(Math.random() * results.length)],
        isFinal: Math.random() < 0.7, // 70% chance of being final
        score: Math.floor(Math.random() * 100),
        time: Math.random() * 2,
        memory: Math.random() * 256,
      },
      problemCode: problems[Math.floor(Math.random() * problems.length)],
    };
  }

  private generateMockJudges(): JudgeStatus[] {
    return [
      {
        id: 'judge-1',
        name: 'Judge Server 1',
        online: Math.random() < 0.9,
        load: Math.random(),
        ping: Math.floor(Math.random() * 100) + 10,
        languages: ['python3', 'cpp17', 'java11', 'javascript'],
        problems: ['all'],
        lastSeen: new Date(Date.now() - Math.random() * 60000),
      },
      {
        id: 'judge-2',
        name: 'Judge Server 2',
        online: Math.random() < 0.8,
        load: Math.random(),
        ping: Math.floor(Math.random() * 100) + 10,
        languages: ['python3', 'cpp17', 'rust'],
        problems: ['all'],
        lastSeen: new Date(Date.now() - Math.random() * 60000),
      },
    ];
  }

  private generateMockQueue(): JudgeQueue {
    const waiting = Math.floor(Math.random() * 50);
    const processing = Math.floor(Math.random() * 10);

    return {
      total: waiting + processing,
      processing,
      waiting,
      byLanguage: {
        python3: Math.floor(Math.random() * 20),
        cpp17: Math.floor(Math.random() * 15),
        java11: Math.floor(Math.random() * 10),
      },
      estimatedWaitTime: Math.floor(Math.random() * 120) + 10,
    };
  }

  cleanup() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.clients.clear();
  }
}

// Global mock server instance for development
export const mockWebSocketServer = new MockWebSocketServer();
