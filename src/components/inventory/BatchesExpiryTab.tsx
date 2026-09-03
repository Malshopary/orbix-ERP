import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { ProductBatch } from '../../types';
import { SearchableSelect } from '../SearchableSelect';
import {
  Calendar,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Edit3,
  Building,
  Package,
  X,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const BatchesExpiryTab: React.FC = () => {
  const {
    productBatches,
    products,
    warehouses,
    addProductBatch,
    updateProductBatch,
    deleteProductBatch,
    addScrapVoucher,
    canDeleteEntity,
    showAlert,
    showConfirm,
    hasPermission,
    currentUser,
    formatMoney,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'near_expiry' | 'expired'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ProductBatch | null>(null);

  // Form state
  const [batchNumber, setBatchNumber] = useState('');
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [notes, setNotes] = useState('');

  const canEdit = hasPermission('edit_products') || currentUser?.role === 'admin' || currentUser?.role === 'warehouse_keeper';

  const getProductName = (id: string) => {
    return products.find((p) => p.id === id)?.name || id;
  };

  const getWarehouseName = (id: string) => {
    return warehouses.find((w) => w.id === id)?.name || id;
  };

  const calculateDaysRemaining = (expDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expDate);
    exp.setHours(0, 0, 0, 0);
    const diffTime = exp.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getBatchStatusInfo = (batch: ProductBatch) => {
    const days = calculateDaysRemaining(batch.expiryDate);
    if (days < 0) {
      return {
        label: `منتهي الصلاحية (منذ ${Math.abs(days)} يوم)`,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: ShieldAlert,
        status: 'expired',
      };
    } else if (days <= 60) {
      return {
        label: `يقترب من الانتهاء (متبقي ${days} يوم)`,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: AlertTriangle,
        status: 'near_expiry',
      };
    } else {
      return {
        label: `ساري الصلاحية (متبقي ${days} يوم)`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
        status: 'valid',
      };
    }
  };

  const filteredBatches = productBatches.filter((b) => {
    const days = calculateDaysRemaining(b.expiryDate);
    const currentStatus = days < 0 ? 'expired' : days <= 60 ? 'near_expiry' : 'valid';

    if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const pName = getProductName(b.productId).toLowerCase();
      return (
        b.batchNumber.toLowerCase().includes(q) ||
        pName.includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const expiredCount = productBatches.filter((b) => calculateDaysRemaining(b.expiryDate) < 0).length;
  const nearExpiryCount = productBatches.filter((b) => {
    const d = calculateDaysRemaining(b.expiryDate);
    return d >= 0 && d <= 60;
  }).length;

  const handleSaveBatch = () => {
    if (!batchNumber.trim()) {
      showAlert('الرجاء إدخال رقم التشغيلة / اللوت.');
      return;
    }
    if (!productId) {
      showAlert('الرجاء اختيار الصنف المرتبط بالتشغيلة.');
      return;
    }
    if (!expiryDate) {
      showAlert('الرجاء تحديد تاريخ انتهاء الصلاحية.');
      return;
    }

    const days = calculateDaysRemaining(expiryDate);
    const status: ProductBatch['status'] = days < 0 ? 'expired' : days <= 60 ? 'near_expiry' : 'valid';

    if (editingBatch) {
      updateProductBatch(editingBatch.id, {
        batchNumber: batchNumber.trim(),
        productId,
        warehouseId,
        productionDate,
        expiryDate,
        quantity,
        status,
        notes,
      });
    } else {
      addProductBatch({
        batchNumber: batchNumber.trim(),
        productId,
        warehouseId,
        productionDate,
        expiryDate,
        quantity,
        initialQuantity: quantity,
        status,
        notes,
      });
    }

    setShowAddModal(false);
    setEditingBatch(null);
    setBatchNumber('');
    setProductId('');
    setExpiryDate('');
    setQuantity(10);
    setNotes('');
  };

  const handleConvertToScrap = (batch: ProductBatch) => {
    const prod = products.find((p) => p.id === batch.productId);
    if (!prod) return;

    showConfirm(
      `هل تريد إنشاء محضر إتلاف مباشر للتشغيلة المنتهية (${batch.batchNumber}) بعدد ${batch.quantity} ${prod.unit || 'قطعة'}؟`,
      () => {
        addScrapVoucher({
          voucherNumber: `SCR-EXP-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString().split('T')[0],
          warehouseId: batch.warehouseId || prod.warehouseId || warehouses[0]?.id || 'wh-1',
          reason: 'expired',
          items: [
            {
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              quantity: batch.quantity,
              costPrice: prod.costPrice,
              totalCost: batch.quantity * prod.costPrice,
              reason: `انتهاء صلاحية تشغيلة رقم ${batch.batchNumber} (تاريخ ${batch.expiryDate})`,
              unit: prod.unit || 'قطعة',
            },
          ],
          totalLossValue: batch.quantity * prod.costPrice,
          notes: `تم الإتلاف التلقائي لانتهاء صلاحية تشغيلة رقم ${batch.batchNumber}`,
        });

        // Zero out batch quantity
        updateProductBatch(batch.id, { quantity: 0, status: 'expired' });
      },
      'تأكيد إهلاك التشغيلة المنتهية',
      { confirmText: 'إنشاء محضر إتلاف وخصم الكمية', type: 'error' }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            إدارة التشغيلات وتواريخ الصلاحية (Batches & Expiry Dates)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تتبع أرقام اللوت والتشغيلات، تنبيهات قرب انتهاء الصلاحية، وإدارة السحب والإتلاف بدقة
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setEditingBatch(null);
              setBatchNumber(`LOT-${Date.now().toString().slice(-5)}`);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            تسجيل تشغيلة جديدة
          </button>
        )}
      </div>

      {/* Alert Banners for expired/near-expiry items */}
      {(expiredCount > 0 || nearExpiryCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {expiredCount > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-extrabold text-rose-900">
                    يوجد {expiredCount} تشغيلة منتهية الصلاحية!
                  </h4>
                  <p className="text-[11px] text-rose-700">يجب استبعادها وإصدار محاضر إتلاف فوري</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusFilter('expired')}
                className="text-xs font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 px-3 py-1 rounded-lg transition-colors cursor-pointer"
              >
                عرض المنتهي
              </button>
            </div>
          )}

          {nearExpiryCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-extrabold text-amber-900">
                    يوجد {nearExpiryCount} تشغيلة تقترب من انتهاء الصلاحية
                  </h4>
                  <p className="text-[11px] text-amber-700">خلال 60 يوماً أو أقل - يفضل بيعها بعروض ترويجية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusFilter('near_expiry')}
                className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg transition-colors cursor-pointer"
              >
                عرض النواقص
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم التشغيلة أو اسم الصنف..."
            className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:col-span-5 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'valid', label: 'ساري' },
            { id: 'near_expiry', label: 'يقترب من الانتهاء' },
            { id: 'expired', label: 'منتهي الصلاحية' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredBatches.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">لا توجد تشغيلات مسجلة</h3>
            <p className="text-xs text-slate-400 mt-1">
              سجل أرقام التشغيلات واللوت لتتبع الصلاحية بدقة ومطابقة معايير الجودة
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold">
                  <th className="py-3 px-4">رقم التشغيلة (Batch/Lot)</th>
                  <th className="py-3 px-4">الصنف</th>
                  <th className="py-3 px-4">المستودع</th>
                  <th className="py-3 px-4">تاريخ الإنتاج</th>
                  <th className="py-3 px-4">تاريخ الانتهاء</th>
                  <th className="py-3 px-4">الرصيد المتبقي</th>
                  <th className="py-3 px-4">حالة الصلاحية</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredBatches.map((batch) => {
                  const statusInfo = getBatchStatusInfo(batch);
                  const Icon = statusInfo.icon;
                  const isExpired = statusInfo.status === 'expired';

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {batch.batchNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {getProductName(batch.productId)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {getWarehouseName(batch.warehouseId || '')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{batch.productionDate || '-'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{batch.expiryDate}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-extrabold text-emerald-700">
                          {batch.quantity}
                        </span>
                        {batch.initialQuantity && (
                          <span className="text-slate-400 text-[10px] mr-1">
                            / {batch.initialQuantity}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 border px-2.5 py-1 rounded-full text-xs font-bold ${statusInfo.badgeClass}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isExpired && batch.quantity > 0 && canEdit && (
                            <button
                              type="button"
                              onClick={() => handleConvertToScrap(batch)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="إتلاف وإعدام هذه التشغيلة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              إتلاف
                            </button>
                          )}

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBatch(batch);
                                setBatchNumber(batch.batchNumber);
                                setProductId(batch.productId);
                                setWarehouseId(batch.warehouseId || warehouses[0]?.id || '');
                                setProductionDate(batch.productionDate || '');
                                setExpiryDate(batch.expiryDate);
                                setQuantity(batch.quantity);
                                setNotes(batch.notes || '');
                                setShowAddModal(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="تعديل التشغيلة"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                showConfirm(`هل أنت متأكد من حذف التشغيلة ${batch.batchNumber}؟`, () => {
                                  deleteProductBatch(batch.id);
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Add / Edit Batch */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                {editingBatch ? 'تعديل بيانات التشغيلة' : 'تسجيل تشغيلة ولوت جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم التشغيلة / اللوت (Batch No.)</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="مثال: LOT-2026-09A"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الصنف المرتبط</label>
                <SearchableSelect
                  value={productId}
                  onChange={(val) => setProductId(val)}
                  placeholder="-- اختر الصنف --"
                  searchPlaceholder="ابحث باسم الصنف أو SKU..."
                  options={products.map((p) => ({
                    value: p.id,
                    label: `${p.sku} | ${p.name}`,
                    subLabel: `المتاح: ${p.stockQuantity} ${p.unit || 'قطعة'}`,
                  }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المستودع</label>
                  <SearchableSelect
                    value={warehouseId}
                    onChange={(val) => setWarehouseId(val)}
                    placeholder="-- اختر المستودع --"
                    searchPlaceholder="ابحث باسم المستودع..."
                    options={warehouses.map((w) => ({
                      value: w.id,
                      label: w.name,
                      badge: w.isDefault ? 'الرئيسي' : undefined,
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">الكمية</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ الإنتاج</label>
                  <input
                    type="date"
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ انتهاء الصلاحية</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2 bg-white border border-rose-300 rounded-lg font-mono font-bold text-rose-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات التشغيلة</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات الجودة، رقم المورد، شروط التخزين..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveBatch}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                حفظ التشغيلة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
