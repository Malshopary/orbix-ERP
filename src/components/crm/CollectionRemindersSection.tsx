import React, { useState, useMemo } from 'react';
import { useErp } from '../../context/ErpContext';
import { CollectionReminder, Customer } from '../../types';
import { SearchableSelect } from '../SearchableSelect';
import {
  Bell,
  PlusCircle,
  Search,
  PhoneCall,
  Mail,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ExternalLink,
  Copy,
  Trash2,
  X,
  Check,
  Building,
  DollarSign,
  Briefcase,
  Share2,
} from 'lucide-react';

export const CollectionRemindersSection: React.FC = () => {
  const {
    collectionReminders = [],
    collectionPlans = [],
    customers = [],
    formatMoney,
    addCollectionReminder,
    deleteCollectionReminder,
    showAlert,
    showConfirm,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    phone: string;
    customerName: string;
    text: string;
  } | null>(null);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [channel, setChannel] = useState<'phone' | 'whatsapp' | 'email' | 'visit' | 'legal_notice'>('whatsapp');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueAmount, setDueAmount] = useState<number>(0);
  const [promisedDate, setPromisedDate] = useState('');
  const [collectorName, setCollectorName] = useState('مسؤول التحصيل والائتمان');
  const [notes, setNotes] = useState('');

  // Handle Customer Selection in form
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setDueAmount(cust.currentBalance || 0);
    }
    // Find active plans for customer
    const plans = collectionPlans.filter((p) => p.customerId === customerId);
    if (plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    } else {
      setSelectedPlanId('');
    }
  };

  // Filtered Reminders
  const filteredReminders = useMemo(() => {
    return collectionReminders.filter((r) => {
      const matchSearch =
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.phone && r.phone.includes(searchQuery));

      const matchChannel = channelFilter === 'all' || r.channel === channelFilter;
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;

      return matchSearch && matchChannel && matchStatus;
    });
  }, [collectionReminders, searchQuery, channelFilter, statusFilter]);

  // KPIs
  const totalReminders = collectionReminders.length;
  const sentReminders = collectionReminders.filter((r) => r.status === 'sent' || r.status === 'acknowledged').length;
  const scheduledReminders = collectionReminders.filter((r) => r.status === 'scheduled').length;
  const promisedReminders = collectionReminders.filter((r) => !!r.promisedDate).length;

  // Open Create
  const handleOpenCreate = () => {
    const cust = customers[0];
    setSelectedCustomerId(cust?.id || '');
    const plans = collectionPlans.filter((p) => p.customerId === cust?.id);
    setSelectedPlanId(plans[0]?.id || '');
    setChannel('whatsapp');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setDueAmount(cust?.currentBalance || 2500);
    setPromisedDate('');
    setCollectorName('مسؤول التحصيل والائتمان');
    setNotes('تذكير بموعد استحقاق القسط الشهري');
    setShowCreateModal(true);
  };

  // Save Reminder
  const handleSaveReminder = () => {
    if (!selectedCustomerId) {
      showAlert({ title: 'تنبيه', message: 'يرجى اختيار العميل', type: 'warning' });
      return;
    }

    const cust = customers.find((c) => c.id === selectedCustomerId);

    addCollectionReminder({
      customerId: selectedCustomerId,
      customerName: cust?.name || 'عميل',
      phone: cust?.phone,
      planId: selectedPlanId || undefined,
      channel,
      scheduledDate,
      dueAmount,
      status: 'scheduled',
      promisedDate: promisedDate || undefined,
      collectorName,
      notes,
    });

    showAlert({
      title: 'تم تسجيل التذكير والمتابعة',
      message: `تم إدراج إجراء التحصيل للعميل ${cust?.name} بنجاح في جدول المتابعات اليومية`,
      type: 'success',
    });

    setShowCreateModal(false);
  };

  // WhatsApp Message Generator
  const handleOpenWhatsAppModal = (reminder: CollectionReminder) => {
    const cust = customers.find((c) => c.id === reminder.customerId);
    const phone = reminder.phone || cust?.phone || '';
    const text = `عزيزنا العميل ${reminder.customerName}،\nتحية طيبة وبعد،\nنود تذكير سيادتكم بلطف بوجود مستحقات مالية واجبة السداد بقيمة ${formatMoney(
      reminder.dueAmount
    )}${
      reminder.scheduledDate ? ` وتاريخ استحقاق ${reminder.scheduledDate}` : ''
    }.\nنرجو التكرم بالتنسيق للسداد لتفادي توقف التوريدات أو تراكم الغرامات.\nللتواصل والاستفسار: 0100000000\nشاكرين ومقدرين حسن تعاونكم.`;

    setWhatsAppModalData({
      phone,
      customerName: reminder.customerName,
      text,
    });
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showAlert({ title: 'تم النسخ', message: 'تم نسخ نص الرسالة إلى الحافظة بنجاح', type: 'success' });
  };

  const handleDelete = (rem: CollectionReminder) => {
    showConfirm({
      title: 'حذف إجراء التحصيل',
      message: `هل أنت متأكد من حذف تذكير التحصيل للعميل ${rem.customerName}؟`,
      type: 'danger',
      confirmText: 'نعم، احذف',
      cancelText: 'إلغاء',
      onConfirm: () => {
        deleteCollectionReminder(rem.id);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              سجل متابعات وتذكيرات التحصيل (Collection Reminders & Actions)
            </h2>
            <p className="text-xs text-slate-500">
              تسجيل الاتصالات، ورسائل الواتساب، والوعود بالسداد، وتتبع استجابات العملاء والإنذارات
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>تسجيل إجراء / تذكير تحصيل</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">إجمالي إجراءات المتابعة</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{totalReminders}</div>
            <div className="text-xs text-slate-500 mt-1">إجراء تحصيل ومتابعة مسجل</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">تذكيرات تم إرسالها</span>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600">{sentReminders}</div>
            <div className="text-xs text-slate-500 mt-1">اتصالات ورسائل منفذة بنجاح</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">مجدولة للمتابعة</span>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-blue-600">{scheduledReminders}</div>
            <div className="text-xs text-slate-500 mt-1">مواعيد تذكير قادمة اليوم</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">وعود سداد مسجلة</span>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-600">{promisedReminders}</div>
            <div className="text-xs text-slate-500 mt-1">تعهدات سداد محددة بتواريخ</div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم العميل أو الهاتف أو الملاحظات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
          >
            <option value="all">جميع قنوات التواصل</option>
            <option value="phone">اتصال هاتفي</option>
            <option value="whatsapp">واتساب</option>
            <option value="email">بريد إلكتروني</option>
            <option value="visit">زيارة ميدانية</option>
            <option value="legal_notice">إنذار قانوني</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
          >
            <option value="all">جميع الحالات</option>
            <option value="scheduled">مجدول</option>
            <option value="sent">تم الإرسال / الاتصال</option>
            <option value="acknowledged">تم التعهد بالسداد</option>
            <option value="ignored">لم يرد / تم التجاهل</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">العميل</th>
                <th className="py-3.5 px-4">القناة</th>
                <th className="py-3.5 px-4">تاريخ الإجراء</th>
                <th className="py-3.5 px-4">المبلغ المستحق</th>
                <th className="py-3.5 px-4">موعد الوعد بالسداد</th>
                <th className="py-3.5 px-4">مسؤول التحصيل</th>
                <th className="py-3.5 px-4">الملاحظات والنتيجة</th>
                <th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReminders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    لا توجد تذكيرات تحصيل مسجلة
                  </td>
                </tr>
              ) : (
                filteredReminders.map((rem) => (
                  <tr
                    key={rem.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rem.customerName}</div>
                      <div className="text-xs font-mono text-slate-500">{rem.phone || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {rem.channel === 'whatsapp' && <Send className="w-3 h-3 text-emerald-500" />}
                        {rem.channel === 'phone' && <PhoneCall className="w-3 h-3 text-blue-500" />}
                        {rem.channel === 'email' && <Mail className="w-3 h-3 text-amber-500" />}
                        {rem.channel === 'visit' && <User className="w-3 h-3 text-purple-500" />}
                        {rem.channel === 'legal_notice' && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                        <span>
                          {rem.channel === 'whatsapp'
                            ? 'واتساب'
                            : rem.channel === 'phone'
                            ? 'اتصال هاتفي'
                            : rem.channel === 'email'
                            ? 'بريد إلكتروني'
                            : rem.channel === 'visit'
                            ? 'زيارة ميدانية'
                            : 'إنذار قانوني'}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                      {rem.scheduledDate}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono text-slate-900">
                      {formatMoney(rem.dueAmount)}
                    </td>
                    <td className="py-3 px-4">
                      {rem.promisedDate ? (
                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {rem.promisedDate}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">لا يوجد وعد</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {rem.collectorName || 'قسم التحصيل'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {rem.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenWhatsAppModal(rem)}
                          title="إنشاء وإرسال رسالة واتساب"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rem)}
                          title="حذف"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Reminder */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl my-8 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    تسجيل إجراء تحصيل ومتابعة ائتمانية
                  </h3>
                  <p className="text-xs text-slate-500">
                    توثيق الاتصال أو الزيارة وتثبيت موعد الوعد بالسداد
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  العميل <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={customers.map((c) => ({
                    value: c.id,
                    label: c.name,
                    subLabel: `الرصيد: ${formatMoney(c.currentBalance)} | ${c.phone || ''}`,
                  }))}
                  value={selectedCustomerId}
                  onChange={(val) => handleCustomerSelect(val)}
                  placeholder="اختر العميل..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    قناة المتابعة والتواصل <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="whatsapp">رسالة واتساب رسمية</option>
                    <option value="phone">مكالمة هاتفية</option>
                    <option value="email">بريد إلكتروني رسمي</option>
                    <option value="visit">زيارة ميدانية للمقر</option>
                    <option value="legal_notice">إنذار قانوني رسمي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    تاريخ الإجراء والمتابعة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    المبلغ المطالب به
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dueAmount}
                    onChange={(e) => setDueAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    تاريخ الوعد بالسداد (إن تم الاتفاق)
                  </label>
                  <input
                    type="date"
                    value={promisedDate}
                    onChange={(e) => setPromisedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  مسؤول التحصيل / المتصل
                </label>
                <input
                  type="text"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  نتائج المكالمة وملاحظات المتابعة
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                  placeholder="ملاحظات العميل، مبررات التأخير، شروط استئناف التوريد..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveReminder}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>حفظ في سجل المتابعات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: WhatsApp Preview & Send */}
      {whatsAppModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-emerald-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500 text-white rounded-lg">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    رسالة تذكير واتساب - {whatsAppModalData.customerName}
                  </h3>
                  <p className="text-xs text-slate-500">رقم الهاتف: {whatsAppModalData.phone || 'غير مسجل'}</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppModalData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                {whatsAppModalData.text}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(whatsAppModalData.text)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>نسخ نص الرسالة</span>
                </button>

                {whatsAppModalData.phone && (
                  <a
                    href={`https://wa.me/${whatsAppModalData.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      whatsAppModalData.text
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>فتح في واتساب</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
