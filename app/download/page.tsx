"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Smartphone, ShieldCheck, Zap, Activity, Dumbbell, Calendar, Flame, CheckCircle2, ChevronLeft, Sun, Moon, Plus, Sparkles, Layers, Trophy } from "lucide-react";

export default function DownloadLandingPage() {
  const [activeTab, setActiveTab] = useState<"home" | "plans" | "log">("home");

  return (
    <div className="landing-wrapper">
      {/* Background ambient glow effects */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />
      <div className="ambient-glow glow-3" />

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
            <a href="#install">طريقة التثبيت</a>
          </nav>

          <div className="nav-actions">
            <a href="/downloads/gym-app.apk" download className="btn-primary-glow sm pulse-anim">
              <Download size={16} />
              <span>تنزيل APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero fade-in-up">
        <div className="hero-content">
          <div className="status-badge slide-in">
            <span className="badge-dot pulse-dot" />
            <span>تطبيق الموبايل الرسمي v1.0.0 (Android APK)</span>
          </div>

          <h1 className="hero-title">
            مدربك الشخصي <br />
            <span className="text-gradient">ومختبر أداؤك الرياضي</span> في جيبك
          </h1>

          <p className="hero-subtitle">
            حمل تطبيق <strong>تَقَدُّم Gym App</strong> الأصلي على هاتفك. تتبع أوزانك، صمم جداول التمارين الاحترافية (Push Pull Legs / Arnold Split)، وقس نموك العضلي بدقة متناهية ودون الحاجة لاتصال دائم بالإنترنت.
          </p>

          <div className="hero-cta-group">
            <a href="/downloads/gym-app.apk" download className="btn-primary-glow lg pulse-anim">
              <Download size={24} />
              <div className="btn-text-stack">
                <span className="btn-main">تنزيل ملف APK المباشر</span>
                <span className="btn-sub">مجاني 100% • 18.5 MB • Android</span>
              </div>
            </a>

            <Link href="/app" className="btn-secondary-glass lg hover-lift">
              <span>تجربة النسخة أونلاين</span>
              <ChevronLeft size={18} />
            </Link>
          </div>

          <div className="trust-features">
            <div className="trust-item"><ShieldCheck size={16} className="text-emerald" /> <span>تطبيق آمن وسريع</span></div>
            <div className="trust-item"><Zap size={16} className="text-cyan" /> <span>بدون إعلانات مزعجة</span></div>
            <div className="trust-item"><Smartphone size={16} className="text-gold" /> <span>حفظ البيانات محلياً</span></div>
          </div>
        </div>

        {/* Hero Visual: REAL LIVE APP UI MOCKUP */}
        <div className="hero-visual">
          <div className="phone-frame-container">
            
            {/* Real App Interface Inside Phone Mockup */}
            <div className="phone-mockup glow-border">
              <div className="phone-speaker" />
              <div className="phone-notch" />
              
              <div className="phone-screen real-app-theme">
                {/* Real App Header */}
                <div className="app-mockup-header">
                  <div className="home-logo">تَقَدُّم<span>مختبر الأداء</span></div>
                  <div className="app-header-icons">
                    <Moon size={14} className="icon-gold" />
                  </div>
                </div>

                {/* Real App Screen Selector Switcher */}
                <div className="mockup-tab-selector">
                  <button className={activeTab === "home" ? "active" : ""} onClick={() => setActiveTab("home")}>الرئيسية</button>
                  <button className={activeTab === "plans" ? "active" : ""} onClick={() => setActiveTab("plans")}>الأنظمة</button>
                  <button className={activeTab === "log" ? "active" : ""} onClick={() => setActiveTab("log")}>السجل</button>
                </div>

                {/* Real App Screen Views */}
                <div className="mockup-screen-body">
                  {activeTab === "home" && (
                    <div className="mockup-view tab-fade-in">
                      <div className="active-system-banner">
                        <span className="sys-label">النظام الحالي:</span>
                        <span className="sys-name">Push Pull Legs</span>
                      </div>

                      <div className="mockup-card progress-card">
                        <div className="card-row">
                          <span className="card-title">تمرين اليوم: يوم الصدر والذراع</span>
                          <span className="card-badge">يوم 1</span>
                        </div>
                        <div className="progress-bar-wrap">
                          <div className="progress-bar-fill" style={{ width: "85%" }} />
                        </div>
                        <div className="card-sub">85% من التمارين مكتملة اليوم</div>
                      </div>

                      <div className="mockup-exercise-list">
                        <div className="ex-item done">
                          <CheckCircle2 size={15} className="text-emerald" />
                          <div className="ex-info">
                            <span className="ex-name">ضغط صدر بالبار</span>
                            <span className="ex-meta">4 جلسات • 80 كجم</span>
                          </div>
                        </div>

                        <div className="ex-item done">
                          <CheckCircle2 size={15} className="text-emerald" />
                          <div className="ex-info">
                            <span className="ex-name">ضغط صدر بالدمبل المائل</span>
                            <span className="ex-meta">3 جلسات • 32 كجم</span>
                          </div>
                        </div>

                        <div className="ex-item current">
                          <Flame size={15} className="text-amber" />
                          <div className="ex-info">
                            <span className="ex-name">ترايسيبس بالحبل</span>
                            <span className="ex-meta">جار التوثيق الآن...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "plans" && (
                    <div className="mockup-view tab-fade-in">
                      <div className="section-title-sm">اختر النظام التدريبي المناسب</div>

                      <div className="plan-selection-card selected">
                        <div className="plan-head">
                          <span className="plan-name">Push Pull Legs</span>
                          <span className="plan-tag">مستحسن</span>
                        </div>
                        <p className="plan-desc">تقسيم الصدر والظهر والأرجل على الأيام لزيادة البناء العضلي.</p>
                      </div>

                      <div className="plan-selection-card">
                        <div className="plan-head">
                          <span className="plan-name">Arnold Split</span>
                        </div>
                        <p className="plan-desc">نظام آرنولد الشهير (صدر/ظهر، كتف/ذراع، أرجل).</p>
                      </div>

                      <div className="plan-selection-card">
                        <div className="plan-head">
                          <span className="plan-name">Upper / Lower</span>
                        </div>
                        <p className="plan-desc">تقسيم علوي وسفلي 4 أيام أسبوعياً.</p>
                      </div>
                    </div>
                  )}

                  {activeTab === "log" && (
                    <div className="mockup-view tab-fade-in">
                      <div className="log-date-header">
                        <Calendar size={14} className="text-gold" />
                        <span>سجل اليوم: الثلاثاء 22 سبتمبر</span>
                      </div>

                      <div className="mockup-set-box">
                        <div className="set-head">ضغط صدر بالبار (Bench Press)</div>
                        <div className="set-row">
                          <span>الجلسة 1</span>
                          <span>10 تكرارات</span>
                          <span className="weight-tag">80 كجم</span>
                          <CheckCircle2 size={14} className="text-emerald" />
                        </div>
                        <div className="set-row">
                          <span>الجلسة 2</span>
                          <span>8 تكرارات</span>
                          <span className="weight-tag">85 كجم</span>
                          <CheckCircle2 size={14} className="text-emerald" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Real App Bottom Nav */}
                <div className="app-mockup-bottom-nav">
                  <div className={activeTab === "home" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("home")}><Dumbbell size={16} /><span>الرئيسية</span></div>
                  <div className={activeTab === "plans" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("plans")}><Layers size={16} /><span>الأنظمة</span></div>
                  <div className={activeTab === "log" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("log")}><Calendar size={16} /><span>السجل</span></div>
                </div>
              </div>
            </div>

            {/* Floating Stats Badges with Slow Float Animation */}
            <div className="floating-card card-top-right float-anim-1">
              <div className="card-icon bg-emerald"><Flame size={18} /></div>
              <div>
                <div className="card-val">+18%</div>
                <div className="card-lbl">زيادة الكتلة العضلية</div>
              </div>
            </div>

            <div className="floating-card card-bottom-left float-anim-2">
              <div className="card-icon bg-cyan"><Trophy size={18} /></div>
              <div>
                <div className="card-val">85 كجم</div>
                <div className="card-lbl">أعلى وزن مكتمل</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="landing-features">
        <div className="section-header">
          <span className="sub-tag">مميزات التطبيق الأصلية</span>
          <h2>كل ما تحتاجه لتنظيم تمارينك وبناء جسمك</h2>
          <p>تم تصميم الواجهات والخصائص خصيصاً لمساعدتك على تسجيل أوزانك وإنجاز تمارينك بسهولة داخل الجيم.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card hover-lift">
            <div className="feature-icon bg-gradient-cyan"><Dumbbell size={24} /></div>
            <h3>جداول تمارين عالمية</h3>
            <p>اختر من بين أنظمة Push Pull Legs و Arnold Split و Upper/Lower مع تعديل واقتراح التمارين المناسبة لمجموعتك العضلية.</p>
          </div>

          <div className="feature-card hover-lift">
            <div className="feature-icon bg-gradient-emerald"><Activity size={24} /></div>
            <h3>تتبع الأوزان والتكرارات</h3>
            <p>سجل الجلسات والأوزان والتكرارات بسرعة بدقة عالية لمتابعة تطورك المستمر (Progressive Overload).</p>
          </div>

          <div className="feature-card hover-lift">
            <div className="feature-icon bg-gradient-purple"><Calendar size={24} /></div>
            <h3>سجل يومي وتقويم محلي</h3>
            <p>سجل تمرينك اليومي واطلع على أدائك السابق والتزامك الأسبوعي في أي وقت بدون الحاجة لإنترنت.</p>
          </div>

          <div className="feature-card hover-lift">
            <div className="feature-icon bg-gradient-amber"><Zap size={24} /></div>
            <h3>تطبيق أندرويد سريع ومجاني</h3>
            <p>ملف APK خفيف وسريع يعمل كتطبيق عادي على الهاتف دون إعلانات وموفر جداً للبطارية والذاكرة.</p>
          </div>
        </div>
      </section>

      {/* Interactive App Screenshots Section */}
      <section id="showcase" className="landing-showcase">
        <div className="section-header">
          <span className="sub-tag">معاينة واجهات التطبيق</span>
          <h2>تصميم داكن وأنيق مريح للعين أثناء التمرين</h2>
        </div>

        <div className="showcase-interactive-box">
          <div className="showcase-tabs-nav">
            <button className={activeTab === "home" ? "active" : ""} onClick={() => setActiveTab("home")}>
              <Dumbbell size={16} /> <span>الواجهة الرئيسية</span>
            </button>
            <button className={activeTab === "plans" ? "active" : ""} onClick={() => setActiveTab("plans")}>
              <Layers size={16} /> <span>خطط التمارين</span>
            </button>
            <button className={activeTab === "log" ? "active" : ""} onClick={() => setActiveTab("log")}>
              <Calendar size={16} /> <span>السجل اليومي</span>
            </button>
          </div>

          <div className="showcase-card-details">
            {activeTab === "home" && (
              <div className="detail-pane tab-fade-in">
                <h3>الصفحة الرئيسية ومتابعة اليوم</h3>
                <p>تمنحك الواجهة الرئيسية نظرة فورية على نظامك الحالي، ونسبة التمارين المكتملة لليوم، مع قائمة التمارين المجدولة وتسهيل تسجيل الأوزان.</p>
                <div className="bullets-grid">
                  <div className="bullet-item"><CheckCircle2 size={16} className="text-emerald" /> <span>مؤشر نسبة إنجاز تمارين اليوم</span></div>
                  <div className="bullet-item"><CheckCircle2 size={16} className="text-emerald" /> <span>تحديد التمارين المكتملة بنقرة واحدة</span></div>
                  <div className="bullet-item"><CheckCircle2 size={16} className="text-emerald" /> <span>مظهر ليلي مريح للعين داخل الصالة</span></div>
                </div>
              </div>
            )}

            {activeTab === "plans" && (
              <div className="detail-pane tab-fade-in">
                <h3>خطط التمارين والأنظمة العالمية</h3>
                <p>اختر النظام التدريبي المتوافق مع أيام تفرغك، واطلع على التمارين المقترحة لكل عضلة مع إمكانية التخصيص وإضافة تمارينك الخاصة.</p>
                <div className="bullets-grid">
                  <div className="bullet-item"><CheckCircle2 size={16} className="text-emerald" /> <span>دعم Push Pull Legs و Arnold Split</span></div>
                  <div className="bullet-item"><CheckCircle2 size={16} className="text-emerald" /> <span>اقتراح تمارين المجموعات العضلية تلقائياً</span></div>
                  <div className="bullet-item"><CheckCircle2 size={16} className="text-emerald" /> <span>توزيع الأيام بحرية تامة</span></div>
                </div>
              </div>
            )}

            {activeTab === "log" && (
              <div className="detail-pane tab-fade-in">
                <h3>السجل اليومي وحفظ الجلسات</h3>
                <p>وثق كل جلسة بالوزن والتكرار في ثوان معدودة دون إضاعة وقت راحتك في الجيم، مع إمكانية استرجاع تاريخ التمارين السابقة بسهولة.</p>
                <div className="bullets-grid">
                  <div className="bullet-item"><CheckCircle2 size={16} className="text-emerald" /> <span>تسجيل الجلسات بالأوزان والتكرارات</span></div>
                  <div className="bullet-item"><CheckCircle2 size={16} className="text-emerald" /> <span>تقويم لمراجعة سجل التمارين حسب التاريخ</span></div>
                  <div className="bullet-item"><CheckCircle2 size={16} className="text-emerald" /> <span>حفظ فوري آمن ومحلي</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Installation Instructions */}
      <section id="install" className="landing-install">
        <div className="section-header">
          <span className="sub-tag">طريقة التثبيت على الموبايل</span>
          <h2>ثبت التطبيق على هاتفك في 3 خطوات بسيطة</h2>
        </div>

        <div className="steps-container">
          <div className="step-card hover-lift">
            <div className="step-num">1</div>
            <h4>قم بتنزيل ملف APK</h4>
            <p>اضغط على زر "تنزيل ملف APK المباشر" لبدء التحميل المجاني على جهاز الأندرويد.</p>
          </div>

          <div className="step-card hover-lift">
            <div className="step-num">2</div>
            <h4>افتح الملف والموافقة</h4>
            <p>افتح ملف `gym-app.apk` المحمل، ووافق على التثبيت من هذا المصدر في إعدادات الهاتف.</p>
          </div>

          <div className="step-card hover-lift">
            <div className="step-num">3</div>
            <h4>استمتع بالتمرين!</h4>
            <p>افتح تطبيق "تَقَدُّم" من قائمة تطبيقاتك ابدأ في تنظيم تمرينك اليومي فوراً.</p>
          </div>
        </div>
      </section>

      {/* Download Callout Banner */}
      <section className="download-banner">
        <div className="banner-glass pulse-border">
          <Sparkles className="sparkle-icon" size={32} />
          <h2>جاهز لتحسين أداؤك في الجيم؟</h2>
          <p>احصل على النسخة الرسمية من تطبيق تَقَدُّم مجاناً الآن وابدأ في تتبع نتائجك.</p>

          <a href="/downloads/gym-app.apk" download className="btn-primary-glow xl pulse-anim">
            <Download size={26} />
            <span>تنزيل APK المباشر (18.5 MB)</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-text">تَقَدُّم <span>مختبر الأداء</span></div>
            <p>تطبيق التمرين الاحترافي لتنظيم تدريبك اليومي ومتابعة الكتلة العضلية.</p>
          </div>
          <div className="footer-copyright">
            © 2026 تطبيق تَقَدُّم (Gym App APK). جميع الحقوق محفوظة.
          </div>
        </div>
      </footer>
    </div>
  );
}
