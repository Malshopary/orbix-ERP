import React, { useRef } from 'react';
import { useErp } from '../context/ErpContext';
import { PaymentReceipt } from '../types';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import { tafqeet } from '../utils/tafqeet';
import {
  Printer,
  X,
  CheckCircle,
  Copy,
  CreditCard,
  Building,
  FileText,
  Calendar,
  DollarSign,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';

interface VoucherPrintModalProps {
  receipt: PaymentReceipt;
  onClose: () => void;
}

export const VoucherPrintModal: React.FC<VoucherPrintModalProps> = ({ receipt, onClose }) => {
  const { companyProfile, currency, formatMoney, accounts } = useErp();
  const printContentRef = useRef<HTMLDivElement>(null);

  const isCollection = receipt.type === 'collection';
  const isExpense = receipt.type === 'expense_payment';
  const isVendorPayment = receipt.type === 'vendor_payment';

  let voucherTitle = 'سند قبض وتحصيل نقدية';
  let voucherSubtitle = 'Receipt Voucher';
  let badgeColor = 'bg-emerald-600 text-white';

  if (isExpense) {
    voucherTitle = 'سند صرف مصروفات ونثريات';
    voucherSubtitle = 'Expense Payment Voucher';
    badgeColor = 'bg-amber-600 text-white';
  } else if (isVendorPayment) {
    voucherTitle = 'سند صرف وسداد مورد';
    voucherSubtitle = 'Vendor Payment Voucher';
    badgeColor = 'bg-blue-600 text-white';
  } else if (!isCollection) {
    voucherTitle = 'سند صرف نقدية وبنوك';
    voucherSubtitle = 'Payment Voucher';
    badgeColor = 'bg-slate-800 text-white';
  }

  const amountInWords = tafqeet(receipt.amount, currency);

  const sourceAccount =
    accounts.find((a) => a.id === receipt.accountId || a.code === receipt.accountId) ||
    accounts.find((a) => a.code === '1110');

  const expenseAccount = receipt.expenseAccountId
    ? accounts.find((a) => a.id === receipt.expenseAccountId || a.code === receipt.expenseAccountId)
    : null;

  const handlePrint = () => {
    window.print();
  };

  const getMethodName = (method: string) => {
    switch (method) {
      case 'cash':
        return 'نقداً من الصندوق / الخزينة';
      case 'bank_transfer':
        return 'تحويل بنكي مصرفي';
      case 'card':
        return 'بطاقة بنكية / نقطة بيع الإلكترونية';
      case 'cheque':
        return 'شيك بنكي مؤجل / حال';
      default:
        return 'نقداً';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-w-none print:rounded-none">
        {/* Modal Controls Bar (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              {isCollection ? (
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div>
              <h3 className="font-black text-sm">{voucherTitle}</h3>
              <p className="text-[11px] text-slate-400 font-mono">{receipt.receiptNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              طباعة السند
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div ref={printContentRef} className="p-6 sm:p-10 space-y-6 text-right" dir="rtl">
          {/* Header */}
          <PrintHeader
            docTitle={voucherTitle}
            docSubtitle={voucherSubtitle}
            docNumber={receipt.receiptNumber}
            date={receipt.date}
            badgeColor={badgeColor}
            additionalMeta={[
              { label: 'طريقة الدفع', value: getMethodName(receipt.paymentMethod) },
              ...(receipt.referenceNumber ? [{ label: 'رقم المرجع', value: receipt.referenceNumber }] : []),
            ]}
          />

          {/* Amount Card & Tafqeet */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1 text-center md:text-right">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isCollection ? 'المبلغ المستلم والمحصل' : 'المبلغ المنصرف والمدفوع'}
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                {formatMoney(receipt.amount)}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex-1 max-w-md w-full shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">المبلغ بالحروف (فقط لا غير):</span>
              <p className="text-xs font-black text-slate-800 leading-relaxed font-sans">{amountInWords}</p>
            </div>
          </div>

          {/* Primary Voucher Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Beneficiary / Payer Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Building className="w-4 h-4 text-slate-500" />
                {isCollection ? 'بيانات العميل الدافع' : 'بيانات المستفيد / المستلم'}
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">الاسم:</span>
                  <span className="font-black text-slate-900">{receipt.payeeName || receipt.partyName}</span>
                </div>

                {receipt.expenseCategory && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">تصنيف المصروف:</span>
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px] border border-amber-200">
                      <Tag className="w-3 h-3" />
                      {receipt.expenseCategory}
                    </span>
                  </div>
                )}

                {receipt.taxNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">الرقم الضريبي للمستفيد:</span>
                    <span className="font-mono text-slate-700">{receipt.taxNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Accounts Linking */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Layers className="w-4 h-4 text-slate-500" />
                التوجيه المحاسبي والمالي
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">
                    {isCollection ? 'حساب الإيداع (المدين):' : 'حساب الصرف (الدائن):'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {receipt.accountName || sourceAccount?.name || 'الخزينة الرئيسية'}
                  </span>
                </div>

                {isExpense && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">حساب المصروف (المدين):</span>
                    <span className="font-bold text-slate-900">
                      {receipt.expenseAccountName || expenseAccount?.name || 'مصروفات تشغيلية'}
                    </span>
                  </div>
                )}

                {isVendorPayment && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">الحساب المدين:</span>
                    <span className="font-bold text-slate-900">2110 - الموردون والدائنون ({receipt.partyName})</span>
                  </div>
                )}

                {receipt.taxAmount && receipt.taxAmount > 0 ? (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold">ضريبة القيمة المضافة:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatMoney(receipt.taxAmount)} (1150 ضريبة مدخلات)
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Cheque / Bank Details if applicable */}
          {receipt.paymentMethod === 'cheque' && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs">
              <h4 className="font-black text-amber-900 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-700" />
                بيانات الشيك المصرفي
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 block">رقم الشيك:</span>
                  <span className="font-mono font-bold text-slate-900">{receipt.checkNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">تاريخ الاستحقاق:</span>
                  <span className="font-mono font-bold text-slate-900">{receipt.checkDueDate || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">البنك المسحوب عليه:</span>
                  <span className="font-bold text-slate-900">{receipt.bankName || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes / Description Statement */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-xs font-bold text-slate-500 block">البيان والغرض من الصرف / القبض:</span>
            <p className="text-xs font-semibold text-slate-800 leading-relaxed">
              {receipt.notes ||
                (isCollection
                  ? `تحصيل دفعة مالية لحساب العميل ${receipt.partyName}`
                  : `صرف مالي بموجب السند ${receipt.receiptNumber}`)}
            </p>
          </div>

          {/* Signature & Seal Footer */}
          <div className="pt-8 border-t border-slate-200">
            <div className="grid grid-cols-4 gap-4 text-center text-xs">
              <div className="space-y-8">
                <span className="font-bold text-slate-600 block">توقيع المستلم / المستفيد</span>
                <div className="border-b border-dashed border-slate-400 mx-4"></div>
              </div>
              <div className="space-y-8">
                <span className="font-bold text-slate-600 block">أمين الخزينة</span>
                <div className="border-b border-dashed border-slate-400 mx-4"></div>
              </div>
              <div className="space-y-8">
                <span className="font-bold text-slate-600 block">المحاسب المختص</span>
                <div className="border-b border-dashed border-slate-400 mx-4"></div>
              </div>
              <div className="space-y-8">
                <span className="font-bold text-slate-600 block">اعتماد المدير المالي / الإدارة</span>
                <div className="border-b border-dashed border-slate-400 mx-4"></div>
              </div>
            </div>
          </div>

          {/* System watermark & verification */}
          <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100 flex justify-between items-center">
            <span>تم إصدار هذا السند آلياً عبر نظام أوربكس ERP المالي المتكامل</span>
            <span>كود السند المرجعي: {receipt.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
