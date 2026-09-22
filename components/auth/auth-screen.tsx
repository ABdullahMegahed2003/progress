"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "signup";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setMessage("جارٍ الحفظ...");
    const formData = new FormData(event.currentTarget);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`/api/auth/${isSignup ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
        signal: controller.signal,
      });
      const result = await response.json();
      if (response.ok) {
        router.push("/");
        router.refresh();
        return;
      }
      setMessage(result.error ?? "تعذر إتمام العملية");
    } catch (error) {
      setMessage(error instanceof DOMException && error.name === "AbortError" ? "الاتصال بقاعدة البيانات استغرق وقتًا طويلًا" : "تعذر الاتصال بالخادم");
    } finally {
      window.clearTimeout(timeout);
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel" aria-labelledby="brand-title">
        <div className="brand-mark" aria-hidden="true"><span>GYM</span><i /></div>
        <div className="brand-copy"><p className="eyebrow">Train with intention</p><h1 id="brand-title">كل تمرينة<br />لها معنى.</h1><p className="brand-description">خطتك، تقدمك، وكل إنجازاتك في مكان واحد.</p></div>
        <div className="brand-footer"><span className="status-dot" /><span>بياناتك تظل متاحة حتى بدون إنترنت</span></div>
      </section>
      <section className="form-panel" aria-labelledby="auth-title">
        <div className="form-wrap">
          <div className="mobile-brand">GYM<span>.</span></div>
          <div className="form-heading"><p className="eyebrow">ابدأ رحلتك</p><h2 id="auth-title">{isSignup ? "أنشئ حسابك" : "أهلًا بعودتك"}</h2><p>{isSignup ? "أنشئ حسابًا واحفظ تقدمك أينما كنت." : "سجّل دخولك للعودة إلى تمرينتك التالية."}</p></div>
          <div className="mode-switch" role="tablist" aria-label="نوع الحساب">
            <button type="button" role="tab" aria-selected={!isSignup} className={!isSignup ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>تسجيل الدخول</button>
            <button type="button" role="tab" aria-selected={isSignup} className={isSignup ? "active" : ""} onClick={() => { setMode("signup"); setMessage(""); }}>حساب جديد</button>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            {isSignup && <label>الاسم<input name="name" type="text" placeholder="اكتب اسمك" autoComplete="name" required /></label>}
            {isSignup && <label>السن<input name="age" type="number" placeholder="مثال: 25" min="13" max="100" required /></label>}
            <label>البريد الإلكتروني<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>
            <label>كلمة المرور<input name="password" type="password" placeholder="••••••••" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required /></label>
            {isSignup && <label className="check-row"><input type="checkbox" required /><span>أوافق على شروط الاستخدام وسياسة الخصوصية</span></label>}
            <button className="submit-button" type="submit" disabled={isLoading}>{isLoading ? "جارٍ الحفظ..." : isSignup ? "إنشاء الحساب" : "تسجيل الدخول"}<span aria-hidden="true">{isLoading ? "..." : "←"}</span></button>
          </form>
          {message && <p className="form-message" role="status">{message}</p>}
          <p className="offline-note"><span aria-hidden="true">⌁</span> يمكنك متابعة التمرين بدون اتصال</p>
        </div>
      </section>
    </main>
  );
}
