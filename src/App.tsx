import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { ToastProvider } from './contexts/ToastContext';
import { WebSocketProvider } from './providers/WebSocketProvider';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import ProblemList from './pages/Problems/ProblemList';
import ContestList from './pages/Contests/ContestList';
import UserList from './pages/Users/UserList';
import UserProfile from './pages/Users/UserProfile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import NotFound from './pages/NotFound';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <ToastProvider position="top-right" maxToasts={5}>
          <WebSocketProvider url="ws://localhost:8080/ws">
            <Router>
              <div className="App">
                <Routes>
                  {/* Public auth routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* Main app routes with layout */}
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />

                    {/* Problems */}
                    <Route path="problems" element={<ProblemList />} />

                    {/* Contests */}
                    <Route path="contests" element={<ContestList />} />

                    {/* Users */}
                    <Route path="users" element={<UserList />} />
                    <Route path="users/:username" element={<UserProfile />} />

                    {/* Protected routes */}
                    <Route
                      path="profile/edit"
                      element={
                        <ProtectedRoute>
                          <div className="p-8">Edit Profile - Coming Soon</div>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="admin/*"
                      element={
                        <ProtectedRoute requireAdmin>
                          <div className="p-8">Admin Panel - Coming Soon</div>
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </div>

              {/* React Query Devtools */}
              <ReactQueryDevtools initialIsOpen={false} />
            </Router>
          </WebSocketProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
