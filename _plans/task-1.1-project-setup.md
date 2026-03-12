# Task 1.1: Project Setup & Dependencies

## Mô tả

Cài đặt và cấu hình các dependencies cần thiết cho dự án React/Vite

## Dependencies cần cài đặt

### Core Dependencies

```bash
npm install react@^18.2.0 react-dom@^18.2.0
npm install react-router-dom@^6.8.0
npm install @headlessui/react@^1.7.0
npm install lucide-react@^0.263.0
npm install clsx@^2.0.0
npm install tailwind-merge@^1.14.0
```

### State Management & API

```bash
npm install zustand@^4.4.0
npm install @tanstack/react-query@^4.29.0
npm install axios@^1.4.0
```

### Form & Validation

```bash
npm install react-hook-form@^7.45.0
npm install @hookform/resolvers@^3.1.0
npm install zod@^3.21.0
```

### Dev Dependencies

```bash
npm install -D @types/react@^18.2.0 @types/react-dom@^18.2.0
npm install -D @typescript-eslint/eslint-plugin@^6.0.0
npm install -D @typescript-eslint/parser@^6.0.0
npm install -D eslint@^8.45.0
npm install -D eslint-plugin-react-hooks@^4.6.0
npm install -D eslint-plugin-react-refresh@^0.4.0
npm install -D prettier@^3.0.0
npm install -D tailwindcss@^3.3.0
npm install -D autoprefixer@^10.4.0
npm install -D postcss@^8.4.0
```

## Cấu hình Files

### 1. vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@components": path.resolve(__dirname, "./src/components"),
            "@pages": path.resolve(__dirname, "./src/pages"),
            "@hooks": path.resolve(__dirname, "./src/hooks"),
            "@utils": path.resolve(__dirname, "./src/utils"),
            "@types": path.resolve(__dirname, "./src/types"),
            "@api": path.resolve(__dirname, "./src/api"),
            "@store": path.resolve(__dirname, "./src/store"),
        },
    },
    server: {
        port: 3000,
        proxy: {
            "/api": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom"],
                    router: ["react-router-dom"],
                    ui: ["@headlessui/react", "lucide-react"],
                },
            },
        },
    },
});
```

### 2. tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // DMOJ Brand Colors
                primary: {
                    50: "#fff7ed",
                    100: "#ffedd5",
                    200: "#fed7aa",
                    300: "#fdba74",
                    400: "#fb923c",
                    500: "#f97316", // Main orange
                    600: "#ea580c",
                    700: "#c2410c",
                    800: "#9a3412",
                    900: "#7c2d12",
                },
                gray: {
                    50: "#f9fafb",
                    100: "#f3f4f6",
                    200: "#e5e7eb",
                    300: "#d1d5db",
                    400: "#9ca3af",
                    500: "#6b7280",
                    600: "#4b5563",
                    700: "#374151",
                    800: "#1f2937",
                    900: "#111827",
                },
                success: {
                    50: "#f0fdf4",
                    500: "#22c55e",
                    600: "#16a34a",
                },
                warning: {
                    50: "#fffbeb",
                    500: "#f59e0b",
                    600: "#d97706",
                },
                error: {
                    50: "#fef2f2",
                    500: "#ef4444",
                    600: "#dc2626",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "Monaco", "Consolas", "monospace"],
            },
            spacing: {
                18: "4.5rem",
                88: "22rem",
            },
            animation: {
                "fade-in": "fadeIn 0.2s ease-in-out",
                "slide-up": "slideUp 0.3s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms"),
        require("@tailwindcss/typography"),
    ],
};
```

### 3. .eslintrc.cjs

```javascript
module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        "eslint:recommended",
        "@typescript-eslint/recommended",
        "plugin:react-hooks/recommended",
    ],
    ignorePatterns: ["dist", ".eslintrc.cjs"],
    parser: "@typescript-eslint/parser",
    plugins: ["react-refresh"],
    rules: {
        "react-refresh/only-export-components": [
            "warn",
            { allowConstantExport: true },
        ],
        "@typescript-eslint/no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_" },
        ],
        "prefer-const": "error",
        "no-var": "error",
    },
};
```

### 4. .prettierrc

```json
{
    "semi": false,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 80,
    "tabWidth": 2,
    "useTabs": false
}
```

### 5. tsconfig.json

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"],
            "@components/*": ["./src/components/*"],
            "@pages/*": ["./src/pages/*"],
            "@hooks/*": ["./src/hooks/*"],
            "@utils/*": ["./src/utils/*"],
            "@types/*": ["./src/types/*"],
            "@api/*": ["./src/api/*"],
            "@store/*": ["./src/store/*"]
        }
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 6. postcss.config.js

```javascript
export default {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
    },
};
```

## Folder Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   └── common/         # Common components
├── pages/              # Page components
│   ├── problems/
│   ├── contests/
│   ├── users/
│   └── admin/
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── api/                # API client and endpoints
├── store/              # State management
├── styles/             # Global styles
└── assets/             # Static assets
```

## Scripts trong package.json

```json
{
    "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        "lint:fix": "eslint . --ext ts,tsx --fix",
        "preview": "vite preview",
        "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
        "type-check": "tsc --noEmit"
    }
}
```

## Environment Variables (.env)

```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=DMOJ
VITE_APP_VERSION=2.0.0
```

## Checklist

- [ ] Install all dependencies
- [ ] Configure Vite with path aliases
- [ ] Setup Tailwind CSS with DMOJ theme
- [ ] Configure ESLint and Prettier
- [ ] Setup TypeScript configuration
- [ ] Create folder structure
- [ ] Add environment variables
- [ ] Test development server starts
- [ ] Verify hot reload works
- [ ] Check build process works
