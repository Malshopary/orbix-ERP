import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import { SalesRep, Customer, SalesInvoice, CRMLead, CommissionPayment } from '../types';
import {
  Users,
  Plus,
  TrendingUp,
  DollarSign,
  Target,
  Percent,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Receipt,
  Phone,
  Mail,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  X,
  CreditCard,
  ArrowUpRight,
  ShieldAlert,
  Award,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  MessageCircle,
  Building,
  CheckCircle,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface CrmSalesRepDashboardProps {
  onOpenCustomerStatement: (customerId: string) => void;
}

export const CrmSalesRepDashboard: React.FC<CrmSalesRepDashboardProps> = ({
  onOpenCustomerStatement,
}) => {
  const {
    salesReps,
    customers,
    salesInvoices,
    receipts,
    commissionPayments,
    crmLeads,
    accounts,
    formatMoney,
    canDeleteEntity,
    updateSalesRep,
    deleteSalesRep,
    addCommissionPayment,
    hasPermission,
    showAlert,
    showConfirm,
  } = useErp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'due_comm'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals
  const [selectedRep, setSelectedRep] = useState<SalesRep | null>(null);
  const [repDetailTab, setRepDetailTab] = useState<'customers' | 'invoices' | 'receipts' | 'commissions' | 'leads'>('customers');
  const [showEditRepModal, setShowEditRepModal] = useState(false);
  const [editingRep, setEditingRep] = useState<SalesRep | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutTargetRep, setPayoutTargetRep] = useState<SalesRep | null>(null);

  // Form State for Add / Edit Sales Rep
  const [repName, setRepName] = useState('');
  const [repPhone, setRepPhone] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repCommissionRate, setRepCommissionRate] = useState(3);
  const [repSalesTarget, setRepSalesTarget] = useState(100000);
  const [repNotes, setRepNotes] = useState('');
  const [repCommissionBase, setRepCommissionBase] = useState<'invoiced' | 'collected'>('invoiced');

  // Form State for Commission Payout
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [payoutPeriod, setPayoutPeriod] = useState(`شهر ${new Date().getMonth() + 1} / ${new Date().getFullYear()}`);
  const [payoutAccountId, setPayoutAccountId] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  // Cash / Bank accounts for commission payout
  const paymentAccounts = accounts.filter(
    (a) => a.type === 'asset' && (a.code.startsWith('111') || a.code.startsWith('112'))
  );

  // Compute enriched metrics for each sales representative
  const repStats = useMemo(() => {
    return salesReps.map((rep) => {
      // 1. Linked Customers
      const repCusts = customers.filter((c) => c.salesRepId === rep.id);

      // 2. Invoices linked to rep (directly or via assigned customer)
      const repInvs = salesInvoices.filter(
        (inv) => inv.salesRepId === rep.id || repCusts.some((c) => c.id === inv.customerId)
      );

      // 3. Sales Volume Achieved
      const invoicedGrandTotal = repInvs.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
      const totalSales = Math.max(invoicedGrandTotal, rep.totalSalesAchieved || 0);

      // 4. Collections Achieved
      const invCashCollected = repInvs.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
      const directReceipts = receipts.filter(
        (rec) => rec.salesRepId === rep.id || repCusts.some((c) => c.id === rec.partyId)
      );
      const receiptsAmount = directReceipts.reduce((sum, rec) => sum + (rec.amount || 0), 0);
      
      // Calculate total collected: ensure not double-counting invoice cash if receipts match
      const totalCollected = Math.max(invCashCollected, receiptsAmount, (rep.totalSalesAchieved || 0) * 0.75);

      // 5. Collection Rate %
      const collectionRate = totalSales > 0 ? Math.min(100, Math.round((totalCollected / totalSales) * 100)) : (rep.totalSalesAchieved ? 85 : 0);

      // 6. Outstanding Debt on Rep's Customers
      const outstandingDebt = repCusts.reduce((sum, c) => sum + Math.max(0, c.currentBalance || 0), 0);

      // 7. Commissions Earned & Paid
      const earnedCommission = rep.totalCommissionEarned !== undefined && rep.totalCommissionEarned > 0
        ? rep.totalCommissionEarned
        : Math.round(totalSales * ((rep.commissionRate || 3) / 100));

      const repPayments = commissionPayments.filter((p) => p.salesRepId === rep.id);
      const paidFromRecords = repPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalPaidCommission = Math.max(paidFromRecords, rep.paidCommissions || 0);
      const commissionDue = Math.max(0, earnedCommission - totalPaidCommission);

      // 8. Monthly Target & Progress
      const target = rep.salesTarget || rep.monthlySalesTarget || 100000;
      const targetProgressPct = target > 0 ? Math.min(100, Math.round((totalSales / target) * 100)) : 0;

      // 9. CRM Leads & Pipeline
      const repLeads = crmLeads.filter((l) => l.salesRepId === rep.id);
      const wonLeads = repLeads.filter((l) => l.stage === 'won');
      const wonLeadsValue = wonLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

      return {
        rep,
        customers: repCusts,
        invoices: repInvs,
        receipts: directReceipts,
        payments: repPayments,
        leads: repLeads,
        totalSales,
        totalCollected,
        collectionRate,
        outstandingDebt,
        earnedCommission,
        paidCommission: totalPaidCommission,
        commissionDue,
        target,
        targetProgressPct,
        wonLeadsCount: wonLeads.length,
        wonLeadsValue,
      };
    });
  }, [salesReps, customers, salesInvoices, receipts, commissionPayments, crmLeads]);

  // Overall Aggregate KPIs
  const totalStats = useMemo(() => {
    const totalSalesVolume = repStats.reduce((sum, s) => sum + s.totalSales, 0);
    const totalCollectionsVolume = repStats.reduce((sum, s) => sum + s.totalCollected, 0);
    const totalCommissionsEarned = repStats.reduce((sum, s) => sum + s.earnedCommission, 0);
    const totalCommissionsDue = repStats.reduce((sum, s) => sum + s.commissionDue, 0);
    const totalLinkedCustomers = customers.filter((c) => c.salesRepId).length;
    const avgCollectionRate = totalSalesVolume > 0 ? Math.round((totalCollectionsVolume / totalSalesVolume) * 100) : 0;

    return {
      totalSalesVolume,
      totalCollectionsVolume,
      totalCommissionsEarned,
      totalCommissionsDue,
      totalLinkedCustomers,
      avgCollectionRate,
    };
  }, [repStats, customers]);

  // Filtered List
  const filteredRepStats = useMemo(() => {
    return repStats.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.rep.name.toLowerCase().includes(q) ||
        (item.rep.phone && item.rep.phone.toLowerCase().includes(q)) ||
        (item.rep.code && item.rep.code.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (performanceFilter === 'high') return item.collectionRate >= 80;
      if (performanceFilter === 'medium') return item.collectionRate >= 50 && item.collectionRate < 80;
      if (performanceFilter === 'low') return item.collectionRate < 50;
      if (performanceFilter === 'due_comm') return item.commissionDue > 0;

      return true;
    });
  }, [repStats, searchQuery, performanceFilter]);

  // Handler: Edit Sales Rep
  const handleSaveEditRep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRep || !repName.trim()) return;

    updateSalesRep(editingRep.id, {
      name: repName.trim(),
      phone: repPhone.trim(),
      email: repEmail.trim(),
      commissionRate: Number(repCommissionRate) || 0,
      monthlySalesTarget: Number(repSalesTarget) || 100000,
      notes: repNotes,
    });

    setShowEditRepModal(false);
    setEditingRep(null);
  };

  const openEditModal = (rep: SalesRep) => {
    setEditingRep(rep);
    setRepName(rep.name);
    setRepPhone(rep.phone || '');
    setRepEmail(rep.email || '');
    setRepCommissionRate(rep.commissionRate || 3);
    setRepSalesTarget(rep.salesTarget || rep.monthlySalesTarget || 100000);
    setRepNotes(rep.notes || '');
    setShowEditRepModal(true);
  };

  // Handler: Quick Commission Payout
  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutTargetRep || payoutAmount <= 0) return;

    const accId = payoutAccountId || (paymentAccounts[0] ? paymentAccounts[0].id : 'acc-cash');
    const acc = accounts.find((a) => a.id === accId) || paymentAccounts[0];

    addCommissionPayment({
      salesRepId: payoutTargetRep.id,
      salesRepName: payoutTargetRep.name,
      amount: payoutAmount,
      period: payoutPeriod,
      date: new Date().toISOString().split('T')[0],
      accountId: acc?.id || 'acc-cash',
      accountName: acc?.name || 'الخزينة النقدية الرئيسية',
      paymentMethod: 'cash',
      notes: payoutNotes || `صرف عمولة مبيعات عن ${payoutPeriod}`,
    });

    setShowPayoutModal(false);
    setPayoutTargetRep(null);
    setPayoutAmount(0);
    setPayoutNotes('');
  };

  const openPayoutModal = (rep: SalesRep, dueAmount: number) => {
    setPayoutTargetRep(rep);
    setPayoutAmount(dueAmount > 0 ? dueAmount : 1500);
    setPayoutAccountId(paymentAccounts[0] ? paymentAccounts[0].id : '');
    setPayoutPeriod(`شهر ${new Date().getMonth() + 1} / ${new Date().getFullYear()}`);
    setPayoutNotes(`صرف دفعة عمولة مستحقة للمندوب ${rep.name}`);
    setShowPayoutModal(true);
  };

  // Currently selected rep stat for deep-dive drawer
  const selectedRepStat = repStats.find((s) => s.rep.id === selectedRep?.id);

  return (
    <div className="space-y-6">
      {/* 1. TOP EXECUTIVE KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">إجمالي مبيعات المناديب</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {formatMoney(totalStats.totalSalesVolume)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>العملاء المربوطين بالمناديب</span>
            <strong className="text-indigo-700 font-bold">{totalStats.totalLinkedCustomers} عميل</strong>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">إجمالي التحصيلات الفعلية</span>
              <h3 className="text-2xl font-black text-emerald-700 mt-1">
                {formatMoney(totalStats.totalCollectionsVolume)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>نسبة التحصيل العامة</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {totalStats.avgCollectionRate}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">إجمالي العمولات المكتسبة</span>
              <h3 className="text-2xl font-black text-indigo-900 mt-1">
                {formatMoney(totalStats.totalCommissionsEarned)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>عدد المناديب النشطين</span>
            <strong className="text-slate-800 font-bold">{salesReps.length} مندوب</strong>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-5 text-white shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-amber-100 block">صافي العمولات المستحقة للصرف</span>
              <h3 className="text-2xl font-black mt-1">
                {formatMoney(totalStats.totalCommissionsDue)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-amber-100 pt-3 border-t border-white/20">
            <span>جاهزة للصرف الفوري</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-white font-bold text-[11px]">
              قيود يومية مؤتمتة
            </span>
          </div>
        </div>
      </div>

      {/* HR AUTOMATIC SYNC INFORMATIONAL BANNER */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-slate-900 text-xs">
                المزامنة التلقائية المباشرة مع إدارة الموارد البشرية (HR)
              </h4>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                مؤتمت بالكامل
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
              يتم إدراج مناديب ومسؤولي المبيعات واحتساب مستهدفاتهم (Targets) وعمولاتهم تلقائياً فور تسجيل أو تعديل الموظف في إدارة الموارد البشرية واختيار مسمى خاص بالمبيعات، أو عند ربطه بالعملاء والفواتير.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="text-[11px] font-bold text-indigo-800 bg-white/90 border border-indigo-200 px-3.5 py-1.5 rounded-xl shadow-2xs">
            {salesReps.length} مندوب ومسؤول مبيعات متزامن
          </span>
        </div>
      </div>

      {/* 2. FILTER & ACTION BAR */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="بحث باسم المندوب أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Performance Filters */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          <button
            type="button"
            onClick={() => setPerformanceFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              performanceFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({salesReps.length})
          </button>
          <button
            type="button"
            onClick={() => setPerformanceFilter('high')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              performanceFilter === 'high'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            🌟 تحصيل ممتاز (≥80%)
          </button>
          <button
            type="button"
            onClick={() => setPerformanceFilter('medium')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              performanceFilter === 'medium'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            ⚡ تحصيل متوسط (50-79%)
          </button>
          <button
            type="button"
            onClick={() => setPerformanceFilter('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              performanceFilter === 'low'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            ⚠️ تحصيل متأخر (&lt;50%)
          </button>
          <button
            type="button"
            onClick={() => setPerformanceFilter('due_comm')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              performanceFilter === 'due_comm'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            💵 عمولات مستحقة
          </button>
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="عرض البطاقات"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="عرض الجدول التنافسي"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. PERFORMANCE CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRepStats.map((item) => {
            const {
              rep,
              customers: repCusts,
              totalSales,
              totalCollected,
              collectionRate,
              outstandingDebt,
              earnedCommission,
              paidCommission,
              commissionDue,
              target,
              targetProgressPct,
              wonLeadsCount,
              wonLeadsValue,
            } = item;

            // Collection badge config
            let collectionBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
            let collectionLabel = 'تحصيل متأخر';
            if (collectionRate >= 80) {
              collectionBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              collectionLabel = 'تحصيل ممتاز';
            } else if (collectionRate >= 50) {
              collectionBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
              collectionLabel = 'تحصيل جيد';
            }

            return (
              <div
                key={rep.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-black text-base group-hover:scale-105 transition-transform">
                        {rep.name.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                          {rep.name}
                          {rep.code && (
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                              {rep.code}
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{rep.phone || 'بدون جوال'}</span>
                          <span>•</span>
                          <span>{repCusts.length} عميل مربوط</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-xl">
                        عمولة {rep.commissionRate}%
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${collectionBadgeClass}`}>
                        {collectionLabel} ({collectionRate}%)
                      </span>
                    </div>
                  </div>

                  {/* 4-Pod Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs">
                    {/* Pod 1: Sales Achieved */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-medium">حجم المبيعات المحققة</span>
                      <strong className="text-slate-900 text-sm block mt-0.5">
                        {formatMoney(totalSales)}
                      </strong>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>الهدف: {formatMoney(target)}</span>
                        <span className="font-bold text-indigo-600">{targetProgressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${targetProgressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Pod 2: Collections & Rate */}
                    <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                      <span className="text-emerald-700 block text-[10px] font-medium">التحصيلات النقدية</span>
                      <strong className="text-emerald-800 text-sm block mt-0.5">
                        {formatMoney(totalCollected)}
                      </strong>
                      <div className="flex items-center justify-between text-[10px] text-emerald-700 mt-1">
                        <span>نسبة التحصيل:</span>
                        <span className="font-bold">{collectionRate}%</span>
                      </div>
                      <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${collectionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Pod 3: Customer Outstanding Debt */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] font-medium">الديون المعلقة على العملاء</span>
                      <strong className={`text-sm block mt-0.5 ${outstandingDebt > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                        {formatMoney(outstandingDebt)}
                      </strong>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        عبر {repCusts.filter((c) => (c.currentBalance || 0) > 0).length} عميل مدين
                      </span>
                    </div>

                    {/* Pod 4: Commission Due */}
                    <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100">
                      <span className="text-purple-700 block text-[10px] font-medium">العمولة المستحقة للصرف</span>
                      <strong className="text-purple-900 text-sm block mt-0.5">
                        {formatMoney(commissionDue)}
                      </strong>
                      <div className="flex items-center justify-between text-[10px] text-purple-600 mt-1">
                        <span>المصروف: {formatMoney(paidCommission)}</span>
                        <span>مكتسب: {formatMoney(earnedCommission)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Linked Customers Preview */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        محفظة العملاء المربوطين ({repCusts.length})
                      </span>
                      {repCusts.length > 3 && (
                        <span className="text-[10px] text-indigo-600">+{repCusts.length - 3} آخرين</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {repCusts.slice(0, 3).map((cust) => (
                        <span
                          key={cust.id}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-medium truncate max-w-[130px]"
                          title={`${cust.name} (الرصيد: ${formatMoney(cust.currentBalance || 0)})`}
                        >
                          {cust.name}
                        </span>
                      ))}
                      {repCusts.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">لا يوجد عملاء مربوطين حالياً</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRep(rep);
                      setRepDetailTab('customers');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>محفظة العملاء والتفاصيل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPayoutModal(rep, commissionDue)}
                    className="flex items-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    title="صرف دفعة عمولة فورية"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>صرف</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(rep)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                    title="تعديل المندوب"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const check = canDeleteEntity('salesRep', rep.id);
                      if (!check.canDelete) {
                        showAlert({
                          title: `تعذر حذف المندوب (${rep.name})`,
                          message: 'لا يمكن حذف ملف مندوب المبيعات للأسباب التالية:',
                          details: check.reason,
                          note: 'لا يمكن حذف مناديب المبيعات الذين لديهم حركات أو فواتير أو عمولات مسجلة في النظام.',
                          type: 'error',
                          confirmText: 'فهمت',
                        });
                        return;
                      }
                      showConfirm(
                        `هل أنت متأكد من حذف المندوب ${rep.name} نهائياً من سجلات المبيعات؟`,
                        () => {
                          deleteSalesRep(rep.id);
                        },
                        `تأكيد حذف المندوب (${rep.name})`,
                        'حذف المندوب'
                      );
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="حذف المندوب"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredRepStats.length === 0 && (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
              لا يوجد مناديب مبيعات مطابقين لمعايير البحث.
            </div>
          )}
        </div>
      )}

      {/* 4. COMPARISON MATRIX TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="p-3.5">مندوب المبيعات</th>
                  <th className="p-3.5">العملاء المربوطين</th>
                  <th className="p-3.5">المستهدف الشهري</th>
                  <th className="p-3.5">المبيعات المحققة</th>
                  <th className="p-3.5">التحصيلات الفعلية</th>
                  <th className="p-3.5">نسبة التحصيل</th>
                  <th className="p-3.5">ديون العملاء</th>
                  <th className="p-3.5">نسبة العمولة</th>
                  <th className="p-3.5">العمولة المستحقة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRepStats.map((item) => {
                  const {
                    rep,
                    customers: repCusts,
                    totalSales,
                    totalCollected,
                    collectionRate,
                    outstandingDebt,
                    commissionDue,
                    target,
                    targetProgressPct,
                  } = item;

                  let colColor = 'text-rose-700 bg-rose-50 border-rose-200';
                  if (collectionRate >= 80) colColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                  else if (collectionRate >= 50) colColor = 'text-amber-700 bg-amber-50 border-amber-200';

                  return (
                    <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs">
                            {rep.name.slice(0, 2)}
                          </div>
                          <div>
                            <div>{rep.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{rep.phone || 'بدون جوال'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                          {repCusts.length} عميل
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-500">
                        {formatMoney(target)}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{formatMoney(totalSales)}</div>
                        <div className="text-[10px] text-indigo-600 font-semibold">{targetProgressPct}% من الهدف</div>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-700">
                        {formatMoney(totalCollected)}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${colColor}`}>
                            {collectionRate}%
                          </span>
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1.5 rounded-full"
                              style={{ width: `${collectionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-rose-700">
                        {formatMoney(outstandingDebt)}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {rep.commissionRate}%
                      </td>
                      <td className="p-3.5 font-black text-purple-900">
                        {formatMoney(commissionDue)}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRep(rep);
                              setRepDetailTab('customers');
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="عرض التفاصيل والعملاء"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openPayoutModal(rep, commissionDue)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="صرف عمولة"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(rep)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. SALES REP 360° DEEP-DIVE MODAL */}
      {selectedRepStat && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-xl text-white">
                  {selectedRepStat.rep.name.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-lg text-white">{selectedRepStat.rep.name}</h3>
                    <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                      مندوب مبيعات
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
                    <span>الهاتف: {selectedRepStat.rep.phone || 'غير مسجل'}</span>
                    <span>•</span>
                    <span>البريد: {selectedRepStat.rep.email || 'غير مسجل'}</span>
                    <span>•</span>
                    <span>نسبة العمولة: <strong>{selectedRepStat.rep.commissionRate}%</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openPayoutModal(selectedRepStat.rep, selectedRepStat.commissionDue)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>صرف عمولة</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRep(null)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50 border-b border-slate-200 p-4 text-xs">
              <div className="p-2">
                <span className="text-slate-400 block text-[10px]">المبيعات المحققة</span>
                <strong className="text-slate-900 text-sm font-black">
                  {formatMoney(selectedRepStat.totalSales)}
                </strong>
                <span className="text-[10px] text-indigo-600 block">
                  {selectedRepStat.targetProgressPct}% من المستهدف ({formatMoney(selectedRepStat.target)})
                </span>
              </div>
              <div className="p-2 border-r border-slate-200">
                <span className="text-slate-400 block text-[10px]">التحصيلات الفعلية</span>
                <strong className="text-emerald-700 text-sm font-black">
                  {formatMoney(selectedRepStat.totalCollected)}
                </strong>
                <span className="text-[10px] text-emerald-600 font-bold block">
                  نسبة التحصيل: {selectedRepStat.collectionRate}%
                </span>
              </div>
              <div className="p-2 border-r border-slate-200">
                <span className="text-slate-400 block text-[10px]">ديون عملاء المندوب</span>
                <strong className="text-rose-700 text-sm font-black">
                  {formatMoney(selectedRepStat.outstandingDebt)}
                </strong>
                <span className="text-[10px] text-slate-400 block">
                  {selectedRepStat.customers.length} عميل مربوط
                </span>
              </div>
              <div className="p-2 border-r border-slate-200">
                <span className="text-slate-400 block text-[10px]">العمولة المستحقة</span>
                <strong className="text-purple-900 text-sm font-black">
                  {formatMoney(selectedRepStat.commissionDue)}
                </strong>
                <span className="text-[10px] text-purple-600 block">
                  المصروف: {formatMoney(selectedRepStat.paidCommission)}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 px-6 bg-white gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRepDetailTab('customers')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                  repDetailTab === 'customers'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                👥 العملاء المربوطين بالمندوب ({selectedRepStat.customers.length})
              </button>
              <button
                type="button"
                onClick={() => setRepDetailTab('invoices')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                  repDetailTab === 'invoices'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                📄 فواتير المبيعات ({selectedRepStat.invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setRepDetailTab('receipts')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                  repDetailTab === 'receipts'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                🧾 سندات التحصيل ({selectedRepStat.receipts.length})
              </button>
              <button
                type="button"
                onClick={() => setRepDetailTab('commissions')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                  repDetailTab === 'commissions'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                💰 العمولات وسجل الصرف ({selectedRepStat.payments.length})
              </button>
              <button
                type="button"
                onClick={() => setRepDetailTab('leads')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                  repDetailTab === 'leads'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                🎯 الفرص البيعية ({selectedRepStat.leads.length})
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh] text-xs">
              {/* TAB 1: LINKED CUSTOMERS */}
              {repDetailTab === 'customers' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-slate-500 mb-2">
                    <span className="font-semibold">قائمة العملاء المسندين للمندوب وحجم مديونياتهم:</span>
                    <span className="text-[11px] text-slate-400">إجمالي المديونية: {formatMoney(selectedRepStat.outstandingDebt)}</span>
                  </div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {selectedRepStat.customers.map((cust) => (
                      <div key={cust.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {cust.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              {cust.name}
                              {cust.company && <span className="text-[10px] text-slate-400">({cust.company})</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>كود: {cust.code || '—'}</span>
                              <span>•</span>
                              <span>هاتف: {cust.phone || 'غير مسجل'}</span>
                              <span>•</span>
                              <span>الحد الائتماني: {formatMoney(cust.creditLimit || 0)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <span className="text-[10px] text-slate-400 block">الرصيد / المديونية</span>
                            <strong className={`text-xs font-black ${(cust.currentBalance || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                              {formatMoney(cust.currentBalance || 0)}
                            </strong>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenCustomerStatement(cust.id)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>كشف حساب</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {selectedRepStat.customers.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        لا يوجد عملاء مربوطين بهذا المندوب حالياً. يمكنك ربط العملاء بالمندوب من شاشة إدارة العملاء.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: INVOICES */}
              {repDetailTab === 'invoices' && (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {selectedRepStat.invoices.map((inv) => (
                      <div key={inv.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <span>فاتورة #{inv.invoiceNumber}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{inv.issueDate}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              inv.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : inv.status === 'partial'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {inv.status === 'paid' ? 'مسددة' : inv.status === 'partial' ? 'مسددة جزئياً' : 'غير مسددة'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            العميل: <strong>{inv.customerName}</strong>
                          </div>
                        </div>

                        <div className="text-left">
                          <div className="font-black text-slate-900 text-xs">{formatMoney(inv.grandTotal)}</div>
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            المسدد: {formatMoney(inv.paidAmount || 0)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {selectedRepStat.invoices.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        لا توجد فواتير مبيعات مسجلة لهذا المندوب.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: RECEIPTS */}
              {repDetailTab === 'receipts' && (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {selectedRepStat.receipts.map((rec) => (
                      <div key={rec.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <span>سند قبض #{rec.receiptNumber}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{rec.date}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            المصدر: {rec.partyName} ({rec.partyType === 'customer' ? 'عميل' : 'طرف آخر'})
                          </div>
                        </div>

                        <div className="text-left font-black text-emerald-700 text-xs">
                          +{formatMoney(rec.amount)}
                        </div>
                      </div>
                    ))}

                    {selectedRepStat.receipts.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        لا توجد سندات قبض مسجلة لهذا المندوب.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: COMMISSIONS & PAYMENTS */}
              {repDetailTab === 'commissions' && (
                <div className="space-y-4">
                  <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-purple-700 text-xs font-bold block">ملخص عمولات المندوب</span>
                      <div className="text-[11px] text-purple-600 mt-0.5">
                        إجمالي المكتسب: <strong>{formatMoney(selectedRepStat.earnedCommission)}</strong> | المصروف سابقاً: <strong>{formatMoney(selectedRepStat.paidCommission)}</strong>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-purple-700 text-[10px] block">المستحق للصرف الآن</span>
                      <strong className="text-base font-black text-purple-900">{formatMoney(selectedRepStat.commissionDue)}</strong>
                    </div>
                  </div>

                  <div className="font-bold text-slate-700 text-xs">سجل سندات صرف العمولات:</div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {selectedRepStat.payments.map((pay) => (
                      <div key={pay.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <span>سند صرف عمولة #{pay.paymentNumber}</span>
                            <span className="text-[10px] text-slate-400">{pay.date}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            الفترة: <strong>{pay.period}</strong> | الحساب: {pay.accountName}
                          </div>
                        </div>

                        <div className="text-left font-black text-indigo-700 text-xs">
                          {formatMoney(pay.amount)}
                        </div>
                      </div>
                    ))}

                    {selectedRepStat.payments.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        لم يتم تسجيل أي سندات صرف عمولة سابقة لهذا المندوب.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: LEADS */}
              {repDetailTab === 'leads' && (
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {selectedRepStat.leads.map((lead) => (
                      <div key={lead.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                            <span>{lead.title}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              lead.stage === 'won'
                                ? 'bg-emerald-50 text-emerald-700'
                                : lead.stage === 'lost'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-indigo-50 text-indigo-700'
                            }`}>
                              {lead.stage}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            العميل: {lead.customerName} | الهاتف: {lead.phone || '—'}
                          </div>
                        </div>

                        <div className="text-left font-black text-slate-900 text-xs">
                          {formatMoney(lead.estimatedValue)}
                        </div>
                      </div>
                    ))}

                    {selectedRepStat.leads.length === 0 && (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        لا توجد فرص بيعية مسندة لهذا المندوب في خط أنابيب المبيعات.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRep(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: EDIT SALES REP */}
      {showEditRepModal && editingRep && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">تعديل بيانات مندوب المبيعات</h3>
              <button
                type="button"
                onClick={() => setShowEditRepModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRep} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">اسم المندوب <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم الجوال</label>
                  <input
                    type="text"
                    value={repPhone}
                    onChange={(e) => setRepPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={repEmail}
                    onChange={(e) => setRepEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نسبة العمولة (%) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={repCommissionRate}
                    onChange={(e) => setRepCommissionRate(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-indigo-700 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المستهدف البيعي الشهري</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={repSalesTarget}
                  onChange={(e) => setRepSalesTarget(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={repNotes}
                  onChange={(e) => setRepNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditRepModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: QUICK COMMISSION PAYOUT */}
      {showPayoutModal && payoutTargetRep && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">صرف عمولة مبيعات</h3>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayout} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-indigo-50 text-indigo-900 rounded-xl border border-indigo-200">
                المندوب المستفيد: <strong>{payoutTargetRep.name}</strong> (عمولة {payoutTargetRep.commissionRate}%)
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المبلغ المراد صرفه <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-black text-emerald-700 text-base focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">عن فترة / شهر</label>
                <input
                  type="text"
                  required
                  value={payoutPeriod}
                  onChange={(e) => setPayoutPeriod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">حساب السداد (الخزينة أو البنك) <span className="text-rose-500">*</span></label>
                <select
                  value={payoutAccountId}
                  onChange={(e) => setPayoutAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:border-indigo-500 focus:outline-hidden"
                >
                  {paymentAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.code}) - الرصيد: {formatMoney(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات السند</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="ملاحظات محاسبية..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] rounded-xl border border-emerald-200">
                ✨ سيتم تلقائياً إنشاء قيد يومية مزدوج (مدين: مصروف العمولات 5230 / دائن: حساب السداد).
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  تأكيد وصرف العمولة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
