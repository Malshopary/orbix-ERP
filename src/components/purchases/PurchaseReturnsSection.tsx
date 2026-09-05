import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { PurchaseReturn, PurchaseReturnItem } from '../../types';
import { SearchableSelect } from '../SearchableSelect';
import { ProductSelectSearch } from '../ProductSelectSearch';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { PrintHeader } from '../PrintHeader';
import { PrintFooter } from '../PrintFooter';
import {
  RotateCcw,
  PlusCircle,
  Search,
  Building,
  Calendar,
  Warehouse,
  Printer,
  Trash2,
  FileText,
  AlertCircle,
  X,
  Check,
  TrendingDown,
} from 'lucide-react';

export const PurchaseReturnsSection: React.FC = () => {
  const {
    purchaseReturns = [],
    purchaseInvoices = [],
    vendors = [],
    products = [],
    warehouses = [],
    companyProfile,
    formatMoney,
    addPurchaseReturn,
    deletePurchaseReturn,
    showAlert,
    showConfirm,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [printReturn, setPrintReturn] = useState<PurchaseReturn | null>(null);

  // Form state
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetWarehouseId, setTargetWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [items, setItems] = useState<PurchaseReturnItem[]>([]);
  const [reason, setReason] = useState('عدم مطابقة المواصفات الفنية أو وجود تلف أثناء الفحص المخزني');
  const [notes, setNotes] = useState('');

  // Filtered returns
  const filteredReturns = useMemo(() => {
    return purchaseReturns.filter((pr) => {
      const matchSearch =
        pr.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pr.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pr.reason && pr.reason.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchVendor = vendorFilter === 'all' || pr.vendorId === vendorFilter;
      return matchSearch && matchVendor;
    });
  }, [purchaseReturns, searchQuery, vendorFilter]);

  // Invoice change handler
  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    if (!invId) return;

    const inv = purchaseInvoices.find((p) => p.id === invId);
    if (inv) {
      setSelectedVendorId(inv.vendorId);
      const prItems: PurchaseReturnItem[] = inv.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: 1,
        unitPrice: i.unitPrice,
        total: i.unitPrice,
      }));
      setItems(prItems);
    }
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => sum + i.total, 0);
  }, [items]);

  const vatTotal = useMemo(() => {
    return Math.round(subtotal * ((companyProfile.defaultVatRate || 14) / 100));
  }, [subtotal, companyProfile.defaultVatRate]);

  const grandTotal = subtotal + vatTotal;

  // Add Item to Return
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
      const unitPrice = prod.costPrice || 100;
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: 1,
          unitPrice,
          total: unitPrice,
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
    setSelectedVendorId(vendors[0]?.id || '');
    setSelectedInvoiceId('');
    setReturnDate(new Date().toISOString().split('T')[0]);
    setTargetWarehouseId(warehouses[0]?.id || 'wh-1');
    setItems([]);
    setReason('عدم مطابقة المواصفات الفنية أو وجود تلف أثناء الفحص المخزني');
    setNotes('');
    setShowCreateModal(true);
  };

  const handleSaveReturn = () => {
    if (!selectedVendorId) {
      showAlert({ title: 'تنبيه', message: 'يرجى تحديد المورد', type: 'warning' });
      return;
    }
    if (items.length === 0) {
      showAlert({ title: 'تنبيه', message: 'يرجى إضافة صنف واحد على الأقل للمردودات', type: 'warning' });
      return;
    }

    const vendor = vendors.find((v) => v.id === selectedVendorId);
    const wh = warehouses.find((w) => w.id === targetWarehouseId);
    const inv = purchaseInvoices.find((i) => i.id === selectedInvoiceId);

    const created = addPurchaseReturn({
      purchaseInvoiceId: selectedInvoiceId || undefined,
      invoiceNumber: inv?.invoiceNumber || undefined,
      vendorId: selectedVendorId,
      vendorName: vendor?.name || 'مورد معتمد',
      date: returnDate,
      warehouseId: targetWarehouseId,
      warehouseName: wh?.name || warehouses[0]?.name,
      items,
      subtotal,
      vatTotal,
      grandTotal,
      reason,
      notes,
    });

    showAlert({
      title: 'تم تسجيل مردود المشتريات',
      message: `تم إصدار إشعار مدين رقم ${created.returnNumber} وتخفيض مديونية المورد وخصم الكميات من المستودع بنجاح`,
      type: 'success',
    });

    setShowCreateModal(false);
  };

  const handleDelete = (pr: PurchaseReturn) => {
    showConfirm({
      title: 'حذف مردودات المشتريات',
      message: `هل أنت متأكد من حذف الإشعار المدين ${pr.returnNumber}؟`,
      type: 'danger',
      confirmText: 'نعم، احذف',
      cancelText: 'إلغاء',
      onConfirm: () => {
        deletePurchaseReturn(pr.id);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              مردودات المشتريات والإشعارات المدينة (Debit Notes)
            </h2>
            <p className="text-xs text-slate-500">
              إرجاع البضائع التالفة أو غير المطابقة وتخفيض التزامات الموردين وتوليد القيود المحاسبية التلقائية
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>إصدار إشعار مدين / مردود جديد</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">عدد الإشعارات المدينة</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{purchaseReturns.length}</div>
            <div className="text-xs text-slate-500 mt-1">إشعار مدين صادر للموردين</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">إجمالي المبالغ المرتجعة</span>
            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">
              {formatMoney(purchaseReturns.reduce((sum, pr) => sum + pr.grandTotal, 0))}
            </div>
            <div className="text-xs text-slate-500 mt-1">تخفيض في حسابات الدائنين والموردين</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">إجمالي القطع المرتجعة</span>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600">
              {purchaseReturns.reduce(
                (sum, pr) => sum + pr.items.reduce((s, i) => s + i.quantity, 0),
                0
              )}{' '}
              قطعة
            </div>
            <div className="text-xs text-slate-500 mt-1">تم إخراجها من المخازن</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث برقم الإشعار أو المورد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">رقم الإشعار المدين</th>
                <th className="py-3.5 px-4">المورد</th>
                <th className="py-3.5 px-4">تاريخ الإرجاع</th>
                <th className="py-3.5 px-4">المستودع المصدر</th>
                <th className="py-3.5 px-4">الفاتورة المرتبطة</th>
                <th className="py-3.5 px-4">القيمة الإجمالية</th>
                <th className="py-3.5 px-4">سبب الإرجاع</th>
                <th className="py-3.5 px-4">القيد الآلي</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RotateCcw className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    لا توجد مردودات مشتريات مسجلة
                  </td>
                </tr>
              ) : (
                filteredReturns.map((pr) => (
                  <tr
                    key={pr.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">
                      {pr.returnNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {pr.vendorName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{pr.date}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pr.warehouseName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      {pr.invoiceNumber || <span className="text-slate-400">مردود مباشر</span>}
                    </td>
                    <td className="py-3 px-4 font-bold text-rose-600 font-mono">
                      {formatMoney(pr.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {pr.reason}
                    </td>
                    <td className="py-3 px-4">
                      {pr.journalEntryId ? (
                        <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {pr.journalEntryId}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPrintReturn(pr)}
                          title="طباعة إشعار مدين"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pr)}
                          title="حذف"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">إصدار إشعار مدين مردودات مشتريات</h3>
                  <p className="text-xs text-slate-500">
                    إخراج بضاعة تالفة أو غير مطابقة وتخفيض مديونية المورد وتوليد القيد المحاسبي
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
              {/* Target Invoice & Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ربط بفاتورة مشتريات سابقة (اختياري)
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">-- بدون فاتورة (مردود مباشر) --</option>
                    {purchaseInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.vendorName} ({formatMoney(inv.grandTotal)})
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
                      subLabel: `رصيد المورد: ${formatMoney(v.currentBalance)}`,
                    }))}
                    value={selectedVendorId}
                    onChange={(val) => setSelectedVendorId(val)}
                    placeholder="اختر المورد..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    تاريخ الإرجاع <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    المستودع المرتجع منه <span className="text-rose-500">*</span>
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

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    سبب الإرجاع ومبرر الإشعار المدين <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                    placeholder="مثال: أصناف تالفة، عدم مطابقة العينات، انتهاء صلاحية..."
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">الأصناف المرتجعة</h4>
                  <span className="text-xs text-slate-500">{items.length} أصناف مضافة</span>
                </div>

                {/* Add product */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <ProductSelectSearch
                    products={products}
                    onSelect={(p) => handleAddItem(p.id)}
                    placeholder="ابحث عن صنف لإضافته إلى قائمة المردودات..."
                  />
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">م</th>
                        <th className="py-2.5 px-3">الصنف</th>
                        <th className="py-2.5 px-3 w-28">الكمية المرتجعة</th>
                        <th className="py-2.5 px-3 w-32">سعر الوحدة</th>
                        <th className="py-2.5 px-3 w-32">الإجمالي</th>
                        <th className="py-2.5 px-3 text-center w-12">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            لا توجد أصناف مضافة حالياً. اختر صنفاً للإرجاع.
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
                                className="w-full px-2 py-1 text-center font-bold text-rose-600 rounded border border-slate-200 bg-white"
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

                {/* Summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-full md:w-80 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>المجموع قبل الضريبة:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatMoney(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ضريبة القيمة المضافة المعكوسة ({companyProfile.defaultVatRate || 14}%):</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatMoney(vatTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>إجمالي الإشعار المدين:</span>
                      <span className="text-rose-600 font-mono">
                        {formatMoney(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ملاحظات إضافية
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
                onClick={handleSaveReturn}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد الإشعار المدين وتحديث الحسابات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {printReturn && (
        <PrintPreviewModal
          isOpen={true}
          onClose={() => setPrintReturn(null)}
          title={`إشعار مدين - ${printReturn.returnNumber}`}
        >
          <div className="p-8 bg-white text-slate-900 text-sm space-y-6 max-w-3xl mx-auto" dir="rtl">
            <PrintHeader title="إشعار مدين / مردودات مشتريات (Debit Note)" documentNumber={printReturn.returnNumber} />

            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 font-bold block mb-1">بيانات المورد:</span>
                <div className="font-bold text-sm text-slate-800">{printReturn.vendorName}</div>
                <div>تاريخ الإرجاع: {printReturn.date}</div>
                <div>الفاتورة المرجعية: {printReturn.invoiceNumber || 'مردود مباشر'}</div>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-1">تفاصيل المستودع والسبب:</span>
                <div>المستودع المصدر: {printReturn.warehouseName}</div>
                <div>سبب الإرجاع: {printReturn.reason}</div>
              </div>
            </div>

            <table className="w-full text-right text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr>
                  <th className="py-2 px-3 border-b">م</th>
                  <th className="py-2 px-3 border-b">الصنف المرتجع</th>
                  <th className="py-2 px-3 border-b text-center">الكمية</th>
                  <th className="py-2 px-3 border-b text-left">سعر الوحدة</th>
                  <th className="py-2 px-3 border-b text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {printReturn.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3">{i + 1}</td>
                    <td className="py-2 px-3 font-medium">{item.productName}</td>
                    <td className="py-2 px-3 text-center font-bold text-rose-600">{item.quantity}</td>
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
                  <span className="font-mono">{formatMoney(printReturn.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ضريبة القيمة المضافة:</span>
                  <span className="font-mono">{formatMoney(printReturn.vatTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t">
                  <span>المجموع الإجمالي للإشعار:</span>
                  <span className="font-mono text-rose-600">{formatMoney(printReturn.grandTotal)}</span>
                </div>
              </div>
            </div>

            <PrintFooter />
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
