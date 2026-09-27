"use client";

import { useState } from "react";
import { ChevronLeft, Dumbbell, Flame, Layers, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { systems } from "@/components/home/home-data";

export function PlansScreen() {
  const router = useRouter();
  const [selectedSystem, setSelectedSystem] = useState("");

  function chooseSystem(name: string) {
    setSelectedSystem(name);
    localStorage.setItem("gym-active-system", name);
    localStorage.setItem("gym-system-saved", name);
    router.push(`/training-plan?system=${encodeURIComponent(name)}`);
  }

  return (
    <div className="screen-content plans-screen animate-fade-in pb-8">
      {/* Header */}
      <div className="screen-greeting">
        <div>
          <span className="screen-kicker">جداول التمارين الاحترافية</span>
          <h1>
            اختر نظامك.<br />
            <em>وابدأ بناء القوة.</em>
          </h1>
        </div>
        <div className="mini-avatar">
          <Layers size={22} className="text-[#00ff88]" />
        </div>
      </div>

      {/* Systems Grid */}
      <div className="space-y-3 mt-4">
        {systems.map(({ name, label, days, icon: Icon, color }) => {
          const isSelected = selectedSystem === name;
          return (
            <button
              key={name}
              onClick={() => chooseSystem(name)}
              className={`w-full p-4 rounded-2xl bg-[#0e1628]/85 hover:bg-[#121c34] border ${
                isSelected ? "border-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.25)]" : "border-white/10 hover:border-[#00ff88]/40"
              } flex items-center justify-between text-right transition-all duration-200 cursor-pointer backdrop-blur-md group`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00ff88]/15 to-[#00f0ff]/15 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] group-hover:scale-105 transition-transform shrink-0">
                  <Icon size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-extrabold text-white group-hover:text-[#00ff88] transition-colors">
                      {name}
                    </strong>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/5 text-gray-300 border border-white/10">
                      {days}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 m-0">{label}</p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-[#00ff88] group-hover:bg-[#00ff88]/15 transition-all">
                <ChevronLeft size={16} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center mt-4">
        <p className="text-xs text-cyan-300 m-0">
          💡 يمكنك تخصيص التمارين وإضافة أوزانك وتكراراتك مباشرة داخل كل نظام.
        </p>
      </div>
    </div>
  );
}