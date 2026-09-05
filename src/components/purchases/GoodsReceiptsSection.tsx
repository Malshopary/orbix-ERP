import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { GoodsReceiptNote, GoodsReceiptItem, PurchaseOrder } from '../../types';
import { SearchableSelect } from '../SearchableSelect';
import { ProductSelectSearch } from '../ProductSelectSearch';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { PrintHeader } from '../PrintHeader';
import { PrintFooter } from '../PrintFooter';
import {
  PackageCheck,
  PlusCircle,
  Search,
  Building,
  Calendar,
  Warehouse,
  Printer,
  Trash2,
  FileCheck2,
  AlertTriangle,
  X,
  Check,
  Layers,
  FileText,
} from 'lucide-react';

interface GoodsReceiptsSectionProps {
  initialPoForGrn?: PurchaseOrder | null;
  onClearInitialPo?: () => void;
}

export const GoodsReceiptsSection: React.FC<GoodsReceiptsSectionProps> = ({
  initialPoForGrn,
  onClearInitialPo,
}) => {
  const {
    goodsReceipts = [],
    purchaseOrders = [],
    vendors = [],
    products = [],
    warehouses = [],
    formatMoney,
    addGoodsReceipt,
    deleteGoodsReceipt,
    showAlert,
    showConfirm,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [printGrn, setPrintGrn] = useState<GoodsReceiptNote | null>(null);

  // Form state
  const [selectedPoId, setSelectedPoId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetWarehouseId, setTargetWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [inspectorName, setInspectorName] = useState('أمين المستودع - الفحص الفني');
  const [items, setItems] = useState<GoodsReceiptItem[]>([]);
  const [notes, setNotes] = useState('');

  // Handle auto open if passed from PO
  React.useEffect(() => {
    if (initialPoForGrn) {
      setSelectedPoId(initialPoForGrn.id);
      setSelectedVendorId(initialPoForGrn.vendorId);
      setTargetWarehouseId(initialPoForGrn.warehouseId || warehouses[0]?.id || 'wh-1');
      setReceiptDate(new Date().toISOString().split('T')[0]);
      setDeliveryNoteNumber(`BL-${initialPoForGrn.poNumber}`);

      const grnItems: GoodsReceiptItem[] = initialPoForGrn.items.map((i) => {
        const remainingToReceive = Math.max(0, i.quantity - (i.receivedQuantity || 0));
        return {
          productId: i.productId,
          productName: i.productName,
          orderedQuantity: i.quantity,
          receivedQuantity: remainingToReceive,
          acceptedQuantity: remainingToReceive,
          rejectedQuantity: 0,
          unitPrice: i.unitPrice,
          batchNumber: `BATCH-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };
      });

      setItems(grnItems);
      setShowCreateModal(true);
      if (onClearInitialPo) onClearInitialPo();
    }
  }, [initialPoForGrn]);

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return goodsReceipts.filter((grn) => {
      const matchSearch =
        grn.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        grn.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (grn.poNumber && grn.poNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (grn.deliveryNoteNumber && grn.deliveryNoteNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchVendor = vendorFilter === 'all' || grn.vendorId === vendorFilter;
      const matchWarehouse = warehouseFilter === 'all' || grn.warehouseId === warehouseFilter;

      return matchSearch && matchVendor && matchWarehouse;
    });
  }, [goodsReceipts, searchQuery, vendorFilter, warehouseFilter]);

  // When PO changes in form, populate items
  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    if (!poId) return;

    const po = purchaseOrders.find((p) => p.id === poId);
    if (po) {
      setSelectedVendorId(po.vendorId);
      if (po.warehouseId) setTargetWarehouseId(po.warehouseId);
      setDeliveryNoteNumber(`DN-${po.poNumber}`);

      const grnItems: GoodsReceiptItem[] = po.items.map((i) => {
        const remaining = Math.max(0, i.quantity - (i.receivedQuantity || 0));
        return {
          productId: i.productId,
          productName: i.productName,
          orderedQuantity: i.quantity,
          receivedQuantity: remaining,
          acceptedQuantity: remaining,
          rejectedQuantity: 0,
          unitPrice: i.unitPrice,
          batchNumber: `BATCH-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };
      });
      setItems(grnItems);
    }
  };

  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === productId
            ? { ...i, receivedQuantity: i.receivedQuantity + 1, acceptedQuantity: i.acceptedQuantity + 1 }
            : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          orderedQuantity: 1,
          receivedQuantity: 1,
          acceptedQuantity: 1,
          rejectedQuantity: 0,
          unitPrice: prod.costPrice || 100,
          batchNumber: `BATCH-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
      ]);
    }
  };

  const handleUpdateItem = (
    index: number,
    field: keyof GoodsReceiptItem,
    val: any
  ) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: val };

    if (field === 'receivedQuantity') {
      const num = Math.max(0, Number(val) || 0);
      current.receivedQuantity = num;
      current.acceptedQuantity = Math.max(0, num - (current.rejectedQuantity || 0));
    } else if (field === 'rejectedQuantity') {
      const rej = Math.max(0, Number(val) || 0);
      current.rejectedQuantity = rej;
      current.acceptedQuantity = Math.max(0, (current.receivedQuantity || 0) - rej);
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleOpenCreate = () => {
    setSelectedPoId('');
    setSelectedVendorId(vendors[0]?.id || '');
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setTargetWarehouseId(warehouses[0]?.id || 'wh-1');
    setDeliveryNoteNumber('');
    setInspectorName('أمين المستودع - الفحص الفني');
    setItems([]);
    setNotes('');
    setShowCreateModal(true);
  };

  const handleSaveGrn = () => {
    if (!selectedVendorId) {
      showAlert({ title: 'تنبيه', message: 'يرجى تحديد المورد', type: 'warning' });
      return;
    }
    if (items.length === 0) {
      showAlert({ title: 'تنبيه', message: 'يرجى إضافة صنف مستلم واحد على الأقل', type: 'warning' });
      return;
    }

    const vendor = vendors.find((v) => v.id === selectedVendorId);
    const wh = warehouses.find((w) => w.id === targetWarehouseId);
    const po = purchaseOrders.find((p) => p.id === selectedPoId);

    const created = addGoodsReceipt({
      poId: selectedPoId || undefined,
      poNumber: po?.poNumber || undefined,
      vendorId: selectedVendorId,
      vendorName: vendor?.name || 'مورد معتمد',
      date: receiptDate,
      warehouseId: targetWarehouseId,
      warehouseName: wh?.name || warehouses[0]?.name,
      deliveryNoteNumber: deliveryNoteNumber || undefined,
      inspectorName,
      items,
      notes,
    });

    showAlert({
      title: 'تم حفظ الاستلام المخزني',
      message: `تم إصدار إذن استلام رقم ${created.grnNumber} وإدخال البضاعة المقبولة إلى المخزن بنجاح`,
      type: 'success',
    });

    setShowCreateModal(false);
  };

  const handleDelete = (grn: GoodsReceiptNote) => {
    showConfirm({
      title: 'حذف إذن الاستلام',
      message: `هل أنت متأكد من حذف إذن الاستلام رقم ${grn.grnNumber}؟ سيتم خصم الكميات المستلمة من أرصدة المخازن.`,
      type: 'danger',
      confirmText: 'نعم، احذف',
      cancelText: 'إلغاء',
      onConfirm: () => {
        deleteGoodsReceipt(grn.id);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">أذونات الاستلام المخزني (GRN)</h2>
            <p className="text-xs text-slate-500">
              تسجيل استلام البضائع وفحص المطابقة الفنية وإصدار أرقام التشغيلات وتحديث المخزون
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إذن استلام مخزني جديد</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">أذونات الاستلام الصادرة</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{goodsReceipts.length}</div>
            <div className="text-xs text-slate-500 mt-1">محضر استلام وفحص معتمد</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">إجمالي الأصناف المستلمة</span>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">
              {goodsReceipts.reduce(
                (sum, grn) => sum + grn.items.reduce((s, i) => s + i.acceptedQuantity, 0),
                0
              )}{' '}
              قطعة
            </div>
            <div className="text-xs text-slate-500 mt-1">كميات مقبولة تم إدخالها للمخزن</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">الكميات المرفوضة بعد الفحص</span>
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">
              {goodsReceipts.reduce(
                (sum, grn) => sum + grn.items.reduce((s, i) => s + (i.rejectedQuantity || 0), 0),
                0
              )}{' '}
              قطعة
            </div>
            <div className="text-xs text-slate-500 mt-1">بضائع تالفة أو غير مطابقة لمواصفات الأمر</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الإذن أو المورد أو أمر الشراء..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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

          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
          >
            <option value="all">جميع المستودعات</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">رقم الإذن</th>
                <th className="py-3.5 px-4">أمر الشراء المرتبط</th>
                <th className="py-3.5 px-4">المورد</th>
                <th className="py-3.5 px-4">تاريخ الاستلام</th>
                <th className="py-3.5 px-4">المستودع المستلم</th>
                <th className="py-3.5 px-4">فحص الأصناف والكميات</th>
                <th className="py-3.5 px-4">مسؤول الفحص</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <PackageCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    لا توجد أذونات استلام مخزني مسجلة
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((grn) => {
                  const acceptedSum = grn.items.reduce((s, i) => s + i.acceptedQuantity, 0);
                  const rejectedSum = grn.items.reduce((s, i) => s + (i.rejectedQuantity || 0), 0);

                  return (
                    <tr
                      key={grn.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        {grn.grnNumber}
                      </td>
                      <td className="py-3 px-4">
                        {grn.poNumber ? (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold">
                            {grn.poNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">توريد مباشر</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {grn.vendorName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{grn.date}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                          <span>{grn.warehouseName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                            مقبول: {acceptedSum}
                          </span>
                          {rejectedSum > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold">
                              مرفوض: {rejectedSum}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {grn.items.length} أصناف
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {grn.inspectorName || 'أمين المخزن'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setPrintGrn(grn)}
                            title="طباعة إذن الاستلام ومحضر الفحص"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(grn)}
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

      {/* Create GRN Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">إصدار إذن استلام مخزني (GRN)</h3>
                  <p className="text-xs text-slate-500">
                    إثبات الاستلام الفعلي وإجراء الفحص الفني وإدخال الأرصدة إلى المستودع
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

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Linked PO & Main Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ربط بأمر شراء معتمد (اختياري)
                  </label>
                  <select
                    value={selectedPoId}
                    onChange={(e) => handlePoChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">-- بدون أمر شراء (توريد مباشر) --</option>
                    {purchaseOrders
                      .filter((p) => p.status !== 'cancelled' && p.status !== 'received')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.poNumber} - {p.vendorName} ({p.items.length} أصناف)
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    المورد <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    options={vendors.map((v) => ({
                      value: v.id,
                      label: v.name,
                    }))}
                    value={selectedVendorId}
                    onChange={(val) => setSelectedVendorId(val)}
                    placeholder="اختر المورد..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    تاريخ الاستلام <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    المستودع المستلم <span className="text-rose-500">*</span>
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
                    رقم بوليصة / إذن تسليم المورد
                  </label>
                  <input
                    type="text"
                    value={deliveryNoteNumber}
                    onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                    placeholder="مثال: DN-99482"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    مسؤول الفحص المخزني
                  </label>
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => setInspectorName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    الأصناف المستلمة ومحضر الفحص
                  </h4>
                  <span className="text-xs text-slate-500">{items.length} أصناف مدرجة</span>
                </div>

                {/* Add product select if not from PO */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <ProductSelectSearch
                    products={products}
                    onSelect={(p) => handleAddItem(p.id)}
                    placeholder="إضافة صنف للاستلام المخزني..."
                  />
                </div>

                {/* Items Table with Inspection Controls */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">الصنف</th>
                        <th className="py-2.5 px-3 w-20 text-center">المطلوب</th>
                        <th className="py-2.5 px-3 w-24 text-center">المستلم</th>
                        <th className="py-2.5 px-3 w-24 text-center text-emerald-600">
                          المقبول
                        </th>
                        <th className="py-2.5 px-3 w-20 text-center text-rose-600">
                          المرفوض
                        </th>
                        <th className="py-2.5 px-3 w-28">رقم التشغيلة</th>
                        <th className="py-2.5 px-3 w-28">الصلاحية</th>
                        <th className="py-2.5 px-3 text-center w-10">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            اختر أمر شراء أو أضف أصنافاً لبدء محضر الاستلام والفحص.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-medium text-slate-900">
                              {item.productName}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500 font-mono">
                              {item.orderedQuantity || '-'}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={item.receivedQuantity}
                                onChange={(e) =>
                                  handleUpdateItem(idx, 'receivedQuantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-1.5 py-1 text-center font-bold rounded border border-slate-200 bg-white"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={item.acceptedQuantity}
                                onChange={(e) =>
                                  handleUpdateItem(idx, 'acceptedQuantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-1.5 py-1 text-center font-bold text-emerald-600 rounded border border-emerald-300 bg-emerald-50/40"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min="0"
                                value={item.rejectedQuantity || 0}
                                onChange={(e) =>
                                  handleUpdateItem(idx, 'rejectedQuantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-1.5 py-1 text-center font-bold text-rose-600 rounded border border-rose-300 bg-rose-50/40"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.batchNumber || ''}
                                onChange={(e) => handleUpdateItem(idx, 'batchNumber', e.target.value)}
                                placeholder="رقم التشغيلة"
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="date"
                                value={item.expiryDate || ''}
                                onChange={(e) => handleUpdateItem(idx, 'expiryDate', e.target.value)}
                                className="w-full px-1 py-1 text-xs rounded border border-slate-200 bg-white"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-rose-500 hover:text-rose-700"
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

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ملاحظات الفحص المخزني وتوصيات الجودة
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                  placeholder="أي ملاحظات حول حالة التغليف، درجات الحرارة أثناء النقل، أو أسباب الرفض..."
                />
              </div>
            </div>

            {/* Footer */}
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
                onClick={handleSaveGrn}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد إذن الاستلام المخزني</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printGrn && (
        <PrintPreviewModal
          isOpen={true}
          onClose={() => setPrintGrn(null)}
          title={`إذن استلام مخزني - ${printGrn.grnNumber}`}
        >
          <div className="p-8 bg-white text-slate-900 text-sm space-y-6 max-w-3xl mx-auto" dir="rtl">
            <PrintHeader title="إذن استلام مخزني ومحضر فحص بضاعة" documentNumber={printGrn.grnNumber} />

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 font-bold block mb-1">بيانات الاستلام:</span>
                <div className="font-bold text-sm text-slate-800">{printGrn.vendorName}</div>
                <div>تاريخ الاستلام: {printGrn.date}</div>
                <div>أمر الشراء: {printGrn.poNumber || 'توريد مباشر'}</div>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-1">بيانات المستودع:</span>
                <div>المستودع: {printGrn.warehouseName}</div>
                <div>بوليصة الشحن: {printGrn.deliveryNoteNumber || '-'}</div>
                <div>مسؤول الفحص: {printGrn.inspectorName || 'أمين المستودع'}</div>
              </div>
            </div>

            <table className="w-full text-right text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="py-2 px-3 border-b">م</th>
                  <th className="py-2 px-3 border-b">الصنف</th>
                  <th className="py-2 px-3 border-b text-center">المطلوب</th>
                  <th className="py-2 px-3 border-b text-center">المستلم</th>
                  <th className="py-2 px-3 border-b text-center text-emerald-600">المقبول</th>
                  <th className="py-2 px-3 border-b text-center text-rose-600">المرفوض</th>
                  <th className="py-2 px-3 border-b">رقم التشغيلة</th>
                  <th className="py-2 px-3 border-b">تاريخ الصلاحية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {printGrn.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3">{i + 1}</td>
                    <td className="py-2 px-3 font-medium">{item.productName}</td>
                    <td className="py-2 px-3 text-center">{item.orderedQuantity || '-'}</td>
                    <td className="py-2 px-3 text-center font-bold">{item.receivedQuantity}</td>
                    <td className="py-2 px-3 text-center font-bold text-emerald-600">
                      {item.acceptedQuantity}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-rose-600">
                      {item.rejectedQuantity || 0}
                    </td>
                    <td className="py-2 px-3 font-mono">{item.batchNumber || '-'}</td>
                    <td className="py-2 px-3 font-mono">{item.expiryDate || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {printGrn.notes && (
              <div className="p-3 bg-slate-50 rounded text-xs">
                <span className="font-bold block mb-1">ملاحظات الفحص الفني:</span>
                <p>{printGrn.notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 pt-8 text-center text-xs">
              <div>
                <span className="font-bold block mb-8">توقيع مسؤول الفحص والاستلام:</span>
                <span>................................................</span>
              </div>
              <div>
                <span className="font-bold block mb-8">اعتماد مدير المستودعات:</span>
                <span>................................................</span>
              </div>
            </div>

            <PrintFooter />
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
