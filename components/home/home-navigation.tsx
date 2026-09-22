import { BarChart3, CalendarDays, Dumbbell, Home, UserRound } from "lucide-react";
import type { Screen } from "@/components/home/home-data";

type HomeNavigationProps = {
  screen: Screen;
  onNavigate: (screen: Screen) => void;
};

export function HomeNavigation({ screen, onNavigate }: HomeNavigationProps) {
  const navItems = [
    { id: "home" as const, label: "الرئيسية", icon: Home },
    { id: "plans" as const, label: "الأنظمة", icon: CalendarDays },
    { id: "workouts" as const, label: "تماريني", icon: Dumbbell },
    { id: "progress" as const, label: "التقدم", icon: BarChart3 },
    { id: "account" as const, label: "حسابي", icon: UserRound },
  ];

  return (
    <nav className="app-bottom-nav">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button className={screen === id ? "active" : ""} key={id} onClick={() => onNavigate(id)}>
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}