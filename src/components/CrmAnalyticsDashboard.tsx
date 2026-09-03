import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import {
  Trophy,
  Users,
  Award,
  TrendingUp,
  PackageCheck,
  DollarSign,
  MapPin,
  PieChart as PieChartIcon,
  BarChart3,
  Percent,
  Sparkles,
  ArrowUpRight,
  ShoppingBag,
  Target,
  BadgeCheck,
  Building,
  Calendar,
  Layers,
  Phone,
  UserCheck,
  Star,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { CUSTOMER_CATEGORIES, ACQUISITION_CHANNELS } from '../data/regionsData';

export const CrmAnalyticsDashboard: React.FC = () => {
  const {
    customers,
    salesReps,
    products,
    salesInvoices,
    formatMoney,
    currency,
  } = useErp();

  const [timeRange, setTimeRange] = useState<'all' | 'year' | 'quarter' | 'month'>('all');

  // Filter invoices by time range
  const filteredInvoices = useMemo(() => {
    if (timeRange === 'all') return salesInvoices;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return salesInvoices.filter((inv) => {
      const invDate = new Date(inv.date);
      if (isNaN(invDate.getTime())) return true;
      if (timeRange === 'year') {
        return invDate.getFullYear() === currentYear;
      }
      if (timeRange === 'month') {
        return (
          invDate.getFullYear() === currentYear && invDate.getMonth() === currentMonth
        );
      }
      if (timeRange === 'quarter') {
        const invQuarter = Math.floor(invDate.getMonth() / 3);
        const currentQuarter = Math.floor(currentMonth / 3);
        return invDate.getFullYear() === currentYear && invQuarter === currentQuarter;
      }
      return true;
    });
  }, [salesInvoices, timeRange]);

  // =========================================================================
  // 1. TOP 5 SALES REPRESENTATIVES CALCULATION
  // =========================================================================
  const topSalesReps = useMemo(() => {
    // Map reps with sales from invoices
    const repStatsMap: Record<
      string,
      {
        id: string;
        code: string;
        name: string;
        phone: string;
        commissionRate: number;
        salesTarget: number;
        totalSales: number;
        invoicesCount: number;
        customersServed: Set<string>;
      }
    > = {};

    // Initialize all existing sales reps
    salesReps.forEach((rep) => {
      repStatsMap[rep.id] = {
        id: rep.id,
        code: rep.code,
        name: rep.name,
        phone: rep.phone,
        commissionRate: rep.commissionRate || 3,
        salesTarget: rep.monthlySalesTarget || rep.salesTarget || 50000,
        totalSales: rep.totalSalesAchieved || 0,
        invoicesCount: 0,
        customersServed: new Set<string>(),
      };
    });

    // Aggregate invoice sales by rep
    filteredInvoices.forEach((inv) => {
      if (inv.salesRepId && repStatsMap[inv.salesRepId]) {
        repStatsMap[inv.salesRepId].totalSales += inv.grandTotal;
        repStatsMap[inv.salesRepId].invoicesCount += 1;
        if (inv.customerId) {
          repStatsMap[inv.salesRepId].customersServed.add(inv.customerId);
        }
      } else if (inv.salesRepName) {
        const found = Object.values(repStatsMap).find((r) => r.name === inv.salesRepName);
        if (found) {
          found.totalSales += inv.grandTotal;
          found.invoicesCount += 1;
          if (inv.customerId) found.customersServed.add(inv.customerId);
        }
      }
    });

    // Sort descending and take top 5
    const list = Object.values(repStatsMap)
      .map((r) => {
        const commissionEarned = (r.totalSales * r.commissionRate) / 100;
        const targetPercent =
          r.salesTarget > 0 ? Math.min(100, Math.round((r.totalSales / r.salesTarget) * 100)) : 0;
        return {
          ...r,
          customerCount: r.customersServed.size,
          commissionEarned,
          targetPercent,
        };
      })
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    return list;
  }, [salesReps, filteredInvoices]);

  // =========================================================================
  // 2. TOP 5 CUSTOMERS CALCULATION (BY REVENUE / LTV)
  // =========================================================================
  const topCustomers = useMemo(() => {
    const custStatsMap: Record<
      string,
      {
        id: string;
        code: string;
        name: string;
        companyName: string;
        phone: string;
        governorate: string;
        region?: string;
        customerCategory: string;
        totalPurchases: number;
        invoicesCount: number;
        loyaltyPoints: number;
        currentBalance: number;
      }
    > = {};

    customers.forEach((c) => {
      custStatsMap[c.id] = {
        id: c.id,
        code: c.code,
        name: c.name,
        companyName: c.companyName || c.name,
        phone: c.phone,
        governorate: c.governorate || 'غير محدد',
        region: c.region,
        customerCategory: c.customerCategory || 'retail',
        totalPurchases: 0,
        invoicesCount: 0,
        loyaltyPoints: c.loyaltyPoints || 0,
        currentBalance: c.currentBalance || 0,
      };
    });

    filteredInvoices.forEach((inv) => {
      if (inv.customerId && custStatsMap[inv.customerId]) {
        custStatsMap[inv.customerId].totalPurchases += inv.grandTotal;
        custStatsMap[inv.customerId].invoicesCount += 1;
      }
    });

    return Object.values(custStatsMap)
      .sort((a, b) => b.totalPurchases - a.totalPurchases)
      .slice(0, 5);
  }, [customers, filteredInvoices]);

  // =========================================================================
  // 3. MOST PROFITABLE PRODUCTS CALCULATION
  // =========================================================================
  const profitableProducts = useMemo(() => {
    const prodStatsMap: Record<
      string,
      {
        id: string;
        sku: string;
        name: string;
        category: string;
        brand?: string;
        costPrice: number;
        sellingPrice: number;
        unitMargin: number;
        unitMarginPercent: number;
        unitsSold: number;
        totalRevenue: number;
        totalGrossProfit: number;
      }
    > = {};

    // Initialize all products
    products.forEach((p) => {
      const unitMargin = p.sellingPrice - p.costPrice;
      const unitMarginPercent =
        p.sellingPrice > 0 ? Math.round((unitMargin / p.sellingPrice) * 100) : 0;
      prodStatsMap[p.id] = {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        brand: p.brand,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        unitMargin,
        unitMarginPercent,
        unitsSold: 0,
        totalRevenue: 0,
        totalGrossProfit: 0,
      };
    });

    // Aggregate sold units and gross profits from invoice items
    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (prodStatsMap[item.productId]) {
          const p = prodStatsMap[item.productId];
          p.unitsSold += item.quantity;
          p.totalRevenue += item.total;
          const cost = p.costPrice * item.quantity;
          p.totalGrossProfit += item.total - cost;
        }
      });
    });

    // If no invoices exist yet, rank by potential profit margin
    const list = Object.values(prodStatsMap).map((p) => {
      if (p.unitsSold === 0) {
        // compute estimated profit on current stock / unit price
        const estimatedProfit = p.unitMargin * (products.find((x) => x.id === p.id)?.stockQuantity || 1);
        return {
          ...p,
          totalGrossProfit: p.totalGrossProfit > 0 ? p.totalGrossProfit : estimatedProfit,
          totalRevenue: p.totalRevenue > 0 ? p.totalRevenue : p.sellingPrice,
        };
      }
      return p;
    });

    return list.sort((a, b) => b.totalGrossProfit - a.totalGrossProfit).slice(0, 5);
  }, [products, filteredInvoices]);

  // =========================================================================
  // 4. GEOGRAPHIC DISTRIBUTION (BY GOVERNORATE)
  // =========================================================================
  const geographicData = useMemo(() => {
    const govMap: Record<string, { governorate: string; customersCount: number; salesRevenue: number }> =
      {};

    customers.forEach((c) => {
      const gov = c.governorate || 'القاهرة';
      if (!govMap[gov]) {
        govMap[gov] = { governorate: gov, customersCount: 0, salesRevenue: 0 };
      }
      govMap[gov].customersCount += 1;
    });

    filteredInvoices.forEach((inv) => {
      const customer = customers.find((c) => c.id === inv.customerId);
      const gov = customer?.governorate || 'القاهرة';
      if (!govMap[gov]) {
        govMap[gov] = { governorate: gov, customersCount: 0, salesRevenue: 0 };
      }
      govMap[gov].salesRevenue += inv.grandTotal;
    });

    return Object.values(govMap)
      .sort((a, b) => b.salesRevenue - a.salesRevenue)
      .slice(0, 8);
  }, [customers, filteredInvoices]);

  // =========================================================================
  // 5. CUSTOMER SEGMENTS & ACQUISITION CHANNELS
  // =========================================================================
  const categoryChartData = useMemo(() => {
    const countMap: Record<string, number> = {};
    customers.forEach((c) => {
      const cat = c.customerCategory || 'retail';
      countMap[cat] = (countMap[cat] || 0) + 1;
    });

    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
    return CUSTOMER_CATEGORIES.map((cat, idx) => ({
      name: cat.label.split('(')[0].trim(),
      value: countMap[cat.id] || 0,
      color: colors[idx % colors.length],
    })).filter((item) => item.value > 0);
  }, [customers]);

  const channelChartData = useMemo(() => {
    const countMap: Record<string, number> = {};
    customers.forEach((c) => {
      const ch = c.acquisitionChannel || 'direct';
      countMap[ch] = (countMap[ch] || 0) + 1;
    });

    const colors = ['#06b6d4', '#6366f1', '#10b981', '#f97316', '#a855f7', '#e11d48'];
    return ACQUISITION_CHANNELS.map((ch, idx) => ({
      name: ch.label.split('(')[0].trim(),
      value: countMap[ch.id] || 0,
      color: colors[idx % colors.length],
    })).filter((item) => item.value > 0);
  }, [customers]);

  // Palette colors
  const CHART_COLORS = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-300" dir="rtl">
      {/* Top Header & Range Filter */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-inner shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>تحليلات الأداء والـ CRM المتقدمة</span>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                Live Insights
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              لوحة قيادة تفاعلية: أفضل 5 مناديب، كبار العملاء، المنتجات الأعلى ربحية والتحليل الجغرافي
            </p>
          </div>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              timeRange === 'all'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            كل الفترات
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('year')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              timeRange === 'year'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هذا العام
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('quarter')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              timeRange === 'quarter'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هذا الربع
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              timeRange === 'month'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هذا الشهر
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: TOP 5 SALES REPRESENTATIVES                                    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <span>أفضل 5 مناديب مبيعات (Top 5 Sales Reps)</span>
                <span className="text-[11px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  لوحة الشرف والعمولات
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                ترتيب المناديب حسب إجمالي المبيعات المحققة، نسبة الإنجاز والعمولة المكتسبة
              </p>
            </div>
          </div>
        </div>

        {topSalesReps.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            لا توجد بيانات مبيعات مسجلة للمناديب حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Cards List (7 Cols) */}
            <div className="lg:col-span-7 space-y-3">
              {topSalesReps.map((rep, idx) => {
                const badgeColor =
                  idx === 0
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                    : idx === 1
                    ? 'bg-slate-300 text-slate-900 ring-2 ring-slate-200'
                    : idx === 2
                    ? 'bg-amber-700 text-white ring-2 ring-amber-600'
                    : 'bg-slate-100 text-slate-600 border border-slate-300';

                return (
                  <div
                    key={rep.id}
                    className="bg-slate-50/80 hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${badgeColor}`}
                      >
                        #{idx + 1}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                          <span>{rep.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {rep.code}
                          </span>
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="font-mono">{rep.phone || 'غير مسجل'}</span>
                          </span>
                          <span>•</span>
                          <span>{rep.customerCount} عملاء مخدومين</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold">
                            عمولة {rep.commissionRate}% ({formatMoney(rep.commissionEarned)})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                      <span className="text-xs text-slate-500 sm:text-[11px]">إجمالي المبيعات</span>
                      <span className="text-sm sm:text-base font-black font-mono text-emerald-700">
                        {formatMoney(rep.totalSales)}
                      </span>
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden hidden sm:block">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${rep.targetPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rep Performance Chart (5 Cols) */}
            <div className="lg:col-span-5 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80">
              <h5 className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
                <span>مقارنة مبيعات المناديب</span>
                <span className="text-[10px] text-slate-400 font-normal">قيمة المبيعات بالـ {currency}</span>
              </h5>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topSalesReps.map((r) => ({
                      name: r.name.split(' ')[0],
                      sales: r.totalSales,
                      commission: r.commissionEarned,
                    }))}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(val: any) => [formatMoney(val), '']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '11px',
                        textAlign: 'right',
                        direction: 'rtl',
                      }}
                    />
                    <Bar dataKey="sales" name="المبيعات المحققة" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="commission" name="العمولة" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: TOP 5 CUSTOMERS & TOP PROFITABLE PRODUCTS                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Customers */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-200 flex items-center justify-center">
                <Star className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  أفضل 5 عملاء (Top 5 Customers)
                </h3>
                <p className="text-[11px] text-slate-500">حسب إجمالي قيمة المشتريات والولاء</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {topCustomers.map((cust, idx) => (
              <div
                key={cust.id}
                className="p-3 bg-slate-50 hover:bg-blue-50/40 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{cust.name}</h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-slate-400" />
                      <span>{cust.governorate}</span>
                      {cust.region && <span>- {cust.region}</span>}
                    </p>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div className="font-mono font-black text-xs text-blue-700">
                    {formatMoney(cust.totalPurchases)}
                  </div>
                  <span className="text-[10px] text-slate-400">{cust.invoicesCount} فاتورة</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Profitable Products */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  المنتجات الأعلى ربحية (Most Profitable)
                </h3>
                <p className="text-[11px] text-slate-500">حسب إجمالي هامش الربح المحقق</p>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            {profitableProducts.map((prod, idx) => (
              <div
                key={prod.id}
                className="p-3 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{prod.name}</h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="text-emerald-700 font-bold">
                        هامش {prod.unitMarginPercent}%
                      </span>
                      <span>•</span>
                      <span>سعر البيع: {formatMoney(prod.sellingPrice)}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left shrink-0">
                  <div className="font-mono font-black text-xs text-emerald-700">
                    +{formatMoney(prod.totalGrossProfit)}
                  </div>
                  <span className="text-[10px] text-slate-400">إجمالي الأرباح</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: GEOGRAPHIC ANALYSIS & CUSTOMER DEMOGRAPHICS                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geographic Distribution by Governorate */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-200 flex items-center justify-center">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  التوزيع الجغرافي للمبيعات والعملاء (Governorates)
                </h3>
                <p className="text-[11px] text-slate-500">حجم المبيعات وعدد العملاء في كل محافظة</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geographicData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="governorate" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'salesRevenue' ? formatMoney(val) : `${val} عميل`,
                    name === 'salesRevenue' ? 'المبيعات' : 'العملاء',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                    textAlign: 'right',
                    direction: 'rtl',
                  }}
                />
                <Bar
                  dataKey="salesRevenue"
                  name="salesRevenue"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Categories & Segments Donut Chart */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200 flex items-center justify-center">
                <PieChartIcon className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">تصنيفات العملاء (Segments)</h3>
                <p className="text-[10px] text-slate-500">توزيع قاعدة العملاء حسب الفئة</p>
              </div>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {categoryChartData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-700 font-medium">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900 font-mono">{cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
