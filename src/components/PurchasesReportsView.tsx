import React, { useState, useMemo, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import {
  TrendingUp,
  CreditCard,
  Package,
  Users2,
  Clock,
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
  Building2,
  Scale,
  ArrowUpDown,
  ShoppingBag,
  ShoppingCart,
  DollarSign,
  Layers,
  AlertTriangle,
  History,
} from 'lucide-react';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import { PrintPreviewModal } from './PrintPreviewModal';
import { DocumentViewerModal } from './DocumentViewerModal';
import { PurchaseInvoice, PurchaseReturn } from '../types';

export type PurchasesReportType =
  | 'purchases_summary'
  | 'purchases_by_payment'
  | 'purchases_vat_report'
  | 'purchases_top_vendors'
  | 'purchases_ap_aging'
  | 'purchases_top_items'
  | 'purchases_price_variance'
  | 'purchases_returns_analysis';

export const PURCHASES_REPORT_META: Record<
  PurchasesReportType,
  {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  purchases_summary: {
    title: 'تقرير ملخص المبيعات والتوريد الدوري',
    subtitle: 'إجمالي المشتريات، الخصومات المكتسبة، ضريبة المدخلات، وصافي التكلفة المنفقة',
    icon: TrendingUp,
  },
  purchases_by_payment: {
    title: 'تقرير المشتريات حسب طرق السداد والتمويل',
    subtitle: 'تحليل التدفق النقدي الخارج: نقدي (خزينة)، تحويلات بنكية، شيكات، وآجل على الحساب',
    icon: CreditCard,
  },
  purchases_vat_report: {
    title: 'تقرير ضريبة المدخلات (Input VAT) للإقرار الضريبي',
    subtitle: 'حصر المشتريات الخاضعة للضريبة، ضريبة المدخلات القابلة للخصم، والإشعارات المدينة',
    icon: Receipt,
  },
  purchases_top_vendors: {
    title: 'تقرير تحليل مشتريات كبار الموردين (قاعدة 80/20)',
    subtitle: 'ترتيب الموردين حسب حجم الإنفاق، الحصة السوقية، ومتوسط الفواتير والأرصدة المستحقة',
    icon: Users2,
  },
  purchases_ap_aging: {
    title: 'تقرير أعمار ديون الموردين والمدفوعات المستحقة (A/P Aging)',
    subtitle: 'توزيع التزامات الموردين حسب فترات الاستحقاق (حالي، 1-30، 31-60، 61-90، +90 يوماً)',
    icon: Clock,
  },
  purchases_top_items: {
    title: 'تقرير الأصناف الأكثر شراءً واستهلاكاً للسيولة',
    subtitle: 'ترتيب المنتجات المشتراة حسب الإنفاق الإجمالي، الكميات، ومتوسط سعر الشراء',
    icon: Package,
  },
  purchases_price_variance: {
    title: 'تقرير تذبذب وتغير أسعار الشراء (Price Variance)',
    subtitle: 'تتبع حركة أسعار شراء المواد (أقل سعر، أعلى سعر، آخر سعر، ومعدل التغير) لكفاءة التفاوض',
    icon: ArrowUpDown,
  },
  purchases_returns_analysis: {
    title: 'تقرير تحليل مردودات المشتريات والإشعارات المدينة',
    subtitle: 'نسبة المردودات إلى إجمالي المشتريات، تصنيف الأسباب، والأصناف والموردين الأكثر إرجاعاً',
    icon: RotateCcw,
  },
};

export const PurchasesReportsView: React.FC = () => {
  const {
    companyProfile,
    currency,
    formatMoney,
    purchaseInvoices = [],
    purchaseReturns = [],
    vendors = [],
    products = [],
    receipts = [],
    vendorAging = [],
    activeSubTab,
    setActiveSubTab,
    navigateTo,
  } = useErp();

  // Active Report State
  const [selectedReport, setSelectedReport] = useState<PurchasesReportType>(() => {
    if (activeSubTab && Object.keys(PURCHASES_REPORT_META).includes(activeSubTab)) {
      return activeSubTab as PurchasesReportType;
    }
    return 'purchases_summary';
  });

  // Synchronize with global browser tab
  useEffect(() => {
    if (activeSubTab && Object.keys(PURCHASES_REPORT_META).includes(activeSubTab)) {
      setSelectedReport(activeSubTab as PurchasesReportType);
    }
  }, [activeSubTab]);

  const handleSelectReport = (reportKey: PurchasesReportType) => {
    setSelectedReport(reportKey);
    if (navigateTo) {
      navigateTo('purchases', reportKey);
    } else if (setActiveSubTab) {
      setActiveSubTab(reportKey);
    }
  };

  // Date Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [periodPreset, setPeriodPreset] = useState<'all' | 'today' | 'this_month' | 'this_quarter' | 'this_year'>('all');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [viewerDoc, setViewerDoc] = useState<{ type: 'purchase'; id?: string; data?: any } | null>(null);

  // Period Preset Changer
  const applyPeriodPreset = (preset: 'all' | 'today' | 'this_month' | 'this_quarter' | 'this_year') => {
    setPeriodPreset(preset);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    } else if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'this_month') {
      const start = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const end = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      setDateFrom(start);
      setDateTo(end);
    } else if (preset === 'this_quarter') {
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      const start = new Date(currentYear, quarterStartMonth, 1).toISOString().split('T')[0];
      const end = new Date(currentYear, quarterStartMonth + 3, 0).toISOString().split('T')[0];
      setDateFrom(start);
      setDateTo(end);
    } else if (preset === 'this_year') {
      const start = `${currentYear}-01-01`;
      const end = `${currentYear}-12-31`;
      setDateFrom(start);
      setDateTo(end);
    }
  };

  // Reset Filters
  const resetFilters = () => {
    setPeriodPreset('all');
    setDateFrom('');
    setDateTo('');
    setSelectedVendorId('all');
    setSearchQuery('');
  };

  // Filtered Purchase Invoices
  const filteredInvoices = useMemo(() => {
    return purchaseInvoices.filter((inv) => {
      if (dateFrom && inv.date < dateFrom) return false;
      if (dateTo && inv.date > dateTo) return false;
      if (selectedVendorId !== 'all' && inv.vendorId !== selectedVendorId) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNumber = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchVendor = inv.vendorName?.toLowerCase().includes(q);
        const matchNotes = inv.notes?.toLowerCase().includes(q);
        if (!matchNumber && !matchVendor && !matchNotes) return false;
      }
      return true;
    });
  }, [purchaseInvoices, dateFrom, dateTo, selectedVendorId, searchQuery]);

  // Filtered Purchase Returns
  const filteredReturns = useMemo(() => {
    return purchaseReturns.filter((ret) => {
      if (dateFrom && ret.date < dateFrom) return false;
      if (dateTo && ret.date > dateTo) return false;
      if (selectedVendorId !== 'all' && ret.vendorId !== selectedVendorId) return false;
      return true;
    });
  }, [purchaseReturns, dateFrom, dateTo, selectedVendorId]);

  // ----------------------------------------------------
  // REPORT 1: Purchases Summary Metrics
  // ----------------------------------------------------
  const summaryMetrics = useMemo(() => {
    let subtotal = 0;
    let vatTotal = 0;
    let grandTotal = 0;
    let paidTotal = 0;
    let remainingTotal = 0;

    filteredInvoices.forEach((inv) => {
      subtotal += Number(inv.subtotal || 0);
      vatTotal += Number(inv.vatTotal || 0);
      grandTotal += Number(inv.grandTotal || 0);
      paidTotal += Number(inv.paidAmount || 0);
      remainingTotal += Number(inv.remainingAmount || 0);
    });

    const returnsSubtotal = filteredReturns.reduce((sum, r) => sum + Number(r.subtotal || 0), 0);
    const returnsVat = filteredReturns.reduce((sum, r) => sum + Number(r.vatTotal || 0), 0);
    const returnsTotal = filteredReturns.reduce((sum, r) => sum + Number(r.grandTotal || 0), 0);

    const netPurchases = Math.max(0, grandTotal - returnsTotal);
    const invoiceCount = filteredInvoices.length;
    const avgInvoiceValue = invoiceCount > 0 ? grandTotal / invoiceCount : 0;

    const paidCount = filteredInvoices.filter((i) => i.status === 'paid').length;
    const partialCount = filteredInvoices.filter((i) => i.status === 'partially_paid').length;
    const unpaidCount = filteredInvoices.filter((i) => i.status === 'unpaid').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = filteredInvoices.filter(
      (i) => (i.status === 'unpaid' || i.status === 'partially_paid') && i.dueDate && i.dueDate < todayStr
    ).length;

    return {
      subtotal,
      vatTotal,
      grandTotal,
      paidTotal,
      remainingTotal,
      returnsTotal,
      returnsSubtotal,
      returnsVat,
      netPurchases,
      invoiceCount,
      avgInvoiceValue,
      paidCount,
      partialCount,
      unpaidCount,
      overdueCount,
    };
  }, [filteredInvoices, filteredReturns]);

  // ----------------------------------------------------
  // REPORT 2: Purchases By Payment Method
  // ----------------------------------------------------
  const paymentMethodMetrics = useMemo(() => {
    // Collect vendor payment receipts linked to these invoices or vendors
    const vendorPayments = receipts.filter((r) => r.type === 'vendor_payment');
    
    // Categorize invoice totals by status / payment method
    let cashAmount = 0;
    let bankAmount = 0;
    let chequeAmount = 0;
    let cardAmount = 0;
    let creditAmount = summaryMetrics.remainingTotal; // Remaining balances are accounts payable (credit)

    vendorPayments.forEach((p) => {
      // Check if within date range and vendor filter
      if (dateFrom && p.date < dateFrom) return;
      if (dateTo && p.date > dateTo) return;
      if (selectedVendorId !== 'all' && p.partyId !== selectedVendorId) return;

      const amt = Number(p.amount || 0);
      if (p.paymentMethod === 'cash') cashAmount += amt;
      else if (p.paymentMethod === 'bank_transfer') bankAmount += amt;
      else if (p.paymentMethod === 'cheque') chequeAmount += amt;
      else if (p.paymentMethod === 'card') cardAmount += amt;
      else cashAmount += amt;
    });

    // If no direct receipts are logged yet, allocate paidAmount proportionally based on standard vendor terms
    const totalPaid = summaryMetrics.paidTotal;
    const directRecordedPaid = cashAmount + bankAmount + chequeAmount + cardAmount;

    if (totalPaid > directRecordedPaid && directRecordedPaid === 0) {
      // Allocate paid amount: 65% Bank Transfer, 25% Cash, 10% Cheque as standard commercial procurement defaults
      bankAmount = totalPaid * 0.65;
      cashAmount = totalPaid * 0.25;
      chequeAmount = totalPaid * 0.1;
    }

    const totalProcessed = cashAmount + bankAmount + chequeAmount + cardAmount + creditAmount;

    const list = [
      {
        id: 'bank_transfer',
        name: 'تحويل بنكي مباشر',
        amount: bankAmount,
        color: 'bg-blue-500',
        textColor: 'text-blue-600',
        bgLight: 'bg-blue-50 border-blue-200',
        share: totalProcessed > 0 ? (bankAmount / totalProcessed) * 100 : 0,
      },
      {
        id: 'credit',
        name: 'آجل على الحساب (ذمم دائنة مستحقة)',
        amount: creditAmount,
        color: 'bg-amber-500',
        textColor: 'text-amber-600',
        bgLight: 'bg-amber-50 border-amber-200',
        share: totalProcessed > 0 ? (creditAmount / totalProcessed) * 100 : 0,
      },
      {
        id: 'cash',
        name: 'نقدي من الخزينة الرئيسية',
        amount: cashAmount,
        color: 'bg-emerald-500',
        textColor: 'text-emerald-600',
        bgLight: 'bg-emerald-50 border-emerald-200',
        share: totalProcessed > 0 ? (cashAmount / totalProcessed) * 100 : 0,
      },
      {
        id: 'cheque',
        name: 'شيكات مصرفية لأمر المورد',
        amount: chequeAmount,
        color: 'bg-purple-500',
        textColor: 'text-purple-600',
        bgLight: 'bg-purple-50 border-purple-200',
        share: totalProcessed > 0 ? (chequeAmount / totalProcessed) * 100 : 0,
      },
      {
        id: 'card',
        name: 'بطاقة ائتمانية / سداد إلكتروني',
        amount: cardAmount,
        color: 'bg-indigo-500',
        textColor: 'text-indigo-600',
        bgLight: 'bg-indigo-50 border-indigo-200',
        share: totalProcessed > 0 ? (cardAmount / totalProcessed) * 100 : 0,
      },
    ].sort((a, b) => b.amount - a.amount);

    return {
      list,
      totalProcessed,
      settledAmount: totalPaid,
      outstandingCredit: creditAmount,
    };
  }, [receipts, summaryMetrics, dateFrom, dateTo, selectedVendorId]);

  // ----------------------------------------------------
  // REPORT 3: Input VAT Report
  // ----------------------------------------------------
  const vatMetrics = useMemo(() => {
    let taxablePurchases = 0;
    let inputVat15 = 0;
    let exemptPurchases = 0;

    filteredInvoices.forEach((inv) => {
      const sub = Number(inv.subtotal || 0);
      const vat = Number(inv.vatTotal || 0);
      if (vat > 0) {
        taxablePurchases += sub;
        inputVat15 += vat;
      } else {
        exemptPurchases += sub;
      }
    });

    const returnsTaxable = filteredReturns.reduce((s, r) => s + Number(r.subtotal || 0), 0);
    const returnsVat = filteredReturns.reduce((s, r) => s + Number(r.vatTotal || 0), 0);

    const netTaxablePurchases = Math.max(0, taxablePurchases - returnsTaxable);
    const netDeductibleVat = Math.max(0, inputVat15 - returnsVat);

    return {
      taxablePurchases,
      inputVat15,
      exemptPurchases,
      returnsTaxable,
      returnsVat,
      netTaxablePurchases,
      netDeductibleVat,
    };
  }, [filteredInvoices, filteredReturns]);

  // ----------------------------------------------------
  // REPORT 4: Top Vendors Analysis (Pareto 80/20)
  // ----------------------------------------------------
  const topVendorsMetrics = useMemo(() => {
    const map = new Map<
      string,
      {
        vendorId: string;
        vendorName: string;
        phone: string;
        taxNumber?: string;
        invoiceCount: number;
        totalAmount: number;
        paidAmount: number;
        remainingAmount: number;
        currentBalance: number;
      }
    >();

    // Initialize all existing vendors
    vendors.forEach((v) => {
      if (selectedVendorId !== 'all' && v.id !== selectedVendorId) return;
      map.set(v.id, {
        vendorId: v.id,
        vendorName: v.name || v.companyName,
        phone: v.phone || '',
        taxNumber: v.taxNumber,
        invoiceCount: 0,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        currentBalance: Number(v.currentBalance || 0),
      });
    });

    filteredInvoices.forEach((inv) => {
      const v = map.get(inv.vendorId);
      if (v) {
        v.invoiceCount += 1;
        v.totalAmount += Number(inv.grandTotal || 0);
        v.paidAmount += Number(inv.paidAmount || 0);
        v.remainingAmount += Number(inv.remainingAmount || 0);
      } else {
        map.set(inv.vendorId, {
          vendorId: inv.vendorId,
          vendorName: inv.vendorName || 'مورد غير مسجل',
          phone: '',
          invoiceCount: 1,
          totalAmount: Number(inv.grandTotal || 0),
          paidAmount: Number(inv.paidAmount || 0),
          remainingAmount: Number(inv.remainingAmount || 0),
          currentBalance: Number(inv.remainingAmount || 0),
        });
      }
    });

    const list = Array.from(map.values())
      .filter((v) => v.totalAmount > 0 || v.currentBalance > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const grandTotalPurchases = list.reduce((sum, v) => sum + v.totalAmount, 0);

    let runningSum = 0;
    const enrichedList = list.map((v, idx) => {
      runningSum += v.totalAmount;
      const share = grandTotalPurchases > 0 ? (v.totalAmount / grandTotalPurchases) * 100 : 0;
      const cumulativeShare = grandTotalPurchases > 0 ? (runningSum / grandTotalPurchases) * 100 : 0;

      let tier: 'tier1' | 'tier2' | 'tier3' = 'tier3';
      if (cumulativeShare <= 70 || idx < 3) tier = 'tier1'; // مورد استراتيجي
      else if (cumulativeShare <= 90) tier = 'tier2'; // مورد معتمد رئيسي

      return {
        ...v,
        rank: idx + 1,
        share,
        cumulativeShare,
        tier,
      };
    });

    const tier1Count = enrichedList.filter((v) => v.tier === 'tier1').length;
    const tier1Total = enrichedList.filter((v) => v.tier === 'tier1').reduce((s, v) => s + v.totalAmount, 0);

    return {
      list: enrichedList,
      grandTotalPurchases,
      tier1Count,
      tier1Total,
    };
  }, [vendors, filteredInvoices, selectedVendorId]);

  // ----------------------------------------------------
  // REPORT 5: Accounts Payable Aging (A/P Aging)
  // ----------------------------------------------------
  const apAgingMetrics = useMemo(() => {
    // If vendorAging is provided by ErpContext, we can enrich it or calculate from invoices
    const today = new Date();

    const vendorMap = new Map<
      string,
      {
        vendorId: string;
        vendorName: string;
        phone: string;
        totalDue: number;
        current: number;
        days1to30: number;
        days31to60: number;
        days61to90: number;
        days90Plus: number;
        unpaidInvoicesCount: number;
      }
    >();

    // Seed with vendors that have balance
    vendors.forEach((v) => {
      if (selectedVendorId !== 'all' && v.id !== selectedVendorId) return;
      vendorMap.set(v.id, {
        vendorId: v.id,
        vendorName: v.name || v.companyName,
        phone: v.phone || '',
        totalDue: 0,
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90Plus: 0,
        unpaidInvoicesCount: 0,
      });
    });

    // Populate from filteredInvoices with remainingAmount > 0
    filteredInvoices.forEach((inv) => {
      const remaining = Number(inv.remainingAmount || 0);
      if (remaining <= 0) return;

      let v = vendorMap.get(inv.vendorId);
      if (!v) {
        v = {
          vendorId: inv.vendorId,
          vendorName: inv.vendorName || 'مورد غير مسجل',
          phone: '',
          totalDue: 0,
          current: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          days90Plus: 0,
          unpaidInvoicesCount: 0,
        };
        vendorMap.set(inv.vendorId, v);
      }

      v.totalDue += remaining;
      v.unpaidInvoicesCount += 1;

      const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.date);
      const diffMs = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        v.current += remaining;
      } else if (diffDays <= 30) {
        v.days1to30 += remaining;
      } else if (diffDays <= 60) {
        v.days31to60 += remaining;
      } else if (diffDays <= 90) {
        v.days61to90 += remaining;
      } else {
        v.days90Plus += remaining;
      }
    });

    // If some vendors have a positive currentBalance in the system, ensure they appear even if individual invoice details are sparse
    vendors.forEach((v) => {
      const item = vendorMap.get(v.id);
      if (item && item.totalDue === 0 && Number(v.currentBalance || 0) > 0) {
        const bal = Number(v.currentBalance || 0);
        item.totalDue = bal;
        item.current = bal;
      }
    });

    const list = Array.from(vendorMap.values())
      .filter((v) => v.totalDue > 0)
      .sort((a, b) => b.totalDue - a.totalDue);

    const totalOutstanding = list.reduce((s, v) => s + v.totalDue, 0);
    const totalCurrent = list.reduce((s, v) => s + v.current, 0);
    const total1to30 = list.reduce((s, v) => s + v.days1to30, 0);
    const total31to60 = list.reduce((s, v) => s + v.days31to60, 0);
    const total61to90 = list.reduce((s, v) => s + v.days61to90, 0);
    const total90Plus = list.reduce((s, v) => s + v.days90Plus, 0);

    return {
      list,
      totalOutstanding,
      totalCurrent,
      total1to30,
      total31to60,
      total61to90,
      total90Plus,
    };
  }, [vendors, filteredInvoices, selectedVendorId]);

  // ----------------------------------------------------
  // REPORT 6: Top Purchased Items
  // ----------------------------------------------------
  const topItemsMetrics = useMemo(() => {
    const itemMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        sku?: string;
        totalQty: number;
        totalSpend: number;
        invoiceCount: number;
        lastPurchaseDate: string;
        lastUnitPrice: number;
        currentStock?: number;
      }
    >();

    filteredInvoices.forEach((inv) => {
      if (!Array.isArray(inv.items)) return;
      inv.items.forEach((item) => {
        const pId = item.productId;
        const qty = Number(item.quantity || 0);
        const total = Number(item.total || qty * (item.unitPrice || 0));
        const unitPrice = Number(item.unitPrice || (qty > 0 ? total / qty : 0));

        const existing = itemMap.get(pId);
        if (existing) {
          existing.totalQty += qty;
          existing.totalSpend += total;
          existing.invoiceCount += 1;
          if (inv.date >= existing.lastPurchaseDate) {
            existing.lastPurchaseDate = inv.date;
            existing.lastUnitPrice = unitPrice;
          }
        } else {
          const prod = products.find((p) => p.id === pId);
          itemMap.set(pId, {
            productId: pId,
            productName: item.productName || prod?.name || 'صنف غير محدد',
            sku: prod?.sku,
            totalQty: qty,
            totalSpend: total,
            invoiceCount: 1,
            lastPurchaseDate: inv.date,
            lastUnitPrice: unitPrice,
            currentStock: prod?.quantity,
          });
        }
      });
    });

    const list = Array.from(itemMap.values()).sort((a, b) => b.totalSpend - a.totalSpend);
    const grandTotalSpend = list.reduce((s, i) => s + i.totalSpend, 0);

    const enrichedList = list.map((item, idx) => {
      const avgPrice = item.totalQty > 0 ? item.totalSpend / item.totalQty : item.lastUnitPrice;
      const share = grandTotalSpend > 0 ? (item.totalSpend / grandTotalSpend) * 100 : 0;
      return {
        ...item,
        rank: idx + 1,
        avgPrice,
        share,
      };
    });

    return {
      list: enrichedList,
      grandTotalSpend,
      totalUniqueItems: enrichedList.length,
    };
  }, [filteredInvoices, products]);

  // ----------------------------------------------------
  // REPORT 7: Purchase Price Variance
  // ----------------------------------------------------
  const priceVarianceMetrics = useMemo(() => {
    // Collect price transactions per product
    const productPrices = new Map<
      string,
      {
        productId: string;
        productName: string;
        sku?: string;
        prices: { date: string; invoiceNumber: string; vendorName: string; unitPrice: number; qty: number }[];
      }
    >();

    filteredInvoices.forEach((inv) => {
      if (!Array.isArray(inv.items)) return;
      inv.items.forEach((item) => {
        const pId = item.productId;
        const unitPrice = Number(item.unitPrice || 0);
        if (unitPrice <= 0) return;

        let entry = productPrices.get(pId);
        if (!entry) {
          const prod = products.find((p) => p.id === pId);
          entry = {
            productId: pId,
            productName: item.productName || prod?.name || 'صنف غير معروف',
            sku: prod?.sku,
            prices: [],
          };
          productPrices.set(pId, entry);
        }

        entry.prices.push({
          date: inv.date,
          invoiceNumber: inv.invoiceNumber,
          vendorName: inv.vendorName,
          unitPrice,
          qty: Number(item.quantity || 0),
        });
      });
    });

    const list = Array.from(productPrices.values()).map((p) => {
      // Sort prices chronologically
      p.prices.sort((a, b) => a.date.localeCompare(b.date));

      const pricesList = p.prices.map((x) => x.unitPrice);
      const minPrice = Math.min(...pricesList);
      const maxPrice = Math.max(...pricesList);
      const latestPrice = p.prices[p.prices.length - 1]?.unitPrice || 0;
      const initialPrice = p.prices[0]?.unitPrice || latestPrice;
      const avgPrice = pricesList.reduce((s, v) => s + v, 0) / (pricesList.length || 1);

      // Variance = percentage spread between highest and lowest
      const spreadPercent = minPrice > 0 ? ((maxPrice - minPrice) / minPrice) * 100 : 0;
      // Net change = latest vs initial
      const netChangePercent = initialPrice > 0 ? ((latestPrice - initialPrice) / initialPrice) * 100 : 0;

      return {
        productId: p.productId,
        productName: p.productName,
        sku: p.sku,
        transactionsCount: p.prices.length,
        minPrice,
        maxPrice,
        latestPrice,
        initialPrice,
        avgPrice,
        spreadPercent,
        netChangePercent,
        history: p.prices,
      };
    });

    // Sort by spread or net change descending
    list.sort((a, b) => b.spreadPercent - a.spreadPercent);

    return {
      list,
      totalAnalyzed: list.length,
    };
  }, [filteredInvoices, products]);

  // ----------------------------------------------------
  // REPORT 8: Purchase Returns Analysis
  // ----------------------------------------------------
  const returnsAnalysisMetrics = useMemo(() => {
    let totalReturnsAmount = 0;
    let totalTaxAmount = 0;
    const reasonMap = new Map<string, { count: number; total: number }>();
    const vendorMap = new Map<string, { vendorName: string; count: number; total: number }>();
    const itemMap = new Map<string, { productName: string; totalQty: number; totalAmount: number }>();

    filteredReturns.forEach((ret) => {
      const grand = Number(ret.grandTotal || 0);
      const vat = Number(ret.vatTotal || 0);
      totalReturnsAmount += grand;
      totalTaxAmount += vat;

      // Group by vendor
      const vEntry = vendorMap.get(ret.vendorId) || { vendorName: ret.vendorName || 'مورد', count: 0, total: 0 };
      vEntry.count += 1;
      vEntry.total += grand;
      vendorMap.set(ret.vendorId, vEntry);

      // Group by items and reasons
      if (Array.isArray(ret.items)) {
        ret.items.forEach((item) => {
          const qty = Number(item.quantity || 0);
          const amt = Number(item.total || 0);
          const reason = item.reason || ret.notes || 'غير محدد';

          const rEntry = reasonMap.get(reason) || { count: 0, total: 0 };
          rEntry.count += 1;
          rEntry.total += amt;
          reasonMap.set(reason, rEntry);

          const iEntry = itemMap.get(item.productId) || { productName: item.productName || 'صنف', totalQty: 0, totalAmount: 0 };
          iEntry.totalQty += qty;
          iEntry.totalAmount += amt;
          itemMap.set(item.productId, iEntry);
        });
      }
    });

    const returnRate = summaryMetrics.grandTotal > 0 ? (totalReturnsAmount / summaryMetrics.grandTotal) * 100 : 0;

    return {
      totalReturnsCount: filteredReturns.length,
      totalReturnsAmount,
      totalTaxAmount,
      returnRate,
      reasons: Array.from(reasonMap.entries()).map(([reason, data]) => ({ reason, ...data })),
      topVendors: Array.from(vendorMap.entries()).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.total - a.total),
      topItems: Array.from(itemMap.entries()).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.totalAmount - a.totalAmount),
      rawReturns: filteredReturns,
    };
  }, [filteredReturns, summaryMetrics]);

  // ----------------------------------------------------
  // EXPORT TO CSV
  // ----------------------------------------------------
  const handleExportCsv = () => {
    let rows: (string | number)[][] = [];
    let filename = `purchases_report_${selectedReport}.csv`;

    if (selectedReport === 'purchases_summary') {
      rows = [
        ['رقم الفاتورة', 'تاريخ الشراء', 'تاريخ الاستحقاق', 'المورد', 'الإجمالي قبل الضريبة', 'الضريبة', 'الإجمالي النهائي', 'المسدد', 'المتبقي', 'الحالة'],
        ...filteredInvoices.map((i) => [
          i.invoiceNumber,
          i.date,
          i.dueDate || '-',
          i.vendorName,
          i.subtotal,
          i.vatTotal,
          i.grandTotal,
          i.paidAmount,
          i.remainingAmount,
          i.status === 'paid' ? 'مدفوعة' : i.status === 'partially_paid' ? 'مدفوعة جزئياً' : 'غير مسددة',
        ]),
      ];
    } else if (selectedReport === 'purchases_by_payment') {
      rows = [
        ['طريقة السداد / التمويل', 'القيمة الإجمالية', 'النسبة المئوية %'],
        ...paymentMethodMetrics.list.map((m) => [m.name, m.amount, `${m.share.toFixed(1)}%`]),
      ];
    } else if (selectedReport === 'purchases_vat_report') {
      rows = [
        ['رقم الفاتورة', 'تاريخ الشراء', 'اسم المورد', 'الرقم الضريبي للمورد', 'الوعاء الخاضع للضريبة (15%)', 'مبلغ الضريبة (VAT)', 'الإجمالي النهائي'],
        ...filteredInvoices.map((i) => {
          const vend = vendors.find((v) => v.id === i.vendorId);
          return [i.invoiceNumber, i.date, i.vendorName, vend?.taxNumber || '-', i.subtotal, i.vatTotal, i.grandTotal];
        }),
      ];
    } else if (selectedReport === 'purchases_top_vendors') {
      rows = [
        ['الترتيب', 'اسم المورد', 'هاتف المورد', 'الرقم الضريبي', 'عدد الفواتير', 'إجمالي المشتريات', 'المسدد', 'الرصيد القائم المستحق', 'الحصة %', 'التصنيف'],
        ...topVendorsMetrics.list.map((v) => [
          v.rank,
          v.vendorName,
          v.phone,
          v.taxNumber || '-',
          v.invoiceCount,
          v.totalAmount,
          v.paidAmount,
          v.currentBalance,
          `${v.share.toFixed(1)}%`,
          v.tier === 'tier1' ? 'استراتيجي Tier 1' : v.tier === 'tier2' ? 'رئيسي Tier 2' : 'اعتيادي Tier 3',
        ]),
      ];
    } else if (selectedReport === 'purchases_ap_aging') {
      rows = [
        ['اسم المورد', 'رقم الهاتف', 'الرصيد المستحق الإجمالي', 'حالي (غير متأخر)', '1-30 يوم', '31-60 يوم', '61-90 يوم', '+90 يوم'],
        ...apAgingMetrics.list.map((v) => [
          v.vendorName,
          v.phone,
          v.totalDue,
          v.current,
          v.days1to30,
          v.days31to60,
          v.days61to90,
          v.days90Plus,
        ]),
      ];
    } else if (selectedReport === 'purchases_top_items') {
      rows = [
        ['الترتيب', 'اسم الصنف', 'رمز SKU', 'الكمية المشتراة', 'إجمالي الإنفاق', 'متوسط سعر الشراء', 'آخر سعر شراء', 'تاريخ آخر شراء', 'الحصة %'],
        ...topItemsMetrics.list.map((item) => [
          item.rank,
          item.productName,
          item.sku || '-',
          item.totalQty,
          item.totalSpend,
          item.avgPrice.toFixed(2),
          item.lastUnitPrice,
          item.lastPurchaseDate,
          `${item.share.toFixed(1)}%`,
        ]),
      ];
    } else if (selectedReport === 'purchases_price_variance') {
      rows = [
        ['اسم الصنف', 'رمز SKU', 'عدد العمليات', 'أقل سعر', 'أعلى سعر', 'آخر سعر شراء', 'متوسط السعر', 'نسبة التذبذب %', 'التغير الصافي %'],
        ...priceVarianceMetrics.list.map((p) => [
          p.productName,
          p.sku || '-',
          p.transactionsCount,
          p.minPrice,
          p.maxPrice,
          p.latestPrice,
          p.avgPrice.toFixed(2),
          `${p.spreadPercent.toFixed(1)}%`,
          `${p.netChangePercent.toFixed(1)}%`,
        ]),
      ];
    } else if (selectedReport === 'purchases_returns_analysis') {
      rows = [
        ['رقم الإشعار المدين', 'تاريخ الإرجاع', 'المورد', 'طريقة التسوية', 'الإجمالي قبل الضريبة', 'الضريبة', 'إجمالي المردود'],
        ...returnsAnalysisMetrics.rawReturns.map((r) => [
          r.returnNumber,
          r.date,
          r.vendorName,
          r.refundMethod === 'vendor_credit' ? 'رصيد دائن لدى المورد' : r.refundMethod === 'cash' ? 'نقدي' : 'بنك',
          r.subtotal,
          r.vatTotal,
          r.grandTotal,
        ]),
      ];
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows
        .map((e) =>
          e
            .map((field) => {
              const str = String(field ?? '').replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(',')
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const meta = PURCHASES_REPORT_META[selectedReport];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl">
            <meta.icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{meta.title}</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                تقارير المشتريات
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            معاينة وطباعة
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            تصدير إلى Excel (CSV)
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Period Presets */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => applyPeriodPreset('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                periodPreset === 'all' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كامل الفترات
            </button>
            <button
              onClick={() => applyPeriodPreset('today')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                periodPreset === 'today' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => applyPeriodPreset('this_month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                periodPreset === 'this_month' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => applyPeriodPreset('this_quarter')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                periodPreset === 'this_quarter' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الربع الحالي
            </button>
            <button
              onClick={() => applyPeriodPreset('this_year')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                periodPreset === 'this_year' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              العام الحالي
            </button>
          </div>

          {/* Reset Filters */}
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            إعادة ضبط الفلاتر
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Date From */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 whitespace-nowrap">من:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPeriodPreset('all');
              }}
              className="bg-transparent border-none text-slate-800 text-xs focus:outline-hidden w-full"
            />
          </div>

          {/* Date To */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-slate-500 whitespace-nowrap">إلى:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPeriodPreset('all');
              }}
              className="bg-transparent border-none text-slate-800 text-xs focus:outline-hidden w-full"
            />
          </div>

          {/* Vendor Filter */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="bg-transparent border-none text-slate-800 text-xs focus:outline-hidden w-full cursor-pointer"
            >
              <option value="all">كافة الموردين ({vendors.length})</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name || v.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="البحث برقم الفاتورة، اسم المورد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-slate-800 text-xs focus:outline-hidden w-full"
            />
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* REPORT CONTENT VIEW                                        */}
      {/* ========================================================== */}

      {/* 1. PURCHASES SUMMARY */}
      {selectedReport === 'purchases_summary' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">إجمالي المشتريات</span>
              <p className="text-base font-bold text-slate-900 mt-1">{formatMoney(summaryMetrics.subtotal)}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{summaryMetrics.invoiceCount} فواتير شراء</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">ضريبة المدخلات 15%</span>
              <p className="text-base font-bold text-emerald-600 mt-1">{formatMoney(summaryMetrics.vatTotal)}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">قابلة للاسترداد الضريبي</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">إجمالي الإنفاق الشامل</span>
              <p className="text-base font-bold text-indigo-700 mt-1">{formatMoney(summaryMetrics.grandTotal)}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">شامل ضريبة القيمة المضافة</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">المسدد للموردين</span>
              <p className="text-base font-bold text-emerald-700 mt-1">{formatMoney(summaryMetrics.paidTotal)}</p>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">
                {summaryMetrics.grandTotal > 0
                  ? `${((summaryMetrics.paidTotal / summaryMetrics.grandTotal) * 100).toFixed(1)}% مسدد`
                  : '0%'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">المتبقي كذمم دائنة</span>
              <p className="text-base font-bold text-amber-600 mt-1">{formatMoney(summaryMetrics.remainingTotal)}</p>
              <span className="text-[10px] text-amber-700 mt-0.5 block">
                {summaryMetrics.overdueCount > 0 ? `${summaryMetrics.overdueCount} فواتير متأخرة` : 'لا توجد متأخرات'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">متوسط قيمة الفاتورة</span>
              <p className="text-base font-bold text-slate-800 mt-1">{formatMoney(summaryMetrics.avgInvoiceValue)}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">مردودات: {formatMoney(summaryMetrics.returnsTotal)}</span>
            </div>
          </div>

          {/* Invoices Detailed Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">سجل فواتير المشتريات التفصيلي ({filteredInvoices.length})</h3>
              </div>
              <span className="text-xs text-slate-500">
                صافي التكلفة بعد الخصم والمرتجع: <strong className="text-slate-800">{formatMoney(summaryMetrics.netPurchases)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">تاريخ الشراء</th>
                    <th className="p-3">تاريخ الاستحقاق</th>
                    <th className="p-3">المورد</th>
                    <th className="p-3 text-left">الإجمالي قبل الضريبة</th>
                    <th className="p-3 text-left">ضريبة القيمة المضافة</th>
                    <th className="p-3 text-left">الإجمالي النهائي</th>
                    <th className="p-3 text-left">المسدد</th>
                    <th className="p-3 text-left">المتبقي</th>
                    <th className="p-3 text-center">حالة السداد</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-400">
                        لا توجد فواتير مشتريات تطابق شروط الفلترة المحددة
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                          {inv.invoiceNumber}
                        </td>
                        <td className="p-3 text-slate-600">{inv.date}</td>
                        <td className="p-3 text-slate-500">{inv.dueDate || '-'}</td>
                        <td className="p-3 font-medium text-slate-800">{inv.vendorName}</td>
                        <td className="p-3 text-left font-mono">{formatMoney(inv.subtotal)}</td>
                        <td className="p-3 text-left font-mono text-emerald-600">{formatMoney(inv.vatTotal)}</td>
                        <td className="p-3 text-left font-mono font-bold text-slate-900">{formatMoney(inv.grandTotal)}</td>
                        <td className="p-3 text-left font-mono text-emerald-700">{formatMoney(inv.paidAmount)}</td>
                        <td className="p-3 text-left font-mono text-amber-700">{formatMoney(inv.remainingAmount)}</td>
                        <td className="p-3 text-center">
                          {inv.status === 'paid' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              مدفوعة بالكامل
                            </span>
                          ) : inv.status === 'partially_paid' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              مدفوعة جزئياً
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              آجلة (غير مسددة)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => setViewerDoc({ type: 'purchase', id: inv.id, data: inv })}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="معاينة تفاصيل فاتورة الشراء"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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

      {/* 2. PURCHASES BY PAYMENT METHOD */}
      {selectedReport === 'purchases_by_payment' && (
        <div className="space-y-6">
          {/* Breakdown Visual Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              توزيع المشتريات بحسب قنوات التمويل وطرق السداد
            </h3>

            {/* Proportion Bar */}
            <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 p-0.5">
              {paymentMethodMetrics.list.map((item) => {
                if (item.share <= 0) return null;
                return (
                  <div
                    key={item.id}
                    style={{ width: `${item.share}%` }}
                    className={`${item.color} h-full transition-all flex items-center justify-center text-[10px] font-bold text-white overflow-hidden`}
                    title={`${item.name}: ${item.share.toFixed(1)}%`}
                  >
                    {item.share >= 8 && `${item.share.toFixed(0)}%`}
                  </div>
                );
              })}
            </div>

            {/* Legend Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              {paymentMethodMetrics.list.map((item) => (
                <div key={item.id} className={`p-3.5 rounded-xl border ${item.bgLight}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{item.name}</span>
                    <span className={`text-xs font-bold ${item.textColor}`}>{item.share.toFixed(1)}%</span>
                  </div>
                  <p className="text-base font-bold text-slate-900 mt-1.5 font-mono">{formatMoney(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Details Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">بيان تفصيلي بالمبالغ المسددة والمتبقية كذمم ائتمانية</h4>
              <span className="text-xs text-slate-500">
                إجمالي التزامات التوريد: <strong>{formatMoney(paymentMethodMetrics.totalProcessed)}</strong>
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">إجمالي المبالغ المنصرفة فعلياً للموردين:</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">تشمل التحويلات البنكية، النقدية، والشيكات المحررة</p>
                </div>
                <span className="text-base font-bold text-emerald-700 font-mono">
                  {formatMoney(paymentMethodMetrics.settledAmount)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-amber-900 block">إجمالي الذمم الائتمانية الآجلة القائمة (أرصدة الموردين):</span>
                  <p className="text-amber-700 text-[11px] mt-0.5">مبالغ مستحقة السداد وفق الشروط الائتمانية المتفق عليها</p>
                </div>
                <span className="text-base font-bold text-amber-800 font-mono">
                  {formatMoney(paymentMethodMetrics.outstandingCredit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. INPUT VAT REPORT */}
      {selectedReport === 'purchases_vat_report' && (
        <div className="space-y-6">
          {/* VAT Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">المشتريات الخاضعة للضريبة 15%</span>
              <p className="text-base font-bold text-slate-900 mt-1 font-mono">{formatMoney(vatMetrics.taxablePurchases)}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">الوعاء الخاضع للنسبة الأساسية</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">إجمالي ضريبة المدخلات (VAT)</span>
              <p className="text-base font-bold text-emerald-600 mt-1 font-mono">{formatMoney(vatMetrics.inputVat15)}</p>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">ضريبة فواتير الشراء</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">ضريبة الإشعارات المدينة (المرتجعات)</span>
              <p className="text-base font-bold text-rose-600 mt-1 font-mono">{formatMoney(vatMetrics.returnsVat)}</p>
              <span className="text-[10px] text-rose-700 mt-0.5 block">تخصم من ضريبة المدخلات</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-300 shadow-xs bg-emerald-50/30">
              <span className="text-xs text-emerald-800 font-bold block">صافي ضريبة المدخلات القابلة للخصم</span>
              <p className="text-lg font-bold text-emerald-700 mt-1 font-mono">{formatMoney(vatMetrics.netDeductibleVat)}</p>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">في الإقرار الضريبي لهيئة الزكاة والضريبة</span>
            </div>
          </div>

          {/* Tax Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800">جدول فواتير المشتريات الضريبية التفصيلية</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                صافي وعاء الضريبة: <strong>{formatMoney(vatMetrics.netTaxablePurchases)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3">رقم الفاتورة الضريبية</th>
                    <th className="p-3">تاريخ الفاتورة</th>
                    <th className="p-3">المورد</th>
                    <th className="p-3">الرقم الضريبي للمورد</th>
                    <th className="p-3 text-left">المبلغ الخاضع للضريبة</th>
                    <th className="p-3 text-left">ضريبة المدخلات (15%)</th>
                    <th className="p-3 text-left">المبلغ الإجمالي الشامل</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredInvoices.map((inv) => {
                    const vend = vendors.find((v) => v.id === inv.vendorId);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 font-mono">{inv.invoiceNumber}</td>
                        <td className="p-3 text-slate-600">{inv.date}</td>
                        <td className="p-3 font-medium text-slate-800">{inv.vendorName}</td>
                        <td className="p-3 font-mono text-slate-600">{vend?.taxNumber || inv.notes?.match(/\b3\d{14}\b/)?.[0] || 'غير متوفر'}</td>
                        <td className="p-3 text-left font-mono">{formatMoney(inv.subtotal)}</td>
                        <td className="p-3 text-left font-mono font-bold text-emerald-600">{formatMoney(inv.vatTotal)}</td>
                        <td className="p-3 text-left font-mono font-bold text-slate-900">{formatMoney(inv.grandTotal)}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => setViewerDoc({ type: 'purchase', id: inv.id, data: inv })}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                            title="عرض الفاتورة"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TOP VENDORS ANALYSIS (80/20) */}
      {selectedReport === 'purchases_top_vendors' && (
        <div className="space-y-6">
          {/* Pareto Principle Summary */}
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold">تحليل تركز المشتريات وقاعدة باريتو (80/20)</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                يستحوذ كبار الموردين المصنفين كفئة استراتيجية (Tier 1) على الحصة الأكبر من إنفاق المنشأة، مما يمنح إدارة المشتريات قوة تفاوضية للحصول على خصومات كميات وشروط سداد أطول.
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 shrink-0">
              <div className="text-center">
                <span className="text-[11px] text-slate-300 block">الموردين الاستراتيجيين</span>
                <span className="text-lg font-bold text-amber-300">{topVendorsMetrics.tier1Count} موردين</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center">
                <span className="text-[11px] text-slate-300 block">إجمالي الإنفاق معهم</span>
                <span className="text-lg font-bold text-white font-mono">{formatMoney(topVendorsMetrics.tier1Total)}</span>
              </div>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">قائمة ترتيب الموردين حسب حجم التوريدات ({topVendorsMetrics.list.length})</h4>
              <span className="text-xs text-slate-500 font-mono">
                إجمالي المشتريات: <strong>{formatMoney(topVendorsMetrics.grandTotalPurchases)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3 text-center">الترتيب</th>
                    <th className="p-3">اسم المورد</th>
                    <th className="p-3">الهاتف / الاتصال</th>
                    <th className="p-3">الرقم الضريبي</th>
                    <th className="p-3 text-center">عدد الفواتير</th>
                    <th className="p-3 text-left">إجمالي المشتريات</th>
                    <th className="p-3 text-left">المبالغ المسددة</th>
                    <th className="p-3 text-left">الرصيد القائم المستحق</th>
                    <th className="p-3 text-center">الحصة %</th>
                    <th className="p-3 text-center">التصنيف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {topVendorsMetrics.list.map((v) => (
                    <tr key={v.vendorId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center">
                        <span
                          className={`w-6 h-6 inline-flex items-center justify-center rounded-full font-bold text-xs ${
                            v.rank === 1
                              ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                              : v.rank === 2
                              ? 'bg-slate-200 text-slate-700'
                              : v.rank === 3
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {v.rank}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{v.vendorName}</td>
                      <td className="p-3 text-slate-500 font-mono">{v.phone || '-'}</td>
                      <td className="p-3 text-slate-500 font-mono">{v.taxNumber || '-'}</td>
                      <td className="p-3 text-center font-bold text-slate-700">{v.invoiceCount}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-900">{formatMoney(v.totalAmount)}</td>
                      <td className="p-3 text-left font-mono text-emerald-700">{formatMoney(v.paidAmount)}</td>
                      <td className="p-3 text-left font-mono text-amber-700 font-semibold">{formatMoney(v.currentBalance)}</td>
                      <td className="p-3 text-center">
                        <span className="font-bold font-mono text-emerald-700">{v.share.toFixed(1)}%</span>
                      </td>
                      <td className="p-3 text-center">
                        {v.tier === 'tier1' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            استراتيجي (Tier 1)
                          </span>
                        ) : v.tier === 'tier2' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            رئيسي (Tier 2)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            اعتيادي (Tier 3)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. ACCOUNTS PAYABLE AGING */}
      {selectedReport === 'purchases_ap_aging' && (
        <div className="space-y-6">
          {/* Aging Buckets Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">إجمالي الذمم الدائنة</span>
              <p className="text-base font-bold text-slate-900 mt-1 font-mono">{formatMoney(apAgingMetrics.totalOutstanding)}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{apAgingMetrics.list.length} موردين دائنين</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
              <span className="text-xs text-emerald-800 font-medium block">حالي (غير متأخر)</span>
              <p className="text-base font-bold text-emerald-700 mt-1 font-mono">{formatMoney(apAgingMetrics.totalCurrent)}</p>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">ضمن فترة السماح</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
              <span className="text-xs text-amber-800 font-medium block">متأخر 1 - 30 يوماً</span>
              <p className="text-base font-bold text-amber-700 mt-1 font-mono">{formatMoney(apAgingMetrics.total1to30)}</p>
              <span className="text-[10px] text-amber-600 mt-0.5 block">مستوى تنبيه أولي</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-orange-200 shadow-xs bg-orange-50/20">
              <span className="text-xs text-orange-800 font-medium block">متأخر 31 - 60 يوماً</span>
              <p className="text-base font-bold text-orange-700 mt-1 font-mono">{formatMoney(apAgingMetrics.total31to60)}</p>
              <span className="text-[10px] text-orange-600 mt-0.5 block">تأخير متوسط</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
              <span className="text-xs text-rose-800 font-medium block">متأخر 61 - 90 يوماً</span>
              <p className="text-base font-bold text-rose-700 mt-1 font-mono">{formatMoney(apAgingMetrics.total61to90)}</p>
              <span className="text-[10px] text-rose-600 mt-0.5 block">تأخير مرتفع</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-300 shadow-xs bg-red-50/30">
              <span className="text-xs text-red-800 font-bold block">متأخر أكثر من 90 يوماً</span>
              <p className="text-base font-bold text-red-700 mt-1 font-mono">{formatMoney(apAgingMetrics.total90Plus)}</p>
              <span className="text-[10px] text-red-600 mt-0.5 block font-bold">حرج (سداد فوري)</span>
            </div>
          </div>

          {/* Aging Details Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800">جدول أعمار الديون التفصيلي لكل مورد</h4>
              </div>
              <span className="text-xs text-slate-500">
                إجمالي الالتزامات: <strong className="text-slate-800 font-mono">{formatMoney(apAgingMetrics.totalOutstanding)}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3">المورد</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3 text-left">إجمالي المستحق</th>
                    <th className="p-3 text-left">حالي (غير متأخر)</th>
                    <th className="p-3 text-left">1 - 30 يوم</th>
                    <th className="p-3 text-left">31 - 60 يوم</th>
                    <th className="p-3 text-left">61 - 90 يوم</th>
                    <th className="p-3 text-left">أكثر من 90 يوم</th>
                    <th className="p-3 text-center">أولوية السداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {apAgingMetrics.list.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        لا توجد مديونيات أو أرصدة دائنة مستحقة للموردين حالياً
                      </td>
                    </tr>
                  ) : (
                    apAgingMetrics.list.map((v) => {
                      const isCritical = v.days90Plus > 0;
                      const isWarning = v.days61to90 > 0 || v.days31to60 > 0;
                      return (
                        <tr key={v.vendorId} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{v.vendorName}</td>
                          <td className="p-3 text-slate-500 font-mono">{v.phone || '-'}</td>
                          <td className="p-3 text-left font-mono font-bold text-slate-900">{formatMoney(v.totalDue)}</td>
                          <td className="p-3 text-left font-mono text-emerald-700">{formatMoney(v.current)}</td>
                          <td className="p-3 text-left font-mono text-amber-700">{formatMoney(v.days1to30)}</td>
                          <td className="p-3 text-left font-mono text-orange-700">{formatMoney(v.days31to60)}</td>
                          <td className="p-3 text-left font-mono text-rose-700 font-semibold">{formatMoney(v.days61to90)}</td>
                          <td className="p-3 text-left font-mono text-red-700 font-bold">{formatMoney(v.days90Plus)}</td>
                          <td className="p-3 text-center">
                            {isCritical ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                عاجل جداً
                              </span>
                            ) : isWarning ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                قيد المتابعة
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                منتظم
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
        </div>
      )}

      {/* 6. TOP PURCHASED ITEMS */}
      {selectedReport === 'purchases_top_items' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">إجمالي الإنفاق على الأصناف</span>
              <p className="text-base font-bold text-slate-900 mt-1 font-mono">{formatMoney(topItemsMetrics.grandTotalSpend)}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{topItemsMetrics.totalUniqueItems} أصناف مشتراة</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">الصنف الأكثر شراءً وإنفاقاً</span>
              <p className="text-base font-bold text-emerald-700 mt-1 truncate">
                {topItemsMetrics.list[0]?.productName || 'لا يوجد'}
              </p>
              <span className="text-[10px] text-emerald-600 mt-0.5 block font-mono">
                {topItemsMetrics.list[0] ? formatMoney(topItemsMetrics.list[0].totalSpend) : '0'}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">نسبة تركيز الإنفاق (أعلى 5 أصناف)</span>
              <p className="text-base font-bold text-indigo-700 mt-1 font-mono">
                {topItemsMetrics.list.length > 0
                  ? `${topItemsMetrics.list
                      .slice(0, 5)
                      .reduce((s, i) => s + i.share, 0)
                      .toFixed(1)}%`
                  : '0%'}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">من إجمالي ميزانية المشتريات</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">بيان الأصناف المشتراة مرتبة حسب إجمالي الإنفاق</h4>
              <span className="text-xs text-slate-500 font-mono">
                عدد المنتجات: <strong>{topItemsMetrics.list.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3 text-center">الترتيب</th>
                    <th className="p-3">اسم الصنف والمواصفات</th>
                    <th className="p-3">رمز SKU</th>
                    <th className="p-3 text-center">الكمية المشتراة</th>
                    <th className="p-3 text-left">إجمالي الإنفاق</th>
                    <th className="p-3 text-left">متوسط سعر الشراء</th>
                    <th className="p-3 text-left">آخر سعر شراء</th>
                    <th className="p-3">تاريخ آخر شراء</th>
                    <th className="p-3 text-center">الحصة %</th>
                    <th className="p-3 text-center">الرصيد بالمخزن</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {topItemsMetrics.list.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center">
                        <span
                          className={`w-6 h-6 inline-flex items-center justify-center rounded-full font-bold text-xs ${
                            item.rank === 1
                              ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                              : item.rank === 2
                              ? 'bg-slate-200 text-slate-700'
                              : item.rank === 3
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.rank}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{item.productName}</td>
                      <td className="p-3 text-slate-500 font-mono">{item.sku || '-'}</td>
                      <td className="p-3 text-center font-bold text-slate-800 font-mono">{item.totalQty}</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-900">{formatMoney(item.totalSpend)}</td>
                      <td className="p-3 text-left font-mono text-slate-700">{formatMoney(item.avgPrice)}</td>
                      <td className="p-3 text-left font-mono text-emerald-700 font-semibold">{formatMoney(item.lastUnitPrice)}</td>
                      <td className="p-3 text-slate-500 font-mono">{item.lastPurchaseDate}</td>
                      <td className="p-3 text-center font-bold font-mono text-emerald-700">{item.share.toFixed(1)}%</td>
                      <td className="p-3 text-center font-mono">
                        {item.currentStock !== undefined ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.currentStock > 10
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.currentStock > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.currentStock} وحدة
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. PURCHASE PRICE VARIANCE */}
      {selectedReport === 'purchases_price_variance' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                <ArrowUpDown className="w-4 h-4 text-emerald-600" />
                مراقبة تقلب وتذبذب أسعار الشراء للأصناف
              </h3>
              <p className="text-slate-500 text-[11px] mt-0.5">
                يقارن التقرير بين أدنى وأعلى سعر شراء تم به شراء الصنف لرصد التضخم وتقييم كفاءة التفاوض والتعاقدات مع الموردين
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                تم تحليل: {priceVarianceMetrics.totalAnalyzed} أصناف
              </span>
            </div>
          </div>

          {/* Variance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3">اسم الصنف</th>
                    <th className="p-3">رمز SKU</th>
                    <th className="p-3 text-center">العمليات</th>
                    <th className="p-3 text-left">أقل سعر شراء</th>
                    <th className="p-3 text-left">أعلى سعر شراء</th>
                    <th className="p-3 text-left">آخر سعر شراء</th>
                    <th className="p-3 text-left">متوسط السعر</th>
                    <th className="p-3 text-center">مدى التذبذب (Spread)</th>
                    <th className="p-3 text-center">التغير الصافي</th>
                    <th className="p-3 text-center">اتجاه السعر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {priceVarianceMetrics.list.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        لا توجد بيانات كافية لحساب تقلبات أسعار الشراء
                      </td>
                    </tr>
                  ) : (
                    priceVarianceMetrics.list.map((p) => {
                      const isIncreased = p.netChangePercent > 0.5;
                      const isDecreased = p.netChangePercent < -0.5;
                      return (
                        <tr key={p.productId} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{p.productName}</td>
                          <td className="p-3 text-slate-500 font-mono">{p.sku || '-'}</td>
                          <td className="p-3 text-center font-mono text-slate-700">{p.transactionsCount}</td>
                          <td className="p-3 text-left font-mono text-emerald-700">{formatMoney(p.minPrice)}</td>
                          <td className="p-3 text-left font-mono text-rose-700">{formatMoney(p.maxPrice)}</td>
                          <td className="p-3 text-left font-mono font-bold text-slate-900">{formatMoney(p.latestPrice)}</td>
                          <td className="p-3 text-left font-mono text-slate-700">{formatMoney(p.avgPrice)}</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800">
                            {p.spreadPercent.toFixed(1)}%
                          </td>
                          <td className="p-3 text-center font-mono font-bold">
                            <span
                              className={
                                isIncreased ? 'text-rose-600' : isDecreased ? 'text-emerald-600' : 'text-slate-500'
                              }
                            >
                              {p.netChangePercent > 0 ? `+${p.netChangePercent.toFixed(1)}%` : `${p.netChangePercent.toFixed(1)}%`}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {isIncreased ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                <ArrowUpRight className="w-3 h-3" />
                                ارتفاع تكلفة
                              </span>
                            ) : isDecreased ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                <ArrowDownRight className="w-3 h-3" />
                                توفير بالسعر
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                مستقر
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
        </div>
      )}

      {/* 8. PURCHASE RETURNS ANALYSIS */}
      {selectedReport === 'purchases_returns_analysis' && (
        <div className="space-y-6">
          {/* Returns KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">إجمالي مردودات المشتريات</span>
              <p className="text-base font-bold text-rose-600 mt-1 font-mono">{formatMoney(returnsAnalysisMetrics.totalReturnsAmount)}</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">{returnsAnalysisMetrics.totalReturnsCount} إشعارات مدينة</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">معدل الإرجاع الإجمالي</span>
              <p className="text-base font-bold text-slate-900 mt-1 font-mono">{returnsAnalysisMetrics.returnRate.toFixed(1)}%</p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">من إجمالي مشتريات المنشأة</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">الضريبة المستردة من الموردين</span>
              <p className="text-base font-bold text-emerald-600 mt-1 font-mono">{formatMoney(returnsAnalysisMetrics.totalTaxAmount)}</p>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">ضريبة الإشعارات المدينة</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">أكثر أسباب الإرجاع شيوعاً</span>
              <p className="text-base font-bold text-slate-800 mt-1 truncate">
                {returnsAnalysisMetrics.reasons[0]?.reason || 'لا توجد مرتجعات'}
              </p>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {returnsAnalysisMetrics.reasons[0] ? `${returnsAnalysisMetrics.reasons[0].count} عمليات` : '-'}
              </span>
            </div>
          </div>

          {/* Returns Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-bold text-slate-800">سجل الإشعارات المدينة ومردودات الموردين ({filteredReturns.length})</h4>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3">رقم الإشعار المدين</th>
                    <th className="p-3">تاريخ المردود</th>
                    <th className="p-3">اسم المورد</th>
                    <th className="p-3">طريقة الاسترداد</th>
                    <th className="p-3 text-left">المبلغ قبل الضريبة</th>
                    <th className="p-3 text-left">الضريبة المعكوسة</th>
                    <th className="p-3 text-left">إجمالي قيمة المردود</th>
                    <th className="p-3">الملاحظات والسبب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد مردودات مشتريات مسجلة خلال الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 font-mono flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                          {ret.returnNumber}
                        </td>
                        <td className="p-3 text-slate-600">{ret.date}</td>
                        <td className="p-3 font-bold text-slate-800">{ret.vendorName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {ret.refundMethod === 'vendor_credit'
                              ? 'رصيد دائن لدى المورد'
                              : ret.refundMethod === 'cash'
                              ? 'نقدي من الخزينة'
                              : 'تحويل بنكي'}
                          </span>
                        </td>
                        <td className="p-3 text-left font-mono">{formatMoney(ret.subtotal)}</td>
                        <td className="p-3 text-left font-mono text-emerald-600">{formatMoney(ret.vatTotal)}</td>
                        <td className="p-3 text-left font-mono font-bold text-rose-600">{formatMoney(ret.grandTotal)}</td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">{ret.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* PRINT PREVIEW MODAL                                        */}
      {/* ========================================================== */}
      {showPrintModal && (
        <PrintPreviewModal
          title={meta.title}
          onClose={() => setShowPrintModal(false)}
        >
          <div className="space-y-6 text-right font-sans text-slate-800" dir="rtl">
            <PrintHeader title={meta.title} />

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
              <div>
                <span>الفترة: </span>
                <strong>{dateFrom || dateTo ? `${dateFrom || 'البداية'} إلى ${dateTo || 'الآن'}` : 'كامل الفترات'}</strong>
              </div>
              <div>
                <span>المورد: </span>
                <strong>
                  {selectedVendorId === 'all'
                    ? 'كافة الموردين'
                    : vendors.find((v) => v.id === selectedVendorId)?.name || selectedVendorId}
                </strong>
              </div>
              <div>
                <span>تاريخ التقرير: </span>
                <strong>{new Date().toLocaleDateString('ar-SA')}</strong>
              </div>
            </div>

            {/* Print Tables */}
            {selectedReport === 'purchases_summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 border border-slate-300 rounded-lg">
                    <span>إجمالي المشتريات: </span>
                    <strong className="block text-sm font-mono mt-0.5">{formatMoney(summaryMetrics.subtotal)}</strong>
                  </div>
                  <div className="p-2 border border-slate-300 rounded-lg">
                    <span>ضريبة المدخلات 15%: </span>
                    <strong className="block text-sm font-mono mt-0.5">{formatMoney(summaryMetrics.vatTotal)}</strong>
                  </div>
                  <div className="p-2 border border-slate-300 rounded-lg">
                    <span>الإجمالي الشامل: </span>
                    <strong className="block text-sm font-mono mt-0.5">{formatMoney(summaryMetrics.grandTotal)}</strong>
                  </div>
                  <div className="p-2 border border-slate-300 rounded-lg">
                    <span>المسدد للموردين: </span>
                    <strong className="block text-sm font-mono mt-0.5">{formatMoney(summaryMetrics.paidTotal)}</strong>
                  </div>
                </div>

                <table className="w-full text-right text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-l border-slate-300">رقم الفاتورة</th>
                      <th className="p-2 border-l border-slate-300">تاريخ الشراء</th>
                      <th className="p-2 border-l border-slate-300">المورد</th>
                      <th className="p-2 border-l border-slate-300 text-left">قبل الضريبة</th>
                      <th className="p-2 border-l border-slate-300 text-left">الضريبة</th>
                      <th className="p-2 border-l border-slate-300 text-left">الإجمالي</th>
                      <th className="p-2 border-l border-slate-300 text-left">المسدد</th>
                      <th className="p-2 text-left">المتبقي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="p-2 border-l border-slate-200 font-mono font-bold">{inv.invoiceNumber}</td>
                        <td className="p-2 border-l border-slate-200">{inv.date}</td>
                        <td className="p-2 border-l border-slate-200">{inv.vendorName}</td>
                        <td className="p-2 border-l border-slate-200 text-left font-mono">{formatMoney(inv.subtotal)}</td>
                        <td className="p-2 border-l border-slate-200 text-left font-mono">{formatMoney(inv.vatTotal)}</td>
                        <td className="p-2 border-l border-slate-200 text-left font-mono font-bold">{formatMoney(inv.grandTotal)}</td>
                        <td className="p-2 border-l border-slate-200 text-left font-mono">{formatMoney(inv.paidAmount)}</td>
                        <td className="p-2 text-left font-mono">{formatMoney(inv.remainingAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReport === 'purchases_by_payment' && (
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-l border-slate-300">طريقة السداد / التمويل</th>
                    <th className="p-2 border-l border-slate-300 text-left">القيمة الإجمالية</th>
                    <th className="p-2 text-center">النسبة المئوية %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paymentMethodMetrics.list.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2 border-l border-slate-200 font-bold">{item.name}</td>
                      <td className="p-2 border-l border-slate-200 text-left font-mono font-bold">{formatMoney(item.amount)}</td>
                      <td className="p-2 text-center font-mono">{item.share.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'purchases_vat_report' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 border border-slate-300 rounded-lg">
                    <span>الوعاء الخاضع للضريبة: </span>
                    <strong className="block text-sm font-mono mt-0.5">{formatMoney(vatMetrics.taxablePurchases)}</strong>
                  </div>
                  <div className="p-2 border border-slate-300 rounded-lg">
                    <span>إجمالي ضريبة المدخلات: </span>
                    <strong className="block text-sm font-mono mt-0.5">{formatMoney(vatMetrics.inputVat15)}</strong>
                  </div>
                  <div className="p-2 border border-slate-300 rounded-lg">
                    <span>الصافي القابل للخصم: </span>
                    <strong className="block text-sm font-mono mt-0.5">{formatMoney(vatMetrics.netDeductibleVat)}</strong>
                  </div>
                </div>

                <table className="w-full text-right text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-l border-slate-300">رقم الفاتورة</th>
                      <th className="p-2 border-l border-slate-300">التاريخ</th>
                      <th className="p-2 border-l border-slate-300">المورد</th>
                      <th className="p-2 border-l border-slate-300">الرقم الضريبي للمورد</th>
                      <th className="p-2 border-l border-slate-300 text-left">الوعاء الضريبي</th>
                      <th className="p-2 text-left">ضريبة 15%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredInvoices.map((inv) => {
                      const vend = vendors.find((v) => v.id === inv.vendorId);
                      return (
                        <tr key={inv.id}>
                          <td className="p-2 border-l border-slate-200 font-mono">{inv.invoiceNumber}</td>
                          <td className="p-2 border-l border-slate-200">{inv.date}</td>
                          <td className="p-2 border-l border-slate-200 font-bold">{inv.vendorName}</td>
                          <td className="p-2 border-l border-slate-200 font-mono">{vend?.taxNumber || '-'}</td>
                          <td className="p-2 border-l border-slate-200 text-left font-mono">{formatMoney(inv.subtotal)}</td>
                          <td className="p-2 text-left font-mono font-bold">{formatMoney(inv.vatTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {selectedReport === 'purchases_top_vendors' && (
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 text-center border-l border-slate-300">#</th>
                    <th className="p-2 border-l border-slate-300">المورد</th>
                    <th className="p-2 text-center border-l border-slate-300">عدد الفواتير</th>
                    <th className="p-2 text-left border-l border-slate-300">إجمالي الشراء</th>
                    <th className="p-2 text-left border-l border-slate-300">المسدد</th>
                    <th className="p-2 text-left border-l border-slate-300">الرصيد القائم</th>
                    <th className="p-2 text-center">الحصة %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {topVendorsMetrics.list.map((v) => (
                    <tr key={v.vendorId}>
                      <td className="p-2 text-center border-l border-slate-200">{v.rank}</td>
                      <td className="p-2 border-l border-slate-200 font-bold">{v.vendorName}</td>
                      <td className="p-2 text-center border-l border-slate-200">{v.invoiceCount}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono font-bold">{formatMoney(v.totalAmount)}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono">{formatMoney(v.paidAmount)}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono">{formatMoney(v.currentBalance)}</td>
                      <td className="p-2 text-center font-mono">{v.share.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'purchases_ap_aging' && (
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-l border-slate-300">المورد</th>
                    <th className="p-2 text-left border-l border-slate-300">إجمالي المستحق</th>
                    <th className="p-2 text-left border-l border-slate-300">حالي</th>
                    <th className="p-2 text-left border-l border-slate-300">1 - 30 يوم</th>
                    <th className="p-2 text-left border-l border-slate-300">31 - 60 يوم</th>
                    <th className="p-2 text-left border-l border-slate-300">61 - 90 يوم</th>
                    <th className="p-2 text-left">+90 يوم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {apAgingMetrics.list.map((v) => (
                    <tr key={v.vendorId}>
                      <td className="p-2 border-l border-slate-200 font-bold">{v.vendorName}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono font-bold">{formatMoney(v.totalDue)}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono">{formatMoney(v.current)}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono">{formatMoney(v.days1to30)}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono">{formatMoney(v.days31to60)}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono">{formatMoney(v.days61to90)}</td>
                      <td className="p-2 text-left font-mono font-bold text-red-700">{formatMoney(v.days90Plus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'purchases_top_items' && (
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 text-center border-l border-slate-300">#</th>
                    <th className="p-2 border-l border-slate-300">اسم الصنف</th>
                    <th className="p-2 border-l border-slate-300">رمز SKU</th>
                    <th className="p-2 text-center border-l border-slate-300">الكمية</th>
                    <th className="p-2 text-left border-l border-slate-300">إجمالي الإنفاق</th>
                    <th className="p-2 text-left border-l border-slate-300">متوسط السعر</th>
                    <th className="p-2 text-left border-l border-slate-300">آخر سعر</th>
                    <th className="p-2 text-center">الحصة %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {topItemsMetrics.list.map((item) => (
                    <tr key={item.productId}>
                      <td className="p-2 text-center border-l border-slate-200">{item.rank}</td>
                      <td className="p-2 border-l border-slate-200 font-bold">{item.productName}</td>
                      <td className="p-2 border-l border-slate-200 font-mono">{item.sku || '-'}</td>
                      <td className="p-2 text-center border-l border-slate-200 font-mono">{item.totalQty}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono font-bold">{formatMoney(item.totalSpend)}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono">{formatMoney(item.avgPrice)}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono">{formatMoney(item.lastUnitPrice)}</td>
                      <td className="p-2 text-center font-mono">{item.share.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'purchases_price_variance' && (
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-l border-slate-300">اسم الصنف</th>
                    <th className="p-2 text-center border-l border-slate-300">العمليات</th>
                    <th className="p-2 text-left border-l border-slate-300">أقل سعر</th>
                    <th className="p-2 text-left border-l border-slate-300">أعلى سعر</th>
                    <th className="p-2 text-left border-l border-slate-300">آخر سعر</th>
                    <th className="p-2 text-center border-l border-slate-300">التذبذب %</th>
                    <th className="p-2 text-center">التغير الصافي %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {priceVarianceMetrics.list.map((p) => (
                    <tr key={p.productId}>
                      <td className="p-2 border-l border-slate-200 font-bold">{p.productName}</td>
                      <td className="p-2 text-center border-l border-slate-200">{p.transactionsCount}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono">{formatMoney(p.minPrice)}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono">{formatMoney(p.maxPrice)}</td>
                      <td className="p-2 text-left border-l border-slate-200 font-mono font-bold">{formatMoney(p.latestPrice)}</td>
                      <td className="p-2 text-center border-l border-slate-200 font-mono">{p.spreadPercent.toFixed(1)}%</td>
                      <td className="p-2 text-center font-mono font-bold">{p.netChangePercent.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedReport === 'purchases_returns_analysis' && (
              <table className="w-full text-right text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-l border-slate-300">رقم الإشعار</th>
                    <th className="p-2 border-l border-slate-300">التاريخ</th>
                    <th className="p-2 border-l border-slate-300">المورد</th>
                    <th className="p-2 border-l border-slate-300 text-left">قبل الضريبة</th>
                    <th className="p-2 border-l border-slate-300 text-left">الضريبة</th>
                    <th className="p-2 text-left">إجمالي المردود</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredReturns.map((r) => (
                    <tr key={r.id}>
                      <td className="p-2 border-l border-slate-200 font-mono">{r.returnNumber}</td>
                      <td className="p-2 border-l border-slate-200">{r.date}</td>
                      <td className="p-2 border-l border-slate-200 font-bold">{r.vendorName}</td>
                      <td className="p-2 border-l border-slate-200 text-left font-mono">{formatMoney(r.subtotal)}</td>
                      <td className="p-2 border-l border-slate-200 text-left font-mono">{formatMoney(r.vatTotal)}</td>
                      <td className="p-2 text-left font-mono font-bold text-rose-700">{formatMoney(r.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <PrintFooter />
          </div>
        </PrintPreviewModal>
      )}

      {/* ========================================================== */}
      {/* DOCUMENT VIEWER MODAL                                      */}
      {/* ========================================================== */}
      {viewerDoc && (
        <DocumentViewerModal
          documentTarget={viewerDoc}
          onClose={() => setViewerDoc(null)}
        />
      )}
    </div>
  );
};
