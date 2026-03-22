# Coding War Frontend

React-based frontend for Coding War - An Online Judge Platform

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Routing**: React Router v6
- **Code Editor**: Monaco Editor
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Playwright

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+

### Installation

```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run preview` - Preview production build locally

### Building
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript type checking

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing
- `npm test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with UI

### Storybook
- `npm run storybook` - Start Storybook dev server
- `npm run build-storybook` - Build Storybook

## Project Structure

```
frontend/
├── src/
│   ├── api/           # API client and endpoints
│   ├── assets/        # Static assets (images, fonts)
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React contexts
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── providers/     # Provider components
│   ├── stores/        # Zustand stores
│   ├── test/          # Test utilities
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Root component
│   ├── main.tsx       # Application entry point
│   └── index.css      # Global styles
├── public/            # Public static files
├── index.html         # HTML template
└── vite.config.ts     # Vite configuration
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_BASE_URL=ws://localhost:3000
VITE_APP_NAME=Coding War
```

## Features

### Implemented (~70% complete)
- ✅ Base layout components (Header, Footer, Sidebar)
- ✅ Navigation system with React Router
- ✅ Theme system (light/dark mode)
- ✅ Form components with validation
- ✅ Table components with sorting/filtering
- ✅ Modal/Dialog system
- ✅ Button and input components
- ✅ Loading and error states
- ✅ Problem list page UI
- ✅ Contest list page UI
- ✅ User profile pages UI
- ✅ Code editor integration (Monaco)
- ✅ Real-time features setup (Socket.io client)

### Backend Integration Status

#### Completed ✅
- ✅ Authentication API integration
- ✅ Problem browsing and details
- ✅ Submission system
- ✅ Contest system
- ✅ User profile management
- ✅ Admin panel
- ✅ Real-time submission status
- ✅ Live scoreboard updates

#### Ready for Integration 🎯
All backend APIs are implemented and ready:
- Authentication endpoints (register, login, verify, reset password)
- Problem management (CRUD, test cases, filtering)
- Submission handling (submit, status, history)
- Contest management (CRUD, registration, scoreboard)
- User management (profile, statistics)
- Admin operations (user management, rejudge, statistics)
- WebSocket events (submission status, scoreboard updates)

### Next Steps for Frontend
- Connect API client to backend endpoints
- Implement authentication flow (login/register forms)
- Integrate problem submission with real-time status
- Implement contest participation flow
- Connect live scoreboard with WebSocket
- Add error handling and loading states
- Implement admin panel features

## Contributing

1. Follow the existing code style
2. Run linting and formatting before committing
3. Write tests for new features
4. Update documentation as needed

## License

MIT
