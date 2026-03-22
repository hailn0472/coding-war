# Coding War

An Online Judge Platform for competitive programming - DMOJ clone

## Overview

Coding War is a complete online judge system that allows users to:
- Practice coding problems
- Participate in programming contests
- Get real-time feedback on submissions
- Track progress and rankings

## Project Structure

```
coding-war/
├── frontend/          # React frontend application
├── backend/           # Node.js/Express backend API
├── docker-compose.yml # Docker services configuration
└── Makefile          # Convenience commands
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm 8+

### 1. Start Infrastructure Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Redis cache/queue (port 6379)

### 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend API runs on `http://localhost:3000`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Development

### Using Makefile

```bash
make install    # Install all dependencies
make start      # Start Docker services
make dev        # Start backend dev server
make stop       # Stop all services
make logs       # View logs
```

### Manual Commands

**Backend:**
```bash
cd backend
npm run dev          # Development server
npm run build        # Build for production
npm run lint         # Lint code
npm run prisma:studio # Database GUI
```

**Frontend:**
```bash
cd frontend
npm run dev          # Development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code
```

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Zustand
- Monaco Editor
- Socket.io Client

### Backend
- Node.js 20 + Express
- TypeScript
- PostgreSQL + Prisma ORM
- Redis (Cache + Bull Queue)
- Socket.io
- Docker
- NodeMailer
- Jest (29 test files, 500+ tests, 85%+ coverage)

## Documentation

- [Frontend README](./frontend/README.md) - Frontend documentation and setup
- [Backend README](./backend/README.md) - Backend API documentation and setup
- [Project Structure](./PROJECT_STRUCTURE.md) - Detailed project structure and implementation progress
- [Quick Start Guide](./QUICKSTART.md) - Getting started guide (if exists)

## Current Progress

**Overall: ~65% Complete**

- Backend: 60% (26/40 tasks completed)
- Frontend: 70% (UI components done, API integration pending)
- Infrastructure: 80% (Docker, database, Redis ready)
- Testing: 85%+ coverage (29 test files, 500+ tests)

**Next Milestone:** Complete Phase 5 (Production Readiness) - Tasks 27-40

## Features

### Current Status (~65% Complete)

**Frontend (70% done):**
- ✅ UI components and layouts
- ✅ Navigation and routing
- ✅ Theme system
- ✅ Code editor (Monaco)
- 🚧 API integration (ready for connection)

**Backend (60% done):**
- ✅ Project structure and infrastructure (Task 1)
- ✅ Database schema with Prisma (Task 2)
- ✅ Authentication system (Tasks 3-4)
- ✅ Authorization and RBAC (Task 5)
- ✅ Email service integration (Task 6)
- ✅ Core API infrastructure (Task 7)
- ✅ Problem management (Tasks 9-11)
- ✅ Judge system (Tasks 12-15)
- ✅ Contest system (Tasks 17-23)
- ✅ User management (Task 24)
- ✅ Admin panel (Task 25)
- ✅ Exception handling and logging (Task 26)
- 🚧 Performance optimization (Tasks 28-29)
- 🚧 Testing infrastructure (Tasks 31-33)
- 🚧 Deployment setup (Tasks 34-35)

### Implemented Features

#### Authentication & Authorization ✅
- User registration with email verification
- Login with JWT tokens
- Password reset flow
- Role-based access control (Admin/User/Guest)
- Protected endpoints

#### Problem Management ✅
- CRUD operations for problems
- Test case upload (zip files)
- Problem filtering and search
- Difficulty levels (Easy/Medium/Hard)
- Markdown and LaTeX support
- Public/Private/Contest-only visibility

#### Judge System ✅
- Multi-language support (C, C++, Python, Java)
- Docker-based sandboxing
- Resource limit enforcement (time, memory)
- Compilation error handling
- Test case execution
- Verdict calculation (AC, WA, TLE, MLE, RE, CE)
- Real-time status updates via WebSocket

#### Contest System ✅
- Contest creation and management
- Public and private contests
- Contest registration
- Time-based access control
- IOI and ACM/ICPC scoring rules
- Live scoreboard with freeze time
- Real-time scoreboard updates

#### User Management ✅
- User profiles with statistics
- Submission history
- Profile updates

#### Admin Panel ✅
- User management and role assignment
- System statistics dashboard
- Submission rejudge functionality

#### Infrastructure ✅
- RESTful API with Express
- PostgreSQL database with Prisma ORM
- Redis for caching and queuing
- Socket.io for real-time features
- Docker containerization
- Comprehensive error handling
- Request logging and tracing
- Rate limiting
- Input validation

### Planned Features (Tasks 27-40)

- Caching strategy with Redis
- Performance optimizations
- Horizontal scaling support
- Comprehensive test suite (unit, integration, E2E)
- CI/CD pipeline
- Monitoring and logging infrastructure
- Security hardening
- API documentation (Swagger)
- Production deployment

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────┐
│   Frontend      │─────▶│  Backend API     │─────▶│  PostgreSQL  │
│   (React)       │      │  (Express)       │      │   Database   │
│   Port: 5173    │      │  Port: 3000      │      │   Port: 5432 │
└─────────────────┘      └──────────────────┘      └──────────────┘
        │                        │
        │                        ├─────▶ Redis (Cache/Queue)
        │                        │       Port: 6379
        │                        │
        └────────────────────────┴─────▶ WebSocket (Socket.io)
                                 │
                                 └─────▶ Judge Workers (Docker)
                                         - Compilation
                                         - Execution
                                         - Sandboxing
```

### System Components

1. **Frontend (React)**: User interface with real-time updates
2. **Backend API (Express)**: RESTful endpoints and WebSocket server
3. **Database (PostgreSQL)**: Persistent data storage
4. **Cache/Queue (Redis)**: Caching and job queue management
5. **Judge System (Docker)**: Isolated code execution environment
6. **Email Service (NodeMailer)**: Transactional emails

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
