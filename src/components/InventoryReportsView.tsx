import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  ArrowRightLeft,
  AlertTriangle,
  Clock,
  Building2,
  Scale,
  Calendar,
  TrendingUp,
  Package,
  Layers,
  Search,
  Filter,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Warehouse as WarehouseIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ArrowUpDown,
  ShoppingBag,
  ExternalLink,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import { PrintPreviewModal } from './PrintPreviewModal';
import { Product, Warehouse, StockAdjustment, StockTransfer, ScrapVoucher, ProductBatch } from '../types';

export type InventoryReportType =
  | 'inventory_valuation'
  | 'inventory_movement'
  | 'inventory_reorder'
  | 'inventory_aging'
  | 'inventory_warehouses_balance'
  | 'inventory_variance'
  | 'inventory_expiry'
  | 'inventory_profitability';

export const INVENTORY_REPORT_META: Record<
  InventoryReportType,
  {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  inventory_valuation: {
    title: 'تقرير تقييم المخزون المالي (Inventory Valuation)',
    subtitle: 'حساب القيمة الدفترية بسعر التكلفة، القيمة بسعر البيع، وهامش الربح الإجمالي الكامن',
    icon: DollarSign,
  },
  inventory_movement: {
    title: 'كشف حركة الصنف وكارت الصنف التفصيلي (Stock Movement & Ledger)',
    subtitle: 'التتبع الزمني الدقيق لكافة حركات الوارد والمنصرف والتحويل والتسوية مع الرصيد اللحظي',
    icon: ArrowRightLeft,
  },
  inventory_reorder: {
    title: 'مراقبة النواقص وتنبيهات حد إعادة الطلب (Stock Alerts)',
    subtitle: 'حصر الأصناف الحرجة والمنعدمة واقتراح كميات الشراء الذكية لتأمين متطلبات السوق',
    icon: AlertTriangle,
  },
  inventory_aging: {
    title: 'تحليل دوران المخزون والبضاعة الراكدة (Aging & Turnover)',
    subtitle: 'تصنيف سرعة حركة البضاعة (سريعة، متوسطة، بطيئة، راكدة) وتحرير رأس المال المجمد',
    icon: Clock,
  },
  inventory_warehouses_balance: {
    title: 'تقرير أرصدة المستودعات والمقارنة المكانية (Multi-Warehouse)',
    subtitle: 'مصفوفة مقارنة كميات وتوزيع الأصناف بين المستودعات والفروع ومواقع التخزين والأرفف',
    icon: Building2,
  },
  inventory_variance: {
    title: 'تقرير عجز وزيادة الجرد وفروقات التسوية (Variance & Shrinkage)',
    subtitle: 'مقارنة الأرصدة الفعلية بالدفتري، حصر العجز والزيادات، واحتساب معدل الهدر المخزني',
    icon: Scale,
  },
  inventory_expiry: {
    title: 'تقرير الصلاحيات والتشغيلات والتوالف (Expiry & Scrap Loss)',
    subtitle: 'متابعة الدفعات المنتهية والقريبة من الانتهاء، وتكلفة بضائع محاضر الإتلاف والهوالك',
    icon: Calendar,
  },
  inventory_profitability: {
    title: 'تحليل ربحية الأصناف وهامش المساهمة (Item Profitability)',
    subtitle: 'تحليل ربحية كل صنف، مقارنة سعر البيع بالتكلفة، وحساب نسب الهامش الإجمالي والمساهمة',
    icon: TrendingUp,
  },
};

