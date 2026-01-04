import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { AuthProvider, useAuth } from "./lib/useAuth";
import { applyTheme, getStoredTheme, scheduleThemeUpdate, setStoredTheme, ThemeMode } from "./lib/theme";
import { Layout, ThemeContext } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { LibraryPage } from "./pages/LibraryPage";
import { LoginPage } from "./pages/LoginPage";
import { AddEditPage } from "./pages/AddEditPage";

const ThemeGate = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(mode);
    const cleanup = scheduleThemeUpdate(() => applyTheme(mode));
    return cleanup;
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode: (next: ThemeMode) => {
        setStoredTheme(next);
        setMode(next);
      },
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

const ProtectedRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-text">
        <p className="text-sm text-text-muted">Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/add" element={<AddEditPage />} />
        <Route path="/edit/:id" element={<AddEditPage />} />
      </Routes>
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeGate>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </ThemeGate>
    </AuthProvider>
  );
}
