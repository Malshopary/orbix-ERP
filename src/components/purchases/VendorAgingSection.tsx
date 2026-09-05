import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { VendorAgingBucket, Vendor } from '../../types';
import {
  Clock,
  Search,
  Building,
  CreditCard,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpRight,
  TrendingDown,
  Phone,
  CheckCircle2,
  X,
  Check,
} from 'lucide-react';

interface VendorAgingSectionProps {
  onPayVendor?: (vendorId: string) => void;
}

export const VendorAgingSection: React.FC<VendorAgingSectionProps> = ({ onPayVendor }) => {
  const {
    vendorAging = [],
    vendors = [],
    purchaseInvoices = [],
    accounts = [],
    formatMoney,
    recordVendorPayment,
    showAlert,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [onlyDebtors, setOnlyDebtors] = useState(true);

  // Quick Payment Modal
  const [payModalVendor, setPayModalVendor] = useState<Vendor | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('bank_transfer');
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || '');
  const [payInvoiceId, setPayInvoiceId] = useState('');

  // Filtered aging
  const filteredAging = useMemo(() => {
    return vendorAging.filter((v) => {
      const matchSearch =
        v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.phone && v.phone.includes(searchQuery));

      const matchDebtor = onlyDebtors ? v.currentTotal > 0 : true;
      return matchSearch && matchDebtor;
    });
  }, [vendorAging, searchQuery, onlyDebtors]);

  // Overall statistics
  const totalOutstanding = useMemo(() => {
    return vendorAging.reduce((sum, v) => sum + v.currentTotal, 0);
  }, [vendorAging]);

  const total0to30 = useMemo(() => {
    return vendorAging.reduce((sum, v) => sum + v.days0to30, 0);
  }, [vendorAging]);

  const total31to60 = useMemo(() => {
    return vendorAging.reduce((sum, v) => sum + v.days31to60, 0);
  }, [vendorAging]);

  const total61to90 = useMemo(() => {
    return vendorAging.reduce((sum, v) => sum + v.days61to90, 0);
  }, [vendorAging]);

  const total90Plus = useMemo(() => {
    return vendorAging.reduce((sum, v) => sum + v.days90Plus, 0);
  }, [vendorAging]);

  // Quick Pay Handler
  const handleOpenPay = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return;

    // Find unpaid invoices for this vendor
    const unpaidInvoices = purchaseInvoices.filter(
      (inv) => inv.vendorId === vendorId && inv.remainingAmount > 0
    );

    const targetInv = unpaidInvoices[0];
    setPayModalVendor(vendor);
    setPayInvoiceId(targetInv ? targetInv.id : '');
    setPayAmount(targetInv ? targetInv.remainingAmount : vendor.currentBalance || 0);
    setPayMethod('bank_transfer');
    setPayAccountId(accounts.find((a) => a.code === '1120')?.id || accounts[0]?.id || '');
  };

  const handleExecutePayment = () => {
    if (!payModalVendor) return;
    if (payAmount <= 0) {
      showAlert({ title: 'تنبيه', message: 'يرجى إدخال مبلغ سداد صحيح', type: 'warning' });
      return;
    }
    if (!payInvoiceId) {
      showAlert({ title: 'تنبيه', message: 'لا توجد فاتورة مستحقة محددة للسداد', type: 'warning' });
      return;
    }

    recordVendorPayment(payInvoiceId, payAmount, payMethod, payAccountId);

    showAlert({
      title: 'تم السداد بنجاح',
      message: `تم تسجيل سند صرف بقيمة ${formatMoney(payAmount)} للمورد ${payModalVendor.name} وتحديث الحسابات`,
      type: 'success',
    });

    setPayModalVendor(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              تقرير أعمار ديون الموردين (AP Debt Aging)
            </h2>
            <p className="text-xs text-slate-500">
              تحليل زمني لمستحقات الموردين وفواتير الشراء غير المسددة لتنظيم التدفقات النقدية الخارجة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyDebtors}
              onChange={(e) => setOnlyDebtors(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>عرض الموردين المستحقين فقط</span>
          </label>
        </div>
      </div>

      {/* Aging Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">إجمالي المستحقات</span>
          <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
            {formatMoney(totalOutstanding)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">إجمالي ديون الموردين</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-emerald-600">0 - 30 يوم (جارية)</span>
          <div className="text-xl font-bold text-emerald-600 mt-2 font-mono">
            {formatMoney(total0to30)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">ضمن فترة الائتمان العادية</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-blue-600">31 - 60 يوم</span>
          <div className="text-xl font-bold text-blue-600 mt-2 font-mono">
            {formatMoney(total31to60)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">تستحق السداد قريباً</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-amber-600">61 - 90 يوم</span>
          <div className="text-xl font-bold text-amber-600 mt-2 font-mono">
            {formatMoney(total61to90)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">مستحقات متأخرة</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-rose-600">+90 يوم (حرجة)</span>
          <div className="text-xl font-bold text-rose-600 mt-2 font-mono">
            {formatMoney(total90Plus)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">متأخرات حرجة تتطلب التسوية</div>
        </div>
      </div>

      {/* Filter search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم المورد أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">المورد</th>
                <th className="py-3.5 px-4">الهاتف</th>
                <th className="py-3.5 px-4">إجمالي المستحق</th>
                <th className="py-3.5 px-4 text-emerald-600">0 - 30 يوم</th>
                <th className="py-3.5 px-4 text-blue-600">31 - 60 يوم</th>
                <th className="py-3.5 px-4 text-amber-600">61 - 90 يوم</th>
                <th className="py-3.5 px-4 text-rose-600">+90 يوم</th>
                <th className="py-3.5 px-4">أقدم فاتورة</th>
                <th className="py-3.5 px-4 text-center">سداد سريع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAging.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                    لا توجد مستحقات أو ديون متأخرة مطابقة
                  </td>
                </tr>
              ) : (
                filteredAging.map((item) => (
                  <tr
                    key={item.vendorId}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.vendorName}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {item.phone || '-'}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-slate-900">
                      {formatMoney(item.currentTotal)}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600">
                      {item.days0to30 > 0 ? formatMoney(item.days0to30) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600">
                      {item.days31to60 > 0 ? formatMoney(item.days31to60) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-600 font-semibold">
                      {item.days61to90 > 0 ? formatMoney(item.days61to90) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600 font-bold">
                      {item.days90Plus > 0 ? formatMoney(item.days90Plus) : '-'}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {item.oldestBillDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.currentTotal > 0 ? (
                        <button
                          onClick={() => handleOpenPay(item.vendorId)}
                          className="flex items-center gap-1 mx-auto px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>سند صرف</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">مسدد بالكامل</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Pay Modal */}
      {payModalVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    سداد مستحقات للمورد {payModalVendor.name}
                  </h3>
                  <p className="text-xs text-slate-500">تسجيل سند صرف دفعة وتحديث مديونية المورد</p>
                </div>
              </div>
              <button
                onClick={() => setPayModalVendor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  الفاتورة المراد سدادها
                </label>
                <select
                  value={payInvoiceId}
                  onChange={(e) => {
                    setPayInvoiceId(e.target.value);
                    const inv = purchaseInvoices.find((i) => i.id === e.target.value);
                    if (inv) setPayAmount(inv.remainingAmount);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  {purchaseInvoices
                    .filter((i) => i.vendorId === payModalVendor.id && i.remainingAmount > 0)
                    .map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} - متبقي {formatMoney(inv.remainingAmount)} (تاريخ: {inv.date})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  المبلغ المراد صرفه
                </label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  طريقة الصرف
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  <option value="cash">نقداً من الخزينة</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="cheque">شيك بنكي</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  حساب السداد (الخزينة أو البنك)
                </label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  {accounts
                    .filter((a) => a.type === 'asset')
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayModalVendor(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecutePayment}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                <Check className="w-3.5 h-3.5" />
                <span>تأكيد الصرف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
