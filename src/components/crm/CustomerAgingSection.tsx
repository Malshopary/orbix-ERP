import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { Customer } from '../../types';
import {
  Clock,
  Search,
  Users2,
  DollarSign,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  PhoneCall,
  CreditCard,
  ExternalLink,
  ShieldAlert,
  Send,
  CalendarDays,
} from 'lucide-react';

interface CustomerAgingSectionProps {
  onOpenStatement?: (customerId: string) => void;
  onNavigateToPlans?: () => void;
  onNavigateToReminders?: () => void;
}

export const CustomerAgingSection: React.FC<CustomerAgingSectionProps> = ({
  onOpenStatement,
  onNavigateToPlans,
  onNavigateToReminders,
}) => {
  const { customers = [], salesInvoices = [], formatMoney } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [onlyDebtors, setOnlyDebtors] = useState(true);

  // Compute AR aging per customer based on salesInvoices
  const customerAgingData = useMemo(() => {
    const now = new Date();

    return customers.map((c) => {
      const unpaidInvoices = salesInvoices.filter(
        (inv) => inv.customerId === c.id && inv.remainingAmount > 0
      );

      let days0to30 = 0;
      let days31to60 = 0;
      let days61to90 = 0;
      let days90Plus = 0;
      let oldestDate: string | null = null;

      unpaidInvoices.forEach((inv) => {
        const invDate = new Date(inv.date);
        const diffDays = Math.floor((now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
        const rem = inv.remainingAmount;

        if (diffDays <= 30) days0to30 += rem;
        else if (diffDays <= 60) days31to60 += rem;
        else if (diffDays <= 90) days61to90 += rem;
        else days90Plus += rem;

        if (!oldestDate || inv.date < oldestDate) {
          oldestDate = inv.date;
        }
      });

      // If customer has a general balance not fully matched to invoices, assign to 0-30 or oldest
      const invoicesTotal = days0to30 + days31to60 + days61to90 + days90Plus;
      const discrepancy = (c.currentBalance || 0) - invoicesTotal;
      if (discrepancy > 0) {
        days0to30 += discrepancy;
      }

      const totalBalance = Math.max(0, c.currentBalance || 0);

      // Risk score evaluation
      let riskLevel: 'low' | 'medium' | 'high' | 'blocked' = 'low';
      if (c.creditLimit && totalBalance > c.creditLimit) {
        riskLevel = 'blocked';
      } else if (days90Plus > 0) {
        riskLevel = 'high';
      } else if (days61to90 > 0) {
        riskLevel = 'medium';
      }

      return {
        customer: c,
        totalBalance,
        days0to30,
        days31to60,
        days61to90,
        days90Plus,
        oldestDate: oldestDate || '-',
        riskLevel,
      };
    });
  }, [customers, salesInvoices]);

  // Filtered List
  const filteredData = useMemo(() => {
    return customerAgingData.filter((item) => {
      const matchSearch =
        item.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.customer.phone && item.customer.phone.includes(searchQuery));

      const matchDebtor = onlyDebtors ? item.totalBalance > 0 : true;
      return matchSearch && matchDebtor;
    });
  }, [customerAgingData, searchQuery, onlyDebtors]);

  // Overall sums
  const totalReceivables = useMemo(() => {
    return customerAgingData.reduce((sum, i) => sum + i.totalBalance, 0);
  }, [customerAgingData]);

  const total0to30 = useMemo(() => {
    return customerAgingData.reduce((sum, i) => sum + i.days0to30, 0);
  }, [customerAgingData]);

  const total31to60 = useMemo(() => {
    return customerAgingData.reduce((sum, i) => sum + i.days31to60, 0);
  }, [customerAgingData]);

  const total61to90 = useMemo(() => {
    return customerAgingData.reduce((sum, i) => sum + i.days61to90, 0);
  }, [customerAgingData]);

  const total90Plus = useMemo(() => {
    return customerAgingData.reduce((sum, i) => sum + i.days90Plus, 0);
  }, [customerAgingData]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              تقرير أعمار ديون العملاء (AR Debt Aging & Risk)
            </h2>
            <p className="text-xs text-slate-500">
              تحليل دورة التحصيل الائتماني، وتصنيف المخاطر، وفترات تأخر سداد فواتير المبيعات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyDebtors}
              onChange={(e) => setOnlyDebtors(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>عرض العملاء المدينين فقط</span>
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">إجمالي مستحقات العملاء</span>
          <div className="text-xl font-bold text-slate-900 mt-2 font-mono">
            {formatMoney(totalReceivables)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">إجمالي ذمم مدينة قائمة</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-emerald-600">0 - 30 يوم (جارية)</span>
          <div className="text-xl font-bold text-emerald-600 mt-2 font-mono">
            {formatMoney(total0to30)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">ضمن فترة السماح</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-blue-600">31 - 60 يوم</span>
          <div className="text-xl font-bold text-blue-600 mt-2 font-mono">
            {formatMoney(total31to60)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">تستوجب المتابعة والتذكير</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-amber-600">61 - 90 يوم</span>
          <div className="text-xl font-bold text-amber-600 mt-2 font-mono">
            {formatMoney(total61to90)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">متأخرات حرجة</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-rose-600">+90 يوم (مخاطر عالية)</span>
          <div className="text-xl font-bold text-rose-600 mt-2 font-mono">
            {formatMoney(total90Plus)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">تتطلب جدولة أو إجراءات نظامية</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم العميل أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">العميل</th>
                <th className="py-3.5 px-4">حد الائتمان</th>
                <th className="py-3.5 px-4">إجمالي الرصيد</th>
                <th className="py-3.5 px-4 text-emerald-600">0 - 30 يوم</th>
                <th className="py-3.5 px-4 text-blue-600">31 - 60 يوم</th>
                <th className="py-3.5 px-4 text-amber-600">61 - 90 يوم</th>
                <th className="py-3.5 px-4 text-rose-600">+90 يوم</th>
                <th className="py-3.5 px-4">تصنيف المخاطر</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
                    لا توجد مستحقات أو ديون مسجلة
                  </td>
                </tr>
              ) : (
                filteredData.map(({ customer, totalBalance, days0to30, days31to60, days61to90, days90Plus, riskLevel }) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{customer.name}</div>
                      <div className="text-xs font-mono text-slate-500">{customer.phone || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600">
                      {customer.creditLimit ? formatMoney(customer.creditLimit) : 'غير محدد'}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-slate-900">
                      {formatMoney(totalBalance)}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600">
                      {days0to30 > 0 ? formatMoney(days0to30) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600">
                      {days31to60 > 0 ? formatMoney(days31to60) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-600 font-semibold">
                      {days61to90 > 0 ? formatMoney(days61to90) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600 font-bold">
                      {days90Plus > 0 ? formatMoney(days90Plus) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          riskLevel === 'blocked'
                            ? 'bg-rose-100 text-rose-700'
                            : riskLevel === 'high'
                            ? 'bg-rose-50 text-rose-600'
                            : riskLevel === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {riskLevel === 'blocked'
                          ? 'تجاوز حد الائتمان'
                          : riskLevel === 'high'
                          ? 'مخاطر مرتفعة'
                          : riskLevel === 'medium'
                          ? 'مخاطر متوسطة'
                          : 'ائتمان منتظم'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenStatement && (
                          <button
                            onClick={() => onOpenStatement(customer.id)}
                            title="كشف حساب عميل تفصيلي"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs flex items-center gap-1"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>كشف حساب</span>
                          </button>
                        )}
                        {onNavigateToPlans && totalBalance > 0 && (
                          <button
                            onClick={onNavigateToPlans}
                            title="جدولة أقساط"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onNavigateToReminders && totalBalance > 0 && (
                          <button
                            onClick={onNavigateToReminders}
                            title="إرسال تذكير تحصيل"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
