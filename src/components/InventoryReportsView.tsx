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
import { DocumentViewerModal, DocumentViewerTarget, DocumentType } from './DocumentViewerModal';
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
    purchaseInvoices = [],
    goodsReceipts = [],
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
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    try {
      return sessionStorage.getItem('orbix_selected_product_id') || '';
    } catch {
      return '';
    }
  });
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [viewerTarget, setViewerTarget] = useState<DocumentViewerTarget | null>(null);

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
    try {
      const saved = sessionStorage.getItem('orbix_selected_product_id');
      if (saved && products.some((p) => p.id === saved)) {
        setSelectedProductId(saved);
        return;
      }
    } catch {
      // ignore
    }
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, activeSubTab]);

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
        if (inv.status !== 'cancelled' && inv.items && inv.items.some((item) => item.productId === p.id)) {
          const invDate = new Date(inv.date || inv.issueDate || '').getTime();
          if (!isNaN(invDate) && invDate > latestDate) latestDate = invDate;
        }
      });

      // Look in purchase invoices
      purchaseInvoices.forEach((pinv) => {
        if (pinv.status !== 'cancelled' && pinv.items && pinv.items.some((item: any) => item.productId === p.id)) {
          const pDate = new Date(pinv.date || (pinv as any).issueDate || (pinv.createdAt ? pinv.createdAt.split('T')[0] : '')).getTime();
          if (!isNaN(pDate) && pDate > latestDate) latestDate = pDate;
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
  }, [filteredProducts, salesInvoices, purchaseInvoices, stockMovements]);

  // 4. Item Movement / Stock Ledger for Selected Product
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  const movementLedger = useMemo(() => {
    if (!selectedProduct) return [];

    const targetProductId = selectedProduct.id;
    const isWhMatch = (whId?: string) => {
      if (selectedWarehouseId === 'all') return true;
      return whId === selectedWarehouseId;
    };

    const ledger: {
      id: string;
      date: string;
      type: string;
      reference: string;
      warehouseName: string;
      warehouseId?: string;
      qtyIn: number;
      qtyOut: number;
      balance?: number;
      notes?: string;
      sortKey: number;
      docType?: DocumentType;
      rawDoc?: any;
    }[] = [];

    // Helper for timestamp sorting
    const getTimestamp = (dateStr?: string, defaultIdx: number = 0) => {
      if (!dateStr) return defaultIdx;
      const ts = new Date(dateStr).getTime();
      return isNaN(ts) ? defaultIdx : ts;
    };

    // A) From stockMovements (Initial balance, direct movements)
    stockMovements
      .filter((m) => m.productId === targetProductId && isWhMatch(m.warehouseId))
      .forEach((m, idx) => {
        const typeLower = (m.type || '').toLowerCase();
        const isInitial =
          m.reference === 'رصيد افتتاحي' ||
          m.referenceType === 'initial_stock' ||
          (m.notes && m.notes.includes('رصيد أول المدة'));

        const isOut =
          ['out', 'scrap', 'transfer_out', 'adjustment_out'].includes(typeLower) ||
          (typeLower === 'adjustment' && m.notes && (m.notes.includes('خصم') || m.notes.includes('عجز')));

        let typeLabel = m.type;
        if (isInitial) {
          typeLabel = 'رصيد أول المدة (افتتاحي)';
        } else if (typeLower === 'in') {
          typeLabel = 'وارد مخزني';
        } else if (typeLower === 'out') {
          typeLabel = 'منصرف مخزني';
        } else if (typeLower === 'scrap') {
          typeLabel = 'إتلاف وتوالف مخزنية';
        } else if (typeLower === 'adjustment') {
          typeLabel = isOut ? 'تسوية جردية (خصم)' : 'تسوية جردية (إضافة)';
        }

        const dateVal = m.date || (m.createdAt ? m.createdAt.split('T')[0] : '');
        ledger.push({
          id: `sm-${m.id}`,
          date: dateVal || '2026-01-01',
          type: typeLabel,
          reference: m.reference || m.referenceNumber || `TRX-${m.id.substring(0, 5)}`,
          warehouseName: m.warehouseName || warehouses.find((w) => w.id === m.warehouseId)?.name || 'المستودع الرئيسي',
          warehouseId: m.warehouseId,
          qtyIn: isOut ? 0 : m.quantity,
          qtyOut: isOut ? m.quantity : 0,
          notes: m.notes || (isInitial ? 'رصيد افتتاحي مقيد بالنظام' : 'حركة مخزنية مسجلة'),
          sortKey: isInitial ? 0 : getTimestamp(dateVal, idx + 1),
          docType: isInitial ? 'initial_balance' : 'stock_movement',
          rawDoc: m,
        });
      });

    // Handled references to prevent duplicate entries with stockMovements
    const handledRefs = new Set(
      stockMovements
        .filter((m) => m.productId === targetProductId)
        .map((m) => m.referenceNumber || m.reference)
        .filter(Boolean)
    );

    // B) From purchaseInvoices (فواتير المشتريات والتوريدات)
    purchaseInvoices.forEach((inv, invIdx) => {
      if (inv.status === 'cancelled') return;
      const matchingItems = inv.items?.filter((i: any) => i.productId === targetProductId) || [];
      matchingItems.forEach((match: any, itemIdx: number) => {
        const itemWhId = match.warehouseId || inv.warehouseId;
        if (!isWhMatch(itemWhId)) return;

        const dateVal = inv.date || (inv as any).issueDate || (inv.createdAt ? inv.createdAt.split('T')[0] : '');
        const whName = warehouses.find((w) => w.id === itemWhId)?.name || inv.warehouseName || 'المستودع الرئيسي';
        ledger.push({
          id: `purch-${inv.id}-${itemIdx}`,
          date: dateVal || '2026-01-01',
          type: 'فاتورة شراء',
          reference: inv.invoiceNumber || inv.id,
          warehouseName: whName,
          warehouseId: itemWhId,
          qtyIn: match.quantity || 0,
          qtyOut: 0,
          notes: `توريد بموجب فاتورة مشتريات من المورد: ${inv.vendorName || 'المورد'}${match.batchNumber ? ` [تشغيلة: ${match.batchNumber}]` : ''}`,
          sortKey: getTimestamp(dateVal, 1000 + invIdx * 10 + itemIdx),
          docType: 'purchase',
          rawDoc: inv,
        });
      });
    });

    // C) From goodsReceipts (أذونات الاستلام المخزني GRN - غير المفوترة)
    const billedGrnNumbers = new Set(
      purchaseInvoices
        .filter((inv) => inv.notes && inv.notes.includes('GRN-'))
        .map((inv) => {
          const match = inv.notes?.match(/GRN-[\w-]+/);
          return match ? match[0] : '';
        })
        .filter(Boolean)
    );

    goodsReceipts.forEach((grn, grnIdx) => {
      // Avoid double-counting physical receipt if already billed under purchase invoice
      if (billedGrnNumbers.has(grn.grnNumber)) return;

      const matchingItems = grn.items?.filter((i: any) => i.productId === targetProductId && (i.acceptedQuantity || 0) > 0) || [];
      matchingItems.forEach((match: any, itemIdx: number) => {
        if (!isWhMatch(grn.warehouseId)) return;

        const dateVal = grn.date || (grn.createdAt ? grn.createdAt.split('T')[0] : '');
        const whName = grn.warehouseName || warehouses.find((w) => w.id === grn.warehouseId)?.name || 'المستودع الرئيسي';
        ledger.push({
          id: `grn-${grn.id}-${itemIdx}`,
          date: dateVal || '2026-01-01',
          type: 'إذن استلام مخزني (GRN)',
          reference: grn.grnNumber,
          warehouseName: whName,
          warehouseId: grn.warehouseId,
          qtyIn: match.acceptedQuantity,
          qtyOut: 0,
          notes: `استلام وفحص فني من المورد: ${grn.vendorName}${grn.poNumber ? ` (أمر شراء: ${grn.poNumber})` : ''}`,
          sortKey: getTimestamp(dateVal, 2000 + grnIdx * 10 + itemIdx),
          docType: 'goods_receipt',
          rawDoc: grn,
        });
      });
    });

    // D) From salesInvoices (فواتير المبيعات ونقاط البيع POS)
    salesInvoices.forEach((inv, invIdx) => {
      if (inv.status === 'cancelled') return;
      const matchingItems = inv.items?.filter((i) => i.productId === targetProductId) || [];
      matchingItems.forEach((match, itemIdx) => {
        const itemWhId = inv.warehouseId;
        if (!isWhMatch(itemWhId)) return;

        const dateVal = inv.date || inv.issueDate || (inv.createdAt ? inv.createdAt.split('T')[0] : '');
        const whName = inv.warehouseName || warehouses.find((w) => w.id === itemWhId)?.name || 'المستودع الرئيسي';
        const isPos = inv.invoiceNumber?.startsWith('POS-');
        ledger.push({
          id: `sale-${inv.id}-${itemIdx}`,
          date: dateVal || '2026-01-01',
          type: isPos ? 'فاتورة بيع (POS)' : 'فاتورة بيع',
          reference: inv.invoiceNumber || inv.id,
          warehouseName: whName,
          warehouseId: itemWhId,
          qtyIn: 0,
          qtyOut: match.quantity || 0,
          notes: `بيع للعميل: ${inv.customerName || 'عميل نقدي'}`,
          sortKey: getTimestamp(dateVal, 3000 + invIdx * 10 + itemIdx),
          docType: 'invoice',
          rawDoc: inv,
        });
      });
    });

    // E) From salesReturns (مردودات المبيعات - وارد للمخزن)
    salesReturns.forEach((ret, retIdx) => {
      if (ret.status === 'cancelled') return;
      const matchingItems = ret.items?.filter((i: any) => i.productId === targetProductId) || [];
      matchingItems.forEach((match: any, itemIdx: number) => {
        const itemWhId = ret.warehouseId;
        if (!isWhMatch(itemWhId)) return;

        const dateVal = ret.date || (ret.createdAt ? ret.createdAt.split('T')[0] : '');
        const whName = ret.warehouseName || warehouses.find((w) => w.id === itemWhId)?.name || 'المستودع الرئيسي';
        ledger.push({
          id: `saleret-${ret.id}-${itemIdx}`,
          date: dateVal || '2026-01-01',
          type: 'مرتجع مبيعات',
          reference: ret.returnNumber || ret.id,
          warehouseName: whName,
          warehouseId: itemWhId,
          qtyIn: match.quantity || 0,
          qtyOut: 0,
          notes: `مرتجع مبيعات من العميل: ${ret.customerName || 'عميل'}${ret.reason ? ` - ${ret.reason}` : ''}`,
          sortKey: getTimestamp(dateVal, 4000 + retIdx * 10 + itemIdx),
          docType: 'return',
          rawDoc: ret,
        });
      });
    });

    // F) From purchaseReturns (مردودات المشتريات - منصرف من المخزن)
    purchaseReturns.forEach((pret, pretIdx) => {
      if (pret.status === 'cancelled') return;
      const matchingItems = pret.items?.filter((i: any) => i.productId === targetProductId) || [];
      matchingItems.forEach((match: any, itemIdx: number) => {
        const itemWhId = pret.warehouseId;
        if (!isWhMatch(itemWhId)) return;

        const dateVal = pret.date || (pret.createdAt ? pret.createdAt.split('T')[0] : '');
        const whName = pret.warehouseName || warehouses.find((w) => w.id === itemWhId)?.name || 'المستودع الرئيسي';
        ledger.push({
          id: `purchret-${pret.id}-${itemIdx}`,
          date: dateVal || '2026-01-01',
          type: 'مردودات مشتريات',
          reference: pret.returnNumber || pret.id,
          warehouseName: whName,
          warehouseId: itemWhId,
          qtyIn: 0,
          qtyOut: match.quantity || 0,
          notes: `مردودات مشتريات إلى المورد: ${pret.vendorName || 'مورد'}${pret.reason ? ` - ${pret.reason}` : ''}`,
          sortKey: getTimestamp(dateVal, 5000 + pretIdx * 10 + itemIdx),
          docType: 'purchase_return',
          rawDoc: pret,
        });
      });
    });

    // G) From stockAdjustments (تسويات الجرد المخزني - إذا لم تسجل في stockMovements)
    stockAdjustments.forEach((adj, adjIdx) => {
      if (adj.status === 'cancelled') return;
      if (handledRefs.has(adj.adjustmentNumber) || handledRefs.has(`ADJ-${adj.id.substring(0, 6)}`)) return;

      const matchingItems = adj.items?.filter((i) => i.productId === targetProductId) || [];
      matchingItems.forEach((match, itemIdx) => {
        if (!isWhMatch(adj.warehouseId)) return;

        const isIncrease = match.deltaQuantity > 0 || match.type === 'increase';
        const qty = Math.abs(match.deltaQuantity || 0);
        if (qty === 0) return;

        const dateVal = adj.date || '';
        const whName = adj.warehouseName || warehouses.find((w) => w.id === adj.warehouseId)?.name || 'المستودع الرئيسي';
        ledger.push({
          id: `adj-${adj.id}-${itemIdx}`,
          date: dateVal || '2026-01-01',
          type: isIncrease ? 'تسوية جردية (زيادة)' : 'تسوية جردية (عجز)',
          reference: adj.adjustmentNumber || `ADJ-${adj.id.substring(0, 6)}`,
          warehouseName: whName,
          warehouseId: adj.warehouseId,
          qtyIn: isIncrease ? qty : 0,
          qtyOut: isIncrease ? 0 : qty,
          notes: `تسوية جردية: ${match.reason || adj.reasonLabel || adj.notes || 'تسوية رصيد جردي'}`,
          sortKey: getTimestamp(dateVal, 6000 + adjIdx * 10 + itemIdx),
          docType: 'stock_adjustment',
          rawDoc: adj,
        });
      });
    });

    // H) From scrapVouchers (محاضر الإتلاف والهوالك - إذا لم تسجل في stockMovements)
    scrapVouchers.forEach((sc, scIdx) => {
      if (handledRefs.has(sc.voucherNumber) || handledRefs.has(`SCR-${sc.id.substring(0, 5)}`)) return;

      const matchingItems = sc.items?.filter((i) => i.productId === targetProductId) || [];
      matchingItems.forEach((match, itemIdx) => {
        if (!isWhMatch(sc.warehouseId)) return;

        const dateVal = sc.date || '';
        const whName = sc.warehouseName || warehouses.find((w) => w.id === sc.warehouseId)?.name || 'المستودع الرئيسي';
        ledger.push({
          id: `scrap-${sc.id}-${itemIdx}`,
          date: dateVal || '2026-01-01',
          type: 'إتلاف وتوالف مخزنية',
          reference: sc.voucherNumber || `SCR-${sc.id.substring(0, 5)}`,
          warehouseName: whName,
          warehouseId: sc.warehouseId,
          qtyIn: 0,
          qtyOut: match.quantity,
          notes: `محضر إتلاف مخزني: ${match.reason || sc.reason || 'هالك مخزني'}`,
          sortKey: getTimestamp(dateVal, 7000 + scIdx * 10 + itemIdx),
          docType: 'scrap_voucher',
          rawDoc: sc,
        });
      });
    });

    // I) From stockTransfers (التحويلات بين المستودعات)
    stockTransfers.forEach((tr, trIdx) => {
      if (tr.status === 'cancelled') return;
      const matchingItems = tr.items?.filter((i) => i.productId === targetProductId) || [];
      matchingItems.forEach((match, itemIdx) => {
        const dateVal = tr.date || '';
        if (selectedWarehouseId === 'all') {
          ledger.push({
            id: `trans-${tr.id}-${itemIdx}`,
            date: dateVal || '2026-01-01',
            type: 'تحويل بين المستودعات',
            reference: tr.transferNumber,
            warehouseName: `${tr.fromWarehouseName || 'مستودع'} ➔ ${tr.toWarehouseName || 'مستودع'}`,
            qtyIn: 0,
            qtyOut: 0,
            notes: `تحويل داخلي (${match.quantity} ${match.unit || selectedProduct.unit}) من ${tr.fromWarehouseName} إلى ${tr.toWarehouseName}`,
            sortKey: getTimestamp(dateVal, 8000 + trIdx * 10 + itemIdx),
            docType: 'stock_transfer',
            rawDoc: tr,
          });
        } else if (selectedWarehouseId === tr.fromWarehouseId) {
          ledger.push({
            id: `trans-out-${tr.id}-${itemIdx}`,
            date: dateVal || '2026-01-01',
            type: 'تحويل مخزني صادر',
            reference: tr.transferNumber,
            warehouseName: tr.fromWarehouseName || 'المستودع',
            warehouseId: tr.fromWarehouseId,
            qtyIn: 0,
            qtyOut: match.quantity,
            notes: `تحويل صادر إلى: ${tr.toWarehouseName}`,
            sortKey: getTimestamp(dateVal, 8000 + trIdx * 10 + itemIdx),
            docType: 'stock_transfer',
            rawDoc: tr,
          });
        } else if (selectedWarehouseId === tr.toWarehouseId) {
          ledger.push({
            id: `trans-in-${tr.id}-${itemIdx}`,
            date: dateVal || '2026-01-01',
            type: 'تحويل مخزني وارد',
            reference: tr.transferNumber,
            warehouseName: tr.toWarehouseName || 'المستودع',
            warehouseId: tr.toWarehouseId,
            qtyIn: match.quantity,
            qtyOut: 0,
            notes: `تحويل وارد من: ${tr.fromWarehouseName}`,
            sortKey: getTimestamp(dateVal, 8000 + trIdx * 10 + itemIdx),
            docType: 'stock_transfer',
            rawDoc: tr,
          });
        }
      });
    });

    // Deduplicate by unique ID
    const seen = new Set<string>();
    const unique = ledger.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    // Sort chronologically ascending
    unique.sort((a, b) => a.sortKey - b.sortKey);

    // Target quantity for current warehouse filter
    let targetWhQuantity = selectedProduct.stockQuantity;
    if (selectedWarehouseId !== 'all') {
      const ws = selectedProduct.warehouseStocks?.find((w) => w.warehouseId === selectedWarehouseId);
      targetWhQuantity = ws ? ws.quantity : 0;
    }

    // Check if initial balance row is needed
    const hasInitialEntry = unique.some((m) => m.type.includes('افتتاحي') || m.reference === 'رصيد افتتاحي');
    const netTransactions = unique.reduce((sum, m) => sum + m.qtyIn - m.qtyOut, 0);

    if (!hasInitialEntry && unique.length === 0 && targetWhQuantity > 0) {
      unique.unshift({
        id: `init-opening-${targetProductId}`,
        date: (selectedProduct as any).createdAt ? (selectedProduct as any).createdAt.split('T')[0] : '2026-01-01',
        type: 'رصيد أول المدة (افتتاحي)',
        reference: 'رصيد افتتاحي',
        warehouseName: warehouses.find((w) => w.id === selectedProduct.warehouseId)?.name || 'المستودع الرئيسي',
        warehouseId: selectedProduct.warehouseId,
        qtyIn: targetWhQuantity,
        qtyOut: 0,
        notes: 'الرصيد الافتتاحي المسجل عند تعريف بطاقة الصنف',
        sortKey: 0,
        docType: 'initial_balance',
        rawDoc: {
          id: `init-${selectedProduct.id}`,
          reference: 'رصيد افتتاحي',
          type: 'initial',
          productName: selectedProduct.name,
          productId: selectedProduct.id,
          sku: selectedProduct.sku,
          quantity: targetWhQuantity,
          date: (selectedProduct as any).createdAt ? (selectedProduct as any).createdAt.split('T')[0] : '2026-01-01',
          warehouseName: warehouses.find((w) => w.id === selectedProduct.warehouseId)?.name || 'المستودع الرئيسي',
          notes: 'الرصيد الافتتاحي المسجل عند تعريف بطاقة الصنف',
        },
      });
    } else if (!hasInitialEntry && targetWhQuantity !== netTransactions) {
      const openingDiff = targetWhQuantity - netTransactions;
      if (openingDiff !== 0) {
        unique.unshift({
          id: `init-opening-${targetProductId}`,
          date: unique[0]?.date || '2026-01-01',
          type: 'رصيد أول المدة (افتتاحي)',
          reference: 'رصيد افتتاحي',
          warehouseName: warehouses.find((w) => w.id === selectedProduct.warehouseId)?.name || 'المستودع الرئيسي',
          warehouseId: selectedProduct.warehouseId,
          qtyIn: Math.max(0, openingDiff),
          qtyOut: openingDiff < 0 ? Math.abs(openingDiff) : 0,
          notes: 'الرصيد الافتتاحي الأولي لتطابق بطاقة الصنف',
          sortKey: 0,
          docType: 'initial_balance',
          rawDoc: {
            id: `init-diff-${selectedProduct.id}`,
            reference: 'رصيد افتتاحي',
            type: 'initial',
            productName: selectedProduct.name,
            productId: selectedProduct.id,
            sku: selectedProduct.sku,
            quantity: Math.abs(openingDiff),
            date: unique[0]?.date || '2026-01-01',
            warehouseName: warehouses.find((w) => w.id === selectedProduct.warehouseId)?.name || 'المستودع الرئيسي',
            notes: 'الرصيد الافتتاحي الأولي لتطابق بطاقة الصنف',
          },
        });
      }
    }

    // Calculate running cumulative balance
    let currentBal = 0;
    const resultWithBalance = unique.map((m) => {
      currentBal = currentBal + m.qtyIn - m.qtyOut;
      return {
        ...m,
        balance: currentBal,
      };
    });

    // Reconcile manual stock changes if final balance differs from actual warehouse balance
    if (resultWithBalance.length > 0 && currentBal !== targetWhQuantity && selectedWarehouseId === 'all') {
      const directAdjustment = targetWhQuantity - currentBal;
      const isPos = directAdjustment > 0;
      const finalBal = currentBal + directAdjustment;
      resultWithBalance.push({
        id: `manual-sync-${targetProductId}`,
        date: new Date().toISOString().split('T')[0],
        type: isPos ? 'تسوية رصيد مخزني (إضافة)' : 'تسوية رصيد مخزني (خصم)',
        reference: 'تسوية تطابق لحظي',
        warehouseName: 'المستودع الرئيسي',
        qtyIn: isPos ? directAdjustment : 0,
        qtyOut: isPos ? 0 : Math.abs(directAdjustment),
        balance: finalBal,
        notes: 'تسوية لتطابق كارت الصنف مع الرصيد اللحظي الفعلي بالمستودعات',
        sortKey: Date.now(),
        docType: 'initial_balance',
        rawDoc: {
          id: `manual-sync-${targetProductId}`,
          reference: 'تسوية تطابق لحظي',
          type: 'sync',
          productName: selectedProduct.name,
          productId: selectedProduct.id,
          sku: selectedProduct.sku,
          quantity: Math.abs(directAdjustment),
          date: new Date().toISOString().split('T')[0],
          warehouseName: 'المستودع الرئيسي',
          notes: 'تسوية لتطابق كارت الصنف مع الرصيد اللحظي الفعلي بالمستودعات',
        },
      });
    }

    return resultWithBalance;
  }, [
    selectedProduct,
    selectedWarehouseId,
    stockMovements,
    purchaseInvoices,
    goodsReceipts,
    salesInvoices,
    salesReturns,
    purchaseReturns,
    stockAdjustments,
    scrapVouchers,
    stockTransfers,
    warehouses,
  ]);

  // Movement Ledger Summary (In / Out / Net Balance)
  const ledgerSummary = useMemo(() => {
    const totalIn = movementLedger.reduce((sum, m) => sum + m.qtyIn, 0);
    const totalOut = movementLedger.reduce((sum, m) => sum + m.qtyOut, 0);
    const endBalance =
      movementLedger.length > 0
        ? (movementLedger[movementLedger.length - 1].balance ?? selectedProduct?.stockQuantity ?? 0)
        : selectedProduct?.stockQuantity ?? 0;
    return { totalIn, totalOut, endBalance };
  }, [movementLedger, selectedProduct]);

  // 5. Variance and Stocktaking Calculations
  const varianceMetrics = useMemo(() => {
    let totalShortageValue = 0;
    let totalOverageValue = 0;
    let shortageQty = 0;
    let overageQty = 0;

    const adjustments = stockAdjustments.filter((adj) => {
      if (adj.status === 'cancelled') return false;
      if (selectedWarehouseId !== 'all' && adj.warehouseId !== selectedWarehouseId) return false;
      return true;
    });

    const flatItems: {
      id: string;
      adjustmentNumber: string;
      date: string;
      warehouseName: string;
      productId: string;
      productName: string;
      type: 'increase' | 'decrease';
      quantity: number;
      costPrice: number;
      totalCost: number;
      notes: string;
    }[] = [];

    adjustments.forEach((adj) => {
      if (adj.items && Array.isArray(adj.items)) {
        adj.items.forEach((item, itemIdx) => {
          const prod = products.find((p) => p.id === item.productId);
          const cost = item.costPrice || prod?.costPrice || 0;
          const qty = Math.abs(item.deltaQuantity || 0);
          const isDecrease = item.type === 'decrease' || item.deltaQuantity < 0;
          const val = qty * cost;
          if (isDecrease) {
            shortageQty += qty;
            totalShortageValue += val;
          } else {
            overageQty += qty;
            totalOverageValue += val;
          }
          flatItems.push({
            id: `${adj.id}-${item.productId}-${itemIdx}`,
            adjustmentNumber: adj.adjustmentNumber || adj.id,
            date: adj.date,
            warehouseName: adj.warehouseName || warehouses.find((w) => w.id === adj.warehouseId)?.name || 'المستودع الرئيسي',
            productId: item.productId,
            productName: item.productName || prod?.name || 'صنف',
            type: isDecrease ? 'decrease' : 'increase',
            quantity: qty,
            costPrice: cost,
            totalCost: val,
            notes: item.reason || adj.reasonLabel || adj.notes || '',
          });
        });
      } else {
        const legacyAdj = adj as any;
        const prod = products.find((p) => p.id === legacyAdj.productId);
        const cost = prod?.costPrice || 0;
        const qty = legacyAdj.quantity || 0;
        const isDecrease = legacyAdj.type === 'OUT' || legacyAdj.type === 'decrease';
        const val = qty * cost;
        if (isDecrease) {
          shortageQty += qty;
          totalShortageValue += val;
        } else {
          overageQty += qty;
          totalOverageValue += val;
        }
        flatItems.push({
          id: legacyAdj.id,
          adjustmentNumber: legacyAdj.adjustmentNumber || legacyAdj.id,
          date: legacyAdj.date,
          warehouseName: legacyAdj.warehouseName || warehouses.find((w) => w.id === legacyAdj.warehouseId)?.name || 'المستودع الرئيسي',
          productId: legacyAdj.productId,
          productName: legacyAdj.productName || prod?.name || 'صنف',
          type: isDecrease ? 'decrease' : 'increase',
          quantity: qty,
          costPrice: cost,
          totalCost: val,
          notes: legacyAdj.notes || legacyAdj.reason || '',
        });
      }
    });

    const netVariance = totalOverageValue - totalShortageValue;
    return {
      adjustments,
      flatItems,
      totalShortageValue,
      totalOverageValue,
      shortageQty,
      overageQty,
      netVariance,
    };
  }, [stockAdjustments, products, selectedWarehouseId, warehouses]);

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
      rows = varianceMetrics.flatItems.map((item) => [
        item.adjustmentNumber,
        item.date,
        item.warehouseName,
        item.productName,
        item.type === 'increase' ? 'زيادة' : 'عجز/نقص',
        item.quantity,
        item.costPrice,
        item.totalCost,
        item.notes,
      ]);
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
          REPORT CONTENT VIEW (BLURRED IN PRIVACY MODE)
      ========================================================================= */}
      <div className="report-sheet privacy-blur space-y-6">
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
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <span className="text-xs font-bold text-slate-700 shrink-0">اختر الصنف لعرض كارت الحركة التفصيلي:</span>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedProductId(val);
                  try {
                    sessionStorage.setItem('orbix_selected_product_id', val);
                  } catch {
                    // ignore
                  }
                }}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name} (الرصيد اللحظي: {p.stockQuantity} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            {selectedWarehouseId !== 'all' && (
              <div className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                مفلتر بحسب المستودع:{' '}
                <span className="font-bold">
                  {warehouses.find((w) => w.id === selectedWarehouseId)?.name || selectedWarehouseId}
                </span>
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Card 1: Product Specs */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">الصنف والتسعير</span>
                <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={selectedProduct.name}>
                  {selectedProduct.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  SKU: {selectedProduct.sku} | {selectedProduct.unit}
                </div>
                <div className="text-[11px] text-slate-600 mt-1 font-semibold">
                  شراء: {formatMoney(selectedProduct.costPrice)} | بيع: {formatMoney(selectedProduct.sellingPrice)}
                </div>
              </div>

              {/* Card 2: Operations Count */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 font-medium">إجمالي الحركات المسجلة</span>
                <div className="text-xl font-bold text-indigo-600 mt-1">{movementLedger.length} حركة</div>
                <div className="text-[11px] text-slate-400 mt-0.5">شامل التوريدات والمبيعات والتحويلات</div>
              </div>

              {/* Card 3: Total In */}
              <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
                <span className="text-xs text-emerald-700 font-bold">إجمالي الكميات الواردة (+)</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  +{ledgerSummary.totalIn} <span className="text-xs font-normal text-emerald-700">{selectedProduct.unit}</span>
                </div>
                <div className="text-[11px] text-emerald-600/70 mt-0.5">فواتير شراء واستلامات ومردودات</div>
              </div>

              {/* Card 4: Total Out */}
              <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-xs">
                <span className="text-xs text-rose-700 font-bold">إجمالي الكميات المنصرفة (-)</span>
                <div className="text-xl font-bold text-rose-600 mt-1">
                  -{ledgerSummary.totalOut} <span className="text-xs font-normal text-rose-700">{selectedProduct.unit}</span>
                </div>
                <div className="text-[11px] text-rose-600/70 mt-0.5">مبيعات ونقاط بيع وهوالك</div>
              </div>

              {/* Card 5: Real-time Balance */}
              <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs">
                <span className="text-xs text-blue-700 font-bold">الرصيد اللحظي بالمستودعات</span>
                <div className="text-xl font-black text-blue-800 mt-1">
                  {ledgerSummary.endBalance} <span className="text-xs font-normal text-blue-700">{selectedProduct.unit}</span>
                </div>
                <div className="text-[11px] text-blue-600 mt-0.5 font-medium">
                  {selectedWarehouseId === 'all' ? 'مطابق للرصيد الفعلي الإجمالي' : 'رصيد المستودع المحدد'}
                </div>
              </div>
            </div>
          )}

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">سجل كارت حركة الصنف الزمني (Stock Ledger)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  كشف تفصيلي شامل لكافة القيود المخزنية، أذونات التوريد، فواتير المشتريات، المبيعات، ومحاضر التسوية
                </p>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                {movementLedger.length} قيد مسجل
              </div>
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
                    <th className="p-3 text-center">الرصيد التراكمي</th>
                    <th className="p-3">ملاحظات وبيان العملية</th>
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
                    movementLedger.map((m) => {
                      const getBadgeClass = () => {
                        const t = m.type;
                        if (t.includes('افتتاحي') || t.includes('أول المدة')) {
                          return 'bg-blue-50 text-blue-700 border-blue-200';
                        }
                        if (t.includes('شراء') || t.includes('GRN') || t.includes('استلام')) {
                          return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        }
                        if (t.includes('POS') || t.includes('فاتورة بيع') || t.includes('بيع')) {
                          return 'bg-purple-50 text-purple-700 border-purple-200';
                        }
                        if (t.includes('مرتجع مبيعات')) {
                          return 'bg-teal-50 text-teal-700 border-teal-200';
                        }
                        if (t.includes('مردودات مشتريات')) {
                          return 'bg-amber-50 text-amber-700 border-amber-200';
                        }
                        if (t.includes('تحويل')) {
                          return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                        }
                        if (t.includes('إتلاف') || t.includes('توالف') || t.includes('عجز') || t.includes('خصم')) {
                          return 'bg-rose-50 text-rose-700 border-rose-200';
                        }
                        if (t.includes('زيادة') || t.includes('إضافة')) {
                          return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        }
                        return m.qtyIn > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200';
                      };

                      const isNeg = (m.balance ?? 0) < 0;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-slate-600 font-mono">{m.date}</td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-block ${getBadgeClass()}`}
                            >
                              {m.type}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => {
                                setViewerTarget({
                                  type: (m.docType as any) || 'stock_movement',
                                  reference: m.reference,
                                  id: m.rawDoc?.id || m.id,
                                  data: m.rawDoc || m,
                                });
                              }}
                              className="group inline-flex items-center gap-1.5 font-mono font-bold text-slate-800 hover:text-emerald-700 transition-colors cursor-pointer text-right underline decoration-dotted decoration-slate-300 hover:decoration-emerald-500 underline-offset-4"
                              title="انقر لعرض تفاصيل السند والوثيقة بالكامل"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                              <span>{m.reference}</span>
                            </button>
                          </td>
                          <td className="p-3 text-slate-600">{m.warehouseName}</td>
                          <td className="p-3 font-bold text-emerald-600 font-mono">
                            {m.qtyIn > 0 ? `+${m.qtyIn}` : <span className="text-slate-300 font-normal">-</span>}
                          </td>
                          <td className="p-3 font-bold text-rose-600 font-mono">
                            {m.qtyOut > 0 ? `-${m.qtyOut}` : <span className="text-slate-300 font-normal">-</span>}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs inline-block ${
                                isNeg
                                  ? 'bg-rose-100 text-rose-800 font-black'
                                  : 'bg-slate-100 text-slate-900'
                              }`}
                            >
                              {m.balance}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs">{m.notes || '-'}</td>
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
                  {varianceMetrics.flatItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد قيود تسوية جردية مسجلة
                      </td>
                    </tr>
                  ) : (
                    varianceMetrics.flatItems.map((item) => {
                      const isInc = item.type === 'increase';
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-semibold text-slate-600">{item.adjustmentNumber}</td>
                          <td className="p-3 text-slate-600 font-mono">{item.date}</td>
                          <td className="p-3 text-slate-700">{item.warehouseName || '-'}</td>
                          <td className="p-3 font-bold text-slate-900">{item.productName}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                isInc
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isInc ? 'تسوية بالزيادة (+)' : 'تسوية بالعجز (-)'}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-slate-800">{item.quantity}</td>
                          <td className="p-3 font-bold text-slate-900">{formatMoney(item.totalCost)}</td>
                          <td className="p-3 text-slate-500">{item.notes || '-'}</td>
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
      </div>

      {/* Print Preview Modal */}
      {showPrintModal && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={currentMeta.title}
        >
          <div className="p-6 space-y-6 text-right report-sheet privacy-blur">
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

      {/* Universal Document Details Viewer Modal */}
      {viewerTarget && (
        <DocumentViewerModal
          documentTarget={viewerTarget}
          onClose={() => setViewerTarget(null)}
        />
      )}
    </div>
  );
};
