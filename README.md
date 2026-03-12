# Coding War

A modern online judge platform built with React, TypeScript, and Vite.

## Features

- 🚀 **Modern Tech Stack**: React 18, TypeScript, Vite
- 🎨 **Beautiful UI**: Tailwind CSS with dark mode support
- 📱 **Responsive Design**: Mobile-first approach
- ⚡ **Fast Performance**: Optimized builds and lazy loading
- 🧪 **Comprehensive Testing**: Unit, integration, and E2E tests
- ♿ **Accessibility**: WCAG 2.1 AA compliant
- 🔄 **Real-time Updates**: WebSocket integration
- 📊 **Analytics**: Built-in charts and statistics

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd coding-war
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run test` - Run unit tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:e2e` - Run E2E tests
- `npm run storybook` - Start Storybook

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   └── layout/         # Layout components
├── pages/              # Page components
│   ├── Problems/       # Problem-related pages
│   ├── Contests/       # Contest-related pages
│   ├── Users/          # User-related pages
│   └── Admin/          # Admin pages
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── api/                # API client and services
├── stores/             # State management
├── assets/             # Static assets
└── test/               # Test utilities and setup
```

## Technology Stack

### Core
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Lucide React** - Icon library
- **Framer Motion** - Animation library

### State Management
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **Storybook** - Component development

### Additional Libraries
- **React Router** - Client-side routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Chart.js** - Data visualization
- **Monaco Editor** - Code editor
- **React Hot Toast** - Notifications

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the DMOJ Online Judge platform
- Built with modern web technologies and best practices