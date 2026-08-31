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
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    products,
    warehouses,
    currency,
    formatMoney,
    formatDualMoney,
    secondaryCurrency,
    canDeleteEntity,
    addProduct,
    editProduct,
    deleteProduct,
    updateProductStock,
    hasPermission,
    activeSubTab,
    setActiveSubTab,
    showAlert,
    showConfirm,
  } = useErp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'warning' | 'success' } | null>(null);

  React.useEffect(() => {
    if (activeSubTab === 'low_stock') {
      setOnlyLowStock(true);
    } else if (activeSubTab === 'all') {
      setOnlyLowStock(false);
    } else if (activeSubTab === 'adjust') {
      setShowAdjustModal(true);
      if (products.length > 0) setSelectedProduct(products[0]);
    }
  }, [activeSubTab, products]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');

  // New Product Form
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('إلكترونيات');
  const [unit, setUnit] = useState('قطعة');
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [minStockAlert, setMinStockAlert] = useState(5);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [barcode, setBarcode] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);

  // Edit Product Form
  const [editId, setEditId] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUnit, setEditUnit] = useState('قطعة');
  const [editCostPrice, setEditCostPrice] = useState(0);
  const [editSellingPrice, setEditSellingPrice] = useState(0);
  const [editMinStockAlert, setEditMinStockAlert] = useState(5);
  const [editBarcode, setEditBarcode] = useState('');
  const [editWarehouseId, setEditWarehouseId] = useState('');
  const [editImageBase64, setEditImageBase64] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = hasPermission('edit_products');
  const canDelete = hasPermission('delete_products');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
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
      if (isEdit) {
        setEditImageBase64(base64);
      } else {
        setImageBase64(base64);
      }
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
    setEditCategory(p.category);
    setEditUnit(p.unit);
    setEditCostPrice(p.costPrice);
    setEditSellingPrice(p.sellingPrice);
    setEditMinStockAlert(p.minStockAlert);
    setEditBarcode(p.barcode || '');
    setEditWarehouseId(p.warehouseId);
    setEditImageBase64(p.imageBase64);
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

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name || costPrice <= 0 || sellingPrice <= 0) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى ملء جميع الحقول الإلزامية وتحديد الأسعار بدقة.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    addProduct({
      sku,
      barcode,
      name,
      category,
      unit,
      costPrice,
      sellingPrice,
      stockQuantity,
      minStockAlert,
      warehouseId,
      imageBase64,
    });
    setShowAddModal(false);
    setNotification({
      message: `تمت إضافة الصنف "${name}" بنجاح إلى قاعدة بيانات المستودع.`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
    // Reset
    setSku('');
    setName('');
    setCostPrice(0);
    setSellingPrice(0);
    setStockQuantity(0);
    setBarcode('');
    setImageBase64(undefined);
  };

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const delta = adjustType === 'IN' ? Math.abs(adjustQty) : -Math.abs(adjustQty);
    updateProductStock(selectedProduct.id, delta);
    const newQty = selectedProduct.stockQuantity + delta;
    setShowAdjustModal(false);

    if (newQty <= selectedProduct.minStockAlert) {
      setNotification({
        message: `تنبيه فوري: أصبح رصيد الصنف "${selectedProduct.name}" (${newQty} ${selectedProduct.unit}) أقل من أو مساوياً لحد الطلب الأدنى (${selectedProduct.minStockAlert})!`,
        type: 'warning',
      });
    } else {
      setNotification({
        message: `تم تحديث رصيد الصنف "${selectedProduct.name}" بنجاح. الرصيد الجديد: ${newQty} ${selectedProduct.unit}.`,
        type: 'success',
      });
    }
    setTimeout(() => setNotification(null), 5000);
    setSelectedProduct(null);
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
            onClick={() => setShowAddModal(true)}
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
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium cursor-pointer"
          >
            <option value="all">جميع التصنيفات</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
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
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-extrabold text-sm ${
                            isLow ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {p.stockQuantity}
                        </span>
                        {isLow && (
                          <span
                            className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                            title={`الحد الأدنى ${p.minStockAlert}`}
                          >
                            نقص مخزون
                          </span>
                        )}
                      </div>
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

      {/* Modal 1: Add New Product */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">إضافة بطاقة صنف جديدة للمخزن</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">كود الصنف (SKU)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: PR-LTP-09"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم الباركود (Barcode)</label>
                  <input
                    type="text"
                    placeholder="مثال: 628100..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم الصنف بالكامل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: لوحة مفاتيح لاسلكية ميكانيكية"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">التصنيف</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ملحقات أجهزة"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">وحدة القياس</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="قطعة">قطعة (Piece)</option>
                    <option value="علبة">علبة (Box)</option>
                    <option value="كرتونة">كرتونة (Carton)</option>
                    <option value="كيلوجرام">كيلوجرام (KG)</option>
                    <option value="متر">متر (Meter)</option>
                    <option value="ترخيص">ترخيص (License)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">سعر التكلفة (Cost Price)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">سعر البيع (Selling Price)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رصيد أول المدة الافتتاحي</label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity || ''}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">حد الأمان وإعادة الطلب</label>
                  <input
                    type="number"
                    min="1"
                    value={minStockAlert || ''}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-rose-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المستودع الرئيسي</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Image Upload */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    صورة المنتج (اختياري)
                  </span>
                  {imageBase64 && (
                    <button
                      type="button"
                      onClick={() => setImageBase64(undefined)}
                      className="text-rose-600 hover:text-rose-700 font-bold text-[11px]"
                    >
                      إزالة الصورة
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  {imageBase64 ? (
                    <img
                      src={imageBase64}
                      alt="معاينة المنتج"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-200/70 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e, false)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer text-xs shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      {imageBase64 ? 'تغيير صورة الصنف' : 'رفع صورة من الجهاز'}
                    </button>
                    <div className="text-[10px] text-slate-400 mt-1">
                      يدعم PNG, JPG, WebP بحجم أقصى 2MB
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  حفظ الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1.5: Edit Product */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                تعديل بيانات الصنف والأسعار
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editProduct(editId, {
                  sku: editSku,
                  barcode: editBarcode,
                  name: editName,
                  category: editCategory,
                  unit: editUnit,
                  costPrice: editCostPrice,
                  sellingPrice: editSellingPrice,
                  minStockAlert: editMinStockAlert,
                  warehouseId: editWarehouseId,
                  imageBase64: editImageBase64,
                });
                setShowEditModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">كود الصنف (SKU)</label>
                  <input
                    type="text"
                    required
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">رقم الباركود (Barcode)</label>
                  <input
                    type="text"
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم الصنف بالكامل</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">التصنيف</label>
                  <input
                    type="text"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">وحدة القياس</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="قطعة">قطعة (Piece)</option>
                    <option value="علبة">علبة (Box)</option>
                    <option value="كرتونة">كرتونة (Carton)</option>
                    <option value="كيلوجرام">كيلوجرام (KG)</option>
                    <option value="متر">متر (Meter)</option>
                    <option value="ترخيص">ترخيص (License)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">سعر التكلفة (Cost)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editCostPrice}
                    onChange={(e) => setEditCostPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">سعر البيع (Selling)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editSellingPrice}
                    onChange={(e) => setEditSellingPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">حد الأمان ونواقص المخزون</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editMinStockAlert}
                    onChange={(e) => setEditMinStockAlert(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المستودع الرئيسي</label>
                  <select
                    value={editWarehouseId}
                    onChange={(e) => setEditWarehouseId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.location})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Product Image Upload for Edit */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    صورة المنتج
                  </span>
                  {editImageBase64 && (
                    <button
                      type="button"
                      onClick={() => setEditImageBase64(undefined)}
                      className="text-rose-600 hover:text-rose-700 font-bold text-[11px]"
                    >
                      إزالة الصورة
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  {editImageBase64 ? (
                    <img
                      src={editImageBase64}
                      alt="معاينة المنتج"
                      className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-200/70 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer text-xs shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      {editImageBase64 ? 'تغيير صورة الصنف' : 'رفع صورة من الجهاز'}
                    </button>
                    <div className="text-[10px] text-slate-400 mt-1">
                      يدعم PNG, JPG, WebP بحجم أقصى 2MB
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
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
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-600">الرصيد المتاح حالياً:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {selectedProduct.stockQuantity} {selectedProduct.unit}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">نوع الحركة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('IN')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      adjustType === 'IN'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    + إضافة رصيد (إدخال)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('OUT')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      adjustType === 'OUT'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700'
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold text-sm text-center"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs"
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
