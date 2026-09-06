import React, { useState, useMemo } from 'react';
import {
  PieChart,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Scale,
  Calendar,
  Layers,
  Search,
  Filter,
  Trash2,
  Edit3,
  X,
  Plus,
  Building2,
  Percent,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { BudgetPlan, BudgetItem } from '../types';

export const BudgetsSection: React.FC = () => {
  const {
    budgetPlans = [],
    accounts = [],
    costCenters = [],
    journalEntries = [],
    addBudgetPlan,
    updateBudgetPlan,
    deleteBudgetPlan,
    getBudgetVsActual,
    currency,
    formatMoney,
    showAlert,
    showConfirm,
  } = useErp();

  // Active filter state
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(() => {
    const currentYear = new Date().getFullYear();
    const hasCurrent = budgetPlans.some((b) => b.fiscalYear === currentYear);
    return hasCurrent ? currentYear : budgetPlans[0]?.fiscalYear || 2025;
  });

  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = Annual (كل العام)
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'over' | 'warning' | 'normal'>('all');

  // Modal State for New / Edit Budget Plan
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [planYear, setPlanYear] = useState<number>(new Date().getFullYear());
  const [planCostCenterId, setPlanCostCenterId] = useState<string>('');
  const [planNotes, setPlanNotes] = useState('');
  const [planItems, setPlanItems] = useState<
    Array<{
      accountId: string;
      accountCode: string;
      accountName: string;
      annualAmount: number;
      alertThresholdPercent: number;
    }>
  >([]);

  // Compute live budget vs actual metrics using context helper
  const comparisonData = useMemo(() => {
    return getBudgetVsActual(
      selectedFiscalYear,
      selectedMonth > 0 ? selectedMonth : undefined,
      selectedCostCenterId !== 'all' ? selectedCostCenterId : undefined
    );
  }, [getBudgetVsActual, selectedFiscalYear, selectedMonth, selectedCostCenterId, budgetPlans, journalEntries]);

  // Filtered comparison items based on search and status
  const filteredItems = useMemo(() => {
    return comparisonData.items.filter((item) => {
      const matchSearch =
        item.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.accountCode.includes(searchQuery);

      let matchStatus = true;
      if (statusFilter === 'over') {
        matchStatus = item.isOverBudget;
      } else if (statusFilter === 'warning') {
        matchStatus = !item.isOverBudget && item.variancePercent >= 85;
      } else if (statusFilter === 'normal') {
        matchStatus = item.variancePercent < 85;
      }

      return matchSearch && matchStatus;
    });
  }, [comparisonData.items, searchQuery, statusFilter]);

  // Overall consumption percentage
  const totalConsumptionPercent =
    comparisonData.totalBudget > 0
      ? (comparisonData.totalActual / comparisonData.totalBudget) * 100
      : 0;

  // Expense accounts available for budgeting
  const expenseAccounts = useMemo(() => {
    return accounts.filter((a) => a.type === 'expense' && !a.isHeader);
  }, [accounts]);

  // Months labels
  const months = [
    { num: 1, name: 'يناير' },
    { num: 2, name: 'فبراير' },
    { num: 3, name: 'مارس' },
    { num: 4, name: 'أبريل' },
    { num: 5, name: 'مايو' },
    { num: 6, name: 'يونيو' },
    { num: 7, name: 'يوليو' },
    { num: 8, name: 'أغسطس' },
    { num: 9, name: 'سبتمبر' },
    { num: 10, name: 'أكتوبر' },
    { num: 11, name: 'نوفمبر' },
    { num: 12, name: 'ديسمبر' },
  ];

  // Open Create Budget Plan Modal
  const handleOpenCreateModal = () => {
    setEditingPlanId(null);
    setPlanName(`موازنة المصروفات التقديرية ${selectedFiscalYear}`);
    setPlanYear(selectedFiscalYear);
    setPlanCostCenterId('');
    setPlanNotes('');

    // Pre-populate with standard expense accounts
    const initial = expenseAccounts.slice(0, 8).map((acc) => ({
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name,
      annualAmount: 120000,
      alertThresholdPercent: 100,
    }));
    setPlanItems(initial);
    setShowPlanModal(true);
  };

  // Open Edit Budget Plan Modal
  const handleOpenEditModal = (plan: BudgetPlan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanYear(plan.fiscalYear);
    setPlanCostCenterId(plan.costCenterId || '');
    setPlanNotes(plan.notes || '');
    setPlanItems(
      plan.items.map((i) => ({
        accountId: i.accountId,
        accountCode: i.accountCode,
        accountName: i.accountName,
        annualAmount: i.annualAmount,
        alertThresholdPercent: i.alertThresholdPercent || 100,
      }))
    );
    setShowPlanModal(true);
  };

  // Add Item to Plan
  const handleAddPlanItem = () => {
    const unusedAccount = expenseAccounts.find(
      (a) => !planItems.some((item) => item.accountId === a.id)
    );
    if (!unusedAccount) {
      showAlert({
        title: 'تنبيه',
        message: 'تمت إضافة جميع حسابات المصروفات المتاحة.',
        type: 'info',
      });
      return;
    }
    setPlanItems((prev) => [
      ...prev,
      {
        accountId: unusedAccount.id,
        accountCode: unusedAccount.code,
        accountName: unusedAccount.name,
        annualAmount: 60000,
        alertThresholdPercent: 100,
      },
    ]);
  };

  // Remove Item from Plan
  const handleRemovePlanItem = (index: number) => {
    setPlanItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Budget Plan
  const handleSaveBudgetPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) {
      showAlert({
        title: 'بيانات ناقصة',
        message: 'يرجى كتابة اسم الموازنة التقديرية.',
        type: 'warning',
      });
      return;
    }

    if (planItems.length === 0) {
      showAlert({
        title: 'بيانات ناقصة',
        message: 'يرجى إضافة بند مصروف واحد على الأقل للموازنة.',
        type: 'warning',
      });
      return;
    }

    const compiledItems: BudgetItem[] = planItems.map((item, idx) => {
      const monthlyVal = Number((item.annualAmount / 12).toFixed(2));
      const monthlyAmounts = Array(12).fill(monthlyVal);
      return {
        id: `bi-${Date.now()}-${idx}`,
        accountId: item.accountId,
        accountCode: item.accountCode,
        accountName: item.accountName,
        annualAmount: Number(item.annualAmount),
        monthlyAmounts,
        alertThresholdPercent: Number(item.alertThresholdPercent) || 100,
      };
    });

    const totalBudget = compiledItems.reduce((s, i) => s + i.annualAmount, 0);

    if (editingPlanId) {
      updateBudgetPlan(editingPlanId, {
        name: planName.trim(),
        fiscalYear: planYear,
        costCenterId: planCostCenterId || undefined,
        totalBudget,
        items: compiledItems,
        notes: planNotes.trim() || undefined,
      });
      showAlert({
        title: 'تم التحديث',
        message: 'تم تعديل خطة الموازنة التقديرية بنجاح.',
        type: 'success',
      });
    } else {
      addBudgetPlan({
        name: planName.trim(),
        fiscalYear: planYear,
        costCenterId: planCostCenterId || undefined,
        status: 'approved',
        totalBudget,
        items: compiledItems,
        notes: planNotes.trim() || undefined,
      });
      showAlert({
        title: 'تم الحفظ',
        message: 'تم إنشاء الموازنة التقديرية وتفعيل مراقبة المصروفات.',
        type: 'success',
      });
    }

    setShowPlanModal(false);
  };

  // Delete Plan
  const handleDeletePlan = (planId: string) => {
    showConfirm(
      {
        title: 'حذف خطة الموازنة التقديرية',
        message: 'هل أنت متأكد من حذف هذه الموازنة؟ لن يؤثر ذلك على القيود المحاسبية المسجلة.',
        type: 'warning',
        confirmText: 'نعم، حذف',
        cancelText: 'إلغاء',
      },
      () => {
        deleteBudgetPlan(planId);
      }
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900">
                  الموازنات التقديرية مقابل الفعلي (Budgets vs. Actual)
                </h1>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  الرقابة المالية الذكية
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                تخطيط ومراقبة سقف المصروفات شهرياً وسنوياً، وتنبيه الإدارة الفوري عند تجاوز الموازنة المعتمدة.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-create-budget-plan"
              onClick={handleOpenCreateModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              إعداد موازنة تقديرية جديدة
            </button>
          </div>
        </div>

        {/* 2. Global KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-100">
          {/* Total Budget */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-slate-500 text-xs font-semibold block mb-1">
              إجمالي الموازنة التقديرية المعتمدة
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {formatMoney(comparisonData.totalBudget)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {selectedMonth === 0 ? `لكامل عام ${selectedFiscalYear}` : `لشهر ${months[selectedMonth - 1]?.name}`}
            </span>
          </div>

          {/* Actual Expenses */}
          <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-rose-700 text-xs font-bold">المصروف الفعلي المحقق</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-black text-rose-700 font-mono">
              {formatMoney(comparisonData.totalActual)}
            </div>
            <span className="text-[11px] text-rose-600/80 mt-1 block">
              من واقع قيود اليومية بدفتر الأستاذ
            </span>
          </div>

          {/* Variance (وفر / تجاوز) */}
          <div
            className={`rounded-2xl p-4 border ${
              comparisonData.totalVariance > 0
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">
                {comparisonData.totalVariance > 0 ? 'عجز وتجاوز في الموازنة' : 'وفـر مالي في الموازنة'}
              </span>
              <Scale className="w-4 h-4" />
            </div>
            <div className="text-xl font-black font-mono">
              {formatMoney(Math.abs(comparisonData.totalVariance))}
            </div>
            <span className="text-[11px] mt-1 block opacity-90">
              نسبة استهلاك السقف: {totalConsumptionPercent.toFixed(1)}%
            </span>
          </div>

          {/* Over-budget Alert Count */}
          <div
            className={`rounded-2xl p-4 border ${
              comparisonData.overBudgetCount > 0
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-100 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">حسابات تجاوزت الموازنة</span>
              {comparisonData.overBudgetCount > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="text-xl font-black">
              {comparisonData.overBudgetCount}{' '}
              <span className="text-xs font-bold">حساب مصروف</span>
            </div>
            <span className="text-[11px] mt-1 block opacity-80">
              {comparisonData.overBudgetCount > 0
                ? 'تنبيه للإدارة لاتخاذ الإجراءات التصحيحية'
                : 'جميع المصروفات منضبطة ضمن الحدود'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filters & Year/Month Selectors */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Year select */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <label htmlFor="select-budget-year" className="font-bold text-slate-600">العام المالي:</label>
            <select
              id="select-budget-year"
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(Number(e.target.value))}
              className="bg-transparent font-black text-slate-900 focus:outline-hidden cursor-pointer"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month select */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <label htmlFor="select-budget-period" className="font-bold text-slate-600">الفترة:</label>
            <select
              id="select-budget-period"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-black text-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value={0}>كامل العام (سنوي)</option>
              {months.map((m) => (
                <option key={m.num} value={m.num}>
                  شهر {m.num} - {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Center select */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <label htmlFor="select-budget-cost-center" className="font-bold text-slate-600">مركز التكلفة:</label>
            <select
              id="select-budget-cost-center"
              value={selectedCostCenterId}
              onChange={(e) => setSelectedCostCenterId(e.target.value)}
              className="bg-transparent font-black text-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="all">كافة مراكز التكلفة</option>
              {costCenters.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.code} - {cc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالحساب أو الكود..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('over')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'over' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              تجاوز السقف ({comparisonData.overBudgetCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('warning')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'warning' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              اقتراب من الحد
            </button>
          </div>
        </div>
      </div>

      {/* 4. Comparison Table (المقارنة التفصيلية) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="font-black text-slate-900 text-sm">
              جدول مقارنة المصروف الفعلي بالموازنة التقديرية
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة دقيقة لكل بند مصروف، نسبة الصرف المحققة، وفارق الوفر أو العجز المالي.
            </p>
          </div>

          {budgetPlans.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenEditModal(budgetPlans[0])}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Edit3 className="w-3.5 h-3.5" />
                تعديل بنود الخطة
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
              <tr>
                <th className="p-4">كود الحساب</th>
                <th className="p-4">بند المصروف</th>
                <th className="p-4 font-mono text-left">الموازنة التقديرية</th>
                <th className="p-4 font-mono text-left">المنصرف الفعلي</th>
                <th className="p-4 font-mono text-left">الانحراف والفارق</th>
                <th className="p-4 w-44">نسبة الاستهلاك</th>
                <th className="p-4 text-center">حالة الالتزام بالموازنة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    لا توجد بنود موازنة مسجلة لهذا العام. انقر على "إعداد موازنة تقديرية جديدة" للبدء.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const percent = Math.min(200, item.variancePercent);
                  const isOver = item.isOverBudget;
                  const isWarning = !isOver && item.variancePercent >= 85;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOver ? 'bg-rose-50/30' : isWarning ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="p-4 font-mono font-bold text-slate-700">{item.accountCode}</td>
                      <td className="p-4 font-black text-slate-900">{item.accountName}</td>
                      <td className="p-4 font-mono font-bold text-slate-800 text-left">
                        {formatMoney(item.budgetAmount)}
                      </td>
                      <td className="p-4 font-mono font-black text-left text-slate-900">
                        {formatMoney(item.actualAmount)}
                      </td>
                      <td
                        className={`p-4 font-mono font-bold text-left ${
                          item.variance > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.variance > 0
                          ? `+${formatMoney(item.variance)} (تجاوز)`
                          : `${formatMoney(Math.abs(item.variance))} (وفر)`}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span
                              className={
                                isOver
                                  ? 'text-rose-700'
                                  : isWarning
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                              }
                            >
                              {item.variancePercent}%
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              سقف: {item.alertThresholdPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOver
                                  ? 'bg-rose-600'
                                  : isWarning
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-rose-300 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            تجاوز السقف المعتمد
                          </span>
                        ) : isWarning ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            اقتراب من السقف
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ضمن الحدود المقررة
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: Create / Edit Budget Plan */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">
                    {editingPlanId ? 'تعديل الموازنة التقديرية' : 'إعداد خطة موازنة تقديرية جديدة'}
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    تحديد المخصصات التقديرية لحسابات المصروفات ونسب الإنذار المبكر.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPlanModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudgetPlan} className="p-6 space-y-5 text-slate-800 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Plan Name */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="font-bold text-slate-700 block">اسم الموازنة التقديرية *</label>
                  <input
                    type="text"
                    required
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="مثال: موازنة المصروفات التشغيلية 2025"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                {/* Fiscal Year */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">العام المالي *</label>
                  <select
                    value={planYear}
                    onChange={(e) => setPlanYear(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                  >
                    {[2024, 2025, 2026].map((y) => (
                      <option key={y} value={y}>
                        عام {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-slate-900 text-xs">
                    بنود الموازنة وحسابات المصروفات ({planItems.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddPlanItem}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة حساب مصروف
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                  {planItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center gap-3"
                    >
                      {/* Select Account */}
                      <div className="w-full md:w-1/2">
                        <label className="text-[10px] text-slate-400 block mb-1">حساب المصروف</label>
                        <select
                          value={item.accountId}
                          onChange={(e) => {
                            const acc = expenseAccounts.find((a) => a.id === e.target.value);
                            if (acc) {
                              setPlanItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx
                                    ? {
                                        ...it,
                                        accountId: acc.id,
                                        accountCode: acc.code,
                                        accountName: acc.name,
                                      }
                                    : it
                                )
                              );
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 focus:outline-hidden"
                        >
                          {expenseAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Annual Amount */}
                      <div className="w-full md:w-1/3">
                        <label className="text-[10px] text-slate-400 block mb-1">
                          المبلغ السنوي التقديري ({currency})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.annualAmount}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setPlanItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, annualAmount: val } : it))
                            );
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-hidden"
                        />
                      </div>

                      {/* Alert Threshold */}
                      <div className="w-full md:w-1/6">
                        <label className="text-[10px] text-slate-400 block mb-1">نسبة التنبيه %</label>
                        <input
                          type="number"
                          min="50"
                          max="150"
                          value={item.alertThresholdPercent}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 100;
                            setPlanItems((prev) =>
                              prev.map((it, i) =>
                                i === idx ? { ...it, alertThresholdPercent: val } : it
                              )
                            );
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-900 focus:outline-hidden"
                        />
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemovePlanItem(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer self-end md:self-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">ملاحظات واعتماد الموازنة:</label>
                <textarea
                  rows={2}
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder="ملاحظات للإدارة المالية..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  id="btn-submit-budget-plan"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-md"
                >
                  حفظ واعتماد الموازنة التقديرية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
