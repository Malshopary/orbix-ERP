import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { StockAdjustment, StockAdjustmentItem, Product } from '../../types';
import { SearchableSelect } from '../SearchableSelect';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { PrintHeader } from '../PrintHeader';
import { PrintFooter } from '../PrintFooter';
import {
  ArrowUpDown,
  Plus,
  Search,
  Building,
  Calendar,
  AlertTriangle,
  Printer,
  X,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  FileText,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';

export const StockAdjustmentsTab: React.FC = () => {
  const {
    stockAdjustments,
    warehouses,
    products,
    addStockAdjustment,
    deleteStockAdjustment,
    canDeleteEntity,
    showAlert,
    showConfirm,
    hasPermission,
    formatMoney,
    currency,
    currentUser,
    companyProfile,
    getProductQuantityInWarehouse,
  } = useErp();

  // Filters & State
  const [viewMode, setViewMode] = useState<'movements' | 'vouchers'>('movements');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewAdjustment, setViewAdjustment] = useState<StockAdjustment | null>(null);

  // Form State
  const [adjustmentNumber, setAdjustmentNumber] = useState(`ADJ-${new Date().getFullYear()}-${String(stockAdjustments.length + 1).padStart(3, '0')}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [reason, setReason] = useState<StockAdjustment['reason']>('inventory_variance');
  const [reasonNotes, setReasonNotes] = useState('');
  const [status, setStatus] = useState<'posted' | 'draft'>('posted');
  const [responsiblePerson, setResponsiblePerson] = useState(currentUser?.name || 'أمين المستودع');
  const [items, setItems] = useState<StockAdjustmentItem[]>([]);

  // Item Input Line state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [inputMode, setInputMode] = useState<'targetQty' | 'deltaQty'>('targetQty');
  const [inputTargetQty, setInputTargetQty] = useState<number>(0);
  const [inputDeltaQty, setInputDeltaQty] = useState<number>(0);
  const [customCostPrice, setCustomCostPrice] = useState<number | undefined>(undefined);
  const [itemReason, setItemReason] = useState('');
  const [itemBatch, setItemBatch] = useState('');

  const canEdit = hasPermission('edit_products') || currentUser?.role === 'admin' || currentUser?.role === 'warehouse_keeper' || currentUser?.role === 'manager';

  const getWarehouseName = (id: string) => {
    return warehouses.find((w) => w.id === id)?.name || id;
  };

  const getReasonLabel = (reasonKey: StockAdjustment['reason']) => {
    switch (reasonKey) {
      case 'inventory_variance':
        return 'تسوية فروقات جرد فعلي';
      case 'initial_balance':
        return 'تسوية أرصدة افتتاحية / أول المدة';
      case 'audit_correction':
        return 'تصحيح وتعديل خطأ إدخال سابق';
      case 'gift_promotion':
        return 'هدايا وعينات ترويجية وتسويقية';
      case 'damage_settlement':
        return 'تسوية عجز وتلفيات';
      case 'sample':
        return 'عينات فحص واختبار';
      case 'other':
      default:
        return 'تسوية مخزنية أخرى';
    }
  };

  // Reset form when opening modal
  const openNewAdjustmentModal = () => {
    const defaultWh = warehouses[0]?.id || '';
    setAdjustmentNumber(`ADJ-${new Date().getFullYear()}-${String(stockAdjustments.length + 1).padStart(3, '0')}`);
    setDate(new Date().toISOString().split('T')[0]);
    setWarehouseId(defaultWh);
    setReason('inventory_variance');
    setReasonNotes('');
    setStatus('posted');
    setResponsiblePerson(currentUser?.name || 'مسؤول المخزن');
    setItems([]);
    setSelectedProductId('');
    setInputTargetQty(0);
    setInputDeltaQty(0);
    setCustomCostPrice(undefined);
    setItemReason('');
    setItemBatch('');
    setShowAddModal(true);
  };

  // When product is selected in item row
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      const currentQty = getProductQuantityInWarehouse(prod.id, warehouseId);
      setInputTargetQty(currentQty);
      setInputDeltaQty(0);
      setCustomCostPrice(prod.costPrice || 0);
    }
  };

  // When target qty changes
  const handleTargetQtyChange = (target: number) => {
    setInputTargetQty(target);
    const prod = products.find((p) => p.id === selectedProductId);
    const currentQty = prod ? getProductQuantityInWarehouse(prod.id, warehouseId) : 0;
    setInputDeltaQty(target - currentQty);
  };

  // When delta qty changes
  const handleDeltaQtyChange = (delta: number) => {
    setInputDeltaQty(delta);
    const prod = products.find((p) => p.id === selectedProductId);
    const currentQty = prod ? getProductQuantityInWarehouse(prod.id, warehouseId) : 0;
    setInputTargetQty(currentQty + delta);
  };

  // Add Item to table
  const handleAddItem = () => {
    if (!selectedProductId) {
      showAlert({ title: 'تنبيه', message: 'يرجى اختيار الصنف أولاً.', type: 'warning' });
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const currentQty = getProductQuantityInWarehouse(prod.id, warehouseId);
    const delta = inputMode === 'targetQty' ? (inputTargetQty - currentQty) : inputDeltaQty;
    const finalTargetQty = inputMode === 'targetQty' ? inputTargetQty : (currentQty + inputDeltaQty);

    if (delta === 0) {
      showAlert({
        title: 'تنبيه',
        message: 'لا يوجد فرق في الكمية لتسويته (الرصيد الفعلي يطابق الرصيد الدفتري الحالي).',
        type: 'warning',
      });
      return;
    }

    if (finalTargetQty < 0) {
      showAlert({
        title: 'تنبيه',
        message: 'لا يمكن أن يكون الرصيد الفعلي بعد التسوية سالباً.',
        type: 'error',
      });
      return;
    }

    // Check if item already added
    const existingIndex = items.findIndex((i) => i.productId === prod.id);
    const cost = customCostPrice !== undefined ? customCostPrice : (prod.costPrice || 0);
    const costImpact = delta * cost;

    const newItem: StockAdjustmentItem = {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unit: prod.unit || 'قطعة',
      costPrice: cost,
      currentQuantity: currentQty,
      adjustedQuantity: finalTargetQty,
      deltaQuantity: delta,
      type: delta > 0 ? 'increase' : 'decrease',
      totalCostImpact: costImpact,
      batchNumber: itemBatch || undefined,
      reason: itemReason || getReasonLabel(reason),
    };

    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex] = newItem;
      setItems(updated);
    } else {
      setItems([...items, newItem]);
    }

    // Clear item inputs
    setSelectedProductId('');
    setInputTargetQty(0);
    setInputDeltaQty(0);
    setCustomCostPrice(undefined);
    setItemReason('');
    setItemBatch('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit Voucher
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!warehouseId) {
      showAlert({ title: 'تنبيه', message: 'يرجى تحديد المستودع.', type: 'warning' });
      return;
    }

    if (items.length === 0) {
      showAlert({
        title: 'قائمة الأصناف فارغة',
        message: 'يرجى إضافة صنف واحد على الأقل لإذن التسوية المخزنية.',
        type: 'warning',
      });
      return;
    }

    // Calculations
    let totalIncrease = 0;
    let totalDecrease = 0;
    let totalCostImpact = 0;
    let totalCostAbsValuation = 0;

    items.forEach((item) => {
      if (item.deltaQuantity > 0) {
        totalIncrease += item.deltaQuantity;
      } else {
        totalDecrease += Math.abs(item.deltaQuantity);
      }
      totalCostImpact += item.totalCostImpact;
      totalCostAbsValuation += Math.abs(item.deltaQuantity) * item.costPrice;
    });

    const netDelta = totalIncrease - totalDecrease;
    const generalType: StockAdjustment['type'] =
      reason === 'initial_balance'
        ? 'initial_balance'
        : totalIncrease > 0 && totalDecrease === 0
        ? 'increase'
        : totalDecrease > 0 && totalIncrease === 0
        ? 'decrease'
        : 'general';

    const selectedWh = warehouses.find((w) => w.id === warehouseId);

    addStockAdjustment({
      date,
      warehouseId,
      warehouseName: selectedWh?.name || warehouseId,
      type: generalType,
      reason,
      reasonLabel: getReasonLabel(reason),
      status,
      items,
      totalItemsCount: items.length,
      totalIncreaseQuantity: totalIncrease,
      totalDecreaseQuantity: totalDecrease,
      netQuantityDelta: netDelta,
      totalCostImpact,
      totalCostAbsValuation,
      notes: reasonNotes,
      responsiblePerson,
      approvedBy: currentUser?.name || 'مدير المخازن',
      createdByName: currentUser?.name || 'المستخدم الحالي',
    });

    setShowAddModal(false);
    showAlert({
      title: 'تم الحفظ بنجاح',
      message: `تم إنشاء إذن التسوية المخزنية بنجاح وترحيل الأرصدة والأثر المالي إلى الحسابات.`,
      type: 'success',
    });
  };

  const handleDelete = (adj: StockAdjustment) => {
    const check = canDeleteEntity('stockAdjustment', adj.id);
    if (!check.canDelete) {
      showAlert({
        title: 'تعذر الحذف',
        message: check.reason || 'لا يمكن حذف إذن التسوية.',
        type: 'error',
      });
      return;
    }

    showConfirm(
      `هل أنت متأكد من رغبتك في حذف إذن التسوية (${adj.adjustmentNumber})؟ ${
        adj.status === 'posted' ? 'سيتم التراجع عن تعديلات أرصدة المخزون وإلغاء الأثر المرتبط بها.' : ''
      }`,
      () => {
        deleteStockAdjustment(adj.id);
      },
      'تأكيد حذف إذن التسوية',
      { confirmText: 'نعم، احذف', type: 'error' }
    );
  };

  // Detailed Item Movements (Flattened for items view)
  const detailedItemMovements = useMemo(() => {
    const list: Array<{
      id: string;
      adjustmentId: string;
      adjustmentNumber: string;
      date: string;
      time: string;
      warehouseId: string;
      warehouseName: string;
      productId: string;
      productName: string;
      sku: string;
      unit: string;
      costPrice: number;
      currentQuantity: number;
      adjustedQuantity: number;
      deltaQuantity: number;
      type: 'increase' | 'decrease';
      totalCostImpact: number;
      reason: string;
      responsiblePerson: string;
      status: string;
      notes?: string;
      rawAdjustment: StockAdjustment;
    }> = [];

    stockAdjustments.forEach((adj) => {
      const whName = adj.warehouseName || getWarehouseName(adj.warehouseId);
      adj.items.forEach((item, idx) => {
        const delta = item.deltaQuantity;
        const movementType: 'increase' | 'decrease' = item.type || (delta >= 0 ? 'increase' : 'decrease');
        const itemTime = item.time || adj.time || '';
        const itemReason = item.reason || adj.reasonLabel || getReasonLabel(adj.reason);

        list.push({
          id: `${adj.id}-${item.productId || idx}`,
          adjustmentId: adj.id,
          adjustmentNumber: adj.adjustmentNumber,
          date: adj.date,
          time: itemTime,
          warehouseId: adj.warehouseId,
          warehouseName: whName,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          unit: item.unit || 'قطعة',
          costPrice: item.costPrice || 0,
          currentQuantity: item.currentQuantity,
          adjustedQuantity: item.adjustedQuantity,
          deltaQuantity: delta,
          type: movementType,
          totalCostImpact: item.totalCostImpact || delta * (item.costPrice || 0),
          reason: itemReason,
          responsiblePerson: adj.responsiblePerson || adj.createdByName || '—',
          status: adj.status,
          notes: adj.notes,
          rawAdjustment: adj,
        });
      });
    });

    return list;
  }, [stockAdjustments, warehouses]);

  // Filtered Detailed Item Movements
  const filteredItemMovements = detailedItemMovements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.adjustmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.warehouseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.responsiblePerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesWarehouse = selectedWarehouseFilter === 'ALL' || m.warehouseId === selectedWarehouseFilter;
    const matchesType =
      selectedTypeFilter === 'ALL' ||
      (selectedTypeFilter === 'increase' && m.deltaQuantity > 0) ||
      (selectedTypeFilter === 'decrease' && m.deltaQuantity < 0);
    const matchesStatus = selectedStatusFilter === 'ALL' || m.status === selectedStatusFilter;

    return matchesSearch && matchesWarehouse && matchesType && matchesStatus;
  });

  // Filtered List of Adjustments (Vouchers)
  const filteredAdjustments = stockAdjustments.filter((adj) => {
    const matchesSearch =
      adj.adjustmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (adj.notes && adj.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (adj.reasonLabel && adj.reasonLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (adj.responsiblePerson && adj.responsiblePerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
      adj.items.some(
        (i) =>
          i.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesWarehouse = selectedWarehouseFilter === 'ALL' || adj.warehouseId === selectedWarehouseFilter;
    const matchesType = selectedTypeFilter === 'ALL' || adj.type === selectedTypeFilter || (selectedTypeFilter === 'increase' && adj.netQuantityDelta > 0) || (selectedTypeFilter === 'decrease' && adj.netQuantityDelta < 0);
    const matchesStatus = selectedStatusFilter === 'ALL' || adj.status === selectedStatusFilter;

    return matchesSearch && matchesWarehouse && matchesType && matchesStatus;
  });

  // Summary Metrics
  const totalCount = stockAdjustments.length;
  const totalNetCostImpact = stockAdjustments.reduce((acc, curr) => acc + (curr.totalCostImpact || 0), 0);
  const totalIncreases = stockAdjustments.reduce((acc, curr) => acc + (curr.totalIncreaseQuantity || 0), 0);
  const totalDecreases = stockAdjustments.reduce((acc, curr) => acc + (curr.totalDecreaseQuantity || 0), 0);

  // Export to CSV
  const handleExportCSV = () => {
    if (viewMode === 'movements') {
      if (filteredItemMovements.length === 0) {
        showAlert({ title: 'تنبيه', message: 'لا توجد حركات تسوية لتصديرها.', type: 'warning' });
        return;
      }

      let csvContent = '\uFEFFتاريخ التسوية,وقت التسوية,رقم الإذن,اسم الصنف,رمز الصنف (SKU),المستودع,نوع التسوية,الكمية المسواة,الرصيد السابق,الرصيد بعد التسوية,سعر التكلفة,الأثر المالي,سبب التسوية,المسؤول,الحالة\n';

      filteredItemMovements.forEach((m) => {
        csvContent += `"${m.date}","${m.time}","${m.adjustmentNumber}","${m.productName}","${m.sku}","${m.warehouseName}","${m.deltaQuantity >= 0 ? 'زيادة / إضافة' : 'خصم / عجز'}","${m.deltaQuantity > 0 ? `+${m.deltaQuantity}` : m.deltaQuantity} ${m.unit}","${m.currentQuantity}","${m.adjustedQuantity}","${m.costPrice} ${currency}","${m.totalCostImpact} ${currency}","${m.reason}","${m.responsiblePerson}","${m.status === 'posted' ? 'معتمد ومرحل' : 'مسودة'}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `Stock_Adjustment_Movements_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (filteredAdjustments.length === 0) {
      showAlert({ title: 'تنبيه', message: 'لا توجد بيانات لتصديرها.', type: 'warning' });
      return;
    }

    let csvContent = '\uFEFFرقم الإذن,التاريخ,الوقت,المستودع,نوع وسبب التسوية,عدد الأصناف,كميات الإضافة,كميات الخصم,صافي الفروق,الأثر المالي,المسؤول,الحالة,ملاحظات\n';

    filteredAdjustments.forEach((adj) => {
      csvContent += `"${adj.adjustmentNumber}","${adj.date}","${adj.time || ''}","${adj.warehouseName || getWarehouseName(adj.warehouseId)}","${adj.reasonLabel || adj.reason}","${adj.totalItemsCount}","${adj.totalIncreaseQuantity}","${adj.totalDecreaseQuantity}","${adj.netQuantityDelta}","${adj.totalCostImpact} ${currency}","${adj.responsiblePerson || ''}","${adj.status === 'posted' ? 'معتمد ومرحل' : 'مسودة'}","${(adj.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Stock_Adjustments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedProductObj = products.find((p) => p.id === selectedProductId);
  const currentSelectedStock = selectedProductObj ? getProductQuantityInWarehouse(selectedProductObj.id, warehouseId) : 0;

  return (
    <div id="stock-adjustments-view" className="space-y-6">
      {/* Header & Main Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <ArrowUpDown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">أذونات وتسويات المخزون (Stock Adjustments)</h1>
              <p className="text-sm text-slate-500">
                إدارة فروقات الجرد، تسوية الأرصدة الافتتاحية، وإثبات الزيادة والعجز المخزني مع الترحيل المحاسبي التلقائي.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="export-adjustments-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium border border-slate-200 transition-colors text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            تصدير تقرير CSV
          </button>
          {canEdit && (
            <button
              id="new-stock-adjustment-btn"
              onClick={openNewAdjustmentModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow text-sm"
            >
              <Plus className="w-4 h-4" />
              + إنشاء إذن تسوية مخزنية
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">إجمالي أذونات التسوية</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</p>
            <p className="text-xs text-indigo-600 mt-0.5">عمليات مسجلة بالنظام</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">إجمالي كميات الزيادة (+)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalIncreases.toLocaleString()}</p>
            <p className="text-xs text-emerald-700 mt-0.5">فائض وبضاعة مضافة</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">إجمالي كميات الخصم (-)</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{totalDecreases.toLocaleString()}</p>
            <p className="text-xs text-rose-700 mt-0.5">عجز وتسويات مخصومة</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            totalNetCostImpact >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">صافي الأثر المالي للتسويات</p>
            <p className={`text-2xl font-bold mt-1 ${totalNetCostImpact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatMoney(totalNetCostImpact)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{totalNetCostImpact >= 0 ? 'فائض أرباح مخزون' : 'خسائر وفروقات تسوية'}</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="بحث برقم الإذن، اسم الصنف، SKU، أو الملاحظات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-400" />
            <select
              value={selectedWarehouseFilter}
              onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">جميع المستودعات ({warehouses.length})</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">جميع أنواع التسويات</option>
              <option value="increase">تسويات إضافة وزيادة (+)</option>
              <option value="decrease">تسويات خصم وعجز (-)</option>
              <option value="initial_balance">أرصدة افتتاحية</option>
              <option value="general">تسويات متعددة ومختلطة</option>
            </select>
          </div>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="posted">معتمد ومرحل</option>
            <option value="draft">مسودة</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          {viewMode === 'movements' ? (
            <span>عرض <strong className="text-indigo-600 font-bold">{filteredItemMovements.length}</strong> حركة صنف</span>
          ) : (
            <span>عرض <strong className="text-indigo-600 font-bold">{filteredAdjustments.length}</strong> إذن تسوية</span>
          )}
        </div>
      </div>

      {/* View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl border border-slate-200">
          <button
            id="view-mode-movements-btn"
            type="button"
            onClick={() => setViewMode('movements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'movements'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpDown className="w-4 h-4 text-indigo-600" />
            سجل حركات الأصناف المسواة تفصيلياً ({filteredItemMovements.length})
          </button>
          <button
            id="view-mode-vouchers-btn"
            type="button"
            onClick={() => setViewMode('vouchers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'vouchers'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-500" />
            أذونات وسندات التسوية المجمعة ({filteredAdjustments.length})
          </button>
        </div>

        <p className="text-xs text-slate-400">
          {viewMode === 'movements'
            ? 'سجل تفصيلي لكل صنف تم تعديله بالزيادة أو النقص مع التاريخ والوقت والكمية والمستودع.'
            : 'عرض الأذونات المخزنية كأرقام سندات رسمية مجمعة مع عدد الأصناف وإجمالي الأثر.'}
        </p>
      </div>

      {/* Adjustments Content Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {viewMode === 'movements' ? (
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">تاريخ ووقت التسوية</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">رقم الإذن</th>
                  <th className="px-5 py-3.5">الصنف والرمز (SKU)</th>
                  <th className="px-5 py-3.5">المستودع / المخزن</th>
                  <th className="px-5 py-3.5 text-center whitespace-nowrap">نوع التسوية</th>
                  <th className="px-5 py-3.5 text-center whitespace-nowrap">الكمية المسواة</th>
                  <th className="px-5 py-3.5 text-center whitespace-nowrap">الرصيد المخزني</th>
                  <th className="px-5 py-3.5">نوع وسبب التسوية</th>
                  <th className="px-5 py-3.5">الأثر المالي والتكلفة</th>
                  <th className="px-5 py-3.5">المسؤول</th>
                  <th className="px-5 py-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItemMovements.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <ArrowUpDown className="w-10 h-10" />
                        </div>
                        <p className="font-medium text-slate-600 text-base">لا توجد حركات تسوية مخزنية مسجلة</p>
                        <p className="text-xs text-slate-400">
                          عند تسوية أي صنف بزيادة أو نقص سيتم إدراج الحركة هنا بكامل بياناتها (التاريخ والوقت والكمية والمستودع).
                        </p>
                        {canEdit && (
                          <button
                            onClick={openNewAdjustmentModal}
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            إنشاء إذن تسوية جديد الآن
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItemMovements.map((mov) => {
                    const isIncrease = mov.deltaQuantity >= 0;
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-slate-800 text-xs flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {mov.date}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md w-fit">
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              {mov.time || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-indigo-600 text-xs whitespace-nowrap">
                          {mov.adjustmentNumber}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 text-xs">{mov.productName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{mov.sku}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800 text-xs">{mov.warehouseName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          {isIncrease ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              زيادة / إضافة (+)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              عجز / نقص (-)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <span
                            className={`font-black text-sm px-2 py-0.5 rounded-md ${
                              isIncrease
                                ? 'text-emerald-700 bg-emerald-50/80'
                                : 'text-rose-700 bg-rose-50/80'
                            }`}
                          >
                            {isIncrease ? `+${mov.deltaQuantity}` : mov.deltaQuantity} {mov.unit}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                            <span className="text-slate-400 font-mono" title="الرصيد الدفتري قبل التسوية">{mov.currentQuantity}</span>
                            <span className="text-slate-300">⬅</span>
                            <span className="font-bold text-indigo-700 font-mono" title="الرصيد الفعلي بعد التسوية">{mov.adjustedQuantity}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col max-w-xs">
                            <span className="font-semibold text-slate-800 text-xs">{mov.reason}</span>
                            {mov.notes && (
                              <span className="text-[11px] text-slate-400 truncate" title={mov.notes}>
                                {mov.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span
                              className={`font-bold text-xs ${
                                mov.totalCostImpact >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {mov.totalCostImpact > 0
                                ? `+${formatMoney(mov.totalCostImpact)}`
                                : formatMoney(mov.totalCostImpact)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              سعر التكلفة: {formatMoney(mov.costPrice)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                          {mov.responsiblePerson}
                        </td>
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <button
                            id={`view-movement-adj-btn-${mov.id}`}
                            type="button"
                            onClick={() => setViewAdjustment(mov.rawAdjustment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="معاينة وطباعة إذن التسوية"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            معاينة الإذن
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">رقم الإذن</th>
                  <th className="px-5 py-3.5">التاريخ والوقت</th>
                  <th className="px-5 py-3.5">المستودع</th>
                  <th className="px-5 py-3.5">نوع وسبب التسوية</th>
                  <th className="px-5 py-3.5 text-center">عدد الأصناف</th>
                  <th className="px-5 py-3.5 text-center">كميات الإضافة (+)</th>
                  <th className="px-5 py-3.5 text-center">كميات الخصم (-)</th>
                  <th className="px-5 py-3.5">الأثر المالي والتكلفة</th>
                  <th className="px-5 py-3.5">المسؤول</th>
                  <th className="px-5 py-3.5 text-center">الحالة</th>
                  <th className="px-5 py-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                          <ArrowUpDown className="w-10 h-10" />
                        </div>
                        <p className="font-medium text-slate-600 text-base">لا توجد أذونات تسوية مخزنية مطابقة</p>
                        <p className="text-xs text-slate-400">
                          يمكنك إنشاء أول إذن تسوية لمعالجة فروقات الجرد أو تسوية أرصدة المخازن.
                        </p>
                        {canEdit && (
                          <button
                            onClick={openNewAdjustmentModal}
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            إنشاء إذن تسوية الآن
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAdjustments.map((adj) => {
                    const netCost = adj.totalCostImpact || 0;
                    return (
                      <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-indigo-600 text-xs">
                          {adj.adjustmentNumber}
                        </td>
                        <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-slate-800">{adj.date}</span>
                            {adj.time && (
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 text-indigo-500" />
                                {adj.time}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800">
                              {adj.warehouseName || getWarehouseName(adj.warehouseId)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-xs">
                              {adj.reasonLabel || getReasonLabel(adj.reason)}
                            </span>
                            {adj.notes && (
                              <span className="text-xs text-slate-400 truncate max-w-xs" title={adj.notes}>
                                {adj.notes}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                            {adj.totalItemsCount || adj.items.length} صنف
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-semibold text-emerald-600">
                          {adj.totalIncreaseQuantity > 0 ? `+${adj.totalIncreaseQuantity}` : '-'}
                        </td>
                        <td className="px-5 py-4 text-center font-semibold text-rose-600">
                          {adj.totalDecreaseQuantity > 0 ? `-${adj.totalDecreaseQuantity}` : '-'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className={`font-bold text-xs ${netCost >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {netCost > 0 ? `+${formatMoney(netCost)}` : formatMoney(netCost)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              القيمة الإجمالية: {formatMoney(adj.totalCostAbsValuation || Math.abs(netCost))}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          {adj.responsiblePerson || adj.createdByName || '—'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {adj.status === 'posted' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              معتمد ومرحل
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              مسودة
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`view-adj-btn-${adj.id}`}
                              onClick={() => setViewAdjustment(adj)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="معاينة وطباعة الإذن"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <button
                                id={`delete-adj-btn-${adj.id}`}
                                onClick={() => handleDelete(adj)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="حذف الإذن والتراجع عن التسوية"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE STOCK ADJUSTMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <ArrowUpDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">إنشاء إذن تسوية مخزنية جديد</h3>
                  <p className="text-xs text-slate-500">
                    تعديل كميات الأصناف بالمستودع وإثبات الفروقات والأثر المحاسبي
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Top Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الإذن</label>
                  <input
                    type="text"
                    required
                    value={adjustmentNumber}
                    onChange={(e) => setAdjustmentNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت التسوية</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المستودع المستهدف *</label>
                  <select
                    required
                    value={warehouseId}
                    onChange={(e) => {
                      setWarehouseId(e.target.value);
                      // Clear items if warehouse changes to prevent mismatch
                      setItems([]);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سبب التسوية *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as StockAdjustment['reason'])}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                  >
                    <option value="inventory_variance">فروقات جرد فعلي</option>
                    <option value="initial_balance">تسوية رصيد افتتاحي</option>
                    <option value="audit_correction">تصحيح خطأ إدخال</option>
                    <option value="gift_promotion">هدايا وعينات ترويجية</option>
                    <option value="damage_settlement">تسوية عجز أو تلفيات</option>
                    <option value="sample">عينات فحص وتجربة</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">المسؤول / القائم بالتسوية</label>
                  <input
                    type="text"
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    placeholder="اسم أمين المستودع أو المحاسب المسؤول..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات وبيان التسوية</label>
                  <input
                    type="text"
                    value={reasonNotes}
                    onChange={(e) => setReasonNotes(e.target.value)}
                    placeholder="سبب التسوية بالتفصيل أو رقم محضر الجرد المرتبط..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Add Item Row Box */}
              <div className="border border-indigo-100 bg-indigo-50/40 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    إضافة صنف إلى إذن التسوية
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">طريقة الإدخال:</span>
                    <button
                      type="button"
                      onClick={() => setInputMode('targetQty')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                        inputMode === 'targetQty'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      إدخال الرصيد الفعلي الجديد
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('deltaQty')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                        inputMode === 'deltaQty'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      إدخال فرق الكمية (+ / -)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">اختر الصنف *</label>
                    <SearchableSelect
                      options={products.map((p) => {
                        const q = getProductQuantityInWarehouse(p.id, warehouseId);
                        return {
                          value: p.id,
                          label: `${p.name} (${p.sku})`,
                          description: `الرصيد بالمستودع: ${q} ${p.unit || 'قطعة'} | سعر التكلفة: ${p.costPrice || 0} ${currency}`,
                        };
                      })}
                      value={selectedProductId}
                      onChange={handleProductSelect}
                      placeholder="ابحث بالاسم أو الباركود..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">الرصيد الدفتري الحالي</label>
                    <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 text-center">
                      {selectedProductObj ? `${currentSelectedStock} ${selectedProductObj.unit || 'قطعة'}` : '—'}
                    </div>
                  </div>

                  {inputMode === 'targetQty' ? (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-indigo-900 mb-1">الرصيد الفعلي الجديد *</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={inputTargetQty}
                        onChange={(e) => handleTargetQtyChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-sm font-bold text-indigo-700 text-center focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-indigo-900 mb-1">فرق الكمية (+ / -) *</label>
                      <input
                        type="number"
                        step="any"
                        value={inputDeltaQty}
                        onChange={(e) => handleDeltaQtyChange(parseFloat(e.target.value) || 0)}
                        placeholder="مثلاً: +5 أو -3"
                        className={`w-full px-3 py-2 bg-white border rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500 focus:outline-hidden ${
                          inputDeltaQty > 0
                            ? 'border-emerald-300 text-emerald-700'
                            : inputDeltaQty < 0
                            ? 'border-rose-300 text-rose-700'
                            : 'border-slate-300 text-slate-700'
                        }`}
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">سعر التكلفة للوحدة</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={customCostPrice ?? (selectedProductObj?.costPrice || 0)}
                      onChange={(e) => setCustomCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-center focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!selectedProductId}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      إدراج الصنف
                    </button>
                  </div>
                </div>

                {/* Real-time Item Preview Info */}
                {selectedProductObj && (
                  <div className="text-xs flex items-center justify-between text-slate-600 bg-white/70 p-2.5 rounded-lg border border-indigo-100">
                    <div>
                      الصنف: <span className="font-bold text-slate-800">{selectedProductObj.name}</span> ({selectedProductObj.sku})
                    </div>
                    <div className="flex items-center gap-4">
                      <span>
                        الفرق المحتسب:{' '}
                        <strong className={inputDeltaQty > 0 ? 'text-emerald-600' : inputDeltaQty < 0 ? 'text-rose-600' : 'text-slate-600'}>
                          {inputDeltaQty > 0 ? `+${inputDeltaQty}` : inputDeltaQty} {selectedProductObj.unit || 'قطعة'}
                        </strong>
                      </span>
                      <span>
                        الأثر المالي:{' '}
                        <strong className={inputDeltaQty * (customCostPrice ?? (selectedProductObj.costPrice || 0)) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {formatMoney(inputDeltaQty * (customCostPrice ?? (selectedProductObj.costPrice || 0)))}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">جدول أصناف إذن التسوية ({items.length} صنف)</span>
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setItems([])}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      تفريغ الجدول
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">الصنف / SKU</th>
                        <th className="p-3 text-center">الرصيد الدفتري</th>
                        <th className="p-3 text-center">الرصيد المعدل</th>
                        <th className="p-3 text-center">فرق التسوية</th>
                        <th className="p-3 text-center">سعر التكلفة</th>
                        <th className="p-3">الأثر المالي</th>
                        <th className="p-3 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                            لم يتم إضافة أصناف إلى إذن التسوية حتى الآن. استخدم النموذج أعلاه لإدراج الأصناف.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr key={item.productId} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-medium text-slate-800">
                              <div>{item.productName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                            </td>
                            <td className="p-3 text-center font-semibold text-slate-600">
                              {item.currentQuantity} {item.unit}
                            </td>
                            <td className="p-3 text-center font-bold text-indigo-700">
                              {item.adjustedQuantity} {item.unit}
                            </td>
                            <td className="p-3 text-center font-bold">
                              <span
                                className={`px-2 py-0.5 rounded-md ${
                                  item.deltaQuantity > 0
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {item.deltaQuantity > 0 ? `+${item.deltaQuantity}` : item.deltaQuantity} {item.unit}
                              </span>
                            </td>
                            <td className="p-3 text-center text-slate-600">
                              {formatMoney(item.costPrice)}
                            </td>
                            <td className={`p-3 font-bold ${item.totalCostImpact >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.totalCostImpact > 0 ? `+${formatMoney(item.totalCostImpact)}` : formatMoney(item.totalCostImpact)}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation Banner */}
              {items.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-slate-500">إجمالي الأصناف:</span>{' '}
                      <span className="font-bold text-slate-800">{items.length}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">إجمالي كميات الزيادة (+):</span>{' '}
                      <span className="font-bold text-emerald-600">
                        +{items.filter((i) => i.deltaQuantity > 0).reduce((acc, c) => acc + c.deltaQuantity, 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">إجمالي كميات الخصم (-):</span>{' '}
                      <span className="font-bold text-rose-600">
                        -{items.filter((i) => i.deltaQuantity < 0).reduce((acc, c) => acc + Math.abs(c.deltaQuantity), 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-semibold">صافي الأثر المالي للتسوية:</span>
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-lg ${
                        items.reduce((acc, c) => acc + c.totalCostImpact, 0) >= 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {formatMoney(items.reduce((acc, c) => acc + c.totalCostImpact, 0))}
                    </span>
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium text-sm transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm shadow-md transition-all"
                >
                  اعتماد وترحيل إذن التسوية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & PRINT ADJUSTMENT VOUCHER MODAL */}
      {viewAdjustment && (
        <PrintPreviewModal
          isOpen={!!viewAdjustment}
          onClose={() => setViewAdjustment(null)}
          title="معاينة إذن تسوية مخزنية"
          docNumber={viewAdjustment.adjustmentNumber}
          badgeText={viewAdjustment.status === 'posted' ? 'معتمد ومرحل' : 'مسودة تسوية'}
          badgeColor={viewAdjustment.status === 'posted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
          elementId="stock-adjustment-print-sheet"
        >
          {({ orientation }) => (
            <div className="space-y-6 text-xs text-slate-800">
              {/* Standardized Header */}
              <PrintHeader
                docTitle="إذن تسوية ومطابقة مخزنية (Stock Adjustment)"
                docSubtitle="مستند رسمي لتسوية فروقات الجرد والأرصدة الافتتاحية وترحيل الأثر المالي دفترياً ومحاسبياً"
                docNumber={viewAdjustment.adjustmentNumber}
                date={viewAdjustment.date}
                badgeColor="bg-indigo-700 text-white"
                additionalMeta={[
                  { label: 'المستودع', value: viewAdjustment.warehouseName || getWarehouseName(viewAdjustment.warehouseId) },
                  { label: 'نوع وسبب التسوية', value: viewAdjustment.reasonLabel || viewAdjustment.reason },
                  { label: 'المسؤول', value: viewAdjustment.responsiblePerson || '—' },
                  { label: 'صافي الأثر المالي', value: `${viewAdjustment.totalCostImpact > 0 ? '+' : ''}${formatMoney(viewAdjustment.totalCostImpact)}` },
                ]}
                orientation={orientation}
              />

              {/* Voucher Meta Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block">المستودع:</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5">{viewAdjustment.warehouseName || getWarehouseName(viewAdjustment.warehouseId)}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">سبب التسوية:</span>
                  <span className="font-bold text-indigo-800 mt-0.5">{viewAdjustment.reasonLabel || viewAdjustment.reason}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">المسؤول / أمين المخزن:</span>
                  <span className="font-bold text-slate-800 mt-0.5">{viewAdjustment.responsiblePerson || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block">حالة التسوية:</span>
                  <span className={`inline-flex items-center gap-1 font-bold mt-0.5 ${viewAdjustment.status === 'posted' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {viewAdjustment.status === 'posted' ? 'معتمد ومرحل' : 'مسودة قيد المراجعة'}
                  </span>
                </div>
                {viewAdjustment.notes && (
                  <div className="col-span-2 sm:col-span-4 mt-2 pt-2 border-t border-slate-200 text-slate-600">
                    <span className="font-semibold text-slate-700">بيان وملاحظات: </span>
                    {viewAdjustment.notes}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 text-center">#</th>
                      <th className="py-2.5 px-3">الصنف / كود SKU</th>
                      <th className="py-2.5 px-3 text-center">الرصيد الدفتري</th>
                      <th className="py-2.5 px-3 text-center">الرصيد الفعلي المعدل</th>
                      <th className="py-2.5 px-3 text-center">فرق الكمية (+ / -)</th>
                      <th className="py-2.5 px-3 text-center">تكلفة الوحدة</th>
                      <th className="py-2.5 px-3 text-left">الأثر المالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {viewAdjustment.items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-mono text-slate-400">{index + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.sku}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">
                          {item.currentQuantity} {item.unit || 'قطعة'}
                        </td>
                        <td className="py-2 px-3 text-center font-bold font-mono text-indigo-700">
                          {item.adjustedQuantity} {item.unit || 'قطعة'}
                        </td>
                        <td className="py-2 px-3 text-center font-bold font-mono">
                          <span
                            className={
                              item.deltaQuantity > 0 ? 'text-emerald-700' : item.deltaQuantity < 0 ? 'text-rose-700' : 'text-slate-600'
                            }
                          >
                            {item.deltaQuantity > 0 ? `+${item.deltaQuantity}` : item.deltaQuantity} {item.unit || 'قطعة'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">
                          {formatMoney(item.costPrice)}
                        </td>
                        <td className={`py-2 px-3 text-left font-bold font-mono ${item.totalCostImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {item.totalCostImpact > 0 ? `+${formatMoney(item.totalCostImpact)}` : formatMoney(item.totalCostImpact)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-300 text-slate-800">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-right">
                        الإجمالي: ({viewAdjustment.items.length} صنف)
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        صافي الكمية: <span className={viewAdjustment.netQuantityDelta > 0 ? 'text-emerald-700' : viewAdjustment.netQuantityDelta < 0 ? 'text-rose-700' : ''}>{viewAdjustment.netQuantityDelta > 0 ? `+${viewAdjustment.netQuantityDelta}` : viewAdjustment.netQuantityDelta}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">صافي الأثر المالي:</td>
                      <td className={`py-2.5 px-3 text-left font-mono text-sm ${viewAdjustment.totalCostImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {viewAdjustment.totalCostImpact > 0 ? `+${formatMoney(viewAdjustment.totalCostImpact)}` : formatMoney(viewAdjustment.totalCostImpact)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Standardized Footer with Signatures */}
              <PrintFooter
                preparedByTitle="أمين المستودع"
                approvedByTitle="المحاسب المالي"
                receivedByTitle="اعتماد مدير المخازن / الإدارة"
                notes={viewAdjustment.notes || 'تم إجراء التسوية المخزنية ومطابقة الأرصدة الدفترية مع الفعلية واعتماد الأثر المحاسبي وفقاً للائحة الحسابات والمخازن.'}
                orientation={orientation}
              />
            </div>
          )}
        </PrintPreviewModal>
      )}
    </div>
  );
};
