import React, { useState, useEffect } from 'react';
import { Calculator, Clock, Calendar, ShieldCheck, Activity } from 'lucide-react';
import { CalculatorModal } from './CalculatorModal';

export const Footer: React.FC = () => {
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  // Real-time clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Arabic Date & Time
  const formattedDate = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(currentDateTime);

  const formattedTime = new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(currentDateTime);

  return (
    <>
      <footer 
        className="fixed bottom-0 left-0 right-0 w-full bg-slate-900 text-slate-300 border-t border-slate-800 z-40 py-2 px-3 sm:px-6 shadow-2xl"
        dir="rtl"
      >
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          {/* Right Section: System Name & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-white tracking-wide">ORBIX ERP</span>
              <span className="text-slate-400 hidden md:inline text-[11px]">| النظام السحابي المتكامل</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full border border-slate-700 font-mono hidden lg:inline">
              v2.8 Enterprise
            </span>
          </div>

          {/* Center Section: Real-time Date and Live Clock */}
          <div className="flex items-center gap-3 bg-slate-950/70 px-3 py-1 rounded-xl border border-slate-800/80 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-white font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Left Section: Calculator Shortcut Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCalcOpen(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="فتح الآلة الحاسبة المحاسبية السريعة"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>الآلة الحاسبة</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Calculator Modal Pop-up */}
      <CalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
    </>
  );
};
