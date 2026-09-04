import React, { useState } from 'react';
import { useErp } from '../../context/ErpContext';
import { StocktakingSession, StocktakingItem } from '../../types';
import { SearchableSelect } from '../SearchableSelect';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { PrintHeader } from '../PrintHeader';
import { PrintFooter } from '../PrintFooter';
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Printer,
  X,
  AlertTriangle,
  Building,
  TrendingDown,
  TrendingUp,
  Layers,
  Calculator,
  Save,
  Eye,
  Check,
} from 'lucide-react';

export const StocktakingTab: React.FC = () => {
  const {
    stocktakingSessions,
    warehouses,
    products,
    addStocktakingSession,
    updateStocktakingSession,
    completeStocktakingSession,
    deleteStocktakingSession,
    canDeleteEntity,
    showAlert,
    showConfirm,
    hasPermission,
    formatMoney,
    currency,
    currentUser,
    getProductQuantityInWarehouse,
  } = useErp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSession, setActiveSession] = useState<StocktakingSession | null>(null);
  const [previewSession, setPreviewSession] = useState<StocktakingSession | null>(null);

  // Form state for creating a new session
  const [sessionNumber, setSessionNumber] = useState(`STK-${Date.now().toString().slice(-6)}`);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || '');
  const [sessionNotes, setSessionNotes] = useState('');

  // Counting state when conducting an active session
  const [countedQuantities, setCountedQuantities] = useState<Record<string, number>>({});
  const [itemReasons, setItemReasons] = useState<Record<string, string>>({});

  const canEdit = hasPermission('edit_products') || currentUser?.role === 'admin' || currentUser?.role === 'warehouse_keeper';

  const getWarehouseName = (id: string) => {
    return warehouses.find((w) => w.id === id)?.name || id;
  };

  const filteredSessions = stocktakingSessions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const whName = getWarehouseName(s.warehouseId).toLowerCase();
      return s.sessionNumber.toLowerCase().includes(q) || whName.includes(q) || (s.notes && s.notes.toLowerCase().includes(q));
    }
    return true;
  });

  const handleStartNewSession = () => {
    // Generate pre-populated item list for this warehouse based on actual stock in warehouse
    const targetProducts = products.filter((p) => {
      const qtyInWh = getProductQuantityInWarehouse ? getProductQuantityInWarehouse(p.id, selectedWarehouseId) : 0;
      return qtyInWh > 0 || p.warehouseId === selectedWarehouseId || (!p.warehouseId && selectedWarehouseId === warehouses[0]?.id);
    });
    if (targetProducts.length === 0) {
      showAlert({
        title: 'تنبيه المستودع',
        message: 'لا توجد أصناف مسجلة في هذا المستودع لبدء الجرد.',
        type: 'warning',
      });
      return;
    }

    const initialItems: StocktakingItem[] = targetProducts.map((p) => {
      const currentQty = getProductQuantityInWarehouse ? getProductQuantityInWarehouse(p.id, selectedWarehouseId) : p.stockQuantity;
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        systemQty: currentQty,
        countedQty: currentQty, // default to system qty
        difference: 0,
        costPrice: p.costPrice,
        differenceValue: 0,
        unit: p.unit || 'قطعة',
      };
    });

    addStocktakingSession({
      sessionNumber: sessionNumber.trim() || `STK-${Date.now().toString().slice(-6)}`,
      date: sessionDate,
      warehouseId: selectedWarehouseId,
      items: initialItems,
      notes: sessionNotes,
      status: 'in_progress',
    });

    setShowAddModal(false);
    setSessionNotes('');
    setSessionNumber(`STK-${Date.now().toString().slice(-6)}`);
  };

  const handleOpenCountingModal = (session: StocktakingSession) => {
    setActiveSession(session);
    const initialCounts: Record<string, number> = {};
    const initialReasons: Record<string, string> = {};
    session.items.forEach((item) => {
      initialCounts[item.productId] = item.countedQty !== undefined ? item.countedQty : item.systemQty;
      initialReasons[item.productId] = item.reason || '';
    });
    setCountedQuantities(initialCounts);
    setItemReasons(initialReasons);
  };

  const getComputedItems = (session: StocktakingSession): StocktakingItem[] => {
    return session.items.map((item) => {
      const counted = countedQuantities[item.productId] ?? item.countedQty ?? item.systemQty;
      const diff = counted - item.systemQty;
      const diffVal = diff * (item.costPrice || 0);
      const reason = itemReasons[item.productId] || item.reason || '';
      return {
        ...item,
        countedQty: counted,
        difference: diff,
        differenceValue: diffVal,
        reason,
      };
    });
  };

  const handleSaveDraftCounts = () => {
    if (!activeSession) return;
    const updatedItems = getComputedItems(activeSession);
    updateStocktakingSession(activeSession.id, {
      items: updatedItems,
    });
    setActiveSession(null);
    showAlert({
      title: 'حفظ المسودة',
      message: `تم حفظ الكميات المسجلة لجلسة الجرد ${activeSession.sessionNumber} كمسودة بنجاح.`,
      type: 'success',
    });
  };

  const handleCompleteSession = () => {
    if (!activeSession) return;
    const updatedItems = getComputedItems(activeSession);

    const surplusCount = updatedItems.filter((i) => i.difference > 0).length;
    const deficitCount = updatedItems.filter((i) => i.difference < 0).length;
    const netDiscrepancy = updatedItems.reduce((sum, i) => sum + i.differenceValue, 0);

    showConfirm(
      `هل أنت متأكد من اعتماد وإتمام محضر الجرد رقم (${activeSession.sessionNumber})؟\n\nملخص الفروقات الجردية:\n• أصناف بها زيادة: ${surplusCount}\n• أصناف بها عجز: ${deficitCount}\n• صافي قيمة التسوية: ${formatMoney(netDiscrepancy)}\n\nسيتم تحديث أرصدة المستودع فوراً وإنشاء القيود المحاسبية للتسوية آلياً.`,
      () => {
        completeStocktakingSession(activeSession.id, updatedItems);
        setActiveSession(null);
      },
      'تأكيد اعتماد الجرد والتسوية',
      'اعتماد وتحديث الأرصدة'
    );
  };

  const handleOpenPrintPreview = (session: StocktakingSession) => {
    setPreviewSession(session);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            الجرد الدوري والمفاجئ والتسويات الجردية
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            مطابقة المخزون الفعلي مع الدفتري، رصد العجز والزيادة، وتوليد القيود المحاسبية للتسوية آلياً
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setSessionNumber(`STK-${Date.now().toString().slice(-6)}`);
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            بدء جلسة جرد جديدة
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم جلسة الجرد أو اسم المستودع..."
            className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="sm:col-span-5 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'in_progress', label: 'جاري التدقيق' },
            { id: 'completed', label: 'معتمد ومكتمل' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stocktaking Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">لا توجد جلسات جرد مسجلة</h3>
            <p className="text-xs text-slate-400 mt-1">
              ابدأ جلسة جرد جديدة لمطابقة الأرصدة وتصحيح الفروقات
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold">
                  <th className="py-3 px-4">رقم الجلسة</th>
                  <th className="py-3 px-4">تاريخ الجرد</th>
                  <th className="py-3 px-4">المستودع</th>
                  <th className="py-3 px-4">عدد الأصناف</th>
                  <th className="py-3 px-4">الفروقات المادية والتسوية</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSessions.map((session) => {
                  const items = session.items || [];
                  const hasDiscrepancy = items.some((i) => i.difference !== 0);
                  const totalDiffVal = items.reduce((acc, i) => acc + (i.differenceValue || 0), 0);
                  const surplusItems = items.filter((i) => (i.difference || 0) > 0);
                  const deficitItems = items.filter((i) => (i.difference || 0) < 0);

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {session.sessionNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{session.date}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Building className="w-3.5 h-3.5 text-emerald-600" />
                          {getWarehouseName(session.warehouseId)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">
                          <Layers className="w-3 h-3 text-slate-500" />
                          {items.length} صنف
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {!hasDiscrepancy ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            مطابق تماماً (0 فروق)
                          </span>
                        ) : totalDiffVal > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <TrendingUp className="w-3.5 h-3.5" />
                              زيادة: +{formatMoney(totalDiffVal)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {surplusItems.length} صنف بزيادة
                              {deficitItems.length > 0 && ` • ${deficitItems.length} صنف بعجز`}
                            </span>
                          </div>
                        ) : totalDiffVal < 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              <TrendingDown className="w-3.5 h-3.5" />
                              عجز: {formatMoney(totalDiffVal)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {deficitItems.length} صنف بعجز
                              {surplusItems.length > 0 && ` • ${surplusItems.length} صنف بزيادة`}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            فروق متوازنة بالقيمة ({surplusItems.length} زيادة / {deficitItems.length} عجز)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {session.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            معتمد ومرحل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            جاري الجرد
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {session.status === 'in_progress' && canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenCountingModal(session)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="تسجيل الأرصدة الفعلية والاعتماد"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                              تسجيل الفعلي
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenPrintPreview(session)}
                            className="p-1.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                            title="معاينة وطباعة محضر الجرد الرسمي"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                const check = canDeleteEntity('stocktaking_session', session.id);
                                if (!check.canDelete) {
                                  showAlert({
                                    title: 'تعذر الحذف',
                                    message: check.reason || 'لا يمكن حذف هذه الجلسة.',
                                    type: 'error',
                                  });
                                  return;
                                }
                                showConfirm(`هل أنت متأكد من حذف محضر جلسة الجرد ${session.sessionNumber}؟`, () => {
                                  deleteStocktakingSession(session.id);
                                });
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف الجلسة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Start New Session */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold">بدء جلسة جرد مخزني جديدة</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">رقم الجلسة</label>
                <input
                  type="text"
                  value={sessionNumber}
                  onChange={(e) => setSessionNumber(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">المستودع المستهدف للجرد</label>
                <SearchableSelect
                  value={selectedWarehouseId}
                  onChange={(val) => setSelectedWarehouseId(val)}
                  placeholder="-- اختر المستودع المستهدف --"
                  searchPlaceholder="ابحث باسم المستودع..."
                  options={warehouses.map((w) => ({
                    value: w.id,
                    label: w.name,
                    badge: w.isDefault ? 'الرئيسي' : undefined,
                    badgeColor: 'bg-emerald-50 text-emerald-700',
                  }))}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  سيتم تحميل قائمة كافة الأصناف الحالية في هذا المستودع بأرصدتها الدفترية تلقائياً.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تاريخ الجرد</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ملاحظات / أسماء أعضاء اللجنة</label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="أدخل ملاحظات أو تشكيل لجنة الجرد..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleStartNewSession}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                بدء الجرد وتحميل الأصناف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Active Counting & Reconciliation */}
      {activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  تسجيل الكميات الفعلية - جلسة {activeSession.sessionNumber}
                </h3>
                <p className="text-[11px] text-slate-400">
                  المستودع: {getWarehouseName(activeSession.warehouseId)} | التاريخ: {activeSession.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSession(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table of items to count */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-start gap-2 text-blue-900">
                <AlertTriangle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-bold">إرشادات تسجيل الجرد الفعلي:</p>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    أدخل الكمية الفعلية المحصورة في المخزن لكل صنف. يتم احتساب الفروقات والقيمة المالية للتسوية لحظياً. يمكنك حفظ المسودة لمتابعة العد لاحقاً، أو الضغط على اعتماد الجرد لتحديث المخزون والقيود المحاسبية.
                  </p>
                </div>
              </div>

              {/* Dynamic KPI summary banner */}
              {(() => {
                const computed = getComputedItems(activeSession);
                const surplus = computed.filter((i) => i.difference > 0);
                const deficit = computed.filter((i) => i.difference < 0);
                const matched = computed.filter((i) => i.difference === 0);
                const netVal = computed.reduce((sum, i) => sum + i.differenceValue, 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                      <span className="text-[11px] text-slate-500 font-bold block">إجمالي البنود</span>
                      <span className="text-base font-extrabold font-mono text-slate-800">{computed.length} صنف</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
                      <span className="text-[11px] text-emerald-700 font-bold block">أصناف مطابقة</span>
                      <span className="text-base font-extrabold font-mono text-emerald-800">{matched.length} صنف</span>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-200 p-3 rounded-xl text-center">
                      <span className="text-[11px] text-emerald-700 font-bold block">أصناف بزيادة (+)</span>
                      <span className="text-base font-extrabold font-mono text-emerald-800">{surplus.length} صنف</span>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
                      <span className="text-[11px] text-rose-700 font-bold block">أصناف بعجز (-)</span>
                      <span className="text-base font-extrabold font-mono text-rose-800">{deficit.length} صنف</span>
                    </div>
                  </div>
                );
              })()}

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold">
                    <tr>
                      <th className="py-2.5 px-3">كود الصنف</th>
                      <th className="py-2.5 px-3">اسم الصنف</th>
                      <th className="py-2.5 px-3 text-center">الرصيد الدفتري</th>
                      <th className="py-2.5 px-3 w-32 text-center">الرصيد الفعلي</th>
                      <th className="py-2.5 px-3 text-center">الفرق</th>
                      <th className="py-2.5 px-3 text-center">سعر التكلفة</th>
                      <th className="py-2.5 px-3 text-center">قيمة الفرق</th>
                      <th className="py-2.5 px-3">ملاحظات وسبب الفرق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeSession.items.map((item) => {
                      const counted = countedQuantities[item.productId] ?? item.countedQty ?? item.systemQty;
                      const diff = counted - item.systemQty;
                      const diffVal = diff * (item.costPrice || 0);

                      return (
                        <tr key={item.productId} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">{item.sku}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{item.productName}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-600 text-center">
                            {item.systemQty} {item.unit || 'قطعة'}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={counted}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setCountedQuantities((prev) => ({
                                  ...prev,
                                  [item.productId]: val,
                                }));
                              }}
                              className={`w-full p-1.5 bg-white border rounded-lg font-mono font-extrabold text-center ${
                                diff !== 0 ? 'border-amber-400 bg-amber-50/30' : 'border-slate-300'
                              } text-slate-900`}
                            />
                          </td>
                          <td className="py-2 px-3 font-mono font-extrabold text-center">
                            {diff === 0 ? (
                              <span className="text-slate-400 text-xs">مطابق (0)</span>
                            ) : diff > 0 ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">+{diff}</span>
                            ) : (
                              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold">{diff}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 text-center">
                            {formatMoney(item.costPrice)}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-center">
                            {diffVal === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : diffVal > 0 ? (
                              <span className="text-emerald-700">+{formatMoney(diffVal)}</span>
                            ) : (
                              <span className="text-rose-700">{formatMoney(diffVal)}</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={itemReasons[item.productId] ?? item.reason ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItemReasons((prev) => ({
                                  ...prev,
                                  [item.productId]: val,
                                }));
                              }}
                              placeholder="سبب الفروق إن وجد..."
                              className="w-full p-1 bg-white border border-slate-200 rounded-md text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveSession(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs"
              >
                إغلاق
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraftCounts}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Save className="w-4 h-4" />
                  حفظ المسودة
                </button>

                <button
                  type="button"
                  onClick={handleCompleteSession}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  اعتماد الجرد وتسوية الأرصدة والقيود
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Official Print Preview Popup with Company Layout */}
      {previewSession && (
        <PrintPreviewModal
          isOpen={!!previewSession}
          onClose={() => setPreviewSession(null)}
          title="معاينة محضر جرد المخزون الفعلي"
          docNumber={previewSession.sessionNumber}
          badgeText={previewSession.status === 'completed' ? 'معتمد ومرحل' : 'مسودة جاري التدقيق'}
          badgeColor={previewSession.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
          elementId="stocktaking-print-sheet"
        >
          {({ orientation }) => (
            <div className="space-y-6 text-xs text-slate-800">
              {/* Header with full company details */}
              <PrintHeader
                docTitle="محضر جرد وتدقيق المخزون الفعلي"
                docSubtitle="تقرير حصر ومطابقة الأرصدة المستودعية والتسويات الجردية"
                docNumber={previewSession.sessionNumber}
                date={previewSession.date}
                badgeColor="bg-emerald-700 text-white"
                additionalMeta={[
                  { label: 'المستودع', value: getWarehouseName(previewSession.warehouseId) },
                  { label: 'حالة المحضر', value: previewSession.status === 'completed' ? 'معتمد ومرحل' : 'مسودة جاري التدقيق' },
                  { label: 'عدد الأصناف', value: `${previewSession.items.length} صنف` },
                  { label: 'صافي الفروقات', value: `${formatMoney(previewSession.totalDiscrepancyValue || previewSession.items.reduce((s, i) => s + (i.differenceValue || 0), 0))}` },
                ]}
                orientation={orientation}
              />

              {/* KPI Summary Blocks */}
              {(() => {
                const items = previewSession.items || [];
                const surplus = items.filter((i) => (i.difference || 0) > 0);
                const deficit = items.filter((i) => (i.difference || 0) < 0);
                const matched = items.filter((i) => (i.difference || 0) === 0);

                return (
                  <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs">
                    <div className="text-center">
                      <span className="text-slate-500 block font-bold">إجمالي الأصناف المجرودة</span>
                      <span className="text-sm font-black font-mono text-slate-900 mt-0.5 block">{items.length}</span>
                    </div>
                    <div className="text-center border-r border-slate-200">
                      <span className="text-emerald-700 block font-bold">أصناف مطابقة تماماً</span>
                      <span className="text-sm font-black font-mono text-emerald-800 mt-0.5 block">{matched.length}</span>
                    </div>
                    <div className="text-center border-r border-slate-200">
                      <span className="text-emerald-700 block font-bold">أصناف بها زيادة (+)</span>
                      <span className="text-sm font-black font-mono text-emerald-800 mt-0.5 block">{surplus.length}</span>
                    </div>
                    <div className="text-center border-r border-slate-200">
                      <span className="text-rose-700 block font-bold">أصناف بها عجز (-)</span>
                      <span className="text-sm font-black font-mono text-rose-800 mt-0.5 block">{deficit.length}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">كود الصنف (SKU)</th>
                      <th className="py-2.5 px-3">اسم الصنف</th>
                      <th className="py-2.5 px-3 text-center">الرصيد الدفتري</th>
                      <th className="py-2.5 px-3 text-center">الرصيد الفعلي</th>
                      <th className="py-2.5 px-3 text-center">الفرق</th>
                      <th className="py-2.5 px-3 text-center">سعر التكلفة</th>
                      <th className="py-2.5 px-3 text-center">قيمة الفرق</th>
                      <th className="py-2.5 px-3">ملاحظات وسبب الفروق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewSession.items.map((item, idx) => {
                      const diff = item.difference || 0;
                      const diffVal = item.differenceValue || 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-500 text-center">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{item.sku}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{item.productName}</td>
                          <td className="py-2 px-3 font-mono font-bold text-center text-slate-700">
                            {item.systemQty}
                          </td>
                          <td className="py-2 px-3 font-mono font-extrabold text-center text-slate-900">
                            {item.countedQty}
                          </td>
                          <td className="py-2 px-3 font-mono font-extrabold text-center">
                            {diff === 0 ? (
                              <span className="text-slate-400">مطابق (0)</span>
                            ) : diff > 0 ? (
                              <span className="text-emerald-700 font-bold">+{diff}</span>
                            ) : (
                              <span className="text-rose-700 font-bold">{diff}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-center text-slate-700">
                            {formatMoney(item.costPrice)}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-center">
                            {diffVal === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : diffVal > 0 ? (
                              <span className="text-emerald-700">+{formatMoney(diffVal)}</span>
                            ) : (
                              <span className="text-rose-700">{formatMoney(diffVal)}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px]">{item.reason || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                    <tr>
                      <td colSpan={7} className="py-2.5 px-3 text-left font-extrabold">
                        صافي قيمة الفروقات والتسوية الجردية:
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-sm text-slate-900">
                        {formatMoney(previewSession.totalDiscrepancyValue || previewSession.items.reduce((s, i) => s + (i.differenceValue || 0), 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Standardized Footer with Signatures */}
              <PrintFooter
                preparedByTitle="أمين المستودع المسؤول"
                approvedByTitle="رئيس لجنة الجرد"
                receivedByTitle="المدير المالي / رئيس الحسابات"
                notes={previewSession.notes || 'تم اعتماد محضر الجرد الفعلي ومطابقته مع الدفاتر المحاسبية وإقرار التسويات الناتجة.'}
                orientation={orientation}
              />
            </div>
          )}
        </PrintPreviewModal>
      )}
    </div>
  );
};

