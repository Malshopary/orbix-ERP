import React, { useState, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import { Product } from '../types';
import {
  Package,
  PlusCircle,
  AlertTriangle,
  ArrowDownUp,
  Search,
  Warehouse as WarehouseIcon,
  Tag,
  Barcode,
  X,
  TrendingUp,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Camera,
  Upload,
  ArrowRightLeft,
  ClipboardCheck,
  Calendar,
  Layers,
  Building,
  Sliders,
  Sparkles,
  DollarSign,
  Building2,
  MapPin,
  Check,
  PackagePlus,
  ShieldCheck,
  Clock,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { WarehouseTransfersTab } from './inventory/WarehouseTransfersTab';
import { StocktakingTab } from './inventory/StocktakingTab';
import { ScrapVouchersTab } from './inventory/ScrapVouchersTab';
import { BatchesExpiryTab } from './inventory/BatchesExpiryTab';
import { BarcodePrintTab } from './inventory/BarcodePrintTab';
import { WarehousesManagementTab } from './inventory/WarehousesManagementTab';
import { QuickAddModal } from './QuickAddModal';
import { SearchableSelect } from './SearchableSelect';
import {
  GOVERNORATES_DATA,
  PRODUCT_BRANDS,
  PRODUCT_UNITS,
} from '../data/regionsData';

export const InventoryView: React.FC = () => {
  const {
    products,
    warehouses,
    vendors,
    stockTransfers,
    stocktakingSessions,
    scrapVouchers,
    productBatches,
    currency,
    formatMoney,
    formatDualMoney,
    secondaryCurrency,
    canDeleteEntity,
    addProduct,
    editProduct,
    deleteProduct,
    syncProductBatches,
    updateProductStock,
    adjustProductWarehouseStock,
    getProductWarehouseBreakdown,
    updateProductShelfLocation,
    hasPermission,
    activeSubTab,
    setActiveSubTab,
    showAlert,
    showConfirm,
  } = useErp();

  const [currentTab, setCurrentTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'warning' | 'success' } | null>(null);

  React.useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
      if (activeSubTab === 'low_stock') {
        setOnlyLowStock(true);
      } else if (activeSubTab === 'all') {
        setOnlyLowStock(false);
      } else if (activeSubTab === 'adjust') {
        setShowAdjustModal(true);
        if (products.length > 0) setSelectedProduct(products[0]);
      }
    }
  }, [activeSubTab, products]);

  // Modals
  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustWarehouseId, setAdjustWarehouseId] = useState<string>('');

  // Warehouse Stock Breakdown Modal & Inline Shelf Editor State
  const [breakdownProduct, setBreakdownProduct] = useState<Product | null>(null);
  const [editingShelfWarehouseId, setEditingShelfWarehouseId] = useState<string | null>(null);
  const [shelfEditValue, setShelfEditValue] = useState<string>('');

  // Multi-Batch Draft State for Product Editing
  interface ProductBatchDraft {
    id: string;
    batchNumber: string;
    productionDate: string;
    expiryDate: string;
    warehouseId: string;
    quantity: number;
    notes?: string;
  }

  const [editBatches, setEditBatches] = useState<ProductBatchDraft[]>([]);
  const [selectedBatchFocusId, setSelectedBatchFocusId] = useState<string>('');

  // Edit Product Comprehensive Form State
  const [editId, setEditId] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editOriginCountry, setEditOriginCountry] = useState('');
  const [editUnit, setEditUnit] = useState('قطعة (Pcs)');
  const [editDescription, setEditDescription] = useState('');
  const [editCostPrice, setEditCostPrice] = useState(0);
  const [editSellingPrice, setEditSellingPrice] = useState(0);
  const [editWholesalePrice, setEditWholesalePrice] = useState(0);
  const [editMinSellingPrice, setEditMinSellingPrice] = useState(0);
  const [editMinStockAlert, setEditMinStockAlert] = useState(5);
  const [editWarehouseId, setEditWarehouseId] = useState('');
  const [editGovernorate, setEditGovernorate] = useState('القاهرة');
  const [editShelfLocation, setEditShelfLocation] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editHasExpiry, setEditHasExpiry] = useState(false);
  const [editProductionDate, setEditProductionDate] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editBatchNumber, setEditBatchNumber] = useState('');
  const [editImageBase64, setEditImageBase64] = useState<string | undefined>(undefined);

  const editFileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = hasPermission('edit_products');
  const canDelete = hasPermission('delete_products');

  const handleGenerateBarcode = (isEdit: boolean = true) => {
    const code = '622' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setEditBarcode(code);
  };

  const handleGenerateSku = (isEdit: boolean = true) => {
    const code = `PRD-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    setEditSku(code);
  };

  const calculateBatchDays = (expDate: string) => {
    if (!expDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expDate);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getBatchStatusBadge = (expDate: string) => {
    const days = calculateBatchDays(expDate);
    if (days === null) return { label: 'غير محدد', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (days < 0) return { label: `منتهي (${Math.abs(days)} يوم مضت)`, bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (days <= 60) return { label: `يقترب من الانتهاء (${days} يوم متبقي)`, bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: `ساري (${days} يوم متبقي)`, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const handleAddBatchRow = (isEdit: boolean = true) => {
    const count = editBatches.length + 1;
    const nextSeq = count.toString().padStart(2, '0');
    const newRow: ProductBatchDraft = {
      id: `temp-batch-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      batchNumber: `BATCH-${new Date().getFullYear()}-${nextSeq}`,
      productionDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      warehouseId: editWarehouseId || warehouses[0]?.id || 'wh-1',
      quantity: 10,
    };
    setEditBatches((prev) => [...prev, newRow]);
  };

  const handleRemoveBatchRow = (index: number, isEdit: boolean = true) => {
    if (editBatches.length <= 1) return;
    setEditBatches((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBatchFieldChange = (
    index: number,
    field: keyof ProductBatchDraft,
    value: any,
    isEdit: boolean = true
  ) => {
    setEditBatches((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );
  };

  const handleGenerateBatchCode = (index: number, isEdit: boolean = true) => {
    const code = `LOT-${Date.now().toString().slice(-4)}-${(index + 1).toString().padStart(2, '0')}`;
    handleBatchFieldChange(index, 'batchNumber', code, isEdit);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = true) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showAlert({
        title: 'حجم الملف كبير',
        message: 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميغابايت.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setEditImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleOpenEdit = (p: Product) => {
    if (!canEdit) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية تعديل بيانات الأصناف. يرجى مراجعة المسؤول.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setEditId(p.id);
    setEditSku(p.sku);
    setEditName(p.name);
    setEditCategory(p.category || 'إلكترونيات وأجهزة');
    setEditBrand(p.brand || 'عام / محلي');
    setEditOriginCountry(p.originCountry || 'مصر');
    setEditUnit(p.unit || 'قطعة (Pcs)');
    setEditDescription(p.description || '');
    setEditCostPrice(p.costPrice || 0);
    setEditSellingPrice(p.sellingPrice || 0);
    setEditWholesalePrice(p.wholesalePrice || p.sellingPrice * 0.9);
    setEditMinSellingPrice(p.minSellingPrice || p.costPrice * 1.1);
    setEditMinStockAlert(p.minStockAlert || 5);
    setEditWarehouseId(p.warehouseId || warehouses[0]?.id || 'wh-1');
    setEditGovernorate(p.governorate || 'القاهرة');
    setEditShelfLocation(p.shelfLocation || '');
    setEditSupplierId(p.supplierId || '');
    setEditBarcode(p.barcode || '');
    setEditHasExpiry(p.hasExpiry || false);
    setEditProductionDate(p.productionDate || '');
    setEditExpiryDate(p.expiryDate || '');
    setEditBatchNumber(p.batchNumber || '');
    setEditImageBase64(p.imageBase64);
    setSelectedBatchFocusId('');

    // Load all existing batches for this product from productBatches
    const existing = productBatches.filter((b) => b.productId === p.id);
    if (existing.length > 0) {
      setEditBatches(
        existing.map((b) => ({
          id: b.id,
          batchNumber: b.batchNumber,
          productionDate: b.productionDate || '',
          expiryDate: b.expiryDate,
          warehouseId: b.warehouseId || p.warehouseId || warehouses[0]?.id || 'wh-1',
          quantity: b.quantity,
          notes: b.notes,
        }))
      );
    } else if (p.hasExpiry || p.expiryDate) {
      setEditBatches([
        {
          id: `batch-${Date.now()}`,
          batchNumber: p.batchNumber || `BATCH-${p.sku}`,
          productionDate: p.productionDate || new Date().toISOString().split('T')[0],
          expiryDate: p.expiryDate || '',
          warehouseId: p.warehouseId || warehouses[0]?.id || 'wh-1',
          quantity: p.stockQuantity || 0,
        },
      ]);
    } else {
      setEditBatches([
        {
          id: `batch-${Date.now()}`,
          batchNumber: `BATCH-${p.sku}`,
          productionDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          warehouseId: p.warehouseId || warehouses[0]?.id || 'wh-1',
          quantity: p.stockQuantity || 0,
        },
      ]);
    }

    setShowEditModal(true);
  };

  const handleDelete = (p: Product) => {
    if (!canDelete) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية حذف الأصناف.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    const check = canDeleteEntity('product', p.id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف الصنف (${p.name})`,
        message: 'لا يمكن حذف الصنف من المخازن للأسباب التالية:',
        details: check.reason,
        note: 'لحماية تكلفة المخزون ومتوسط الأسعار والتقارير المالية، لا يمكن حذف الأصناف التي عليها حركة أو رصيد.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    showConfirm(
      `هل أنت متأكد من حذف الصنف "${p.name}" (${p.sku}) نهائياً من المستودعات؟`,
      () => {
        deleteProduct(p.id);
      },
      `تأكيد حذف الصنف (${p.sku})`,
      'حذف الصنف'
    );
  };

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchLow = onlyLowStock ? p.stockQuantity <= p.minStockAlert : true;
    return matchSearch && matchCat && matchLow;
  });

  const totalInventoryCost = products.reduce((sum, p) => sum + p.costPrice * p.stockQuantity, 0);
  const totalInventoryRetail = products.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const delta = adjustType === 'IN' ? Math.abs(adjustQty) : -Math.abs(adjustQty);
    updateProductStock(selectedProduct.id, delta, adjustWarehouseId || undefined);
    const newQty = selectedProduct.stockQuantity + delta;
    setShowAdjustModal(false);

    const targetWhName = adjustWarehouseId ? warehouses.find((w) => w.id === adjustWarehouseId)?.name : 'المستودع العام';

    if (newQty <= selectedProduct.minStockAlert) {
      setNotification({
        message: `تنبيه فوري: أصبح رصيد الصنف "${selectedProduct.name}" (${newQty} ${selectedProduct.unit}) أقل من أو مساوياً لحد الطلب الأدنى (${selectedProduct.minStockAlert})!`,
        type: 'warning',
      });
    } else {
      setNotification({
        message: `تم تحديث رصيد الصنف "${selectedProduct.name}" في ${targetWhName} بنجاح. الرصيد الكلي: ${newQty} ${selectedProduct.unit}.`,
        type: 'success',
      });
    }
    setTimeout(() => setNotification(null), 5000);
    setSelectedProduct(null);
    setAdjustWarehouseId('');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-md transition-all ${
            notification.type === 'warning'
              ? 'bg-rose-50 border-rose-300 text-rose-900 animate-pulse'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`w-4 h-4 ${
                notification.type === 'warning' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-tab Views */}
      {currentTab === 'transfers' && <WarehouseTransfersTab />}
      {currentTab === 'stocktaking' && <StocktakingTab />}
      {currentTab === 'scrap' && <ScrapVouchersTab />}
      {currentTab === 'batches' && <BatchesExpiryTab />}
      {currentTab === 'barcodes' && <BarcodePrintTab />}
      {currentTab === 'warehouses' && <WarehousesManagementTab />}

      {/* Primary Products View (All / Low Stock) */}
      {(currentTab === 'all' || currentTab === 'low_stock' || currentTab === 'adjust') && (
        <>
          {/* Header Banner & Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                إدارة المخازن وتقييم المخزون السلعي
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                متابعة دقيقة للأرصدة اللحظية، بطاقات الأصناف، وتنبيهات نواقص المستودعات
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowQuickAddProduct(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                إضافة صنف جديد
              </button>
            </div>
          </div>


      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">إجمالي قيمة المخزون بالتكلفة (Cost Valuation)</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{formatMoney(totalInventoryCost)}</div>
          {secondaryCurrency !== currency && (
            <div className="text-xs font-bold text-slate-600 mt-0.5">
              ≈ {formatDualMoney(totalInventoryCost).split('(')[1]?.replace(')', '')}
            </div>
          )}
          <div className="text-[11px] text-slate-400 mt-0.5">القيمة الدفترية في الأصول المتداولة</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">القيمة التقديرية بسعر البيع (Retail Value)</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">{formatMoney(totalInventoryRetail)}</div>
          {secondaryCurrency !== currency && (
            <div className="text-xs font-bold text-emerald-700 mt-0.5">
              ≈ {formatDualMoney(totalInventoryRetail).split('(')[1]?.replace(')', '')}
            </div>
          )}
          <div className="text-[11px] text-emerald-700 mt-0.5">
            هامش ربح متوقع: {formatMoney(totalInventoryRetail - totalInventoryCost)}
          </div>
        </div>

        <div
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`p-4 rounded-2xl border shadow-xs transition-all cursor-pointer ${
            onlyLowStock
              ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-400'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">أصناف تحت حد الأمان وإعادة الطلب</span>
            {lowStockCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </div>
          <div className="text-xl font-extrabold text-rose-600 mt-1">{lowStockCount} أصناف</div>
          <div className="text-[11px] text-rose-700 mt-0.5 font-semibold">
            {onlyLowStock ? '✓ يتم الآن عرض النواقص فقط (انقر للإلغاء)' : 'انقر لتصفية وعرض النواقص فقط'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="البحث بالاسم أو SKU أو الباركود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pr-9 pl-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`text-xs px-3 py-2 rounded-xl border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              onlyLowStock
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            نواقص المخزون ({lowStockCount})
          </button>

          <span className="text-xs text-slate-500 font-medium">التصنيف:</span>
          <div className="w-48">
            <SearchableSelect
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              options={[
                { value: 'all', label: 'جميع التصنيفات' },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
              searchPlaceholder="ابحث بالتصنيف..."
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">كود الصنف (SKU)</th>
                <th className="py-3 px-4">اسم الصنف والمنتج</th>
                <th className="py-3 px-4">التصنيف والوحدة</th>
                <th className="py-3 px-4">سعر التكلفة</th>
                <th className="py-3 px-4">سعر البيع</th>
                <th className="py-3 px-4">الهامش الربحي</th>
                <th className="py-3 px-4">الرصيد المتاح</th>
                <th className="py-3 px-4">إجمالي التقييم</th>
                <th className="py-3 px-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const margin = p.sellingPrice - p.costPrice;
                const marginPercent = ((margin / p.sellingPrice) * 100).toFixed(1);
                const isLow = p.stockQuantity <= p.minStockAlert;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {p.sku}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {p.imageBase64 ? (
                          <img
                            src={p.imageBase64}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          {p.barcode && (
                            <div className="text-[10px] text-slate-400 font-mono">باركود: {p.barcode}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                        {p.category}
                      </span>
                      <span className="text-[11px] text-slate-400 mr-1.5">({p.unit})</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {formatMoney(p.costPrice)}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-emerald-700">
                      {formatMoney(p.sellingPrice)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-bold text-[11px]">
                        +{marginPercent}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setBreakdownProduct(p)}
                        className="group flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition-all text-right cursor-pointer"
                        title="اضغط لمعرفة تفاصيل الرصيد في كل مستودع ومواقع الرفوف"
                      >
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-extrabold text-sm underline decoration-dotted underline-offset-2 ${
                                isLow ? 'text-rose-600' : 'text-slate-900 group-hover:text-emerald-700'
                              }`}
                            >
                              {p.stockQuantity}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">{p.unit || 'قطعة'}</span>
                            <WarehouseIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                          </div>
                          {p.shelfLocation && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5 font-medium">
                              <MapPin className="w-2.5 h-2.5 text-slate-400" />
                              رف: {p.shelfLocation}
                            </span>
                          )}
                        </div>
                        {isLow && (
                          <span
                            className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0"
                            title={`الحد الأدنى ${p.minStockAlert}`}
                          >
                            نقص مخزون
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatMoney(p.costPrice * p.stockQuantity)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedProduct(p);
                            setShowAdjustModal(true);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1 rounded-lg transition-all text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          title="حركة تسوية يدوية"
                        >
                          <ArrowDownUp className="w-3 h-3 text-slate-600" />
                          تسوية
                        </button>

                        <button
                          onClick={() => handleOpenEdit(p)}
                          disabled={!canEdit}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            canEdit
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                              : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          }`}
                          title={canEdit ? 'تعديل بيانات الصنف والأسعار' : 'ليس لديك صلاحية تعديل الأصناف'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(p)}
                          disabled={!canDelete}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            canDelete
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          }`}
                          title={canDelete ? 'حذف الصنف نهائياً' : 'ليس لديك صلاحية حذف الأصناف'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
      </>
      )}

      {/* Modal 1: Unified Quick Add Product */}
      <QuickAddModal
        isOpen={showQuickAddProduct}
        onClose={() => setShowQuickAddProduct(false)}
        initialTab="product"
      />

      {/* Modal 1.5: Comprehensive Edit Product */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">تعديل بيانات الصنف والأسعار</h3>
                  <p className="text-xs text-slate-500 mt-0.5">تحديث أسعار البيع والتكلفة وموقع التخزين وتفاصيل المنتج</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editHasExpiry && editBatches.length > 0) {
                  const invalid = editBatches.some((b) => !b.expiryDate && !b.batchNumber);
                  if (invalid) {
                    showAlert({
                      title: 'بيانات التشغيلة غير مكتملة',
                      message: 'يرجى إدخال تاريخ انتهاء الصلاحية ورقم الباتش لجميع التشغيلات المضافة.',
                      type: 'warning',
                      confirmText: 'فهمت',
                    });
                    return;
                  }
                }

                const matchedVendor = editSupplierId ? vendors.find((v) => v.id === editSupplierId) : undefined;
                const primaryBatch = editHasExpiry && editBatches.length > 0 ? (editBatches.find((b) => b.expiryDate) || editBatches[0]) : null;

                editProduct(editId, {
                  sku: editSku.trim(),
                  barcode: editBarcode.trim() || undefined,
                  name: editName.trim(),
                  category: editCategory.trim() || 'عام',
                  brand: editBrand.trim() || undefined,
                  originCountry: editOriginCountry.trim() || undefined,
                  unit: editUnit || 'قطعة (Pcs)',
                  description: editDescription.trim() || undefined,
                  costPrice: Number(editCostPrice) || 0,
                  sellingPrice: Number(editSellingPrice) || 0,
                  wholesalePrice: editWholesalePrice ? Number(editWholesalePrice) : undefined,
                  minSellingPrice: editMinSellingPrice ? Number(editMinSellingPrice) : undefined,
                  minStockAlert: Number(editMinStockAlert) || 5,
                  warehouseId: editWarehouseId || warehouses[0]?.id || 'wh-1',
                  governorate: editGovernorate || undefined,
                  shelfLocation: editShelfLocation.trim() || undefined,
                  supplierId: editSupplierId || undefined,
                  supplierName: matchedVendor?.name,
                  hasExpiry: editHasExpiry,
                  productionDate: editHasExpiry ? (primaryBatch?.productionDate || editProductionDate) : undefined,
                  expiryDate: editHasExpiry ? (primaryBatch?.expiryDate || editExpiryDate) : undefined,
                  batchNumber: editHasExpiry ? (primaryBatch?.batchNumber?.trim() || editBatchNumber.trim() || undefined) : undefined,
                  imageBase64: editImageBase64,
                });

                if (editHasExpiry && editBatches.length > 0) {
                  syncProductBatches(
                    editId,
                    editBatches.map((b) => ({
                      ...b,
                      productId: editId,
                      productName: editName.trim(),
                      sku: editSku.trim(),
                      costPrice: Number(editCostPrice) || 0,
                      sellingPrice: Number(editSellingPrice) || 0,
                    }))
                  );
                }

                setShowEditModal(false);
                setNotification({
                  message: `تم تحديث بيانات الصنف "${editName}" ومزامنة كافة تشغيلات الصنف بنجاح.`,
                  type: 'success',
                });
                setTimeout(() => setNotification(null), 4000);
              }}
              className="space-y-6 text-xs"
            >
              {/* القسم الأول: كود الصنف والباركود والاسم */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between text-slate-700 font-bold border-b border-slate-200/60 pb-2">
                  <span className="flex items-center gap-1.5 text-xs text-slate-900">
                    <Tag className="w-4 h-4 text-blue-600" />
                    البيانات التعريفية والرموز
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      كود الصنف (SKU) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={editSku}
                        onChange={(e) => setEditSku(e.target.value)}
                        className="flex-1 p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleGenerateSku(true)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                        title="توليد كود تلقائي"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        توليد
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      الباركود الدولي (Barcode)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Barcode className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={editBarcode}
                          onChange={(e) => setEditBarcode(e.target.value)}
                          className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleGenerateBarcode(true)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                        title="توليد باركود تلقائي"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        توليد
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    اسم الصنف بالكامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden bg-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">التصنيف / الفئة</label>
                    <input
                      type="text"
                      list="edit-categories-list"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden bg-white"
                    />
                    <datalist id="edit-categories-list">
                      {Array.from(new Set(products.map((p) => p.category))).map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الماركة / العلامة</label>
                    <input
                      type="text"
                      list="edit-brands-list"
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden bg-white"
                    />
                    <datalist id="edit-brands-list">
                      {PRODUCT_BRANDS.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">وحدة القياس</label>
                    <SearchableSelect
                      value={editUnit}
                      onChange={(val) => setEditUnit(val)}
                      options={PRODUCT_UNITS.map((u) => ({ value: u, label: u }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الوصف والمواصفات الفنية</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden bg-white resize-none"
                  />
                </div>
              </div>

              {/* القسم الثاني: الأسعار */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between text-slate-700 font-bold border-b border-slate-200/60 pb-2">
                  <span className="flex items-center gap-1.5 text-xs text-slate-900">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    هيكل الأسعار والتكاليف
                  </span>
                  {editCostPrice > 0 && editSellingPrice > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      هامش الربح: {(editSellingPrice - editCostPrice).toFixed(2)} {currency} (
                      {(((editSellingPrice - editCostPrice) / editCostPrice) * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">سعر التكلفة ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={editCostPrice}
                      onChange={(e) => setEditCostPrice(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-xs bg-white text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">سعر البيع ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={editSellingPrice}
                      onChange={(e) => setEditSellingPrice(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-blue-300 font-bold text-xs bg-blue-50/40 text-blue-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">سعر الجملة ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editWholesalePrice}
                      onChange={(e) => setEditWholesalePrice(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-xs bg-white text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">أقل سعر بيع ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editMinSellingPrice}
                      onChange={(e) => setEditMinSellingPrice(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-xs bg-white text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* القسم الثالث: المستودع والموقع */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between text-slate-700 font-bold border-b border-slate-200/60 pb-2">
                  <span className="flex items-center gap-1.5 text-xs text-slate-900">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    المستودع وموقع التخزين
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">المستودع الرئيسي</label>
                    <SearchableSelect
                      value={editWarehouseId}
                      onChange={(val) => setEditWarehouseId(val)}
                      placeholder="-- اختر المستودع --"
                      options={warehouses.map((w) => ({
                        value: w.id,
                        label: `${w.name} (${w.location})`,
                        badge: w.isDefault ? 'الرئيسي' : undefined,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">المحافظة / الإقليم</label>
                    <SearchableSelect
                      value={editGovernorate}
                      onChange={(val) => setEditGovernorate(val)}
                      placeholder="اختر المحافظة"
                      options={GOVERNORATES_DATA.map((g) => ({
                        value: g.name,
                        label: `${g.name} (${g.country})`,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">مكان الرف / الخانة</label>
                    <input
                      type="text"
                      placeholder="الرف A-01"
                      value={editShelfLocation}
                      onChange={(e) => setEditShelfLocation(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">حد الأمان وإعادة الطلب</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={editMinStockAlert}
                      onChange={(e) => setEditMinStockAlert(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-xs bg-white text-rose-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">المورد الافتراضي</label>
                    <SearchableSelect
                      value={editSupplierId}
                      onChange={(val) => setEditSupplierId(val)}
                      placeholder="-- اختر المورد الافتراضي --"
                      options={vendors.map((v) => ({
                        value: v.id,
                        label: `${v.name} (${v.company || 'مورد'})`,
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* القسم الرابع: الصلاحية والتشغيلة المتعددة */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-xs select-none">
                    <input
                      type="checkbox"
                      checked={editHasExpiry}
                      onChange={(e) => setEditHasExpiry(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>تفعيل تتبع تاريخ الصلاحية ورقم التشغيلة (Batch Tracking)</span>
                  </label>
                  {editHasExpiry && (
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      تتبع متعدد للباتشات ({editBatches.length} تشغيلة)
                    </span>
                  )}
                </div>

                {editHasExpiry && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/60 animate-in fade-in">
                    {/* شريط اختيار الباتشات المتاحة والمسجلة مسبقاً لهذا الصنف */}
                    {productBatches.filter((b) => b.productId === editId).length > 0 && (
                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            اختر من الباتشات والتشغيلات المتاحة والمسجلة حالياً للصنف:
                          </span>
                          <span className="text-[10px] text-blue-600 font-medium">
                            (انقر لتحديد أو إعادة إدراج التشغيلة في قائمة التعديل)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {productBatches
                            .filter((b) => b.productId === editId)
                            .map((b) => {
                              const bBadge = getBatchStatusBadge(b.expiryDate);
                              const isFocused = selectedBatchFocusId === b.id;
                              return (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedBatchFocusId(b.id);
                                    const exists = editBatches.some((eb) => eb.id === b.id || eb.batchNumber === b.batchNumber);
                                    if (!exists) {
                                      setEditBatches((prev) => [
                                        ...prev,
                                        {
                                          id: b.id,
                                          batchNumber: b.batchNumber,
                                          productionDate: b.productionDate || '',
                                          expiryDate: b.expiryDate,
                                          warehouseId: b.warehouseId,
                                          quantity: b.quantity,
                                          notes: b.notes,
                                        },
                                      ]);
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] border font-mono transition-all cursor-pointer ${
                                    isFocused
                                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                      : 'bg-white hover:bg-blue-100/70 text-slate-700 border-slate-200 shadow-2xs'
                                  }`}
                                >
                                  <span className="font-bold">{b.batchNumber}</span>
                                  <span className="text-[10px] opacity-80 font-sans">({b.warehouseName || 'مستودع'})</span>
                                  <span className="text-[10px] font-bold font-sans">[{b.quantity} ق]</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans ${bBadge.bg}`}>{b.expiryDate}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-600 font-medium">
                        قائمة التشغيلات واللوتات المرتبطة بهذا الصنف وتواريخ صلاحيتها:
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddBatchRow(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة تشغيلة / باتش إضافي</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
                      {editBatches.map((batch, idx) => {
                        const badge = getBatchStatusBadge(batch.expiryDate);
                        const isHighlighted = selectedBatchFocusId === batch.id;
                        return (
                          <div
                            key={batch.id || idx}
                            className={`p-3 bg-white rounded-xl border shadow-2xs space-y-2.5 transition-colors ${
                              isHighlighted ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center font-mono">
                                  #{idx + 1}
                                </span>
                                <span className="font-bold text-xs text-slate-800 font-mono">
                                  {batch.batchNumber || `تشغيلة ${idx + 1}`}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </div>
                              {editBatches.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBatchRow(idx, true)}
                                  className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                                  title="حذف هذه التشغيلة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف</span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                              <div className="sm:col-span-3">
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الباتش / التشغيلة</label>
                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    placeholder="BATCH-001"
                                    value={batch.batchNumber}
                                    onChange={(e) => handleBatchFieldChange(idx, 'batchNumber', e.target.value, true)}
                                    className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleGenerateBatchCode(idx, true)}
                                    title="توليد رقم تشغيلة تلقائي"
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold shrink-0 cursor-pointer"
                                  >
                                    ⚡
                                  </button>
                                </div>
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">المستودع</label>
                                <select
                                  value={batch.warehouseId}
                                  onChange={(e) => handleBatchFieldChange(idx, 'warehouseId', e.target.value, true)}
                                  className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                                >
                                  {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                      {w.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">تاريخ الإنتاج</label>
                                <input
                                  type="date"
                                  value={batch.productionDate}
                                  onChange={(e) => handleBatchFieldChange(idx, 'productionDate', e.target.value, true)}
                                  className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  تاريخ الصلاحية <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  required={editHasExpiry}
                                  value={batch.expiryDate}
                                  onChange={(e) => handleBatchFieldChange(idx, 'expiryDate', e.target.value, true)}
                                  className="w-full p-2 text-xs rounded-xl border border-rose-300 bg-rose-50/30 text-rose-900 font-bold"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">الكمية (قطعة)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={batch.quantity}
                                  onChange={(e) => handleBatchFieldChange(idx, 'quantity', Number(e.target.value), true)}
                                  className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Footer */}
                    <div className="flex flex-wrap items-center justify-between p-2.5 bg-blue-50/60 rounded-xl border border-blue-200/70 text-xs">
                      <div className="flex items-center gap-4 text-blue-950 font-medium">
                        <span>إجمالي التشغيلات: <strong>{editBatches.length}</strong></span>
                        <span>مجموع كميات التشغيلات: <strong>{editBatches.reduce((s, b) => s + (Number(b.quantity) || 0), 0)} قطعة</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* القسم الخامس: صورة الصنف */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <label className="block font-bold text-slate-900 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs">
                    <Camera className="w-4 h-4 text-blue-600" />
                    صورة المنتج
                  </span>
                  {editImageBase64 && (
                    <button
                      type="button"
                      onClick={() => setEditImageBase64(undefined)}
                      className="text-rose-600 hover:text-rose-700 font-bold text-[11px] cursor-pointer"
                    >
                      إزالة الصورة
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-4">
                  {editImageBase64 ? (
                    <img
                      src={editImageBase64}
                      alt="معاينة المنتج"
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-300 shadow-xs"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-7 h-7" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, true)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-bold cursor-pointer text-xs shadow-2xs transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      {editImageBase64 ? 'تغيير صورة الصنف' : 'رفع صورة من الجهاز'}
                    </button>
                    <div className="text-[11px] text-slate-400 mt-1">
                      يدعم ملفات JPG, PNG, WebP بحجم أقصى 2MB
                    </div>
                  </div>
                </div>
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Warehouse & Shelf Stock Breakdown */}
      {breakdownProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <WarehouseIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">{breakdownProduct.name}</h3>
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                      {breakdownProduct.sku}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    توزيع الرصيد الفعلي عبر المستودعات والفروع ومواقع الرفوف التخزينية
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBreakdownProduct(null);
                  setEditingShelfWarehouseId(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-1 overflow-y-auto space-y-4 my-3 flex-1 text-xs">
              {/* Product Summary Header Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block font-medium">إجمالي الرصيد بالمؤسسة</span>
                  <span className="text-base font-extrabold text-emerald-700 font-mono">
                    {breakdownProduct.stockQuantity} <span className="text-xs font-normal text-slate-600">{breakdownProduct.unit || 'قطعة'}</span>
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block font-medium">إجمالي قيمة التكلفة</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {formatMoney(breakdownProduct.costPrice * breakdownProduct.stockQuantity)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block font-medium">سعر التكلفة للوحدة</span>
                  <span className="text-base font-bold text-slate-800 font-mono">
                    {formatMoney(breakdownProduct.costPrice)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                  <span className="text-[11px] text-slate-500 block font-medium">حد الطلب الأدنى</span>
                  <span className="text-base font-bold text-rose-600 font-mono">
                    {breakdownProduct.minStockAlert} {breakdownProduct.unit || 'قطعة'}
                  </span>
                </div>
              </div>

              {/* Breakdown List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    أرصدة الصنف ومواقع الرفوف في كل مستودع:
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    عدد المستودعات المتاحة: {warehouses.length}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                      <tr>
                        <th className="py-2.5 px-3.5">المستودع / الفرع</th>
                        <th className="py-2.5 px-3.5">موقع الرف التخزيني</th>
                        <th className="py-2.5 px-3.5">الرصيد المتاح</th>
                        <th className="py-2.5 px-3.5">نسبة المخزون</th>
                        <th className="py-2.5 px-3.5">قيمة المخزون</th>
                        <th className="py-2.5 px-3.5 text-center">إجراء سريع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const breakdown = getProductWarehouseBreakdown
                          ? getProductWarehouseBreakdown(breakdownProduct.id)
                          : warehouses.map((w) => ({
                              warehouseId: w.id,
                              warehouseName: w.name,
                              warehouseCode: w.code,
                              governorate: w.governorate,
                              isDefault: w.isDefault,
                              quantity: w.id === breakdownProduct.warehouseId ? breakdownProduct.stockQuantity : 0,
                              shelfLocation: w.id === breakdownProduct.warehouseId ? breakdownProduct.shelfLocation : 'A-01',
                              lastUpdated: new Date().toISOString(),
                            }));

                        return breakdown.map((item) => {
                          const percent =
                            breakdownProduct.stockQuantity > 0
                              ? Math.round((item.quantity / breakdownProduct.stockQuantity) * 100)
                              : 0;
                          const isEditingShelf = editingShelfWarehouseId === item.warehouseId;

                          return (
                            <tr key={item.warehouseId} className="hover:bg-slate-50/70 transition-colors">
                              {/* Warehouse Name */}
                              <td className="py-3 px-3.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                    <Building2 className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      {item.warehouseName}
                                      {item.isDefault && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md font-bold">
                                          الرئيسي
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      كود: {item.warehouseCode || 'WH'} {item.governorate ? `| ${item.governorate}` : ''}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Shelf Location with Inline Edit */}
                              <td className="py-3 px-3.5">
                                {isEditingShelf ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      autoFocus
                                      value={shelfEditValue}
                                      onChange={(e) => setShelfEditValue(e.target.value)}
                                      placeholder="مثال: A-01, B-03"
                                      className="p-1 px-2 border border-emerald-500 rounded-lg text-xs font-mono font-bold w-24 bg-white outline-hidden ring-2 ring-emerald-500/20"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (updateProductShelfLocation) {
                                          updateProductShelfLocation(breakdownProduct.id, item.warehouseId, shelfEditValue);
                                        }
                                        setEditingShelfWarehouseId(null);
                                        setNotification({
                                          message: `تم تحديث موقع الرف للصنف في ${item.warehouseName} إلى: "${shelfEditValue}"`,
                                          type: 'success',
                                        });
                                        setTimeout(() => setNotification(null), 3000);
                                      }}
                                      className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
                                      title="حفظ موقع الرف"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingShelfWarehouseId(null)}
                                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                                      title="إلغاء"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                      <MapPin className="w-3 h-3 text-emerald-600" />
                                      {item.shelfLocation || 'غير محدد'}
                                    </span>
                                    {canEdit && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingShelfWarehouseId(item.warehouseId);
                                          setShelfEditValue(item.shelfLocation || '');
                                        }}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                        title="تعديل موقع الرف"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Available Stock */}
                              <td className="py-3 px-3.5">
                                <span
                                  className={`font-extrabold text-sm font-mono ${
                                    item.quantity > 0 ? 'text-emerald-700' : 'text-slate-400'
                                  }`}
                                >
                                  {item.quantity}{' '}
                                  <span className="text-[11px] font-normal text-slate-500">
                                    {breakdownProduct.unit || 'قطعة'}
                                  </span>
                                </span>
                              </td>

                              {/* Percentage Progress */}
                              <td className="py-3 px-3.5">
                                <div className="w-24">
                                  <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono font-bold">
                                    <span>{percent}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Inventory Value */}
                              <td className="py-3 px-3.5 font-bold font-mono text-slate-800">
                                {formatMoney(item.quantity * breakdownProduct.costPrice)}
                              </td>

                              {/* Quick Actions */}
                              <td className="py-3 px-3.5 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const prod = breakdownProduct;
                                      setBreakdownProduct(null);
                                      setSelectedProduct(prod);
                                      setAdjustWarehouseId(item.warehouseId);
                                      setShowAdjustModal(true);
                                    }}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                                    title="تسوية رصيد الصنف في هذا المستودع"
                                  >
                                    <ArrowDownUp className="w-3 h-3 text-slate-500" />
                                    تسوية
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setBreakdownProduct(null);
                                      setCurrentTab('transfers');
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                                    title="تحويل مخزني إلى مستودع آخر"
                                  >
                                    <ArrowRightLeft className="w-3 h-3" />
                                    تحويل
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setBreakdownProduct(null);
                  setEditingShelfWarehouseId(null);
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={() => {
                  setBreakdownProduct(null);
                  setCurrentTab('transfers');
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
                الانتقال إلى شاشة التحويلات المخزنية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Stock Adjustment */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">حركة تسوية مخزنية يدوية</h3>
                <p className="text-xs text-slate-500">{selectedProduct.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustWarehouseId('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-medium">الرصيد الإجمالي الحالي:</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono">
                  {selectedProduct.stockQuantity} {selectedProduct.unit}
                </span>
              </div>

              {/* Warehouse Selection for adjustment */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  المستودع المستهدف بالتسوية:
                </label>
                <select
                  value={adjustWarehouseId}
                  onChange={(e) => setAdjustWarehouseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800"
                >
                  <option value="">-- المستودع الافتراضي / الرئيسي للصنف --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.isDefault ? '(الرئيسي)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">نوع الحركة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('IN')}
                    className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      adjustType === 'IN'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    + إضافة رصيد (إدخال)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('OUT')}
                    className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      adjustType === 'OUT'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    - خصم رصيد (إخراج / هالك)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الكمية المراد تسويتها</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold text-sm text-center font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustModal(false);
                    setAdjustWarehouseId('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  تأكيد الحركة المخزنية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
