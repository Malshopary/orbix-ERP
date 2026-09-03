import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { Warehouse } from '../../types';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  Building,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  Package,
  Layers,
  Star,
  ShieldCheck,
} from 'lucide-react';

export const WarehousesManagementTab: React.FC = () => {
  const {
    warehouses,
    products,
    addWarehouse,
    editWarehouse,
    deleteWarehouse,
    canDeleteEntity,
    showAlert,
    showConfirm,
    hasPermission,
    currentUser,
    formatMoney,
    getProductQuantityInWarehouse,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [keeperName, setKeeperName] = useState('');
  const [keeperPhone, setKeeperPhone] = useState('');
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');

  const canEdit = hasPermission('edit_products') || currentUser?.role === 'admin';

  const filteredWarehouses = warehouses.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      (w.code && w.code.toLowerCase().includes(q)) ||
      (w.location && w.location.toLowerCase().includes(q)) ||
      (w.keeperName && w.keeperName.toLowerCase().includes(q))
    );
  });

  const getWarehouseStats = (whId: string) => {
    let productsCount = 0;
    let totalQuantity = 0;
    let totalValue = 0;

    products.forEach((p) => {
      const qtyInWh = getProductQuantityInWarehouse ? getProductQuantityInWarehouse(p.id, whId) : 0;
      if (qtyInWh > 0) {
        productsCount += 1;
        totalQuantity += qtyInWh;
        totalValue += qtyInWh * p.costPrice;
      }
    });

    return {
      productsCount,
      totalQuantity,
      totalValue,
    };
  };

  const handleOpenAddModal = () => {
    setEditingWarehouse(null);
    setCode(`WH-${(warehouses.length + 1).toString().padStart(2, '0')}`);
    setName('');
    setLocation('');
    setKeeperName('');
    setKeeperPhone('');
    setCapacity(undefined);
    setIsDefault(warehouses.length === 0);
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (w: Warehouse) => {
    setEditingWarehouse(w);
    setCode(w.code || '');
    setName(w.name);
    setLocation(w.location || '');
    setKeeperName(w.keeperName || '');
    setKeeperPhone(w.keeperPhone || '');
    setCapacity(w.capacity);
    setIsDefault(w.isDefault || false);
    setNotes(w.notes || '');
    setShowAddModal(true);
  };

  const handleSaveWarehouse = () => {
    if (!name.trim()) {
      showAlert('الرجاء إدخال اسم المستودع أو الفرع.');
      return;
    }

    if (editingWarehouse) {
      editWarehouse(editingWarehouse.id, {
        code: code.trim(),
        name: name.trim(),
        location: location.trim(),
        keeperName: keeperName.trim(),
        keeperPhone: keeperPhone.trim(),
        capacity: capacity ? Number(capacity) : undefined,
        isDefault,
        notes: notes.trim(),
      });
    } else {
      addWarehouse({
        code: code.trim() || `WH-${Date.now().toString().slice(-3)}`,
        name: name.trim(),
        location: location.trim(),
        keeperName: keeperName.trim(),
        keeperPhone: keeperPhone.trim(),
        capacity: capacity ? Number(capacity) : undefined,
        isDefault,
        notes: notes.trim(),
      });
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5 text-emerald-600" />
            إدارة المستودعات والفروع والمواقع التخزينية
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تعريف الفروع والمخازن الرئيسية والفرعية، تحديد أمناء المخازن وتوزيع أرصدة البضائع
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            إضافة مستودع / فرع جديد
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث باسم المستودع أو الكود أو الموقع أو أمين المخزن..."
          className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWarehouses.map((w) => {
          const stats = getWarehouseStats(w.id);

          return (
            <div
              key={w.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-emerald-300 transition-all space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                        {w.name}
                        {w.isDefault && (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                            الرئيسي
                          </span>
                        )}
                      </h3>
                      {w.code && (
                        <span className="text-[11px] font-mono text-slate-400 font-bold">
                          كود: {w.code}
                        </span>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(w)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const check = canDeleteEntity('warehouse', w.id);
                          if (!check.canDelete) {
                            showAlert(check.reason || 'لا يمكن حذف هذا المستودع.');
                            return;
                          }
                          showConfirm(`هل أنت متأكد من حذف المستودع (${w.name})؟`, () => {
                            deleteWarehouse(w.id);
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Warehouse details */}
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  {w.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{w.location}</span>
                    </div>
                  )}
                  {w.keeperName && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>الأمين: <strong className="text-slate-800">{w.keeperName}</strong></span>
                    </div>
                  )}
                  {w.keeperPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{w.keeperPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warehouse Inventory Stats Footer */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs pt-2">
                <div>
                  <span className="text-[11px] text-slate-500 block">إجمالي الكمية:</span>
                  <span className="font-mono font-extrabold text-slate-900">
                    {stats.totalQuantity} قطعة
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">قيمة المخزون:</span>
                  <span className="font-mono font-extrabold text-emerald-700">
                    {formatMoney(stats.totalValue)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Add / Edit Warehouse */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <WarehouseIcon className="w-4 h-4 text-emerald-400" />
                {editingWarehouse ? 'تعديل بيانات المستودع' : 'إضافة مستودع / فرع جديد'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">كود المستودع</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="مثال: WH-01"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم المستودع / الفرع *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: المستودع المركزي - القاهرة"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">الموقع / العنوان التفصيلي</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: المنطقة الصناعية - السادس من أكتوبر"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم أمين المستودع</label>
                  <input
                    type="text"
                    value={keeperName}
                    onChange={(e) => setKeeperName(e.target.value)}
                    placeholder="اسم المسؤول"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم هاتف الأمين</label>
                  <input
                    type="tel"
                    value={keeperPhone}
                    onChange={(e) => setKeeperPhone(e.target.value)}
                    placeholder="010XXXXXXXX"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">السعة الاستيعابية القصوى (اختياري)</label>
                <input
                  type="number"
                  value={capacity || ''}
                  onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="مثال: 50000"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="font-bold text-slate-800">تعيين كمستودع افتراضي للعمليات والبيع المباشر</span>
              </label>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                onClick={handleSaveWarehouse}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                حفظ المستودع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
