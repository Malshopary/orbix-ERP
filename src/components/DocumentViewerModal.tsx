import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import {
  SalesInvoice,
  PaymentReceipt,
  SalesReturn,
  PurchaseInvoice,
  JournalEntry,
} from '../types';
import { printDocumentElement } from '../utils/printUtils';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import {
  Printer,
  X,
  FileText,
  Receipt,
  RotateCcw,
  BookOpen,
  ShoppingBag,
  Building2,
  Calendar,
  CreditCard,
  QrCode,
  Tag,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

export type DocumentType =
  | 'invoice'
  | 'receipt'
  | 'payment_voucher'
  | 'return'
  | 'purchase'
  | 'journal';

export interface DocumentViewerTarget {
  type: DocumentType;
  id?: string;
  reference?: string;
  data?: any;
}

interface DocumentViewerModalProps {
  documentTarget: DocumentViewerTarget;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  documentTarget,
  onClose,
}) => {
  const {
    companyProfile,
    currency,
    formatMoney,
    formatDualMoney,
    salesInvoices,
    receipts,
    salesReturns,
    purchaseInvoices,
    journalEntries,
    accounts,
    customers,
    vendors,
    showAlert,
  } = useErp();

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Resolve specific document object
  const resolvedInvoice: SalesInvoice | undefined =
    documentTarget.type === 'invoice'
      ? salesInvoices.find(
          (inv) =>
            inv.id === documentTarget.id ||
            inv.invoiceNumber === documentTarget.reference ||
            (documentTarget.data && inv.id === documentTarget.data.id)
        ) ||
        (documentTarget.data?.items ? (documentTarget.data as SalesInvoice) : undefined)
      : undefined;

  const resolvedReceipt: PaymentReceipt | undefined =
    documentTarget.type === 'receipt' || documentTarget.type === 'payment_voucher'
      ? receipts.find(
          (r) =>
            r.id === documentTarget.id ||
            r.receiptNumber === documentTarget.reference ||
            (documentTarget.data && r.id === documentTarget.data.id)
        ) ||
        (documentTarget.data?.amount !== undefined ? (documentTarget.data as PaymentReceipt) : undefined)
      : undefined;

  const resolvedReturn: SalesReturn | undefined =
    documentTarget.type === 'return'
      ? salesReturns.find(
          (ret) =>
            ret.id === documentTarget.id ||
            ret.returnNumber === documentTarget.reference ||
            (documentTarget.data && ret.id === documentTarget.data.id)
        ) ||
        (documentTarget.data?.totalRefundAmount !== undefined ? (documentTarget.data as SalesReturn) : undefined)
      : undefined;

  const resolvedPurchase: PurchaseInvoice | undefined =
    documentTarget.type === 'purchase'
      ? purchaseInvoices.find(
          (p) =>
            p.id === documentTarget.id ||
            p.invoiceNumber === documentTarget.reference ||
            (documentTarget.data && p.id === documentTarget.data.id)
        ) ||
        (documentTarget.data as PurchaseInvoice)
      : undefined;

  const resolvedJournal: JournalEntry | undefined =
    documentTarget.type === 'journal'
      ? journalEntries.find(
          (j) =>
            j.id === documentTarget.id ||
            j.entryNumber === documentTarget.reference ||
            j.reference === documentTarget.reference ||
            (documentTarget.data && j.id === documentTarget.data.id)
        ) ||
        (documentTarget.data as JournalEntry)
      : undefined;

  // Document metadata title & color
  let docTitle = 'مستند مالي';
  let docNumber = documentTarget.reference || documentTarget.id || '';
  let badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
  let IconComponent = FileText;

  if (documentTarget.type === 'invoice') {
    const isTaxFree =
      (resolvedInvoice?.vatRate === 0 || resolvedInvoice?.vatRate === undefined || resolvedInvoice?.vatRate === null) &&
      (!resolvedInvoice?.vatTotal || resolvedInvoice?.vatTotal === 0);
    docTitle = resolvedInvoice?.invoiceNumber?.startsWith('POS')
      ? 'فاتورة نقطة بيع POS كاشير'
      : isTaxFree
      ? 'فاتورة مبيعات'
      : 'فاتورة مبيعات ضريبية إلكترونية';
    docNumber = resolvedInvoice?.invoiceNumber || documentTarget.reference || '';
    badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
    IconComponent = FileText;
  } else if (documentTarget.type === 'receipt') {
    docTitle = 'سند قبض وتحصيل نقدية وبنك';
    docNumber = resolvedReceipt?.receiptNumber || documentTarget.reference || '';
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    IconComponent = Receipt;
  } else if (documentTarget.type === 'payment_voucher') {
    docTitle = 'سند صرف وسداد مالي';
    docNumber = resolvedReceipt?.receiptNumber || documentTarget.reference || '';
    badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
    IconComponent = Receipt;
  } else if (documentTarget.type === 'return') {
    docTitle = 'إشعار دائن - مرتجع مبيعات';
    docNumber = resolvedReturn?.returnNumber || documentTarget.reference || '';
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    IconComponent = RotateCcw;
  } else if (documentTarget.type === 'purchase') {
    docTitle = 'فاتورة مشتريات وتوريد بضائع';
    docNumber = resolvedPurchase?.invoiceNumber || documentTarget.reference || '';
    badgeColor = 'bg-purple-50 text-purple-800 border-purple-200';
    IconComponent = ShoppingBag;
  } else if (documentTarget.type === 'journal') {
    docTitle = 'قيد اليومية العامة';
    docNumber = resolvedJournal?.entryNumber || documentTarget.reference || '';
    badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
    IconComponent = BookOpen;
  }

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoom, setZoom] = useState<number>(100);

  const handlePrint = () => {
    printDocumentElement('single-document-canvas-sheet', {
      title: `${docTitle} - ${docNumber || ''}`,
      orientation,
    });
  };

  const getCustomer = (id?: string) => customers.find((c) => c.id === id);
  const getVendor = (id?: string) => vendors.find((v) => v.id === id);
  const getAccount = (id?: string) => accounts.find((a) => a.id === id || a.code === id);

  const docDate =
    resolvedInvoice?.date ||
    resolvedReceipt?.date ||
    resolvedReturn?.date ||
    resolvedPurchase?.date ||
    resolvedJournal?.date ||
    documentTarget.data?.date ||
    new Date().toISOString().split('T')[0];

  const docDueDate = resolvedInvoice?.dueDate || resolvedPurchase?.dueDate;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-60 overflow-y-auto print-preview-modal-layer">
      <div
        className={`bg-white rounded-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[96vh] flex flex-col text-slate-900 transition-all print-modal-card ${
          orientation === 'landscape' ? 'max-w-6xl' : 'max-w-4xl'
        }`}
      >
        {/* Modal Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">{docTitle}</h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border ${badgeColor}`}>
                  {docNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">معاينة الطباعة وتفاصيل المستند المحاسبي</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Orientation controls */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="طباعة رأسية"
              >
                طولي (Portrait)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="طباعة أفقية"
              >
                عرضي (Landscape)
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(70, z - 10))}
                disabled={zoom <= 70}
                className="p-1 hover:bg-white rounded disabled:opacity-30 cursor-pointer"
                title="تصغير"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] min-w-[36px] text-center">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(120, z + 10))}
                disabled={zoom >= 120}
                className="p-1 hover:bg-white rounded disabled:opacity-30 cursor-pointer"
                title="تكبير"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              طباعة المستند
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Printable Body */}
        <div className="overflow-y-auto flex-1 pr-1 mt-3 bg-slate-50/50 p-2 rounded-xl flex justify-center">
          <div
            id="single-document-canvas-sheet"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
            }}
            className={`printable-sheet printable-page bg-white border border-slate-300 p-6 sm:p-8 rounded-xl space-y-6 text-xs text-slate-900 w-full ${
              orientation === 'landscape' ? 'print-landscape max-w-[297mm]' : 'print-portrait max-w-[210mm]'
            }`}
          >
            {/* Standardized Header with Company Profile & Logo */}
            <PrintHeader
              docTitle={docTitle}
              docNumber={docNumber}
              date={docDate}
              dueDate={docDueDate}
              showQrCode={documentTarget.type === 'invoice'}
              orientation={orientation}
            />

            {/* 1. SALES INVOICE VIEW */}
            {documentTarget.type === 'invoice' && resolvedInvoice && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold block text-[11px]">بيانات العميل (المشتري):</span>
                    <div className="font-extrabold text-slate-900 text-sm">{resolvedInvoice.customerName}</div>
                    {resolvedInvoice.customerTaxNumber && (
                      <div className="text-slate-600 font-mono">الرقم الضريبي: {resolvedInvoice.customerTaxNumber}</div>
                    )}
                    {resolvedInvoice.salesRepName && (
                      <div className="text-slate-600">مندوب المبيعات: {resolvedInvoice.salesRepName}</div>
                    )}
                  </div>
                  <div className="sm:text-left space-y-1 border-t sm:border-t-0 sm:border-r sm:pr-4 border-slate-200 pt-2 sm:pt-0">
                    <div>تاريخ الإصدار: <span className="font-mono font-bold">{resolvedInvoice.date}</span></div>
                    <div>تاريخ الاستحقاق: <span className="font-mono font-bold">{resolvedInvoice.dueDate}</span></div>
                    <div>
                      حالة الفاتورة:{' '}
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          resolvedInvoice.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : resolvedInvoice.status === 'partially_paid'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {resolvedInvoice.status === 'paid'
                          ? 'مسددة بالكامل'
                          : resolvedInvoice.status === 'partially_paid'
                          ? 'مسددة جزئياً'
                          : 'غير مسددة'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Table & Totals */}
                {(() => {
                  const isVatZero =
                    (resolvedInvoice.vatRate === 0 || resolvedInvoice.vatRate === undefined || resolvedInvoice.vatRate === null) &&
                    (!resolvedInvoice.vatTotal || resolvedInvoice.vatTotal === 0);
                  const itemsGrossTotal = resolvedInvoice.items.reduce(
                    (s, it) => s + it.quantity * it.unitPrice,
                    0
                  );

                  return (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs border border-slate-200">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                            {isVatZero ? (
                              <tr>
                                <th className="p-2.5">#</th>
                                <th className="p-2.5">الصنف والوصف</th>
                                <th className="p-2.5 text-center">الكمية</th>
                                <th className="p-2.5 text-left">سعر الوحدة</th>
                                <th className="p-2.5 text-left">الخصم</th>
                                <th className="p-2.5 text-left">بعد الخصم</th>
                                <th className="p-2.5 text-left font-bold">المجموع</th>
                              </tr>
                            ) : (
                              <tr>
                                <th className="p-2.5">#</th>
                                <th className="p-2.5">الصنف والوصف</th>
                                <th className="p-2.5 text-center">الكمية</th>
                                <th className="p-2.5 text-left">سعر الوحدة</th>
                                <th className="p-2.5 text-left">الخصم</th>
                                <th className="p-2.5 text-left">المجموع قبل الضريبة</th>
                                <th className="p-2.5 text-center">نسبة الضريبة</th>
                                <th className="p-2.5 text-left">مبلغ الضريبة</th>
                                <th className="p-2.5 text-left font-bold">المجموع شامل الضريبة</th>
                              </tr>
                            )}
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {resolvedInvoice.items.map((item, idx) => {
                              const lineGross = item.quantity * item.unitPrice;
                              const lineDisc = item.discount || 0;
                              const lineNet = Math.max(0, lineGross - lineDisc);

                              return isVatZero ? (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-mono text-slate-500">{idx + 1}</td>
                                  <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                                  <td className="p-2.5 text-center font-mono font-bold">{item.quantity}</td>
                                  <td className="p-2.5 text-left font-mono">{formatMoney(item.unitPrice)}</td>
                                  <td className="p-2.5 text-left font-mono text-amber-700">
                                    {lineDisc > 0 ? `-${formatMoney(lineDisc)}` : '0.00'}
                                  </td>
                                  <td className="p-2.5 text-left font-mono">{formatMoney(lineNet)}</td>
                                  <td className="p-2.5 text-left font-mono font-extrabold text-slate-900">
                                    {formatMoney(lineNet)}
                                  </td>
                                </tr>
                              ) : (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-mono text-slate-500">{idx + 1}</td>
                                  <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                                  <td className="p-2.5 text-center font-mono font-bold">{item.quantity}</td>
                                  <td className="p-2.5 text-left font-mono">{formatMoney(item.unitPrice)}</td>
                                  <td className="p-2.5 text-left font-mono text-amber-700">
                                    {lineDisc > 0 ? `-${formatMoney(lineDisc)}` : '0.00'}
                                  </td>
                                  <td className="p-2.5 text-left font-mono">{formatMoney(item.subtotal)}</td>
                                  <td className="p-2.5 text-center font-mono">{resolvedInvoice.vatRate}%</td>
                                  <td className="p-2.5 text-left font-mono text-slate-600">{formatMoney(item.vatAmount)}</td>
                                  <td className="p-2.5 text-left font-mono font-extrabold text-slate-900">
                                    {formatMoney(item.total)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals and QR Code Section */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 text-slate-700 font-bold">
                            <QrCode className="w-4 h-4 text-slate-600" />
                            <span>رمز الاستجابة السريعة (QR Code للفوترة الإلكترونية):</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 break-all select-all">
                            {resolvedInvoice.qrData ||
                              `ORBIX-${resolvedInvoice.invoiceNumber}-${resolvedInvoice.grandTotal}-${currency}-${resolvedInvoice.vatTotal}-VAT`}
                          </div>
                          {resolvedInvoice.notes && (
                            <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                              <span className="font-bold">ملاحظات:</span> {resolvedInvoice.notes}
                            </p>
                          )}
                        </div>

                        <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 shadow-xs">
                          <div className="flex justify-between text-xs text-slate-300">
                            <span>إجمالي الأصناف قبل الخصم:</span>
                            <span className="font-bold text-white">{formatMoney(itemsGrossTotal)}</span>
                          </div>
                          {resolvedInvoice.discountTotal > 0 && (
                            <div className="flex justify-between text-xs text-amber-300 font-bold">
                              <span>إجمالي الخصم:</span>
                              <span>-{formatMoney(resolvedInvoice.discountTotal)}</span>
                            </div>
                          )}
                          {!isVatZero && resolvedInvoice.discountTotal > 0 && (
                            <div className="flex justify-between text-xs text-slate-300">
                              <span>المجموع بعد الخصم (قبل الضريبة):</span>
                              <span className="font-bold text-white">{formatMoney(resolvedInvoice.subtotal)}</span>
                            </div>
                          )}
                          {!isVatZero && (
                            <div className="flex justify-between text-xs text-slate-300">
                              <span>ضريبة القيمة المضافة ({resolvedInvoice.vatRate}%):</span>
                              <span className="font-bold text-emerald-400">+{formatMoney(resolvedInvoice.vatTotal)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700 pt-2">
                            <span>الإجمالي الكلي المستحق:</span>
                            <span className="text-emerald-400 text-base font-black">{formatMoney(resolvedInvoice.grandTotal)}</span>
                          </div>
                          {resolvedInvoice.paidAmount > 0 && (
                            <div className="flex justify-between text-xs text-slate-300 border-t border-slate-800 pt-1.5">
                              <span>المدفوع:</span>
                              <span className="font-bold text-emerald-400">{formatMoney(resolvedInvoice.paidAmount)}</span>
                            </div>
                          )}
                          {resolvedInvoice.remainingAmount > 0 && (
                            <div className="flex justify-between text-xs font-bold text-rose-300">
                              <span>المتبقي:</span>
                              <span>{formatMoney(resolvedInvoice.remainingAmount)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* 2. PAYMENT RECEIPT / DISBURSEMENT VOUCHER VIEW */}
            {(documentTarget.type === 'receipt' || documentTarget.type === 'payment_voucher') && resolvedReceipt && (
              <div className="space-y-6">
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-200 text-center space-y-3">
                  <span className="text-xs font-bold text-slate-600 block">
                    {resolvedReceipt.type === 'collection' ? 'المبلغ المحصل المستلم' : 'المبلغ المصروف والمسدد'}
                  </span>
                  <div className="text-3xl font-black text-emerald-800 font-mono">
                    {formatDualMoney(resolvedReceipt.amount)}
                  </div>
                  <div className="text-xs font-semibold text-slate-700 bg-white/80 py-1.5 px-4 rounded-xl inline-block border border-emerald-200">
                    طريقة الدفع:{' '}
                    <span className="font-bold text-slate-900">
                      {resolvedReceipt.paymentMethod === 'cash'
                        ? 'نقداً (خزينة)'
                        : resolvedReceipt.paymentMethod === 'bank_transfer'
                        ? 'تحويل بنكي'
                        : resolvedReceipt.paymentMethod === 'card'
                        ? 'بطاقة دفع / فيزا / مدى'
                        : resolvedReceipt.paymentMethod === 'cheque'
                        ? 'شيك بنكي'
                        : 'آجل'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 font-semibold">
                        {resolvedReceipt.type === 'collection' ? 'استلمنا من السيد / السادة:' : 'صرفنا إلى السيد / السادة:'}
                      </span>
                      <div className="font-extrabold text-slate-900 text-sm mt-0.5">{resolvedReceipt.partyName}</div>
                    </div>
                    {resolvedReceipt.referenceNumber && (
                      <div>
                        <span className="text-slate-500">المرجع المرتبط / الفاتورة:</span>
                        <div className="font-mono font-bold text-slate-800">{resolvedReceipt.referenceNumber}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 sm:text-left border-t sm:border-t-0 sm:border-r sm:pr-4 border-slate-200 pt-2 sm:pt-0">
                    <div>
                      <span className="text-slate-500">تاريخ المعاملة:</span>
                      <div className="font-mono font-bold text-slate-900">{resolvedReceipt.date}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">الحساب المالي المودع / المسحوب منه:</span>
                      <div className="font-bold text-blue-800">
                        {getAccount(resolvedReceipt.accountId)?.name || 'الخزينة النقدية الرئيسية'}
                      </div>
                    </div>
                  </div>
                </div>

                {resolvedReceipt.notes && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-1">البيان وملاحظات السند:</span>
                    <p className="text-slate-600">{resolvedReceipt.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. SALES RETURN / CREDIT NOTE VIEW */}
            {documentTarget.type === 'return' && resolvedReturn && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/40 p-4 rounded-xl border border-amber-200 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold">بيانات العميل:</span>
                    <div className="font-extrabold text-slate-900 text-sm">{resolvedReturn.customerName}</div>
                    {resolvedReturn.invoiceNumber && (
                      <div className="text-slate-700">
                        مرتجع من الفاتورة رقم: <span className="font-mono font-bold">{resolvedReturn.invoiceNumber}</span>
                      </div>
                    )}
                  </div>
                  <div className="sm:text-left space-y-1 border-t sm:border-t-0 sm:border-r sm:pr-4 border-amber-200 pt-2 sm:pt-0">
                    <div>تاريخ المرتجع: <span className="font-mono font-bold">{resolvedReturn.date}</span></div>
                    <div>
                      طريقة استرداد القيمة:{' '}
                      <span className="font-bold text-slate-900">
                        {resolvedReturn.refundMethod === 'customer_balance'
                          ? 'خصم من رصيد العميل / قيد في حسابه'
                          : resolvedReturn.refundMethod === 'cash_vault'
                          ? 'صرف نقدي فوري من الخزينة'
                          : 'تحويل بنكي'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">الصنف المرتجع</th>
                        <th className="p-2.5 text-center">الكمية</th>
                        <th className="p-2.5 text-left">سعر الوحدة</th>
                        <th className="p-2.5 text-left">الضريبة</th>
                        <th className="p-2.5 text-left">إجمالي المرتجع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {resolvedReturn.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                          <td className="p-2.5 text-center font-mono font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-left font-mono">{formatMoney(item.unitPrice)}</td>
                          <td className="p-2.5 text-left font-mono">{formatMoney(item.vatAmount)}</td>
                          <td className="p-2.5 text-left font-mono font-extrabold text-amber-700">
                            {formatMoney(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>المجموع قبل الضريبة:</span>
                    <span className="font-bold text-white">{formatMoney(resolvedReturn.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>ضريبة القيمة المضافة المستردة:</span>
                    <span className="font-bold text-emerald-400">{formatMoney(resolvedReturn.vatTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700 pt-2">
                    <span>إجمالي قيمة الإشعار الدائن المسترد:</span>
                    <span className="text-amber-400 text-base">{formatMoney(resolvedReturn.totalRefundAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. PURCHASE INVOICE VIEW */}
            {documentTarget.type === 'purchase' && resolvedPurchase && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-50/40 p-4 rounded-xl border border-purple-200 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold">بيانات المورد (البائع):</span>
                    <div className="font-extrabold text-slate-900 text-sm">{resolvedPurchase.vendorName}</div>
                    {getVendor(resolvedPurchase.vendorId)?.taxNumber && (
                      <div className="text-slate-600 font-mono">الرقم الضريبي: {getVendor(resolvedPurchase.vendorId)?.taxNumber}</div>
                    )}
                  </div>
                  <div className="sm:text-left space-y-1 border-t sm:border-t-0 sm:border-r sm:pr-4 border-purple-200 pt-2 sm:pt-0">
                    <div>تاريخ الفاتورة: <span className="font-mono font-bold">{resolvedPurchase.date}</span></div>
                    <div>تاريخ الاستحقاق: <span className="font-mono font-bold">{resolvedPurchase.dueDate}</span></div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">الصنف</th>
                        <th className="p-2.5 text-center">الكمية</th>
                        <th className="p-2.5 text-left">تكلفة الوحدة</th>
                        <th className="p-2.5 text-left">الضريبة التقديرية</th>
                        <th className="p-2.5 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {resolvedPurchase.items.map((item, idx) => {
                        const itemVat = Math.max(0, item.total - item.quantity * item.unitPrice);
                        return (
                          <tr key={idx}>
                            <td className="p-2.5 font-mono text-slate-500">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                            <td className="p-2.5 text-center font-mono font-bold">{item.quantity}</td>
                            <td className="p-2.5 text-left font-mono">{formatMoney(item.unitPrice)}</td>
                            <td className="p-2.5 text-left font-mono">{formatMoney(itemVat)}</td>
                            <td className="p-2.5 text-left font-mono font-bold text-purple-900">{formatMoney(item.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>المجموع قبل الضريبة:</span>
                    <span className="font-bold text-white">{formatMoney(resolvedPurchase.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>ضريبة المدخلات:</span>
                    <span className="font-bold text-emerald-400">{formatMoney(resolvedPurchase.vatTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700 pt-2">
                    <span>إجمالي فاتورة التوريد:</span>
                    <span className="text-purple-300 text-base">{formatMoney(resolvedPurchase.grandTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. JOURNAL ENTRY VIEW */}
            {documentTarget.type === 'journal' && resolvedJournal && (
              <div className="space-y-6">
                <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 font-semibold block">بيان القيد المحاسبي:</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{resolvedJournal.description}</div>
                  </div>
                  <div className="text-left font-mono">
                    <div>التاريخ: {resolvedJournal.date}</div>
                    {resolvedJournal.reference && <div>المرجع: {resolvedJournal.reference}</div>}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2.5">كود الحساب</th>
                        <th className="p-2.5">اسم الحساب</th>
                        <th className="p-2.5">البيان التحليلي</th>
                        <th className="p-2.5 text-left text-emerald-800">مدين (Debit)</th>
                        <th className="p-2.5 text-left text-blue-800">دائن (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {resolvedJournal.lines.map((l, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-700">{l.accountCode}</td>
                          <td className="p-2.5 font-sans font-bold text-slate-900">{l.accountName}</td>
                          <td className="p-2.5 font-sans text-slate-600">{l.description || '—'}</td>
                          <td className="p-2.5 text-left font-bold text-emerald-700">
                            {l.debit > 0 ? formatMoney(l.debit) : '—'}
                          </td>
                          <td className="p-2.5 text-left font-bold text-blue-700">
                            {l.credit > 0 ? formatMoney(l.credit) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-extrabold border-t-2 border-slate-300 font-mono">
                      <tr>
                        <td colSpan={3} className="p-2.5 text-slate-800 font-sans">
                          إجمالي التوازن المحاسبي للقيد:
                        </td>
                        <td className="p-2.5 text-left text-emerald-800">{formatMoney(resolvedJournal.totalDebit)}</td>
                        <td className="p-2.5 text-left text-blue-800">{formatMoney(resolvedJournal.totalCredit)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Fallback if document details are from direct generic row */}
            {!resolvedInvoice &&
              !resolvedReceipt &&
              !resolvedReturn &&
              !resolvedPurchase &&
              !resolvedJournal && (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>بيانات الحركة المرجعية:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>المرجع: <span className="font-mono font-bold">{documentTarget.reference || '-'}</span></div>
                    <div>نوع الحركة: <span className="font-bold">{documentTarget.type}</span></div>
                    {documentTarget.data?.description && (
                      <div className="col-span-2">
                        الوصف / البيان: <span className="font-medium">{documentTarget.data.description}</span>
                      </div>
                    )}
                    {documentTarget.data?.debit !== undefined && (
                      <div>مدين: <span className="font-bold text-slate-900">{formatMoney(documentTarget.data.debit)}</span></div>
                    )}
                    {documentTarget.data?.credit !== undefined && (
                      <div>دائن: <span className="font-bold text-emerald-700">{formatMoney(documentTarget.data.credit)}</span></div>
                    )}
                  </div>
                </div>
              )}

            {/* Standardized Signatures & Footer with Company Profile */}
            <PrintFooter
              notes={
                resolvedInvoice?.notes ||
                resolvedPurchase?.notes ||
                resolvedReceipt?.notes ||
                resolvedReturn?.notes
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
