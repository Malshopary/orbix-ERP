import React, { useState, useMemo, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import {
  TrendingUp,
  CreditCard,
  Package,
  PieChart,
  Users2,
  Clock,
  Target,
  FileBadge,
  RotateCcw,
  Receipt,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  Percent,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Eye,
  FileSpreadsheet,
  Award,
  Wallet,
  Building,
  UserCheck,
} from 'lucide-react';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import { PrintPreviewModal } from './PrintPreviewModal';
import { DocumentViewerModal } from './DocumentViewerModal';
import { CustomerStatementModal } from './CustomerStatementModal';

export type SalesReportType =
  | 'sales_summary'
  | 'sales_by_payment'
  | 'sales_top_products'
  | 'sales_profit_margin'
  | 'sales_by_customer'
  | 'sales_inactive_customers'
  | 'sales_rep_performance'
  | 'sales_quotes_conversion'
  | 'sales_returns_analysis';

export const SALES_REPORT_META: Record<
  SalesReportType,
  {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  sales_summary: {
    title: 'تقرير ملخص المبيعات الدوري والتحليلي',
    subtitle: 'إجمالي المبيعات، الخصومات، ضريبة القيمة المضافة، وصافي الإيرادات المحققة',
    icon: TrendingUp,
  },
  sales_by_payment: {
    title: 'تقرير المبيعات حسب طرق الدفع والتحصيل',
    subtitle: 'تحليل التدفقات النقدية: نقدي، شبكة ومدى، تحويل بنكي، شيكات، وآجل',
    icon: CreditCard,
  },
  sales_top_products: {
    title: 'تقرير الأصناف الأكثر مبيعاً والأعلى ربحية',
    subtitle: 'ترتيب المنتجات حسب الكميات المباعة، إجمالي الإيراد، وهوامش الربح لكل صنف',
    icon: Package,
  },
  sales_profit_margin: {
    title: 'تقرير هوامش ومجمل ربح المبيعات (Gross Profit)',
    subtitle: 'مقارنة سعر البيع بتكلفة البضاعة المباعة (COGS) واحتساب مجمل الربح لكل فاتورة',
    icon: PieChart,
  },
  sales_by_customer: {
    title: 'تقرير تحليل مبيعات كبار العملاء (قاعدة 80/20)',
    subtitle: 'تصنيف العملاء حسب حجم الشراء، متوسط قيمة الفاتورة، وحصتهم من إجمالي الإيرادات',
    icon: Users2,
  },
  sales_inactive_customers: {
    title: 'تقرير العملاء الراكدين وغير النشطين',
    subtitle: 'حصر العملاء الذين انقطعوا عن الشراء لفترات متباعدة لإعادة تنشيطهم واستهدافهم',
    icon: Clock,
  },
  sales_rep_performance: {
    title: 'تقرير أداء مناديب المبيعات وتحقيق المستهدف',
    subtitle: 'مقارنة المبيعات المحققة بالتارجت الشهري، ونسب التحقيق، والعمولات المستحقة',
    icon: Target,
  },
  sales_quotes_conversion: {
    title: 'تقرير كفاءة ومعدل تحويل عروض الأسعار والطلبيات',
    subtitle: 'تتبع عروض الأسعار الصادرة ومعدل تحويلها إلى فواتير بيع فعلية (Conversion Rate)',
    icon: FileBadge,
  },
  sales_returns_analysis: {
    title: 'تقرير تحليل مرتجعات المبيعات والإشعارات الدائنة',
    subtitle: 'نسبة المرتجعات إلى إجمالي المبيعات، والأصناف الأكثر إرجاعاً، والأسباب',
    icon: RotateCcw,
  },
};

export const SalesReportsView: React.FC = () => {
  const {
    companyProfile,
    currency,
    formatMoney,
    salesInvoices = [],
    quotations = [],
    salesOrders = [],
    salesReturns = [],
    customers = [],
    products = [],
    salesReps = [],
    receipts = [],
    activeSubTab,
  } = useErp();

  // Determine active report based on activeSubTab
  const [reportType, setReportTypeLocal] = useState<SalesReportType>(() => {
    const validKeys: SalesReportType[] = [
      'sales_summary',
      'sales_by_payment',
      'sales_top_products',
      'sales_profit_margin',
      'sales_by_customer',
      'sales_inactive_customers',
      'sales_rep_performance',
      'sales_quotes_conversion',
      'sales_returns_analysis',
    ];
    if (activeSubTab && validKeys.includes(activeSubTab as SalesReportType)) {
      return activeSubTab as SalesReportType;
    }
    return 'sales_summary';
  });

  useEffect(() => {
    const validKeys: SalesReportType[] = [
      'sales_summary',
      'sales_by_payment',
      'sales_top_products',
      'sales_profit_margin',
      'sales_by_customer',
      'sales_inactive_customers',
      'sales_rep_performance',
      'sales_quotes_conversion',
      'sales_returns_analysis',
    ];
    if (activeSubTab && validKeys.includes(activeSubTab as SalesReportType)) {
      setReportTypeLocal(activeSubTab as SalesReportType);
    }
  }, [activeSubTab]);

  const currentMeta = SALES_REPORT_META[reportType] || SALES_REPORT_META.sales_summary;
  const CurrentIcon = currentMeta.icon;

  // Universal Filters
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [dateFrom, setDateFrom] = useState<string>(`${currentYear}-01-01`);
  const [dateTo, setDateTo] = useState<string>(`${currentYear}-12-31`);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [selectedSalesRepId, setSelectedSalesRepId] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [inactiveDaysThreshold, setInactiveDaysThreshold] = useState<number>(60);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeDocViewer, setActiveDocViewer] = useState<{ id: string; type: 'invoice' | 'quotation' | 'order' | 'return' } | null>(null);
  const [statementCustomerId, setStatementCustomerId] = useState<string | null>(null);

  // Quick Preset Handlers
  const handleSetPreset = (preset: 'today' | 'this_month' | 'this_quarter' | 'this_year' | 'all') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'today') {
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setDateFrom(firstDay);
      setDateTo(todayStr);
    } else if (preset === 'this_quarter') {
      const q = Math.floor(now.getMonth() / 3);
      const startMonth = String(q * 3 + 1).padStart(2, '0');
      setDateFrom(`${now.getFullYear()}-${startMonth}-01`);
      setDateTo(todayStr);
    } else if (preset === 'this_year') {
      setDateFrom(`${now.getFullYear()}-01-01`);
      setDateTo(`${now.getFullYear()}-12-31`);
    } else if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    }
  };

  // Filtered Sales Invoices
  const filteredInvoices = useMemo(() => {
    return salesInvoices.filter((inv) => {
      if (dateFrom && inv.date < dateFrom) return false;
      if (dateTo && inv.date > dateTo) return false;
      if (selectedCustomerId !== 'all' && inv.customerId !== selectedCustomerId) return false;
      if (selectedSalesRepId !== 'all') {
        const cust = customers.find((c) => c.id === inv.customerId);
        if (cust?.salesRepId !== selectedSalesRepId) return false;
      }
      if (selectedPaymentMethod !== 'all' && inv.paymentMethod !== selectedPaymentMethod) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchesCustomer = inv.customerName?.toLowerCase().includes(q);
        if (!matchesNumber && !matchesCustomer) return false;
      }
      return true;
    });
  }, [salesInvoices, dateFrom, dateTo, selectedCustomerId, selectedSalesRepId, selectedPaymentMethod, searchQuery, customers]);

  // Filtered Sales Returns
  const filteredReturns = useMemo(() => {
    return salesReturns.filter((ret) => {
      if (dateFrom && ret.date < dateFrom) return false;
      if (dateTo && ret.date > dateTo) return false;
      if (selectedCustomerId !== 'all' && ret.customerId !== selectedCustomerId) return false;
      return true;
    });
  }, [salesReturns, dateFrom, dateTo, selectedCustomerId]);

  // ----------------------------------------------------
  // REPORT 1 CALCULATIONS: Sales Summary
  // ----------------------------------------------------
  const summaryMetrics = useMemo(() => {
    let grossTotal = 0;
    let discountTotal = 0;
    let vatTotal = 0;
    let grandTotal = 0;
    let paidTotal = 0;
    let remainingTotal = 0;

    filteredInvoices.forEach((inv) => {
      const subtotal = inv.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
      const invDiscount = (inv.items.reduce((s, i) => s + (i.discount || 0), 0)) + (inv.discountTotal || 0);
      grossTotal += subtotal;
      discountTotal += invDiscount;
      vatTotal += (inv.vatTotal || 0);
      grandTotal += (inv.grandTotal || 0);
      paidTotal += (inv.paidAmount || 0);
      remainingTotal += (inv.remainingAmount || 0);
    });

    const netSales = Math.max(0, grossTotal - discountTotal);
    const invoiceCount = filteredInvoices.length;
    const avgInvoiceValue = invoiceCount > 0 ? grandTotal / invoiceCount : 0;

    const totalReturnAmount = filteredReturns.reduce((s, r) => s + (r.totalRefundAmount || 0), 0);
    const netRevenueAfterReturns = Math.max(0, grandTotal - totalReturnAmount);

    return {
      grossTotal,
      discountTotal,
      netSales,
      vatTotal,
      grandTotal,
      paidTotal,
      remainingTotal,
      invoiceCount,
      avgInvoiceValue,
      totalReturnAmount,
      netRevenueAfterReturns,
    };
  }, [filteredInvoices, filteredReturns]);

  // ----------------------------------------------------
  // REPORT 2 CALCULATIONS: Sales by Payment Method
  // ----------------------------------------------------
  const paymentMethodStats = useMemo(() => {
    const methods: Record<string, { label: string; count: number; total: number; paid: number; remaining: number }> = {
      cash: { label: 'نقداً بالصندوق (Cash)', count: 0, total: 0, paid: 0, remaining: 0 },
      card: { label: 'بطاقة / شبكة مدى (Card/POS)', count: 0, total: 0, paid: 0, remaining: 0 },
      bank_transfer: { label: 'تحويل بنكي (Transfer)', count: 0, total: 0, paid: 0, remaining: 0 },
      cheque: { label: 'شيك مصرفي (Cheque)', count: 0, total: 0, paid: 0, remaining: 0 },
      credit: { label: 'آجل على الحساب (On Account)', count: 0, total: 0, paid: 0, remaining: 0 },
    };

    filteredInvoices.forEach((inv) => {
      const m = inv.paymentMethod || 'cash';
      if (!methods[m]) {
        methods[m] = { label: m, count: 0, total: 0, paid: 0, remaining: 0 };
      }
      methods[m].count += 1;
      methods[m].total += inv.grandTotal;
      methods[m].paid += (inv.paidAmount || 0);
      methods[m].remaining += (inv.remainingAmount || 0);
    });

    const totalSalesAll = Object.values(methods).reduce((s, m) => s + m.total, 0);

    return Object.entries(methods).map(([key, data]) => ({
      key,
      ...data,
      percent: totalSalesAll > 0 ? (data.total / totalSalesAll) * 100 : 0,
    }));
  }, [filteredInvoices]);

  // ----------------------------------------------------
  // REPORT 3 CALCULATIONS: Top Selling & Most Profitable Products
  // ----------------------------------------------------
  const productSalesStats = useMemo(() => {
    const map = new Map<
      string,
      {
        productId: string;
        productName: string;
        category: string;
        quantitySold: number;
        revenue: number;
        cost: number;
        profit: number;
        profitMargin: number;
        currentStock: number;
      }
    >();

    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const purchasePrice = prod?.purchasePrice || 0;
        const lineRevenue = item.total || (item.quantity * item.unitPrice);
        const lineCost = item.quantity * purchasePrice;
        const lineProfit = lineRevenue - lineCost;

        const current = map.get(item.productId) || {
          productId: item.productId,
          productName: item.productName || prod?.name || 'صنف غير محدد',
          category: prod?.category || 'عام',
          quantitySold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          profitMargin: 0,
          currentStock: prod?.stockQuantity || 0,
        };

        current.quantitySold += item.quantity;
        current.revenue += lineRevenue;
        current.cost += lineCost;
        current.profit += lineProfit;

        map.set(item.productId, current);
      });
    });

    const list = Array.from(map.values()).map((p) => ({
      ...p,
      profitMargin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
      avgSellingPrice: p.quantitySold > 0 ? p.revenue / p.quantitySold : 0,
    }));

    // Sort descending by revenue
    list.sort((a, b) => b.revenue - a.revenue);
    return list;
  }, [filteredInvoices, products]);

  // ----------------------------------------------------
  // REPORT 4 CALCULATIONS: Gross Profit Margins by Invoice
  // ----------------------------------------------------
  const invoiceProfitStats = useMemo(() => {
    let totalRev = 0;
    let totalCogs = 0;

    const list = filteredInvoices.map((inv) => {
      let invCost = 0;
      inv.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const costPrice = prod?.purchasePrice || 0;
        invCost += item.quantity * costPrice;
      });

      const revenue = inv.grandTotal;
      const grossProfit = revenue - invCost;
      const marginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

      totalRev += revenue;
      totalCogs += invCost;

      return {
        invoice: inv,
        revenue,
        cost: invCost,
        grossProfit,
        marginPercent,
      };
    });

    const totalProfit = totalRev - totalCogs;
    const overallMargin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

    return {
      items: list,
      totalRevenue: totalRev,
      totalCogs,
      totalProfit,
      overallMargin,
    };
  }, [filteredInvoices, products]);

  // ----------------------------------------------------
  // REPORT 5 CALCULATIONS: Customer Pareto & Sales Analysis
  // ----------------------------------------------------
  const customerSalesStats = useMemo(() => {
    const map = new Map<
      string,
      {
        customer: (typeof customers)[0];
        totalPurchases: number;
        invoiceCount: number;
        paidAmount: number;
        remainingAmount: number;
        lastPurchaseDate: string;
      }
    >();

    filteredInvoices.forEach((inv) => {
      const cust = customers.find((c) => c.id === inv.customerId) || {
        id: inv.customerId,
        name: inv.customerName,
        phone: '',
        code: '',
        currentBalance: 0,
        category: 'regular',
      };

      const current = map.get(inv.customerId) || {
        customer: cust as any,
        totalPurchases: 0,
        invoiceCount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        lastPurchaseDate: inv.date,
      };

      current.totalPurchases += inv.grandTotal;
      current.invoiceCount += 1;
      current.paidAmount += (inv.paidAmount || 0);
      current.remainingAmount += (inv.remainingAmount || 0);
      if (inv.date > current.lastPurchaseDate) {
        current.lastPurchaseDate = inv.date;
      }

      map.set(inv.customerId, current);
    });

    const list = Array.from(map.values());
    list.sort((a, b) => b.totalPurchases - a.totalPurchases);

    const grandSales = list.reduce((s, c) => s + c.totalPurchases, 0);

    let cumulative = 0;
    return list.map((item, index) => {
      const share = grandSales > 0 ? (item.totalPurchases / grandSales) * 100 : 0;
      cumulative += share;
      const isTop80 = cumulative <= 80 || index === 0;

      let tier = 'برونزي';
      let tierColor = 'bg-amber-50 text-amber-800 border-amber-200';
      if (index < 3 || share >= 15) {
        tier = 'VIP ذهبي';
        tierColor = 'bg-yellow-100 text-yellow-900 border-yellow-300 font-black';
      } else if (isTop80) {
        tier = 'فئة A فضي';
        tierColor = 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
      }

      return {
        ...item,
        share,
        cumulative,
        isTop80,
        tier,
        tierColor,
        avgOrderValue: item.invoiceCount > 0 ? item.totalPurchases / item.invoiceCount : 0,
      };
    });
  }, [filteredInvoices, customers]);

  // ----------------------------------------------------
  // REPORT 6 CALCULATIONS: Inactive Customers
  // ----------------------------------------------------
  const inactiveCustomersList = useMemo(() => {
    const now = new Date().getTime();

    return customers.map((c) => {
      const custInvoices = salesInvoices.filter((i) => i.customerId === c.id);
      custInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const lastInvoice = custInvoices[0];
      const lastDate = lastInvoice ? lastInvoice.date : null;
      let daysInactive = 9999;

      if (lastDate) {
        const lastTime = new Date(lastDate).getTime();
        daysInactive = Math.floor((now - lastTime) / (1000 * 60 * 60 * 24));
      }

      const totalHistoricalPurchases = custInvoices.reduce((s, i) => s + i.grandTotal, 0);

      return {
        customer: c,
        lastPurchaseDate: lastDate,
        daysInactive,
        invoiceCount: custInvoices.length,
        totalHistoricalPurchases,
        currentBalance: c.currentBalance,
      };
    })
    .filter((item) => item.daysInactive >= inactiveDaysThreshold)
    .sort((a, b) => b.daysInactive - a.daysInactive);
  }, [customers, salesInvoices, inactiveDaysThreshold]);

  // ----------------------------------------------------
  // REPORT 7 CALCULATIONS: Sales Rep Performance vs Target
  // ----------------------------------------------------
  const salesRepStats = useMemo(() => {
    return salesReps.map((rep) => {
      const repInvoices = filteredInvoices.filter((inv) => {
        const cust = customers.find((c) => c.id === inv.customerId);
        return cust?.salesRepId === rep.id || cust?.salesRepId === rep.code;
      });

      const achieved = repInvoices.reduce((s, i) => s + i.grandTotal, 0);
      const target = rep.monthlySalesTarget || rep.salesTarget || 100000;
      const achievementRate = target > 0 ? (achieved / target) * 100 : 0;
      const commissionEarned = (achieved * (rep.commissionRate || 3.0)) / 100;
      const paidCommission = rep.paidCommissions || 0;
      const remainingCommission = Math.max(0, commissionEarned - paidCommission);

      return {
        rep,
        invoicesCount: repInvoices.length,
        achieved,
        target,
        achievementRate,
        commissionEarned,
        paidCommission,
        remainingCommission,
      };
    });
  }, [salesReps, filteredInvoices, customers]);

  // ----------------------------------------------------
  // REPORT 8 CALCULATIONS: Quotations Conversion Rate
  // ----------------------------------------------------
  const quotesConversionStats = useMemo(() => {
    const relevantQuotes = quotations.filter((q) => {
      if (dateFrom && q.date < dateFrom) return false;
      if (dateTo && q.date > dateTo) return false;
      return true;
    });

    const totalQuotesCount = relevantQuotes.length;
    const totalQuotesValue = relevantQuotes.reduce((s, q) => s + q.grandTotal, 0);

    const convertedToInvoice = relevantQuotes.filter((q) => q.status === 'converted_to_invoice' || q.convertedToInvoiceId);
    const convertedToOrder = relevantQuotes.filter((q) => q.status === 'converted_to_order' || q.convertedToOrderId);
    const approved = relevantQuotes.filter((q) => q.status === 'approved');
    const pending = relevantQuotes.filter((q) => q.status === 'draft' || q.status === 'sent');
    const rejected = relevantQuotes.filter((q) => q.status === 'rejected' || q.status === 'expired');

    const totalConvertedCount = convertedToInvoice.length + convertedToOrder.length;
    const totalConvertedValue = [...convertedToInvoice, ...convertedToOrder].reduce((s, q) => s + q.grandTotal, 0);

    const conversionRate = totalQuotesCount > 0 ? (totalConvertedCount / totalQuotesCount) * 100 : 0;

    return {
      totalQuotesCount,
      totalQuotesValue,
      convertedToInvoiceCount: convertedToInvoice.length,
      convertedToOrderCount: convertedToOrder.length,
      totalConvertedCount,
      totalConvertedValue,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      conversionRate,
      quotesList: relevantQuotes,
    };
  }, [quotations, dateFrom, dateTo]);

  // ----------------------------------------------------
  // REPORT 9 CALCULATIONS: Sales Returns Analysis
  // ----------------------------------------------------
  const returnsAnalysisStats = useMemo(() => {
    const totalSales = summaryMetrics.grandTotal;
    const totalRefund = filteredReturns.reduce((s, r) => s + (r.totalRefundAmount || 0), 0);
    const returnRate = totalSales > 0 ? (totalRefund / totalSales) * 100 : 0;

    const reasonCountMap: Record<string, { count: number; totalAmount: number }> = {};
    const productReturnsMap: Record<string, { productName: string; quantity: number; refundAmount: number }> = {};

    filteredReturns.forEach((ret) => {
      const reason = ret.reason || 'غير محدد';
      if (!reasonCountMap[reason]) {
        reasonCountMap[reason] = { count: 0, totalAmount: 0 };
      }
      reasonCountMap[reason].count += 1;
      reasonCountMap[reason].totalAmount += ret.totalRefundAmount;

      ret.items.forEach((item) => {
        if (!productReturnsMap[item.productId]) {
          productReturnsMap[item.productId] = {
            productName: item.productName,
            quantity: 0,
            refundAmount: 0,
          };
        }
        productReturnsMap[item.productId].quantity += item.quantity;
        productReturnsMap[item.productId].refundAmount += item.refundAmount;
      });
    });

    const topReturnedProducts = Object.values(productReturnsMap).sort((a, b) => b.refundAmount - a.refundAmount);

    return {
      totalSales,
      totalRefund,
      returnRate,
      returnsCount: filteredReturns.length,
      reasons: Object.entries(reasonCountMap).map(([reason, data]) => ({ reason, ...data })),
      topReturnedProducts,
      returnsList: filteredReturns,
    };
  }, [summaryMetrics.grandTotal, filteredReturns]);

  // Export CSV Handler
  const handleExportCsv = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Report_${reportType}_${timestamp}`;

    if (reportType === 'sales_summary') {
      headers = ['رقم الفاتورة', 'التاريخ', 'اسم العميل', 'طريقة الدفع', 'الإجمالي قبل الضريبة', 'الخصم', 'الضريبة', 'الإجمالي النهائي', 'المسدد', 'المتبقي'];
      rows = filteredInvoices.map((inv) => [
        inv.invoiceNumber,
        inv.date,
        inv.customerName,
        inv.paymentMethod,
        inv.subtotal,
        inv.discountTotal || 0,
        inv.vatTotal,
        inv.grandTotal,
        inv.paidAmount || 0,
        inv.remainingAmount || 0,
      ]);
    } else if (reportType === 'sales_by_payment') {
      headers = ['طريقة الدفع', 'عدد الفواتير', 'إجمالي المبيعات', 'النسبة المئوية', 'المحصل نقداً', 'المتبقي كذمم'];
      rows = paymentMethodStats.map((p) => [
        p.label,
        p.count,
        p.total,
        `${p.percent.toFixed(1)}%`,
        p.paid,
        p.remaining,
      ]);
    } else if (reportType === 'sales_top_products') {
      headers = ['اسم الصنف', 'التصنيف', 'الكمية المباعة', 'إجمالي الإيراد', 'إجمالي التكلفة COGS', 'مجمل الربح', 'هامش الربح %', 'الرصيد المخزني'];
      rows = productSalesStats.map((p) => [
        p.productName,
        p.category,
        p.quantitySold,
        p.revenue,
        p.cost,
        p.profit,
        `${p.profitMargin.toFixed(1)}%`,
        p.currentStock,
      ]);
    } else if (reportType === 'sales_profit_margin') {
      headers = ['رقم الفاتورة', 'التاريخ', 'العميل', 'قيمة المبيعات', 'تكلفة البضاعة COGS', 'مجمل الربح', 'هامش الربح %'];
      rows = invoiceProfitStats.items.map((i) => [
        i.invoice.invoiceNumber,
        i.invoice.date,
        i.invoice.customerName,
        i.revenue,
        i.cost,
        i.grossProfit,
        `${i.marginPercent.toFixed(1)}%`,
      ]);
    } else if (reportType === 'sales_by_customer') {
      headers = ['كود العميل', 'اسم العميل', 'فئة العميل', 'عدد الفواتير', 'إجمالي المشتريات', 'حصة العميل %', 'متوسط الفاتورة', 'الرصيد القائم', 'آخر عملية شراء'];
      rows = customerSalesStats.map((c) => [
        c.customer.code || '-',
        c.customer.name,
        c.tier,
        c.invoiceCount,
        c.totalPurchases,
        `${c.share.toFixed(1)}%`,
        c.avgOrderValue,
        c.customer.currentBalance,
        c.lastPurchaseDate,
      ]);
    } else if (reportType === 'sales_inactive_customers') {
      headers = ['اسم العميل', 'الهاتف', 'عدد أيام الانقطاع', 'تاريخ آخر شراء', 'عدد الفواتير السابقة', 'إجمالي المشتريات التاريخية', 'الرصيد الحالي'];
      rows = inactiveCustomersList.map((i) => [
        i.customer.name,
        i.customer.phone || '-',
        i.daysInactive === 9999 ? 'لم يشترِ مطلقاً' : i.daysInactive,
        i.lastPurchaseDate || 'لا يوجد',
        i.invoiceCount,
        i.totalHistoricalPurchases,
        i.currentBalance,
      ]);
    } else if (reportType === 'sales_rep_performance') {
      headers = ['المندوب', 'الكود', 'عدد الفواتير', 'المستهدف البيعي', 'المبيعات المحققة', 'نسبة التحقيق %', 'العمولة المستحقة', 'العمولة المدفوعة', 'المتبقي'];
      rows = salesRepStats.map((r) => [
        r.rep.name,
        r.rep.code || '-',
        r.invoicesCount,
        r.target,
        r.achieved,
        `${r.achievementRate.toFixed(1)}%`,
        r.commissionEarned,
        r.paidCommission,
        r.remainingCommission,
      ]);
    } else if (reportType === 'sales_quotes_conversion') {
      headers = ['رقم عرض السعر', 'التاريخ', 'العميل', 'القيمة الإجمالية', 'الحالة', 'الارتباط'];
      rows = quotesConversionStats.quotesList.map((q) => [
        q.quotationNumber,
        q.date,
        q.customerName,
        q.grandTotal,
        q.status,
        q.convertedToInvoiceNumber ? `فاتورة: ${q.convertedToInvoiceNumber}` : q.convertedToOrderNumber ? `أمر: ${q.convertedToOrderNumber}` : '-',
      ]);
    } else if (reportType === 'sales_returns_analysis') {
      headers = ['رقم الإشعار', 'التاريخ', 'العميل', 'رقم الفاتورة الأصلية', 'سبب الإرجاع', 'طريقة الاسترداد', 'إجمالي المبلغ المسترد'];
      rows = filteredReturns.map((r) => [
        r.returnNumber,
        r.date,
        r.customerName,
        r.invoiceNumber || '-',
        r.reason || '-',
        r.refundMethod === 'cash' ? 'نقداً' : 'رصيد دائن بالذمة',
        r.totalRefundAmount,
      ]);
    }

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Universal Top Header & Control Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0 shadow-2xs">
            <CurrentIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900">
                {currentMeta.title}
              </h1>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                قسم المبيعات المعتمد
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Global Print & Export Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            id="btn-sales-export-csv"
            onClick={handleExportCsv}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            تصدير ملف Excel (CSV)
          </button>
          <button
            type="button"
            id="btn-sales-print-report"
            onClick={() => setShowPrintModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs transition-all"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            طباعة التقرير الرسمي
          </button>
        </div>
      </div>

      {/* 2. Global Universal Date & Entity Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700">الفترة الزمنية:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleSetPreset('today')}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('this_month')}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                هذا الشهر
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('this_quarter')}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                الربع الحالي
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('this_year')}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer"
              >
                العام الحالي {currentYear}
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('all')}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                كامل الفترات
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mr-auto text-xs">
            <span className="text-slate-400">إجمالي الفواتير بالفترة:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              {filteredInvoices.length} فاتورة
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">من تاريخ:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">إلى تاريخ:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">تصفية العميل:</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">جميع العملاء</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">تصفية مندوب المبيعات:</label>
            <select
              value={selectedSalesRepId}
              onChange={(e) => setSelectedSalesRepId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">جميع مناديب المبيعات</option>
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REPORT 1: SALES SUMMARY (ملخص المبيعات الدوري والتحليلي)
         ========================================================================= */}
      {reportType === 'sales_summary' && (
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">إجمالي المبيعات الإجمالية</span>
              <div className="text-lg font-black text-slate-900">{formatMoney(summaryMetrics.grossTotal)}</div>
              <span className="text-[10px] text-slate-400 mt-1 block">قبل الخصومات والضرائب</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">إجمالي الخصومات</span>
              <div className="text-lg font-black text-amber-600">{formatMoney(summaryMetrics.discountTotal)}</div>
              <span className="text-[10px] text-amber-600/80 mt-1 block">خصومات بنود وفواتير</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">صافي المبيعات الخاضعة</span>
              <div className="text-lg font-black text-blue-700">{formatMoney(summaryMetrics.netSales)}</div>
              <span className="text-[10px] text-blue-600/80 mt-1 block">وعاء احتساب الضريبة</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">ضريبة القيمة المضافة</span>
              <div className="text-lg font-black text-indigo-600">{formatMoney(summaryMetrics.vatTotal)}</div>
              <span className="text-[10px] text-indigo-600/80 mt-1 block">مخرجات ضريبية VAT</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">صافي الإيراد النهائي</span>
              <div className="text-lg font-black text-emerald-700">{formatMoney(summaryMetrics.grandTotal)}</div>
              <span className="text-[10px] text-emerald-600 mt-1 block">شامل الضريبة ({summaryMetrics.invoiceCount} فاتورة)</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">متوسط قيمة الفاتورة</span>
              <div className="text-lg font-black text-purple-700">{formatMoney(summaryMetrics.avgInvoiceValue)}</div>
              <span className="text-[10px] text-purple-600/80 mt-1 block">Average Order Value</span>
            </div>
          </div>

          {/* Collection Status Split */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 block">المبالغ المسددة والمحصلة</span>
                <span className="text-xl font-black text-emerald-900 mt-1 block">{formatMoney(summaryMetrics.paidTotal)}</span>
                <span className="text-[11px] text-emerald-700 mt-0.5 block">
                  نسبة التحصيل: {summaryMetrics.grandTotal > 0 ? ((summaryMetrics.paidTotal / summaryMetrics.grandTotal) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-800 block">المبالغ المتبقية كذمم آجلة</span>
                <span className="text-xl font-black text-rose-900 mt-1 block">{formatMoney(summaryMetrics.remainingTotal)}</span>
                <span className="text-[11px] text-rose-700 mt-0.5 block">
                  مستحقات آجلة لدى العملاء
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-800 block">مرتجعات المبيعات بالفترة</span>
                <span className="text-xl font-black text-amber-900 mt-1 block">{formatMoney(summaryMetrics.totalReturnAmount)}</span>
                <span className="text-[11px] text-amber-700 mt-0.5 block">
                  صافي الإيراد الفعلي بعد الخصم: {formatMoney(summaryMetrics.netRevenueAfterReturns)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                <RotateCcw className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Invoices Detailed Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">سجل فواتير المبيعات التفصيلية</h3>
              </div>
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث برقم الفاتورة أو اسم العميل..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">طريقة الدفع</th>
                    <th className="p-3 text-left">الإجمالي قبل الضريبة</th>
                    <th className="p-3 text-left">الخصم</th>
                    <th className="p-3 text-left">الضريبة (VAT)</th>
                    <th className="p-3 text-left">الإجمالي النهائي</th>
                    <th className="p-3 text-left">المسدد</th>
                    <th className="p-3 text-left">المتبقي</th>
                    <th className="p-3 text-center">حالة الفاتورة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        لا توجد فواتير مبيعات مطابقة لمعايير البحث في الفترة المحددة.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-emerald-700">{inv.invoiceNumber}</td>
                        <td className="p-3 font-mono text-slate-600">{inv.date}</td>
                        <td className="p-3 font-semibold text-slate-900">{inv.customerName}</td>
                        <td className="p-3 text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                            {inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'card' ? 'شبكة / مدى' : inv.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : inv.paymentMethod === 'cheque' ? 'شيك' : 'آجل'}
                          </span>
                        </td>
                        <td className="p-3 text-left font-mono font-medium">{formatMoney(inv.subtotal)}</td>
                        <td className="p-3 text-left font-mono text-amber-600 font-medium">
                          {inv.discountTotal ? formatMoney(inv.discountTotal) : '—'}
                        </td>
                        <td className="p-3 text-left font-mono text-indigo-600 font-medium">{formatMoney(inv.vatTotal)}</td>
                        <td className="p-3 text-left font-mono font-black text-slate-900">{formatMoney(inv.grandTotal)}</td>
                        <td className="p-3 text-left font-mono text-emerald-600 font-bold">{formatMoney(inv.paidAmount || 0)}</td>
                        <td className="p-3 text-left font-mono font-bold text-rose-600">
                          {inv.remainingAmount > 0 ? formatMoney(inv.remainingAmount) : '—'}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              inv.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'partial'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'partial' ? 'سداد جزئي' : 'غير مدفوعة'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 2: SALES BY PAYMENT METHOD (المبيعات حسب طرق الدفع)
         ========================================================================= */}
      {reportType === 'sales_by_payment' && (
        <div className="space-y-6">
          {/* Visual Percentage Distribution Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              توزيع المبيعات بحسب قنوات الدفع والتحصيل
            </h3>
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
              {paymentMethodStats.map((item, idx) => {
                const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-amber-500'];
                return (
                  <div
                    key={item.key}
                    style={{ width: `${item.percent}%` }}
                    className={`${colors[idx % colors.length]} transition-all`}
                    title={`${item.label}: ${item.percent.toFixed(1)}%`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 pt-1 text-xs">
              {paymentMethodStats.map((item, idx) => {
                const dotColors = ['bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-amber-500'];
                return (
                  <div key={item.key} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${dotColors[idx % dotColors.length]}`} />
                    <span className="text-slate-600">{item.label}:</span>
                    <span className="font-bold text-slate-900">{item.percent.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3 text-center">عدد العمليات</th>
                  <th className="p-3 text-left">إجمالي المبيعات</th>
                  <th className="p-3 text-center">نسبة المساهمة (%)</th>
                  <th className="p-3 text-left">المبالغ المحصلة فعلياً</th>
                  <th className="p-3 text-left">المتبقي كذمم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentMethodStats.map((p) => (
                  <tr key={p.key} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-800">{p.label}</td>
                    <td className="p-3 text-center font-mono font-semibold">{p.count}</td>
                    <td className="p-3 text-left font-mono font-black text-slate-900">{formatMoney(p.total)}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-700">
                      <span className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {p.percent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-left font-mono font-bold text-emerald-600">{formatMoney(p.paid)}</td>
                    <td className="p-3 text-left font-mono font-bold text-rose-600">{formatMoney(p.remaining)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 3: TOP SELLING & MOST PROFITABLE PRODUCTS (الأصناف الأكثر مبيعاً)
         ========================================================================= */}
      {reportType === 'sales_top_products' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                ترتيب الأصناف بحسب إجمالي الإيراد وهوامش الربحية
              </h3>
              <span className="text-xs text-slate-400 font-semibold">
                إجمالي الأصناف المباعة: {productSalesStats.length} صنف
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3 text-center">الترتيب</th>
                    <th className="p-3">اسم الصنف</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3 text-center">الكمية المباعة</th>
                    <th className="p-3 text-left">إجمالي المبيعات</th>
                    <th className="p-3 text-left">التكلفة (COGS)</th>
                    <th className="p-3 text-left">مجمل الربح</th>
                    <th className="p-3 text-center">هامش الربح %</th>
                    <th className="p-3 text-center">الرصيد المخزني الحالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productSalesStats.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        لا توجد مبيعات أصناف مسجلة خلال الفترة المحددة.
                      </td>
                    </tr>
                  ) : (
                    productSalesStats.map((item, index) => (
                      <tr key={item.productId} className="hover:bg-slate-50">
                        <td className="p-3 text-center">
                          <span
                            className={`w-6 h-6 inline-flex items-center justify-center rounded-full text-[11px] font-black ${
                              index === 0
                                ? 'bg-yellow-400 text-yellow-950 shadow-xs'
                                : index === 1
                                ? 'bg-slate-300 text-slate-800'
                                : index === 2
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">{item.productName}</td>
                        <td className="p-3 text-slate-500">{item.category}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">{item.quantitySold}</td>
                        <td className="p-3 text-left font-mono font-black text-emerald-700">{formatMoney(item.revenue)}</td>
                        <td className="p-3 text-left font-mono text-slate-500">{formatMoney(item.cost)}</td>
                        <td className="p-3 text-left font-mono font-bold text-blue-700">{formatMoney(item.profit)}</td>
                        <td className="p-3 text-center font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              item.profitMargin >= 30
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.profitMargin >= 15
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.profitMargin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              item.currentStock <= 5
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.currentStock} قطعة
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 4: GROSS PROFIT MARGINS (هوامش ومجمل ربح المبيعات)
         ========================================================================= */}
      {reportType === 'sales_profit_margin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">إجمالي إيرادات المبيعات</span>
              <div className="text-xl font-black text-slate-900">{formatMoney(invoiceProfitStats.totalRevenue)}</div>
              <span className="text-[10px] text-slate-400 mt-1 block">قيمة الفواتير المعتمدة</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">تكلفة البضاعة المباعة (COGS)</span>
              <div className="text-xl font-black text-rose-600">{formatMoney(invoiceProfitStats.totalCogs)}</div>
              <span className="text-[10px] text-slate-400 mt-1 block">محسوبة بأسعار شراء الأصناف</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">صافي مجمل الربح (Gross Profit)</span>
              <div className="text-xl font-black text-emerald-700">{formatMoney(invoiceProfitStats.totalProfit)}</div>
              <span className="text-[10px] text-emerald-600 mt-1 block">الفارق بين الإيراد وتكلفة الأصناف</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">متوسط نسبة مجمل الربح</span>
              <div className="text-xl font-black text-blue-700">{invoiceProfitStats.overallMargin.toFixed(1)}%</div>
              <span className="text-[10px] text-blue-600 mt-1 block">مؤشر الربحية الإجمالي</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                تحليل هوامش الربحية على مستوى الفواتير الفردية
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3 text-left">إجمالي البيع</th>
                    <th className="p-3 text-left">تكلفة البضاعة (COGS)</th>
                    <th className="p-3 text-left">مجمل الربح</th>
                    <th className="p-3 text-center">نسبة الهامش %</th>
                    <th className="p-3 text-center">تصنيف الربحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceProfitStats.items.map((row) => (
                    <tr key={row.invoice.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-emerald-700">{row.invoice.invoiceNumber}</td>
                      <td className="p-3 font-mono text-slate-600">{row.invoice.date}</td>
                      <td className="p-3 font-semibold text-slate-900">{row.invoice.customerName}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-800">{formatMoney(row.revenue)}</td>
                      <td className="p-3 text-left font-mono text-slate-500">{formatMoney(row.cost)}</td>
                      <td className="p-3 text-left font-mono font-black text-emerald-700">{formatMoney(row.grossProfit)}</td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900">{row.marginPercent.toFixed(1)}%</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.marginPercent >= 30
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : row.marginPercent >= 15
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : row.marginPercent > 0
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {row.marginPercent >= 30 ? 'ربحية ممتازة' : row.marginPercent >= 15 ? 'ربحية جيدة' : row.marginPercent > 0 ? 'ربحية منخفضة' : 'خسارة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 5: CUSTOMER PARETO ANALYSIS (تحليل مبيعات وكبار العملاء 80/20)
         ========================================================================= */}
      {reportType === 'sales_by_customer' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-emerald-600" />
                  تصنيف العملاء بحسب القوة الشرائية وقاعدة باريتو (80/20)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  العملاء المميزون باللون الأخضر يمثلون أعلى 80% من إجمالي مبيعات المنشأة
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3 text-center">الترتيب</th>
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3 text-center">الفئة</th>
                    <th className="p-3 text-center">عدد الفواتير</th>
                    <th className="p-3 text-left">إجمالي المشتريات</th>
                    <th className="p-3 text-center">الحصة من المبيعات %</th>
                    <th className="p-3 text-left">متوسط الفاتورة</th>
                    <th className="p-3 text-left">الرصيد القائم</th>
                    <th className="p-3">آخر عملية شراء</th>
                    <th className="p-3 text-center">كشف الحساب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerSalesStats.map((item, index) => (
                    <tr key={item.customer.id} className={`hover:bg-slate-50 ${item.isTop80 ? 'bg-emerald-50/20' : ''}`}>
                      <td className="p-3 text-center font-mono font-bold text-slate-500">{index + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{item.customer.name}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${item.tierColor}`}>
                          {item.tier}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono">{item.invoiceCount}</td>
                      <td className="p-3 text-left font-mono font-black text-emerald-700">{formatMoney(item.totalPurchases)}</td>
                      <td className="p-3 text-center font-mono font-bold text-blue-700">{item.share.toFixed(1)}%</td>
                      <td className="p-3 text-left font-mono text-slate-600">{formatMoney(item.avgOrderValue)}</td>
                      <td className="p-3 text-left font-mono font-bold text-rose-600">{formatMoney(item.customer.currentBalance)}</td>
                      <td className="p-3 font-mono text-slate-500">{item.lastPurchaseDate}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setStatementCustomerId(item.customer.id)}
                          className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          معاينة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 6: INACTIVE CUSTOMERS (العملاء الراكدون وغير النشطين)
         ========================================================================= */}
      {reportType === 'sales_inactive_customers' && (
        <div className="space-y-6">
          {/* Threshold Selector Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">تحديد مدة الانقطاع عن الشراء:</span>
            </div>
            <div className="flex items-center gap-2">
              {[30, 60, 90, 180].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setInactiveDaysThreshold(days)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    inactiveDaysThreshold === days
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  أكثر من {days} يوماً
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">
                قائمة العملاء غير النشطين (المنقطعين منذ أكثر من {inactiveDaysThreshold} يوماً)
              </h3>
              <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                {inactiveCustomersList.length} عميل بحاجة لإعادة تنشيط
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3 text-center">أيام الانقطاع</th>
                    <th className="p-3">تاريخ آخر شراء</th>
                    <th className="p-3 text-center">عدد العمليات السابقة</th>
                    <th className="p-3 text-left">إجمالي المشتريات السابقة</th>
                    <th className="p-3 text-left">الرصيد / المديونية الحالية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inactiveCustomersList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا يوجد عملاء منقطعون عن الشراء يتجاوزون {inactiveDaysThreshold} يوماً.
                      </td>
                    </tr>
                  ) : (
                    inactiveCustomersList.map((item) => (
                      <tr key={item.customer.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">{item.customer.name}</td>
                        <td className="p-3 font-mono text-slate-600">{item.customer.phone || '—'}</td>
                        <td className="p-3 text-center">
                          <span className="bg-amber-50 text-amber-800 font-black px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                            {item.daysInactive === 9999 ? 'لم يشترِ أبداً' : `${item.daysInactive} يوم`}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500">{item.lastPurchaseDate || '—'}</td>
                        <td className="p-3 text-center font-mono font-semibold">{item.invoiceCount}</td>
                        <td className="p-3 text-left font-mono font-bold text-slate-800">{formatMoney(item.totalHistoricalPurchases)}</td>
                        <td className="p-3 text-left font-mono font-bold text-rose-600">{formatMoney(item.currentBalance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 7: SALES REP PERFORMANCE (أداء المناديب والمستهدف)
         ========================================================================= */}
      {reportType === 'sales_rep_performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesRepStats.map((item) => (
              <div key={item.rep.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{item.rep.name}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">كود: {item.rep.code || '-'}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                      item.achievementRate >= 100
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.achievementRate >= 70
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {item.achievementRate.toFixed(1)}% تحقيق
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>المحقق: {formatMoney(item.achieved)}</span>
                    <span>الهدف: {formatMoney(item.target)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, item.achievementRate)}%` }}
                      className={`h-full transition-all ${
                        item.achievementRate >= 100 ? 'bg-emerald-500' : item.achievementRate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">العمولة المستحقة:</span>
                    <span className="font-bold text-indigo-700">{formatMoney(item.commissionEarned)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المتبقي للصرف:</span>
                    <span className="font-bold text-rose-600">{formatMoney(item.remainingCommission)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 8: QUOTATIONS CONVERSION (كفاءة ومعدل تحويل عروض الأسعار)
         ========================================================================= */}
      {reportType === 'sales_quotes_conversion' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">عروض الأسعار الصادرة</span>
              <div className="text-xl font-black text-slate-900">{quotesConversionStats.totalQuotesCount}</div>
              <span className="text-[10px] text-slate-400 mt-1 block">بقيمة: {formatMoney(quotesConversionStats.totalQuotesValue)}</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">عروض تم تحويلها لفواتير</span>
              <div className="text-xl font-black text-emerald-700">{quotesConversionStats.convertedToInvoiceCount}</div>
              <span className="text-[10px] text-emerald-600 mt-1 block">فواتير مبيعات فعلية</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">عروض قيد الانتظار</span>
              <div className="text-xl font-black text-amber-600">{quotesConversionStats.pendingCount}</div>
              <span className="text-[10px] text-amber-600/80 mt-1 block">بانتظار موافقة العميل</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">معدل التحويل العام</span>
              <div className="text-xl font-black text-purple-700">{quotesConversionStats.conversionRate.toFixed(1)}%</div>
              <span className="text-[10px] text-purple-600 mt-1 block">Conversion Rate</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <FileBadge className="w-4 h-4 text-emerald-600" />
                سجل عروض الأسعار ومسار تحويلها
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3">رقم العرض</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3 text-left">القيمة الإجمالية</th>
                    <th className="p-3 text-center">حالة العرض</th>
                    <th className="p-3">المستند المرتبط (المحول إليه)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotesConversionStats.quotesList.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-700">{q.quotationNumber}</td>
                      <td className="p-3 font-mono text-slate-600">{q.date}</td>
                      <td className="p-3 font-semibold text-slate-900">{q.customerName}</td>
                      <td className="p-3 text-left font-mono font-black text-slate-800">{formatMoney(q.grandTotal)}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            q.status === 'converted_to_invoice'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : q.status === 'approved'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : q.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {q.status === 'converted_to_invoice'
                            ? 'محول لفاتورة'
                            : q.status === 'converted_to_order'
                            ? 'محول لأمر بيع'
                            : q.status === 'approved'
                            ? 'معتمد'
                            : q.status === 'rejected'
                            ? 'مرفوض'
                            : 'قيد الانتظار'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-emerald-700 font-bold">
                        {q.convertedToInvoiceNumber ? `فاتورة: ${q.convertedToInvoiceNumber}` : q.convertedToOrderNumber ? `أمر: ${q.convertedToOrderNumber}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 9: SALES RETURNS ANALYSIS (تحليل المرتجعات ونسبة الهدر)
         ========================================================================= */}
      {reportType === 'sales_returns_analysis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">إجمالي المبيعات الإجمالية</span>
              <div className="text-xl font-black text-slate-900">{formatMoney(returnsAnalysisStats.totalSales)}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">إجمالي المردودات المسترجعة</span>
              <div className="text-xl font-black text-rose-600">{formatMoney(returnsAnalysisStats.totalRefund)}</div>
              <span className="text-[10px] text-rose-600/80 mt-1 block">{returnsAnalysisStats.returnsCount} إشعار إرجاع</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-slate-400 text-xs font-semibold block mb-1">نسبة المرتجعات إلى المبيعات</span>
              <div className="text-xl font-black text-amber-600">{returnsAnalysisStats.returnRate.toFixed(1)}%</div>
              <span className="text-[10px] text-slate-400 mt-1 block">Return Rate Percentage</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                سجل إشعارات مردودات المبيعات التفصيلية
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3">رقم الإشعار</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">رقم الفاتورة الأصلية</th>
                    <th className="p-3">سبب الإرجاع</th>
                    <th className="p-3">طريقة الاسترداد</th>
                    <th className="p-3 text-left">قيمة المردود</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnsAnalysisStats.returnsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا توجد مرتجعات مبيعات مسجلة في الفترة المحددة.
                      </td>
                    </tr>
                  ) : (
                    returnsAnalysisStats.returnsList.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-rose-700">{ret.returnNumber}</td>
                        <td className="p-3 font-mono text-slate-600">{ret.date}</td>
                        <td className="p-3 font-semibold text-slate-900">{ret.customerName}</td>
                        <td className="p-3 font-mono text-slate-500">{ret.invoiceNumber || '—'}</td>
                        <td className="p-3 text-slate-700">{ret.reason || 'غير محدد'}</td>
                        <td className="p-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                            {ret.refundMethod === 'cash' ? 'نقدي للصندوق' : 'رصيد دائن بالذمة'}
                          </span>
                        </td>
                        <td className="p-3 text-left font-mono font-black text-rose-600">{formatMoney(ret.totalRefundAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Global Print Modal */}
      {showPrintModal && (
        <PrintPreviewModal
          title={currentMeta.title}
          subtitle={`للفترة من ${dateFrom || 'البداية'} إلى ${dateTo || 'النهاية'}`}
          onClose={() => setShowPrintModal(false)}
        >
          <div className="space-y-6 text-right text-xs" dir="rtl">
            <PrintHeader title={currentMeta.title} subtitle={currentMeta.subtitle} />

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <strong>الفترة:</strong> من {dateFrom || 'بداية التعامل'} إلى {dateTo || 'تاريخ اليوم'}
              </div>
              <div>
                <strong>العملة المعتمدة:</strong> {currency}
              </div>
            </div>

            {reportType === 'sales_summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="border p-2 rounded">
                    <span className="block text-slate-500 text-[10px]">إجمالي المبيعات:</span>
                    <strong className="text-sm">{formatMoney(summaryMetrics.grossTotal)}</strong>
                  </div>
                  <div className="border p-2 rounded">
                    <span className="block text-slate-500 text-[10px]">الخصومات:</span>
                    <strong className="text-sm">{formatMoney(summaryMetrics.discountTotal)}</strong>
                  </div>
                  <div className="border p-2 rounded">
                    <span className="block text-slate-500 text-[10px]">صافي الإيراد:</span>
                    <strong className="text-sm">{formatMoney(summaryMetrics.grandTotal)}</strong>
                  </div>
                </div>

                <table className="w-full border text-[10px] text-right">
                  <thead>
                    <tr className="bg-slate-100 border-b">
                      <th className="p-1.5 border-l">رقم الفاتورة</th>
                      <th className="p-1.5 border-l">التاريخ</th>
                      <th className="p-1.5 border-l">العميل</th>
                      <th className="p-1.5 border-l text-left">الإجمالي</th>
                      <th className="p-1.5 border-l text-left">المسدد</th>
                      <th className="p-1.5 text-left">المتبقي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.slice(0, 50).map((inv) => (
                      <tr key={inv.id} className="border-b">
                        <td className="p-1.5 border-l font-mono">{inv.invoiceNumber}</td>
                        <td className="p-1.5 border-l">{inv.date}</td>
                        <td className="p-1.5 border-l">{inv.customerName}</td>
                        <td className="p-1.5 border-l text-left font-mono">{formatMoney(inv.grandTotal)}</td>
                        <td className="p-1.5 border-l text-left font-mono">{formatMoney(inv.paidAmount || 0)}</td>
                        <td className="p-1.5 text-left font-mono">{formatMoney(inv.remainingAmount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <PrintFooter />
          </div>
        </PrintPreviewModal>
      )}

      {/* Customer Statement Modal */}
      {statementCustomerId && (
        <CustomerStatementModal
          customerId={statementCustomerId}
          onClose={() => setStatementCustomerId(null)}
        />
      )}
    </div>
  );
};
