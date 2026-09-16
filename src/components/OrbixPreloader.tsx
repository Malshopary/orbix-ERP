import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  Server, 
  Lock 
} from 'lucide-react';

interface OrbixPreloaderProps {
  isReady?: boolean;
  onFinish?: () => void;
  minDurationMs?: number;
}

export const OrbixPreloader: React.FC<OrbixPreloaderProps> = ({
  isReady = true,
  onFinish,
  minDurationMs = 1500,
}) => {
  const [progress, setProgress] = useState(8);
  const [isExiting, setIsExiting] = useState(false);
  const [startTime] = useState(() => Date.now());

  // Stages of system initialization
  const stages = useMemo(() => [
    {
      id: 1,
      minProgress: 0,
      maxProgress: 28,
      title: 'تهيئة النواة السحابية والاتصال بالخادم',
      subtitle: 'Initializing Cloud Kernel & PostgreSQL Engine...',
      tag: 'CORE ENGINE',
      icon: Zap,
    },
    {
      id: 2,
      minProgress: 28,
      maxProgress: 58,
      title: 'فحص بروتوكولات الأمان وصلاحيات الدخول (RBAC)',
      subtitle: 'Verifying Security Tokens & Role-Based Access...',
      tag: 'SECURITY',
      icon: ShieldCheck,
    },
    {
      id: 3,
      minProgress: 58,
      maxProgress: 88,
      title: 'مزامنة شجرة الحسابات والمخازن وسجلات النظام',
      subtitle: 'Hydrating Financial Ledger, Inventories & Catalogs...',
      tag: 'DATABASE SYNC',
      icon: Database,
    },
    {
      id: 4,
      minProgress: 88,
      maxProgress: 100,
      title: 'اكتمال التحضير • جاري إطلاق مساحة العمل الذكية',
      subtitle: 'Finalizing Interactive Workspace & UI Components...',
      tag: 'READY',
      icon: Sparkles,
    },
  ], []);

  // Compute current active stage
  const currentStage = useMemo(() => {
    return stages.find((s) => progress >= s.minProgress && progress <= s.maxProgress) || stages[stages.length - 1];
  }, [progress, stages]);

  // Smooth simulated progress tick linked with real isReady status
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const intervalTime = 35; // tick frequency in ms

    timer = setInterval(() => {
      setProgress((prev) => {
        const elapsed = Date.now() - startTime;
        const timeRatio = Math.min(elapsed / minDurationMs, 1);

        if (prev < 90) {
          // Increment smoothly towards 90%
          const step = Math.random() * 4 + 2;
          const target = Math.min(prev + step, Math.floor(timeRatio * 90) + 12);
          return Math.min(target, 92);
        }

        // Between 90% and 100%: wait until isReady is true and min duration passed
        if (isReady && elapsed >= minDurationMs) {
          const next = prev + 3;
          if (next >= 100) {
            clearInterval(timer);
            return 100;
          }
          return next;
        }

        // Hover around 92-95% while waiting
        return Math.min(prev + 0.3, 95);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isReady, minDurationMs, startTime]);

  // Handle completion and trigger cinematic exit
  useEffect(() => {
    if (progress >= 100) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 250);

      const finishTimer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 950);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [progress, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#020617] text-white flex flex-col items-center justify-between p-4 sm:p-8 select-none overflow-hidden transition-all duration-700 ease-out ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      dir="rtl"
    >
      {/* Ambient Radial Background Glows */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] rounded-full bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-cyan-500/5 blur-3xl pointer-events-none animate-pulse"
        style={{ animationDuration: '4s' }}
      />
      <div 
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"
      />
      <div 
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"
      />

      {/* Cyberpunk Grid Mesh Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Header Row: System Identity & Live Indicator */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 text-[11px] font-mono">
        <div className="flex items-center gap-2 text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 backdrop-blur-md">
          <Server className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-bold text-slate-200">ORBIX CLOUD ENGINE</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-bold">v2.8 Enterprise</span>
        </div>

        <div className="flex items-center gap-2 text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300 font-bold">جلسة اتصال مؤمنة</span>
          <Lock className="w-3 h-3 text-emerald-400" />
        </div>
      </div>

      {/* Center Section: Glowing Orbital Emblem + Title + Progress */}
      <div className="w-full max-w-md flex flex-col items-center justify-center my-auto z-10 text-center">
        {/* Orbital Nexus Sphere */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-7 sm:mb-8">
          {/* Outer Dashed Tech Ring (Rotating counter-clockwise) */}
          <div 
            className="absolute inset-0 rounded-full border border-dashed border-emerald-500/25 animate-spin"
            style={{ animationDuration: '24s', animationDirection: 'reverse' }}
          />

          {/* Middle Fine Ring */}
          <div 
            className="absolute inset-2 sm:inset-3 rounded-full border border-slate-800/80"
          />

          {/* Inner Orbital Track with Glowing Satellite Beacon (Rotating clockwise) */}
          <div 
            className="absolute inset-4 sm:inset-5 rounded-full border border-emerald-500/40 animate-spin"
            style={{ animationDuration: '8s' }}
          >
            {/* Satellite Beacon Dot */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md shadow-emerald-400 relative z-10" />
            </div>
          </div>

          {/* Central Translucent Glass Pod */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-slate-950/95 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/30 flex items-center justify-center backdrop-blur-xl group">
            {/* Ambient inner back-glow */}
            <div className="absolute inset-0 rounded-3xl bg-emerald-400/10 blur-md pointer-events-none" />

            {/* Orbix Official Vector Emblem */}
            <svg
              viewBox="144 523 304 304"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12 sm:w-14 sm:h-14 aspect-square shrink-0 filter drop-shadow-[0_0_14px_rgba(56,189,248,0.5)] transition-transform duration-500 group-hover:scale-105"
              aria-label="ORBIX Emblem"
            >
              {/* Top Right Blade */}
              <path
                fill="#38BDF8"
                d="M424.576,668.578l-26.788-0.137c-5.023-0.026-8.993-2.627-12.819-5.766l-75.204-61.682 c-3.137-2.573-4.87-7.315-4.877-11.323l-0.093-50.885c-0.011-5.89,4.327-10.711,9.781-12.352 c6.134-1.847,12.63-0.356,17.877,3.745l93.203,72.861c7.18,5.613,12.335,13.063,12.348,22.483l0.041,30.214 C438.053,663.265,431.998,668.616,424.576,668.578z"
              />
              {/* Bottom Right Blade */}
              <path
                fill="#38BDF8"
                d="M319.615,824.292c-7.902,0.317-14.748-5.214-14.76-13.092l-0.076-49.738 c-0.008-5.161,2.461-9.982,6.312-13.171l28.755-23.816l47.942-39.159c3.351-2.737,7.488-4.022,11.719-4.024l24.955-0.015 c7.659-0.005,13.682,5.828,13.694,13.542l0.044,27.118c0.015,9.206-3.954,18.268-11.376,24.095l-93.64,73.505 C329.307,822.58,324.68,824.089,319.615,824.292z"
              />
              {/* Top Left Blade */}
              <path
                fill="#38BDF8"
                d="M193.762,668.515l-25.46,0.078c-7.199,0.022-13.81-5.007-13.818-12.662l-0.03-29.727 c-0.01-9.566,5.192-17.45,12.496-23.159l50.447-39.433l43.197-33.625c4.611-3.589,10.219-4.98,15.83-4.042 c6.354,1.062,11.471,6.2,11.467,12.852l-0.035,50.292c-0.004,6.294-3.237,10.733-7.834,14.481l-73.89,60.255 C202.539,666.756,198.553,668.501,193.762,668.515z"
              />
              {/* Bottom Left Blade */}
              <path
                fill="#38BDF8"
                d="M287.858,810.471c0,8.588-7.076,14.187-15.14,13.865c-5.393-0.215-10.248-2.182-14.583-5.591 l-90.864-71.447c-7.468-5.872-12.78-13.838-12.802-23.521l-0.068-29.345c-0.018-7.566,6.411-13.175,13.754-13.173l24.406,0.006 c5.853,0.002,10.316,2.358,14.726,5.988l72.096,59.364c5.213,3.586,8.478,8.904,8.478,15.402L287.858,810.471z"
              />
              {/* Central Green Orb */}
              <circle
                cx="296.288"
                cy="675.003"
                r="45.399"
                fill="#0FBE7B"
                className="animate-pulse"
                style={{ animationDuration: '2s' }}
              />
            </svg>
          </div>
        </div>

        {/* Brand Name & Typography */}
        <div className="flex items-center justify-center gap-2 mb-2" dir="ltr">
          <span 
            className="text-3xl sm:text-4xl font-black tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-200"
            style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
          >
            ORBIX
          </span>
          <span className="text-xs sm:text-sm font-extrabold px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-xs shadow-emerald-500/20 tracking-wider uppercase font-mono">
            ERP
          </span>
        </div>

        {/* System Subtitle */}
        <p className="text-xs sm:text-sm font-bold text-slate-300 mb-6 sm:mb-7 tracking-wide">
          النظام السحابي المتكامل لإدارة الموارد والمؤسسات
        </p>

        {/* Progress Bar & Numeric Metric Card */}
        <div className="w-full max-w-sm bg-slate-900/80 rounded-2xl p-4 border border-slate-800/90 shadow-xl backdrop-blur-md">
          {/* Top of Progress: Dynamic Step Name & Percentage */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <currentStage.icon className="w-3 h-3 animate-pulse" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-200 truncate">
                {currentStage.title}
              </span>
            </div>

            {/* Percentage Number */}
            <span className="font-mono text-sm sm:text-base font-extrabold text-emerald-400 shrink-0 tabular-nums">
              %{Math.floor(progress)}
            </span>
          </div>

          {/* Glowing Cyberpunk Progress Bar */}
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-150 ease-out relative shadow-sm shadow-emerald-400"
              style={{ width: `${progress}%` }}
            >
              {/* Luminous Leading Head Dot */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-md shadow-white" />
            </div>
          </div>

          {/* Subtitle / Tech Log */}
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="truncate">{currentStage.subtitle}</span>
            <span className="text-emerald-500/80 font-bold shrink-0 ml-2">
              [{currentStage.tag}]
            </span>
          </div>
        </div>

        {/* Modular Status Pills */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full max-w-sm mt-3.5">
          {[
            { label: 'المالية', icon: Layers, threshold: 25 },
            { label: 'المخازن', icon: Cpu, threshold: 55 },
            { label: 'المبيعات', icon: CheckCircle2, threshold: 80 },
            { label: 'الأمان', icon: ShieldCheck, threshold: 95 },
          ].map((mod) => {
            const isDone = progress >= mod.threshold;
            return (
              <div
                key={mod.label}
                className={`flex items-center justify-center gap-1 py-1 px-1 rounded-xl text-[10px] font-bold border transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 shadow-2xs shadow-emerald-500/20'
                    : 'bg-slate-900/40 text-slate-500 border-slate-800/60'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                <span>{mod.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer: Security & Infrastructure Meta */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 text-[10px] sm:text-[11px] text-slate-500 font-mono border-t border-slate-900 pt-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>قاعدة بيانات PostgreSQL السحابية نشطة</span>
        </div>

        <div className="text-slate-500 hidden sm:block">
          معالجة وتشفير كامل للبيانات (256-Bit SSL)
        </div>

        <div className="text-slate-400">
          © {new Date().getFullYear()} Orbix ERP • كافة الحقوق محفوظة
        </div>
      </div>
    </div>
  );
};

