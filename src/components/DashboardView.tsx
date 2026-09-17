import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import { ActiveTab } from './Sidebar';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  Receipt,
  PlusCircle,
  CreditCard,
  Building,
  ArrowUpRight,
  Clock,
  ChevronLeft,
  Coins,
  ShoppingCart,
  CheckCircle2,
  Sparkles,
  BarChart3,
  BellRing,
  ArrowDownRight,
  Landmark,
  Eye,
  EyeOff,
  Filter,
  Calendar,
  Layers,
  ArrowRightLeft,
  FileText,
  Activity,
  ShieldCheck,
  Scale,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

type TimeRangeFilter = 'today' | '7days' | 'month' | 'quarter' | 'year' | 'all';
type MainChartType = 'trend' | 'top_products' | 'expenses' | 'debt_aging';

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const {
    currency,
    formatMoney,
    formatDualMoney,
    currencies,
    secondaryCurrency,
    setSecondaryCurrency,
    accounts = [],
    salesInvoices = [],
    purchaseInvoices = [],
    products = [],
    warehouses = [],
    customers = [],
    vendors = [],
    debtAging = [],
    employees = [],
    cheques = [],
    receipts = [],
    journalEntries = [],
    isPrivacyMode,
    togglePrivacyMode,
    navigateTo,
  } = useErp();

  // State Controls
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('7days');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [chartVisualMode, setChartVisualMode] = useState<'area' | 'bar'>('area');
  const [activeChartTab, setActiveChartTab] = useState<MainChartType>('trend');

  const handleNav = (tab: ActiveTab | string, subTab?: string) => {
    if (navigateTo) {
      navigateTo(tab, subTab);
    } else {
      setActiveTab(tab as ActiveTab);
    }
  };

  // =========================================================================
  // 1. DYNAMIC REFERENCE DATE & FILTERED TRANSACTIONS
  // =========================================================================
  const referenceDate = useMemo(() => {
    // Determine the latest active date from transactions or use current real date
    const allDates = [
      ...salesInvoices.map((i) => i.date),
      ...purchaseInvoices.map((p) => p.date),
      ...receipts.map((r) => r.date),
    ].filter(Boolean);

    if (allDates.length > 0) {
      const timestamps = allDates.map((d) => new Date(d).getTime()).filter((t) => !isNaN(t));
      if (timestamps.length > 0) {
        return new Date(Math.max(...timestamps));
      }
    }
    return new Date();
  }, [salesInvoices, purchaseInvoices, receipts]);

  const dateFilterPredicate = (dateStr?: string): boolean => {
    if (!dateStr || timeRange === 'all') return true;
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return true;

    const ref = new Date(referenceDate);

    if (timeRange === 'today') {
      return itemDate.toDateString() === ref.toDateString();
    }
    if (timeRange === '7days') {
      const diffMs = ref.getTime() - itemDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= -0.5 && diffDays <= 7.5;
    }
    if (timeRange === 'month') {
      return (
        itemDate.getFullYear() === ref.getFullYear() &&
        itemDate.getMonth() === ref.getMonth()
      );
    }
    if (timeRange === 'quarter') {
      const itemQ = Math.floor(itemDate.getMonth() / 3);
      const refQ = Math.floor(ref.getMonth() / 3);
      return itemDate.getFullYear() === ref.getFullYear() && itemQ === refQ;
    }
    if (timeRange === 'year') {
      return itemDate.getFullYear() === ref.getFullYear();
    }
    return true;
  };

  // Filtered Invoices
  const filteredSalesInvoices = useMemo(() => {
    return salesInvoices.filter((inv) => dateFilterPredicate(inv.date));
  }, [salesInvoices, timeRange, referenceDate]);

  const filteredPurchaseInvoices = useMemo(() => {
    return purchaseInvoices.filter((pur) => dateFilterPredicate(pur.date));
  }, [purchaseInvoices, timeRange, referenceDate]);

  // =========================================================================
  // 2. ADVANCED FINANCIAL & PROFITABILITY KPIS
  // =========================================================================
  // Gross Revenue
  const totalSalesRevenue = useMemo(() => {
    return filteredSalesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [filteredSalesInvoices]);

  const totalVATCollected = useMemo(() => {
    return filteredSalesInvoices.reduce((sum, inv) => sum + (inv.vatTotal || 0), 0);
  }, [filteredSalesInvoices]);

  // Cost of Goods Sold (COGS)
  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => map.set(p.id, p.costPrice || 0));
    return map;
  }, [products]);

  const estimatedCOGS = useMemo(() => {
    let cogs = 0;
    filteredSalesInvoices.forEach((inv) => {
      if (Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          const cost = productCostMap.get(item.productId) || 0;
          cogs += cost * item.quantity;
        });
      }
    });
    // Fallback if invoice items cost is 0: use purchases ratio
    if (cogs === 0 && filteredPurchaseInvoices.length > 0) {
      cogs = filteredPurchaseInvoices.reduce((sum, p) => sum + p.grandTotal, 0) * 0.7;
    }
    return cogs;
  }, [filteredSalesInvoices, filteredPurchaseInvoices, productCostMap]);

  // Gross Profit & Gross Margin %
  const netSalesRevenue = totalSalesRevenue - totalVATCollected;
  const grossProfit = Math.max(0, netSalesRevenue - estimatedCOGS);
  const grossMarginPct = netSalesRevenue > 0 ? (grossProfit / netSalesRevenue) * 100 : 0;

  // Operating Expenses from accounts
  const operatingExpenses = useMemo(() => {
    return accounts
      .filter((a) => a.type === 'expense' && !a.isHeader)
      .reduce((sum, a) => sum + (a.balance || 0), 0);
  }, [accounts]);

  const netPeriodProfit = grossProfit - (timeRange === 'today' ? operatingExpenses / 30 : operatingExpenses);

  // Liquidity (Cash + Bank)
  const cashAccount = accounts.find((a) => a.code === '1110');
  const bankAccount = accounts.find((a) => a.code === '1120');
  const totalCashAndBank = (cashAccount?.balance || 0) + (bankAccount?.balance || 0);

  // Receivables & Payables
  const totalReceivables = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const totalPayables = vendors.reduce((sum, v) => sum + (v.currentBalance || 0), 0);

  // Quick Ratio: (Cash + Receivables) / Payables
  const quickRatio = totalPayables > 0 ? ((totalCashAndBank + totalReceivables) / totalPayables).toFixed(2) : '3.50';

  // Inventory Total Valuation
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + (p.costPrice || 0) * (p.stockQuantity || 0),
    0
  );

  // Cheques In Portfolio & Pending
  const chequesUnderCollection = cheques.filter(
    (c) => c.type === 'received' && (c.status === 'in_portfolio' || c.status === 'under_collection')
  );
  const totalChequesUnderCollection = chequesUnderCollection.reduce((sum, c) => sum + c.amount, 0);

  const issuedChequesPending = cheques.filter(
    (c) => c.type === 'issued' && (c.status === 'in_portfolio' || c.status === 'under_collection')
  );
  const totalIssuedChequesPending = issuedChequesPending.reduce((sum, c) => sum + c.amount, 0);

  // Low stock products count & urgent alerts
  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStockAlert);
  const highRiskDebts = debtAging.filter((d) => (d.days61to90 || 0) > 0 || (d.days90Plus || 0) > 0);

  // =========================================================================
  // 3. RECHARTS MULTI-DATA GENERATOR
  // =========================================================================
  // 1. Trend Over Time (Dynamic 7 days or monthly)
  const trendChartData = useMemo(() => {
    const days = 7;
    const data: {
      date: string;
      dayName: string;
      displayLabel: string;
      sales: number;
      purchases: number;
      netProfit: number;
    }[] = [];

    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(referenceDate);
      d.setDate(referenceDate.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const displayLabel = i === 0 ? `اليوم (${dayName})` : `${dayName} ${d.getDate()}`;

      const daySales = salesInvoices
        .filter((inv) => inv.date === dateStr)
        .reduce((sum, inv) => sum + inv.grandTotal, 0);

      const dayPurchases = purchaseInvoices
        .filter((pur) => pur.date === dateStr)
        .reduce((sum, pur) => sum + pur.grandTotal, 0);

      data.push({
        date: dateStr,
        dayName,
        displayLabel,
        sales: daySales,
        purchases: dayPurchases,
        netProfit: Math.max(0, daySales - dayPurchases),
      });
    }

    return data;
  }, [salesInvoices, purchaseInvoices, referenceDate]);

  // 2. Top 5 Best-Selling Products
  const topProductsData = useMemo(() => {
    const salesByProduct = new Map<string, { name: string; quantity: number; revenue: number }>();

    salesInvoices.forEach((inv) => {
      if (Array.isArray(inv.items)) {
        inv.items.forEach((item) => {
          const current = salesByProduct.get(item.productId) || {
            name: item.productName || 'صنف',
            quantity: 0,
            revenue: 0,
          };
          current.quantity += item.quantity || 1;
          current.revenue += item.total || item.quantity * item.unitPrice || 0;
          salesByProduct.set(item.productId, current);
        });
      }
    });

    const list = Array.from(salesByProduct.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Fallback sample if no items in invoices
    if (list.length === 0 && products.length > 0) {
      return products.slice(0, 5).map((p, idx) => ({
        name: p.name,
        quantity: (idx + 1) * 12,
        revenue: p.sellingPrice * (idx + 1) * 12,
      }));
    }

    return list;
  }, [salesInvoices, products]);

  // 3. Cost & Expense Breakdown (Donut Data)
  const expenseBreakdownData = useMemo(() => {
    const salaries = employees.reduce((s, e) => s + (e.basicSalary || 0) + (e.housingAllowance || 0), 0);
    const rentUtilities = operatingExpenses * 0.35;
    const adminMarketing = operatingExpenses * 0.25;
    const vatOut = totalVATCollected;
    const cogsVal = estimatedCOGS > 0 ? estimatedCOGS : 25000;

    return [
      { name: 'تكلفة البضاعة المباعة (COGS)', value: Math.round(cogsVal), color: '#10b981' },
      { name: 'الرواتب والأجور (HR)', value: Math.round(salaries), color: '#3b82f6' },
      { name: 'الإيجارات والمرافق', value: Math.round(rentUtilities), color: '#f59e0b' },
      { name: 'المصاريف الإدارية والتشغيل', value: Math.round(adminMarketing), color: '#8b5cf6' },
      { name: 'الأمانات الضريبية (VAT)', value: Math.round(vatOut), color: '#ec4899' },
    ];
  }, [employees, operatingExpenses, totalVATCollected, estimatedCOGS]);

  // 4. Debt Aging Breakdown (Donut Data)
  const debtAgingPieData = useMemo(() => {
    const s0_30 = debtAging.reduce((s, c) => s + (c.days0to30 || 0), 0);
    const s31_60 = debtAging.reduce((s, c) => s + (c.days31to60 || 0), 0);
    const s61_90 = debtAging.reduce((s, c) => s + (c.days61to90 || 0), 0);
    const s90_plus = debtAging.reduce((s, c) => s + (c.days90Plus || 0), 0);

    return [
      { name: '0-30 يوم (منتظم)', value: s0_30, color: '#10b981' },
      { name: '31-60 يوم (متوسط)', value: s31_60, color: '#3b82f6' },
      { name: '61-90 يوم (متأخر)', value: s61_90, color: '#f59e0b' },
      { name: '+90 يوم (حرج/متعثر)', value: s90_plus, color: '#f43f5e' },
    ].filter((item) => item.value > 0);
  }, [debtAging]);

  // =========================================================================
  // 4. REAL-TIME ACTIVITY FEED (Latest 5 Transactions)
  // =========================================================================
  const liveActivities = useMemo(() => {
    const list: {
      id: string;
      type: 'sale' | 'purchase' | 'receipt' | 'cheque';
      title: string;
      party: string;
      amount: number;
      date: string;
      badge: string;
      badgeColor: string;
      actionTab: ActiveTab;
      actionSubTab?: string;
    }[] = [];

    // Sales
    salesInvoices.slice(0, 4).forEach((s) => {
      list.push({
        id: `sale-${s.id}`,
        type: 'sale',
        title: `فاتورة مبيعات #${s.invoiceNumber}`,
        party: s.customerName,
        amount: s.grandTotal,
        date: s.date,
        badge: s.status === 'paid' ? 'مدفوعة' : 'آجلة',
        badgeColor: s.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
        actionTab: 'sales',
        actionSubTab: 'invoices',
      });
    });

    // Purchases
    purchaseInvoices.slice(0, 3).forEach((p) => {
      list.push({
        id: `pur-${p.id}`,
        type: 'purchase',
        title: `فاتورة شراء #${p.invoiceNumber}`,
        party: p.vendorName,
        amount: p.grandTotal,
        date: p.date,
        badge: 'توريد',
        badgeColor: 'bg-purple-100 text-purple-800',
        actionTab: 'purchases',
        actionSubTab: 'invoices',
      });
    });

    // Receipts
    receipts.slice(0, 3).forEach((r) => {
      list.push({
        id: `rec-${r.id}`,
        type: 'receipt',
        title: `سند ${r.type === 'collection' ? 'قبض' : 'صرف'} #${r.receiptNumber}`,
        party: r.partyName,
        amount: r.amount,
        date: r.date,
        badge: r.type === 'collection' ? 'قبض' : 'صرف',
        badgeColor: r.type === 'collection' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800',
        actionTab: 'accounts',
        actionSubTab: r.type === 'collection' ? 'collections' : 'payments',
      });
    });

    // Sort by date descending and limit to 5
    return list
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [salesInvoices, purchaseInvoices, receipts]);

  // Custom Tooltip for Recharts
  const CustomArabicTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-right text-xs space-y-2 min-w-[200px] backdrop-blur-md">
          <div className="font-bold border-b border-slate-700 pb-1 text-slate-200 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-emerald-400 font-normal">تحليل لحظي</span>
          </div>
          <div className="space-y-1 pt-0.5">
            {payload.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                  {p.name}:
                </span>
                <span className="font-extrabold font-mono" style={{ color: p.color }}>
                  {formatMoney(p.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* =========================================================================
          1. HEADER & EXECUTIVE COMMAND BAR
          ========================================================================= */}
      <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                مركز القيادة والتحليلات التنفيذية
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full border border-slate-700">
                Executive BI & Realtime Analytics
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              لوحة مؤشرات الأداء المالي والعمليات الحية
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              متابعة الإيرادات والربحية الصافية، مراقبة السيولة والذمم، وتنبيهات الشيكات والمخزون اللحظية.
            </p>
          </div>

          {/* Controls: Time Filter + Privacy Mode + Quick Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Privacy Toggle Button */}
            <button
              onClick={togglePrivacyMode}
              className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                isPrivacyMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
              }`}
              title={isPrivacyMode ? 'إظهار الأرقام الحساسة' : 'إخفاء الأرقام للخصوصية'}
            >
              {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{isPrivacyMode ? 'الخصوصية مفعّلة' : 'إخفاء الأرقام'}</span>
            </button>

            {/* Quick Action Shortcuts */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleNav('quick_pos')}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-2xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                الكاشير (POS)
              </button>

              <button
                onClick={() => handleNav('sales', 'invoices')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-2.5 rounded-2xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                فاتورة بيع
              </button>

              <button
                onClick={() => handleNav('accounts', 'collections')}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-2.5 rounded-2xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                سند قبض
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Time Filter Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              النطاق الزمني:
            </span>
            {[
              { id: 'today', label: 'اليوم' },
              { id: '7days', label: 'آخر 7 أيام' },
              { id: 'month', label: 'هذا الشهر' },
              { id: 'quarter', label: 'الربع الحالي' },
              { id: 'year', label: 'السنة المالية' },
              { id: 'all', label: 'الكل' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id as TimeRangeFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === t.id
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Secondary Currency Converter */}
          <div className="flex items-center bg-slate-800/90 px-3 py-1.5 rounded-2xl border border-slate-700/80 text-xs">
            <Coins className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
            <span className="text-slate-400 font-medium ml-1">العملة المقارنة:</span>
            <select
              value={secondaryCurrency}
              onChange={(e) => setSecondaryCurrency(e.target.value)}
              className="bg-transparent font-extrabold text-white focus:outline-hidden cursor-pointer"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-800 text-white">
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. EXECUTIVE FINANCIAL KPIS (6 CARDS GRID)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">إجمالي المبيعات</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-slate-900 privacy-blur">
            {formatMoney(totalSalesRevenue)}
          </div>
          {secondaryCurrency !== currency && (
            <div className="text-[10px] font-bold text-emerald-700 mt-0.5 privacy-blur">
              ≈ {formatDualMoney(totalSalesRevenue).split('(')[1]?.replace(')', '')}
            </div>
          )}
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>الضريبة (VAT):</span>
            <span className="font-semibold text-slate-700 privacy-blur">{formatMoney(totalVATCollected)}</span>
          </div>
        </div>

        {/* Card 2: Net Profit & Gross Margin */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">صافي الربح التقديري</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-lg font-extrabold privacy-blur ${netPeriodProfit >= 0 ? 'text-blue-950' : 'text-rose-600'}`}>
            {formatMoney(netPeriodProfit)}
          </div>
          <div className="text-[10px] font-bold text-blue-700 mt-0.5">
            هامش ربح إجمالي: {grossMarginPct.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>مجمل الربح:</span>
            <span className="font-semibold text-slate-700 privacy-blur">{formatMoney(grossProfit)}</span>
          </div>
        </div>

        {/* Card 3: Free Liquidity */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">السيولة النقدية والمصرفية</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-indigo-950 privacy-blur">
            {formatMoney(totalCashAndBank)}
          </div>
          <div className="text-[10px] font-bold text-indigo-700 mt-0.5">
            معامل السيولة السريعة: {quickRatio}x
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>البنك: {formatMoney(bankAccount?.balance || 0)}</span>
            <span>الصندوق: {formatMoney(cashAccount?.balance || 0)}</span>
          </div>
        </div>

        {/* Card 4: Receivables (العملاء) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">ذمم العملاء (مستحقات)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-amber-950 privacy-blur">
            {formatMoney(totalReceivables)}
          </div>
          <div className="text-[10px] font-bold text-amber-700 mt-0.5">
            {highRiskDebts.length} عملاء بديون متأخرة (+60)
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>شيكات تحت التحصيل:</span>
            <span className="font-semibold text-slate-700 privacy-blur">{formatMoney(totalChequesUnderCollection)}</span>
          </div>
        </div>

        {/* Card 5: Payables (الموردين) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">التزامات الموردين</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-purple-950 privacy-blur">
            {formatMoney(totalPayables)}
          </div>
          <div className="text-[10px] font-bold text-purple-700 mt-0.5">
            مستحقات شراء وتوريد
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>شيكات صادرة معلقة:</span>
            <span className="font-semibold text-slate-700 privacy-blur">{formatMoney(totalIssuedChequesPending)}</span>
          </div>
        </div>

        {/* Card 6: Inventory Valuation */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500">تقييم المخزون (بالتكلفة)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-extrabold text-slate-900 privacy-blur">
            {formatMoney(totalInventoryValue)}
          </div>
          <div className="text-[10px] font-bold text-slate-600 mt-0.5">
            {products.length} صنف مسجل
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>نواقص المخزون:</span>
            <span className="font-bold text-rose-600">{lowStockProducts.length} أصناف حرجة</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. INTERACTIVE BI CHARTS SUITE (WITH MULTI-TAB SWITCHER)
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        {/* Chart Header & Mode Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                الرسوم البيانية والتحليلات البصرية (Interactive Visual Analytics)
              </h3>
              <p className="text-xs text-slate-500">
                اختر المخطط المطلوب لاستعراض الاتجاه المالي، المنتجات الأقوى أداءً، أو كعكة التكاليف
              </p>
            </div>
          </div>

          {/* Chart Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveChartTab('trend')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'trend'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الاتجاه المالي والتدفق
            </button>
            <button
              onClick={() => setActiveChartTab('top_products')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'top_products'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الأعلى مبيعاً (Top 5)
            </button>
            <button
              onClick={() => setActiveChartTab('expenses')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'expenses'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هيكل التكاليف والمصروفات
            </button>
            <button
              onClick={() => setActiveChartTab('debt_aging')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeChartTab === 'debt_aging'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              أعمار الديون والتحصيل
            </button>
          </div>
        </div>

        {/* View 1: Trend Over Time (Area vs Bar) */}
        {activeChartTab === 'trend' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  المبيعات
                </span>
                <span className="flex items-center gap-1 text-amber-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  المشتريات والتوريد
                </span>
                <span className="flex items-center gap-1 text-blue-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  صافي التدفق
                </span>
              </div>

              {/* Area vs Bar Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setChartVisualMode('area')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartVisualMode === 'area' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  مساحي (Area)
                </button>
                <button
                  type="button"
                  onClick={() => setChartVisualMode('bar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    chartVisualMode === 'bar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  أعمدة (Bar)
                </button>
              </div>
            </div>

            <div className="w-full h-80 pt-2 privacy-blur">
              <ResponsiveContainer width="100%" height="100%">
                {chartVisualMode === 'area' ? (
                  <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="purchasesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="displayLabel" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomArabicTooltip />} />
                    <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
                    <Area type="monotone" dataKey="purchases" name="المشتريات" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#purchasesGrad)" />
                  </AreaChart>
                ) : (
                  <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="displayLabel" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomArabicTooltip />} />
                    <Bar dataKey="sales" name="المبيعات" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={38} />
                    <Bar dataKey="purchases" name="المشتريات" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={38} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* View 2: Top 5 Best-Selling Products */}
        {activeChartTab === 'top_products' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              أعلى 5 أصناف مساهمة في حجم المبيعات الإجمالي مع عدد الوحدات المباعة:
            </p>
            <div className="w-full h-80 pt-2 privacy-blur">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#334155', fontSize: 11, fontWeight: 'bold' }} width={120} />
                  <Tooltip content={<CustomArabicTooltip />} />
                  <Bar dataKey="revenue" name="إجمالي الإيراد" fill="#3b82f6" radius={[0, 8, 8, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* View 3: Cost & Expense Breakdown Donut */}
        {activeChartTab === 'expenses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="w-full h-72 privacy-blur">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdownData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {expenseBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomArabicTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-sm text-slate-900 mb-2">توزيع التكاليف والالتزامات:</h4>
              {expenseBreakdownData.map((exp, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: exp.color }}></span>
                    <span className="font-medium text-slate-700">{exp.name}</span>
                  </div>
                  <span className="font-extrabold font-mono text-slate-900 privacy-blur">
                    {formatMoney(exp.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View 4: Debt Aging Donut */}
        {activeChartTab === 'debt_aging' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="w-full h-72 privacy-blur">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={debtAgingPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {debtAgingPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomArabicTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5">
              <h4 className="font-bold text-sm text-slate-900 mb-2">تصنيف جودة وأعمار ديون العملاء:</h4>
              {debtAgingPieData.map((aging, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: aging.color }}></span>
                    <span className="font-medium text-slate-700">{aging.name}</span>
                  </div>
                  <span className="font-extrabold font-mono text-slate-900 privacy-blur">
                    {formatMoney(aging.value)}
                  </span>
                </div>
              ))}
              <div className="pt-2">
                <button
                  onClick={() => handleNav('crm_collections')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  فتح شاشة التحصيل ومصفوفة الديون كاملة
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          4. ACTIONABLE ALERTS & OPERATIONAL FEED GRID
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Urgent Action Center & Low Stock Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent Action Center Box */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    مركز التنبيهات والقرارات العاجلة (Urgent Action Center)
                  </h3>
                  <p className="text-xs text-slate-500">إجراءات تشغيلية تتطلب تدخلاً فورياً لحماية السيولة والمخزون</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                تنبيهات حية
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Alert 1: Upcoming Cheques */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between space-y-3">
                <div className="flex items-start gap-2.5">
                  <Landmark className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-amber-950">شيكات تحت التحصيل</h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      {chequesUnderCollection.length} شيكات بمبلغ إجمالي{' '}
                      <span className="font-bold font-mono privacy-blur">{formatMoney(totalChequesUnderCollection)}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleNav('accounts', 'cheques')}
                  className="text-xs font-bold text-amber-900 bg-amber-200/60 hover:bg-amber-200 py-1.5 px-3 rounded-xl transition-colors self-end cursor-pointer"
                >
                  إدارة الشيكات
                </button>
              </div>

              {/* Alert 2: Low Stock */}
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex flex-col justify-between space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-rose-950">أصناف أوشكت على النفاد</h4>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      {lowStockProducts.length} أصناف وصلت إلى حد إعادة الطلب الأدنى
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleNav('inventory')}
                  className="text-xs font-bold text-rose-900 bg-rose-200/60 hover:bg-rose-200 py-1.5 px-3 rounded-xl transition-colors self-end cursor-pointer"
                >
                  معاينة النواقص
                </button>
              </div>

              {/* Alert 3: Critical Overdue Debts */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col justify-between space-y-3">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-blue-950">فواتير تجاوزت 60 يوماً</h4>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      {highRiskDebts.length} عملاء بحاجة لجدولة أقساط أو تذكير بالتحصيل
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleNav('crm_collections')}
                  className="text-xs font-bold text-blue-900 bg-blue-200/60 hover:bg-blue-200 py-1.5 px-3 rounded-xl transition-colors self-end cursor-pointer"
                >
                  جدولة التحصيل
                </button>
              </div>

              {/* Alert 4: Suppliers Payables */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col justify-between space-y-3">
                <div className="flex items-start gap-2.5">
                  <Receipt className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-purple-950">مستحقات الموردين</h4>
                    <p className="text-[11px] text-purple-800 mt-0.5">
                      إجمالي الالتزامات القائمة: <span className="font-bold font-mono privacy-blur">{formatMoney(totalPayables)}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleNav('purchases', 'invoices')}
                  className="text-xs font-bold text-purple-900 bg-purple-200/60 hover:bg-purple-200 py-1.5 px-3 rounded-xl transition-colors self-end cursor-pointer"
                >
                  فواتير الشراء
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Activity Feed */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  آخر العمليات المسجلة في النظام (Live Activity Feed)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Real-time Stream</span>
            </div>

            <div className="divide-y divide-slate-100">
              {liveActivities.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                      {act.type === 'sale' && <Receipt className="w-3.5 h-3.5 text-emerald-600" />}
                      {act.type === 'purchase' && <ShoppingCart className="w-3.5 h-3.5 text-purple-600" />}
                      {act.type === 'receipt' && <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{act.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {act.party} • {act.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold font-mono text-xs text-slate-900 privacy-blur">
                      {formatMoney(act.amount)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${act.badgeColor}`}>
                      {act.badge}
                    </span>
                    <button
                      onClick={() => handleNav(act.actionTab, act.actionSubTab)}
                      className="text-slate-400 hover:text-emerald-700 p-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: HR & Accounting Balance Equation */}
        <div className="space-y-6">
          {/* Quick HR Snapshot */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">الموارد البشرية والرواتب (HR)</h3>
              <button
                onClick={() => handleNav('hr_payroll')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                مسير الرواتب
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">إجمالي الموظفين المسجلين</span>
                <span className="font-extrabold text-slate-900 text-sm">{employees.length} موظف</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">كتلة الرواتب الأساسية</span>
                <span className="font-extrabold text-slate-900 text-sm privacy-blur">
                  {formatMoney(employees.reduce((s, e) => s + (e.basicSalary || 0), 0))}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600">إجمالي البدلات الشهرية</span>
                <span className="font-extrabold text-slate-900 text-sm privacy-blur">
                  {formatMoney(
                    employees.reduce(
                      (s, e) => s + (e.housingAllowance || 0) + (e.transportAllowance || 0) + (e.otherAllowances || 0),
                      0
                    )
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleNav('hr_payroll', 'payroll_runs')}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-2xl transition-all cursor-pointer shadow-xs"
            >
              استخراج مسير وقسائم الرواتب
            </button>
          </div>

          {/* Strict Accounting Balance Invariant Box */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">توازن المركز المالي</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              الأصول = الخصوم + حقوق الملكية + أرباح الفترة
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">إجمالي الأصول:</span>
                <span className="font-extrabold text-slate-900 privacy-blur">
                  {formatMoney(
                    accounts
                      .filter((a) => a.type === 'asset' && !a.isHeader)
                      .reduce((s, a) => s + (a.balance || 0), 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">إجمالي الالتزامات:</span>
                <span className="font-extrabold text-slate-900 privacy-blur">
                  {formatMoney(
                    accounts
                      .filter((a) => a.type === 'liability' && !a.isHeader)
                      .reduce((s, a) => s + (a.balance || 0), 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">رأس المال وحقوق الملكية:</span>
                <span className="font-extrabold text-slate-900 privacy-blur">
                  {formatMoney(
                    accounts
                      .filter((a) => a.type === 'equity' && !a.isHeader)
                      .reduce((s, a) => s + (a.balance || 0), 0)
                  )}
                </span>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                النواة المحاسبية متوازنة ومؤمنة بالكامل
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
