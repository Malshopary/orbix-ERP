import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import { Customer } from '../types';
import { printDocumentElement } from '../utils/printUtils';
import { DocumentViewerModal, DocumentViewerTarget } from './DocumentViewerModal';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  X,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  TrendingDown,
  TrendingUp,
  Receipt,
  RotateCcw,
  Clock,
  Layers,
  ArrowUpDown,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface CustomerStatementModalProps {
  customerId: string;
  onClose: () => void;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  customerId,
  onClose,
}) => {
  const {
    customers,
    companyProfile,
    currency,
    formatMoney,
    formatDualMoney,
    getCustomerStatement,
    salesInvoices,
    priceLists,
    showAlert,
  } = useErp();

  const [statementType, setStatementType] = useState<
    'detailed' | 'summary' | 'aging' | 'items'
  >('detailed');

  // Active document preview modal state
  const [activeDocViewer, setActiveDocViewer] = useState<DocumentViewerTarget | null>(null);

  // Date filters
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const handleOpenDocument = (tx: {
    id?: string;
    type?: string;
    reference?: string;
    description?: string;
    debit?: number;
    credit?: number;
    date?: string;
  }) => {
    if (!tx.reference && !tx.id) return;
    const ref = tx.reference || '';
    const id = tx.id || '';
    const type = tx.type || '';

    if (type === 'invoice' || ref.startsWith('INV-') || ref.startsWith('POS-')) {
      setActiveDocViewer({ type: 'invoice', id, reference: ref, data: tx });
    } else if (type === 'receipt' || ref.startsWith('REC-') || ref.startsWith('PAY-')) {
      if (
        ref.startsWith('REC-PAY') ||
        ref.startsWith('PAY-') ||
        tx.description?.includes('صرف') ||
        tx.description?.includes('سداد')
      ) {
        setActiveDocViewer({ type: 'payment_voucher', id, reference: ref, data: tx });
      } else {
        setActiveDocViewer({ type: 'receipt', id, reference: ref, data: tx });
      }
    } else if (type === 'return' || ref.startsWith('RET-') || ref.startsWith('RTN-')) {
      setActiveDocViewer({ type: 'return', id, reference: ref, data: tx });
    } else if (type === 'purchase' || ref.startsWith('PUR-')) {
      setActiveDocViewer({ type: 'purchase', id, reference: ref, data: tx });
    } else if (type === 'journal' || ref.startsWith('JE-')) {
      setActiveDocViewer({ type: 'journal', id, reference: ref, data: tx });
    } else {
      setActiveDocViewer({ type: 'invoice', id, reference: ref, data: tx });
    }
  };

  const statementData = useMemo(() => {
    return getCustomerStatement(customerId, startDate || undefined, endDate || undefined);
  }, [customerId, startDate, endDate, getCustomerStatement]);

  const customer = statementData.customer;
  const customerPriceList = priceLists.find((pl) => pl.id === customer.priceListId) || priceLists.find((pl) => pl.isDefault);

  // Purchased items breakdown for this customer in selected period
  const purchasedItemsBreakdown = useMemo(() => {
    const customerInvoicesInPeriod = salesInvoices.filter((inv) => {
      const matchCust = inv.customerId === customerId;
      const matchDate = (!startDate || inv.date >= startDate) && (!endDate || inv.date <= endDate);
      return matchCust && matchDate;
    });

    const itemMap = new Map<
      string,
      { productId: string; productName: string; quantity: number; totalAmount: number; avgPrice: number; count: number }
    >();

    customerInvoicesInPeriod.forEach((inv) => {
      inv.items.forEach((item) => {
        const existing = itemMap.get(item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.totalAmount += item.total;
          existing.count += 1;
          existing.avgPrice = existing.totalAmount / existing.quantity;
        } else {
          itemMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            totalAmount: item.total,
            avgPrice: item.unitPrice,
            count: 1,
          });
        }
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [salesInvoices, customerId, startDate, endDate]);

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [zoom, setZoom] = useState<number>(100);

  const handlePrint = () => {
    printDocumentElement('customer-statement-sheet', {
      title: `كشف حساب عميل - ${customer?.name || ''}`,
      orientation,
    });
  };

  const handlePresetDate = (type: 'today' | 'this_month' | 'this_quarter' | 'this_year' | 'all') => {
    const now = new Date();
    if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (type === 'this_month') {
      setStartDate(firstDayOfMonth);
      setEndDate(todayStr);
    } else if (type === 'this_quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      setStartDate(new Date(now.getFullYear(), qMonth, 1).toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (type === 'this_year') {
      setStartDate(new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (type === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto print-preview-modal-layer">
      <div
        className={`bg-white rounded-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[96vh] flex flex-col text-slate-900 transition-all print-modal-card ${
          orientation === 'landscape' ? 'max-w-6xl' : 'max-w-5xl'
        }`}
      >
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                كشف حساب عميل: {customer.name}
                {customer.code && (
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                    {customer.code}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                تقرير شامل لجميع الحركات المالية، الفواتير، المردودات، والمسحوبات مع احتساب الأرصدة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Orientation buttons */}
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
              id="print-statement-btn"
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              طباعة الكشف
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls (Hidden in Print) */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 my-3 space-y-3 print:hidden text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Statement Type Selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 font-bold">
              <button
                onClick={() => setStatementType('detailed')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statementType === 'detailed'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                كشف تفصيلي بالحركات
              </button>
              <button
                onClick={() => setStatementType('summary')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statementType === 'summary'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ملخص إجمالي للأرصدة
              </button>
              <button
                onClick={() => setStatementType('aging')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statementType === 'aging'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الفواتير المستحقة والمعلقة
              </button>
              <button
                onClick={() => setStatementType('items')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  statementType === 'items'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                مسحوبات الأصناف
              </button>
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium ml-1">الفترة:</span>
              <button
                onClick={() => handlePresetDate('today')}
                className="px-2 py-1 bg-white hover:bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-medium"
              >
                اليوم
              </button>
              <button
                onClick={() => handlePresetDate('this_month')}
                className="px-2 py-1 bg-white hover:bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-medium"
              >
                الشهر الحالي
              </button>
              <button
                onClick={() => handlePresetDate('this_year')}
                className="px-2 py-1 bg-white hover:bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-medium"
              >
                السنة المالية
              </button>
              <button
                onClick={() => handlePresetDate('all')}
                className="px-2 py-1 bg-white hover:bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-medium"
              >
                الكل
              </button>
            </div>
          </div>

          {/* Custom Date Inputs */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-semibold">من تاريخ:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600 font-semibold">إلى تاريخ:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
              />
            </div>
            <div className="text-slate-500 mr-auto flex items-center gap-2">
              <span>قائمة الأسعار المطبقة:</span>
              <span className="font-bold text-slate-800 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                {customerPriceList?.name || 'الافتراضية'}
              </span>
            </div>
          </div>
        </div>

        {/* Printable & Exportable Statement Document Canvas */}
        <div className="overflow-y-auto flex-1 pr-1 bg-slate-50/50 p-2 rounded-xl flex justify-center">
          <div
            id="customer-statement-sheet"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
            }}
            className={`printable-sheet printable-page bg-white border border-slate-300 p-6 sm:p-8 rounded-xl space-y-6 text-xs text-slate-900 w-full ${
              orientation === 'landscape' ? 'print-landscape max-w-[297mm]' : 'print-portrait max-w-[210mm]'
            }`}
          >
            {/* Standardized Document Header with Logo and Company Info */}
            <PrintHeader
              docTitle={
                statementType === 'detailed'
                  ? 'كشف حساب تفصيلي (STATEMENT OF ACCOUNT)'
                  : statementType === 'summary'
                  ? 'كشف ملخص الحساب (ACCOUNT SUMMARY)'
                  : statementType === 'aging'
                  ? 'كشف الفواتير المستحقة (OUTSTANDING INVOICES)'
                  : 'كشف مسحوبات الأصناف (PRODUCT SALES)'
              }
              docSubtitle={`الفترة: ${startDate || 'البداية'} إلى ${endDate || 'الآن'}`}
              date={new Date().toISOString().split('T')[0]}
              additionalMeta={[
                { label: 'العميل', value: customer.name },
                { label: 'كود العميل', value: customer.code || 'CUST-000' },
              ]}
              orientation={orientation}
            />

            {/* Customer Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="space-y-1">
                <div className="text-slate-500 font-semibold">بيانات العميل:</div>
                <div className="font-extrabold text-slate-900 text-sm">
                  {customer.name} {customer.companyName ? `(${customer.companyName})` : ''}
                </div>
                <div className="text-slate-600">كود العميل: <span className="font-mono font-bold">{customer.code || 'CUST-000'}</span></div>
                {customer.taxNumber && (
                  <div className="text-slate-600">الرقم الضريبي: <span className="font-mono font-bold">{customer.taxNumber}</span></div>
                )}
                <div className="text-slate-600">الهاتف: {customer.phone || 'غير مسجل'} | العنوان: {customer.address || '-'}</div>
              </div>

              <div className="sm:text-left space-y-1 border-t sm:border-t-0 sm:border-r sm:pr-4 border-slate-200 pt-2 sm:pt-0">
                <div className="text-slate-500 font-semibold">المعلومات الائتمانية والمندوب:</div>
                <div>مندوب المبيعات المسؤول: <span className="font-bold text-blue-800">{customer.salesRepName || 'المبيعات المباشرة'}</span></div>
                <div>رصيد نقاط الولاء: <span className="font-bold text-amber-700 font-mono">{customer.loyaltyPoints || 0} نقطة</span></div>
                <div>الحد الائتماني المسموح: <span className="font-bold text-slate-800">{formatMoney(customer.creditLimit)}</span></div>
                <div>فترة السماح بالسداد: <span className="font-bold text-slate-800">{customer.paymentTermsDays || 30} يوم</span></div>
                <div>قائمة الأسعار: <span className="font-bold text-emerald-800">{customerPriceList?.name || 'الافتراضية'}</span></div>
                <div className="pt-1 text-sm font-extrabold text-slate-900">
                  صافي الرصيد الحالي المستحق: <span className="text-rose-700">{formatDualMoney(customer.currentBalance)}</span>
                </div>
              </div>
            </div>

            {/* Quick KPI Financial Cards for the Statement */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 font-semibold block">الرصيد الافتتاحي</span>
                <span className="font-extrabold text-slate-900 text-sm">{formatMoney(statementData.openingBalance)}</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center">
                <span className="text-[11px] text-blue-700 font-semibold block">إجمالي المبيعات بالفترة</span>
                <span className="font-extrabold text-blue-900 text-sm">{formatMoney(statementData.totalSales)}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                <span className="text-[11px] text-emerald-700 font-semibold block">إجمالي السدادات والمقبوضات</span>
                <span className="font-extrabold text-emerald-900 text-sm">{formatMoney(statementData.totalReceipts)}</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
                <span className="text-[11px] text-amber-700 font-semibold block">إجمالي المردودات</span>
                <span className="font-extrabold text-amber-900 text-sm">{formatMoney(statementData.totalReturns)}</span>
              </div>
            </div>

            {/* TYPE 1: DETAILED TRANSACTIONS TABLE */}
            {statementType === 'detailed' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="py-2.5 px-3">التاريخ</th>
                        <th className="py-2.5 px-3">نوع الحركة</th>
                        <th className="py-2.5 px-3">المرجع</th>
                        <th className="py-2.5 px-3">البيان / الوصف</th>
                        <th className="py-2.5 px-3 text-left">مدين (مبيعات +)</th>
                        <th className="py-2.5 px-3 text-left">دائن (سداد/مرتجع -)</th>
                        <th className="py-2.5 px-3 text-left">الرصيد التراكمي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* Opening Balance Row */}
                      <tr className="bg-slate-50/70 font-semibold text-slate-600">
                        <td className="py-2 px-3 font-mono">{startDate || '-'}</td>
                        <td className="py-2 px-3">رصيد افتتاحي</td>
                        <td className="py-2 px-3 font-mono">-</td>
                        <td className="py-2 px-3 text-slate-500">الرصيد المرحل قبل بداية الفترة المحددة</td>
                        <td className="py-2 px-3 text-left">-</td>
                        <td className="py-2 px-3 text-left">-</td>
                        <td className="py-2 px-3 text-left font-bold font-mono text-slate-900">
                          {formatMoney(statementData.openingBalance)}
                        </td>
                      </tr>

                      {statementData.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-400">
                            لا توجد حركات مالية مسجلة لهذا العميل خلال الفترة المحددة.
                          </td>
                        </tr>
                      ) : (
                        statementData.transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono text-slate-600">{tx.date}</td>
                            <td className="py-2.5 px-3 font-medium">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                  tx.type === 'invoice'
                                    ? 'bg-blue-50 text-blue-700'
                                    : tx.type === 'receipt'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : tx.type === 'return'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {tx.typeName}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                              {tx.reference && tx.reference !== '-' ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocument(tx)}
                                  className="inline-flex items-center gap-1 font-mono font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 px-2 py-1 rounded-lg transition-all cursor-pointer group text-right underline-offset-2 hover:underline"
                                  title="انقر لفتح واستعراض المستند الأصلي (فاتورة / سند / مرتجع)"
                                >
                                  <span>{tx.reference}</span>
                                  <ExternalLink className="w-3 h-3 text-blue-400 group-hover:text-blue-700 transition-colors opacity-70 group-hover:opacity-100 shrink-0" />
                                </button>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{tx.description}</td>
                            <td className="py-2.5 px-3 text-left font-mono font-semibold text-slate-900">
                              {tx.debit > 0 ? formatMoney(tx.debit) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono font-semibold text-emerald-700">
                              {tx.credit > 0 ? formatMoney(tx.credit) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-left font-mono font-extrabold text-slate-900">
                              {formatMoney(tx.balance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 font-extrabold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-slate-800">
                          الإجمالي وحساب الإغلاق للفترة:
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-slate-900">
                          {formatMoney(statementData.totalSales)}
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-emerald-700">
                          {formatMoney(statementData.totalReceipts + statementData.totalReturns)}
                        </td>
                        <td className="py-3 px-3 text-left font-mono text-rose-700 text-sm">
                          {formatMoney(statementData.closingBalance)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* TYPE 2: SUMMARY STATEMENT */}
            {statementType === 'summary' && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm border-b border-slate-200 pb-2">
                    ملخص الذمم والتعاملات الإجمالية للعميل
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">الرصيد الافتتاحي قبل الفترة:</span>
                        <span className="font-bold">{formatMoney(statementData.openingBalance)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">إجمالي المبيعات بالفترة (+):</span>
                        <span className="font-bold text-blue-700">{formatMoney(statementData.totalSales)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">إجمالي المردودات بالفترة (-):</span>
                        <span className="font-bold text-amber-700">{formatMoney(statementData.totalReturns)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">إجمالي السدادات والمقبوضات (-):</span>
                        <span className="font-bold text-emerald-700">{formatMoney(statementData.totalReceipts)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">الحد الائتماني للعميل:</span>
                        <span className="font-bold">{formatMoney(customer.creditLimit)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">الائتمان المتبقي المتاح:</span>
                        <span className="font-bold text-emerald-700">
                          {formatMoney(Math.max(0, customer.creditLimit - statementData.closingBalance))}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">عدد الفواتير غير المسددة:</span>
                        <span className="font-bold text-rose-700">{statementData.unpaidInvoices.length} فاتورة</span>
                      </div>
                      <div className="flex justify-between py-2 border-t-2 border-slate-300 text-sm font-extrabold">
                        <span>صافي الرصيد المستحق النهائي:</span>
                        <span className="text-rose-700">{formatMoney(statementData.closingBalance)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TYPE 3: UNPAID & AGING INVOICES */}
            {statementType === 'aging' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="py-2.5 px-3">رقم الفاتورة</th>
                        <th className="py-2.5 px-3">تاريخ الإصدار</th>
                        <th className="py-2.5 px-3">تاريخ الاستحقاق</th>
                        <th className="py-2.5 px-3">قيمة الفاتورة</th>
                        <th className="py-2.5 px-3">المسدد</th>
                        <th className="py-2.5 px-3">المتبقي المستحق</th>
                        <th className="py-2.5 px-3">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {statementData.unpaidInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-emerald-600 font-bold">
                            جميع فواتير هذا العميل مسددة بالكامل، ولا توجد مستحقات متأخرة!
                          </td>
                        </tr>
                      ) : (
                        statementData.unpaidInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="py-2.5 px-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveDocViewer({
                                    type: 'invoice',
                                    id: inv.id,
                                    reference: inv.invoiceNumber,
                                    data: inv,
                                  })
                                }
                                className="inline-flex items-center gap-1 font-mono font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 px-2 py-1 rounded-lg transition-all cursor-pointer group text-right underline-offset-2 hover:underline"
                                title="انقر لمعاينة تفاصيل الفاتورة"
                              >
                                <span>{inv.invoiceNumber}</span>
                                <ExternalLink className="w-3 h-3 text-blue-400 group-hover:text-blue-700 transition-colors opacity-70 group-hover:opacity-100 shrink-0" />
                              </button>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{inv.date}</td>
                            <td className="py-2.5 px-3 font-mono text-rose-600">{inv.dueDate}</td>
                            <td className="py-2.5 px-3 font-mono">{formatMoney(inv.grandTotal)}</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-700">{formatMoney(inv.paidAmount)}</td>
                            <td className="py-2.5 px-3 font-mono font-extrabold text-rose-700">
                              {formatMoney(inv.remainingAmount)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {inv.status === 'partially_paid' ? 'مسددة جزئياً' : 'غير مسددة'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TYPE 4: PRODUCT BREAKDOWN */}
            {statementType === 'items' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">اسم الصنف / المنتج</th>
                        <th className="py-2.5 px-3 text-center">الكمية المسحوبة</th>
                        <th className="py-2.5 px-3">متوسط السعر</th>
                        <th className="py-2.5 px-3 text-left">إجمالي القيمة المسحوبة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {purchasedItemsBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-slate-400">
                            لا توجد مسحوبات أصناف مسجلة لهذا العميل في الفترة المحددة.
                          </td>
                        </tr>
                      ) : (
                        purchasedItemsBreakdown.map((item, idx) => (
                          <tr key={item.productId}>
                            <td className="py-2.5 px-3 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{item.productName}</td>
                            <td className="py-2.5 px-3 text-center font-extrabold text-slate-800">{item.quantity}</td>
                            <td className="py-2.5 px-3 font-mono">{formatMoney(item.avgPrice)}</td>
                            <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-900">
                              {formatMoney(item.totalAmount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Standardized Signatures & Authentication Stamp Section */}
            <PrintFooter
              preparedByTitle="إعداد / قسم الحسابات"
              approvedByTitle="اعتماد الإدارة المالية"
              receivedByTitle="توقيع وختم العميل بالمصادقة"
              notes="في حال وجود أي ملاحظات أو استفسارات حول الرصيد الوارد بهذا الكشف، يرجى التواصل مع الإدارة المالية خلال 7 أيام من تاريخه."
            />
          </div>
        </div>
      </div>

      {/* Render Document Viewer Modal when a transaction reference is clicked */}
      {activeDocViewer && (
        <DocumentViewerModal
          documentTarget={activeDocViewer}
          onClose={() => setActiveDocViewer(null)}
        />
      )}
    </div>
  );
};
