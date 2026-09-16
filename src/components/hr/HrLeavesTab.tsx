import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { LeaveRequest, LeaveType, LeaveStatus } from '../../types';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Filter,
  User,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const HrLeavesTab: React.FC = () => {
  const {
    employees,
    leaveRequests,
    addLeaveRequest,
    updateLeaveStatus,
    deleteLeaveRequest,
    showAlert,
    showConfirm,
  } = useErp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEmpId, setFilterEmpId] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formEmpId, setFormEmpId] = useState<string>('');
  const [formLeaveType, setFormLeaveType] = useState<LeaveType>('annual');
  const [formStartDate, setFormStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formEndDate, setFormEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formReason, setFormReason] = useState<string>('');

  // Calculate days between dates automatically
  const calculatedDays = useMemo(() => {
    if (!formStartDate || !formEndDate) return 1;
    const start = new Date(formStartDate);
    const end = new Date(formEndDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  }, [formStartDate, formEndDate]);

  // Filtered requests
  const filteredList = useMemo(() => {
    return leaveRequests.filter((req) => {
      if (filterStatus !== 'all' && req.status !== filterStatus) return false;
      if (filterType !== 'all' && req.leaveType !== filterType) return false;
      if (filterEmpId !== 'all' && req.employeeId !== filterEmpId) return false;
      return true;
    });
  }, [leaveRequests, filterStatus, filterType, filterEmpId]);

  // Statistics
  const stats = useMemo(() => {
    const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length;
    const approvedCount = leaveRequests.filter((r) => r.status === 'approved').length;
    const rejectedCount = leaveRequests.filter((r) => r.status === 'rejected').length;

    const today = new Date().toISOString().split('T')[0];
    const currentlyOnLeave = leaveRequests.filter(
      (r) => r.status === 'approved' && r.startDate <= today && r.endDate >= today
    ).length;

    return {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      onLeaveToday: currentlyOnLeave,
    };
  }, [leaveRequests]);

  const handleOpenAdd = () => {
    setFormEmpId(employees[0]?.id || '');
    const today = new Date().toISOString().split('T')[0];
    setFormStartDate(today);
    setFormEndDate(today);
    setFormLeaveType('annual');
    setFormReason('');
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

    if (new Date(formEndDate) < new Date(formStartDate)) {
      showAlert({
        title: 'خطأ في التواريخ',
        message: 'تاريخ نهاية الإجازة لا يمكن أن يكون قبل تاريخ البداية.',
        type: 'error',
        confirmText: 'تصحيح',
      });
      return;
    }

    addLeaveRequest({
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      employeeName: emp.name,
      leaveType: formLeaveType,
      startDate: formStartDate,
      endDate: formEndDate,
      daysCount: calculatedDays,
      reason: formReason,
      status: 'pending',
    });

    showAlert({
      title: 'تم تقديم طلب الإجازة',
      message: `تم تسجيل طلب الإجازة للموظف ${emp.name} لمدة ${calculatedDays} يوم بنجاح وهو قيد المراجعة والاعتماد.`,
      type: 'success',
      confirmText: 'حسناً',
    });

    setIsModalOpen(false);
  };

  const handleApprove = (req: LeaveRequest) => {
    showConfirm(
      `هل أنت متأكد من الموافقة على طلب إجازة الموظف "${req.employeeName}" لمدة (${req.daysCount} يوم) من ${req.startDate} إلى ${req.endDate}؟`,
      () => {
        updateLeaveStatus(req.id, 'approved', 'تمت الموافقة والاعتماد من الموارد البشرية');
        showAlert({
          title: 'تم اعتماد الإجازة',
          message: `تم اعتماد إجازة الموظف ${req.employeeName} بنجاح وتحديث رصيد الإجازات.`,
          type: 'success',
          confirmText: 'حسناً',
        });
      },
      'اعتماد طلب الإجازة',
      { confirmText: 'موافقة واعتماد', type: 'info' }
    );
  };

  const handleReject = (req: LeaveRequest) => {
    showConfirm(
      `هل أنت متأكد من رفض طلب إجازة الموظف "${req.employeeName}"؟`,
      () => {
        updateLeaveStatus(req.id, 'rejected', 'تم الرفض لظروف العمل التشغيلية');
        showAlert({
          title: 'تم رفض الطلب',
          message: `تم رفض طلب إجازة الموظف ${req.employeeName}.`,
          type: 'info',
          confirmText: 'حسناً',
        });
      },
      'رفض طلب الإجازة',
      { confirmText: 'تأكيد الرفض', type: 'error' }
    );
  };

  const handleDelete = (req: LeaveRequest) => {
    showConfirm(
      `هل أنت متأكد من حذف هذا السجل نهائياً؟`,
      () => {
        deleteLeaveRequest(req.id);
      },
      'حذف طلب الإجازة',
      { confirmText: 'حذف', type: 'error' }
    );
  };

  const getLeaveTypeLabel = (type: LeaveType) => {
    switch (type) {
      case 'annual':
        return 'سنوية اعتيادية';
      case 'sick':
        return 'مرضية';
      case 'casual':
        return 'عارضة / طارئة';
      case 'unpaid':
        return 'بدون راتب';
      case 'maternity':
        return 'أمومة / وضع';
      case 'emergency':
        return 'اضطرارية';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            قيد المراجعة
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            معتمدة
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3" />
            مرفوضة
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
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">إدارة الإجازات والأذونات الرسمية</h3>
            <p className="text-xs text-slate-500">
              تقديم طلبات الإجازات السنوية والمرضية، اعتمادها ومتابعة رصيد كل موظف بدقة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          تقديم طلب إجازة جديد
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>طلبات قيد المراجعة</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats.pending}</div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">تنتظر قرار الإدارة</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>إجازات معتمدة</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats.approved}</div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">تم خصمها من الرصيد</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>في إجازة اليوم</span>
            <User className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats.onLeaveToday}</div>
          <div className="text-[10px] text-blue-700/80 mt-0.5">موظف خارج العمل حالياً</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>طلبات مرفوضة</span>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 mt-1">{stats.rejected}</div>
          <div className="text-[10px] text-rose-700/80 mt-0.5">طلب غير موافق عليه</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">حالة الطلب:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          >
            <option value="all">كافة الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">معتمدة</option>
            <option value="rejected">مرفوضة</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">نوع الإجازة:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          >
            <option value="all">كافة الأنواع</option>
            <option value="annual">سنوية اعتيادية</option>
            <option value="sick">مرضية</option>
            <option value="casual">عارضة / طارئة</option>
            <option value="unpaid">بدون راتب</option>
            <option value="maternity">أمومة</option>
            <option value="emergency">اضطرارية</option>
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

        {(filterStatus !== 'all' || filterType !== 'all' || filterEmpId !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setFilterStatus('all');
              setFilterType('all');
              setFilterEmpId('all');
            }}
            className="text-slate-500 hover:text-slate-800 underline mr-auto"
          >
            إعادة تعيين الفلاتر
          </button>
        )}
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">لا توجد طلبات إجازة مطابقة</h4>
            <p className="text-xs text-slate-400">
              يمكنك تقديم طلب إجازة جديد للموظفين عبر الزر بالأعلى.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">رقم الطلب</th>
                  <th className="py-3 px-4">اسم الموظف</th>
                  <th className="py-3 px-4">نوع الإجازة</th>
                  <th className="py-3 px-4">من تاريخ</th>
                  <th className="py-3 px-4">إلى تاريخ</th>
                  <th className="py-3 px-4">عدد الأيام</th>
                  <th className="py-3 px-4">السبب / المبرر</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">القرار والإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {req.requestNumber || req.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{req.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{req.employeeCode}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {getLeaveTypeLabel(req.leaveType)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{req.startDate}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{req.endDate}</td>
                    <td className="py-3 px-4 font-bold text-blue-700 font-mono">
                      {req.daysCount} يوم
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{req.reason}</td>
                    <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {req.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(req)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 text-[11px] inline-flex items-center gap-1"
                              title="اعتماد الإجازة"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              موافقة
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(req)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 text-[11px] inline-flex items-center gap-1"
                              title="رفض الطلب"
                            >
                              <XCircle className="w-3 h-3" />
                              رفض
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(req)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="حذف السجل"
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
        )}
      </div>

      {/* New Leave Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                تقديم طلب إجازة لموظف
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
                  <label className="block font-bold text-slate-700 mb-1">نوع الإجازة *</label>
                  <select
                    value={formLeaveType}
                    onChange={(e) => setFormLeaveType(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans font-bold"
                  >
                    <option value="annual">إجازة سنوية اعتيادية (مدفوعة الراتب)</option>
                    <option value="sick">إجازة مرضية (بتقرير طبي معتمد)</option>
                    <option value="casual">إجازة عارضة / طارئة</option>
                    <option value="unpaid">إجازة بدون راتب (تخصم من الراتب الشهري)</option>
                    <option value="maternity">إجازة أمومة ووضع</option>
                    <option value="emergency">إجازة اضطرارية</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ البداية *</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ النهاية *</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
                </div>

                <div className="col-span-2 bg-blue-50/70 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                  <span className="font-semibold text-blue-900">إجمالي مدة الإجازة المحسوبة:</span>
                  <span className="font-bold text-blue-700 font-mono text-sm">
                    {calculatedDays} يوم عمل
                  </span>
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">سبب ومبرر الإجازة *</label>
                  <textarea
                    rows={2}
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    placeholder="بيان سبب طلب الإجازة أو الملاحظات..."
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs"
                >
                  تقديم الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

