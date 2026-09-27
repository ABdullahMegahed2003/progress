"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Dumbbell, Flame, Moon, Settings2, Sun, Trophy } from "lucide-react";
import Link from "next/link";
import { AuthScreen } from "@/components/auth/auth-screen";
import { AccountScreen } from "@/components/home/account-screen";
import { HomeContent } from "@/components/home/home-content";
import { HomeNavigation } from "@/components/home/home-navigation";
import { PlansScreen } from "@/components/home/plans-screen";
import { ProgressScreen } from "@/components/home/progress-screen";
import type { Screen } from "@/components/home/home-data";

export function HomeScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("home");
  const [authOpen, setAuthOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [exerciseCount, setExerciseCount] = useState(0);

  useEffect(() => {
    // Load persisted theme
    const savedTheme = localStorage.getItem("gym-theme");
    if (savedTheme) {
      const isDark = savedTheme === "dark";
      setDark(isDark);
      document.documentElement.classList.toggle("light-mode", !isDark);
      document.documentElement.classList.toggle("dark", isDark);
    } else {
      document.documentElement.classList.add("dark");
    }

    fetch("/api/exercises")
      .then((response) => response.json())
      .then((data) => setExerciseCount(data.count ?? 0))
      .catch(() => undefined);
  }, []);

  const toggleTheme = () => {
    const newDark = !dark;
    setDark(newDark);
    localStorage.setItem("gym-theme", newDark ? "dark" : "light");
    document.documentElement.classList.toggle("light-mode", !newDark);
    document.documentElement.classList.toggle("dark", newDark);
  };

  function navigate(screenToOpen: Screen) {
    if (screenToOpen === "plans") {
      const savedSystem = localStorage.getItem("gym-system-saved");
      if (savedSystem) {
        router.push(`/training-plan?system=${encodeURIComponent(savedSystem)}`);
        return;
      }
    }
    if (screenToOpen === "workouts") {
      const system = localStorage.getItem("gym-active-system");
      if (system) router.push(`/training-plan?system=${encodeURIComponent(system)}&mode=log`);
      else setScreen("plans");
      return;
    }
    setScreen(screenToOpen);
  }

  if (authOpen) return <AuthScreen onClose={() => setAuthOpen(false)} />;

  return (
    <main className={dark ? "app-shell" : "app-shell light-home"}>
      <header className="app-header">
        
        {/* Logo with Icon instead of text */}
        <div className="home-logo flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00ff88]/20 to-[#00f0ff]/20 border border-[#00ff88]/40 flex items-center justify-center text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.25)]">
            <Dumbbell size={16} />
          </div>
          <span className="text-lg font-black tracking-tight">تَقَدُّم</span>
        </div>

        {/* Header Actions */}
        <div className="app-header-actions">
          <Link
            href="/download"
            className="app-icon-button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              width: "auto",
              padding: "0 10px",
              borderRadius: "10px",
              background: "rgba(0, 255, 136, 0.12)",
              color: "var(--neon-green)",
              border: "1px solid rgba(0, 255, 136, 0.25)",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            <Download size={14} />
            <span>تنزيل</span>
          </Link>

          {/* Fully Functional Dark / Light Mode Toggle */}
          <button
            className="app-icon-button cursor-pointer"
            aria-label="تغيير المظهر الدارك واللايت"
            onClick={toggleTheme}
            title={dark ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
          >
            {dark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
          </button>
        </div>
      </header>

      <section className="app-screen" aria-live="polite">
        {screen === "home" && <HomeContent onNavigate={navigate} />}
        {screen === "plans" && <PlansScreen />}
        {screen === "progress" && <ProgressScreen exerciseCount={exerciseCount} />}
        {screen === "account" && <AccountScreen onLogin={() => setAuthOpen(true)} />}
      </section>

      <HomeNavigation screen={screen} onNavigate={navigate} />
    </main>
  );
}
