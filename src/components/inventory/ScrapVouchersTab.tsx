import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { ScrapVoucher, ScrapVoucherItem } from '../../types';
import { SearchableSelect } from '../SearchableSelect';
import {
  Trash2,
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
  ShieldAlert,
} from 'lucide-react';

export const ScrapVouchersTab: React.FC = () => {
  const {
    scrapVouchers,
    warehouses,
    products,
    addScrapVoucher,
    deleteScrapVoucher,
    canDeleteEntity,
    showAlert,
    showConfirm,
    hasPermission,
    formatMoney,
    currency,
    currentUser,
    getProductQuantityInWarehouse,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewVoucher, setViewVoucher] = useState<ScrapVoucher | null>(null);

  // Form State
  const [voucherNumber, setVoucherNumber] = useState(`SCR-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [generalReason, setGeneralReason] = useState<ScrapVoucher['reason']>('expired');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ScrapVoucherItem[]>([]);

  // Item row input
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemReason, setItemReason] = useState('');

  const canEdit = hasPermission('edit_products') || currentUser?.role === 'admin' || currentUser?.role === 'warehouse_keeper';

  const getWarehouseName = (id: string) => {
    return warehouses.find((w) => w.id === id)?.name || id;
  };

  const getReasonLabel = (r: ScrapVoucher['reason']) => {
    switch (r) {
      case 'expired':
        return 'انتهاء الصلاحية';
      case 'damaged_transit':
        return 'تلف أثناء الشحن والنقل';
      case 'manufacturing_defect':
        return 'عيب تصنيع / كسر';
      case 'other':
      default:
        return 'أسباب أخرى / هالك طبيعي';
    }
  };

  const filteredVouchers = scrapVouchers.filter((v) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const whName = getWarehouseName(v.warehouseId).toLowerCase();
      return (
        v.voucherNumber.toLowerCase().includes(q) ||
        whName.includes(q) ||
        (v.notes && v.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAddItem = () => {
    if (!selectedProductId) {
      showAlert('الرجاء اختيار الصنف المراد إهلاكه.');
      return;
    }
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    if (itemQty <= 0) {
      showAlert('الكمية يجب أن تكون أكبر من الصفر.');
      return;
    }

    const availInWh = getProductQuantityInWarehouse ? getProductQuantityInWarehouse(prod.id, warehouseId) : prod.stockQuantity;

    if (itemQty > availInWh) {
      showAlert(`الكمية المراد إهلاكها (${itemQty}) أكبر من رصيد الصنف المتاح في هذا المستودع (${availInWh} ${prod.unit || 'قطعة'}).`);
      return;
    }

    const totalCost = itemQty * prod.costPrice;

    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: itemQty,
        costPrice: prod.costPrice,
        totalCost,
        reason: itemReason || getReasonLabel(generalReason),
        unit: prod.unit || 'قطعة',
      },
    ]);

    setSelectedProductId('');
    setItemQty(1);
    setItemReason('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveVoucher = () => {
    if (items.length === 0) {
      showAlert('الرجاء إضافة صنف واحد على الأقل للمحضر.');
      return;
    }

    const totalLoss = items.reduce((acc, i) => acc + i.totalCost, 0);

    showConfirm(
      `هل أنت متأكد من اعتماد محضر إتلاف المخزون بقيمة خسائر إجمالية (${formatMoney(totalLoss)})؟ سيتم خصم الكميات من المخزون فوراً وإنشاء قيد محاسبي لخسائر التوالف.`,
      () => {
        addScrapVoucher({
          voucherNumber: voucherNumber.trim() || `SCR-${Date.now().toString().slice(-6)}`,
          date,
          warehouseId,
          reason: generalReason,
          items,
          totalLossValue: totalLoss,
          notes,
        });

        setShowAddModal(false);
        setItems([]);
        setNotes('');
        setVoucherNumber(`SCR-${Date.now().toString().slice(-6)}`);
      },
      'تأكيد إهلاك المخزون',
      { confirmText: 'اعتماد وإهلاك المخزون', type: 'error' }
    );
  };

  const handlePrintVoucher = (v: ScrapVoucher) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const whName = getWarehouseName(v.warehouseId);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <title>محضر إتلاف وهوالك مخزون - ${v.voucherNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; direction: rtl; color: #1e293b; }
          .header { text-align: center; border-bottom: 2px solid #b91c1c; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; color: #b91c1c; margin: 0; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; font-size: 13px; background: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fecaca; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: right; }
          th { background-color: #fee2e2; font-weight: bold; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 40px; text-align: center; font-size: 13px; }
          .sign-box { border-top: 1px dashed #94a3b8; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">محضر إتلاف وإعدام بضاعة ومخزون</div>
          <div style="font-size: 14px; margin-top: 4px; color: #64748b;">رقم المحضر: ${v.voucherNumber}</div>
        </div>
        <div class="meta-grid">
          <div><strong>المستودع:</strong> ${whName}</div>
          <div><strong>تاريخ الإتلاف:</strong> ${v.date}</div>
          <div><strong>السبب الرئيسي:</strong> ${getReasonLabel(v.reason)}</div>
          <div><strong>المعتمد:</strong> ${v.createdBy || 'لجنة الإتلاف'}</div>
          <div><strong>إجمالي قيمة الخسائر:</strong> ${v.totalLossValue.toFixed(2)} ${currency}</div>
          <div><strong>الملاحظات:</strong> ${v.notes || 'لا يوجد'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>كود الصنف</th>
              <th>اسم الصنف</th>
              <th>الكمية التالفة</th>
              <th>سعر التكلفة</th>
              <th>إجمالي الخسارة</th>
              <th>سبب الإتلاف</th>
            </tr>
          </thead>
          <tbody>
            ${v.items
              .map(
                (item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.sku}</td>
                <td>${item.productName}</td>
                <td style="font-weight: bold; color: #b91c1c;">${item.quantity} ${item.unit}</td>
                <td>${item.costPrice.toFixed(2)}</td>
                <td style="font-weight: bold;">${item.totalCost.toFixed(2)}</td>
                <td>${item.reason || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <div class="signatures">
          <div class="sign-box">أمين المستودع<br><br>.........................</div>
          <div class="sign-box">لجنة الإتلاف والرقابة<br><br>.........................</div>
          <div class="sign-box">المدير العام / الاعتماد المالي<br><br>.........................</div>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            محاضر إتلاف وهوالك المخزون (Scrap Vouchers)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            توثيق إعدام البضائع التالفة أو منتهية الصلاحية مع ترحيل خسائر المخزون دفترياً ومحاسبياً
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setVoucherNumber(`SCR-${Date.now().toString().slice(-6)}`);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            إنشاء محضر إتلاف جديد
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
          placeholder="بحث برقم المحضر أو المستودع أو الملاحظات..."
          className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredVouchers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">لا توجد محاضر إتلاف مخزني</h3>
            <p className="text-xs text-slate-400 mt-1">
              سجل محاضر إتلاف البضائع لحساب التوالف وضبط حساب الأرباح والخسائر بدقة
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold">
                  <th className="py-3 px-4">رقم المحضر</th>
                  <th className="py-3 px-4">تاريخ الإتلاف</th>
                  <th className="py-3 px-4">المستودع</th>
                  <th className="py-3 px-4">السبب الرئيسي</th>
                  <th className="py-3 px-4">الأصناف التالفة</th>
                  <th className="py-3 px-4">قيمة الخسارة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {v.voucherNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{v.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Building className="w-3.5 h-3.5 text-rose-600" />
                        {getWarehouseName(v.warehouseId)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md font-bold">
                        {getReasonLabel(v.reason)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">
                        <Layers className="w-3 h-3 text-slate-500" />
                        {v.items.reduce((acc, i) => acc + i.quantity, 0)} قطعة ({v.items.length} صنف)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-rose-700">
                      {formatMoney(v.totalLossValue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewVoucher(v)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="عرض تفاصيل المحضر"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintVoucher(v)}
                          className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="طباعة محضر الإتلاف"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              const check = canDeleteEntity('scrap_voucher', v.id);
                              if (!check.canDelete) {
                                showAlert(check.reason || 'لا يمكن حذف هذا المحضر.');
                                return;
                              }
                              showConfirm(`هل أنت متأكد من حذف محضر الإتلاف ${v.voucherNumber}؟`, () => {
                                deleteScrapVoucher(v.id);
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف المحضر"
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

      {/* MODAL: Create New Scrap Voucher */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-extrabold">إنشاء محضر إتلاف وإعدام مخزون جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">رقم المحضر</label>
                  <input
                    type="text"
                    value={voucherNumber}
                    onChange={(e) => setVoucherNumber(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">تاريخ الإتلاف</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">المستودع</label>
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
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">السبب الرئيسي للإتلاف</label>
                <SearchableSelect
                  value={generalReason}
                  onChange={(val) => setGeneralReason(val as any)}
                  options={[
                    { value: 'expired', label: 'انتهاء الصلاحية' },
                    { value: 'damaged_transit', label: 'تلف أثناء الشحن والنقل' },
                    { value: 'manufacturing_defect', label: 'عيب تصنيع أو كسر' },
                    { value: 'other', label: 'أسباب أخرى / هالك طبيعي' },
                  ]}
                />
              </div>

              {/* Add items row */}
              <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-200/80 space-y-2">
                <h4 className="font-extrabold text-rose-900 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-rose-600" />
                  إضافة أصناف إلى محضر الإتلاف
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <SearchableSelect
                      value={selectedProductId}
                      onChange={(val) => setSelectedProductId(val)}
                      placeholder="-- اختر الصنف المراد إهلاكه --"
                      searchPlaceholder="ابحث باسم الصنف، SKU أو الباركود..."
                      options={products.map((p) => {
                        const qtyInWh = getProductQuantityInWarehouse ? getProductQuantityInWarehouse(p.id, warehouseId) : p.stockQuantity;
                        return {
                          value: p.id,
                          label: `${p.sku} | ${p.name}`,
                          subLabel: `المتاح بالمستودع المحدد: ${qtyInWh} ${p.unit || 'قطعة'} (إجمالي الشركة: ${p.stockQuantity})`,
                          badge: `تكلفة: ${formatMoney(p.costPrice)}`,
                          badgeColor: 'bg-rose-50 text-rose-700',
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
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={itemReason}
                      onChange={(e) => setItemReason(e.target.value)}
                      placeholder="سبب خاص بالصنف..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full h-full bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold">
                    <tr>
                      <th className="py-2 px-3">كود الصنف</th>
                      <th className="py-2 px-3">اسم الصنف</th>
                      <th className="py-2 px-3">الكمية</th>
                      <th className="py-2 px-3">سعر التكلفة</th>
                      <th className="py-2 px-3">إجمالي الخسارة</th>
                      <th className="py-2 px-3 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          لم يتم إضافة أي أصناف بعد
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-mono font-bold">{item.sku}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{item.productName}</td>
                          <td className="py-2 px-3 font-mono font-bold text-rose-700">{item.quantity}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{formatMoney(item.costPrice)}</td>
                          <td className="py-2 px-3 font-mono font-extrabold text-rose-700">{formatMoney(item.totalCost)}</td>
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

              {/* Summary total loss box */}
              {items.length > 0 && (
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 flex items-center justify-between">
                  <span className="font-extrabold text-rose-900">إجمالي خسارة المخزون المراد إعدامها:</span>
                  <span className="font-mono font-extrabold text-sm text-rose-700">
                    {formatMoney(items.reduce((acc, i) => acc + i.totalCost, 0))}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">ملاحظات وقرار اللجنة</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أدخل أي تقارير فنية أو أسباب إضافية..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
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
                onClick={handleSaveVoucher}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                اعتماد محضر الإتلاف وخصم الكميات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Voucher Details */}
      {viewVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-extrabold">تفاصيل محضر الإتلاف: {viewVoucher.voucherNumber}</h3>
              <button
                type="button"
                onClick={() => setViewVoucher(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-bold block">المستودع:</span>
                  <span className="font-extrabold text-slate-900">{getWarehouseName(viewVoucher.warehouseId)}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">تاريخ الإتلاف:</span>
                  <span className="font-extrabold text-slate-900">{viewVoucher.date}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">السبب:</span>
                  <span className="font-bold text-rose-700">{getReasonLabel(viewVoucher.reason)}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">إجمالي الخسارة:</span>
                  <span className="font-mono font-extrabold text-rose-700">{formatMoney(viewVoucher.totalLossValue)}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">كود الصنف</th>
                      <th className="py-2 px-3">اسم الصنف</th>
                      <th className="py-2 px-3">الكمية</th>
                      <th className="py-2 px-3">الخسارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewVoucher.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold">{item.sku}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{item.productName}</td>
                        <td className="py-2 px-3 font-bold font-mono text-rose-700">{item.quantity} {item.unit}</td>
                        <td className="py-2 px-3 font-bold font-mono text-rose-700">{formatMoney(item.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewVoucher(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => handlePrintVoucher(viewVoucher)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                طباعة المحضر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
