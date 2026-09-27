"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X, CheckCircle, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered successfully:", reg.scope))
        .catch((err) => console.log("Service Worker registration failed:", err));
    }

    // 2. Check if already installed
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      if (isStandalone) {
        setIsInstalled(true);
        return;
      }

      // Check iOS device
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIosDevice);

      // Check dismissed timestamp
      const dismissed = localStorage.getItem("pwa_prompt_dismissed");
      const isDismissedRecently = dismissed && Date.now() - parseInt(dismissed, 10) < 24 * 60 * 60 * 1000;

      // 3. Listen for Android/Chrome install prompt
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        if (!isDismissedRecently) {
          setIsVisible(true);
        }
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      // Listen for custom trigger from any button on the site
      const handleCustomTrigger = () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choice) => {
            if (choice.outcome === "accepted") {
              setIsInstalled(true);
              setIsVisible(false);
            }
          });
        } else if (isIosDevice) {
          setShowIOSTip(true);
          setIsVisible(true);
        } else {
          // Fallback: show banner
          setIsVisible(true);
        }
      };

      window.addEventListener("trigger-pwa-install", handleCustomTrigger);

      // Show iOS banner gently after 3 seconds if not dismissed
      if (isIosDevice && !isDismissedRecently) {
        const timer = setTimeout(() => {
          setIsVisible(true);
          setShowIOSTip(true);
        }, 3000);
        return () => clearTimeout(timer);
      }

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("trigger-pwa-install", handleCustomTrigger);
      };
    }
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSTip(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_prompt_dismissed", Date.now().toString());
  };

  if (isInstalled || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-bounce-short">
      <div className="relative overflow-hidden rounded-2xl bg-[#0e1422]/95 border border-amber-500/30 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300">
        
        {/* Ambient background glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          
          {/* App Icon preview */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <Smartphone className="w-6 h-6 text-amber-400" />
          </div>

          {/* Text Info */}
          <div className="flex-1 text-right">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>تثبيت تطبيق تَقَدُّم</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">سريع ومجاني</span>
              </h4>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              ثبت التطبيق مباشرة على هاتفك لتسجيل تمارينك بملء الشاشة وبدون متصفح!
            </p>

            {/* iOS Helper Instructions */}
            {isIOS && showIOSTip ? (
              <div className="mt-2.5 p-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-amber-200 flex items-center gap-2">
                <Share size={16} className="shrink-0 text-cyan-400" />
                <span>اضغط على زر <strong>المشاركة (Share)</strong> في الأسفل ثم اختر <strong>"إضافة إلى الصفحة الرئيسية"</strong> 📲</span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <Download size={14} />
                  <span>تثبيت على الهاتف الآن</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs transition-colors"
                >
                  لاحقاً
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
