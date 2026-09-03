import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Clock,
  Calendar,
  UserPlus,
  Building2,
  Briefcase,
  PackagePlus,
  PlusCircle,
} from 'lucide-react';
import { CalculatorModal } from './CalculatorModal';
import { QuickAddModal, QuickAddTab } from './QuickAddModal';

export const Footer: React.FC = () => {
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<QuickAddTab>('customer');
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  const openQuickAdd = (tab: QuickAddTab) => {
    setQuickAddTab(tab);
    setIsQuickAddOpen(true);
  };

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
        className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 z-30 py-1.5 px-3 sm:px-5 shadow-2xl shrink-0 select-none print:hidden print-hide"
        dir="rtl"
      >
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-2 text-xs">
          {/* Right Section: System Name & Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-white tracking-wide">ORBIX ERP</span>
              <span className="text-slate-400 hidden xl:inline text-[11px]">| النظام السحابي المتكامل</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full border border-slate-700 font-mono hidden md:inline">
              v2.8 Enterprise
            </span>
          </div>

          {/* Center Section: Real-time Date and Live Clock */}
          <div className="hidden sm:flex items-center gap-3 bg-slate-950/70 px-3 py-1 rounded-xl border border-slate-800/80 text-[11px]">
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

          {/* Left/Action Section: Quick Add Buttons + Calculator */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Quick Add Buttons (Right of calculator in RTL) */}
            <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => openQuickAdd('customer')}
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-emerald-700/80 text-slate-200 hover:text-white px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                title="إضافة عميل جديد للـ CRM والفواتير"
              >
                <UserPlus className="w-3 h-3 text-emerald-400" />
                <span>+ عميل</span>
              </button>

              <button
                type="button"
                onClick={() => openQuickAdd('vendor')}
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-emerald-700/80 text-slate-200 hover:text-white px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                title="إضافة مورد جديد للمشتريات"
              >
                <Building2 className="w-3 h-3 text-emerald-400" />
                <span>+ مورد</span>
              </button>

              <button
                type="button"
                onClick={() => openQuickAdd('employee')}
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-emerald-700/80 text-slate-200 hover:text-white px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                title="إضافة موظف أو مندوب مبيعات جديد"
              >
                <Briefcase className="w-3 h-3 text-emerald-400" />
                <span>+ موظف</span>
              </button>

              <button
                type="button"
                onClick={() => openQuickAdd('product')}
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-emerald-700/80 text-slate-200 hover:text-white px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                title="إضافة صنف / منتج جديد للمخازن"
              >
                <PackagePlus className="w-3 h-3 text-emerald-400" />
                <span>+ منتج</span>
              </button>
            </div>

            {/* Calculator Button */}
            <button
              type="button"
              onClick={() => setIsCalcOpen(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 px-2.5 py-1 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              title="فتح الآلة الحاسبة المحاسبية السريعة"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>الآلة الحاسبة</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Quick Add Modal Pop-up */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialTab={quickAddTab}
      />

      {/* Calculator Modal Pop-up */}
      <CalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />
    </>
  );
};
