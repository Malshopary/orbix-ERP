import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import { PaymentReceipt, PaymentReceiptType, PaymentMethod, Vendor, Account } from '../types';
import { VoucherPrintModal } from './VoucherPrintModal';
import {
  Receipt,
  PlusCircle,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Layers,
  ArrowUpRight,
  Trash2,
  Printer,
  CreditCard,
  Building,
  Calendar,
  DollarSign,
  Tag,
  Building2,
  Wallet,
  TrendingDown,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Coins,
  ShieldCheck,
} from 'lucide-react';

export const PaymentVouchersSection: React.FC = () => {
  const {
    receipts,
    addReceiptVoucher,
    deletePaymentReceipt,
    accounts,
    vendors,
    purchaseInvoices,
    journalEntries,
    currency,
    formatMoney,
    showAlert,
    showConfirm,
  } = useErp();

  // Active view mode: all payment vouchers or vendor payables
  const [viewSubTab, setViewSubTab] = useState<'vouchers' | 'vendor_payables'>('vouchers');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense_payment' | 'vendor_payment' | 'general_payment'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');
  const [accountFilter, setAccountFilter] = useState<'all' | string>('all');

  // Modal State
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [printReceipt, setPrintReceipt] = useState<PaymentReceipt | null>(null);

  // Form State for New Payment Voucher
  const [voucherType, setVoucherType] = useState<PaymentReceiptType>('expense_payment');
  const [payeeName, setPayeeName] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedPurchaseInvoiceId, setSelectedPurchaseInvoiceId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('مصروفات عمومية وإدارية');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [hasTax, setHasTax] = useState(false);
  const [taxAmount, setTaxAmount] = useState<number | ''>('');
  const [taxNumber, setTaxNumber] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [checkDueDate, setCheckDueDate] = useState('');
  const [bankName, setBankName] = useState('');

  // Auto-select primary cash treasury account on mount
  React.useEffect(() => {
    if (!sourceAccountId) {
      const defaultCash =
        accounts.find((a) => a.code === '1110') ||
        accounts.find((a) => a.type === 'asset' && a.name.includes('خزينة')) ||
        accounts.find((a) => a.type === 'asset');
      if (defaultCash) setSourceAccountId(defaultCash.id);
    }
    if (!expenseAccountId) {
      const defaultExp =
        accounts.find((a) => a.code === '5300') ||
        accounts.find((a) => a.type === 'expense' && a.code.startsWith('5')) ||
        accounts.find((a) => a.type === 'expense');
      if (defaultExp) setExpenseAccountId(defaultExp.id);
    }
  }, [accounts, sourceAccountId, expenseAccountId]);

  // Payment receipts (excluding customer collections)
  const paymentVouchers = useMemo(() => {
    return receipts.filter((r) => r.type !== 'collection');
  }, [receipts]);

  // Filtered payment vouchers
  const filteredVouchers = useMemo(() => {
    return paymentVouchers.filter((v) => {
      const matchesSearch =
        v.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.payeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.expenseCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || v.type === typeFilter;
      const matchesMethod = methodFilter === 'all' || v.paymentMethod === methodFilter;
      const matchesAccount = accountFilter === 'all' || v.accountId === accountFilter;

      return matchesSearch && matchesType && matchesMethod && matchesAccount;
    });
  }, [paymentVouchers, searchQuery, typeFilter, methodFilter, accountFilter]);

  // Financial Metrics
  const totalExpensePayments = useMemo(() => {
    return paymentVouchers
      .filter((r) => r.type === 'expense_payment')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [paymentVouchers]);

  const totalVendorPayments = useMemo(() => {
    return paymentVouchers
      .filter((r) => r.type === 'vendor_payment')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [paymentVouchers]);

  const totalOtherPayments = useMemo(() => {
    return paymentVouchers
      .filter((r) => r.type === 'general_payment')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }, [paymentVouchers]);

  const totalAllPayments = totalExpensePayments + totalVendorPayments + totalOtherPayments;

  // Selected source account live balance
  const sourceAccount = accounts.find((a) => a.id === sourceAccountId);
  const treasuryAccount = accounts.find((a) => a.code === '1110');
  const bankAccount = accounts.find((a) => a.code === '1120');

  // Vendors with outstanding payable balances
  const payableVendors = useMemo(() => {
    return vendors.filter((v) => (v.currentBalance || 0) > 0);
  }, [vendors]);

  const totalVendorPayables = useMemo(() => {
    return payableVendors.reduce((sum, v) => sum + (v.currentBalance || 0), 0);
  }, [payableVendors]);

  // Handle open modal for specific vendor
  const openVendorPaymentModal = (vendor: Vendor) => {
    setVoucherType('vendor_payment');
    setSelectedVendorId(vendor.id);
    setPayeeName(vendor.name);
    setSelectedPurchaseInvoiceId('');
    setAmount(vendor.currentBalance || '');
    setNotes(`سداد مستحقات المورد ${vendor.name}`);
    setShowVoucherModal(true);
  };

  // Open modal with specific type
  const openNewVoucherModal = (type: PaymentReceiptType) => {
    setVoucherType(type);
    setSelectedVendorId('');
    setSelectedPurchaseInvoiceId('');
    setPayeeName('');
    setAmount('');
    setHasTax(false);
    setTaxAmount('');
    setTaxNumber('');
    setCheckNumber('');
    setCheckDueDate('');
    setBankName('');
    setReferenceNumber('');
    if (type === 'expense_payment') {
      setNotes('صرف مصروفات تشغيلية');
    } else if (type === 'vendor_payment') {
      setNotes('سداد دفعة مورد');
    } else {
      setNotes('سند صرف عام');
    }
    setShowVoucherModal(true);
  };

  // Handle Form Submission
  const handleSubmitVoucher = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      showAlert({
        title: 'مبلغ غير صحيح',
        message: 'يرجى إدخال مبلغ صحيح لسند الصرف أكبر من الصفر.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    if (voucherType === 'vendor_payment' && !selectedVendorId) {
      showAlert({
        title: 'المورد مطلوب',
        message: 'يرجى اختيار المورد المراد سداد مستحقاته.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    const finalPayee =
      voucherType === 'vendor_payment'
        ? vendors.find((v) => v.id === selectedVendorId)?.name || payeeName
        : payeeName.trim() || 'المستفيد';

    if (!sourceAccountId) {
      showAlert({
        title: 'حساب الصرف مطلوب',
        message: 'يرجى اختيار حساب الخزينة أو البنك المصروف منه.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === sourceAccountId);
    const selectedExpAcc = expenseAccountId ? accounts.find((a) => a.id === expenseAccountId) : undefined;

    // Check balance warning
    if (selectedAcc && selectedAcc.balance < Number(amount)) {
      showConfirm({
        title: 'تنبيه: الرصيد غير كافٍ',
        message: `رصيد حساب (${selectedAcc.name}) الحالي هو ${formatMoney(selectedAcc.balance)}، وهو أقل من المبلغ المنصرف ${formatMoney(Number(amount))}. هل ترغب في المتابعة والصرف؟`,
        type: 'warning',
        confirmText: 'نعم، تابع الصرف',
        cancelText: 'إلغاء وتعديل',
        onConfirm: () => executeSaveVoucher(finalPayee, selectedAcc, selectedExpAcc),
      });
      return;
    }

    executeSaveVoucher(finalPayee, selectedAcc, selectedExpAcc);
  };

  const executeSaveVoucher = (finalPayee: string, selectedAcc?: Account, selectedExpAcc?: Account) => {
    addReceiptVoucher({
      type: voucherType,
      partyId: voucherType === 'vendor_payment' ? selectedVendorId : undefined,
      partyName: finalPayee,
      payeeName: finalPayee,
      amount: Number(amount),
      date,
      paymentMethod,
      accountId: sourceAccountId,
      accountName: selectedAcc?.name,
      expenseAccountId: voucherType === 'expense_payment' ? expenseAccountId : undefined,
      expenseAccountName: voucherType === 'expense_payment' ? selectedExpAcc?.name : undefined,
      expenseCategory: voucherType === 'expense_payment' ? expenseCategory : undefined,
      invoiceId: voucherType === 'vendor_payment' && selectedPurchaseInvoiceId ? selectedPurchaseInvoiceId : undefined,
      referenceNumber: referenceNumber.trim() || undefined,
      taxAmount: hasTax && taxAmount ? Number(taxAmount) : undefined,
      taxNumber: hasTax && taxNumber ? taxNumber.trim() : undefined,
      checkNumber: paymentMethod === 'cheque' ? checkNumber.trim() : undefined,
      checkDueDate: paymentMethod === 'cheque' ? checkDueDate : undefined,
      bankName: paymentMethod === 'cheque' ? bankName.trim() : undefined,
      notes: notes.trim() || `سند صرف لصالح ${finalPayee}`,
    });

    setShowVoucherModal(false);

    showAlert({
      title: 'تم إصدار سند الصرف بنجاح',
      message: `تم إنشاء سند الصرف وترحيل القيد المحاسبي وتحديث أرصدة الحسابات تلقائياً.`,
      type: 'success',
      confirmText: 'ممتاز',
    });
  };

  // Handle Delete Confirmation
  const handleDeleteVoucher = (voucher: PaymentReceipt) => {
    showConfirm({
      title: 'تأكيد حذف سند الصرف',
      message: `هل أنت متأكد من رغبتك في حذف السند رقم (${voucher.receiptNumber}) بقيمة ${formatMoney(voucher.amount)}؟ سيتم إلغاء القيد المحاسبي واسترجاع الرصيد للخزينة تلقائياً.`,
      type: 'danger',
      confirmText: 'نعم، احذف السند',
      cancelText: 'تراجع',
      onConfirm: () => {
        deletePaymentReceipt(voucher.id);
      },
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Payments */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">إجمالي المدفوعات والمصروفات</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatMoney(totalAllPayments)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-bold">
            <span>{paymentVouchers.length} سند صرف مسجل</span>
          </div>
        </div>

        {/* Operational Expenses */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">المصروفات والنثريات التشغيلية</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
            {formatMoney(totalExpensePayments)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-bold">
            <span>{paymentVouchers.filter((v) => v.type === 'expense_payment').length} سند مصروف</span>
          </div>
        </div>

        {/* Vendor Settlements */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">سداد فواتير الموردين</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
            {formatMoney(totalVendorPayments)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-bold">
            <span>ديون موردين متبقية: {formatMoney(totalVendorPayables)}</span>
          </div>
        </div>

        {/* Available Liquidity (Treasury & Bank) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">السيولة النقدية المتاحة (خزينة وبنك)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            {formatMoney((treasuryAccount?.balance || 0) + (bankAccount?.balance || 0))}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 font-mono">
            <span>خزينة: {formatMoney(treasuryAccount?.balance || 0)}</span>
            <span>بنك: {formatMoney(bankAccount?.balance || 0)}</span>
          </div>
        </div>
      </div>

      {/* Action Header & Segmented Subtab Switcher */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Subtab Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewSubTab('vouchers')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewSubTab === 'vouchers'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4 text-rose-500" />
              سجل سندات الصرف
              <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.5 rounded-full font-mono font-bold">
                {paymentVouchers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewSubTab('vendor_payables')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                viewSubTab === 'vendor_payables'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-500" />
              أرصدة الموردين المستحقة للدفع
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-mono font-bold">
                {payableVendors.length}
              </span>
            </button>
          </div>

          {/* Action Launchers */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => openNewVoucherModal('expense_payment')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              صرف مصروفات ونثريات
            </button>
            <button
              type="button"
              onClick={() => openNewVoucherModal('vendor_payment')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Building className="w-4 h-4" />
              سداد دفعة مورد
            </button>
            <button
              type="button"
              onClick={() => openNewVoucherModal('general_payment')}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              سند صرف عام
            </button>
          </div>
        </div>

        {/* Filters and Search Bar (Visible in Vouchers View) */}
        {viewSubTab === 'vouchers' && (
          <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم السند، اسم المستفيد، البيان أو التصنيف..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs focus:outline-hidden focus:border-rose-500 font-bold text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div className="w-full md:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="all">كافة أنواع سندات الصرف</option>
                <option value="expense_payment">مصروفات ونثريات وتشغيل</option>
                <option value="vendor_payment">سداد مستحقات موردين</option>
                <option value="general_payment">صرف عام / جاري الشركاء</option>
              </select>
            </div>

            {/* Method Filter */}
            <div className="w-full md:w-auto">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="all">كافة وسائل الدفع</option>
                <option value="cash">نقداً (خزينة)</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="card">بطاقة بنكية / نقطة بيع</option>
                <option value="cheque">شيك مصرفي</option>
              </select>
            </div>

            {/* Account Filter */}
            <div className="w-full md:w-auto">
              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="all">كافة الخزائن والبنوك</option>
                {accounts
                  .filter((a) => a.type === 'asset' && (a.code.startsWith('111') || a.code.startsWith('112')))
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: Vouchers Table */}
      {viewSubTab === 'vouchers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-black text-slate-900 text-sm">سجل سندات الصرف والمصروفات المسجلة</h3>
            <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              {filteredVouchers.length} من {paymentVouchers.length} سند
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4">رقم السند</th>
                  <th className="p-4">نوع الصرف</th>
                  <th className="p-4">المستفيد / الجهة</th>
                  <th className="p-4">المبلغ المنصرف</th>
                  <th className="p-4">خزينة / بنك الصرف</th>
                  <th className="p-4">طريقة الصرف</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">البيان والتصنيف</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((voucher) => {
                  const matchingJe = journalEntries.find(
                    (je) => je.reference === voucher.receiptNumber || je.entryNumber.includes(voucher.receiptNumber)
                  );

                  return (
                    <tr key={voucher.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Voucher Number */}
                      <td className="p-4">
                        <div className="font-mono font-black text-slate-900">{voucher.receiptNumber}</div>
                        {matchingJe && (
                          <span className="text-[10px] text-indigo-600 font-mono font-bold block mt-0.5">
                            {matchingJe.entryNumber}
                          </span>
                        )}
                      </td>

                      {/* Voucher Type Badge */}
                      <td className="p-4">
                        {voucher.type === 'expense_payment' && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded text-[11px]">
                            <Tag className="w-3 h-3" />
                            مصروفات ونثريات
                          </span>
                        )}
                        {voucher.type === 'vendor_payment' && (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2 py-0.5 rounded text-[11px]">
                            <Building2 className="w-3 h-3" />
                            سداد مورد
                          </span>
                        )}
                        {voucher.type === 'general_payment' && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 font-bold px-2 py-0.5 rounded text-[11px]">
                            <ArrowUpRight className="w-3 h-3" />
                            صرف عام
                          </span>
                        )}
                      </td>

                      {/* Payee / Beneficiary */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{voucher.payeeName || voucher.partyName}</div>
                        {voucher.expenseCategory && (
                          <span className="text-[11px] text-slate-500 font-semibold">{voucher.expenseCategory}</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-black font-mono text-sm text-rose-700">
                        {formatMoney(voucher.amount)}
                        {voucher.taxAmount && voucher.taxAmount > 0 ? (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            شامل ضريبة {formatMoney(voucher.taxAmount)}
                          </span>
                        ) : null}
                      </td>

                      {/* Source Account (Cash / Bank) */}
                      <td className="p-4">
                        <span className="text-slate-700 font-bold">
                          {voucher.accountName || accounts.find((a) => a.id === voucher.accountId)?.name || 'الخزينة'}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[11px]">
                          {voucher.paymentMethod === 'cash' && 'نقداً'}
                          {voucher.paymentMethod === 'bank_transfer' && 'تحويل بنكي'}
                          {voucher.paymentMethod === 'card' && 'بطاقة / مدى'}
                          {voucher.paymentMethod === 'cheque' && `شيك (${voucher.checkNumber || '—'})`}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="p-4 font-mono text-slate-600">{voucher.date}</td>

                      {/* Notes / Description */}
                      <td className="p-4 text-slate-500 max-w-xs truncate">{voucher.notes || '—'}</td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrintReceipt(voucher)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg cursor-pointer transition-colors"
                            title="معاينة وطباعة السند"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVoucher(voucher)}
                            className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg cursor-pointer transition-colors"
                            title="حذف السند واسترجاع الرصيد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredVouchers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400 font-bold">
                      لا توجد سندات صرف تطابق معايير البحث والفلترة المحددة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Vendor Payables Ledger */}
      {viewSubTab === 'vendor_payables' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-900 text-sm">متابعة مستحقات وأرصدة الموردين واجبة السداد</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                قائمة الموردين الذين لديهم فواتير مشتريات آجلة أو أرصدة دائنة مستحقة الدفع
              </p>
            </div>
            <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
              إجمالي المستحقات: {formatMoney(totalVendorPayables)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-4">كود المورد</th>
                  <th className="p-4">اسم المورد / الشركة</th>
                  <th className="p-4">الهاتف</th>
                  <th className="p-4">فواتير مشتريات غير مسددة</th>
                  <th className="p-4">الرصيد الدائن المستحق</th>
                  <th className="p-4 text-center">إجراءات السداد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payableVendors.map((vendor) => {
                  const unpaidInvoices = purchaseInvoices.filter(
                    (p) => p.vendorId === vendor.id && p.remainingAmount > 0
                  );

                  return (
                    <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-700">{vendor.code}</td>
                      <td className="p-4 font-bold text-slate-900">{vendor.name}</td>
                      <td className="p-4 font-mono text-slate-600">{vendor.phone || '—'}</td>
                      <td className="p-4">
                        {unpaidInvoices.length > 0 ? (
                          <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px] border border-amber-200">
                            {unpaidInvoices.length} فاتورة مفتوحة
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">تسوية رصيد حساب</span>
                        )}
                      </td>
                      <td className="p-4 font-black text-rose-700 font-mono text-sm">
                        {formatMoney(vendor.currentBalance)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => openVendorPaymentModal(vendor)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-xs text-xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          إصدار سند صرف
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {payableVendors.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-emerald-600 font-bold">
                      🎉 لا توجد أي مستحقات أو ديون متأخرة للموردين حالياً، الحسابات متوازنة تماماً!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PAYMENT VOUCHER MODAL */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">إصدار سند صرف نقدية وبنوك</h3>
                  <p className="text-[11px] text-slate-500">ترحيل قيد يومية فوري وتحديث حساب الخزينة والمستفيد</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVoucher} className="space-y-4 mt-4 text-xs">
              {/* Voucher Type Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">نوع سند الصرف والغرض منه *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherType('expense_payment');
                      setNotes('صرف مصروفات تشغيلية');
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition-all text-center ${
                      voucherType === 'expense_payment'
                        ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    مصروفات ونثريات
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherType('vendor_payment');
                      setNotes('سداد مستحقات مورد');
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition-all text-center ${
                      voucherType === 'vendor_payment'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    سداد دفعة مورد
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherType('general_payment');
                      setNotes('سند صرف عام');
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold border transition-all text-center ${
                      voucherType === 'general_payment'
                        ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    صرف عام / أخرى
                  </button>
                </div>
              </div>

              {/* Case 1: Vendor Payment Fields */}
              {voucherType === 'vendor_payment' && (
                <div className="space-y-3 bg-blue-50/40 p-3.5 rounded-2xl border border-blue-100">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">المورد المستحق للصرف *</label>
                    <select
                      required
                      value={selectedVendorId}
                      onChange={(e) => {
                        const vId = e.target.value;
                        setSelectedVendorId(vId);
                        setSelectedPurchaseInvoiceId('');
                        const found = vendors.find((v) => v.id === vId);
                        if (found) {
                          setPayeeName(found.name);
                          if (found.currentBalance > 0) setAmount(found.currentBalance);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold focus:border-blue-500 focus:outline-hidden"
                    >
                      <option value="">-- اختر المورد من القائمة --</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} (رصيد مستحق: {formatMoney(v.currentBalance || 0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Optional Purchase Invoice Selector */}
                  {selectedVendorId && (
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        تخصيص السداد لفاتورة مشتريات محددة (اختياري)
                      </label>
                      <select
                        value={selectedPurchaseInvoiceId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          setSelectedPurchaseInvoiceId(pId);
                          if (pId) {
                            const pInv = purchaseInvoices.find((i) => i.id === pId);
                            if (pInv) {
                              setAmount(pInv.remainingAmount);
                              setNotes(`سداد فاتورة مشتريات رقم ${pInv.invoiceNumber}`);
                            }
                          } else {
                            const found = vendors.find((v) => v.id === selectedVendorId);
                            if (found && found.currentBalance > 0) setAmount(found.currentBalance);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-hidden"
                      >
                        <option value="">-- تسوية تلقائية لحساب المورد (الأقدم فالأحدث) --</option>
                        {purchaseInvoices
                          .filter((p) => p.vendorId === selectedVendorId && p.remainingAmount > 0)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              فاتورة {p.invoiceNumber} | متبقي: {formatMoney(p.remainingAmount)} (الإجمالي:{' '}
                              {formatMoney(p.grandTotal)})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Case 2: Expense Fields */}
              {voucherType === 'expense_payment' && (
                <div className="space-y-3 bg-amber-50/40 p-3.5 rounded-2xl border border-amber-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">تصنيف المصروف *</label>
                      <select
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-hidden"
                      >
                        <option value="مصروفات عمومية وإدارية">مصروفات عمومية وإدارية</option>
                        <option value="إيجار ومرافق">إيجار ومرافق</option>
                        <option value="كهرباء ومياه وإنترنت">كهرباء ومياه وإنترنت</option>
                        <option value="صيانة وتشغيل">صيانة وتشغيل</option>
                        <option value="نقل وشحن ومحروقات">نقل وشحن ومحروقات</option>
                        <option value="دعاية وإعلان وتسويق">دعاية وإعلان وتسويق</option>
                        <option value="بوفيه وضيافة ونظافة">بوفيه وضيافة ونظافة</option>
                        <option value="رسوم بنكية وحكومية">رسوم بنكية وحكومية</option>
                        <option value="أدوات كتابية ومطبوعات">أدوات كتابية ومطبوعات</option>
                        <option value="نثريات ومصروفات أخرى">نثريات ومصروفات أخرى</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">حساب المصروف المدين *</label>
                      <select
                        value={expenseAccountId}
                        onChange={(e) => setExpenseAccountId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-hidden"
                      >
                        {accounts
                          .filter((a) => a.type === 'expense')
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} - {a.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">اسم المستفيد / المستلم *</label>
                    <input
                      type="text"
                      required
                      value={payeeName}
                      onChange={(e) => setPayeeName(e.target.value)}
                      placeholder="مثال: شركة الكهرباء / الموظف أحمد / شركة الصيانة"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Case 3: General Payment Payee */}
              {voucherType === 'general_payment' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">اسم المستفيد / الجهة *</label>
                  <input
                    type="text"
                    required
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                    placeholder="اسم الجهة أو المستلم"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-hidden"
                  />
                </div>
              )}

              {/* Amount, Currency & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">المبلغ المنصرف *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0.01}
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-black text-rose-700 text-base focus:outline-hidden pr-3"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                      {currency}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">تاريخ السند *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Source Account (Cashier / Bank) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-700 font-bold">حساب الخزينة أو البنك المصروف منه *</label>
                  {sourceAccount && (
                    <span className="text-[11px] font-mono text-slate-500 font-bold">
                      الرصيد المتاح: {formatMoney(sourceAccount.balance)}
                    </span>
                  )}
                </div>
                <select
                  required
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-hidden"
                >
                  {accounts
                    .filter((a) => a.type === 'asset' && (a.code.startsWith('111') || a.code.startsWith('112')))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name} (الرصيد: {formatMoney(a.balance)})
                      </option>
                    ))}
                </select>
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">طريقة الصرف والدفع *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-hidden"
                  >
                    <option value="cash">نقداً من الصندوق</option>
                    <option value="bank_transfer">تحويل بنكي مصرفي</option>
                    <option value="card">بطاقة دفع / مدى</option>
                    <option value="cheque">شيك بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">رقم المرجع / الإيصال الخارجي</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="رقم الفاتورة أو إشعار التحويل"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-700 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Cheque Details if paymentMethod === 'cheque' */}
              {paymentMethod === 'cheque' && (
                <div className="grid grid-cols-3 gap-2 bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">رقم الشيك</label>
                    <input
                      type="text"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                      placeholder="رقم الشيك"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">تاريخ الاستحقاق</label>
                    <input
                      type="date"
                      value={checkDueDate}
                      onChange={(e) => setCheckDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">البنك المسحوب عليه</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="اسم البنك"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 font-bold"
                    />
                  </div>
                </div>
              )}

              {/* VAT Option Toggle */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTax}
                    onChange={(e) => {
                      setHasTax(e.target.checked);
                      if (e.target.checked && amount && Number(amount) > 0) {
                        // calculate default 14% or 15% VAT estimate
                        setTaxAmount(Math.round((Number(amount) * 14) / 114));
                      }
                    }}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-bold text-slate-700">يتضمن هذا المصروف ضريبة قيمة مضافة (فاتورة ضريبية)</span>
                </label>

                {hasTax && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">مبلغ الضريبة (1150 مدخلات)</label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={taxAmount}
                        onChange={(e) => setTaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">الرقم الضريبي للمستفيد</label>
                      <input
                        type="text"
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        placeholder="الرقم الضريبي"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes / Statement */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">البيان والملاحظات</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="بيان تفصيلي لسبب الصرف"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden font-medium"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  حفظ السند والترحيل المحاسبي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT MODAL */}
      {printReceipt && <VoucherPrintModal receipt={printReceipt} onClose={() => setPrintReceipt(null)} />}
    </div>
  );
};
