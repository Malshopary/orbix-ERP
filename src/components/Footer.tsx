import React, { useState, useEffect, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import {
  Calculator,
  Clock,
  Calendar,
  UserPlus,
  Building2,
  Briefcase,
  PackagePlus,
  Sparkles,
  Database,
  FileSpreadsheet,
  Wifi,
  X,
  Plus,
  Bell,
  CheckSquare,
  ClipboardList,
  ChevronLeft,
} from 'lucide-react';
import { CalculatorModal } from './CalculatorModal';
import { QuickAddModal, QuickAddTab } from './QuickAddModal';
import { AiAssistantModal } from './AiAssistantModal';
import { BulkImportModal } from './BulkImportModal';
import { LanShareModal } from './LanShareModal';

export const Footer: React.FC = () => {
  const { navigateTo, pendingTasksCount = 0, awaitingApprovalTasksCount = 0 } = useErp();
  const totalTasksBadge = (pendingTasksCount || 0) + (awaitingApprovalTasksCount || 0);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<QuickAddTab>('customer');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isLanModalOpen, setIsLanModalOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [showAiBubble, setShowAiBubble] = useState(false);
  const [aiBubbleText, setAiBubbleText] = useState('');

  // Listen for Quick Actions Sheet open/toggle events (triggered by Mobile Bottom Nav or Shortcuts)
  useEffect(() => {
    const handleToggleQuickActions = () => setIsFabOpen((prev) => !prev);
    const handleOpenQuickActions = () => setIsFabOpen(true);
    const handleCloseQuickActions = () => setIsFabOpen(false);

    window.addEventListener('orbix:toggle-quick-actions', handleToggleQuickActions);
    window.addEventListener('orbix:open-quick-actions', handleOpenQuickActions);
    window.addEventListener('orbix:close-quick-actions', handleCloseQuickActions);

    return () => {
      window.removeEventListener('orbix:toggle-quick-actions', handleToggleQuickActions);
      window.removeEventListener('orbix:open-quick-actions', handleOpenQuickActions);
      window.removeEventListener('orbix:close-quick-actions', handleCloseQuickActions);
    };
  }, []);

  const aiBubbleMessages = [
    '💡 أهلاً بك! أنا مستشارك المالي الذكي، هل ترغب في مراجعة ملخص السيولة والمبيعات اليوم؟',
    '📊 نصيحة اليوم: متابعة أعمار الديون أولاً بأول يسرّع دوران رأس المال بنسبة تصل إلى 25%.',
    '📦 هل ترغب في معرفة الأصناف التي أوشكت على النفاد في المخازن لإصدار أوامر شراء عاجلة؟',
    '✨ أنا هنا لمساعدتك دائماً! انقر هنا لبدء محادثة ذكية واستشارتي محاسبياً وتشغيلياً.',
    '💰 تحب نراجع هوامش الربح للفواتير ونقدم توصيات لزيادة الإيرادات وخفض الهدر؟',
    '👥 هل ترغب في معرفة كبار العملاء الأكثر نشاطاً هذا الشهر لتقديم عروض خاصة لهم؟',
    '🏦 تنبيه محاسبي: راجع أرصدة الخزينة والبنوك دورياً لمطابقة حركات المقبوضات والمدفوعات.',
    '📈 هل تحتاج تحليلاً لتوقعات المبيعات وأفضل المنتجات طلباً للفترة القادمة؟',
  ];

  // Show smart AI bubble 3 seconds after opening the app
  useEffect(() => {
    const randomMsg = aiBubbleMessages[Math.floor(Math.random() * aiBubbleMessages.length)];
    setAiBubbleText(randomMsg);

    const timer = setTimeout(() => {
      setShowAiBubble(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

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
        className="hidden lg:block relative w-full bg-slate-900 text-slate-300 border-t border-slate-800 z-30 py-1.5 px-2.5 sm:px-5 shadow-2xl shrink-0 select-none print:hidden print-hide"
        dir="rtl"
      >
        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 text-xs">
          {/* Right Section: System Name & Status */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-extrabold text-white tracking-wide text-xs">ORBIX ERP</span>
              <span className="text-slate-400 hidden xl:inline text-[11px]">| النظام السحابي المتكامل</span>
            </div>

            <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full border border-slate-700 font-mono hidden xl:inline">
              v2.8 Enterprise
            </span>
          </div>

          {/* Center Section: Real-time Date and Live Clock (Visible on Desktop lg+) */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-950/70 px-3 py-1 rounded-xl border border-slate-800/80 text-[11px]">
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

          {/* Left/Action Section: Quick Add Icons + Calculator + Extra Tools (Compact Icons with Tooltips) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 overflow-visible py-0.5">
            {/* Quick Add Icons Group */}
            <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-xl border border-slate-800">
              {/* + عميل */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => openQuickAdd('customer')}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="إضافة عميل جديد"
                  aria-label="إضافة عميل جديد"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white transition-colors" />
                </button>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="bg-slate-950 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap">
                    + إضافة عميل
                  </div>
                  <div className="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-slate-700" />
                </div>
              </div>

              {/* + مورد */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => openQuickAdd('vendor')}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="إضافة مورد جديد"
                  aria-label="إضافة مورد جديد"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white transition-colors" />
                </button>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="bg-slate-950 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap">
                    + إضافة مورد
                  </div>
                  <div className="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-slate-700" />
                </div>
              </div>

              {/* + موظف */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => openQuickAdd('employee')}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="إضافة موظف أو مندوب جديد"
                  aria-label="إضافة موظف جديد"
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white transition-colors" />
                </button>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="bg-slate-950 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap">
                    + إضافة موظف
                  </div>
                  <div className="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-slate-700" />
                </div>
              </div>

              {/* + منتج */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => openQuickAdd('product')}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="إضافة صنف / منتج جديد"
                  aria-label="إضافة منتج جديد"
                >
                  <PackagePlus className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white transition-colors" />
                </button>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="bg-slate-950 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap">
                    + إضافة منتج
                  </div>
                  <div className="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-slate-700" />
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="h-4 w-px bg-slate-800 mx-0.5" />

            {/* Calculator Icon */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setIsCalcOpen(true)}
                className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95"
                title="الآلة الحاسبة المحاسبية السريعة"
                aria-label="الآلة الحاسبة"
              >
                <Calculator className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="bg-slate-950 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap">
                  الآلة الحاسبة
                </div>
                <div className="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-slate-700" />
              </div>
            </div>

            {/* Bulk Import Icon */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setIsBulkImportOpen(true)}
                className="w-7 h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white border border-emerald-500/30 flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95"
                title="استيراد إكسيل جماعي"
                aria-label="استيراد إكسيل"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              </button>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="bg-slate-950 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap">
                  استيراد إكسيل
                </div>
                <div className="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-slate-700" />
              </div>
            </div>

            {/* Orbix AI Advisor Icon with Proactive Callout Bubble */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  setShowAiBubble(false);
                  setIsAiModalOpen(true);
                }}
                className="w-7 h-7 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95"
                title="المستشار المالي الذكي (Orbix AI)"
                aria-label="المستشار الذكي (Orbix AI)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </button>

              {/* Standard hover tooltip (when bubble is not showing) */}
              {!showAiBubble && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="bg-slate-950 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>المستشار الذكي</span>
                  </div>
                  <div className="w-2 h-2 bg-slate-950 rotate-45 -mt-1 border-r border-b border-slate-700" />
                </div>
              )}

              {/* Proactive Floating AI Chat Callout Bubble */}
              {showAiBubble && (
                <div 
                  onClick={() => {
                    setShowAiBubble(false);
                    setIsAiModalOpen(true);
                  }}
                  className="absolute bottom-full mb-3 left-0 w-80 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-emerald-500/50 z-50 animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-200 cursor-pointer group/bubble hover:border-emerald-400 transition-all select-none"
                >
                  {/* Header: AI Badge & Close (X) button */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 animate-pulse text-amber-300" />
                      </div>
                      <span className="font-extrabold text-xs text-white">المستشار الذكي (Orbix AI)</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    </div>

                    {/* Close (X) Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAiBubble(false);
                      }}
                      className="w-6 h-6 rounded-lg bg-slate-800/90 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-90"
                      title="إغلاق التنبيه (X)"
                      aria-label="إغلاق التنبيه"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Bubble Message Text */}
                  <div className="py-2 text-xs text-slate-200 leading-relaxed font-medium">
                    {aiBubbleText}
                  </div>

                  {/* Bottom Action Hint */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px]">
                    <span className="text-emerald-400 font-bold group-hover/bubble:translate-x-0.5 transition-transform flex items-center gap-1">
                      <span>انقر هنا لبدء المحادثة</span>
                      <span>←</span>
                    </span>
                    <span className="text-slate-500 font-mono">Gemini AI</span>
                  </div>

                  {/* Pointer Arrow pointing to the Sparkles icon below */}
                  <div className="w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-emerald-500/50 absolute -bottom-1.5 left-2" />
                </div>
              )}
            </div>

            {/* LAN Network Sharing Button */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setIsLanModalOpen(true)}
                className="w-7 h-7 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white border border-emerald-500/30 flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95 relative"
                title="مشاركة الشبكة المحلية (LAN & QR Code)"
                aria-label="مشاركة LAN"
              >
                <Wifi className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse border border-slate-900" />
              </button>
              <div className="absolute bottom-full mb-2 left-0 hidden group-hover:flex flex-col pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="relative bg-slate-950 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>مشاركة LAN ورمز QR</span>
                  <div className="w-2 h-2 bg-slate-950 rotate-45 border-r border-b border-slate-700 absolute -bottom-1 left-2.5" />
                </div>
              </div>
            </div>

            {/* PostgreSQL Status Icon */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => navigateTo('settings', 'database_backup')}
                className="w-7 h-7 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 hover:text-white border border-indigo-500/30 flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95 relative"
                title="قاعدة بيانات PostgreSQL (سحابية نشطة)"
                aria-label="قاعدة بيانات PostgreSQL"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse border border-slate-900" />
              </button>
              <div className="absolute bottom-full mb-2 left-0 hidden group-hover:flex flex-col pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="relative bg-slate-950 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PostgreSQL (سحابية نشطة)</span>
                  <div className="w-2 h-2 bg-slate-950 rotate-45 border-r border-b border-slate-700 absolute -bottom-1 left-2.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          Quick Actions Sheet / Modal (Triggered by Mobile Bottom Nav button or shortcuts)
          ========================================================================= */}
      {isFabOpen && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
            {/* Backdrop Blur Overlay */}
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in cursor-pointer"
              onClick={() => setIsFabOpen(false)}
              aria-hidden="true"
            />

            {/* Bottom Sheet Modal Container */}
            <div className="relative w-full sm:max-w-md bg-slate-900/98 backdrop-blur-md border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl z-[80] p-4 pb-safe animate-in slide-in-from-bottom-8 duration-200 select-none overflow-hidden max-h-[85vh] flex flex-col">
              {/* Header: Title + Subtitle + Close (X) */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-2xs">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">الإجراءات والأدوات السريعة</h3>
                    <p className="text-[11px] text-slate-400">اختر العملية المطلوبة للبدء فوراً</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFabOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body with Organized Sections */}
              <div className="overflow-y-auto p-1 space-y-3.5 mt-3">
                {/* 0. Team Collaboration & Tasks Section */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFabOpen(false);
                      window.dispatchEvent(new CustomEvent('orbix:open-collaboration', { detail: { tab: 'tasks' } }));
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-800 to-slate-800/95 hover:from-emerald-900/90 hover:to-slate-800 border border-emerald-500/40 text-right transition-all cursor-pointer group active:scale-98 shadow-md"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform relative">
                        <CheckSquare className="w-5 h-5 text-white" />
                        {totalTasksBadge > 0 && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-slate-900 animate-ping" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">المهام وتكليفات الفريق والدردشة</span>
                          {totalTasksBadge > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse flex items-center gap-1">
                              <Bell className="w-2.5 h-2.5 fill-current animate-bell" />
                              {totalTasksBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">متابعة طلبات وتكليفات الموظفين والدردشة المباشرة</p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-400 group-hover:translate-x-[-3px] transition-transform">
                      <span>فتح</span>
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </button>
                </div>

                {/* 1. Quick Add Section */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-2 px-1">
                    إضافة سريعة:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* + تكليف / طلب لموظف */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFabOpen(false);
                        window.dispatchEvent(new CustomEvent('orbix:open-collaboration', { detail: { tab: 'tasks', openNewTask: true } }));
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-right transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-emerald-300 transition-colors">إضافة تكليف / طلب</div>
                        <div className="text-[10px] text-slate-400 truncate">طلب ومهمة لموظف</div>
                      </div>
                    </button>
                    {/* + عميل */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFabOpen(false);
                        openQuickAdd('customer');
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-right transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-emerald-300 transition-colors">إضافة عميل</div>
                        <div className="text-[10px] text-slate-400 truncate">سجل عميل جديد</div>
                      </div>
                    </button>

                    {/* + مورد */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFabOpen(false);
                        openQuickAdd('vendor');
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 text-right transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-blue-300 transition-colors">إضافة مورد</div>
                        <div className="text-[10px] text-slate-400 truncate">سجل مورد وشركة</div>
                      </div>
                    </button>

                    {/* + موظف */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFabOpen(false);
                        openQuickAdd('employee');
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 text-right transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-purple-300 transition-colors">إضافة موظف</div>
                        <div className="text-[10px] text-slate-400 truncate">كادر ومندوب جديد</div>
                      </div>
                    </button>

                    {/* + منتج */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFabOpen(false);
                        openQuickAdd('product');
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-right transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <PackagePlus className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">إضافة منتج</div>
                        <div className="text-[10px] text-slate-400 truncate">صنف ومخزون جديد</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Tools & Utilities Section */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-2 px-1">
                    أدوات ومساعدات النظام:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* الحاسبة */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFabOpen(false);
                        setIsCalcOpen(true);
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/50 text-right transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Calculator className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-teal-300 transition-colors">الآلة الحاسبة</div>
                        <div className="text-[10px] text-slate-400 truncate">حسابات مالية سريعة</div>
                      </div>
                    </button>

                    {/* إكسيل */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFabOpen(false);
                        setIsBulkImportOpen(true);
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-right transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-emerald-300 transition-colors">استيراد إكسيل</div>
                        <div className="text-[10px] text-slate-400 truncate">رفع جماعي للبيانات</div>
                      </div>
                    </button>

                    {/* المستشار الذكي AI */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFabOpen(false);
                        setIsAiModalOpen(true);
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-800/90 hover:from-emerald-900/60 hover:to-slate-800 border border-emerald-500/40 text-right transition-all cursor-pointer group active:scale-98 col-span-2"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-white group-hover:text-emerald-300 transition-colors">المستشار الذكي (Orbix AI)</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-mono">نشط 24/7</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">استشارات مالية وتحليل أرباح فوري</div>
                      </div>
                    </button>

                    {/* LAN Share */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFabOpen(false);
                        setIsLanModalOpen(true);
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 text-right transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-cyan-300 transition-colors">مشاركة الشبكة LAN</div>
                        <div className="text-[10px] text-slate-400 truncate">ربط أجهزة الكاشير و QR</div>
                      </div>
                    </button>

                    {/* PostgreSQL */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFabOpen(false);
                        navigateTo('settings', 'database_backup');
                      }}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 text-right transition-all cursor-pointer group active:scale-98"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform relative">
                        <Database className="w-4 h-4" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse border border-slate-900" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-white group-hover:text-indigo-300 transition-colors">قاعدة PostgreSQL</div>
                        <div className="text-[10px] text-slate-400 truncate">سحابية نشطة مع النسخ</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Quick Add Modal Pop-up */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        initialTab={quickAddTab}
      />

      {/* Calculator Modal Pop-up */}
      <CalculatorModal isOpen={isCalcOpen} onClose={() => setIsCalcOpen(false)} />

      {/* Orbix AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      {/* Bulk Excel/CSV Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      {/* LAN Network Sharing Modal */}
      <LanShareModal
        isOpen={isLanModalOpen}
        onClose={() => setIsLanModalOpen(false)}
      />
    </>
  );
};
