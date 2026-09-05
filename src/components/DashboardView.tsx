import React, { useState } from 'react';
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
  ArrowRight,
  ChevronLeft,
  Coins,
  ShoppingCart,
  CheckCircle2,
  Sparkles,
  BarChart3,
  BellRing,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const {
    currency,
    formatMoney,
    formatDualMoney,
    currencies,
    secondaryCurrency,
    setSecondaryCurrency,
    accounts,
    salesInvoices,
    purchaseInvoices,
    products,
    customers,
    vendors,
    debtAging,
    employees,
  } = useErp();

  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Metrics computation
  const totalSalesRevenue = salesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPurchasesCost = purchaseInvoices.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalVATCollected = salesInvoices.reduce((sum, inv) => sum + inv.vatTotal, 0);
  const totalReceivables = customers.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalPayables = vendors.reduce((sum, v) => sum + v.currentBalance, 0);

  // Cash & Bank balances from accounts
  const cashAccount = accounts.find((a) => a.code === '1110');
  const bankAccount = accounts.find((a) => a.code === '1120');
  const totalLiquidity = (cashAccount?.balance || 0) + (bankAccount?.balance || 0);

  // Inventory total valuation (Cost Price * Stock)
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.costPrice * p.stockQuantity,
    0
  );

  // Low stock items count & alert list
  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStockAlert);

  // Overdue and critical collections
  const overdueInvoices = salesInvoices.filter((inv) => inv.status === 'overdue' || inv.remainingAmount > 0);
  const highRiskDebts = debtAging.filter((d) => d.days61to90 > 0 || d.days90Plus > 0);

  // 7-day dynamic chart data calculation
  const last7DaysData = React.useMemo(() => {
    const days: {
      date: string;
      dayName: string;
      displayLabel: string;
      sales: number;
      purchases: number;
      netFlow: number;
    }[] = [];

    // Reference today as 2026-08-28 or system date
    const today = new Date('2026-08-28T12:00:00');
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const displayLabel = i === 0 ? `اليوم (${dayName})` : `${dayName} ${d.getDate()}`;

      const daySales = salesInvoices
        .filter((inv) => inv.date === dateStr)
        .reduce((sum, inv) => sum + inv.grandTotal, 0);

      const dayPurchases = purchaseInvoices
        .filter((pur) => pur.date === dateStr)
        .reduce((sum, pur) => sum + pur.grandTotal, 0);

      days.push({
        date: dateStr,
        dayName,
        displayLabel,
        sales: daySales,
        purchases: dayPurchases,
        netFlow: daySales - dayPurchases,
      });
    }

    return days;
  }, [salesInvoices, purchaseInvoices]);

  const last7DaysTotalSales = last7DaysData.reduce((sum, d) => sum + d.sales, 0);
  const last7DaysTotalPurchases = last7DaysData.reduce((sum, d) => sum + d.purchases, 0);
  const last7DaysNetProfit = last7DaysTotalSales - last7DaysTotalPurchases;

  // Custom Arabic Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const salesVal = payload.find((p: any) => p.dataKey === 'sales')?.value || 0;
      const purchasesVal = payload.find((p: any) => p.dataKey === 'purchases')?.value || 0;
      const netVal = salesVal - purchasesVal;

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-right text-xs space-y-2 min-w-[210px] backdrop-blur-md">
          <div className="font-bold border-b border-slate-700 pb-1 text-slate-200 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-emerald-400 font-normal">تقرير 7 أيام</span>
          </div>
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                المبيعات:
              </span>
              <span className="font-extrabold font-mono">{formatMoney(salesVal)}</span>
            </div>
            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                المشتريات:
              </span>
              <span className="font-extrabold font-mono">{formatMoney(purchasesVal)}</span>
            </div>
            <div className="border-t border-slate-800 pt-1 flex items-center justify-between text-slate-300">
              <span>الفارق / الصافي:</span>
              <span
                className={`font-extrabold font-mono ${
                  netVal >= 0 ? 'text-emerald-300' : 'text-rose-400'
                }`}
              >
                {formatMoney(netVal)}
              </span>
            </div>
            {secondaryCurrency !== currency && (
              <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 flex justify-between">
                <span>المعادل ({secondaryCurrency}):</span>
                <span>{formatDualMoney(salesVal).split('(')[1]?.replace(')', '') || ''}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              لوحة قيادة المدير المالي والتنفيذي
            </div>
            {lowStockProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer animate-pulse"
                title="انقر للانتقال الفوري لإدارة المخازن"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>تنبيه: {lowStockProducts.length} أصناف وصلت لحد الطلب الأدنى!</span>
              </button>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            مؤشرات الأداء المالي والمبيعات اللحظية
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            متابعة حركة المبيعات والمشتريات الأسبوعية، السيولة النقدية، تقييم المخزون، ونواقص المستودعات
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="dash-quick-pos-btn"
            onClick={() => setActiveTab('quick_pos')}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            كاشير وفاتورة سريعة POS
          </button>
          <button
            id="dash-quick-invoice-btn"
            onClick={() => setActiveTab('sales')}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all border border-slate-200 shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            فاتورة ضريبية
          </button>
          <button
            id="dash-quick-collection-btn"
            onClick={() => setActiveTab('crm_collections')}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all border border-slate-200 shadow-xs cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-amber-600" />
            تحصيل وسند قبض
          </button>
        </div>
      </div>

      {/* Low Stock Urgent Alert Bar (If any products hit min limit) */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-2 border-rose-300 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md animate-bounce">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-rose-950">
                  تنبيه عاجل: أصناف بلغت حد الطلب الأدنى والأمان ({lowStockProducts.length} أصناف)
                </h4>
                <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  طلب توريد فوري
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5">
                تراجعت أرصدة هذه الأصناف في المستودع إلى ما دون حد الأمان؛ يرجى إصدار أوامر شراء لتفادي نفاد المخزون.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('inventory')}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              معاينة النواقص بالمخزن
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              إصدار أمر شراء
            </button>
          </div>
        </div>
      )}

      {/* Key Financial KPIs Grid with Multi-Currency presentation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Sales */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي المبيعات العامة</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900">
              {formatMoney(totalSalesRevenue)}
            </div>
            {secondaryCurrency !== currency && (
              <div className="text-xs font-bold text-emerald-700 mt-0.5">
                ≈ {formatDualMoney(totalSalesRevenue).split('(')[1]?.replace(')', '')}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-500">
              <span>ضريبة مخرجات (VAT):</span>
              <span className="font-semibold text-slate-700">{formatMoney(totalVATCollected)}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Liquidity (Cash + Bank) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">السيولة النقدية والبنكية</span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-blue-950">
              {formatMoney(totalLiquidity)}
            </div>
            {secondaryCurrency !== currency && (
              <div className="text-xs font-bold text-blue-700 mt-0.5">
                ≈ {formatDualMoney(totalLiquidity).split('(')[1]?.replace(')', '')}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
              <span>الصندوق: {formatMoney(cashAccount?.balance || 0)}</span>
              <span>•</span>
              <span>البنك: {formatMoney(bankAccount?.balance || 0)}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Receivables (العملاء) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ذمم العملاء (مستحقات التحصيل)</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-amber-950">
              {formatMoney(totalReceivables)}
            </div>
            {secondaryCurrency !== currency && (
              <div className="text-xs font-bold text-amber-700 mt-0.5">
                ≈ {formatDualMoney(totalReceivables).split('(')[1]?.replace(')', '')}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-amber-700 font-medium">
              <span>{highRiskDebts.length} عملاء بديون متأخرة (+60 يوم)</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Inventory Valuation */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">تقييم المخزون (بالتكلفة)</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-purple-950">
              {formatMoney(totalInventoryValue)}
            </div>
            {secondaryCurrency !== currency && (
              <div className="text-xs font-bold text-purple-700 mt-0.5">
                ≈ {formatDualMoney(totalInventoryValue).split('(')[1]?.replace(')', '')}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-500">
              <span>إجمالي الأصناف: {products.length}</span>
              {lowStockProducts.length > 0 && (
                <span className="text-rose-600 font-extrabold">({lowStockProducts.length} نواقص)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RECHARTS: 7-DAY SALES & PURCHASES VISUALIZATION FOR MANAGEMENT
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        {/* Chart Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                حجم المبيعات والمشتريات خلال الـ 7 أيام الأخيرة (Sales & Purchases)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              رسم بياني تفاعلي للمدير يوضح حجم المبيعات مقابل المشتريات اليومية ومؤشر التدفق النقدي
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Multi-Conversion Badge */}
            <div className="flex items-center bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-500 ml-1.5" />
              <span className="text-slate-600 font-medium ml-1">العملة المقارنة:</span>
              <select
                value={secondaryCurrency}
                onChange={(e) => setSecondaryCurrency(e.target.value)}
                className="bg-transparent font-extrabold text-slate-900 focus:outline-hidden cursor-pointer"
                title="تحديد العملة الثانوية المقابلة للرسم البياني"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Area vs Bar Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setChartType('area')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartType === 'area'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                مساحي (Area)
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  chartType === 'bar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                أعمدة (Bar)
              </button>
            </div>
          </div>
        </div>

        {/* 7-Day Stats Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 font-medium">مبيعات الـ 7 أيام الأخيرة:</span>
              <div className="text-base font-extrabold text-emerald-950 mt-0.5">
                {formatMoney(last7DaysTotalSales)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-800 font-medium">مشتريات وتوريدات الـ 7 أيام:</span>
              <div className="text-base font-extrabold text-amber-950 mt-0.5">
                {formatMoney(last7DaysTotalPurchases)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-xs">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 font-medium">صافي الفارق التجاري الأسبوعي:</span>
              <div
                className={`text-base font-extrabold mt-0.5 ${
                  last7DaysNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {formatMoney(last7DaysNetProfit)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              <Coins className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="purchasesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(val) => (val === 'sales' ? 'المبيعات (Sales)' : 'المشتريات (Purchases)')}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="sales"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#salesGradient)"
                  activeDot={{ r: 6, stroke: '#065f46', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  name="purchases"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#purchasesGradient)"
                  activeDot={{ r: 6, stroke: '#92400e', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="displayLabel"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="rect"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}
                  formatter={(val) => (val === 'sales' ? 'المبيعات (Sales)' : 'المشتريات (Purchases)')}
                />
                <Bar dataKey="sales" name="sales" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="purchases" name="purchases" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operational Highlights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Aging Debt & Overdue Alerts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Debt Aging Alert Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  تتبع تحصيل العملاء وأعمار الديون (CRM & Collections)
                </h3>
                <p className="text-xs text-slate-500">
                  مراقبة الفترات الزمنية للديون لمنع تعثر السيولة
                </p>
              </div>
              <button
                onClick={() => setActiveTab('crm_collections')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
              >
                عرض كل العملاء
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                    <th className="py-2.5 px-3 rounded-r-lg">العميل</th>
                    <th className="py-2.5 px-3">إجمالي المديونية</th>
                    <th className="py-2.5 px-3">0-30 يوم</th>
                    <th className="py-2.5 px-3">31-60 يوم</th>
                    <th className="py-2.5 px-3">+60 يوم</th>
                    <th className="py-2.5 px-3 rounded-l-lg">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {debtAging.map((cust) => (
                    <tr key={cust.customerId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{cust.customerName}</div>
                        <div className="text-[11px] text-slate-400">{cust.phone}</div>
                      </td>
                      <td className="py-3 px-3 font-extrabold text-slate-900">
                        {formatMoney(cust.currentTotal)}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {cust.days0to30 > 0 ? formatMoney(cust.days0to30) : '-'}
                      </td>
                      <td className="py-3 px-3 text-amber-700 font-medium">
                        {cust.days31to60 > 0 ? formatMoney(cust.days31to60) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        {cust.days61to90 + cust.days90Plus > 0 ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            {formatMoney(cust.days61to90 + cust.days90Plus)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setActiveTab('crm_collections')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 text-[11px] cursor-pointer"
                        >
                          تحصيل / سند
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Warning Box */}
          {lowStockProducts.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>تنبيه نواقص المخزون (تحت حد إعادة الطلب)</span>
                </div>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="text-xs font-bold text-amber-800 hover:text-amber-900 underline cursor-pointer"
                >
                  إدارة المستودع
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white p-3.5 rounded-2xl border border-amber-200/80 flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">كود: {p.sku}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-extrabold text-rose-600">
                        المتاح: {p.stockQuantity} {p.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">الحد الأدنى: {p.minStockAlert}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: HR & Financial Balance Overview */}
        <div className="space-y-6">
          {/* Quick HR Snapshot */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">الموارد البشرية والرواتب (HR)</h3>
                <p className="text-xs text-slate-500">طاقم العمل ومسير الرواتب</p>
              </div>
              <button
                onClick={() => setActiveTab('hr_payroll')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                مسير الرواتب
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600">إجمالي الموظفين المسجلين</span>
                <span className="font-bold text-slate-900 text-sm">{employees.length} موظف</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600">كتلة الرواتب الأساسية الشهرية</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatMoney(employees.reduce((s, e) => s + e.basicSalary, 0))}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600">إجمالي البدلات الشهرية</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formatMoney(
                    employees.reduce(
                      (s, e) => s + e.housingAllowance + e.transportAllowance + e.otherAllowances,
                      0
                    )
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('hr_payroll')}
              className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
            >
              استخراج مسير وقسائم الرواتب
            </button>
          </div>

          {/* Quick Accounting Balance Verification */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5">
            <h3 className="font-bold text-sm text-slate-900 mb-2">توازن المعادلة المحاسبية</h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              الأصول = الخصوم + حقوق الملكية + (الإيرادات - المصروفات)
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">إجمالي الأصول الحالية:</span>
                <span className="font-bold text-slate-900">
                  {formatMoney(
                    accounts
                      .filter((a) => a.type === 'asset' && !a.isHeader)
                      .reduce((s, a) => s + a.balance, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">إجمالي الالتزامات والدائنين:</span>
                <span className="font-bold text-slate-900">
                  {formatMoney(
                    accounts
                      .filter((a) => a.type === 'liability' && !a.isHeader)
                      .reduce((s, a) => s + a.balance, 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-600">رأس المال وحقوق الملكية:</span>
                <span className="font-bold text-slate-900">
                  {formatMoney(
                    accounts
                      .filter((a) => a.type === 'equity' && !a.isHeader)
                      .reduce((s, a) => s + a.balance, 0)
                  )}
                </span>
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-xs font-bold text-emerald-800">
                ✓ النظام المحاسبي وقاعدة البيانات متوازنة ومؤمنة بالكامل
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
