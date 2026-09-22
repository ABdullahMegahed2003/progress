"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Moon, Settings2, Sun } from "lucide-react";
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
    fetch("/api/exercises").then((response) => response.json()).then((data) => setExerciseCount(data.count ?? 0)).catch(() => undefined);
  }, []);

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

  if (authOpen) return <AuthScreen />;

  return (
    <main className={dark ? "app-shell" : "app-shell light-home"}>
      <header className="app-header"><div className="home-logo">تَقَدُّم<span>مختبر الأداء</span></div><div className="app-header-actions"><Link href="/download" className="app-icon-button" style={{ display: "flex", alignItems: "center", gap: "6px", width: "auto", padding: "0 10px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", textDecoration: "none", fontSize: "12px", fontWeight: 700 }}><Download size={14} /><span>تنزيل APK</span></Link><button className="app-icon-button" aria-label="تغيير المظهر" onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="app-icon-button" aria-label="الإعدادات"><Settings2 size={17} /></button></div></header>
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

