import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { EmployeeAttendance } from '../../types';
import {
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Filter,
  CheckCircle2,
  Users,
  Timer,
  Edit2,
} from 'lucide-react';

export const HrAttendanceTab: React.FC = () => {
  const {
    employees,
    attendances,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    batchRecordAttendance,
    showAlert,
    showConfirm,
  } = useErp();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State for Manual Entry
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formEmpId, setFormEmpId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [formCheckIn, setFormCheckIn] = useState<string>('09:00');
  const [formCheckOut, setFormCheckOut] = useState<string>('17:00');
  const [formStatus, setFormStatus] = useState<EmployeeAttendance['status']>('present');
  const [formWorkShift, setFormWorkShift] = useState<'morning' | 'evening' | 'flexible'>('morning');
  const [formLateMinutes, setFormLateMinutes] = useState<number>(0);
  const [formOvertimeHours, setFormOvertimeHours] = useState<number>(0);
  const [formNotes, setFormNotes] = useState<string>('');

  // Filtered attendances
  const filteredList = useMemo(() => {
    return attendances.filter((att) => {
      if (selectedDate && att.date !== selectedDate) return false;
      if (selectedEmployeeId !== 'all' && att.employeeId !== selectedEmployeeId) return false;
      if (selectedStatus !== 'all' && att.status !== selectedStatus) return false;
      return true;
    });
  }, [attendances, selectedDate, selectedEmployeeId, selectedStatus]);

  // Daily statistics for selected date
  const stats = useMemo(() => {
    const dayRecords = attendances.filter((a) => a.date === selectedDate);
    const presentCount = dayRecords.filter((a) => a.status === 'present').length;
    const lateCount = dayRecords.filter((a) => a.status === 'late').length;
    const absentCount = dayRecords.filter((a) => a.status === 'absent').length;
    const excusedCount = dayRecords.filter((a) => a.status === 'excused' || a.status === 'leave').length;
    const totalOvertime = dayRecords.reduce((acc, curr) => acc + (curr.overtimeHours || 0), 0);

    return {
      totalLogged: dayRecords.length,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      excused: excusedCount,
      overtime: totalOvertime,
    };
  }, [attendances, selectedDate]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormEmpId(employees[0]?.id || '');
    setFormDate(selectedDate || todayStr);
    setFormCheckIn('09:00');
    setFormCheckOut('17:00');
    setFormStatus('present');
    setFormWorkShift('morning');
    setFormLateMinutes(0);
    setFormOvertimeHours(0);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (att: EmployeeAttendance) => {
    setEditingId(att.id);
    setFormEmpId(att.employeeId);
    setFormDate(att.date);
    setFormCheckIn(att.checkIn || '09:00');
    setFormCheckOut(att.checkOut || '17:00');
    setFormStatus(att.status);
    setFormWorkShift(att.workShift || 'morning');
    setFormLateMinutes(att.lateMinutes || 0);
    setFormOvertimeHours(att.overtimeHours || 0);
    setFormNotes(att.notes || '');
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

    if (editingId) {
      updateAttendance(editingId, {
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.name,
        department: emp.department,
        date: formDate,
        checkIn: formCheckIn,
        checkOut: formCheckOut,
        status: formStatus,
        workShift: formWorkShift,
        lateMinutes: Number(formLateMinutes) || 0,
        overtimeHours: Number(formOvertimeHours) || 0,
        notes: formNotes,
      });
      showAlert({
        title: 'تم التحديث بنجاح',
        message: `تم تحديث سجل حضور الموظف ${emp.name}.`,
        type: 'success',
        confirmText: 'حسناً',
      });
    } else {
      addAttendance({
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.name,
        department: emp.department,
        date: formDate,
        checkIn: formCheckIn,
        checkOut: formCheckOut,
        status: formStatus,
        workShift: formWorkShift,
        lateMinutes: Number(formLateMinutes) || 0,
        overtimeHours: Number(formOvertimeHours) || 0,
        notes: formNotes,
      });
      showAlert({
        title: 'تم التسجيل بنجاح',
        message: `تم تسجيل حضور الموظف ${emp.name} لتاريخ ${formDate}.`,
        type: 'success',
        confirmText: 'حسناً',
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (att: EmployeeAttendance) => {
    showConfirm(
      `هل أنت متأكد من حذف سجل حضور الموظف "${att.employeeName}" لتاريخ ${att.date}؟`,
      () => {
        deleteAttendance(att.id);
      },
      'تأكيد الحذف',
      { confirmText: 'نعم، احذف', type: 'error' }
    );
  };

  // Quick Batch Check-In for all active employees who don't have records today
  const handleBatchCheckInToday = () => {
    const existingEmpIds = new Set(
      attendances.filter((a) => a.date === selectedDate).map((a) => a.employeeId)
    );
    const unrecordedEmps = employees.filter((e) => !existingEmpIds.has(e.id));

    if (unrecordedEmps.length === 0) {
      showAlert({
        title: 'مكتمل بالفعل',
        message: `تم تسجيل حضور جميع الموظفين (${employees.length} موظف) لتاريخ ${selectedDate}.`,
        type: 'info',
        confirmText: 'حسناً',
      });
      return;
    }

    showConfirm(
      `سيتم تسجيل حضور نظامي (حاضر 09:00 - 17:00) لعدد (${unrecordedEmps.length}) موظفاً غير مسجلين لتاريخ ${selectedDate}. هل تريد المتابعة؟`,
      () => {
        const batchItems = unrecordedEmps.map((emp) => ({
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: emp.name,
          department: emp.department,
          date: selectedDate,
          checkIn: '09:00',
          checkOut: '17:00',
          status: 'present' as const,
          workShift: 'morning' as const,
          lateMinutes: 0,
          overtimeHours: 0,
          notes: 'تسجيل حضور جماعي تلقائي',
        }));
        batchRecordAttendance(batchItems);
        showAlert({
          title: 'تم التسجيل بنجاح',
          message: `تم تسجيل حضور ${unrecordedEmps.length} موظف بنجاح!`,
          type: 'success',
          confirmText: 'حسناً',
        });
      },
      'تسجيل حضور جماعي سريع',
      { confirmText: 'تأكيد التسجيل', type: 'info' }
    );
  };

  const getStatusBadge = (status: EmployeeAttendance['status']) => {
    switch (status) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            حاضر
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
            <Timer className="w-3 h-3" />
            متأخر
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800">
            <UserX className="w-3 h-3" />
            غائب
          </span>
        );
      case 'excused':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
            <AlertCircle className="w-3 h-3" />
            إذن / استئذان
          </span>
        );
      case 'leave':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800">
            <Calendar className="w-3 h-3" />
            إجازة رسمية
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">سجل الحضور والانصراف والورديات</h3>
            <p className="text-xs text-slate-500">
              متابعة مواعيد الحضور، التأخيرات، وساعات العمل الإضافية المعتمدة للموظفين
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBatchCheckInToday}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-slate-300"
            title="تسجيل حضور افتراضي لكافة الموظفين غير المسجلين اليوم"
          >
            <Users className="w-4 h-4 text-slate-600" />
            تسجيل حضور جماعي
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            تسجيل حركة يدوية
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>إجمالي المسجلين</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-800 mt-1">{stats.totalLogged} / {employees.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">موظف مسجل لليوم</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>حضور نظامي</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{stats.present}</div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">في الموعد المحدد</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>تأخيرات</span>
            <Timer className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1">{stats.late}</div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">مسجلين متأخرين</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>غياب</span>
            <UserX className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600 mt-1">{stats.absent}</div>
          <div className="text-[10px] text-rose-700/80 mt-0.5">بدون إذن مسبق</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
          <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
            <span>ساعات إضافي</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 mt-1">{stats.overtime.toFixed(1)} س</div>
          <div className="text-[10px] text-blue-700/80 mt-0.5">تدرج في مسير الرواتب</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">التاريخ:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">الموظف:</span>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          >
            <option value="all">جميع الموظفين ({employees.length})</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">الحالة:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 font-sans"
          >
            <option value="all">كافة الحالات</option>
            <option value="present">حاضر</option>
            <option value="late">متأخر</option>
            <option value="absent">غائب</option>
            <option value="excused">استئذان / إذن</option>
            <option value="leave">إجازة رسمية</option>
          </select>
        </div>

        {(selectedEmployeeId !== 'all' || selectedStatus !== 'all' || selectedDate !== todayStr) && (
          <button
            type="button"
            onClick={() => {
              setSelectedDate(todayStr);
              setSelectedEmployeeId('all');
              setSelectedStatus('all');
            }}
            className="text-slate-500 hover:text-slate-800 underline mr-auto"
          >
            إعادة تعيين الفلاتر
          </button>
        )}
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">لا توجد سجلات حضور مطابقة</h4>
            <p className="text-xs text-slate-400">
              اختر تاريخاً آخر أو قم بتسجيل الحضور عبر الأزرار بالأعلى.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">كود الموظف</th>
                  <th className="py-3 px-4">اسم الموظف</th>
                  <th className="py-3 px-4">الوردية</th>
                  <th className="py-3 px-4">وقت الحضور</th>
                  <th className="py-3 px-4">وقت الانصراف</th>
                  <th className="py-3 px-4">التأخير (دقيقة)</th>
                  <th className="py-3 px-4">إضافي (ساعة)</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">ملاحظات</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-700">{att.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{att.employeeCode}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{att.employeeName}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {att.workShift === 'morning' ? 'صباحية' : att.workShift === 'evening' ? 'مسائية' : 'مرنة'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{att.checkIn || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{att.checkOut || '-'}</td>
                    <td className="py-3 px-4 font-mono">
                      {att.lateMinutes && att.lateMinutes > 0 ? (
                        <span className="text-amber-700 font-bold">{att.lateMinutes} د</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {att.overtimeHours && att.overtimeHours > 0 ? (
                        <span className="text-emerald-700 font-bold">+{att.overtimeHours} س</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(att.status)}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{att.notes || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(att)}
                          className="p-1 rounded-lg text-blue-600 hover:bg-blue-50"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(att)}
                          className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                          title="حذف"
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

      {/* Add / Edit Attendance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                {editingId ? 'تعديل سجل حضور وانصراف' : 'تسجيل حركة حضور وانصراف يدوية'}
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

                <div>
                  <label className="block font-bold text-slate-700 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الوردية</label>
                  <select
                    value={formWorkShift}
                    onChange={(e) => setFormWorkShift(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans"
                  >
                    <option value="morning">صباحية (09:00 - 17:00)</option>
                    <option value="evening">مسائية (16:00 - 00:00)</option>
                    <option value="flexible">مرنة / غير مقيدة</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">وقت الحضور</label>
                  <input
                    type="time"
                    value={formCheckIn}
                    onChange={(e) => setFormCheckIn(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">وقت الانصراف</label>
                  <input
                    type="time"
                    value={formCheckOut}
                    onChange={(e) => setFormCheckOut(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الحالة *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-sans font-bold"
                  >
                    <option value="present">حاضر (في الموعد)</option>
                    <option value="late">متأخر عن الموعد</option>
                    <option value="absent">غائب</option>
                    <option value="excused">استئذان رسمي</option>
                    <option value="leave">إجازة رسمية</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">دقائق التأخير</label>
                  <input
                    type="number"
                    min="0"
                    value={formLateMinutes}
                    onChange={(e) => setFormLateMinutes(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ساعات عمل إضافي (Overtime)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formOvertimeHours}
                    onChange={(e) => setFormOvertimeHours(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="ملاحظات أو سبب التأخير/الاستئذان..."
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs"
                >
                  {editingId ? 'حفظ التعديلات' : 'تسجيل الحركة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

