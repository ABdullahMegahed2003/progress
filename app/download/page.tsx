"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Smartphone, ShieldCheck, Zap, Activity, Dumbbell, Calendar, Flame, CheckCircle2, ArrowRight, ChevronLeft } from "lucide-react";

export default function DownloadLandingPage() {
  const [activeTab, setActiveTab] = useState<"plans" | "logs" | "stats">("plans");

  return (
    <div className="landing-wrapper">
      {/* Background ambient glow effects */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      {/* Navigation Bar */}
      <header className="landing-nav">
        <div className="nav-container">
          <Link href="/" className="landing-logo">
            <span className="logo-badge">PRO</span>
            <span className="logo-text">تَقَدُّم <span>مختبر الأداء</span></span>
          </Link>

          <nav className="nav-links">
            <a href="#features">المميزات</a>
            <a href="#showcase">شاشات التطبيق</a>
            <a href="#install">خطوات التثبيت</a>
          </nav>

          <div className="nav-actions">
            <a href="/downloads/gym-app.apk" download className="btn-primary-glow sm">
              <Download size={16} />
              <span>تحميل APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="status-badge">
            <span className="badge-dot" />
            <span>تطبيق الموبايل الرسمي v1.0.0 (Android)</span>
          </div>

          <h1 className="hero-title">
            مدربك الشخصي <br />
            <span className="text-gradient">ومختبر أداؤك الرياضي</span> في جيبك
          </h1>

          <p className="hero-subtitle">
            حمل تطبيق <strong>تَقَدُّم Gym App</strong> الآن على هاتفك. تتبع أوزانك، صمم جداول التمارين الاحترافية (Push Pull Legs / Arnold Split)، وقس نموك العضلي بدقة متناهية وبدون تعقيد.
          </p>

          <div className="hero-cta-group">
            <a href="/downloads/gym-app.apk" download className="btn-primary-glow lg">
              <Download size={22} />
              <div className="btn-text-stack">
                <span className="btn-main">تحميل تطبيق Android (APK)</span>
                <span className="btn-sub">تنزيل مباشر مجاناً • 18.5 MB</span>
              </div>
            </a>

            <Link href="/" className="btn-secondary-glass lg">
              <span>تجربة النسخة الفورية</span>
              <ChevronLeft size={18} />
            </Link>
          </div>

          <div className="trust-features">
            <div className="trust-item"><ShieldCheck size={16} className="text-emerald" /> <span>آمن ومفحوص 100%</span></div>
            <div className="trust-item"><Zap size={16} className="text-cyan" /> <span>أداء سريع وخفيف</span></div>
            <div className="trust-item"><Smartphone size={16} className="text-purple" /> <span>يعمل بدون إنترنت</span></div>
          </div>
        </div>

        {/* Hero Visual Showcase */}
        <div className="hero-visual">
          <div className="phone-frame-container">
            <div className="phone-mockup">
              <div className="phone-notch" />
              <div className="phone-screen">
                <Image
                  src="/app-showcase.jpg"
                  alt="شاشة تطبيق تقدم للجيم"
                  width={360}
                  height={640}
                  className="showcase-img"
                  priority
                />
              </div>
            </div>

            {/* Floating Stats Badges */}
            <div className="floating-card card-top-right">
              <div className="card-icon bg-emerald"><Flame size={18} /></div>
              <div>
                <div className="card-val">+18%</div>
                <div className="card-lbl">زيادة الكتلة العضلية</div>
              </div>
            </div>

            <div className="floating-card card-bottom-left">
              <div className="card-icon bg-cyan"><Activity size={18} /></div>
              <div>
                <div className="card-val">85%</div>
                <div className="card-lbl">إنجاز خطة اليوم</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="landing-features">
        <div className="section-header">
          <span className="sub-tag">مميزات التطبيق</span>
          <h2>كل ما تحتاجه لبناء جسم مثالي في مكان واحد</h2>
          <p>تم تصميم التطبيق خصيصاً لرياضيي كمال الأجسام واللياقة البدنية لمساعدتك على تحقيق أقصى استفادة من كل تمرين.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon bg-gradient-cyan"><Dumbbell size={24} /></div>
            <h3>جداول تمارين احترافية</h3>
            <p>اختر من بين أشهر الأنظمة العالمية مثل Push Pull Legs و Arnold Split و Upper/Lower مع تعديل التمارين بحرية.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-gradient-emerald"><Activity size={24} /></div>
            <h3>متابعة الأوزان والتكرارات</h3>
            <p>سجل كل الجلسات والأوزان والتكرارات اليومية وسجل ملاحظاتك لكل تمرين بدقة لتضمن التطوير المستمر (Progressive Overload).</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-gradient-purple"><Calendar size={24} /></div>
            <h3>سجل يومي ذكي</h3>
            <p>شاشة تقويم وتدريب يومية تمكنك من مراجعة التمارين السابقة ومتابعة التزامك الأسبوعي والشهري.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon bg-gradient-amber"><Zap size={24} /></div>
            <h3>تطبيق سريع وبدون إعلانات</h3>
            <p>تجربة مستخدم سلسة وفائقة السرعة بدون أي إعلانات مزعجة وبدون استهلاك للبطارية أو الذاكرة.</p>
          </div>
        </div>
      </section>

      {/* App Screenshots Showcase */}
      <section id="showcase" className="landing-showcase">
        <div className="section-header">
          <span className="sub-tag">واجهات التطبيق</span>
          <h2>تصميم عصري وجذاب مريح للعين أثناء التمرين</h2>
        </div>

        <div className="tabs-navigation">
          <button className={activeTab === "plans" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("plans")}>خطط التمارين</button>
          <button className={activeTab === "logs" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("logs")}>السجل اليومي</button>
          <button className={activeTab === "stats" ? "tab-btn active" : "tab-btn"} onClick={() => setActiveTab("stats")}>الإحصائيات والملف</button>
        </div>

        <div className="showcase-display">
          <div className="showcase-text">
            {activeTab === "plans" && (
              <div>
                <h3>تخصيص أنظمة التدريب</h3>
                <p>تتيح لك شاشة التمارين اختيار النظام التدريبي المناسب لك ولعدد أيام تفرغك، مع إمكانية اقتراح تمارين للمجموعات العضلية المستهدفة تلقائياً.</p>
                <ul className="check-list">
                  <li><CheckCircle2 size={16} /> دعم نظام Push Pull Legs و Arnold Split</li>
                  <li><CheckCircle2 size={16} /> إمكانية إضافة وتعديل التمارين الخاصة بك</li>
                  <li><CheckCircle2 size={16} /> توزيع الجلسات حسب التفرغ الأسبوعي</li>
                </ul>
              </div>
            )}

            {activeTab === "logs" && (
              <div>
                <h3>سجل التدريب اليومي السريع</h3>
                <p>أثناء تواجدك في الجيم، يمكنك تسجيل أوزانك وتكراراتك بسرعة وسهولة دون إضاعة الوقت بين الجلسات.</p>
                <ul className="check-list">
                  <li><CheckCircle2 size={16} /> زر سريع لإنهاء التمارين</li>
                  <li><CheckCircle2 size={16} /> حفظ البيانات محلياً وفورياً</li>
                  <li><CheckCircle2 size={16} /> مؤشر لعداد الوقت ومتابعة الراحة</li>
                </ul>
              </div>
            )}

            {activeTab === "stats" && (
              <div>
                <h3>تتبع تطور الأداء والكتلة</h3>
                <p>رسوم بيانية وإحصائيات توضح لك مدى تقدمك في الأوزان وعدد التمارين المكتملة أسبوعياً وشهرياً.</p>
                <ul className="check-list">
                  <li><CheckCircle2 size={16} /> رسم بياني لتوزيع العضلات</li>
                  <li><CheckCircle2 size={16} /> حساب الإنجاز الشهري والأسبوعي</li>
                  <li><CheckCircle2 size={16} /> حفظ الملف الشخصي والأهداف</li>
                </ul>
              </div>
            )}
          </div>

          <div className="showcase-preview-frame">
            <Image
              src="/app-showcase.jpg"
              alt="معاينة التطبيق"
              width={340}
              height={600}
              className="preview-img"
            />
          </div>
        </div>
      </section>

      {/* Installation Instructions */}
      <section id="install" className="landing-install">
        <div className="section-header">
          <span className="sub-tag">سهولة التثبيت</span>
          <h2>كيف تقوم بتثبيت التطبيق على هاتفك؟</h2>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-num">1</div>
            <h4>تحميل ملف APK</h4>
            <p>اضغط على زر "تحميل APK" بأعلى الصفحة لبدء تنزيل ملف التطبيق المباشر على هاتفك.</p>
          </div>

          <div className="step-card">
            <div className="step-num">2</div>
            <h4>السماح بالتثبيت</h4>
            <p>افتح الملف المحمل على هاتفك ووافق على التثبيت من المصادر المعروفة إذا طلب منك النظام ذلك.</p>
          </div>

          <div className="step-card">
            <div className="step-num">3</div>
            <h4>ابدأ تمرينك!</h4>
            <p>افتح التطبيق وابدأ في اختيار نظامك التدريبي وسجل تمارينك اليومية فوراً.</p>
          </div>
        </div>
      </section>

      {/* Final Download Callout Banner */}
      <section className="download-banner">
        <div className="banner-glass">
          <h2>حمل التطبيق الآن وابدأ في تحسين أداؤك الرياضي</h2>
          <p>احصل على أحدث نسخة مجانية من تطبيق تَقَدُّم لجميع أجهزة أندرويد.</p>

          <a href="/downloads/gym-app.apk" download className="btn-primary-glow xl">
            <Download size={24} />
            <span>تنزيل APK المباشر (18.5 MB)</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-text">تَقَدُّم <span>مختبر الأداء</span></div>
            <p>تطبيق التمرين الاحترافي لمتابعة أداؤك وجدول تدريبك اليومي.</p>
          </div>
          <div className="footer-copyright">
            © 2026 تطبيق تَقَدُّم (Gym Performance App). جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
