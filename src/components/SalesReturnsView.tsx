import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { ReturnItem, SalesInvoice, SalesReturn } from '../types';
import { exportElementToPdf } from '../utils/pdfExport';
import { evaluateMathExpression, sanitizeMathInput } from '../utils/mathEvaluator';
import { CustomerStatementModal } from './CustomerStatementModal';
import {
  RotateCcw,
  PlusCircle,
  Search,
  Printer,
  Download,
  X,
  FileText,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ArrowDownLeft,
  CheckCircle2,
  Trash2,
  Edit3,
  FileSpreadsheet,
} from 'lucide-react';

export const SalesReturnsView: React.FC = () => {
  const {
    salesReturns,
    salesInvoices,
    customers,
    products,
    companyProfile,
    currency,
    formatMoney,
    formatDualMoney,
    addSalesReturn,
    editSalesReturn,
    deleteSalesReturn,
    getNextSequenceCode,
    showAlert,
    showConfirm,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReturn, setEditingReturn] = useState<SalesReturn | null>(null);
  const [statementCustomerId, setStatementCustomerId] = useState<string | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Create Return Form State
  const [returnType, setReturnType] = useState<'from_invoice' | 'from_account'>('from_invoice');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [returnDate, setReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('مردودات مبيعات - عيب مصنعي أو استبدال بضاعة');
  const [refundMethod, setRefundMethod] = useState<'customer_balance' | 'cash_vault' | 'bank'>('customer_balance');
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [vatRate, setVatRate] = useState<number>(companyProfile.defaultVatRate || 15);

  // Edit Return Form State
  const [editReturnDate, setEditReturnDate] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [editRefundMethod, setEditRefundMethod] = useState<'customer_balance' | 'cash_vault' | 'bank'>('customer_balance');
  const [editReturnItems, setEditReturnItems] = useState<ReturnItem[]>([]);
  const [editVatRate, setEditVatRate] = useState<number>(15);

  // When invoice selection changes in "from_invoice" mode
  const handleSelectInvoice = (invId: string) => {
    setSelectedInvoiceId(invId);
    const invoice = salesInvoices.find((i) => i.id === invId);
    if (invoice) {
      setSelectedCustomerId(invoice.customerId);
      const effectiveVat = invoice.vatRate !== undefined ? invoice.vatRate : companyProfile.defaultVatRate;
      setVatRate(effectiveVat);
      // Populate return items from invoice items preserving original quantity, price, and discount
      setReturnItems(
        invoice.items.map((item) => {
          const discount = item.discount || 0;
          const itemSub = Math.max(0, item.quantity * item.unitPrice - discount);
          const vat = item.vatAmount !== undefined ? item.vatAmount : (itemSub * effectiveVat) / 100;
          const total = item.total !== undefined ? item.total : (itemSub + vat);
          return {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: discount,
            subtotal: itemSub,
            vatAmount: vat,
            total: total,
            reason: 'استرجاع من الفاتورة',
          };
        })
      );
    }
  };

  // Add custom item row in "from_account" mode
  const handleAddAccountItemRow = () => {
    const prod = products[0];
    if (!prod) return;
    const sub = prod.sellingPrice;
    const vat = (sub * vatRate) / 100;
    setReturnItems([
      ...returnItems,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        unitPrice: prod.sellingPrice,
        discount: 0,
        subtotal: sub,
        vatAmount: vat,
        total: sub + vat,
        reason: 'مرتجع مباشر على الحساب',
      },
    ]);
  };

  // Math expression handler for return quantity
  const handleQuantityMath = (idx: number, expr: string) => {
    const evaluated = evaluateMathExpression(expr);
    const fallbackQty = returnItems[idx]?.quantity || 1;
    const finalQty = evaluated !== null && evaluated > 0 ? evaluated : fallbackQty;
    const newItems = [...returnItems];
    const current = newItems[idx];
    const qty = Math.max(1, finalQty);
    const disc = current.discount || 0;
    const sub = Math.max(0, qty * current.unitPrice - disc);
    const vat = (sub * vatRate) / 100;

    newItems[idx] = {
      ...current,
      quantity: qty,
      subtotal: sub,
      vatAmount: vat,
      total: sub + vat,
    };
    setReturnItems(newItems);
  };

  const handlePriceChange = (idx: number, price: number) => {
    const newItems = [...returnItems];
    const current = newItems[idx];
    const unitPrice = Math.max(0, price);
    const disc = current.discount || 0;
    const sub = Math.max(0, current.quantity * unitPrice - disc);
    const vat = (sub * vatRate) / 100;

    newItems[idx] = {
      ...current,
      unitPrice,
      subtotal: sub,
      vatAmount: vat,
      total: sub + vat,
    };
    setReturnItems(newItems);
  };

  const handleDiscountChange = (idx: number, discountVal: number) => {
    const newItems = [...returnItems];
    const current = newItems[idx];
    const cleanDiscount = Math.max(0, discountVal);
    const sub = Math.max(0, current.quantity * current.unitPrice - cleanDiscount);
    const vat = (sub * vatRate) / 100;

    newItems[idx] = {
      ...current,
      discount: cleanDiscount,
      subtotal: sub,
      vatAmount: vat,
      total: sub + vat,
    };
    setReturnItems(newItems);
  };

  const handleRemoveRow = (idx: number) => {
    if (returnItems.length <= 1) return;
    setReturnItems(returnItems.filter((_, i) => i !== idx));
  };

  // Totals
  const subtotal = returnItems.reduce((s, it) => s + it.subtotal, 0);
  const vatTotal = returnItems.reduce((s, it) => s + it.vatAmount, 0);
  const totalRefundAmount = subtotal + vatTotal;

  // Edit Return Actions & Math Handlers
  const handleOpenEdit = (ret: SalesReturn) => {
    setEditingReturn(ret);
    setEditReturnDate(ret.date);
    setEditReason(ret.reason || '');
    setEditRefundMethod(ret.refundMethod);
    const effectiveVat = ret.vatRate !== undefined && ret.vatRate !== null ? ret.vatRate : (companyProfile.defaultVatRate || 15);
    setEditVatRate(effectiveVat);
    setEditReturnItems(
      ret.items.map((it) => {
        const disc = it.discount || 0;
        const sub = Math.max(0, it.quantity * it.unitPrice - disc);
        const vat = (sub * effectiveVat) / 100;
        return {
          ...it,
          discount: disc,
          subtotal: sub,
          vatAmount: vat,
          total: sub + vat,
        };
      })
    );
    setShowEditModal(true);
  };

  const handleEditQuantityMath = (idx: number, expr: string) => {
    const evaluated = evaluateMathExpression(expr);
    const fallbackQty = editReturnItems[idx]?.quantity || 1;
    const finalQty = evaluated !== null && evaluated > 0 ? evaluated : fallbackQty;
    const newItems = [...editReturnItems];
    const current = newItems[idx];
    const qty = Math.max(1, finalQty);
    const disc = current.discount || 0;
    const sub = Math.max(0, qty * current.unitPrice - disc);
    const vat = (sub * editVatRate) / 100;

    newItems[idx] = {
      ...current,
      quantity: qty,
      subtotal: sub,
      vatAmount: vat,
      total: sub + vat,
    };
    setEditReturnItems(newItems);
  };

  const handleEditPriceChange = (idx: number, price: number) => {
    const newItems = [...editReturnItems];
    const current = newItems[idx];
    const unitPrice = Math.max(0, price);
    const disc = current.discount || 0;
    const sub = Math.max(0, current.quantity * unitPrice - disc);
    const vat = (sub * editVatRate) / 100;

    newItems[idx] = {
      ...current,
      unitPrice,
      subtotal: sub,
      vatAmount: vat,
      total: sub + vat,
    };
    setEditReturnItems(newItems);
  };

  const handleEditDiscountChange = (idx: number, discountVal: number) => {
    const newItems = [...editReturnItems];
    const current = newItems[idx];
    const cleanDiscount = Math.max(0, discountVal);
    const sub = Math.max(0, current.quantity * current.unitPrice - cleanDiscount);
    const vat = (sub * editVatRate) / 100;

    newItems[idx] = {
      ...current,
      discount: cleanDiscount,
      subtotal: sub,
      vatAmount: vat,
      total: sub + vat,
    };
    setEditReturnItems(newItems);
  };

  const handleEditRemoveRow = (idx: number) => {
    if (editReturnItems.length <= 1) return;
    setEditReturnItems(editReturnItems.filter((_, i) => i !== idx));
  };

  const handleAddEditAccountItemRow = () => {
    const prod = products[0];
    if (!prod) return;
    const sub = prod.sellingPrice;
    const vat = (sub * editVatRate) / 100;
    setEditReturnItems([
      ...editReturnItems,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        unitPrice: prod.sellingPrice,
        discount: 0,
        subtotal: sub,
        vatAmount: vat,
        total: sub + vat,
        reason: 'صنف مضاف للمرتجع',
      },
    ]);
  };

  const editSubtotal = editReturnItems.reduce((s, it) => s + it.subtotal, 0);
  const editVatTotal = editReturnItems.reduce((s, it) => s + it.vatAmount, 0);
  const editTotalRefundAmount = editSubtotal + editVatTotal;

  const handleSaveEditReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReturn) return;
    if (editReturnItems.length === 0) {
      showAlert({
        title: 'أصناف المرتجع',
        message: 'يرجى إضافة صنف واحد على الأقل للمرتجع لحفظ التعديلات.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    editSalesReturn(editingReturn.id, {
      date: editReturnDate,
      reason: editReason,
      refundMethod: editRefundMethod,
      items: editReturnItems,
      subtotal: editSubtotal,
      vatRate: editVatRate,
      vatTotal: editVatTotal,
      totalRefundAmount: editTotalRefundAmount,
    });

    setShowEditModal(false);
    setEditingReturn(null);
  };

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) {
      showAlert({
        title: 'تحديد العميل',
        message: 'يرجى اختيار العميل أولاً.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }
    if (returnItems.length === 0) {
      showAlert({
        title: 'أصناف المرتجع',
        message: 'يرجى إضافة صنف واحد على الأقل للمرتجع.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    const selectedInv = salesInvoices.find((i) => i.id === selectedInvoiceId);

    const doc = addSalesReturn({
      type: returnType,
      invoiceId: returnType === 'from_invoice' ? selectedInvoiceId : undefined,
      invoiceNumber: returnType === 'from_invoice' ? selectedInv?.invoiceNumber : undefined,
      customerId: customer.id,
      customerName: customer.name,
      date: returnDate,
      reason,
      refundMethod,
      items: returnItems,
      subtotal,
      vatRate,
      vatTotal,
      totalRefundAmount,
    });

    setShowCreateModal(false);
    setSelectedReturn(doc);
    setShowPrintModal(true);
  };

  const handleExportPdf = async () => {
    if (!selectedReturn) return;
    setIsExportingPdf(true);
    try {
      await exportElementToPdf('sales-return-document-sheet', {
        filename: `إشعار_دائن_مرتجع_${selectedReturn.returnNumber}.pdf`,
      });
    } catch (e) {
      console.error(e);
      showAlert({
        title: 'تصدير PDF',
        message: 'حدث خطأ أثناء تصدير ملف PDF، يرجى المحاولة مرة أخرى أو استخدام خيار الطباعة المباشرة.',
        type: 'error',
        confirmText: 'فهمت',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const filteredReturns = salesReturns.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.returnNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-600" />
            مردودات ومسموحات المبيعات (Sales Returns & Credit Notes)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إصدار إشعارات دائنة للمرتجعات من الفاتورة أو من حساب العميل مباشرة مع استرجاع المخزون والتسوية المحاسبية
          </p>
        </div>

        <button
          id="create-sales-return-btn"
          onClick={() => {
            setShowCreateModal(true);
            if (salesInvoices.length > 0) {
              handleSelectInvoice(salesInvoices[0].id);
            }
          }}
          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          إصدار إشعار مرتجع جديد
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="البحث برقم المرتجع، اسم العميل، أو رقم الفاتورة الأصلية..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pr-9 pl-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          إجمالي الإشعارات: <span className="text-slate-900 font-bold">{salesReturns.length} إشعار دائن</span>
        </div>
      </div>

      {/* Returns List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">رقم الإشعار</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">العميل</th>
                <th className="py-3 px-4">نوع المرتجع</th>
                <th className="py-3 px-4">الفاتورة الأصلية</th>
                <th className="py-3 px-4">طريقة الاسترداد</th>
                <th className="py-3 px-4 text-left">قيمة المرتجع</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    لا توجد إشعارات مردودات مبيعات مسجلة حتى الآن.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{ret.returnNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{ret.date}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{ret.customerName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {ret.type === 'from_invoice' ? 'من فاتورة' : 'من حساب العميل'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {ret.invoiceNumber ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded">{ret.invoiceNumber}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {ret.refundMethod === 'customer_balance' ? (
                        <span className="text-blue-700">خصم من رصيد العميل</span>
                      ) : ret.refundMethod === 'cash_vault' ? (
                        <span className="text-emerald-700">صرف نقدي من الخزينة</span>
                      ) : (
                        <span className="text-purple-700">تحويل بنكي</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-left font-mono font-extrabold text-rose-700 text-sm">
                      {formatMoney(ret.totalRefundAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setStatementCustomerId(ret.customerId)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="كشف حساب العميل"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ret)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="تعديل بيانات المرتجع"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReturn(ret);
                            setShowPrintModal(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="طباعة ومعاينة الإشعار"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            showConfirm(
                              `هل أنت متأكد من حذف إشعار المرتجع رقم ${ret.returnNumber}؟`,
                              () => {
                                deleteSalesReturn(ret.id);
                              },
                              `تأكيد حذف المرتجع (${ret.returnNumber})`,
                              'حذف المرتجع'
                            );
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="حذف المرتجع"
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

      {/* CREATE RETURN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-auto max-h-[95vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">إصدار إشعار دائن مرتجع مبيعات جديد</h3>
                  <p className="text-xs text-slate-500">
                    استرجاع الكميات للمخزن مع الخصم من حساب العميل أو الصرف المباشر
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl font-bold text-center">
                <button
                  type="button"
                  onClick={() => {
                    setReturnType('from_invoice');
                    if (salesInvoices.length > 0) handleSelectInvoice(salesInvoices[0].id);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    returnType === 'from_invoice'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مرتجع من فاتورة مبيعات سابقة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReturnType('from_account');
                    handleAddAccountItemRow();
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    returnType === 'from_account'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مرتجع مباشر من حساب العميل (قيمة وكمية)
                </button>
              </div>

              {/* Form Row 1: Invoice or Customer Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {returnType === 'from_invoice' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">اختر الفاتورة الأصلية:</label>
                    <select
                      value={selectedInvoiceId}
                      onChange={(e) => handleSelectInvoice(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                      required
                    >
                      {salesInvoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} - {inv.customerName} ({formatMoney(inv.grandTotal)})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">اختر العميل:</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                      required
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.companyName ? `(${c.companyName})` : ''} - رصيد: {formatMoney(c.currentBalance)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ المرتجع:</label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Form Row 2: Refund Method & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">طريقة معالجة الاسترداد والتعويض:</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-amber-800"
                  >
                    <option value="customer_balance">خصم القيمة من رصيد ومديونية العميل (Credit Customer Account)</option>
                    <option value="cash_vault">صرف واسترداد نقدي فوري من الخزينة (Cash Refund)</option>
                    <option value="bank">تحويل بنكي مسترد (Bank Refund)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">سبب الاسترجاع:</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="مثال: عيب مصنعي، استبدال، فائض..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Return Items Table */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">الأصناف والكميات المرتجعة</span>
                  {returnType === 'from_account' && (
                    <button
                      type="button"
                      onClick={handleAddAccountItemRow}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      إضافة صنف مرتجع
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {returnItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-200 items-center text-xs"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-500 mb-0.5">الصنف</label>
                        {returnType === 'from_invoice' ? (
                          <div className="font-bold text-slate-900 truncate">{item.productName}</div>
                        ) : (
                          <select
                            value={item.productId}
                            onChange={(e) => {
                              const prod = products.find((p) => p.id === e.target.value);
                              if (prod) {
                                const newItems = [...returnItems];
                                const sub = prod.sellingPrice * newItems[idx].quantity;
                                const vat = (sub * vatRate) / 100;
                                newItems[idx] = {
                                  ...newItems[idx],
                                  productId: prod.id,
                                  productName: prod.name,
                                  unitPrice: prod.sellingPrice,
                                  discount: 0,
                                  subtotal: sub,
                                  vatAmount: vat,
                                  total: sub + vat,
                                };
                                setReturnItems(newItems);
                              }
                            }}
                            className="w-full p-1.5 rounded-lg border border-slate-300 font-medium"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">الكمية (تقبل معادلات)</label>
                        <input
                          type="text"
                          defaultValue={item.quantity}
                          key={`qty-${idx}-${item.quantity}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Tab') {
                              handleQuantityMath(idx, (e.target as HTMLInputElement).value);
                            }
                          }}
                          onBlur={(e) => handleQuantityMath(idx, e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-center bg-white"
                          title="يمكنك كتابة معادلات مثل 2*5 أو 10/2 والضغط على Enter"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">سعر الوحدة</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                          className="w-full p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-center bg-white"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] text-slate-500 mb-0.5">الخصم</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.discount || 0}
                          onChange={(e) => handleDiscountChange(idx, Number(e.target.value))}
                          className="w-full p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-center text-rose-700 bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2 text-left">
                        <label className="block text-[10px] text-slate-500 mb-0.5">الإجمالي مع الضريبة</label>
                        <div className="font-extrabold text-rose-700 py-1 truncate">{formatMoney(item.total)}</div>
                      </div>

                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary Card */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>المجموع قبل الضريبة:</span>
                  <span className="font-bold text-white">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>ضريبة القيمة المضافة ({vatRate}%):</span>
                  <span className="font-bold text-emerald-400">{formatMoney(vatTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700 pt-2">
                  <span>إجمالي قيمة المرتجع المسترد:</span>
                  <span className="text-amber-400 text-base">{formatMoney(totalRefundAmount)}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  إصدار الإشعار الدائن وترحيل القيود
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE CREDIT NOTE PREVIEW MODAL */}
      {showPrintModal && selectedReturn && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto max-h-[96vh] overflow-y-auto text-slate-900">
            {/* Action Bar (Hidden in Print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">معاينة إشعار دائن مردودات مبيعات</span>
                <span className="bg-amber-50 text-amber-800 text-xs px-2.5 py-0.5 rounded-md font-bold border border-amber-200">
                  إشعار دائن معتمد
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExportingPdf ? 'جاري التصدير...' : 'تصدير PDF'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة الإشعار
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl border border-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Credit Note Document Sheet */}
            <div id="sales-return-document-sheet" className="border border-slate-300 p-6 rounded-xl space-y-6 text-xs">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  {companyProfile.logoBase64 ? (
                    <img
                      src={companyProfile.logoBase64}
                      alt={companyProfile.nameAr}
                      style={{ width: `${companyProfile.logoWidth || 130}px` }}
                      className="max-h-16 object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                      {companyProfile.nameAr.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-extrabold text-slate-900">{companyProfile.nameAr}</h1>
                    <p className="text-xs text-slate-500">س.ت: {companyProfile.commercialRegister} | الرقم الضريبي: {companyProfile.taxNumber}</p>
                    <p className="text-[11px] text-slate-500">{companyProfile.address}</p>
                  </div>
                </div>

                <div className="text-left space-y-1">
                  <div className="inline-block bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-md">
                    إشعار دائن مرتجع CREDIT NOTE
                  </div>
                  <div className="font-mono font-extrabold text-sm text-slate-900">
                    {selectedReturn.returnNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">التاريخ: {selectedReturn.date}</div>
                </div>
              </div>

              {/* Return Meta Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-semibold">بيانات العميل:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedReturn.customerName}</div>
                  <div className="text-slate-600 mt-0.5">
                    طريقة التسوية: {selectedReturn.refundMethod === 'customer_balance' ? 'خصم من رصيد العميل' : selectedReturn.refundMethod === 'cash_vault' ? 'صرف نقدي فوري' : 'تحويل بنكي'}
                  </div>
                </div>
                <div className="text-left space-y-1">
                  <div>
                    <span className="text-slate-500">الفاتورة المرجعية: </span>
                    <span className="font-mono font-bold text-slate-900">{selectedReturn.invoiceNumber || 'مرتجع مباشر'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">السبب: </span>
                    <span className="font-medium text-slate-800">{selectedReturn.reason || 'مردودات مبيعات'}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-right text-xs border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">الصنف المسترجع</th>
                    <th className="py-2.5 px-3 text-center">الكمية</th>
                    <th className="py-2.5 px-3">سعر الوحدة</th>
                    <th className="py-2.5 px-3">المجموع قبل الضريبة</th>
                    <th className="py-2.5 px-3">مبلغ الضريبة</th>
                    <th className="py-2.5 px-3 text-left">إجمالي المرتجع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedReturn.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{it.productName}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{it.quantity}</td>
                      <td className="py-2.5 px-3 font-mono">{formatMoney(it.unitPrice)}</td>
                      <td className="py-2.5 px-3 font-mono">{formatMoney(it.subtotal)}</td>
                      <td className="py-2.5 px-3 font-mono">{formatMoney(it.vatAmount)}</td>
                      <td className="py-2.5 px-3 text-left font-mono font-extrabold text-rose-700">
                        {formatMoney(it.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculation Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-72 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>الإجمالي قبل الضريبة:</span>
                    <span className="font-bold">{formatMoney(selectedReturn.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ضريبة القيمة المضافة ({selectedReturn.vatRate}%):</span>
                    <span className="font-bold text-emerald-700">{formatMoney(selectedReturn.vatTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-300 pt-1.5">
                    <span>إجمالي قيمة المرتجع:</span>
                    <span className="text-amber-700">{formatMoney(selectedReturn.totalRefundAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-6 text-center text-xs text-slate-600">
                <div>
                  <span className="font-bold block mb-8">أمين المخزن (استلام البضاعة المرتجعة)</span>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                </div>
                <div>
                  <span className="font-bold block mb-8">الإدارة المالية (اعتماد الإشعار الدائن)</span>
                  <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RETURN MODAL */}
      {showEditModal && editingReturn && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-auto max-h-[95vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    تعديل إشعار المرتجع: {editingReturn.returnNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    العميل: <span className="font-bold text-slate-800">{editingReturn.customerName}</span>
                    {editingReturn.invoiceNumber && ` | الفاتورة: ${editingReturn.invoiceNumber}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReturn(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditReturn} className="space-y-4 text-xs">
              {/* Form Row 1: Date & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ المرتجع:</label>
                  <input
                    type="date"
                    value={editReturnDate}
                    onChange={(e) => setEditReturnDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">سبب الاسترجاع:</label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="سبب المرتجع..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Form Row 2: Refund Method & Tax Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">طريقة معالجة الاسترداد والتعويض:</label>
                  <select
                    value={editRefundMethod}
                    onChange={(e) => setEditRefundMethod(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-blue-800"
                  >
                    <option value="customer_balance">خصم القيمة من رصيد ومديونية العميل (Credit Customer Account)</option>
                    <option value="cash_vault">صرف واسترداد نقدي فوري من الخزينة (Cash Refund)</option>
                    <option value="bank">تحويل بنكي مسترد (Bank Refund)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نسبة ضريبة القيمة المضافة %:</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editVatRate}
                    onChange={(e) => setEditVatRate(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Return Items Table */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">الأصناف والكميات المرتجعة</span>
                  <button
                    type="button"
                    onClick={handleAddEditAccountItemRow}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    إضافة صنف
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editReturnItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-200 items-center text-xs"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-500 mb-0.5">الصنف</label>
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const prod = products.find((p) => p.id === e.target.value);
                            if (prod) {
                              const newItems = [...editReturnItems];
                              const sub = prod.sellingPrice * newItems[idx].quantity;
                              const vat = (sub * editVatRate) / 100;
                              newItems[idx] = {
                                ...newItems[idx],
                                productId: prod.id,
                                productName: prod.name,
                                unitPrice: prod.sellingPrice,
                                discount: 0,
                                subtotal: sub,
                                vatAmount: vat,
                                total: sub + vat,
                              };
                              setEditReturnItems(newItems);
                            }
                          }}
                          className="w-full p-1.5 rounded-lg border border-slate-300 font-medium"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">الكمية (تقبل معادلات)</label>
                        <input
                          type="text"
                          defaultValue={item.quantity}
                          key={`edit-qty-${idx}-${item.quantity}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Tab') {
                              handleEditQuantityMath(idx, (e.target as HTMLInputElement).value);
                            }
                          }}
                          onBlur={(e) => handleEditQuantityMath(idx, e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-center bg-white"
                          title="يمكنك كتابة معادلات مثل 2*5 أو 10/2 والضغط على Enter"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">سعر الوحدة</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleEditPriceChange(idx, Number(e.target.value))}
                          className="w-full p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-center bg-white"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-[10px] text-slate-500 mb-0.5">الخصم</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.discount || 0}
                          onChange={(e) => handleEditDiscountChange(idx, Number(e.target.value))}
                          className="w-full p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-center text-rose-700 bg-white"
                        />
                      </div>

                      <div className="sm:col-span-2 text-left">
                        <label className="block text-[10px] text-slate-500 mb-0.5">الإجمالي مع الضريبة</label>
                        <div className="font-extrabold text-rose-700 py-1 truncate">{formatMoney(item.total)}</div>
                      </div>

                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleEditRemoveRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary Card */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>المجموع قبل الضريبة:</span>
                  <span className="font-bold text-white">{formatMoney(editSubtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>ضريبة القيمة المضافة ({editVatRate}%):</span>
                  <span className="font-bold text-emerald-400">{formatMoney(editVatTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700 pt-2">
                  <span>إجمالي قيمة المرتجع المعدل:</span>
                  <span className="text-amber-400 text-base">{formatMoney(editTotalRefundAmount)}</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingReturn(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  حفظ التعديلات وترحيل الأرصدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER STATEMENT MODAL */}
      {statementCustomerId && (
        <CustomerStatementModal
          customerId={statementCustomerId}
          onClose={() => setStatementCustomerId(null)}
        />
      )}
    </div>
  );
};
