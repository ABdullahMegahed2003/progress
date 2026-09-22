"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ClipboardList, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Screen } from "@/components/home/home-data";

export function HomeContent({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const router = useRouter();
  const [activeSystem, setActiveSystem] = useState("");

  useEffect(() => {
    const loadSystem = window.setTimeout(() => {
      setActiveSystem(localStorage.getItem("gym-active-system") ?? "");
    }, 0);
    return () => window.clearTimeout(loadSystem);
  }, []);

  function openWorkoutDashboard() {
    if (activeSystem) {
      router.push(`/training-plan?system=${encodeURIComponent(activeSystem)}&mode=log`);
    } else {
      onNavigate("plans");
    }
  }

  return (
    <div className="screen-content home-screen-content">
      <div className="screen-greeting">
        <div><span className="screen-kicker">جاهز لتمرينتك؟</span><h1>ابنِ جسمك.<br /><em>اتبع تقدمك.</em></h1></div>
        <div className="mini-avatar"><UserRound size={19} /></div>
      </div>
      <div className="today-card dashboard-card">
        <div className="today-card-top"><span>لوحة التمرين</span><b>{activeSystem || "لم يتم اختيار نظام"}</b></div>
        <div className="today-main"><div className="today-icon"><CalendarDays size={29} /></div><div><h2>{activeSystem ? "سجل تمرينك اليوم" : "ابدأ جدولك"}</h2><p>{activeSystem ? "الوزن والعدات والمجموعات في مكان واحد." : "اختار نظامك وأنشئ لوحة تمارينك."}</p></div></div>
        <button className="app-primary-button" onClick={openWorkoutDashboard}>{activeSystem ? "فتح لوحة التمرين" : "اختار نظامك"} <ChevronLeft size={17} /></button>
      </div>
      <button className="daily-log-card" onClick={() => router.push("/daily-log")}><span className="daily-log-icon"><ClipboardList size={20} /></span><span><strong>سجل يومك</strong><small>النوم، الأكل، المجهود وسبب أداء اليوم</small></span><ChevronLeft size={17} /></button>
    </div>
  );
}