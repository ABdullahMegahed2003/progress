"use client";
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, useEffect, useState } from "react";
import { ImagePlus, LogIn, UserRound } from "lucide-react";

type Account = { name: string; age: number | null; avatar: string };

function weekKey(offset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 1) % 7) + offset * 7);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function AccountScreen({ onLogin }: { onLogin: () => void }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  useEffect(() => {
    const loadProgress = window.setTimeout(() => {
      const system = localStorage.getItem("gym-system-saved");
      if (!system) return;
      const raw = localStorage.getItem(`gym-workout-${system}-${weekKey(0)}`);
      if (!raw) return;
      try {
        const days = JSON.parse(raw) as Array<{ exercises: Array<{ skipped: boolean; sets: Array<{ done: boolean }> }> }>;
        const sets = days.flatMap((day) => day.exercises.flatMap((exercise) => exercise.skipped ? [] : exercise.sets));
        setWeeklyProgress(sets.length ? Math.round((sets.filter((set) => set.done).length / sets.length) * 100) : 0);
      } catch { setWeeklyProgress(0); }
    }, 0);
    fetch("/api/profile")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setAccount(data?.profile ? { name: data.profile.name ?? "", age: data.profile.age ?? null, avatar: data.profile.avatar ?? "" } : null))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
      return () => window.clearTimeout(loadProgress);
      }, []);

  function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !account) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const avatar = String(reader.result);
      setAccount({ ...account, avatar });
      await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...account, avatar }) });
    };
    reader.readAsDataURL(file);
  }

  if (loading) return <div className="screen-content account-screen"><p>جارٍ تحميل الحساب...</p></div>;
  if (!account) return <div className="screen-content account-screen"><div className="account-avatar"><UserRound size={36} /></div><span className="screen-kicker">حسابك</span><h1>لم تسجل بعد</h1><p>أنشئ حسابًا لحفظ بياناتك وتمارينك.</p><button className="app-primary-button" onClick={onLogin}><LogIn size={17} /> تسجيل الدخول أو إنشاء حساب</button></div>;

  return (
    <div className="screen-content account-screen account-logged-in">
      <div className="account-profile-avatar">{account.avatar ? <img src={account.avatar} alt="صورتك الشخصية" /> : <span>{account.name.slice(0, 1) || "G"}</span>}<label htmlFor="account-avatar" title="إضافة صورة"><ImagePlus size={15} /></label><input id="account-avatar" className="hidden-file" type="file" accept="image/*" onChange={uploadAvatar} /></div>
      <span className="screen-kicker">حسابي</span>
      <h1>{account.name}</h1>
      <div className="account-details"><div><span>السن</span><strong>{account.age ? `${account.age} سنة` : "غير مضاف"}</strong></div><div><span>الحساب</span><strong>محفوظ</strong></div></div>
      <div className="weekly-profile-progress"><div><span>إنجاز الأسبوع</span><strong>{weeklyProgress}%</strong></div><div className="workout-progress-track"><span style={{ width: `${weeklyProgress}%` }} /></div><small>حسب المجموعات التي سجلتها كمكتملة</small></div>
    </div>
  );
}
