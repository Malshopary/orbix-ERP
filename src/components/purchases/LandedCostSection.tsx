import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { LandedCostAllocation, LandedCostItem, LandedCostAllocatedProduct } from '../../types';
import {
  Ship,
  PlusCircle,
  Search,
  FileSpreadsheet,
  Layers,
  Calculator,
  Printer,
  Trash2,
  X,
  Check,
  TrendingUp,
  ArrowRight,
  Scale,
  ShieldCheck,
} from 'lucide-react';

export const LandedCostSection: React.FC = () => {
  const {
    landedCosts = [],
    purchaseInvoices = [],
    products = [],
    accounts = [],
    formatMoney,
    addLandedCostAllocation,
    deleteLandedCostAllocation,
    showAlert,
    showConfirm,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [allocationDate, setAllocationDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<'by_value' | 'by_quantity'>('by_value');
  const [costItems, setCostItems] = useState<LandedCostItem[]>([
    {
      id: `ci-1`,
      name: 'رسوم تخليص جمركي',
      amount: 1500,
      paymentAccountId: '1110',
      reference: 'INV-CUSTOMS-01',
    },
  ]);
  const [notes, setNotes] = useState('');

  // When invoice changes, load its items
  const selectedInvoice = useMemo(() => {
    return purchaseInvoices.find((p) => p.id === selectedInvoiceId);
  }, [purchaseInvoices, selectedInvoiceId]);

  const totalAdditionalCost = useMemo(() => {
    return costItems.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [costItems]);

  // Preview allocated items calculation
  const allocatedPreview = useMemo<LandedCostAllocatedProduct[]>(() => {
    if (!selectedInvoice || selectedInvoice.items.length === 0 || totalAdditionalCost === 0) {
      return [];
    }

    const invoiceSubtotal = selectedInvoice.subtotal || selectedInvoice.items.reduce((s, i) => s + i.total, 0);
    const invoiceTotalQty = selectedInvoice.items.reduce((s, i) => s + i.quantity, 0);

    return selectedInvoice.items.map((item) => {
      let allocatedPortion = 0;
      if (method === 'by_value' && invoiceSubtotal > 0) {
        allocatedPortion = totalAdditionalCost * (item.total / invoiceSubtotal);
      } else if (method === 'by_quantity' && invoiceTotalQty > 0) {
        allocatedPortion = totalAdditionalCost * (item.quantity / invoiceTotalQty);
      }

      const costPerUnit = item.quantity > 0 ? allocatedPortion / item.quantity : 0;
      const newUnitCost = (item.unitPrice || 0) + costPerUnit;

      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        originalUnitCost: item.unitPrice,
        allocatedCost: Math.round(allocatedPortion * 100) / 100,
        newUnitCost: Math.round(newUnitCost * 100) / 100,
      };
    });
  }, [selectedInvoice, method, totalAdditionalCost]);

  // Cost items helpers
  const handleAddCostRow = () => {
    setCostItems([
      ...costItems,
      {
        id: `ci-${Date.now()}`,
        name: 'مصاريف شحن ونقل إضافية',
        amount: 500,
        paymentAccountId: accounts.find((a) => a.code === '1110')?.id || accounts[0]?.id || '',
        reference: '',
      },
    ]);
  };

  const handleUpdateCostRow = (index: number, field: keyof LandedCostItem, val: any) => {
    const updated = [...costItems];
    updated[index] = { ...updated[index], [field]: val };
    setCostItems(updated);
  };

  const handleRemoveCostRow = (index: number) => {
    setCostItems(costItems.filter((_, i) => i !== index));
  };

  const handleOpenCreate = () => {
    const defaultInv = purchaseInvoices[0]?.id || '';
    setSelectedInvoiceId(defaultInv);
    setAllocationDate(new Date().toISOString().split('T')[0]);
    setMethod('by_value');
    setCostItems([
      {
        id: `ci-1`,
        name: 'شحن دولي ونولون',
        amount: 2500,
        paymentAccountId: accounts.find((a) => a.code === '1110')?.id || accounts[0]?.id || '',
        reference: 'SH-8812',
      },
      {
        id: `ci-2`,
        name: 'رسوم جمركية وضريبة وارد',
        amount: 1800,
        paymentAccountId: accounts.find((a) => a.code === '1120')?.id || accounts[1]?.id || '',
        reference: 'CUST-091',
      },
    ]);
    setNotes('');
    setShowCreateModal(true);
  };

  const handleSaveAllocation = () => {
    if (!selectedInvoiceId) {
      showAlert({ title: 'تنبيه', message: 'يرجى اختيار فاتورة المشتريات المراد تحميل التكاليف عليها', type: 'warning' });
      return;
    }
    if (totalAdditionalCost <= 0) {
      showAlert({ title: 'تنبيه', message: 'يرجى إدخال مبالغ تكاليف إضافية صحيحة أكبر من صفر', type: 'warning' });
      return;
    }
    if (allocatedPreview.length === 0) {
      showAlert({ title: 'تنبيه', message: 'لا توجد أصناف في الفاتورة لتوزيع التكاليف عليها', type: 'warning' });
      return;
    }

    const created = addLandedCostAllocation({
      purchaseInvoiceId: selectedInvoiceId,
      invoiceNumber: selectedInvoice?.invoiceNumber || '',
      date: allocationDate,
      allocationMethod: method,
      totalLandedCost: totalAdditionalCost,
      costs: costItems,
      allocatedItems: allocatedPreview,
      notes,
    });

    showAlert({
      title: 'تم توزيع التكاليف بنجاح',
      message: `تم إصدار سند التوزيع ${created.costNumber} وتحديث تكلفة الأصناف المخزنية وإنشاء قيد اليومية الآلي`,
      type: 'success',
    });

    setShowCreateModal(false);
  };

  const handleDelete = (lc: LandedCostAllocation) => {
    showConfirm({
      title: 'حذف توزيع التكاليف',
      message: `هل أنت متأكد من حذف عملية توزيع التكاليف ${lc.costNumber}؟`,
      type: 'danger',
      confirmText: 'نعم، احذف',
      cancelText: 'إلغاء',
      onConfirm: () => {
        deleteLandedCostAllocation(lc.id);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              تكاليف الشحن والجمارك الإضافية (Landed Costs)
            </h2>
            <p className="text-xs text-slate-500">
              رسملة مصاريف الشحن الدولي والتخليص الجمركي والتأمين على تكلفة الوحدة المخزنية وفق المعايير المحاسبية
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>توزيع تكاليف استيرادية جديدة</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">عمليات التوزيع المسجلة</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{landedCosts.length}</div>
            <div className="text-xs text-slate-500 mt-1">توزيع تكاليف على فواتير المشتريات</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">إجمالي التكاليف المرسملة</span>
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-indigo-600">
              {formatMoney(landedCosts.reduce((sum, lc) => sum + lc.totalLandedCost, 0))}
            </div>
            <div className="text-xs text-slate-500 mt-1">تمت إضافتها لأرصدة المخزون بالقيود الآلية</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">طرق التوزيع المعتمدة</span>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-slate-800">
              نسبة القيمة (Ad-valorem) / نسبة الكمية
            </div>
            <div className="text-xs text-slate-500 mt-1">دقة احتساب ربحية الأصناف</div>
          </div>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">سجل توزيع التكاليف الإضافية والشحن</h3>
          <div className="text-xs text-slate-500">{landedCosts.length} عملية توزيع</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">رقم السند</th>
                <th className="py-3.5 px-4">فاتورة المشتريات</th>
                <th className="py-3.5 px-4">تاريخ التوزيع</th>
                <th className="py-3.5 px-4">طريقة التوزيع</th>
                <th className="py-3.5 px-4">إجمالي التكاليف الموزعة</th>
                <th className="py-3.5 px-4">بنود المصاريف</th>
                <th className="py-3.5 px-4">القيد الآلي</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {landedCosts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Ship className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    لا توجد عمليات توزيع تكاليف مسجلة
                  </td>
                </tr>
              ) : (
                landedCosts.map((lc) => (
                  <tr
                    key={lc.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      {lc.costNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-900">
                      {lc.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{lc.date}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {lc.allocationMethod === 'by_value' ? 'حسب القيمة المالية' : 'حسب كمية الأصناف'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600 font-mono">
                      {formatMoney(lc.totalLandedCost)}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {lc.costs.map((c) => c.name).join('، ')}
                    </td>
                    <td className="py-3 px-4">
                      {lc.journalEntryId ? (
                        <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {lc.journalEntryId}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(lc)}
                        title="حذف"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Landed Cost Allocation */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    توزيع تكاليف استيرادية وشحن (Landed Costs)
                  </h3>
                  <p className="text-xs text-slate-500">
                    تحديد مصاريف الشحن والجمارك وتوزيعها آلياً على تكلفة أصناف الفاتورة
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
              {/* Target Invoice & Allocation Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    فاتورة المشتريات المراد تحميلها <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => setSelectedInvoiceId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">-- اختر الفاتورة --</option>
                    {purchaseInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - {inv.vendorName} ({formatMoney(inv.grandTotal)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    تاريخ التوزيع <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={allocationDate}
                    onChange={(e) => setAllocationDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    معيار توزيع التكاليف <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="by_value">نسبة القيمة المالية (الأكثر دقة للجمارك)</option>
                    <option value="by_quantity">نسبة عدد القطع (المثالي للشحن بالقطعة)</option>
                  </select>
                </div>
              </div>

              {/* Additional Cost Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    بنود المصاريف الإضافية (شحن، جمارك، تأمين، تفريغ)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCostRow}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>إضافة بند مصروف</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">اسم المصروف</th>
                        <th className="py-2.5 px-3 w-32">المبلغ</th>
                        <th className="py-2.5 px-3 w-48">حساب السداد (الخزينة/البنك)</th>
                        <th className="py-2.5 px-3 w-32">رقم المستند/البيان</th>
                        <th className="py-2.5 px-3 text-center w-10">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {costItems.map((c, idx) => (
                        <tr key={c.id}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => handleUpdateCostRow(idx, 'name', e.target.value)}
                              placeholder="مثال: شحن جوي، رسوم جمارك..."
                              className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={c.amount}
                              onChange={(e) =>
                                handleUpdateCostRow(idx, 'amount', parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-2 py-1 text-left font-mono font-bold rounded border border-slate-200 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={c.paymentAccountId}
                              onChange={(e) => handleUpdateCostRow(idx, 'paymentAccountId', e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                            >
                              {accounts
                                .filter((a) => a.type === 'asset' || a.type === 'liability')
                                .map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={c.reference || ''}
                              onChange={(e) => handleUpdateCostRow(idx, 'reference', e.target.value)}
                              placeholder="رقم الإيصال"
                              className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCostRow(idx)}
                              className="p-1 text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end text-xs font-bold text-slate-800">
                  <span>إجمالي التكاليف الإضافية: {formatMoney(totalAdditionalCost)}</span>
                </div>
              </div>

              {/* Real-time Allocation Impact Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    معاينة توزيع التكاليف وتحديث تكلفة الوحدة المخزنية
                  </h4>
                  <span className="text-xs text-indigo-600 font-semibold">
                    سيتم تحديث تكلفة الأصناف في المخزن تلقائياً
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">الصنف</th>
                        <th className="py-2.5 px-3 text-center w-20">الكمية</th>
                        <th className="py-2.5 px-3 text-left w-28">التكلفة الأصلية</th>
                        <th className="py-2.5 px-3 text-left w-28 text-indigo-600">نصيب المصروف</th>
                        <th className="py-2.5 px-3 text-left w-32 font-bold text-emerald-600">
                          التكلفة الجديدة للوحدة
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {allocatedPreview.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            اختر فاتورة مشتريات وأدخل التكاليف لعرض توزيع التكلفة.
                          </td>
                        </tr>
                      ) : (
                        allocatedPreview.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-medium text-slate-900">
                              {item.productName}
                            </td>
                            <td className="py-2 px-3 text-center font-mono">{item.quantity}</td>
                            <td className="py-2 px-3 text-left font-mono">
                              {formatMoney(item.originalUnitCost)}
                            </td>
                            <td className="py-2 px-3 text-left font-mono text-indigo-600 font-semibold">
                              +{formatMoney(item.allocatedCost / (item.quantity || 1))}
                            </td>
                            <td className="py-2 px-3 text-left font-mono font-bold text-emerald-600">
                              {formatMoney(item.newUnitCost)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
                onClick={handleSaveAllocation}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>اعتماد توزيع التكاليف وتوليد القيد المحاسبي</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
