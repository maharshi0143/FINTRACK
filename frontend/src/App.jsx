import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './components/common/ErrorBoundary';

function LoadingGate({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-white">FinTrack</h2>
          <p className="text-sm text-slate-500 mt-1">Loading your account...</p>
        </div>
      </div>
    );
  }

  return children;
}

function AppContent() {
  return (
    <LoadingGate>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </LoadingGate>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        gutter={12}
        containerStyle={{ marginTop: 8 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(17, 17, 19, 0.95)',
            color: '#fafafa',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fafafa',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fafafa',
            },
          },
        }}
      />
      <AppContent />
    </AuthProvider>
  );
}

export default App;
