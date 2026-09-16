import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare, CheckCircle2, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if already running as installed standalone app
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      return; // Already installed, do nothing
    }

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Listen for Android / Chrome native install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Check if user dismissed it recently (in the last 2 days)
      const lastDismissed = localStorage.getItem('orbix_pwa_dismissed_time');
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
      if (!lastDismissed || Date.now() - Number(lastDismissed) > twoDaysMs) {
        // Show after a brief delay for a smooth experience
        setTimeout(() => {
          setIsOpen(true);
        }, 1800);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If on iOS and not dismissed, show prompt after 2 seconds
    if (isIosDevice) {
      const lastDismissed = localStorage.getItem('orbix_pwa_dismissed_time');
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
      if (!lastDismissed || Date.now() - Number(lastDismissed) > twoDaysMs) {
        setTimeout(() => {
          setIsOpen(true);
        }, 2200);
      }
    }

    // Custom event to trigger the prompt anytime (from menu or settings)
    const handleManualTrigger = () => {
      setIsOpen(true);
    };
    window.addEventListener('orbix:show-pwa-install', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('orbix:show-pwa-install', handleManualTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('PWA installation error:', err);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      localStorage.setItem('orbix_pwa_dismissed_time', String(Date.now()));
    } catch {}
  };

  if (!isOpen || isStandalone) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl shadow-emerald-950/40 relative overflow-hidden animate-slide-up"
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with App Logo */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/50 p-2">
              <img src="/favicon.svg" alt="Orbix ERP" className="w-full h-full object-contain" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-slate-950" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">تثبيت تطبيق Orbix ERP</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                مجاني
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">شاشة كاملة وتصفح فائق السرعة كالتطبيق المكتبي</p>
          </div>
        </div>

        {/* Features Bullets */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3.5 mb-4 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>يعمل بملء الشاشة وبدون شريط المتصفح العلوي</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>أيقونة خاصة على الشاشة الرئيسية لجوالك للوصول الفوري</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>أداء كاشير سريع ومزامنة مباشرة مع الشبكة وقاعدة البيانات</span>
          </div>
        </div>

        {/* Action: Android / Chrome native prompt */}
        {!isIos && deferredPrompt ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-950/80 active:scale-98 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق الآن 📱</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors"
            >
              لاحقاً
            </button>
          </div>
        ) : isIos ? (
          /* iOS Safari Step-by-step Visual Instruction */
          <div className="space-y-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>خطوات التثبيت على الآيفون (Safari):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pr-1">
                <li>اضغط على زر المشاركة <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 inline-flex items-center gap-1"><Share2 className="w-3 h-3 inline" /> Share</strong> أسفل الشاشة.</li>
                <li>مرر للأسفل واختر <strong className="text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 inline-flex items-center gap-1"><PlusSquare className="w-3 h-3 inline" /> إضافة إلى الصفحة الرئيسية</strong>.</li>
                <li>اضغط على <strong className="text-emerald-400">إضافة (Add)</strong> في أعلى الزاوية.</li>
              </ol>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
            >
              حسناً، فهمت ذلك
            </button>
          </div>
        ) : (
          /* General browser instructions fallback */
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                alert('لتثبيت التطبيق: افتح قائمة خيارات المتصفح (⋮) ثم اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"');
                handleDismiss();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-950/80 active:scale-98 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>طريقة التثبيت 📱</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors"
            >
              إغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