export const InventoryReportsView: React.FC = () => {
  const {
    products = [],
    warehouses = [],
    stockMovements = [],
    stockTransfers = [],
    stockAdjustments = [],
    stocktakingSessions = [],
    scrapVouchers = [],
    productBatches = [],
    salesInvoices = [],
    purchases = [],
    salesReturns = [],
    purchaseReturns = [],
    currency,
    formatMoney,
    formatDualMoney,
    activeSubTab,
    setActiveSubTab,
    navigateTo,
    getProductQuantityInWarehouse,
  } = useErp();

  // Active Report State - sync with activeSubTab
  const [selectedReport, setSelectedReport] = useState<InventoryReportType>(() => {
    if (activeSubTab && Object.keys(INVENTORY_REPORT_META).includes(activeSubTab)) {
      return activeSubTab as InventoryReportType;
    }
    if (activeSubTab === 'inventory_warehouses' || activeSubTab === 'inventory_warehouses_report') {
      return 'inventory_warehouses_balance';
    }
    return 'inventory_valuation';
  });

  React.useEffect(() => {
    if (activeSubTab && Object.keys(INVENTORY_REPORT_META).includes(activeSubTab)) {
      setSelectedReport(activeSubTab as InventoryReportType);
    } else if (activeSubTab === 'inventory_warehouses' || activeSubTab === 'inventory_warehouses_report') {
      setSelectedReport('inventory_warehouses_balance');
    }
  }, [activeSubTab]);

  // Universal Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Available Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Initialize selected product for movement card
  React.useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Filtered Products List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (selectedWarehouseId !== 'all') {
        if (p.warehouseId !== selectedWarehouseId && (!p.warehouseStocks || !p.warehouseStocks.some((ws) => ws.warehouseId === selectedWarehouseId && ws.quantity > 0))) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
        if (!matchName && !matchSku && !matchBarcode) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedWarehouseId, searchQuery]);

  // 1. Valuation Calculations
  const valuationMetrics = useMemo(() => {
    let totalCost = 0;
    let totalRetail = 0;
    let totalUnits = 0;

    filteredProducts.forEach((p) => {
      const qty = p.stockQuantity || 0;
      totalUnits += qty;
      totalCost += qty * (p.costPrice || 0);
      totalRetail += qty * (p.sellingPrice || 0);
    });

    const potentialMargin = totalRetail - totalCost;
    const marginPercent = totalRetail > 0 ? (potentialMargin / totalRetail) * 100 : 0;

    return {
      totalCost,
      totalRetail,
      totalUnits,
      potentialMargin,
      marginPercent,
    };
  }, [filteredProducts]);

  // 2. Reorder & Alerts Calculations
  const reorderMetrics = useMemo(() => {
    const lowStockItems = filteredProducts.filter((p) => p.stockQuantity <= p.minStockAlert);
    const zeroStockItems = filteredProducts.filter((p) => p.stockQuantity <= 0);
    let totalDeficitCost = 0;

    lowStockItems.forEach((p) => {
      const deficit = Math.max(p.minStockAlert - p.stockQuantity, 0);
      const suggestedQty = deficit > 0 ? deficit * 2 : 10;
      totalDeficitCost += suggestedQty * (p.costPrice || 0);
    });

    return {
      lowStockItems,
      zeroStockItems,
      totalDeficitCost,
    };
  }, [filteredProducts]);

  // 3. Stock Aging Calculations
  const agingAnalysis = useMemo(() => {
    const now = new Date().getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    const items = filteredProducts.map((p) => {
      // Find latest sale date or latest movement date
      let latestDate = 0;

      // Look in sales invoices
      salesInvoices.forEach((inv) => {
        if (inv.items && inv.items.some((item) => item.productId === p.id)) {
          const invDate = new Date(inv.date || inv.issueDate || '').getTime();
          if (!isNaN(invDate) && invDate > latestDate) latestDate = invDate;
        }
      });

      // Look in stock movements
      stockMovements.forEach((m) => {
        if (m.productId === p.id) {
          const mDate = new Date(m.date).getTime();
          if (!isNaN(mDate) && mDate > latestDate) latestDate = mDate;
        }
      });

      const daysInactive = latestDate > 0 ? Math.floor((now - latestDate) / dayMs) : 120; // default 120 if no movement
      const frozenCapital = (p.stockQuantity || 0) * (p.costPrice || 0);

      let status: 'fast' | 'normal' | 'slow' | 'stagnant' = 'normal';
      if (daysInactive <= 30) status = 'fast';
      else if (daysInactive <= 60) status = 'normal';
      else if (daysInactive <= 90) status = 'slow';
      else status = 'stagnant';

      return {
        ...p,
        daysInactive,
        frozenCapital,
        status,
      };
    });

    const fastItems = items.filter((i) => i.status === 'fast');
    const normalItems = items.filter((i) => i.status === 'normal');
    const slowItems = items.filter((i) => i.status === 'slow');
    const stagnantItems = items.filter((i) => i.status === 'stagnant');

    const totalCapital = items.reduce((acc, i) => acc + i.frozenCapital, 0);
    const stagnantCapital = stagnantItems.reduce((acc, i) => acc + i.frozenCapital, 0);
    const stagnantPercent = totalCapital > 0 ? (stagnantCapital / totalCapital) * 100 : 0;

    return {
      items,
      fastItems,
      normalItems,
      slowItems,
      stagnantItems,
      totalCapital,
      stagnantCapital,
      stagnantPercent,
    };
  }, [filteredProducts, salesInvoices, stockMovements]);

  // 4. Item Movement / Stock Ledger for Selected Product
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  const movementLedger = useMemo(() => {
    if (!selectedProduct) return [];

    const ledger: {
      id: string;
      date: string;
      type: string;
      reference: string;
      warehouseName: string;
      qtyIn: number;
      qtyOut: number;
      notes?: string;
    }[] = [];

    // From stockMovements
    stockMovements
      .filter((m) => m.productId === selectedProduct.id)
      .forEach((m) => {
        const isOut = ['OUT', 'SCRAP', 'transfer_out', 'adjustment_out'].includes(m.type);
        ledger.push({
          id: m.id,
          date: m.date || new Date().toISOString().split('T')[0],
          type: m.type,
          reference: m.reference || `TRX-${m.id.substring(0, 5)}`,
          warehouseName: m.warehouseName || 'المستودع الرئيسي',
          qtyIn: isOut ? 0 : m.quantity,
          qtyOut: isOut ? m.quantity : 0,
          notes: 'حركة مخزنية مسجلة',
        });
      });

    // From salesInvoices
    salesInvoices.forEach((inv) => {
      const match = inv.items?.find((i) => i.productId === selectedProduct.id);
      if (match) {
        ledger.push({
          id: `sale-${inv.id}`,
          date: inv.date || inv.issueDate || '',
          type: 'فاتورة بيع',
          reference: inv.invoiceNumber || inv.id,
          warehouseName: inv.warehouseName || 'المستودع الرئيسي',
          qtyIn: 0,
          qtyOut: match.quantity || 1,
          notes: `بيع للعميل: ${inv.customerName || 'عميل نقدي'}`,
        });
      }
    });

    // From purchases
    purchases.forEach((po) => {
      const match = po.items?.find((i: any) => i.productId === selectedProduct.id);
      if (match) {
        ledger.push({
          id: `purch-${po.id}`,
          date: po.date || po.issueDate || '',
          type: 'فاتورة شراء',
          reference: po.invoiceNumber || po.billNumber || po.id,
          warehouseName: po.warehouseName || 'المستودع الرئيسي',
          qtyIn: match.quantity || 1,
          qtyOut: 0,
          notes: `توريد من المورد: ${po.vendorName || po.supplierName || 'مورد'}`,
        });
      }
    });

    // From stockAdjustments
    stockAdjustments
      .filter((adj) => adj.productId === selectedProduct.id)
      .forEach((adj) => {
        const isOut = adj.type === 'OUT';
        ledger.push({
          id: `adj-${adj.id}`,
          date: adj.date || '',
          type: 'تسوية مخزنية',
          reference: `ADJ-${adj.id.substring(0, 6)}`,
          warehouseName: adj.warehouseName || 'المستودع',
          qtyIn: isOut ? 0 : adj.quantity,
          qtyOut: isOut ? adj.quantity : 0,
          notes: adj.notes || adj.reason,
        });
      });

    // From scrapVouchers
    scrapVouchers
      .filter((sc) => sc.productId === selectedProduct.id)
      .forEach((sc) => {
        ledger.push({
          id: `scrap-${sc.id}`,
          date: sc.date || '',
          type: 'إتلاف بضاعة',
          reference: sc.voucherNumber || `SCR-${sc.id.substring(0, 5)}`,
          warehouseName: sc.warehouseName || 'المستودع',
          qtyIn: 0,
          qtyOut: sc.quantity,
          notes: sc.reason || 'إتلاف مخزني',
        });
      });

    // Deduplicate by ID
    const seen = new Set<string>();
    const unique = ledger.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    // Sort ascending by date
    unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let currentBal = 0;
    return unique.map((m) => {
      currentBal = currentBal + m.qtyIn - m.qtyOut;
      return {
        ...m,
        balance: currentBal,
      };
    });
  }, [selectedProduct, stockMovements, salesInvoices, purchases, stockAdjustments, scrapVouchers]);

  // 5. Variance and Stocktaking Calculations
  const varianceMetrics = useMemo(() => {
    let totalShortageValue = 0;
    let totalOverageValue = 0;
    let shortageQty = 0;
    let overageQty = 0;

    const adjustments = stockAdjustments.filter((adj) => {
      if (selectedWarehouseId !== 'all' && adj.warehouseId !== selectedWarehouseId) return false;
      return true;
    });

    adjustments.forEach((adj) => {
      const prod = products.find((p) => p.id === adj.productId);
      const cost = prod?.costPrice || 0;
      const val = adj.quantity * cost;
      if (adj.type === 'OUT') {
        shortageQty += adj.quantity;
        totalShortageValue += val;
      } else {
        overageQty += adj.quantity;
        totalOverageValue += val;
      }
    });

    const netVariance = totalOverageValue - totalShortageValue;
    return {
      adjustments,
      totalShortageValue,
      totalOverageValue,
      shortageQty,
      overageQty,
      netVariance,
    };
  }, [stockAdjustments, products, selectedWarehouseId]);

  // 6. Expiry and Batches
  const expiryMetrics = useMemo(() => {
    const now = new Date();
    const batches = productBatches.filter((b) => {
      if (selectedWarehouseId !== 'all' && b.warehouseId !== selectedWarehouseId) return false;
      return true;
    });

    let expiredCount = 0;
    let nearExpiryCount = 0;
    let validCount = 0;

    batches.forEach((b) => {
      const expDate = new Date(b.expiryDate);
      const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        expiredCount++;
      } else if (diffDays <= 60) {
        nearExpiryCount++;
      } else {
        validCount++;
      }
    });

    const totalScrapLoss = scrapVouchers.reduce((acc, sc) => acc + (sc.totalCost || sc.costPrice * sc.quantity || 0), 0);

    return {
      batches,
      expiredCount,
      nearExpiryCount,
      validCount,
      totalScrapLoss,
    };
  }, [productBatches, scrapVouchers, selectedWarehouseId]);

  // 7. Item Profitability
  const profitabilityAnalysis = useMemo(() => {
    return filteredProducts.map((p) => {
      const cost = p.costPrice || 0;
      const price = p.sellingPrice || 0;
      const unitProfit = price - cost;
      const marginPercent = price > 0 ? (unitProfit / price) * 100 : 0;

      // Calculate total units sold from salesInvoices
      let totalSold = 0;
      let totalRevenue = 0;
      salesInvoices.forEach((inv) => {
        inv.items?.forEach((item) => {
          if (item.productId === p.id) {
            const q = item.quantity || 0;
            totalSold += q;
            totalRevenue += q * (item.unitPrice || price);
          }
        });
      });

      const totalProfit = totalRevenue - totalSold * cost;

      return {
        ...p,
        unitProfit,
        marginPercent,
        totalSold,
        totalRevenue,
        totalProfit,
      };
    }).sort((a, b) => b.totalProfit - a.totalProfit);
  }, [filteredProducts, salesInvoices]);

  // Handle Export to CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const reportMeta = INVENTORY_REPORT_META[selectedReport];

    if (selectedReport === 'inventory_valuation') {
      headers = ['كود الصنف SKU', 'اسم الصنف', 'التصنيف', 'الرصيد الحالي', 'سعر التكلفة', 'سعر البيع', 'القيمة بالتكلفة', 'القيمة بالبيع', 'هامش الربح %'];
      rows = filteredProducts.map((p) => [
        p.sku,
        p.name,
        p.category || '-',
        p.stockQuantity,
        p.costPrice,
        p.sellingPrice,
        p.stockQuantity * p.costPrice,
        p.stockQuantity * p.sellingPrice,
        p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1) + '%' : '0%',
      ]);
    } else if (selectedReport === 'inventory_reorder') {
      headers = ['كود الصنف SKU', 'اسم الصنف', 'التصنيف', 'الرصيد الحالي', 'حد الأمان', 'العجز الفعلي', 'الكمية المقترحة', 'سعر التكلفة', 'تكلفة التوريد المقترحة'];
      rows = reorderMetrics.lowStockItems.map((p) => {
        const deficit = Math.max(p.minStockAlert - p.stockQuantity, 0);
        const suggested = deficit > 0 ? deficit * 2 : 10;
        return [
          p.sku,
          p.name,
          p.category || '-',
          p.stockQuantity,
          p.minStockAlert,
          deficit,
          suggested,
          p.costPrice,
          suggested * p.costPrice,
        ];
      });
    } else if (selectedReport === 'inventory_movement') {
      headers = ['التاريخ', 'نوع الحركة', 'رقم السند/المرجع', 'المستودع', 'كمية الوارد', 'كمية المنصرف', 'الرصيد بعد الحركة', 'ملاحظات'];
      rows = movementLedger.map((m) => [
        m.date,
        m.type,
        m.reference,
        m.warehouseName,
        m.qtyIn,
        m.qtyOut,
        m.balance,
        m.notes || '',
      ]);
    } else if (selectedReport === 'inventory_aging') {
      headers = ['كود الصنف', 'اسم الصنف', 'التصنيف', 'الكمية المخزنة', 'سعر التكلفة', 'رأس المال المجمد', 'أيام الركود', 'حالة الحركة'];
      rows = agingAnalysis.items.map((i) => [
        i.sku,
        i.name,
        i.category || '-',
        i.stockQuantity,
        i.costPrice,
        i.frozenCapital,
        i.daysInactive,
        i.status === 'fast' ? 'سريعة الحركة' : i.status === 'normal' ? 'متوسطة' : i.status === 'slow' ? 'بطيئة' : 'راكدة',
      ]);
    } else if (selectedReport === 'inventory_warehouses_balance') {
      headers = ['كود الصنف', 'اسم الصنف', 'التصنيف', ...warehouses.map((w) => w.name), 'الإجمالي'];
      rows = filteredProducts.map((p) => [
        p.sku,
        p.name,
        p.category || '-',
        ...warehouses.map((w) => getProductQuantityInWarehouse(p.id, w.id)),
        p.stockQuantity,
      ]);
    } else if (selectedReport === 'inventory_variance') {
      headers = ['رقم السند', 'التاريخ', 'المستودع', 'اسم الصنف', 'نوع الحركة', 'الكمية', 'التكلفة', 'القيمة الإجمالية', 'السبب والملاحظات'];
      rows = varianceMetrics.adjustments.map((adj) => {
        const prod = products.find((p) => p.id === adj.productId);
        const cost = prod?.costPrice || 0;
        return [
          adj.id,
          adj.date,
          adj.warehouseName || '-',
          adj.productName || prod?.name || '-',
          adj.type === 'IN' ? 'زيادة' : 'عجز/نقص',
          adj.quantity,
          cost,
          adj.quantity * cost,
          adj.notes || adj.reason,
        ];
      });
    } else if (selectedReport === 'inventory_expiry') {
      headers = ['رقم التشغيلة', 'اسم الصنف', 'المستودع', 'تاريخ الإنتاج', 'تاريخ الانتهاء', 'الكمية', 'الحالة'];
      rows = expiryMetrics.batches.map((b) => [
        b.batchNumber,
        b.productName || '-',
        b.warehouseName || '-',
        b.productionDate || '-',
        b.expiryDate,
        b.quantity,
        b.status === 'expired' ? 'منتهية' : b.status === 'near_expiry' ? 'وشيكة' : 'صالحة',
      ]);
    } else {
      headers = ['كود الصنف', 'اسم الصنف', 'سعر التكلفة', 'سعر البيع', 'هامش الربح الاسمي', 'هامش الربح %', 'الكميات المباعة', 'إجمالي المبيعات', 'صافي أرباح الصنف'];
      rows = profitabilityAnalysis.map((p) => [
        p.sku,
        p.name,
        p.costPrice,
        p.sellingPrice,
        p.unitProfit,
        p.marginPercent.toFixed(1) + '%',
        p.totalSold,
        p.totalRevenue,
        p.totalProfit,
      ]);
    }

    const csvContent =
      '\uFEFF' +
      [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((val) => {
              const str = String(val ?? '');
              return str.includes(',') || str.includes('\n') || str.includes('"')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
            })
            .join(',')
        ),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentMeta = INVENTORY_REPORT_META[selectedReport];
  const CurrentIcon = currentMeta.icon;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
            <CurrentIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {currentMeta.title}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{currentMeta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition-all border border-slate-200 cursor-pointer"
            title="تصدير إلى ملف إكسل"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
            title="معاينة وطباعة التقرير"
          >
            <Printer className="w-4 h-4" />
            <span>معاينة وطباعة</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Warehouse Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">المستودع:</span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-emerald-500 font-medium"
            >
              <option value="all">كافة المستودعات والفروع ({warehouses.length})</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">التصنيف:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-emerald-500 font-medium"
            >
              <option value="all">كافة التصنيفات ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="البحث بالاسم، SKU أو الباركود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pr-9 pl-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          REPORT 1: INVENTORY VALUATION
      ========================================================================= */}
      {selectedReport === 'inventory_valuation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">إجمالي القيمة بالتكلفة (Cost)</span>
              <div className="text-lg font-bold text-slate-900 mt-1">{formatMoney(valuationMetrics.totalCost)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">القيمة الدفترية للأصول المتداولة</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">إجمالي القيمة بسعر البيع (Retail)</span>
              <div className="text-lg font-bold text-emerald-600 mt-1">{formatMoney(valuationMetrics.totalRetail)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">القيمة التقديرية عند البيع الكامل</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">هامش الربح الكامن بالمخزن</span>
              <div className="text-lg font-bold text-teal-700 mt-1">
                {formatMoney(valuationMetrics.potentialMargin)}
                <span className="text-xs font-semibold text-teal-600 mr-2">({valuationMetrics.marginPercent.toFixed(1)}%)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">إجمالي الأرباح المتوقعة عند البيع</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">إجمالي الكميات والوحدات</span>
              <div className="text-lg font-bold text-indigo-600 mt-1">{valuationMetrics.totalUnits.toLocaleString('ar-EG')} وحدة</div>
              <div className="text-[11px] text-slate-400 mt-0.5">في {filteredProducts.length} صنف مسجل</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">تفاصيل تقييم الأصناف المخزنة ({filteredProducts.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">كود SKU</th>
                    <th className="p-3">اسم الصنف</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3">الرصيد الحالي</th>
                    <th className="p-3">سعر التكلفة</th>
                    <th className="p-3">سعر البيع</th>
                    <th className="p-3">إجمالي التكلفة</th>
                    <th className="p-3">إجمالي القيمة بالبيع</th>
                    <th className="p-3">هامش الربح %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const costVal = (p.stockQuantity || 0) * (p.costPrice || 0);
                    const retailVal = (p.stockQuantity || 0) * (p.sellingPrice || 0);
                    const marginP = p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1) : '0';
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-slate-600 font-semibold">{p.sku}</td>
                        <td className="p-3 font-bold text-slate-900">{p.name}</td>
                        <td className="p-3 text-slate-600">{p.category || '-'}</td>
                        <td className="p-3 font-bold text-slate-800">
                          {p.stockQuantity} <span className="text-[10px] text-slate-400 font-normal">{p.unit}</span>
                        </td>
                        <td className="p-3 text-slate-700">{formatMoney(p.costPrice)}</td>
                        <td className="p-3 text-slate-700">{formatMoney(p.sellingPrice)}</td>
                        <td className="p-3 font-bold text-slate-900">{formatMoney(costVal)}</td>
                        <td className="p-3 font-bold text-emerald-600">{formatMoney(retailVal)}</td>
                        <td className="p-3 font-bold text-teal-700">{marginP}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REPORT 2: STOCK MOVEMENT & LEDGER (كارت الصنف)
      ========================================================================= */}
      {selectedReport === 'inventory_movement' && (
        <div className="space-y-4">
          {/* Select Product */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700">اختر الصنف لعرض كارت الحركة التفصيلي:</span>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="flex-1 min-w-[280px] bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} - {p.name} (الرصيد الحالي: {p.stockQuantity} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">الصنف المحدد</span>
                <div className="text-sm font-bold text-slate-900 mt-1">{selectedProduct.name}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {selectedProduct.sku}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">سعر التكلفة / البيع</span>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {formatMoney(selectedProduct.costPrice)} / <span className="text-emerald-600">{formatMoney(selectedProduct.sellingPrice)}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">الوحدة: {selectedProduct.unit}</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">إجمالي الحركات المسجلة</span>
                <div className="text-lg font-bold text-indigo-600 mt-1">{movementLedger.length} حركة</div>
                <div className="text-[11px] text-slate-400 mt-0.5">شامل المشتريات والمبيعات والتسويات</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">الرصيد اللحظي بالمستودعات</span>
                <div className="text-lg font-bold text-emerald-600 mt-1">
                  {selectedProduct.stockQuantity} <span className="text-xs">{selectedProduct.unit}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">حد الأمان: {selectedProduct.minStockAlert}</div>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">سجل كارت حركة الصنف الزمني (Stock Ledger)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">نوع الحركة</th>
                    <th className="p-3">رقم المرجع / السند</th>
                    <th className="p-3">المستودع</th>
                    <th className="p-3 text-emerald-700">وارد (+)</th>
                    <th className="p-3 text-rose-700">منصرف (-)</th>
                    <th className="p-3">الرصيد التراكمي</th>
                    <th className="p-3">ملاحظات وبيان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movementLedger.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد حركات مسجلة لهذا الصنف حتى الآن
                      </td>
                    </tr>
                  ) : (
                    movementLedger.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-600 font-mono">{m.date}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              m.qtyIn > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-700">{m.reference}</td>
                        <td className="p-3 text-slate-600">{m.warehouseName}</td>
                        <td className="p-3 font-bold text-emerald-600">{m.qtyIn > 0 ? `+${m.qtyIn}` : '-'}</td>
                        <td className="p-3 font-bold text-rose-600">{m.qtyOut > 0 ? `-${m.qtyOut}` : '-'}</td>
                        <td className="p-3 font-bold text-slate-900 bg-slate-50/50">{m.balance}</td>
                        <td className="p-3 text-slate-500">{m.notes || '-'}</td>
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
          REPORT 3: REORDER LEVEL & STOCK ALERTS (النواقص وحد الطلب)
      ========================================================================= */}
      {selectedReport === 'inventory_reorder' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-rose-500 font-bold">أصناف حرجة تحت حد الأمان</span>
              <div className="text-xl font-bold text-rose-600 mt-1">{reorderMetrics.lowStockItems.length} صنف</div>
              <div className="text-[11px] text-slate-400 mt-0.5">تتطلب إصدار أوامر شراء عاجلة</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-red-600 font-bold">أصناف منعدمة تماماً (Zero Stock)</span>
              <div className="text-xl font-bold text-red-700 mt-1">{reorderMetrics.zeroStockItems.length} صنف</div>
              <div className="text-[11px] text-slate-400 mt-0.5">بضاعة نفدت وتتسبب في خسارة مبيعات</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">تكلفة الشراء المقترحة لتغطية النواقص</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{formatMoney(reorderMetrics.totalDeficitCost)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">تقدير السيولة المطلوبة لتأمين المخزون</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">قائمة الأصناف المحتاجة لإعادة الطلب والتوريد</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">كود SKU</th>
                    <th className="p-3">اسم الصنف</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3">الرصيد الفعلي</th>
                    <th className="p-3">حد الأمان</th>
                    <th className="p-3">العجز الحالي</th>
                    <th className="p-3">الكمية المقترحة</th>
                    <th className="p-3">سعر التكلفة</th>
                    <th className="p-3">التكلفة التقديرية</th>
                    <th className="p-3">المورد المفضل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reorderMetrics.lowStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-emerald-600 font-bold">
                        ✓ ممتاز! لا توجد أي نواقص أو أصناف وصلت إلى حد إعادة الطلب
                      </td>
                    </tr>
                  ) : (
                    reorderMetrics.lowStockItems.map((p) => {
                      const deficit = Math.max(p.minStockAlert - p.stockQuantity, 0);
                      const suggested = deficit > 0 ? deficit * 2 : 10;
                      const estCost = suggested * (p.costPrice || 0);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-semibold text-slate-600">{p.sku}</td>
                          <td className="p-3 font-bold text-slate-900">{p.name}</td>
                          <td className="p-3 text-slate-600">{p.category || '-'}</td>
                          <td className="p-3 font-bold text-rose-600">
                            {p.stockQuantity} <span className="text-[10px] font-normal">{p.unit}</span>
                          </td>
                          <td className="p-3 font-bold text-slate-700">{p.minStockAlert}</td>
                          <td className="p-3 font-bold text-rose-700">-{deficit}</td>
                          <td className="p-3 font-bold text-indigo-600">{suggested}</td>
                          <td className="p-3 text-slate-700">{formatMoney(p.costPrice)}</td>
                          <td className="p-3 font-bold text-slate-900">{formatMoney(estCost)}</td>
                          <td className="p-3 text-slate-600">{p.supplierName || 'غير محدد'}</td>
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

      {/* =========================================================================
          REPORT 4: STOCK AGING & TURNOVER (دوران المخزون والركود)
      ========================================================================= */}
      {selectedReport === 'inventory_aging' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">بضاعة سريعة الدوران (&lt;30 يوم)</span>
              <div className="text-lg font-bold text-emerald-600 mt-1">{agingAnalysis.fastItems.length} أصناف</div>
              <div className="text-[11px] text-slate-400 mt-0.5">تدفقات نقدية ممتازة وحركة سريعة</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">بضاعة متوسطة الحركة (31-60 يوم)</span>
              <div className="text-lg font-bold text-blue-600 mt-1">{agingAnalysis.normalItems.length} أصناف</div>
              <div className="text-[11px] text-slate-400 mt-0.5">معدل بيع واستنزاف طبيعي</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">بضاعة بطيئة الحركة (61-90 يوم)</span>
              <div className="text-lg font-bold text-amber-600 mt-1">{agingAnalysis.slowItems.length} أصناف</div>
              <div className="text-[11px] text-slate-400 mt-0.5">تحتاج عروض تسويقية وتخفيضات</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-rose-500 font-bold">بضاعة راكدة مجمدة (&gt;90 يوم)</span>
              <div className="text-lg font-bold text-rose-700 mt-1">
                {agingAnalysis.stagnantItems.length} صنف ({formatMoney(agingAnalysis.stagnantCapital)})
              </div>
              <div className="text-[11px] text-rose-500 mt-0.5">تمثل {agingAnalysis.stagnantPercent.toFixed(1)}% من إجمالي رأس المال</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">تحليل ركود الأصناف وتجميد السيولة</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">كود SKU</th>
                    <th className="p-3">اسم الصنف</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3">الرصيد الحالي</th>
                    <th className="p-3">سعر التكلفة</th>
                    <th className="p-3">رأس المال المجمد</th>
                    <th className="p-3">أيام بدون حركة</th>
                    <th className="p-3">تصنيف الحركة</th>
                    <th className="p-3">التوصية المقترحة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agingAnalysis.items.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-semibold text-slate-600">{i.sku}</td>
                      <td className="p-3 font-bold text-slate-900">{i.name}</td>
                      <td className="p-3 text-slate-600">{i.category || '-'}</td>
                      <td className="p-3 font-bold text-slate-800">
                        {i.stockQuantity} <span className="text-[10px] text-slate-400">{i.unit}</span>
                      </td>
                      <td className="p-3 text-slate-700">{formatMoney(i.costPrice)}</td>
                      <td className="p-3 font-bold text-slate-900">{formatMoney(i.frozenCapital)}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">{i.daysInactive} يوم</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            i.status === 'fast'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : i.status === 'normal'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : i.status === 'slow'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {i.status === 'fast'
                            ? 'سريعة الدوران'
                            : i.status === 'normal'
                            ? 'متوسطة'
                            : i.status === 'slow'
                            ? 'بطيئة'
                            : 'راكدة ومجمدة'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">
                        {i.status === 'stagnant'
                          ? 'تصفية سريعة أو حزمة عروض'
                          : i.status === 'slow'
                          ? 'خصم ترويجي للعملاء'
                          : 'متابعة إعادة التوريد الدورية'}
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
          REPORT 5: MULTI-WAREHOUSE STOCK BALANCE (أرصدة المستودعات والمقارنة المكانية)
      ========================================================================= */}
      {selectedReport === 'inventory_warehouses_balance' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">مصفوفة توزيع المخزون عبر المستودعات والفروع ({warehouses.length} مستودع)</h3>
              <p className="text-xs text-slate-500 mt-0.5">مقارنة لحظية للكميات المتاحة ومواقع التخزين والأرفف</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">كود SKU</th>
                    <th className="p-3">اسم الصنف</th>
                    <th className="p-3">التصنيف</th>
                    {warehouses.map((w) => (
                      <th key={w.id} className="p-3 text-slate-800 border-r border-slate-200">
                        {w.name}
                      </th>
                    ))}
                    <th className="p-3 text-emerald-700 bg-emerald-50/50 border-r border-slate-200 font-bold">
                      الرصيد الإجمالي
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-semibold text-slate-600">{p.sku}</td>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-600">{p.category || '-'}</td>
                      {warehouses.map((w) => {
                        const qty = getProductQuantityInWarehouse(p.id, w.id);
                        return (
                          <td key={w.id} className="p-3 border-r border-slate-100 text-slate-700">
                            {qty > 0 ? (
                              <span className="font-bold text-slate-900">{qty}</span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 font-bold text-emerald-700 bg-emerald-50/30 border-r border-slate-100">
                        {p.stockQuantity} <span className="text-[10px] text-slate-400">{p.unit}</span>
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
          REPORT 6: STOCKTAKING VARIANCE & SHRINKAGE (فروقات وعجز الجرد)
      ========================================================================= */}
      {selectedReport === 'inventory_variance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-rose-500 font-bold">إجمالي قيمة العجز (Shortage)</span>
              <div className="text-xl font-bold text-rose-600 mt-1">{formatMoney(varianceMetrics.totalShortageValue)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">كمية العجز المخصومة: {varianceMetrics.shortageQty} وحدة</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-emerald-600 font-bold">إجمالي قيمة الزيادة (Overage)</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">{formatMoney(varianceMetrics.totalOverageValue)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">كمية الزيادة المضافة: {varianceMetrics.overageQty} وحدة</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">صافي الفارق المالي للتسويات</span>
              <div
                className={`text-xl font-bold mt-1 ${
                  varianceMetrics.netVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {formatMoney(varianceMetrics.netVariance)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {varianceMetrics.netVariance >= 0 ? 'زيادة دفترية صافية' : 'عجز مالي صافي بحساب الخسائر'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">سجل تسويات الجرد والفروقات المخزنية</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رقم التسوية</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">المستودع</th>
                    <th className="p-3">الصنف</th>
                    <th className="p-3">نوع الحركة</th>
                    <th className="p-3">الكمية</th>
                    <th className="p-3">التكلفة الإجمالية</th>
                    <th className="p-3">السبب والبيان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {varianceMetrics.adjustments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد قيود تسوية جردية مسجلة
                      </td>
                    </tr>
                  ) : (
                    varianceMetrics.adjustments.map((adj) => {
                      const prod = products.find((p) => p.id === adj.productId);
                      const cost = prod?.costPrice || 0;
                      return (
                        <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-semibold text-slate-600">{adj.id}</td>
                          <td className="p-3 text-slate-600 font-mono">{adj.date}</td>
                          <td className="p-3 text-slate-700">{adj.warehouseName || '-'}</td>
                          <td className="p-3 font-bold text-slate-900">{adj.productName || prod?.name}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                adj.type === 'IN'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {adj.type === 'IN' ? 'تسوية بالزيادة (+)' : 'تسوية بالعجز (-)'}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-800">{adj.quantity}</td>
                          <td className="p-3 font-bold text-slate-900">{formatMoney(adj.quantity * cost)}</td>
                          <td className="p-3 text-slate-500">{adj.notes || adj.reason}</td>
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

      {/* =========================================================================
          REPORT 7: BATCH EXPIRY & SCRAP LOSS (الصلاحيات والتشغيلات والتوالف)
      ========================================================================= */}
      {selectedReport === 'inventory_expiry' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-rose-500 font-bold">تشغيلات منتهية الصلاحية</span>
              <div className="text-xl font-bold text-rose-700 mt-1">{expiryMetrics.expiredCount} تشغيلة</div>
              <div className="text-[11px] text-slate-400 mt-0.5">محظور بيعها ويجب إتلافها</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-amber-500 font-bold">تشغيلات وشيكة الانتهاء (&lt;60 يوم)</span>
              <div className="text-xl font-bold text-amber-600 mt-1">{expiryMetrics.nearExpiryCount} تشغيلة</div>
              <div className="text-[11px] text-slate-400 mt-0.5">تتطلب أولوية صرف عاجلة (FEFO)</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-emerald-600 font-bold">تشغيلات صالحة وسارية</span>
              <div className="text-xl font-bold text-emerald-700 mt-1">{expiryMetrics.validCount} تشغيلة</div>
              <div className="text-[11px] text-slate-400 mt-0.5">حالة التخزين ممتازة</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">خسائر محاضر التوالف والهوالك</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{formatMoney(expiryMetrics.totalScrapLoss)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">بضائع تم إسقاطها من المخزون</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">بيانات التشغيلات والدفعات وتواريخ الصلاحية</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">رقم التشغيلة Batch</th>
                    <th className="p-3">الصنف</th>
                    <th className="p-3">المستودع</th>
                    <th className="p-3">تاريخ الإنتاج</th>
                    <th className="p-3">تاريخ الانتهاء</th>
                    <th className="p-3">الكمية المتبقية</th>
                    <th className="p-3">حالة الصلاحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiryMetrics.batches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        لا توجد تشغيلات مسجلة حالياً
                      </td>
                    </tr>
                  ) : (
                    expiryMetrics.batches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-800">{b.batchNumber}</td>
                        <td className="p-3 font-bold text-slate-900">{b.productName}</td>
                        <td className="p-3 text-slate-600">{b.warehouseName || '-'}</td>
                        <td className="p-3 text-slate-600 font-mono">{b.productionDate || '-'}</td>
                        <td className="p-3 font-mono font-bold text-slate-800">{b.expiryDate}</td>
                        <td className="p-3 font-bold text-slate-900">{b.quantity}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              b.status === 'expired'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : b.status === 'near_expiry'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {b.status === 'expired'
                              ? 'منتهية الصلاحية'
                              : b.status === 'near_expiry'
                              ? 'وشيكة الانتهاء'
                              : 'صالحة للاستخدام'}
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
          REPORT 8: ITEM PROFITABILITY & MARGIN (ربحية الأصناف وهامش المساهمة)
      ========================================================================= */}
      {selectedReport === 'inventory_profitability' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">تحليل ربحية المنتجات وهوامش المساهمة</h3>
                <p className="text-xs text-slate-500 mt-0.5">ترتيب الأصناف بحسب إجمالي الربح المحقق ونسبة الهامش</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">كود SKU</th>
                    <th className="p-3">اسم الصنف</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3">سعر التكلفة</th>
                    <th className="p-3">سعر البيع</th>
                    <th className="p-3">هامش الوحدة</th>
                    <th className="p-3">نسبة الهامش %</th>
                    <th className="p-3">الكميات المباعة</th>
                    <th className="p-3">إجمالي الإيرادات</th>
                    <th className="p-3 text-emerald-700 font-bold">صافي الربح المحقق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profitabilityAnalysis.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-semibold text-slate-600">{p.sku}</td>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-600">{p.category || '-'}</td>
                      <td className="p-3 text-slate-700">{formatMoney(p.costPrice)}</td>
                      <td className="p-3 text-slate-700">{formatMoney(p.sellingPrice)}</td>
                      <td className="p-3 font-bold text-teal-700">{formatMoney(p.unitProfit)}</td>
                      <td className="p-3 font-bold text-teal-600">{p.marginPercent.toFixed(1)}%</td>
                      <td className="p-3 font-bold text-slate-800">{p.totalSold}</td>
                      <td className="p-3 font-bold text-slate-900">{formatMoney(p.totalRevenue)}</td>
                      <td className="p-3 font-bold text-emerald-700 bg-emerald-50/20">{formatMoney(p.totalProfit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintModal && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={currentMeta.title}
        >
          <div className="p-6 space-y-6 text-right">
            <PrintHeader title={currentMeta.title} subtitle={currentMeta.subtitle} />

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between">
              <div>
                <strong>تاريخ التقرير:</strong> {new Date().toLocaleDateString('ar-EG')}
              </div>
              <div>
                <strong>المستودع المحدد:</strong>{' '}
                {selectedWarehouseId === 'all'
                  ? 'كافة المستودعات والفروع'
                  : warehouses.find((w) => w.id === selectedWarehouseId)?.name || selectedWarehouseId}
              </div>
            </div>

            {/* Print Table depending on report */}
            <table className="w-full text-right text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-l border-slate-300">#</th>
                  <th className="p-2 border-l border-slate-300">كود SKU</th>
                  <th className="p-2 border-l border-slate-300">اسم الصنف</th>
                  <th className="p-2 border-l border-slate-300">الرصيد</th>
                  <th className="p-2 border-l border-slate-300">سعر التكلفة</th>
                  <th className="p-2 border-l border-slate-300">سعر البيع</th>
                  <th className="p-2">إجمالي التكلفة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.slice(0, 100).map((p, idx) => (
                  <tr key={p.id}>
                    <td className="p-2 border-l border-slate-200">{idx + 1}</td>
                    <td className="p-2 border-l border-slate-200 font-mono">{p.sku}</td>
                    <td className="p-2 border-l border-slate-200 font-bold">{p.name}</td>
                    <td className="p-2 border-l border-slate-200">
                      {p.stockQuantity} {p.unit}
                    </td>
                    <td className="p-2 border-l border-slate-200">{formatMoney(p.costPrice)}</td>
                    <td className="p-2 border-l border-slate-200">{formatMoney(p.sellingPrice)}</td>
                    <td className="p-2 font-bold">{formatMoney((p.stockQuantity || 0) * (p.costPrice || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <PrintFooter />
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
