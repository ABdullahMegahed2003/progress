"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { systems } from "@/components/home/home-data";

export function PlansScreen() {
  const router = useRouter();
  const [selectedSystem, setSelectedSystem] = useState("");

  function chooseSystem(name: string) {
    setSelectedSystem(name);
    router.push(`/training-plan?system=${encodeURIComponent(name)}`);
  }

  return (
    <div className="screen-content plans-screen">
      <div className="screen-heading">
        <span className="screen-kicker">أنظمة التدريب</span>
        <h1>اختار طريقك.</h1>
        <p>اضغط على النظام لترى كل التمارين الموجودة فيه.</p>
      </div>

      <div className="full-systems">
        {systems.map(({ name, label, days, icon: Icon, color }) => (
          <button
            className={selectedSystem === name ? "full-system selected" : "full-system"}
            key={name}
            onClick={() => chooseSystem(name)}
          >
            <span className={`system-mini-icon ${color}`}><Icon size={21} /></span>
            <span><strong>{name}</strong><small>{label} · {days}</small></span>
            <ChevronLeft size={17} />
          </button>
        ))}
      </div>

      <p className="plans-hint">اختار النظام لفتح صفحة تمارينك وتسجيل الوزن والعدات.</p>
    </div>
  );
}