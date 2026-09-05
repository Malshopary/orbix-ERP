import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { CollectionPlan, CollectionInstallment, Customer } from '../../types';
import { SearchableSelect } from '../SearchableSelect';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { PrintHeader } from '../PrintHeader';
import { PrintFooter } from '../PrintFooter';
import {
  CalendarDays,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Printer,
  Trash2,
  X,
  Check,
  Building,
  DollarSign,
  Percent,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
} from 'lucide-react';

export const CollectionPlansSection: React.FC = () => {
  const {
    collectionPlans = [],
    customers = [],
    salesInvoices = [],
    accounts = [],
    formatMoney,
    addCollectionPlan,
    updateCollectionPlan,
    recordInstallmentPayment,
    deleteCollectionPlan,
    showAlert,
    showConfirm,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [payInstallmentModal, setPayInstallmentModal] = useState<{
    plan: CollectionPlan;
    installment: CollectionInstallment;
  } | null>(null);
  const [printPlan, setPrintPlan] = useState<CollectionPlan | null>(null);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('cash');
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || '');
  const [paymentRef, setPaymentRef] = useState('');

  // Create Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [installmentsCount, setInstallmentsCount] = useState<number>(6);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [generatedInstallments, setGeneratedInstallments] = useState<CollectionInstallment[]>([]);
  const [planNotes, setPlanNotes] = useState('');

  // Auto-generate installments preview
  const handleAutoGenerateSchedule = () => {
    const principal = Math.max(0, totalAmount - downPayment);
    if (principal <= 0 || installmentsCount <= 0) return;

    const baseAmount = Math.floor(principal / installmentsCount);
    const remainder = principal - baseAmount * installmentsCount;

    const items: CollectionInstallment[] = [];
    let curDate = new Date(startDate);

    for (let i = 1; i <= installmentsCount; i++) {
      if (i > 1) {
        if (frequency === 'weekly') curDate.setDate(curDate.getDate() + 7);
        else if (frequency === 'monthly') curDate.setMonth(curDate.getMonth() + 1);
        else if (frequency === 'quarterly') curDate.setMonth(curDate.getMonth() + 3);
      }

      // Add remainder to first installment
      const amount = i === 1 ? baseAmount + remainder : baseAmount;

      items.push({
        id: `inst-${Date.now()}-${i}`,
        installmentNumber: i,
        dueDate: curDate.toISOString().split('T')[0],
        amount,
        paidAmount: 0,
        status: 'pending',
      });
    }

    setGeneratedInstallments(items);
  };

  // Watch parameters to re-generate preview if modal open
  React.useEffect(() => {
    if (showCreateModal && totalAmount > 0) {
      handleAutoGenerateSchedule();
    }
  }, [totalAmount, downPayment, frequency, installmentsCount, startDate]);

  // Handle Customer Selection
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find((c) => c.id === customerId);
    if (cust && cust.currentBalance > 0) {
      setTotalAmount(cust.currentBalance);
    }
  };

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return collectionPlans.filter((p) => {
      const matchSearch =
        p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.planNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [collectionPlans, searchQuery, statusFilter]);

  // Global KPIs
  const totalPlanned = useMemo(() => {
    return (collectionPlans || []).reduce((sum, p) => sum + (p.totalAmount || p.totalDebt || 0), 0);
  }, [collectionPlans]);

  const totalCollected = useMemo(() => {
    return (collectionPlans || []).reduce((sum, p) => {
      if (p.collectedAmount !== undefined) return sum + p.collectedAmount;
      const paid = (p.installments || []).reduce((acc, inst) => acc + (inst.paidAmount || 0), 0);
      return sum + paid;
    }, 0);
  }, [collectionPlans]);

  const totalRemaining = Math.max(0, totalPlanned - totalCollected);

  const totalOverdueInstallments = useMemo(() => {
    let count = 0;
    (collectionPlans || []).forEach((p) => {
      (p.installments || []).forEach((inst) => {
        if (inst.status === 'overdue') count++;
      });
    });
    return count;
  }, [collectionPlans]);

  // Open Create
  const handleOpenCreate = () => {
    const cust = customers[0];
    setSelectedCustomerId(cust?.id || '');
    setSelectedInvoiceId('');
    setTotalAmount(cust ? Math.max(1000, cust.currentBalance || 5000) : 5000);
    setDownPayment(0);
    setFrequency('monthly');
    setInstallmentsCount(4);
    setStartDate(new Date().toISOString().split('T')[0]);
    setPlanNotes('اتفاقية جدولة وسداد أقساط معتمدة');
    setShowCreateModal(true);
  };

  // Save Plan
  const handleSavePlan = () => {
    if (!selectedCustomerId) {
      showAlert({ title: 'تنبيه', message: 'يرجى اختيار العميل', type: 'warning' });
      return;
    }
    if (totalAmount <= 0) {
      showAlert({ title: 'تنبيه', message: 'يرجى إدخال إجمالي مبلغ صحيح', type: 'warning' });
      return;
    }
    if (generatedInstallments.length === 0) {
      showAlert({ title: 'تنبيه', message: 'يرجى توليد جدول الأقساط', type: 'warning' });
      return;
    }

    const cust = customers.find((c) => c.id === selectedCustomerId);
    const inv = salesInvoices.find((i) => i.id === selectedInvoiceId);

    const created = addCollectionPlan({
      customerId: selectedCustomerId,
      customerName: cust?.name || 'عميل',
      salesInvoiceId: selectedInvoiceId || undefined,
      invoiceNumber: inv?.invoiceNumber || undefined,
      totalAmount,
      frequency,
      startDate,
      installments: generatedInstallments,
      notes: planNotes,
    });

    showAlert({
      title: 'تم إنشاء خطة التحصيل',
      message: `تم جدولة الأقساط بنجاح برقم خطة ${created.planNumber} بإجمالي ${formatMoney(totalAmount)}`,
      type: 'success',
    });

    setShowCreateModal(false);
  };

  // Open Pay Installment
  const handleOpenPayInstallment = (plan: CollectionPlan, installment: CollectionInstallment) => {
    const remaining = installment.amount - (installment.paidAmount || 0);
    setPayInstallmentModal({ plan, installment });
    setPaymentAmount(remaining);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('cash');
    setPaymentAccountId(accounts.find((a) => a.code === '1110')?.id || accounts[0]?.id || '');
    setPaymentRef(`REC-INST-${installment.installmentNumber}`);
  };

  const handleConfirmPayInstallment = () => {
    if (!payInstallmentModal) return;
    if (paymentAmount <= 0) {
      showAlert({ title: 'تنبيه', message: 'يرجى إدخال مبلغ سداد صحيح', type: 'warning' });
      return;
    }

    recordInstallmentPayment(
      payInstallmentModal.plan.id,
      payInstallmentModal.installment.id,
      paymentAmount,
      paymentDate,
      paymentMethod,
      paymentAccountId
    );

    showAlert({
      title: 'تم تحصيل القسط بنجاح',
      message: `تم تسجيل سداد القسط بقيمة ${formatMoney(paymentAmount)} وتحديث رصيد العميل وإصدار سند القبض`,
      type: 'success',
    });

    setPayInstallmentModal(null);
  };

  const handleDeletePlan = (plan: CollectionPlan) => {
    showConfirm({
      title: 'حذف خطة التحصيل',
      message: `هل أنت متأكد من حذف خطة التحصيل ${plan.planNumber} للعميل ${plan.customerName}؟`,
      type: 'danger',
      confirmText: 'نعم، احذف',
      cancelText: 'إلغاء',
      onConfirm: () => {
        deleteCollectionPlan(plan.id);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              خطط التحصيل وجدولة الأقساط (Collection Plans)
            </h2>
            <p className="text-xs text-slate-500">
              إدارة اتفاقيات السداد المجدول، ومتابعة تواريخ استحقاق الأقساط، وتحصيل المدفوعات آلياً
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إنشاء خطة تحصيل / جدولة أقساط</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">إجمالي المبالغ المجدولة</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatMoney(totalPlanned)}
            </div>
            <div className="text-xs text-slate-500 mt-1">{collectionPlans.length} اتفاقيات سداد معتمدة</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">المحصل فعلياً</span>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {formatMoney(totalCollected)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              نسبة الإنجاز: {totalPlanned > 0 ? Math.round((totalCollected / totalPlanned) * 100) : 0}%
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">المتبقي قيد التحصيل</span>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-600 font-mono">
              {formatMoney(totalRemaining)}
            </div>
            <div className="text-xs text-slate-500 mt-1">أقساط قادمة حسب التواريخ المجدولة</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">أقساط متأخرة</span>
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">
              {totalOverdueInstallments} قسط
            </div>
            <div className="text-xs text-slate-500 mt-1">تجاوزت تاريخ الاستحقاق ولم تسدد</div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الخطة أو اسم العميل أو الفاتورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">سارية المفعول</option>
            <option value="completed">مكتملة التحصيل</option>
            <option value="overdue">تتضمن أقساطاً متأخرة</option>
          </select>
        </div>
      </div>

      {/* Plans List / Accordions */}
      <div className="space-y-4">
        {filteredPlans.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-500">
            <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            لا توجد خطط تحصيل مسجلة حالياً
          </div>
        ) : (
          filteredPlans.map((plan) => {
            const isExpanded = expandedPlanId === plan.id;
            const planTotal = plan.totalAmount || plan.totalDebt || 0;
            const planCollected =
              plan.collectedAmount !== undefined
                ? plan.collectedAmount
                : (plan.installments || []).reduce((acc, i) => acc + (i.paidAmount || 0), 0);
            const progressPercent =
              planTotal > 0 ? Math.round((planCollected / planTotal) * 100) : 0;

            const nextInstallment = (plan.installments || []).find(
              (i) => i.status === 'pending' || i.status === 'partially_paid' || i.status === 'partial' || i.status === 'overdue'
            );

            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Plan Header Card */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mt-0.5">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">
                          {plan.planNumber}
                        </span>
                        <h3 className="font-bold text-slate-900">{plan.customerName}</h3>
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                            plan.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : plan.status === 'overdue'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {plan.status === 'completed'
                            ? 'مكتملة'
                            : plan.status === 'overdue'
                            ? 'متأخرة'
                            : 'سارية'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                        {plan.invoiceNumber && <span>الفاتورة: {plan.invoiceNumber}</span>}
                        {plan.startDate && <span>تاريخ البدء: {plan.startDate}</span>}
                        {plan.agreementDate && <span>تاريخ الاتفاق: {plan.agreementDate}</span>}
                        <span>
                          التكرار:{' '}
                          {plan.frequency === 'weekly'
                            ? 'أسبوعي'
                            : plan.frequency === 'quarterly'
                            ? 'ربع سنوي'
                            : 'شهري'}
                        </span>
                        <span>عدد الأقساط: {(plan.installments || []).length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amounts & Progress */}
                  <div className="flex items-center justify-between lg:justify-end gap-6">
                    <div className="text-left">
                      <div className="text-xs text-slate-500">إجمالي المبلغ</div>
                      <div className="font-bold font-mono text-slate-900">
                        {formatMoney(planTotal)}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-mono">
                        محصل: {formatMoney(planCollected)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-28 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>الإنجاز</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPrintPlan(plan)}
                        title="طباعة اتفاقية الأقساط"
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan)}
                        title="حذف"
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Installments Table */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 p-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-3">
                      جدول استحقاق وسداد الأقساط:
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-white text-slate-600 border-b border-slate-200 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">رقم القسط</th>
                            <th className="py-2.5 px-3">تاريخ الاستحقاق</th>
                            <th className="py-2.5 px-3">مبلغ القسط</th>
                            <th className="py-2.5 px-3">المسدد</th>
                            <th className="py-2.5 px-3">المتبقي</th>
                            <th className="py-2.5 px-3">الحالة</th>
                            <th className="py-2.5 px-3">تاريخ السداد الفعلي</th>
                            <th className="py-2.5 px-3 text-center">إجراء السداد</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {(plan.installments || []).map((inst) => {
                            const remainingInst = inst.amount - (inst.paidAmount || 0);

                            return (
                              <tr key={inst.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-bold font-mono">
                                  القسط #{inst.installmentNumber}
                                </td>
                                <td className="py-2.5 px-3 font-mono">{inst.dueDate}</td>
                                <td className="py-2.5 px-3 font-bold font-mono">
                                  {formatMoney(inst.amount)}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-emerald-600">
                                  {formatMoney(inst.paidAmount || 0)}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-rose-600">
                                  {formatMoney(remainingInst)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      inst.status === 'paid'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : inst.status === 'overdue'
                                        ? 'bg-rose-100 text-rose-700'
                                        : inst.status === 'partial'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {inst.status === 'paid'
                                      ? 'تم السداد'
                                      : inst.status === 'overdue'
                                      ? 'متأخر'
                                      : inst.status === 'partial'
                                      ? 'سداد جزئي'
                                      : 'بانتظار الاستحقاق'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 font-mono">
                                  {inst.paidDate || '-'}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {inst.status !== 'paid' ? (
                                    <button
                                      onClick={() => handleOpenPayInstallment(plan, inst)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-semibold text-[11px] transition-colors"
                                    >
                                      <CreditCard className="w-3 h-3" />
                                      <span>تحصيل القسط</span>
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-emerald-600 font-semibold">
                                      مكتمل ✓
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Create Plan */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    إنشاء خطة تحصيل وجدولة أقساط للعميل
                  </h3>
                  <p className="text-xs text-slate-500">
                    توليد جدول الأقساط الدورية بناءً على الرصيد أو فاتورة مبيعات محددة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Form inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    العميل <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={customers.map((c) => ({
                      value: c.id,
                      label: c.name,
                      subLabel: `رصيد العميل الحالي: ${formatMoney(c.currentBalance)}`,
                    }))}
                    value={selectedCustomerId}
                    onChange={(val) => handleCustomerChange(val)}
                    placeholder="اختر العميل..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ربط بفاتورة مبيعات (اختياري)
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => {
                      setSelectedInvoiceId(e.target.value);
                      const inv = salesInvoices.find((i) => i.id === e.target.value);
                      if (inv) setTotalAmount(inv.remainingAmount || inv.grandTotal);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">-- بدون فاتورة (على الحساب العام) --</option>
                    {salesInvoices
                      .filter((i) => !selectedCustomerId || i.customerId === selectedCustomerId)
                      .map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} - متبقي {formatMoney(inv.remainingAmount)} ({inv.customerName})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    إجمالي المبلغ المجدول <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    دفعة مقدمة (إن وجدت)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={downPayment}
                    onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    دورية استحقاق الأقساط
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="weekly">أسبوعي</option>
                    <option value="monthly">شهري</option>
                    <option value="quarterly">ربع سنوي (كل 3 أشهر)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    عدد الأقساط <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    تاريخ استحقاق أول قسط
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ملاحظات وشروط الاتفاقية
                  </label>
                  <input
                    type="text"
                    value={planNotes}
                    onChange={(e) => setPlanNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                    placeholder="شروط السداد، الضمانات، الشيكات البنكية المودعة..."
                  />
                </div>
              </div>

              {/* Generated Schedule Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    معاينة جدول الأقساط المتولدة آلياً
                  </h4>
                  <span className="text-xs font-semibold text-blue-600">
                    قيمة القسط التقريبية: {formatMoney(Math.round(totalAmount / (installmentsCount || 1)))}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">القسط</th>
                        <th className="py-2.5 px-3">تاريخ الاستحقاق</th>
                        <th className="py-2.5 px-3">مبلغ القسط</th>
                        <th className="py-2.5 px-3">الحالة الأولية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {generatedInstallments.map((inst, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-bold font-mono">القسط #{inst.installmentNumber}</td>
                          <td className="py-2 px-3 font-mono">{inst.dueDate}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">
                            {formatMoney(inst.amount)}
                          </td>
                          <td className="py-2 px-3 text-slate-500">مجدول</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSavePlan}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد خطة التحصيل وجدولة الأقساط</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Pay Installment */}
      {payInstallmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    تحصيل القسط #{payInstallmentModal.installment.installmentNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    العميل: {payInstallmentModal.plan.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayInstallmentModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  المبلغ المحصل
                </label>
                <input
                  type="number"
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  تاريخ التحصيل
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  طريقة الدفع
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="cash">نقداً بالخزينة</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="cheque">شيك بنكي</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  حساب الإيداع (الخزينة أو البنك)
                </label>
                <select
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  {accounts
                    .filter((a) => a.type === 'asset')
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  رقم الإيصال / السند المرجعي
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  placeholder="رقم سند القبض"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayInstallmentModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmPayInstallment}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                <Check className="w-3.5 h-3.5" />
                <span>إثبات التحصيل وإصدار السند</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printPlan && (
        <PrintPreviewModal
          isOpen={true}
          onClose={() => setPrintPlan(null)}
          title={`اتفاقية خطة سداد أقساط - ${printPlan.planNumber}`}
        >
          <div className="p-8 bg-white text-slate-900 text-sm space-y-6 max-w-3xl mx-auto" dir="rtl">
            <PrintHeader title="اتفاقية جدولة وسداد أقساط مبيعات" documentNumber={printPlan.planNumber} />

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 font-bold block mb-1">الطرف الثاني (العميل):</span>
                <div className="font-bold text-sm text-slate-800">{printPlan.customerName}</div>
                <div>الفاتورة المرجعية: {printPlan.invoiceNumber || 'حساب جاري عميل'}</div>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-1">تفاصيل الخطة:</span>
                <div>تاريخ البدء: {printPlan.startDate}</div>
                <div>إجمالي المبلغ: {formatMoney(printPlan.totalAmount)}</div>
                <div>عدد الأقساط: {printPlan.installments.length} قسط</div>
              </div>
            </div>

            <table className="w-full text-right text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="py-2 px-3 border-b">القسط</th>
                  <th className="py-2 px-3 border-b">تاريخ الاستحقاق</th>
                  <th className="py-2 px-3 border-b text-left">مبلغ القسط</th>
                  <th className="py-2 px-3 border-b text-left">المسدد</th>
                  <th className="py-2 px-3 border-b">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {printPlan.installments.map((inst, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 font-bold">القسط #{inst.installmentNumber}</td>
                    <td className="py-2 px-3 font-mono">{inst.dueDate}</td>
                    <td className="py-2 px-3 text-left font-mono font-bold">{formatMoney(inst.amount)}</td>
                    <td className="py-2 px-3 text-left font-mono text-emerald-600">
                      {formatMoney(inst.paidAmount || 0)}
                    </td>
                    <td className="py-2 px-3">
                      {inst.status === 'paid' ? 'مسدد' : 'بانتظار السداد'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded">
              <span className="font-bold block mb-1">تعهد بالسداد:</span>
              <p>
                يتعهد الطرف الثاني (العميل) بسداد كافة الأقساط المحددة في هذا الجدول بمواعيد استحقاقها الموضحة
                أعلاه دون تأخير، وفي حال التأخر يحق للطرف الأول اتخاذ كافة الإجراءات النظامية والقانونية.
              </p>
            </div>

            <div className="grid grid-cols-2 pt-8 text-center text-xs">
              <div>
                <span className="font-bold block mb-8">توقيع ومصادقة العميل:</span>
                <span>................................................</span>
              </div>
              <div>
                <span className="font-bold block mb-8">اعتماد الإدارة المالية:</span>
                <span>................................................</span>
              </div>
            </div>

            <PrintFooter />
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
