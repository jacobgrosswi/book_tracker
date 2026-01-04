import { createContext, useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Button } from "./Button";
import { ThemeMode } from "../lib/theme";

export const ThemeContext = createContext<{
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
} | null>(null);

const ThemeToggle = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) return null;

  return (
    <select
      value={ctx.mode}
      onChange={(event) => ctx.setMode(event.target.value as ThemeMode)}
      className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text"
    >
      <option value="auto">Auto</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-surface text-text">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-semibold">
              Book Tracker
            </Link>
            <nav className="hidden gap-4 text-sm text-text-muted md:flex">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "text-text" : "hover:text-text"
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/library"
                className={({ isActive }) =>
                  isActive ? "text-text" : "hover:text-text"
                }
              >
                Library
              </NavLink>
              <NavLink
                to="/add"
                className={({ isActive }) =>
                  isActive ? "text-text" : "hover:text-text"
                }
              >
                Add Book
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
};
