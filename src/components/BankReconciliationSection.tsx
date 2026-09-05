import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import {
  BankReconciliationStatement,
  BankReconciliationItem,
  BankReconciliationAdjustment,
  Account,
} from '../types';
import {
  Landmark,
  PlusCircle,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  FileCheck2,
  Trash2,
  Printer,
  Building,
  Calendar,
  DollarSign,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Plus,
  ArrowRight,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export const BankReconciliationSection: React.FC = () => {
  const {
    bankReconciliations,
    addBankReconciliation,
    updateBankReconciliation,
    completeBankReconciliation,
    deleteBankReconciliation,
    addReconciliationAdjustment,
    toggleReconciliationItemCleared,
    accounts,
    journalEntries,
    currency,
    formatMoney,
    showAlert,
    showConfirm,
  } = useErp();

  // Active Session State
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(() => {
    return bankReconciliations.length > 0 ? bankReconciliations[0].id : null;
  });

  // Modals
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // New Session Form State
  const [newBankAccountId, setNewBankAccountId] = useState('');
  const [newStatementNumber, setNewStatementNumber] = useState(
    () => `BRS-${new Date().getFullYear()}-${String(bankReconciliations.length + 1).padStart(3, '0')}`
  );
  const [newStartDate, setNewStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [newEndDate, setNewEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStatementEndingBalance, setNewStatementEndingBalance] = useState<number | ''>('');

  // New Adjustment Form State
  const [adjType, setAdjType] = useState<'bank_charge' | 'interest' | 'adjustment'>('bank_charge');
  const [adjAmount, setAdjAmount] = useState<number | ''>('');
  const [adjDescription, setAdjDescription] = useState('عمولة ومصروفات مسك حساب وكشوفات بنكية');
  const [adjDate, setAdjDate] = useState(new Date().toISOString().split('T')[0]);

  // Bank Accounts Filter
  const bankAccounts = useMemo(() => {
    return accounts.filter(
      (a) =>
        !a.isHeader &&
        (a.code.startsWith('112') || a.name.includes('بنك') || a.name.toLowerCase().includes('bank'))
    );
  }, [accounts]);

  // Set default bank account for new session modal
  React.useEffect(() => {
    if (bankAccounts.length > 0 && !newBankAccountId) {
      setNewBankAccountId(bankAccounts[0].id);
    }
  }, [bankAccounts, newBankAccountId]);

  // Selected Active Statement
  const activeStatement = useMemo(() => {
    if (!selectedStatementId) return null;
    return bankReconciliations.find((s) => s.id === selectedStatementId) || null;
  }, [bankReconciliations, selectedStatementId]);

  // Handle Creating New Reconciliation Session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const bankAcc = bankAccounts.find((b) => b.id === newBankAccountId) || bankAccounts[0];
    if (!bankAcc) {
      showAlert({
        title: 'لا يوجد حساب بنكي',
        message: 'يرجى التأكد من وجود حساب بنكي مسجل في شجرة ودليل الحسابات.',
        type: 'error',
      });
      return;
    }

    if (newStatementEndingBalance === '' || isNaN(Number(newStatementEndingBalance))) {
      showAlert({
        title: 'الرصيد مطلوب',
        message: 'يرجى إدخال الرصيد الختامي الظاهر في كشف حساب البنك بدقة.',
        type: 'warning',
      });
      return;
    }

    // Pull journal entry lines related to this bank account within or up to this period
    const relevantBankLines: BankReconciliationItem[] = [];
    journalEntries.forEach((entry) => {
      entry.lines.forEach((line, idx) => {
        if (line.accountId === bankAcc.id || line.accountCode === bankAcc.code) {
          relevantBankLines.push({
            id: `item-${entry.id}-${idx}`,
            journalEntryId: entry.id,
            journalLineId: `line-${idx}`,
            date: entry.date,
            description: line.description || entry.description,
            reference: entry.reference || entry.entryNumber,
            debit: line.debit,
            credit: line.credit,
            isCleared: false,
          });
        }
      });
    });

    // If no transactions found yet, provide starter sample transactions for immediate usability
    if (relevantBankLines.length === 0) {
      relevantBankLines.push(
        {
          id: `item-init-1`,
          journalEntryId: 'init-1',
          journalLineId: 'line-0',
          date: newStartDate,
          description: 'إيداع نقدي بالبنك من المبيعات',
          reference: 'DEP-8812',
          debit: 35000,
          credit: 0,
          isCleared: true,
          clearedDate: newStartDate,
        },
        {
          id: `item-init-2`,
          journalEntryId: 'init-2',
          journalLineId: 'line-1',
          date: newEndDate,
          description: 'سداد تحويل بنكي لمورد أجهزة ومعدات',
          reference: 'TRF-5019',
          debit: 0,
          credit: 15000,
          isCleared: false,
        }
      );
    }

    const createdId = addBankReconciliation({
      statementNumber: newStatementNumber.trim(),
      bankAccountId: bankAcc.id,
      bankAccountCode: bankAcc.code,
      bankAccountName: bankAcc.name,
      statementDate: newEndDate,
      periodStart: newStartDate,
      periodEnd: newEndDate,
      bookOpeningBalance: bankAcc.currentBalance || 250000,
      statementEndingBalance: Number(newStatementEndingBalance),
      status: 'in_progress',
      items: relevantBankLines,
      adjustments: [],
    });

    setSelectedStatementId(createdId);
    setShowNewSessionModal(false);
    showAlert({
      title: 'تم بدء جلسة التسوية البنكية',
      message: `تم إنشاء مذكرة التسوية ${newStatementNumber} بنجاح. يمكنك الآن مراجعة ومطابقة الحركات مع كشف حساب البنك.`,
      type: 'success',
    });
  };

  // Handle Add Adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStatement || !adjAmount || Number(adjAmount) <= 0) {
      showAlert({
        title: 'مبلغ التسوية غير صحيح',
        message: 'يرجى إدخال مبلغ صحيح للتسوية البنكية.',
        type: 'warning',
      });
      return;
    }

    addReconciliationAdjustment(activeStatement.id, {
      date: adjDate,
      type: adjType,
      description: adjDescription.trim(),
      amount: Number(adjAmount),
    });

    setShowAdjustmentModal(false);
    setAdjAmount('');
    showAlert({
      title: 'تم تسجيل التسوية البنكية',
      message:
        adjType === 'bank_charge'
          ? 'تم تسجيل المصروفات البنكية وإصدار قيد يومية فوري يثبت الخصم من البنك.'
          : 'تمت إضافة التسوية وتحديث رصيد المذكرة.',
      type: 'success',
    });
  };

  // Toggle all items cleared or uncleared
  const handleToggleAllItems = (cleared: boolean) => {
    if (!activeStatement) return;
    const nowStr = new Date().toISOString().split('T')[0];
    const updatedItems = activeStatement.items.map((item) => ({
      ...item,
      isCleared: cleared,
      clearedDate: cleared ? nowStr : undefined,
    }));
    updateBankReconciliation(activeStatement.id, { items: updatedItems });
  };

  // Calculations for Active Statement
  const statementMetrics = useMemo(() => {
    if (!activeStatement) {
      return {
        clearedDeposits: 0,
        clearedWithdrawals: 0,
        unclearedDeposits: 0,
        unclearedWithdrawals: 0,
        totalAdjustments: 0,
        adjustedBookBalance: 0,
        difference: 0,
        isMatched: false,
      };
    }

    const clearedDeposits = activeStatement.items
      .filter((i) => i.isCleared)
      .reduce((sum, i) => sum + i.debit, 0);

    const clearedWithdrawals = activeStatement.items
      .filter((i) => i.isCleared)
      .reduce((sum, i) => sum + i.credit, 0);

    const unclearedDeposits = activeStatement.items
      .filter((i) => !i.isCleared)
      .reduce((sum, i) => sum + i.debit, 0);

    const unclearedWithdrawals = activeStatement.items
      .filter((i) => !i.isCleared)
      .reduce((sum, i) => sum + i.credit, 0);

    // Adjustments to books (charges decrease, interest increases)
    const totalAdjustments = activeStatement.adjustments.reduce((sum, a) => {
      if (a.type === 'bank_charge') return sum - a.amount;
      if (a.type === 'interest') return sum + a.amount;
      return sum;
    }, 0);

    // Cleared Book Balance = Statement Ending Balance + Uncleared Deposits - Uncleared Withdrawals
    // Or Book balance adjusted
    const bookBalance = activeStatement.bookOpeningBalance + clearedDeposits - clearedWithdrawals + totalAdjustments;
    const difference = Math.round((activeStatement.statementEndingBalance - bookBalance) * 100) / 100;
    const isMatched = Math.abs(difference) < 0.01;

    return {
      clearedDeposits,
      clearedWithdrawals,
      unclearedDeposits,
      unclearedWithdrawals,
      totalAdjustments,
      adjustedBookBalance: bookBalance,
      difference,
      isMatched,
    };
  }, [activeStatement]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Primary Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  التسوية البنكية ومطابقة كشوف الحساب (Bank Reconciliation)
                </h1>
                <span className="text-xs bg-teal-50 text-teal-700 font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
                  رقابة مالية وتدقيق
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                مطابقة رصيد دفاتر الشركة المحاسبية مع كشف الحساب البنكي الفعلي، ومعالجة الشيكات العالقة والعمولات البنكية والفروقات.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-new-bank-reconciliation"
              onClick={() => setShowNewSessionModal(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              جلسة تسوية بنكية جديدة
            </button>
          </div>
        </div>

        {/* Sessions Bar */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 shrink-0">جلسات التسوية:</span>
          {bankReconciliations.length === 0 ? (
            <span className="text-xs text-slate-400">لا توجد جلسات مسجلة حالياً. انقر على جلسة جديدة لبدء المطابقة.</span>
          ) : (
            bankReconciliations.map((stmt) => {
              const isSelected = stmt.id === selectedStatementId;
              return (
                <button
                  key={stmt.id}
                  type="button"
                  onClick={() => setSelectedStatementId(stmt.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{stmt.statementNumber}</span>
                  <span className="text-[10px] opacity-75 font-normal">({stmt.bankAccountName.split(' ')[0]})</span>
                  {stmt.status === 'completed' ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ACTIVE RECONCILIATION WORKSPACE */}
      {activeStatement ? (
        <div className="space-y-6">
          {/* Statement Overview & Metrics Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">
                    مذكرة تسوية رقم: {activeStatement.statementNumber}
                  </h2>
                  {activeStatement.status === 'completed' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      مكتملة ومطابقة ومعتمدة
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      جلسة نشطة قيد المطابقة
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {activeStatement.bankAccountName} ({activeStatement.bankAccountCode})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    الفترة: من {activeStatement.periodStart} إلى {activeStatement.periodEnd}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Active Statement */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  طباعة مذكرة التسوية
                </button>

                {activeStatement.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!statementMetrics.isMatched) {
                        showConfirm(
                          `يوجد فارق غير مطابق بمقدار (${formatMoney(statementMetrics.difference)}). هل أنت متأكد من رغبتك في إقفال واعتماد التسوية البنكية رغم وجود الفارق؟`,
                          () => completeBankReconciliation(activeStatement.id),
                          'اعتماد التسوية بوجود فارق',
                          'تأكيد الاعتماد'
                        );
                      } else {
                        completeBankReconciliation(activeStatement.id);
                        showAlert({
                          title: 'تم اعتماد التسوية البنكية بنجاح',
                          message: `تم إقفال مذكرة التسوية ${activeStatement.statementNumber} بنجاح بتطابق تام (الفارق: 0.00).`,
                          type: 'success',
                        });
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    اعتماد وإقفال التسوية
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    showConfirm(
                      `هل أنت متأكد من حذف جلسة التسوية "${activeStatement.statementNumber}"؟`,
                      () => {
                        deleteBankReconciliation(activeStatement.id);
                        setSelectedStatementId(null);
                      },
                      'حذف جلسة تسوية',
                      'حذف'
                    );
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="حذف الجلسة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Balances Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {/* 1. Statement Ending Balance */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <span className="text-slate-400 text-xs font-bold block mb-1">
                  رصيد كشف حساب البنك الفعلي
                </span>
                <span className="text-xl font-black text-slate-900 block">
                  {formatMoney(activeStatement.statementEndingBalance)}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  كما ورد في كشف حساب البنك
                </span>
              </div>

              {/* 2. Cleared Transactions */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <span className="text-slate-400 text-xs font-bold block mb-1">
                  الحركات المطابقة بالكشف
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-700 font-bold">
                    + إيداعات: {formatMoney(statementMetrics.clearedDeposits)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-rose-700 font-bold">
                    - مسحوبات: {formatMoney(statementMetrics.clearedWithdrawals)}
                  </span>
                </div>
              </div>

              {/* 3. Adjusted Book Balance */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <span className="text-slate-400 text-xs font-bold block mb-1">
                  الرصيد الدفتري بعد التسوية
                </span>
                <span className="text-xl font-black text-teal-700 block">
                  {formatMoney(statementMetrics.adjustedBookBalance)}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  شامل الحركات المطابقة والتسويات
                </span>
              </div>

              {/* 4. Matching Status & Difference */}
              <div
                className={`rounded-2xl p-4 border transition-all ${
                  statementMetrics.isMatched
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">
                    {statementMetrics.isMatched ? 'المطابقة الدفترية' : 'فارق غير مطابق'}
                  </span>
                  {statementMetrics.isMatched ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                </div>
                <span className="text-xl font-black block">
                  {formatMoney(Math.abs(statementMetrics.difference))}
                </span>
                <span className="text-[11px] font-bold block mt-1">
                  {statementMetrics.isMatched
                    ? 'متطابق تماماً مع كشف البنك'
                    : 'يوجد عدم تطابق بحاجة لمراجعة البنود'}
                </span>
              </div>
            </div>
          </div>

          {/* TWO COLUMNS: Transactions Matching Table (Left) & Adjustments (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMN 1: Transactions Checklist Table (2 Cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      حركات البنك الدفترية للتدقيق والمطابقة
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      حدد الحركات التي ظهرت فعلياً في كشف حساب البنك لاعتماد مطابقتها
                    </p>
                  </div>

                  {activeStatement.status !== 'completed' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAllItems(true)}
                        className="text-xs text-teal-700 bg-teal-50 hover:bg-teal-100 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        مطابقة الكل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAllItems(false)}
                        className="text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        إلغاء مطابقة الكل
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-right text-xs">
                    <thead className="text-slate-400 font-bold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-2 text-center w-12">مطابقة</th>
                        <th className="py-3 px-3">التاريخ</th>
                        <th className="py-3 px-3">البيان والتفاصيل</th>
                        <th className="py-3 px-3">المرجع</th>
                        <th className="py-3 px-3 text-left">مدين (إيداع)</th>
                        <th className="py-3 px-3 text-left">دائن (سحب)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {activeStatement.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            لا توجد حركات مسجلة لهذا الحساب في هذه الفترة
                          </td>
                        </tr>
                      ) : (
                        activeStatement.items.map((item) => (
                          <tr
                            key={item.id}
                            className={`transition-colors cursor-pointer ${
                              item.isCleared ? 'bg-teal-50/40 hover:bg-teal-50/70' : 'hover:bg-slate-50'
                            }`}
                            onClick={() => {
                              if (activeStatement.status !== 'completed') {
                                toggleReconciliationItemCleared(activeStatement.id, item.id);
                              }
                            }}
                          >
                            <td className="py-3 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.isCleared}
                                disabled={activeStatement.status === 'completed'}
                                onChange={() => {
                                  if (activeStatement.status !== 'completed') {
                                    toggleReconciliationItemCleared(activeStatement.id, item.id);
                                  }
                                }}
                                className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap text-slate-500">{item.date}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">{item.description}</td>
                            <td className="py-3 px-3 font-mono text-slate-500">{item.reference || '-'}</td>
                            <td className="py-3 px-3 text-left font-black text-emerald-600 whitespace-nowrap">
                              {item.debit > 0 ? formatMoney(item.debit) : '-'}
                            </td>
                            <td className="py-3 px-3 text-left font-black text-rose-600 whitespace-nowrap">
                              {item.credit > 0 ? formatMoney(item.credit) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Adjustments & Bank Charges (1 Col) */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      التسويات والعمولات البنكية
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">مصروفات وعمولات ظهرت بالكشف ولم تسجل</p>
                  </div>
                  {activeStatement.status !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => setShowAdjustmentModal(true)}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-700 p-1.5 rounded-xl cursor-pointer transition-colors"
                      title="إضافة عمولة أو تسوية بنكية"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 mt-3">
                  {activeStatement.adjustments.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <Percent className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>لا توجد تسويات أو عمولات مسجلة لهذه المذكرة.</p>
                      {activeStatement.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => setShowAdjustmentModal(true)}
                          className="mt-2 text-teal-600 font-bold underline cursor-pointer"
                        >
                          + إضافة عمولة بنكية
                        </button>
                      )}
                    </div>
                  ) : (
                    activeStatement.adjustments.map((adj) => (
                      <div
                        key={adj.id}
                        className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{adj.description}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {adj.date} • {adj.type === 'bank_charge' ? 'مصروفات بنكية' : 'فوائد / تسوية'}
                          </span>
                        </div>
                        <span
                          className={`font-black ${
                            adj.type === 'bank_charge' ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {adj.type === 'bank_charge' ? '-' : '+'}
                          {formatMoney(adj.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Outstanding Summary Card */}
              <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xs">
                <h4 className="text-xs font-black mb-3 text-slate-200">ملخص البنود العالقة بالطريق (In Transit)</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">إيداعات بالطريق لم تقيد بالبنك:</span>
                    <span className="font-bold text-emerald-400">
                      {formatMoney(statementMetrics.unclearedDeposits)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">شيكات ومسحوبات صادرة لم تصرف:</span>
                    <span className="font-bold text-rose-400">
                      {formatMoney(statementMetrics.unclearedWithdrawals)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400 font-bold">صافي الأثر على الرصيد:</span>
                    <span className="font-black text-amber-300">
                      {formatMoney(statementMetrics.unclearedDeposits - statementMetrics.unclearedWithdrawals)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
          <Landmark className="w-12 h-12 mx-auto mb-3 opacity-30 text-teal-600" />
          <h3 className="text-base font-bold text-slate-700">لا توجد جلسة تسوية بنكية مختارة</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            قم بإنشاء جلسة تسوية بنكية جديدة لمطابقة كشف حساب بنكك مع السجلات والدفاتر المحاسبية.
          </p>
          <button
            type="button"
            onClick={() => setShowNewSessionModal(true)}
            className="mt-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            بدء جلسة تسوية جديدة
          </button>
        </div>
      )}

      {/* MODAL 1: NEW RECONCILIATION SESSION MODAL */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    بدء جلسة تسوية بنكية جديدة
                  </h3>
                  <p className="text-xs text-slate-500">إدخال بيانات كشف حساب البنك للفترة المحددة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewSessionModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 mt-4">
              {/* Statement Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم مذكرة التسوية *</label>
                <input
                  type="text"
                  required
                  value={newStatementNumber}
                  onChange={(e) => setNewStatementNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              {/* Bank Account Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الحساب البنكي المراد تسويته *</label>
                <select
                  value={newBankAccountId}
                  onChange={(e) => setNewBankAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-500 cursor-pointer"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) - الرصيد الحالي: {formatMoney(b.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ بداية الفترة *</label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ نهاية الفترة والكشف *</label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Statement Ending Balance */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرصيد الختامي الظاهر بكشف حساب البنك ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newStatementEndingBalance}
                  onChange={(e) =>
                    setNewStatementEndingBalance(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="مثال: 270000.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  هذا هو الرصيد الفعلي في نهاية الكشف الصادر عن البنك والمطلوب الوصول إليه بالتسوية.
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs"
                >
                  إنشاء ومطابقة الكشف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD ADJUSTMENT / BANK CHARGE */}
      {showAdjustmentModal && activeStatement && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">إضافة تسوية أو عمولة بنكية</h3>
                  <p className="text-xs text-slate-500">{activeStatement.statementNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustmentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3.5 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع التسوية *</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-500 cursor-pointer"
                >
                  <option value="bank_charge">مصروفات وعمولات بنكية (Bank Charges) - خصم</option>
                  <option value="interest">إيراد فوائد بنكية دائنة (Interest Earned) - إضافة</option>
                  <option value="adjustment">تسوية خطأ أو فرق تقريب محاسبي</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ ({currency}) *</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ *</label>
                <input
                  type="date"
                  required
                  value={adjDate}
                  onChange={(e) => setAdjDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البيان والوصف *</label>
                <input
                  type="text"
                  required
                  value={adjDescription}
                  onChange={(e) => setAdjDescription(e.target.value)}
                  placeholder="بيان العمولة أو التسوية..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-teal-500"
                />
              </div>

              {adjType === 'bank_charge' && (
                <div className="bg-teal-50/50 p-2.5 rounded-xl text-[11px] text-teal-800 border border-teal-100">
                  سيتم إنشاء قيد يومية آلي يثبت الخصم: من ح/ المصروفات البنكية (5700) إلى ح/ البنك.
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ التسوية وقيدها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINT RECONCILIATION STATEMENT */}
      {showPrintModal && activeStatement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  مذكرة التسوية البنكية الرسمية (Bank Reconciliation Statement)
                </h3>
                <p className="text-xs text-slate-500">
                  كشف مطابقة معتمد لرقم: {activeStatement.statementNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Body */}
            <div className="my-6 space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-bold">اسم الحساب البنكي:</span>
                  <span className="font-bold text-slate-900">{activeStatement.bankAccountName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">رمز الحساب:</span>
                  <span className="font-mono font-bold text-slate-900">{activeStatement.bankAccountCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">تاريخ نهاية الفترة:</span>
                  <span>{activeStatement.periodEnd}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">حالة المذكرة:</span>
                  <span className="font-bold text-emerald-700">
                    {activeStatement.status === 'completed' ? 'معتمدة ومقفلة' : 'قيد المراجعة والمطابقة'}
                  </span>
                </div>
              </div>

              {/* Table of Reconciliation Calculations */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-slate-50/80 font-bold">
                      <td className="p-3">رصيد كشف الحساب الوارد من البنك في {activeStatement.periodEnd}</td>
                      <td className="p-3 text-left font-black text-slate-900">
                        {formatMoney(activeStatement.statementEndingBalance)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 pr-6 text-emerald-700">
                        + يضاف: إيداعات نقدية وشيكات بالطريق لم تسجل بكشف البنك
                      </td>
                      <td className="p-3 text-left font-bold text-emerald-700">
                        {formatMoney(statementMetrics.unclearedDeposits)}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 pr-6 text-rose-700">
                        - يخصم: شيكات مسحوبة صادرة لم يتقدم أصحابها لصرفها من البنك
                      </td>
                      <td className="p-3 text-left font-bold text-rose-700">
                        ({formatMoney(statementMetrics.unclearedWithdrawals)})
                      </td>
                    </tr>
                    <tr className="bg-teal-50 font-bold text-teal-900 border-t border-teal-200">
                      <td className="p-3">الرصيد الدفتري المطابق والمعدل</td>
                      <td className="p-3 text-left font-black text-base text-teal-900">
                        {formatMoney(statementMetrics.adjustedBookBalance)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold text-slate-700">
                      <td className="p-3">فارق عدم المطابقة النهائي</td>
                      <td className="p-3 text-left font-black">
                        {formatMoney(statementMetrics.difference)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div className="border-t border-slate-300 pt-3">
                  <span className="font-bold text-slate-700 block">إعداد المحاسب المسؤول</span>
                  <span className="text-slate-400 text-[11px] block mt-1">التوقيع والتاريخ</span>
                </div>
                <div className="border-t border-slate-300 pt-3">
                  <span className="font-bold text-slate-700 block">اعتماد المدير المالي</span>
                  <span className="text-slate-400 text-[11px] block mt-1">التوقيع والختم</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                طباعة المذكرة (A4)
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
