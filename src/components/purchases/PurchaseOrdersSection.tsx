import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { PurchaseOrder, PurchaseOrderItem } from '../../types';
import { SearchableSelect } from '../SearchableSelect';
import { ProductSelectSearch } from '../ProductSelectSearch';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { PrintHeader } from '../PrintHeader';
import { PrintFooter } from '../PrintFooter';
import {
  ShoppingCart,
  PlusCircle,
  Search,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Warehouse,
  Printer,
  Trash2,
  Edit3,
  ArrowRight,
  PackageCheck,
  FileText,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';

interface PurchaseOrdersSectionProps {
  onConvertToGrn?: (po: PurchaseOrder) => void;
  onConvertToBill?: (po: PurchaseOrder) => void;
}

export const PurchaseOrdersSection: React.FC<PurchaseOrdersSectionProps> = ({
  onConvertToGrn,
  onConvertToBill,
}) => {
  const {
    purchaseOrders = [],
    vendors = [],
    products = [],
    warehouses = [],
    companyProfile,
    formatMoney,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    showAlert,
    showConfirm,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);
  const [printPo, setPrintPo] = useState<PurchaseOrder | null>(null);

  // New PO Form state
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [targetWarehouseId, setTargetWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('السداد خلال 30 يوم من تاريخ استلام محضر الفحص الفني والمطابقة الثلاثية');
  const [poStatus, setPoStatus] = useState<PurchaseOrder['status']>('approved');

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchSearch =
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.notes && po.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || po.status === statusFilter;
      const matchVendor = vendorFilter === 'all' || po.vendorId === vendorFilter;

      return matchSearch && matchStatus && matchVendor;
    });
  }, [purchaseOrders, searchQuery, statusFilter, vendorFilter]);

  // Calculations for form
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  const vatTotal = useMemo(() => {
    return Math.round(subtotal * ((companyProfile.defaultVatRate || 14) / 100));
  }, [subtotal, companyProfile.defaultVatRate]);

  const grandTotal = subtotal + vatTotal;

  // Add Item to PO
  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const existingIndex = items.findIndex((i) => i.productId === productId);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setItems(updated);
    } else {
      const unitPrice = prod.costPrice || prod.purchasePrice || 100;
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: 1,
          unitPrice,
          total: unitPrice,
          receivedQuantity: 0,
        },
      ]);
    }
  };

  const handleUpdateItem = (index: number, field: 'quantity' | 'unitPrice', val: number) => {
    const updated = [...items];
    const safeVal = Math.max(0, val);
    updated[index][field] = safeVal;
    updated[index].total = updated[index].quantity * updated[index].unitPrice;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleOpenCreate = () => {
    setEditingPo(null);
    setSelectedVendorId(vendors[0]?.id || '');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setExpectedDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setTargetWarehouseId(warehouses[0]?.id || 'wh-1');
    setItems([]);
    setNotes('');
    setTerms('السداد خلال 30 يوم من تاريخ استلام محضر الفحص الفني والمطابقة الثلاثية');
    setPoStatus('approved');
    setShowCreateModal(true);
  };

  const handleOpenEdit = (po: PurchaseOrder) => {
    setEditingPo(po);
    setSelectedVendorId(po.vendorId);
    setOrderDate(po.date);
    setExpectedDate(po.expectedDeliveryDate || '');
    setTargetWarehouseId(po.warehouseId || warehouses[0]?.id || 'wh-1');
    setItems([...po.items]);
    setNotes(po.notes || '');
    setTerms(po.terms || '');
    setPoStatus(po.status);
    setShowCreateModal(true);
  };

  const handleSavePo = () => {
    if (!selectedVendorId) {
      showAlert({
        title: 'تنبيه',
        message: 'يرجى اختيار المورد أولاً',
        type: 'warning',
      });
      return;
    }

    if (items.length === 0) {
      showAlert({
        title: 'تنبيه',
        message: 'يرجى إضافة صنف واحد على الأقل لأمر الشراء',
        type: 'warning',
      });
      return;
    }

    const vendor = vendors.find((v) => v.id === selectedVendorId);
    const wh = warehouses.find((w) => w.id === targetWarehouseId);

    if (editingPo) {
      updatePurchaseOrder(editingPo.id, {
        vendorId: selectedVendorId,
        vendorName: vendor?.name || editingPo.vendorName,
        date: orderDate,
        expectedDeliveryDate: expectedDate,
        warehouseId: targetWarehouseId,
        warehouseName: wh?.name || editingPo.warehouseName,
        items,
        subtotal,
        vatTotal,
        grandTotal,
        status: poStatus,
        notes,
        terms,
      });
      showAlert({
        title: 'تم التحديث',
        message: `تم تحديث أمر الشراء ${editingPo.poNumber} بنجاح`,
        type: 'success',
      });
    } else {
      const created = addPurchaseOrder({
        vendorId: selectedVendorId,
        vendorName: vendor?.name || 'مورد معتمد',
        date: orderDate,
        expectedDeliveryDate: expectedDate,
        warehouseId: targetWarehouseId,
        warehouseName: wh?.name || warehouses[0]?.name,
        items,
        subtotal,
        vatTotal,
        grandTotal,
        status: poStatus,
        notes,
        terms,
      });
      showAlert({
        title: 'تم بنجاح',
        message: `تم إصدار أمر الشراء رقم ${created.poNumber} بنجاح`,
        type: 'success',
      });
    }

    setShowCreateModal(false);
  };

  const handleDelete = (po: PurchaseOrder) => {
    showConfirm({
      title: 'حذف أمر الشراء',
      message: `هل أنت متأكد من حذف أمر الشراء رقم ${po.poNumber}؟`,
      type: 'danger',
      confirmText: 'نعم، احذف',
      cancelText: 'إلغاء',
      onConfirm: () => {
        deletePurchaseOrder(po.id);
      },
    });
  };

  // Status helper
  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">مسودة</span>;
      case 'approved':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">معتمد وبانتظار التوريد</span>;
      case 'partially_received':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">مستلم جزئياً</span>;
      case 'received':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">مستلم بالكامل</span>;
      case 'billed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">تمت الفوترة</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">ملغي</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">أوامر الشراء والتوريد</h2>
            <p className="text-xs text-slate-500">
              إدارة طلبات الشراء الصادرة للموردين والرقابة على التسليم والمطابقة المخزنية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إنشاء أمر شراء جديد</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">إجمالي الأوامر الصادرة</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{purchaseOrders.length}</div>
            <div className="text-xs text-slate-500 mt-1">أمر شراء مسجل بالنظام</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">قيد التوريد والتسليم</span>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-600">
              {purchaseOrders.filter((p) => p.status === 'approved' || p.status === 'partially_received').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">أوامر معتمدة بانتظار البضاعة</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">مستلمة ومفوترة</span>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">
              {purchaseOrders.filter((p) => p.status === 'received' || p.status === 'billed').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">تم إدخالها المخازن</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">إجمالي الالتزامات المالية</span>
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-600">
              {formatMoney(purchaseOrders.reduce((sum, p) => sum + p.grandTotal, 0))}
            </div>
            <div className="text-xs text-slate-500 mt-1">إجمالي قيمة أوامر الشراء</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الأمر أو المورد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
          >
            <option value="all">جميع الحالات</option>
            <option value="draft">مسودة</option>
            <option value="approved">معتمد وبانتظار التوريد</option>
            <option value="partially_received">مستلم جزئياً</option>
            <option value="received">مستلم بالكامل</option>
            <option value="billed">تمت الفوترة</option>
            <option value="cancelled">ملغي</option>
          </select>

          <select
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
          >
            <option value="all">جميع الموردين</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Orders */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">رقم الأمر</th>
                <th className="py-3.5 px-4">المورد</th>
                <th className="py-3.5 px-4">تاريخ الطلب</th>
                <th className="py-3.5 px-4">المستودع المستهدف</th>
                <th className="py-3.5 px-4">عدد الأصناف</th>
                <th className="py-3.5 px-4">إجمالي القيمة</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    لا توجد أوامر شراء مطابقة لمعايير البحث
                  </td>
                </tr>
              ) : (
                filteredOrders.map((po) => {
                  const totalItemsCount = po.items.reduce((sum, i) => sum + i.quantity, 0);
                  const totalReceivedCount = po.items.reduce((sum, i) => sum + (i.receivedQuantity || 0), 0);

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {po.poNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {po.vendorName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{po.date}</div>
                        {po.expectedDeliveryDate && (
                          <div className="text-xs text-slate-400">تسليم: {po.expectedDeliveryDate}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                          <span>{po.warehouseName || 'المستودع الرئيسي'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-medium">
                          {po.items.length} أصناف ({totalItemsCount} قطعة)
                        </div>
                        <div className="text-xs text-slate-400">
                          مستلم: {totalReceivedCount} من {totalItemsCount}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {formatMoney(po.grandTotal)}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(po.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Convert to GRN shortcut */}
                          {po.status !== 'received' && po.status !== 'cancelled' && (
                            <button
                              onClick={() => onConvertToGrn && onConvertToGrn(po)}
                              title="توليد إذن استلام مخزني"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <PackageCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Convert to Bill shortcut */}
                          {po.status !== 'billed' && po.status !== 'cancelled' && (
                            <button
                              onClick={() => onConvertToBill && onConvertToBill(po)}
                              title="تحويل إلى فاتورة مشتريات"
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* Print button */}
                          <button
                            onClick={() => setPrintPo(po)}
                            title="طباعة أمر الشراء"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(po)}
                            title="تعديل"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(po)}
                            title="حذف"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Purchase Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {editingPo ? `تعديل أمر الشراء ${editingPo.poNumber}` : 'إصدار أمر شراء وتوريد جديد'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    تحديد مواصفات الأصناف والمورد والأسعار والشروط التعاقدية
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    المورد <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={vendors.map((v) => ({
                      value: v.id,
                      label: v.name,
                      subLabel: `رصيد: ${formatMoney(v.currentBalance)}`,
                    }))}
                    value={selectedVendorId}
                    onChange={(val) => setSelectedVendorId(val)}
                    placeholder="اختر المورد..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    تاريخ أمر الشراء <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    تاريخ التسليم المتوقع
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    المستودع الوجهة <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={targetWarehouseId}
                    onChange={(e) => setTargetWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} {wh.isDefault ? '(الرئيسي)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    حالة الأمر
                  </label>
                  <select
                    value={poStatus}
                    onChange={(e) => setPoStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="draft">مسودة</option>
                    <option value="approved">معتمد وبانتظار التوريد</option>
                    <option value="partially_received">مستلم جزئياً</option>
                    <option value="received">مستلم بالكامل</option>
                    <option value="billed">تمت الفوترة</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">جدول الأصناف المطلوبة</h4>
                  <span className="text-xs text-slate-500">{items.length} أصناف مضافة</span>
                </div>

                {/* Add product select */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <ProductSelectSearch
                    products={products}
                    onSelect={(p) => handleAddItem(p.id)}
                    placeholder="ابحث عن صنف بالاسم أو الباركود أو الرمز لإضافته لأمر الشراء..."
                  />
                </div>

                {/* Items Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">م</th>
                        <th className="py-2.5 px-3">الصنف</th>
                        <th className="py-2.5 px-3 w-28">الكمية المطلوبة</th>
                        <th className="py-2.5 px-3 w-32">السعر التقديري</th>
                        <th className="py-2.5 px-3 w-32">الإجمالي</th>
                        <th className="py-2.5 px-3 text-center w-12">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            لا توجد أصناف مضافة حالياً. اختر من القائمة أعلاه.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">
                              {item.productName}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2 py-1 text-center font-bold rounded border border-slate-200 bg-white"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={item.unitPrice}
                                onChange={(e) =>
                                  handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-2 py-1 text-left font-mono font-bold rounded border border-slate-200 bg-white"
                              />
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">
                              {formatMoney(item.total)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
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

                {/* Totals Summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-full md:w-80 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>المجموع قبل الضريبة:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatMoney(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ضريبة القيمة المضافة ({companyProfile.defaultVatRate || 14}%):</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatMoney(vatTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>الإجمالي الكلي:</span>
                      <span className="text-blue-600 font-mono">
                        {formatMoney(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    الشروط والأحكام ومواصفات التسليم
                  </label>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    placeholder="شروط التسليم ومواعيد الفحص الفني..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ملاحظات إدارية
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                    placeholder="أي تعليمات أو ملاحظات إضافية..."
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSavePo}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>{editingPo ? 'حفظ التعديلات' : 'إصدار أمر الشراء'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printPo && (
        <PrintPreviewModal
          isOpen={true}
          onClose={() => setPrintPo(null)}
          title={`أمر شراء - ${printPo.poNumber}`}
        >
          <div className="p-8 bg-white text-slate-900 text-sm space-y-6 max-w-3xl mx-auto" dir="rtl">
            <PrintHeader title="أمر شراء وتوريد بضائع" documentNumber={printPo.poNumber} />

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 font-bold block mb-1">بيانات المورد:</span>
                <div className="font-bold text-sm text-slate-800">{printPo.vendorName}</div>
                <div>تاريخ الطلب: {printPo.date}</div>
                <div>تاريخ الاستلام المتوقع: {printPo.expectedDeliveryDate || '-'}</div>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-1">تفاصيل التوريد:</span>
                <div>المستودع: {printPo.warehouseName || 'المستودع الرئيسي'}</div>
                <div>الحالة: {printPo.status}</div>
                <div>شروط الدفع: {printPo.terms || 'سداد آجل'}</div>
              </div>
            </div>

            <table className="w-full text-right text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="py-2 px-3 border-b">م</th>
                  <th className="py-2 px-3 border-b">الصنف والمواصفات</th>
                  <th className="py-2 px-3 border-b text-center">الكمية</th>
                  <th className="py-2 px-3 border-b text-left">سعر الوحدة</th>
                  <th className="py-2 px-3 border-b text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {printPo.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3">{i + 1}</td>
                    <td className="py-2 px-3 font-medium">{item.productName}</td>
                    <td className="py-2 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-2 px-3 text-left font-mono">{formatMoney(item.unitPrice)}</td>
                    <td className="py-2 px-3 text-left font-mono font-bold">{formatMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>المجموع:</span>
                  <span className="font-mono">{formatMoney(printPo.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ضريبة القيمة المضافة:</span>
                  <span className="font-mono">{formatMoney(printPo.vatTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t">
                  <span>المجموع الإجمالي:</span>
                  <span className="font-mono text-blue-600">{formatMoney(printPo.grandTotal)}</span>
                </div>
              </div>
            </div>

            {printPo.notes && (
              <div className="p-3 bg-slate-50 rounded text-xs">
                <span className="font-bold block mb-1">ملاحظات:</span>
                <p>{printPo.notes}</p>
              </div>
            )}

            <PrintFooter />
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
