import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { PaymentReceipt, PurchaseInvoice, Vendor } from '../types';
import { ProductSelectSearch } from './ProductSelectSearch';
import { MathQuantityInput } from './MathQuantityInput';
import {
  ShoppingCart,
  PlusCircle,
  Search,
  Building,
  CreditCard,
  X,
  Package,
  Edit3,
  Trash2,
} from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const {
    vendors,
    purchaseInvoices,
    products,
    accounts,
    companyProfile,
    formatMoney,
    canDeleteEntity,
    addVendor,
    editVendor,
    deleteVendor,
    addPurchaseInvoice,
    editPurchaseInvoice,
    deletePurchaseInvoice,
    recordVendorPayment,
    hasPermission,
    activeSubTab: globalSubTab,
    setActiveSubTab: setGlobalSubTab,
    showAlert,
    showConfirm,
  } = useErp();

  const [activeSubTab, setActiveSubTabLocal] = useState<'bills' | 'vendors'>('bills');

  React.useEffect(() => {
    if (globalSubTab && ['bills', 'vendors'].includes(globalSubTab)) {
      setActiveSubTabLocal(globalSubTab as any);
    }
  }, [globalSubTab]);

  const setActiveSubTab = (tab: 'bills' | 'vendors') => {
    setActiveSubTabLocal(tab);
    setGlobalSubTab(tab);
  };
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [showCreateBillModal, setShowCreateBillModal] = useState(false);
  const [showEditBillModal, setShowEditBillModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<PurchaseInvoice | null>(null);

  // New Vendor Form
  const [vendorName, setVendorName] = useState('');
  const [vendorCompany, setVendorCompany] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorTax, setVendorTax] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorTerms, setVendorTerms] = useState(30);

  // Edit Vendor Form
  const [editVendorId, setEditVendorId] = useState('');
  const [editVendorName, setEditVendorName] = useState('');
  const [editVendorCompany, setEditVendorCompany] = useState('');
  const [editVendorPhone, setEditVendorPhone] = useState('');
  const [editVendorEmail, setEditVendorEmail] = useState('');
  const [editVendorTax, setEditVendorTax] = useState('');
  const [editVendorAddress, setEditVendorAddress] = useState('');
  const [editVendorTerms, setEditVendorTerms] = useState(30);

  // New Bill Form
  const [billVendorId, setBillVendorId] = useState(vendors[0]?.id || '');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billDueDate, setBillDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [billVatRate, setBillVatRate] = useState<number>(companyProfile.defaultVatRate ?? 15);
  const [billNotes, setBillNotes] = useState('');
  const [billItems, setBillItems] = useState([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      quantity: 5,
      unitPrice: products[0]?.costPrice || 100,
      total: (products[0]?.costPrice || 100) * 5,
    },
  ]);

  // Edit Bill Form
  const [editBillId, setEditBillId] = useState('');
  const [editBillVendorId, setEditBillVendorId] = useState('');
  const [editBillDate, setEditBillDate] = useState('');
  const [editBillDueDate, setEditBillDueDate] = useState('');
  const [editBillVatRate, setEditBillVatRate] = useState<number>(companyProfile.defaultVatRate ?? 15);
  const [editBillNotes, setEditBillNotes] = useState('');
  const [editBillItems, setEditBillItems] = useState<any[]>([]);

  // Payment Form
  const [payAmount, setPayAmount] = useState(0);
  const [payAccountId, setPayAccountId] = useState(accounts.find((a) => a.code === '1120')?.id || '');
  const [payMethod, setPayMethod] = useState<PaymentReceipt['paymentMethod']>('bank_transfer');

  const selectedVendor = vendors.find((v) => v.id === billVendorId);

  const defaultVat = companyProfile.defaultVatRate ?? 15;

  const billSubtotal = billItems.reduce((sum, i) => sum + i.total, 0);
  const billVat = billVatRate > 0 ? (billSubtotal * billVatRate) / 100 : 0;
  const billGrandTotal = billSubtotal + billVat;

  const editBillSubtotal = editBillItems.reduce((sum, i) => sum + i.total, 0);
  const editBillVat = editBillVatRate > 0 ? (editBillSubtotal * editBillVatRate) / 100 : 0;
  const editBillGrandTotal = editBillSubtotal + editBillVat;

  const canEditBill = hasPermission('edit_purchases');
  const canDeleteBill = hasPermission('delete_purchases');
  const canEditVend = hasPermission('edit_vendors');
  const canDeleteVend = hasPermission('delete_vendors');

  const handleAddBillItem = () => {
    const p = products[0];
    if (!p) return;
    setBillItems((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        quantity: 1,
        unitPrice: p.costPrice || 100,
        total: (p.costPrice || 100) * 1,
      },
    ]);
  };

  const handleRemoveBillItem = (index: number) => {
    if (billItems.length <= 1) return;
    setBillItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBillProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    setBillItems((prev) => {
      const next = [...prev];
      const currentQty = next[index]?.quantity || 1;
      next[index] = {
        productId: prod.id,
        productName: prod.name,
        quantity: currentQty,
        unitPrice: prod.costPrice || 100,
        total: (prod.costPrice || 100) * currentQty,
      };
      return next;
    });
  };

  const handleBillItemValueChange = (index: number, field: 'quantity' | 'unitPrice', val: number) => {
    setBillItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === 'quantity') {
        item.quantity = Math.max(1, val);
      } else if (field === 'unitPrice') {
        item.unitPrice = Math.max(0, val);
      }
      item.total = item.quantity * item.unitPrice;
      next[index] = item;
      return next;
    });
  };

  const handleAddEditBillItem = () => {
    const p = products[0];
    if (!p) return;
    setEditBillItems((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        quantity: 1,
        unitPrice: p.costPrice || 100,
        total: (p.costPrice || 100) * 1,
      },
    ]);
  };

  const handleRemoveEditBillItem = (index: number) => {
    if (editBillItems.length <= 1) return;
    setEditBillItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditBillProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    setEditBillItems((prev) => {
      const next = [...prev];
      const currentQty = next[index]?.quantity || 1;
      next[index] = {
        productId: prod.id,
        productName: prod.name,
        quantity: currentQty,
        unitPrice: prod.costPrice || 100,
        total: (prod.costPrice || 100) * currentQty,
      };
      return next;
    });
  };

  const handleEditBillItemValueChange = (index: number, field: 'quantity' | 'unitPrice', val: number) => {
    setEditBillItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === 'quantity') {
        item.quantity = Math.max(1, val);
      } else if (field === 'unitPrice') {
        item.unitPrice = Math.max(0, val);
      }
      item.total = item.quantity * item.unitPrice;
      next[index] = item;
      return next;
    });
  };

  const handleOpenEditBill = (bill: PurchaseInvoice) => {
    if (!canEditBill) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لتعديل فواتير المشتريات. يرجى مراجعة المسؤول.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setEditBillId(bill.id);
    setEditBillVendorId(bill.vendorId);
    setEditBillDate(bill.date);
    setEditBillDueDate(bill.dueDate);
    setEditBillItems([...bill.items]);
    setEditBillNotes(bill.notes || '');
    const impliedVatRate = bill.subtotal > 0 ? Math.round((bill.vatTotal / bill.subtotal) * 100) : (companyProfile.defaultVatRate ?? 15);
    setEditBillVatRate(impliedVatRate);
    setShowEditBillModal(true);
  };

  const handleDeleteBill = (bill: PurchaseInvoice) => {
    if (!canDeleteBill) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لحذف فواتير المشتريات.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    const check = canDeleteEntity('purchase', bill.id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف فاتورة المشتريات (${bill.invoiceNumber})`,
        message: 'لا يمكن حذف فاتورة الشراء للأسباب التالية:',
        details: check.reason,
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    showConfirm(
      `هل أنت متأكد من حذف فاتورة الشراء رقم ${bill.invoiceNumber}؟ سيتم إلغاء الترحيلات وإلغاء استلام المخزون.`,
      () => {
        deletePurchaseInvoice(bill.id);
      },
      `تأكيد حذف فاتورة الشراء (${bill.invoiceNumber})`,
      'حذف الفاتورة'
    );
  };

  const handleOpenEditVendor = (v: Vendor) => {
    if (!canEditVend) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لتعديل بيانات الموردين.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setEditVendorId(v.id);
    setEditVendorName(v.name);
    setEditVendorCompany(v.companyName || '');
    setEditVendorPhone(v.phone || '');
    setEditVendorEmail(v.email || '');
    setEditVendorTax(v.taxNumber || '');
    setEditVendorAddress(v.address || '');
    setEditVendorTerms(v.paymentTermsDays || 30);
    setShowEditVendorModal(true);
  };

  const handleDeleteVendor = (v: Vendor) => {
    if (!canDeleteVend) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لحذف الموردين.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    const check = canDeleteEntity('vendor', v.id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف المورد (${v.name})`,
        message: 'لا يمكن حذف المورد من السجلات للأسباب التالية:',
        details: check.reason,
        note: 'للحفاظ على تكامل قيود المشتريات وحسابات الدائنين، يُمنع حذف الموردين الذين لديهم حركات.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    showConfirm(
      `هل أنت متأكد من حذف المورد "${v.name}" نهائياً من النظام؟`,
      () => {
        deleteVendor(v.id);
      },
      `تأكيد حذف المورد (${v.name})`,
      'حذف المورد'
    );
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName) return;
    addVendor({
      name: vendorName,
      companyName: vendorCompany,
      phone: vendorPhone,
      email: vendorEmail,
      taxNumber: vendorTax,
      address: vendorAddress,
      paymentTermsDays: vendorTerms,
    });
    setShowAddVendorModal(false);
    setVendorName('');
    setVendorPhone('');
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) {
      showAlert({
        title: 'تحديد المورد',
        message: 'يرجى اختيار المورد المعتمد للفاتورة أولاً.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    addPurchaseInvoice({
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      date: billDate,
      dueDate: billDueDate,
      items: billItems,
      subtotal: billSubtotal,
      vatTotal: billVat,
      grandTotal: billGrandTotal,
      notes: billNotes,
    });

    setShowCreateBillModal(false);
    setBillNotes('');
  };

  const handlePayVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || payAmount <= 0) return;
    recordVendorPayment(selectedBill.id, payAmount, payAccountId, payMethod);
    setShowPayModal(false);
    setSelectedBill(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            المشتريات وإدارة الموردين وحسابات الدائنين
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إثبات فواتير التوريد، وزيادة أرصدة المخزون آلياً، ومتابعة التزامات السداد للموردين
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('bills')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'bills'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              فواتير المشتريات ({purchaseInvoices.length})
            </button>
            <button
              onClick={() => setActiveSubTab('vendors')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'vendors'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سجل الموردين ({vendors.length})
            </button>
          </div>

          <button
            onClick={() => setShowAddVendorModal(true)}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition-all border border-slate-300"
          >
            <PlusCircle className="w-4 h-4 text-slate-600" />
            مورد جديد
          </button>

          <button
            onClick={() => setShowCreateBillModal(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            فاتورة مشتريات
          </button>
        </div>
      </div>

      {/* Subtab 1: Bills */}
      {activeSubTab === 'bills' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">رقم الفاتورة</th>
                  <th className="py-3 px-4">اسم المورد</th>
                  <th className="py-3 px-4">تاريخ التوريد</th>
                  <th className="py-3 px-4">تاريخ الاستحقاق</th>
                  <th className="py-3 px-4">المبلغ قبل الضريبة</th>
                  <th className="py-3 px-4">ضريبة المدخلات {defaultVat}%</th>
                  <th className="py-3 px-4">إجمالي الفاتورة</th>
                  <th className="py-3 px-4">المسدد</th>
                  <th className="py-3 px-4">المتبقي للدفع</th>
                  <th className="py-3 px-4">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseInvoices.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {bill.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{bill.vendorName}</td>
                    <td className="py-3 px-4 text-slate-600">{bill.date}</td>
                    <td className="py-3 px-4 text-slate-600">{bill.dueDate}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{formatMoney(bill.subtotal)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatMoney(bill.vatTotal)}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">
                      {formatMoney(bill.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">{formatMoney(bill.paidAmount)}</td>
                    <td className="py-3 px-4 text-rose-700 font-extrabold">{formatMoney(bill.remainingAmount)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {bill.remainingAmount > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedBill(bill);
                              setPayAmount(bill.remainingAmount);
                              setShowPayModal(true);
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] cursor-pointer"
                          >
                            سداد دفعة
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px]">تم السداد</span>
                        )}

                        <button
                          onClick={() => handleOpenEditBill(bill)}
                          disabled={!canEditBill}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            canEditBill
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                              : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          }`}
                          title={canEditBill ? 'تعديل فاتورة المشتريات' : 'ليس لديك صلاحية تعديل فواتير المشتريات'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteBill(bill)}
                          disabled={!canDeleteBill}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            canDeleteBill
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          }`}
                          title={canDeleteBill ? 'حذف فاتورة المشتريات' : 'ليس لديك صلاحية حذف فواتير المشتريات'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Vendors */}
      {activeSubTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((v) => (
            <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">
                      {v.code}
                    </span>
                    <h3 className="font-bold text-slate-900">{v.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{v.companyName}</p>
                </div>
                <div className="text-left">
                  <span className="text-[11px] text-slate-400 block">رصيد المورد المستحق:</span>
                  <span className="font-extrabold text-rose-700 text-base">{formatMoney(v.currentBalance)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div>الهاتف: {v.phone} | البريد: {v.email}</div>
                {v.taxNumber && <div className="font-mono">الرقم الضريبي: {v.taxNumber}</div>}
                <div>فترة الائتمان المتفق عليها: {v.paymentTermsDays} يوماً</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEditVendor(v)}
                  disabled={!canEditVend}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                    canEditVend
                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                      : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title={canEditVend ? 'تعديل بيانات المورد' : 'ليس لديك صلاحية تعديل الموردين'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  تعديل
                </button>
                <button
                  onClick={() => handleDeleteVendor(v)}
                  disabled={!canDeleteVend}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                    canDeleteVend
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title={canDeleteVend ? 'حذف المورد' : 'ليس لديك صلاحية حذف الموردين'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Add Vendor */}
      {showAddVendorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">إضافة مورد جديد</h3>
              <button onClick={() => setShowAddVendorModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVendor} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم المورد أو الشركة</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الهاتف</label>
                  <input
                    type="text"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الرقم الضريبي</label>
                  <input
                    type="text"
                    value={vendorTax}
                    onChange={(e) => setVendorTax(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2 text-slate-600 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1.5: Edit Vendor */}
      {showEditVendorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                تعديل بيانات المورد
              </h3>
              <button onClick={() => setShowEditVendorModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editVendor(editVendorId, {
                  name: editVendorName,
                  companyName: editVendorCompany,
                  phone: editVendorPhone,
                  email: editVendorEmail,
                  taxNumber: editVendorTax,
                  address: editVendorAddress,
                  paymentTermsDays: editVendorTerms,
                });
                setShowEditVendorModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم المورد</label>
                <input
                  type="text"
                  required
                  value={editVendorName}
                  onChange={(e) => setEditVendorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الهاتف</label>
                  <input
                    type="text"
                    value={editVendorPhone}
                    onChange={(e) => setEditVendorPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الرقم الضريبي</label>
                  <input
                    type="text"
                    value={editVendorTax}
                    onChange={(e) => setEditVendorTax(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">فترة الائتمان (بالأيام)</label>
                <input
                  type="number"
                  min="0"
                  value={editVendorTerms}
                  onChange={(e) => setEditVendorTerms(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditVendorModal(false)}
                  className="px-4 py-2 text-slate-600 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2.5: Edit Purchase Bill */}
      {showEditBillModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  تعديل فاتورة المشتريات والتوريد المخزني
                </h3>
                <p className="text-xs text-slate-500">
                  تعديل أصناف وكميات الفاتورة وتحديث أرصدة المخازن وحسابات المورد المعتمد
                </p>
              </div>
              <button
                onClick={() => setShowEditBillModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const vend = vendors.find((v) => v.id === editBillVendorId);
                if (!vend) {
                  showAlert({
                    title: 'تحديد المورد',
                    message: 'يرجى اختيار المورد المعتمد للفاتورة أولاً.',
                    type: 'warning',
                    confirmText: 'فهمت',
                  });
                  return;
                }
                editPurchaseInvoice(editBillId, {
                  vendorId: vend.id,
                  vendorName: vend.name,
                  date: editBillDate,
                  dueDate: editBillDueDate,
                  items: editBillItems,
                  subtotal: editBillSubtotal,
                  vatTotal: editBillVat,
                  grandTotal: editBillGrandTotal,
                  notes: editBillNotes,
                });
                setShowEditBillModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المورد المعتمد</label>
                  <select
                    value={editBillVendorId}
                    onChange={(e) => setEditBillVendorId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الفاتورة / التوريد</label>
                  <input
                    type="date"
                    required
                    value={editBillDate}
                    onChange={(e) => setEditBillDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    required
                    value={editBillDueDate}
                    onChange={(e) => setEditBillDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نسبة ضريبة المدخلات (VAT)</label>
                  <select
                    value={editBillVatRate}
                    onChange={(e) => setEditBillVatRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  >
                    <option value={defaultVat}>{defaultVat}% (الافتراضي للشركة)</option>
                    {defaultVat !== 15 && <option value="15">15% (السعودية ZATCA)</option>}
                    {defaultVat !== 14 && <option value="14">14% (مصر - قيمة مضافة)</option>}
                    {defaultVat !== 5 && <option value="5">5% (الإمارات / عمان)</option>}
                    <option value="0">0% (معفى من الضريبة)</option>
                  </select>
                </div>
              </div>

              {/* Items Section (Single Horizontal Row Layout) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm">الأصناف والبنود الموردة</span>
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {editBillItems.length} {editBillItems.length === 1 ? 'بند' : 'بنود'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEditBillItem}
                    className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 text-xs shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + إضافة بند
                  </button>
                </div>

                {/* Table Column Headers on Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100/90 rounded-xl text-[11px] font-bold text-slate-600">
                  <div className="col-span-5">الصنف والمنتج</div>
                  <div className="col-span-2 text-center">الكمية الموردة (يدعم 5*10)</div>
                  <div className="col-span-2 text-center">سعر التكلفة / الوحدة</div>
                  <div className="col-span-3 text-center">إجمالي البند</div>
                </div>

                {/* Single Row Item Cards */}
                <div className="space-y-2">
                  {editBillItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 sm:p-2 rounded-xl bg-white border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2 items-center hover:border-slate-300 transition-colors"
                    >
                      {/* Product Selector */}
                      <div className="sm:col-span-5">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">
                          بند #{idx + 1}: الصنف والمنتج
                        </label>
                        <ProductSelectSearch
                          selectedProductId={item.productId}
                          onSelectProduct={(prod) => handleEditBillProductChange(idx, prod.id)}
                        />
                      </div>

                      {/* Quantity with Math calculator */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">الكمية</label>
                        <MathQuantityInput
                          value={item.quantity}
                          onChange={(newQty) => handleEditBillItemValueChange(idx, 'quantity', newQty)}
                          min={1}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                        />
                      </div>

                      {/* Unit Cost Price */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">سعر التكلفة</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleEditBillItemValueChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                        />
                      </div>

                      {/* Item Total & Delete on Single Line */}
                      <div className="sm:col-span-3 flex items-center justify-between gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex-1 text-center font-extrabold text-xs text-blue-700 font-mono py-1">
                          {formatMoney(item.total)}
                        </div>
                        {editBillItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditBillItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                            title="حذف البند"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Item Row Button */}
                <button
                  type="button"
                  onClick={handleAddEditBillItem}
                  className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50 text-blue-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>+ إضافة بند جديد للفاتورة</span>
                </button>
              </div>

              {/* Purchase Summary Box */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 shadow-xs border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>إجمالي الأصناف الموردة قبل الضريبة:</span>
                  <span className="font-semibold text-white">{formatMoney(editBillSubtotal)}</span>
                </div>
                {editBillVatRate > 0 ? (
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>ضريبة القيمة المضافة / المدخلات ({editBillVatRate}% VAT):</span>
                    <span className="font-bold text-emerald-400">+{formatMoney(editBillVat)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>ضريبة القيمة المضافة:</span>
                    <span className="font-bold text-slate-400">0% (معفى من الضريبة)</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700/80 pt-2 mt-1">
                  <span>المبلغ الإجمالي المعدل للمشتريات:</span>
                  <span className="text-emerald-400 text-base font-black">{formatMoney(editBillGrandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات الفاتورة ورقم إذن التوريد / السند الورقي</label>
                <textarea
                  rows={2}
                  value={editBillNotes}
                  onChange={(e) => setEditBillNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات عن الفاتورة أو رقم سند التوريد الورقي للمورد..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditBillModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  حفظ تعديلات الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Bill */}
      {showCreateBillModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  تسجيل فاتورة مشتريات وتوريد مخزني
                </h3>
                <p className="text-xs text-slate-500">
                  تسجيل استلام بضاعة ومشتريات، وتحديث المخزون آلياً، وقيد ضريبة المدخلات وحسابات الموردين
                </p>
              </div>
              <button
                onClick={() => setShowCreateBillModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المورد المعتمد</label>
                  <select
                    value={billVendorId}
                    onChange={(e) => setBillVendorId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الفاتورة / التوريد</label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    required
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نسبة ضريبة المدخلات (VAT)</label>
                  <select
                    value={billVatRate}
                    onChange={(e) => setBillVatRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  >
                    <option value={defaultVat}>{defaultVat}% (الافتراضي للشركة)</option>
                    {defaultVat !== 15 && <option value="15">15% (السعودية ZATCA)</option>}
                    {defaultVat !== 14 && <option value="14">14% (مصر - قيمة مضافة)</option>}
                    {defaultVat !== 5 && <option value="5">5% (الإمارات / عمان)</option>}
                    <option value="0">0% (معفى من الضريبة)</option>
                  </select>
                </div>
              </div>

              {/* Items Section (Single Horizontal Row Layout) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 text-sm">الأصناف والبنود الموردة</span>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {billItems.length} {billItems.length === 1 ? 'بند' : 'بنود'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBillItem}
                    className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200 text-xs shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + إضافة بند
                  </button>
                </div>

                {/* Table Column Headers on Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100/90 rounded-xl text-[11px] font-bold text-slate-600">
                  <div className="col-span-5">الصنف والمنتج</div>
                  <div className="col-span-2 text-center">الكمية الموردة (يدعم 5*10)</div>
                  <div className="col-span-2 text-center">سعر التكلفة / الوحدة</div>
                  <div className="col-span-3 text-center">إجمالي البند</div>
                </div>

                {/* Single Row Item Cards */}
                <div className="space-y-2">
                  {billItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 sm:p-2 rounded-xl bg-white border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2 items-center hover:border-slate-300 transition-colors"
                    >
                      {/* Product Selector */}
                      <div className="sm:col-span-5">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">
                          بند #{idx + 1}: الصنف والمنتج
                        </label>
                        <ProductSelectSearch
                          selectedProductId={item.productId}
                          onSelectProduct={(prod) => handleBillProductChange(idx, prod.id)}
                        />
                      </div>

                      {/* Quantity with Math calculator */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">الكمية</label>
                        <MathQuantityInput
                          value={item.quantity}
                          onChange={(newQty) => handleBillItemValueChange(idx, 'quantity', newQty)}
                          min={1}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                        />
                      </div>

                      {/* Unit Cost Price */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">سعر التكلفة</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleBillItemValueChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                        />
                      </div>

                      {/* Item Total & Delete on Single Line */}
                      <div className="sm:col-span-3 flex items-center justify-between gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex-1 text-center font-extrabold text-xs text-emerald-700 font-mono py-1">
                          {formatMoney(item.total)}
                        </div>
                        {billItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBillItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                            title="حذف البند"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Item Row Button */}
                <button
                  type="button"
                  onClick={handleAddBillItem}
                  className="w-full py-2.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>+ إضافة بند جديد للفاتورة</span>
                </button>
              </div>

              {/* Purchase Summary Box */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 shadow-xs border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>إجمالي الأصناف الموردة قبل الضريبة:</span>
                  <span className="font-semibold text-white">{formatMoney(billSubtotal)}</span>
                </div>
                {billVatRate > 0 ? (
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>ضريبة القيمة المضافة / المدخلات ({billVatRate}% VAT):</span>
                    <span className="font-bold text-emerald-400">+{formatMoney(billVat)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>ضريبة القيمة المضافة:</span>
                    <span className="font-bold text-slate-400">0% (معفى من الضريبة)</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700/80 pt-2 mt-1">
                  <span>المبلغ الإجمالي النهائي للمشتريات:</span>
                  <span className="text-emerald-400 text-base font-black">{formatMoney(billGrandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات الفاتورة ورقم إذن التوريد / السند الورقي</label>
                <textarea
                  rows={2}
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات عن الفاتورة أو رقم سند التوريد الورقي للمورد..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateBillModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  تأكيد التوريد وقيد المشتريات والترحيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Pay Vendor */}
      {showPayModal && selectedBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">سند صرف وسداد مستحقات مورد</h3>
                <p className="text-xs text-slate-500">فاتورة: {selectedBill.invoiceNumber}</p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayVendor} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-600">المتبقي للمورد:</span>
                <span className="font-extrabold text-rose-700 text-sm">{formatMoney(selectedBill.remainingAmount)}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المبلغ المراد صرفه</label>
                <input
                  type="number"
                  min="1"
                  max={selectedBill.remainingAmount}
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold text-center text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الحساب المصروف منه (الخزينة/البنك)</label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  {accounts
                    .filter((a) => (a.code === '1110' || a.code === '1120') && !a.isHeader)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 text-slate-600 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                >
                  تأكيد سند الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
