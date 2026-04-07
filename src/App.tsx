import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppProvider, useApp } from './app/AppContext';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProductsPage } from './pages/ProductsPage';
import { DraftsPage } from './pages/DraftsPage';
import { MediaLibraryPage } from './pages/MediaLibraryPage';
import { SchedulePage } from './pages/SchedulePage';
import { AiStudioPage } from './pages/AiStudioPage';
import { OverviewPage } from './pages/OverviewPage';
import { AppShell } from './components/AppShell';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, isHydrated } = useApp();

  if (!isHydrated) {
    return <div className="page-loader">Loading demo workspace...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/drafts" element={<DraftsPage />} />
                <Route path="/media-library" element={<MediaLibraryPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/ai-studio" element={<AiStudioPage />} />
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}