import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { EmployeeAdjustment, AdjustmentType } from '../../types';
import {
  Award,
  AlertTriangle,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
} from 'lucide-react';

export const HrAdjustmentsTab: React.FC = () => {
  const {
    employees,
    employeeAdjustments,
    addEmployeeAdjustment,
    deleteEmployeeAdjustment,
    formatMoney,
    showAlert,
    showConfirm,
  } = useErp();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterEmpId, setFilterEmpId] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formEmpId, setFormEmpId] = useState<string>('');
  const [formType, setFormType] = useState<AdjustmentType>('bonus');
  const [formAmount, setFormAmount] = useState<number>(500);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formReason, setFormReason] = useState<string>('');
  const [formMonth, setFormMonth] = useState<number>(new Date().getMonth() + 1);
  const [formYear, setFormYear] = useState<number>(new Date().getFullYear());

  // Filtered adjustments
  const filteredList = useMemo(() => {
    return employeeAdjustments.filter((adj) => {
      if (filterType !== 'all' && adj.type !== filterType) return false;
      if (filterEmpId !== 'all' && adj.employeeId !== filterEmpId) return false;
      if (filterMonth !== 0 && adj.month && adj.month !== filterMonth) return false;
      if (filterYear !== 0 && adj.year && adj.year !== filterYear) return false;
      return true;
    });
  }, [employeeAdjustments, filterType, filterEmpId, filterMonth, filterYear]);

  // Statistics
  const stats = useMemo(() => {
    const totalBonus = employeeAdjustments
      .filter((a) => a.type === 'bonus' || a.type === 'reward')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalPenalty = employeeAdjustments
      .filter((a) => a.type === 'penalty' || a.type === 'deduction')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const netImpact = totalBonus - totalPenalty;

    const pendingCount = employeeAdjustments.filter((a) => a.status === 'pending').length;

    return {
      totalBonus,
      totalPenalty,
      netImpact,
      pendingCount,
    };
  }, [employeeAdjustments]);

  const handleOpenAdd = () => {
    setFormEmpId(employees[0]?.id || '');
    setFormType('bonus');
    setFormAmount(500);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormReason('');
    setFormMonth(new Date().getMonth() + 1);
    setFormYear(new Date().getFullYear());
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === formEmpId);
    if (!emp) {
      showAlert({
        title: 'تنبيه',
        message: 'يرجى اختيار الموظف أولاً.',
        type: 'warning',
        confirmText: 'حسناً',
      });
      return;
    }

    if (formAmount <= 0) {
      showAlert({
        title: 'قيمة غير صالحة',
        message: 'يرجى إدخال مبلغ أكبر من الصفر.',
        type: 'error',
        confirmText: 'تصحيح',
      });
      return;
    }

    addEmployeeAdjustment({
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.name,
      type: formType,
      amount: Number(formAmount),
      date: formDate,
      reason: formReason,
      month: Number(formMonth),
      year: Number(formYear),
      status: 'pending',
    });

    showAlert({
      title: 'تم تسجيل السند بنجاح',
      message: `تم تسجيل سند ${
        formType === 'bonus' || formType === 'reward' ? 'المكافأة' : 'الجزاء'
      } للموظف ${emp.name} بمبلغ ${formatMoney(formAmount)} وسيتم إدراجه في مسير رواتب شهر ${formMonth}/${formYear}.`,
      type: 'success',
      confirmText: 'حسناً',
    });

    setIsModalOpen(false);
  };

  const handleDelete = (adj: EmployeeAdjustment) => {
    showConfirm(
      `هل أنت متأكد من حذف سند (${adj.adjustmentNumber}) الخاص بالموظف "${adj.employeeName}"؟`,
      () => {
        deleteEmployeeAdjustment(adj.id);
      },
      'تأكيد الحذف',
      { confirmText: 'حذف', type: 'error' }
    );
  };

  const getTypeBadge = (type: AdjustmentType) => {
    switch (type) {
      case 'bonus':
      case 'reward':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ArrowUpRight className="w-3 h-3 text-emerald-600" />
            مكافأة تشجيعية (+)
          </span>
        );
      case 'penalty':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <ArrowDownLeft className="w-3 h-3 text-rose-600" />
            جزاء / خصم إداري (-)
          </span>
        );
      case 'deduction':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <ArrowDownLeft className="w-3 h-3 text-amber-600" />
            استقطاع عام (-)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">إدارة الجزاءات والمكافآت والتسويات</h3>
            <p className="text-xs text-slate-500">
              صرف المكافآت التشجيعية وتطبيق الخصومات والجزاءات الإدارية مع الربط المباشر بمسير الرواتب
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إضافة مكافأة / جزاء جديد
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>إجمالي المكافآت والحوافز</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1 privacy-blur">
            +{formatMoney(stats.totalBonus)}
          </div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">مكافآت مستحقة للموظفين</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>إجمالي الجزاءات والخصومات</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 mt-1 privacy-blur">
            -{formatMoney(stats.totalPenalty)}
          </div>
          <div className="text-[10px] text-rose-700/80 mt-0.5">خصومات وجزاءات مستقطعة</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>صافي أثر التعديلات</span>
            <Award className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div
            className={`text-xl font-bold mt-1 privacy-blur ${
              stats.netImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {stats.netImpact >= 0 ? '+' : ''}
            {formatMoney(stats.netImpact)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">المكافآت مطروحاً منها الجزاءات</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>سندات معلقة للمسير القادم</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats.pendingCount}</div>
          <div className="text-[10px] text-blue-700/80 mt-0.5">تدرج في المسير القادم تلقائياً</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">نوع السند:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          >
            <option value="all">كافة الأنواع</option>
            <option value="bonus">مكافأة تشجيعية (+)</option>
            <option value="reward">حافز تميز (+)</option>
            <option value="penalty">جزاء إداري (-)</option>
            <option value="deduction">استقطاع (-)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">الموظف:</span>
          <select
            value={filterEmpId}
            onChange={(e) => setFilterEmpId(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          >
            <option value="all">جميع الموظفين</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">شهر التطبيق:</span>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          >
            <option value={0}>كافة الشهور</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                شهر {m}
              </option>
            ))}
          </select>
        </div>

        {(filterType !== 'all' || filterEmpId !== 'all' || filterMonth !== 0) && (
          <button
            type="button"
            onClick={() => {
              setFilterType('all');
              setFilterEmpId('all');
              setFilterMonth(0);
            }}
            className="text-slate-500 hover:text-slate-800 underline mr-auto"
          >
            إعادة تعيين الفلاتر
          </button>
        )}
      </div>

      {/* Adjustments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Award className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">لا توجد سندات مكافآت أو جزاءات مسجلة</h4>
            <p className="text-xs text-slate-400">
              يمكنك إصدار سند مكافأة أو جزاء جديد عبر الزر بالأعلى.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">رقم السند</th>
                  <th className="py-3 px-4">الموظف</th>
                  <th className="py-3 px-4">النوع</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">شهر التطبيق</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">السبب والتفاصيل</th>
                  <th className="py-3 px-4">حالة المسير</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((adj) => {
                  const isPositive = adj.type === 'bonus' || adj.type === 'reward';

                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {adj.adjustmentNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{adj.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{adj.employeeCode}</div>
                      </td>
                      <td className="py-3 px-4">{getTypeBadge(adj.type)}</td>
                      <td className="py-3 px-4 font-mono font-bold privacy-blur text-sm">
                        <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                          {isPositive ? '+' : '-'}
                          {formatMoney(adj.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800 font-semibold">
                        شهر {adj.month || '-'} / {adj.year || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{adj.date}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate font-medium">
                        {adj.reason}
                      </td>
                      <td className="py-3 px-4">
                        {adj.status === 'applied_to_payroll' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            مدرج بالمسير
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            معلق للمسير
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(adj)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                إصدار سند مكافأة أو جزاء جديد
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">الموظف *</label>
                  <select
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode} - {emp.jobTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">نوع الحركة / السند *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans font-bold"
                  >
                    <option value="bonus">مكافأة تميز / أداء تشجيعي (+ يضاف للراتب)</option>
                    <option value="reward">حافز ومكافأة استثنائية (+ يضاف للراتب)</option>
                    <option value="penalty">جزاء أو خصم إداري (- يخصم من الراتب)</option>
                    <option value="deduction">استقطاع أو تسوية عامة (- يخصم من الراتب)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ *</label>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ القرار / السند *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">يُطبق في مسير شهر *</label>
                  <select
                    value={formMonth}
                    onChange={(e) => setFormMonth(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        شهر {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">سنة المسير *</label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">سبب ومبرر القرار *</label>
                  <textarea
                    rows={2}
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder="مكافأة أداء وتحقيق التارجت، خصم تأخير أو غياب..."
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs"
                >
                  حفظ السند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

