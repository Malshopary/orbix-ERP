import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { StockTransfer, StockTransferItem } from '../../types';
import { SearchableSelect } from '../SearchableSelect';
import {
  ArrowRightLeft,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  FileText,
  Building,
  Calendar,
  Layers,
  Trash2,
  Printer,
  ChevronDown,
  AlertTriangle,
  X,
  User,
  ShieldCheck,
} from 'lucide-react';

export const WarehouseTransfersTab: React.FC = () => {
  const {
    stockTransfers,
    warehouses,
    products,
    addStockTransfer,
    updateStockTransferStatus,
    deleteStockTransfer,
    canDeleteEntity,
    showAlert,
    showConfirm,
    hasPermission,
    formatMoney,
    currentUser,
    getProductQuantityInWarehouse,
  } = useErp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'pending' | 'in_transit' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewTransfer, setViewTransfer] = useState<StockTransfer | null>(null);

  // Form State
  const [transferNumber, setTransferNumber] = useState(`TR-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromWarehouseId, setFromWarehouseId] = useState(warehouses[0]?.id || '');
  const [toWarehouseId, setToWarehouseId] = useState(warehouses[1]?.id || warehouses[0]?.id || '');
  const [initialStatus, setInitialStatus] = useState<StockTransfer['status']>('completed');
  const [transferNotes, setTransferNotes] = useState('');
  const [items, setItems] = useState<StockTransferItem[]>([]);

  // Item row input
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  const canEdit = hasPermission('edit_products') || currentUser?.role === 'admin' || currentUser?.role === 'warehouse_keeper';

  const filteredTransfers = stockTransfers.filter((tr) => {
    if (statusFilter !== 'all' && tr.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fromWh = warehouses.find((w) => w.id === tr.fromWarehouseId)?.name.toLowerCase() || '';
      const toWh = warehouses.find((w) => w.id === tr.toWarehouseId)?.name.toLowerCase() || '';
      return (
        tr.transferNumber.toLowerCase().includes(q) ||
        fromWh.includes(q) ||
        toWh.includes(q) ||
        (tr.notes && tr.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getWarehouseName = (id: string) => {
    return warehouses.find((w) => w.id === id)?.name || id;
  };

  const getStatusBadge = (status: StockTransfer['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            مكتمل (تم التحويل)
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-full font-bold">
            <Truck className="w-3.5 h-3.5 animate-pulse" />
            في الطريق / قيد الشحن
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-bold">
            <Clock className="w-3.5 h-3.5" />
            قيد الانتظار
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2.5 py-1 rounded-full font-bold">
            <XCircle className="w-3.5 h-3.5" />
            ملغي
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-1 rounded-full font-bold">
            مسودة
          </span>
        );
    }
  };

  const handleStatusChange = (transferId: string, newStatus: StockTransfer['status']) => {
    const statusLabels: Record<StockTransfer['status'], string> = {
      draft: 'مسودة',
      pending: 'قيد الانتظار',
      in_transit: 'في الطريق / قيد الشحن',
      completed: 'مكتمل (تم الاستلام والخصم)',
      cancelled: 'ملغي (استرجاع الأرصدة)',
    };

    showConfirm(`هل تريد تغيير حالة التحويل إلى: "${statusLabels[newStatus]}"؟`, () => {
      updateStockTransferStatus(transferId, newStatus);
      if (viewTransfer && viewTransfer.id === transferId) {
        setViewTransfer({ ...viewTransfer, status: newStatus });
      }
    });
  };

  const handleAddItem = () => {
    if (!selectedProductId) {
      showAlert('الرجاء اختيار الصنف المراد تحويله.');
      return;
    }
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (itemQty <= 0) {
      showAlert('الكمية يجب أن تكون أكبر من الصفر.');
      return;
    }

    const availableInSource = getProductQuantityInWarehouse ? getProductQuantityInWarehouse(product.id, fromWarehouseId) : product.stockQuantity;

    if (itemQty > availableInSource) {
      showAlert(`الكمية المطلوبة (${itemQty}) تتجاوز الرصيد المتاح للصنف في مستودع المصدر المحدد (${availableInSource} ${product.unit || 'قطعة'}).`);
      return;
    }

    const existingIdx = items.findIndex((i) => i.productId === selectedProductId);
    if (existingIdx >= 0) {
      const updated = [...items];
      if (updated[existingIdx].quantity + itemQty > availableInSource) {
        showAlert(`إجمالي الكمية المضافة تتجاوز الرصيد المتاح بالمستودع (${availableInSource}).`);
        return;
      }
      updated[existingIdx].quantity += itemQty;
      setItems(updated);
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: itemQty,
          unit: product.unit || 'قطعة',
          costPrice: product.costPrice,
          notes: itemNotes,
        },
      ]);
    }

    setSelectedProductId('');
    setItemQty(1);
    setItemNotes('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTransfer = (saveStatus: StockTransfer['status'] = initialStatus) => {
    if (fromWarehouseId === toWarehouseId) {
      showAlert('لا يمكن التحويل من وإلى نفس المستودع. الرجاء اختيار مستودع وجهة مختلف.');
      return;
    }
    if (items.length === 0) {
      showAlert('الرجاء إضافة صنف واحد على الأقل للتحويل.');
      return;
    }

    addStockTransfer({
      transferNumber: transferNumber.trim() || `TR-${Date.now().toString().slice(-6)}`,
      date,
      fromWarehouseId,
      toWarehouseId,
      items,
      notes: transferNotes,
      status: saveStatus,
    });

    setShowAddModal(false);
    setItems([]);
    setTransferNotes('');
    setTransferNumber(`TR-${Date.now().toString().slice(-6)}`);
  };

  const handlePrintTransfer = (tr: StockTransfer) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const fromName = getWarehouseName(tr.fromWarehouseId);
    const toName = getWarehouseName(tr.toWarehouseId);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>إذن تحويل مخزني - ${tr.transferNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; direction: rtl; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; margin: 0; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 13px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; text-align: center; font-size: 13px; }
          .sign-box { border-top: 1px dashed #94a3b8; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">إذن تحويل ونقل مخزني بين المستودعات</div>
          <div style="font-size: 14px; margin-top: 4px; color: #64748b;">رقم الإذن: ${tr.transferNumber}</div>
        </div>
        <div class="meta-grid">
          <div><strong>تاريخ التحويل:</strong> ${tr.date}</div>
          <div><strong>المستودع المصدر:</strong> ${fromName}</div>
          <div><strong>المستودع الوجهة:</strong> ${toName}</div>
          <div><strong>الحالة:</strong> ${tr.status === 'completed' ? 'تم التنفيذ' : tr.status}</div>
          <div><strong>المسؤول:</strong> ${tr.createdBy || 'المدير'}</div>
          <div><strong>الملاحظات:</strong> ${tr.notes || 'لا يوجد'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>كود الصنف</th>
              <th>اسم الصنف</th>
              <th>الكمية المحولة</th>
              <th>الوحدة</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${tr.items
              .map(
                (item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.sku}</td>
                <td>${item.productName}</td>
                <td style="font-weight: bold;">${item.quantity}</td>
                <td>${item.unit}</td>
                <td>${item.notes || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <div class="signatures">
          <div class="sign-box">أمين المستودع المصدر<br><br>.........................</div>
          <div class="sign-box">مسؤول الشحن والنقل<br><br>.........................</div>
          <div class="sign-box">أمين المستودع المستلم<br><br>.........................</div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
            تحويلات المخزون بين المستودعات والفروع
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            إدارة أذون نقل البضائع بين الفروع والمخازن مع التحديث التلقائي الفوري للأرصدة
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setTransferNumber(`TR-${Date.now().toString().slice(-6)}`);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            إنشاء إذن تحويل جديد
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم التحويل أو اسم المستودع أو الملاحظات..."
            className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="sm:col-span-6 flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'completed', label: 'مكتمل' },
            { id: 'in_transit', label: 'في الطريق' },
            { id: 'pending', label: 'قيد الانتظار' },
            { id: 'cancelled', label: 'ملغي' },
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

      {/* Transfers Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredTransfers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ArrowRightLeft className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">لا توجد أذون تحويل مخزني مطابقة</h3>
            <p className="text-xs text-slate-400 mt-1">
              يمكنك إنشاء إذن تحويل جديد لنقل الأصناف بين المخازن بسهولة
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold">
                  <th className="py-3 px-4">رقم التحويل</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">من مستودع (المصدر)</th>
                  <th className="py-3 px-4">إلى مستودع (الوجهة)</th>
                  <th className="py-3 px-4">عدد الأصناف</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTransfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {tr.transferNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{tr.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Building className="w-3.5 h-3.5 text-rose-500" />
                        {getWarehouseName(tr.fromWarehouseId)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                        <Building className="w-3.5 h-3.5 text-emerald-600" />
                        {getWarehouseName(tr.toWarehouseId)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                        <Layers className="w-3 h-3 text-slate-500" />
                        {tr.items.reduce((acc, i) => acc + i.quantity, 0)} قطعة ({tr.items.length} صنف)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {canEdit ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={tr.status}
                            onChange={(e) => handleStatusChange(tr.id, e.target.value as StockTransfer['status'])}
                            className={`text-xs font-bold py-1 px-2.5 rounded-lg border cursor-pointer outline-hidden transition-all ${
                              tr.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : tr.status === 'in_transit'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : tr.status === 'pending'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : tr.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            <option value="draft">مسودة</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="in_transit">في الطريق (قيد الشحن)</option>
                            <option value="completed">مكتمل (تم الاستلام والخصم)</option>
                            <option value="cancelled">ملغي (استرجاع الأرصدة)</option>
                          </select>
                        </div>
                      ) : (
                        getStatusBadge(tr.status)
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View details */}
                        <button
                          type="button"
                          onClick={() => setViewTransfer(tr)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="عرض التفاصيل والأصناف"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Print */}
                        <button
                          type="button"
                          onClick={() => handlePrintTransfer(tr)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="طباعة إذن التحويل"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Status update actions */}
                        {tr.status === 'pending' && canEdit && (
                          <button
                            type="button"
                            onClick={() => updateStockTransferStatus(tr.id, 'in_transit')}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="بدء الشحن (في الطريق)"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}

                        {tr.status === 'in_transit' && canEdit && (
                          <button
                            type="button"
                            onClick={() => updateStockTransferStatus(tr.id, 'completed')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="تأكيد الاستلام وإتمام التحويل"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete */}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              const check = canDeleteEntity('stock_transfer', tr.id);
                              if (!check.canDelete) {
                                showAlert(check.reason || 'لا يمكن حذف هذا التحويل.');
                                return;
                              }
                              showConfirm(`هل أنت متأكد من حذف إذن التحويل ${tr.transferNumber}؟`, () => {
                                deleteStockTransfer(tr.id);
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف الإذن"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Add New Stock Transfer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">إنشاء إذن تحويل مخزني جديد</h3>
                  <p className="text-[11px] text-slate-400">تحويل بضائع بين المستودعات مع تحديث الأرصدة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Main transfer metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم الإذن</label>
                  <input
                    type="text"
                    value={transferNumber}
                    onChange={(e) => setTransferNumber(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">تاريخ التحويل</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">المسؤول / أمين المخزن</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.name || 'المدير العام'}
                    className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500"
                  />
                </div>
              </div>

              {/* Source & Destination Warehouses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-200/80">
                  <label className="block text-rose-900 font-extrabold mb-1.5 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-rose-600" />
                    من مستودع (المصدر)
                  </label>
                  <SearchableSelect
                    value={fromWarehouseId}
                    onChange={(val) => setFromWarehouseId(val)}
                    placeholder="-- اختر مستودع المصدر --"
                    searchPlaceholder="ابحث عن اسم المستودع..."
                    options={warehouses.map((w) => ({
                      value: w.id,
                      label: w.name,
                      badge: w.isDefault ? 'الرئيسي' : undefined,
                      badgeColor: 'bg-rose-100 text-rose-800',
                    }))}
                  />
                </div>

                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80">
                  <label className="block text-emerald-900 font-extrabold mb-1.5 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-600" />
                    إلى مستودع (الوجهة)
                  </label>
                  <SearchableSelect
                    value={toWarehouseId}
                    onChange={(val) => setToWarehouseId(val)}
                    placeholder="-- اختر مستودع الوجهة --"
                    searchPlaceholder="ابحث عن اسم المستودع..."
                    options={warehouses.map((w) => ({
                      value: w.id,
                      label: w.name,
                      badge: w.isDefault ? 'الرئيسي' : undefined,
                      badgeColor: 'bg-emerald-100 text-emerald-800',
                    }))}
                  />
                </div>
              </div>

              {/* Add Item Row */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  إضافة أصناف إلى إذن التحويل
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <SearchableSelect
                      value={selectedProductId}
                      onChange={(val) => setSelectedProductId(val)}
                      placeholder="-- اختر الصنف المراد تحويله --"
                      searchPlaceholder="ابحث باسم الصنف، الكود SKU، أو الباركود..."
                      options={products.map((p) => {
                        const avail = getProductQuantityInWarehouse ? getProductQuantityInWarehouse(p.id, fromWarehouseId) : p.stockQuantity;
                        return {
                          value: p.id,
                          label: `${p.sku} | ${p.name}`,
                          subLabel: `المتاح بمستودع المصدر: ${avail} ${p.unit || 'قطعة'}`,
                          badge: `${formatMoney(p.sellingPrice || p.costPrice)}`,
                          badgeColor: avail > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                        };
                      })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      placeholder="الكمية"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      placeholder="ملاحظات الصنف..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full h-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center font-bold cursor-pointer transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold">
                    <tr>
                      <th className="py-2 px-3">الكود</th>
                      <th className="py-2 px-3">اسم الصنف</th>
                      <th className="py-2 px-3">الكمية</th>
                      <th className="py-2 px-3">الوحدة</th>
                      <th className="py-2 px-3">ملاحظات</th>
                      <th className="py-2 px-3 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          لم يتم إضافة أي أصناف للإذن بعد
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold">{item.sku}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{item.productName}</td>
                          <td className="py-2 px-3 font-mono font-extrabold text-emerald-700">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{item.unit}</td>
                          <td className="py-2 px-3 text-slate-500">{item.notes || '-'}</td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded-md"
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

              {/* Initial Status Selector */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block text-slate-700 font-bold mb-1.5">حالة الإذن المبدئية عند الحفظ:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'completed', label: 'مكتمل (تنفيذ وخصم فوري)', desc: 'خصم من المصدر وإضافة للوجهة' },
                    { id: 'in_transit', label: 'في الطريق (قيد الشحن)', desc: 'خصم من المصدر كبضاعة بالطريق' },
                    { id: 'pending', label: 'قيد الانتظار', desc: 'حفظ بدون تحريك أرصدة' },
                    { id: 'draft', label: 'مسودة', desc: 'مسودة قيد الإعداد' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setInitialStatus(st.id as any)}
                      className={`p-2.5 rounded-xl text-right border transition-all cursor-pointer ${
                        initialStatus === st.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold">{st.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transfer Notes */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">ملاحظات إضافية / سبب التحويل</label>
                <textarea
                  rows={2}
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="أدخل أي تفاصيل أو أسباب لعملية النقل..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                إلغاء
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveTransfer('draft')}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs cursor-pointer"
                >
                  حفظ كمسودة
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveTransfer('completed')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  حفظ وتنفيذ التحويل فوراً
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Transfer Details */}
      {viewTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold">تفاصيل إذن التحويل: {viewTransfer.transferNumber}</h3>
                <p className="text-[11px] text-slate-400">تاريخ: {viewTransfer.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewTransfer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-bold block">من مستودع (المصدر):</span>
                  <span className="font-extrabold text-slate-900">{getWarehouseName(viewTransfer.fromWarehouseId)}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">إلى مستودع (الوجهة):</span>
                  <span className="font-extrabold text-emerald-700">{getWarehouseName(viewTransfer.toWarehouseId)}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">الحالة الحالية:</span>
                  <div className="mt-1">{getStatusBadge(viewTransfer.status)}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">الملاحظات:</span>
                  <span className="text-slate-700">{viewTransfer.notes || 'لا توجد ملاحظات'}</span>
                </div>
              </div>

              {/* Status change actions inside View Modal */}
              {canEdit && (
                <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-slate-700 font-extrabold block text-xs">تغيير حالة إذن التحويل:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'draft', label: 'مسودة', color: 'bg-slate-200 hover:bg-slate-300 text-slate-800' },
                      { id: 'pending', label: 'قيد الانتظار', color: 'bg-amber-100 hover:bg-amber-200 text-amber-900' },
                      { id: 'in_transit', label: 'في الطريق', color: 'bg-blue-100 hover:bg-blue-200 text-blue-900' },
                      { id: 'completed', label: 'مكتمل (تنفيذ)', color: 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold' },
                      { id: 'cancelled', label: 'إلغاء الإذن', color: 'bg-rose-100 hover:bg-rose-200 text-rose-900' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={viewTransfer.status === s.id}
                        onClick={() => handleStatusChange(viewTransfer.id, s.id as any)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                          viewTransfer.status === s.id
                            ? 'ring-2 ring-slate-900 shadow-xs opacity-90 cursor-default'
                            : `${s.color} hover:shadow-xs`
                        }`}
                      >
                        {s.label}
                        {viewTransfer.status === s.id && ' (الحالي)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">كود الصنف</th>
                      <th className="py-2 px-3">اسم الصنف</th>
                      <th className="py-2 px-3">الكمية</th>
                      <th className="py-2 px-3">الوحدة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewTransfer.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold">{item.sku}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{item.productName}</td>
                        <td className="py-2 px-3 font-bold font-mono text-emerald-700">{item.quantity}</td>
                        <td className="py-2 px-3 text-slate-500">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewTransfer(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => handlePrintTransfer(viewTransfer)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                طباعة إذن التحويل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
