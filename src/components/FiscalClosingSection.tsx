import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
  Building2,
  ArrowRightLeft,
  Clock,
  ShieldCheck,
  RotateCcw,
  X,
  Info,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { FiscalYear, FiscalPeriod } from '../types';

export const FiscalClosingSection: React.FC = () => {
  const {
    fiscalYears = [],
    accounts = [],
    journalEntries = [],
    closeFiscalYear,
    reopenFiscalYear,
    toggleLockFiscalPeriod,
    currency,
    formatMoney,
    showAlert,
    showConfirm,
    navigateTo,
  } = useErp();

  // Selected fiscal year (default to the open one or the most recent)
  const [selectedYearId, setSelectedYearId] = useState<string>(() => {
    const openYear = fiscalYears.find((fy) => fy.status === 'open');
    return openYear ? openYear.id : fiscalYears[0]?.id || '';
  });

  const activeFiscalYear = useMemo(() => {
    return fiscalYears.find((fy) => fy.id === selectedYearId) || fiscalYears[0];
  }, [fiscalYears, selectedYearId]);

  // Retained earnings account (code 3200)
  const retainedEarningsAccount = useMemo(() => {
    return accounts.find((a) => a.code === '3200' || a.name.includes('أرباح محتجزة') || a.name.includes('أرباح وخسائر المرحلة')) || accounts.find((a) => a.type === 'equity');
  }, [accounts]);

  // Real-time calculation of revenue, expense, and net income for the active fiscal year
  const financialSummary = useMemo(() => {
    if (!activeFiscalYear) {
      return { totalRevenue: 0, totalExpense: 0, netIncome: 0, entriesCount: 0 };
    }

    const yearEntries = journalEntries.filter(
      (je) => je.date >= activeFiscalYear.startDate && je.date <= activeFiscalYear.endDate
    );

    let totalRevenue = 0;
    let totalExpense = 0;

    const revenueAccountIds = new Set(
      accounts.filter((a) => a.type === 'revenue' && !a.isHeader).map((a) => a.id)
    );
    const expenseAccountIds = new Set(
      accounts.filter((a) => a.type === 'expense' && !a.isHeader).map((a) => a.id)
    );

    yearEntries.forEach((je) => {
      je.lines.forEach((line) => {
        if (revenueAccountIds.has(line.accountId)) {
          totalRevenue += (Number(line.credit) || 0) - (Number(line.debit) || 0);
        } else if (expenseAccountIds.has(line.accountId)) {
          totalExpense += (Number(line.debit) || 0) - (Number(line.credit) || 0);
        }
      });
    });

    const netIncome = totalRevenue - totalExpense;

    return {
      totalRevenue: Math.max(0, totalRevenue),
      totalExpense: Math.max(0, totalExpense),
      netIncome,
      entriesCount: yearEntries.length,
    };
  }, [activeFiscalYear, journalEntries, accounts]);

  // Modal State for Year Closing Confirmation & Audit
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingNotes, setClosingNotes] = useState('');
  const [selectedRetainedAccId, setSelectedRetainedAccId] = useState<string>(
    retainedEarningsAccount?.id || '3200'
  );

  // Filter periods
  const [periodFilter, setPeriodFilter] = useState<'all' | 'locked' | 'open'>('all');

  const filteredPeriods = useMemo(() => {
    if (!activeFiscalYear) return [];
    return activeFiscalYear.periods.filter((p) => {
      if (periodFilter === 'locked') return p.isLocked;
      if (periodFilter === 'open') return !p.isLocked;
      return true;
    });
  }, [activeFiscalYear, periodFilter]);

  const lockedCount = activeFiscalYear?.periods.filter((p) => p.isLocked).length || 0;
  const totalPeriodsCount = activeFiscalYear?.periods.length || 12;

  // Handle Close Fiscal Year execution
  const handleExecuteClosing = () => {
    if (!activeFiscalYear) return;

    const result = closeFiscalYear(activeFiscalYear.id, selectedRetainedAccId, closingNotes);
    if (result.success) {
      setShowClosingModal(false);
      showAlert({
        title: 'تم إقفال السنة المالية بنجاح',
        message: result.message,
        details: `رقم قيد الإقفال: ${result.closingEntryNumber} | رقم القيد الافتتاحي: ${result.openingEntryNumber}`,
        type: 'success',
        confirmText: 'تم الحفظ والمصادقة',
      });
    } else {
      showAlert({
        title: 'تعذر إقفال السنة المالية',
        message: result.message,
        type: 'error',
        confirmText: 'حسناً',
      });
    }
  };

  // Handle Reopen Fiscal Year
  const handleReopen = () => {
    if (!activeFiscalYear) return;

    showConfirm(
      {
        title: `إعادة فتح السنة المالية ${activeFiscalYear.year}`,
        message:
          'هل أنت متأكد من رغبتك في إعادة فتح هذه السنة المالية؟ سيتم إلغاء قيود الإقفال والقيد الافتتاحي وتفعيل التعديل على الحركات المحاسبية.',
        type: 'warning',
        confirmText: 'نعم، أعد فتح السنة المالية',
        cancelText: 'تراجع',
      },
      () => {
        const res = reopenFiscalYear(activeFiscalYear.id);
        if (res.success) {
          showAlert({
            title: 'تمت العملية',
            message: res.message,
            type: 'success',
          });
        } else {
          showAlert({
            title: 'خطأ',
            message: res.message,
            type: 'error',
          });
        }
      }
    );
  };

  // Toggle all periods lock
  const handleToggleAllPeriods = (lock: boolean) => {
    if (!activeFiscalYear) return;
    activeFiscalYear.periods.forEach((p) => {
      if (p.isLocked !== lock) {
        toggleLockFiscalPeriod(activeFiscalYear.id, p.id);
      }
    });
    showAlert({
      title: lock ? 'تم قفل جميع الفترات' : 'تم فك قفل جميع الفترات',
      message: lock
        ? 'تم قفل الفترات لمنع إدخال أو تعديل القيود المحاسبية فيها.'
        : 'تم فك قفل جميع الفترات المالية للسنة المحددة.',
      type: 'info',
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Primary Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900">
                  إقفال الفترات والسنوات المالية (Fiscal Year Closing)
                </h1>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
                  معايير المحاسبة الدولية
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                إقفال الحسابات الاسمية (الإيرادات والمصروفات)، ترحيل الأرباح والخسائر للأرباح المحتجزة، توليد القيد الافتتاحي آلياً وقفل الفترات.
              </p>
            </div>
          </div>

          {/* Year Switcher & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <label htmlFor="select-fiscal-year" className="text-xs font-bold text-slate-600">السنة المالية:</label>
              <select
                id="select-fiscal-year"
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {fiscalYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>
                    {fy.name} ({fy.status === 'closed' ? 'مقفلة ومعتمدة' : 'مفتوحة'})
                  </option>
                ))}
              </select>
            </div>

            {activeFiscalYear?.status === 'open' ? (
              <button
                type="button"
                id="btn-open-closing-modal"
                onClick={() => setShowClosingModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Lock className="w-4 h-4" />
                إقفال السنة المالية وترحيل الأرباح
              </button>
            ) : (
              <button
                type="button"
                id="btn-reopen-fiscal-year"
                onClick={handleReopen}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة فتح السنة المالية
              </button>
            )}
          </div>
        </div>

        {/* 2. Fiscal Year Status & Financial Highlights */}
        {activeFiscalYear && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Status & Dates */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-500 text-xs font-semibold">حالة السنة المالية</span>
                  {activeFiscalYear.status === 'closed' ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      مقفلة ومعتمدة
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                      <Clock className="w-3 h-3" />
                      فترة مفتوحة للعمليات
                    </span>
                  )}
                </div>
                <div className="text-sm font-black text-slate-800 mt-1">
                  من {activeFiscalYear.startDate} إلى {activeFiscalYear.endDate}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {lockedCount} من أصل {totalPeriodsCount} فترة مقفلة
                </span>
              </div>

              {/* Total Revenues */}
              <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-100/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-emerald-800 text-xs font-bold">إجمالي الإيرادات المكتسبة</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-black text-emerald-700">
                  {formatMoney(
                    activeFiscalYear.status === 'closed' && activeFiscalYear.totalRevenueClosed !== undefined
                      ? activeFiscalYear.totalRevenueClosed
                      : financialSummary.totalRevenue
                  )}
                </div>
                <span className="text-[11px] text-emerald-600/80 mt-1 block">
                  تُقفل بجعل حسابات الإيرادات مدينة
                </span>
              </div>

              {/* Total Expenses */}
              <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-100/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-rose-800 text-xs font-bold">إجمالي المصروفات المحملة</span>
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-lg font-black text-rose-700">
                  {formatMoney(
                    activeFiscalYear.status === 'closed' && activeFiscalYear.totalExpenseClosed !== undefined
                      ? activeFiscalYear.totalExpenseClosed
                      : financialSummary.totalExpense
                  )}
                </div>
                <span className="text-[11px] text-rose-600/80 mt-1 block">
                  تُقفل بجعل حسابات المصروفات دائنة
                </span>
              </div>

              {/* Net Income */}
              <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-indigo-900 text-xs font-bold">صافي الدخل المرحل</span>
                  <Scale className="w-4 h-4 text-indigo-600" />
                </div>
                <div
                  className={`text-lg font-black ${
                    (activeFiscalYear.status === 'closed'
                      ? activeFiscalYear.netIncomeBeforeClosing || 0
                      : financialSummary.netIncome) >= 0
                      ? 'text-indigo-800'
                      : 'text-rose-600'
                  }`}
                >
                  {formatMoney(
                    activeFiscalYear.status === 'closed' && activeFiscalYear.netIncomeBeforeClosing !== undefined
                      ? activeFiscalYear.netIncomeBeforeClosing
                      : financialSummary.netIncome
                  )}
                </div>
                <span className="text-[11px] text-indigo-700/80 mt-1 block">
                  {(activeFiscalYear.status === 'closed'
                    ? activeFiscalYear.netIncomeBeforeClosing || 0
                    : financialSummary.netIncome) >= 0
                    ? 'صافي ربح مرحل للأرباح المحتجزة'
                    : 'صافي خسارة مرحلة لحقوق الملكية'}
                </span>
              </div>
            </div>

            {/* If Closed: Display generated closing & opening entries */}
            {activeFiscalYear.status === 'closed' && (
              <div className="mt-4 bg-emerald-50 rounded-2xl p-4 border border-emerald-200/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-emerald-950">
                      تم اعتماد وإقفال السنة المالية {activeFiscalYear.year} بواسطة {activeFiscalYear.closedBy}
                    </h2>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      تاريخ الإقفال:{' '}
                      {activeFiscalYear.closedAt ? new Date(activeFiscalYear.closedAt).toLocaleDateString('ar-EG') : '—'} | تم
                      تصفير الإيرادات والمصروفات وترحيل الرصيد إلى{' '}
                      <strong>{retainedEarningsAccount?.name || 'الأرباح المحتجزة'}</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeFiscalYear.closingJournalEntryNumber && (
                    <button
                      type="button"
                      onClick={() => navigateTo('accounts', 'journal')}
                      className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      قيد الإقفال ({activeFiscalYear.closingJournalEntryNumber})
                    </button>
                  )}
                  {activeFiscalYear.openingJournalEntryNumber && (
                    <button
                      type="button"
                      onClick={() => navigateTo('accounts', 'journal')}
                      className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      القيد الافتتاحي ({activeFiscalYear.openingJournalEntryNumber})
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Monthly Periods Control Table (قفل الفترات الشهرية) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-slate-900 text-sm">
                الفترات المالية الشهرية لعام {activeFiscalYear?.year}
              </h2>
              <span className="text-[11px] bg-slate-200/70 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                12 فترة محاسبية
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              قفل الفترات يمنع إضافة أو تعديل أو حذف أي قيود يومية أو فواتير تقع تواريخها ضمن الفترة المقفلة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  periodFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الكل ({activeFiscalYear?.periods.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('locked')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  periodFilter === 'locked' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                مقفلة ({lockedCount})
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('open')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  periodFilter === 'open' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                مفتوحة ({totalPeriodsCount - lockedCount})
              </button>
            </div>

            {/* Batch toggle */}
            <button
              type="button"
              onClick={() => handleToggleAllPeriods(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <Lock className="w-3.5 h-3.5" />
              قفل الكل
            </button>
            <button
              type="button"
              onClick={() => handleToggleAllPeriods(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-200"
            >
              <Unlock className="w-3.5 h-3.5" />
              فتح الكل
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
              <tr>
                <th className="p-4">رقم الفترة</th>
                <th className="p-4">اسم الفترة المحاسبية</th>
                <th className="p-4">النطاق الزمني</th>
                <th className="p-4">حالة القفل</th>
                <th className="p-4">مسؤول الإقفال</th>
                <th className="p-4">تاريخ ووقت الإقفال</th>
                <th className="p-4 text-center">إجراء التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPeriods.map((period) => {
                return (
                  <tr
                    key={period.id}
                    className={`transition-colors ${
                      period.isLocked ? 'bg-slate-50/40 hover:bg-slate-100/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="p-4 font-mono font-bold text-slate-700">
                      #{period.periodNumber.toString().padStart(2, '0')}
                    </td>
                    <td className="p-4">
                      <div className="font-black text-slate-900">{period.name}</div>
                      <span className="text-[11px] text-slate-400">{period.quarter}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {period.startDate} ⬅️ {period.endDate}
                    </td>
                    <td className="p-4">
                      {period.isLocked ? (
                        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                          <Lock className="w-3 h-3 text-rose-500" />
                          مقفلة (حركات ممنوعة)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                          <Unlock className="w-3 h-3 text-emerald-500" />
                          مفتوحة للعمليات
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {period.lockedBy || '—'}
                    </td>
                    <td className="p-4 font-mono text-slate-500 text-[11px]">
                      {period.lockedAt ? new Date(period.lockedAt).toLocaleString('ar-EG') : '—'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        id={`btn-toggle-period-${period.id}`}
                        onClick={() => toggleLockFiscalPeriod(activeFiscalYear.id, period.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 mx-auto cursor-pointer transition-all ${
                          period.isLocked
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {period.isLocked ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            فك قفل الفترة
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            قفل الفترة
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: Close Fiscal Year Confirmation & Preview */}
      {showClosingModal && activeFiscalYear && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">إقفال السنة المالية {activeFiscalYear.year} وتوليد القيد الافتتاحي</h3>
                  <p className="text-xs text-indigo-100 mt-0.5">
                    سيتم تصفير حسابات الإيرادات والمصروفات وترحيل الفارق إلى الأرباح المحتجزة.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClosingModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-slate-800 text-xs">
              {/* Alert notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">تنبيه تدقيقي قبل الإقفال</h4>
                  <p className="mt-0.5 leading-relaxed text-[11px] text-amber-800">
                    بمجرد تنفيذ الإقفال، سيتم توليد قيد إقفال برقم{' '}
                    <strong>JE-CLOSE-{activeFiscalYear.year}</strong>، وقفل جميع الفترات الـ 12 تلقائياً لمنع أي تلاعب أو تعديل في الحركات القديمة، وتوليد القيد الافتتاحي{' '}
                    <strong>JE-OPEN-{activeFiscalYear.year + 1}</strong> للعام الجديد.
                  </p>
                </div>
              </div>

              {/* Summary Calculations */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <h4 className="font-black text-slate-900 text-xs border-b border-slate-200 pb-2">
                  بيانات وأثر الإقفال المالي للسنة:
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block">إجمالي الإيرادات (تُقفل مدينة):</span>
                    <span className="font-black text-emerald-600 text-sm">
                      {formatMoney(financialSummary.totalRevenue)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">إجمالي المصروفات (تُقفل دائنة):</span>
                    <span className="font-black text-rose-600 text-sm">
                      {formatMoney(financialSummary.totalExpense)}
                    </span>
                  </div>

                  <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-slate-700 font-bold">
                      صافي النتيجة المرحّلة (
                      {financialSummary.netIncome >= 0 ? 'أرباح صافية' : 'خسائر صافية'}):
                    </span>
                    <span
                      className={`font-black text-base ${
                        financialSummary.netIncome >= 0 ? 'text-indigo-700' : 'text-rose-600'
                      }`}
                    >
                      {formatMoney(financialSummary.netIncome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Retained Earnings Destination Account Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  حساب ترحيل الأرباح المحتجزة / أرباح وخسائر المرحلة:
                </label>
                <select
                  value={selectedRetainedAccId}
                  onChange={(e) => setSelectedRetainedAccId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  {accounts
                    .filter((a) => a.type === 'equity')
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name} (رصيد حالي: {formatMoney(acc.balance)})
                      </option>
                    ))}
                </select>
                <span className="text-[11px] text-slate-400 block">
                  يتم توجيه صافي الفارق الدائن أو المدين إلى هذا الحساب في الميزانية العمومية.
                </span>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">ملاحظات ومصادقة الإقفال:</label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="ملاحظات المراجع القانوني أو سبب اعتماد القوائم المالية..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowClosingModal(false)}
                className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                id="btn-confirm-execute-closing"
                onClick={handleExecuteClosing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Lock className="w-4 h-4" />
                تأكيد واعتماد إقفال السنة المالية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
