import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { Quotation, QuotationItem } from '../types';
import { ProductSelectSearch } from './ProductSelectSearch';
import { MathQuantityInput } from './MathQuantityInput';
import { OrbixLogo } from './OrbixLogo';
import { PrintPreviewModal } from './PrintPreviewModal';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import { SearchableSelect } from './SearchableSelect';
import {
  FileBadge,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
  X,
  Edit3,
  Trash2,
  Lock,
  RotateCcw,
  Tag,
  Package,
  Calendar,
  UserCheck,
  Building2,
  Phone,
  FileCheck,
  Send,
  ArrowRight,
  ClipboardList,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';

interface QuotationsViewProps {
  onNavigateToOrders?: () => void;
  onNavigateToInvoices?: () => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  onNavigateToOrders,
  onNavigateToInvoices,
}) => {
  const {
    companyProfile,
    quotations,
    salesOrders,
    salesInvoices,
    customers,
    products,
    salesReps,
    currency,
    formatMoney,
    hasPermission,
    addQuotation,
    editQuotation,
    deleteQuotation,
    updateQuotationStatus,
    convertQuotationToOrder,
    convertQuotationToInvoice,
    getNextSequenceCode,
    getProductPriceForCustomer,
    showAlert,
    showConfirm,
  } = useErp();

  const companyVat = companyProfile?.defaultVatRate ?? 15;

  const [statusFilter, setStatusFilter] = useState<'all' | Quotation['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // New Quotation Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [salesRepId, setSalesRepId] = useState(salesReps[0]?.id || '');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [vatRate, setVatRate] = useState(companyVat);
  const [quotationDiscount, setQuotationDiscount] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState('الدفع عند الاستلام أو تحويل بنكي خلال 30 يوم من الفاتورة.');
  const [notes, setNotes] = useState('عرض سعر ساري لمدة 15 يوماً من تاريخ الإصدار ويشمل التوصيل والضريبة.');
  const [items, setItems] = useState<QuotationItem[]>(() => {
    const initialProduct = products[0];
    const initialPrice = initialProduct?.sellingPrice || 100;
    const initialVat = (initialPrice * companyVat) / 100;
    return [
      {
        id: `quo-item-${Date.now()}-1`,
        productId: initialProduct?.id || '',
        productName: initialProduct?.name || '',
        sku: initialProduct?.sku || '',
        unit: initialProduct?.unit || 'قطعة',
        quantity: 1,
        unitPrice: initialPrice,
        discount: 0,
        subtotal: initialPrice,
        vatAmount: initialVat,
        total: initialPrice + initialVat,
      },
    ];
  });

  // Edit Quotation Form State
  const [editId, setEditId] = useState('');
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editSalesRepId, setEditSalesRepId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editValidUntil, setEditValidUntil] = useState('');
  const [editStatus, setEditStatus] = useState<Quotation['status']>('pending');
  const [editPaymentTerms, setEditPaymentTerms] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<QuotationItem[]>([]);
  const [editVatRate, setEditVatRate] = useState(companyVat);
  const [editQuotationDiscount, setEditQuotationDiscount] = useState<number>(0);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Recalculate totals for Create
  const grossSubtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const itemsDiscountTotal = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const netItemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountTotal = itemsDiscountTotal + (quotationDiscount || 0);
  const taxableSubtotal = Math.max(0, netItemsSubtotal - (quotationDiscount || 0));
  const vatTotal = vatRate > 0 ? (taxableSubtotal * vatRate) / 100 : 0;
  const grandTotal = taxableSubtotal + vatTotal;

  // Recalculate totals for Edit
  const editGrossSubtotal = editItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const editItemsDiscountTotal = editItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  const editNetItemsSubtotal = editItems.reduce((sum, item) => sum + item.subtotal, 0);
  const editDiscountTotal = editItemsDiscountTotal + (editQuotationDiscount || 0);
  const editTaxableSubtotal = Math.max(0, editNetItemsSubtotal - (editQuotationDiscount || 0));
  const editVatTotal = editVatRate > 0 ? (editTaxableSubtotal * editVatRate) / 100 : 0;
  const editGrandTotal = editTaxableSubtotal + editVatTotal;

  // Permissions
  const canEdit = hasPermission('edit_invoices');
  const canDelete = hasPermission('delete_invoices');

  // Filter quotations
  const filteredQuotations = quotations.filter((q) => {
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.notes && q.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const totalQuotationsCount = quotations.length;
  const pendingCount = quotations.filter((q) => q.status === 'pending' || q.status === 'sent').length;
  const approvedCount = quotations.filter((q) => q.status === 'approved').length;
  const convertedCount = quotations.filter(
    (q) => q.status === 'converted_to_order' || q.status === 'converted_to_invoice'
  ).length;
  const totalValue = quotations.reduce((acc, q) => acc + q.grandTotal, 0);

  // Status badge config
  const getStatusBadge = (status: Quotation['status']) => {
    switch (status) {
      case 'approved':
        return {
          label: 'معتمد ومقبول',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'converted_to_order':
        return {
          label: 'تم التحويل لأمر بيع',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: ClipboardList,
        };
      case 'converted_to_invoice':
        return {
          label: 'تم التحويل لفاتورة',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: FileSpreadsheet,
        };
      case 'sent':
        return {
          label: 'تم الإرسال للعميل',
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: Send,
        };
      case 'rejected':
        return {
          label: 'مرفوض من العميل',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: X,
        };
      case 'expired':
        return {
          label: 'منتهي الصلاحية',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertCircle,
        };
      case 'draft':
        return {
          label: 'مسودة',
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: Edit3,
        };
      case 'pending':
      default:
        return {
          label: 'قيد الانتظار',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        };
    }
  };

  // Helper to add item row
  const addItemRow = (isEdit = false) => {
    const p = products[0];
    const unitP = p?.sellingPrice || 100;
    const rate = isEdit ? editVatRate : vatRate;
    const vat = (unitP * rate) / 100;
    const newItem: QuotationItem = {
      id: `quo-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: p?.id || '',
      productName: p?.name || '',
      sku: p?.sku || '',
      unit: p?.unit || 'قطعة',
      quantity: 1,
      unitPrice: unitP,
      discount: 0,
      subtotal: unitP,
      vatAmount: vat,
      total: unitP + vat,
    };

    if (isEdit) {
      setEditItems([...editItems, newItem]);
    } else {
      setItems([...items, newItem]);
    }
  };

  const removeItemRow = (index: number, isEdit = false) => {
    if (isEdit) {
      if (editItems.length === 1) return;
      setEditItems(editItems.filter((_, i) => i !== index));
    } else {
      if (items.length === 1) return;
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (
    index: number,
    field: keyof QuotationItem,
    value: any,
    isEdit = false
  ) => {
    const currentList = isEdit ? [...editItems] : [...items];
    const item = { ...currentList[index] };
    const currentVatRate = isEdit ? editVatRate : vatRate;

    if (field === 'productId') {
      const p = products.find((prod) => prod.id === value);
      if (p) {
        item.productId = p.id;
        item.productName = p.name;
        item.sku = p.sku;
        item.unit = p.unit || 'قطعة';
        const customPriceInfo = getProductPriceForCustomer(p.id, isEdit ? editCustomerId : customerId);
        item.unitPrice = customPriceInfo.price;
        item.discount = 0;
      }
    } else {
      (item as any)[field] = value;
    }

    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const disc = Number(item.discount) || 0;

    item.subtotal = Math.max(0, qty * price - disc);
    item.vatAmount = currentVatRate > 0 ? (item.subtotal * currentVatRate) / 100 : 0;
    item.total = item.subtotal + item.vatAmount;

    currentList[index] = item;
    if (isEdit) {
      setEditItems(currentList);
    } else {
      setItems(currentList);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (quo: Quotation) => {
    if (!canEdit) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'ليس لديك صلاحية لتعديل عروض الأسعار.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setEditId(quo.id);
    setEditCustomerId(quo.customerId);
    setEditSalesRepId(quo.salesRepId || '');
    setEditDate(quo.date);
    setEditValidUntil(quo.validUntil || '');
    setEditStatus(quo.status);
    setEditPaymentTerms(quo.paymentTerms || '');
    setEditNotes(quo.notes || '');
    setEditVatRate(quo.vatRate ?? companyVat);
    setEditQuotationDiscount(quo.discountTotal || 0);
    setEditItems(
      quo.items.map((it) => ({
        ...it,
      }))
    );
    setShowEditModal(true);
  };

  // Submit Create
  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      showAlert({
        title: 'بيانات غير مكتملة',
        message: 'يرجى اختيار العميل أولاً.',
        type: 'warning',
      });
      return;
    }

    const cust = customers.find((c) => c.id === customerId);
    const rep = salesReps.find((r) => r.id === salesRepId);

    const newQuo = addQuotation({
      customerId,
      customerName: cust?.name || 'عميل نقدي',
      customerPhone: cust?.phone,
      customerTaxNumber: cust?.taxNumber,
      salesRepId: rep?.id,
      salesRepName: rep?.name,
      date: quotationDate,
      validUntil,
      status: 'pending',
      items,
      subtotal: grossSubtotal,
      discountTotal,
      vatRate,
      vatTotal,
      grandTotal,
      notes,
      paymentTerms,
    });

    setShowCreateModal(false);
    showAlert({
      title: 'تم إصدار عرض السعر بنجاح',
      message: `تم إنشاء عرض السعر رقم ${newQuo.quotationNumber} للعميل (${cust?.name}) بإجمالي ${formatMoney(grandTotal)} ${currency}.`,
      type: 'success',
    });
  };

  // Submit Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === editCustomerId);
    const rep = salesReps.find((r) => r.id === editSalesRepId);

    editQuotation(editId, {
      customerId: editCustomerId,
      customerName: cust?.name || 'عميل نقدي',
      customerPhone: cust?.phone,
      customerTaxNumber: cust?.taxNumber,
      salesRepId: rep?.id,
      salesRepName: rep?.name,
      date: editDate,
      validUntil: editValidUntil,
      status: editStatus,
      paymentTerms: editPaymentTerms,
      notes: editNotes,
      items: editItems,
      subtotal: editGrossSubtotal,
      discountTotal: editDiscountTotal,
      vatRate: editVatRate,
      vatTotal: editVatTotal,
      grandTotal: editGrandTotal,
    });

    setShowEditModal(false);
    showAlert({
      title: 'تم حفظ التعديلات',
      message: 'تم تحديث بيانات عرض السعر بنجاح.',
      type: 'success',
    });
  };

  // Delete Handler
  const handleDelete = (quo: Quotation) => {
    if (!canDelete) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'ليس لديك صلاحية لحذف عروض الأسعار.',
        type: 'error',
      });
      return;
    }

    const isConverted =
      quo.status === 'converted_to_order' ||
      quo.status === 'converted_to_invoice' ||
      Boolean(quo.convertedToOrderId || quo.convertedToInvoiceId);

    if (isConverted) {
      showConfirm({
        title: `⚠️ تنبيه: حذف عرض سعر تم ترحيله (${quo.quotationNumber})`,
        type: 'warning',
        message: `عرض السعر هذا (${quo.quotationNumber}) تم تحويله مسبقاً إلى ${
          quo.convertedToInvoiceId || quo.status === 'converted_to_invoice'
            ? 'فاتورة مبيعات'
            : 'أمر بيع'
        }. هل أنت متأكد من رغبتك في حذفه من سجل عروض الأسعار؟`,
        details: 'ملاحظة: حذف عرض السعر سيحذف سجله من قائمة عروض الأسعار، ولن يؤثر على السند المالي أو المخزني المرحل.',
        confirmText: 'نعم، احذف عرض السعر',
        cancelText: 'إلغاء',
        isDestructive: true,
        onConfirm: () => {
          deleteQuotation(quo.id);
          showAlert({
            title: 'تم الحذف',
            message: `تم حذف عرض السعر ${quo.quotationNumber} بنجاح.`,
            type: 'info',
          });
        },
      });
    } else {
      showConfirm({
        title: `حذف عرض السعر (${quo.quotationNumber})`,
        message: `هل أنت متأكد من رغبتك في حذف عرض السعر الخاص بالعميل (${quo.customerName}) بقيمة ${formatMoney(quo.grandTotal)} ${currency}؟`,
        confirmText: 'نعم، احذف',
        cancelText: 'إلغاء',
        isDestructive: true,
        onConfirm: () => {
          deleteQuotation(quo.id);
          showAlert({
            title: 'تم الحذف',
            message: `تم حذف عرض السعر ${quo.quotationNumber} بنجاح.`,
            type: 'info',
          });
        },
      });
    }
  };

  // Conversion: Quotation -> Sales Order
  const handleConvertToOrder = (quo: Quotation) => {
    showConfirm({
      title: 'تحويل عرض السعر إلى أمر بيع (Sales Order)',
      message: `سيتم إنشاء أمر بيع جديد مسترد بالكامل من عرض السعر (${quo.quotationNumber}) للعميل (${quo.customerName}) بنفس البنود والكميات والأسعار.`,
      confirmText: 'تأكيد وتحويل إلى أمر بيع',
      cancelText: 'إلغاء',
      onConfirm: () => {
        try {
          const newOrder = convertQuotationToOrder(quo.id);
          showAlert({
            title: 'تم إنشاء أمر البيع بنجاح 🎉',
            message: `تم إنشاء أمر البيع برقم (${newOrder.orderNumber}) المسترد من عرض السعر (${quo.quotationNumber}). يمكنك الآن متابعة التجهيز والتوريد من شاشة أوامر البيع.`,
            type: 'success',
            confirmText: 'عرض أوامر البيع',
            onConfirm: () => {
              if (onNavigateToOrders) onNavigateToOrders();
            },
          });
        } catch (err: any) {
          showAlert({
            title: 'خطأ أثناء التحويل',
            message: err.message || 'حدث خطأ غير متوقع.',
            type: 'error',
          });
        }
      },
    });
  };

  // Conversion: Quotation -> Sales Invoice
  const handleConvertToInvoice = (quo: Quotation) => {
    showConfirm({
      title: 'تحويل عرض السعر مباشرة إلى فاتورة مبيعات ضريبية',
      message: `سيتم إنشاء فاتورة مبيعات رسمية مستردة من عرض السعر (${quo.quotationNumber})، مع خصم الكميات من المخزون وتوليد القيود المحاسبية الآلية.`,
      confirmText: 'تأكيد وإصدار الفاتورة',
      cancelText: 'إلغاء',
      onConfirm: () => {
        try {
          const newInv = convertQuotationToInvoice(quo.id);
          showAlert({
            title: 'تم إصدار فاتورة المبيعات بنجاح 🧾',
            message: `تم إصدار الفاتورة الضريبية رقم (${newInv.invoiceNumber}) بمبلغ ${formatMoney(newInv.grandTotal)} ${currency} وتم ترحيل القيود وتحديث المخازن.`,
            type: 'success',
            confirmText: 'عرض الفواتير',
            onConfirm: () => {
              if (onNavigateToInvoices) onNavigateToInvoices();
            },
          });
        } catch (err: any) {
          showAlert({
            title: 'خطأ أثناء التحويل',
            message: err.message || 'حدث خطأ غير متوقع.',
            type: 'error',
          });
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <FileBadge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                عروض الأسعار للعملاء (Quotations & Estimates)
              </h2>
              <p className="text-xs text-slate-500">
                إنشاء وتتبع عروض الأسعار، وتحويلها بضغطة زر إلى أوامر بيع أو فواتير مبيعات ضريبية
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-create-quotation"
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            إنشاء عرض سعر جديد
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي العروض</span>
            <FileBadge className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2 font-mono">{totalQuotationsCount}</p>
          <span className="text-[11px] text-slate-400">كافة العروض المسجلة</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">قيد الانتظار / مرسلة</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-2 font-mono">{pendingCount}</p>
          <span className="text-[11px] text-amber-700/70">في انتظار رد العميل</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">عروض معتمدة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-2 font-mono">{approvedCount}</p>
          <span className="text-[11px] text-emerald-700/70">جاهزة للتحويل</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600">تم التحويل (أوامر وفواتير)</span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-blue-600 mt-2 font-mono">{convertedCount}</p>
          <span className="text-[11px] text-blue-700/70">مبيعات محققة</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">القيمة الإجمالية للعروض</span>
            <Tag className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2 font-mono">
            {formatMoney(totalValue)} <span className="text-xs text-slate-500 font-sans">{currency}</span>
          </p>
          <span className="text-[11px] text-slate-400">شاملة الضريبة</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث برقم العرض أو اسم العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({quotations.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            قيد الانتظار
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            معتمد
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('converted_to_order')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'converted_to_order'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            محول لأمر بيع
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('converted_to_invoice')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'converted_to_invoice'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            محول لفاتورة
          </button>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5 sm:p-4">رقم العرض</th>
                <th className="p-3.5 sm:p-4">التاريخ والصلاحية</th>
                <th className="p-3.5 sm:p-4">العميل</th>
                <th className="p-3.5 sm:p-4">المندوب</th>
                <th className="p-3.5 sm:p-4">البنود</th>
                <th className="p-3.5 sm:p-4">إجمالي العرض</th>
                <th className="p-3.5 sm:p-4">الحالة</th>
                <th className="p-3.5 sm:p-4 text-center">الإجراءات والتحويل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <FileBadge className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    لا توجد عروض أسعار مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((quo) => {
                  const linkedInv = salesInvoices.find(
                    (inv) =>
                      inv.quotationId === quo.id ||
                      (quo.quotationNumber && inv.quotationNumber === quo.quotationNumber) ||
                      quo.convertedToInvoiceId === inv.id ||
                      (quo.convertedToInvoiceNumber && quo.convertedToInvoiceNumber === inv.invoiceNumber)
                  );
                  const linkedOrder = salesOrders.find(
                    (so) =>
                      so.quotationId === quo.id ||
                      (quo.quotationNumber && so.quotationNumber === quo.quotationNumber) ||
                      quo.convertedToOrderId === so.id ||
                      (quo.convertedToOrderNumber && quo.convertedToOrderNumber === so.orderNumber)
                  );

                  const effectiveStatus = linkedInv
                    ? 'converted_to_invoice'
                    : linkedOrder
                    ? 'converted_to_order'
                    : quo.status;

                  const badge = getStatusBadge(effectiveStatus);
                  const BadgeIcon = badge.icon;
                  const isConverted =
                    effectiveStatus === 'converted_to_order' ||
                    effectiveStatus === 'converted_to_invoice' ||
                    Boolean(linkedInv || linkedOrder || quo.convertedToOrderId || quo.convertedToInvoiceId);

                  const displayInvoiceNumber = linkedInv?.invoiceNumber || quo.convertedToInvoiceNumber;
                  const displayOrderNumber = linkedOrder?.orderNumber || quo.convertedToOrderNumber;

                  return (
                    <tr key={quo.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 sm:p-4 font-mono font-bold text-slate-900">
                        {quo.quotationNumber}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <div className="text-slate-800 font-medium">{quo.date}</div>
                        {quo.validUntil && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span>صالح حتى:</span>
                            <span className="font-mono">{quo.validUntil}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <div className="font-bold text-slate-900">{quo.customerName}</div>
                        {quo.customerPhone && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {quo.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4 text-slate-600">
                        {quo.salesRepName || 'غير محدد'}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono text-xs">
                          {quo.items.length} أصناف
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 font-bold font-mono text-slate-900">
                        {formatMoney(quo.grandTotal)}{' '}
                        <span className="text-[11px] text-slate-500 font-sans">{currency}</span>
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                        {displayOrderNumber && (
                          <div className="text-[10px] text-blue-600 mt-1 font-mono">
                            أمر بيع: {displayOrderNumber}
                          </div>
                        )}
                        {displayInvoiceNumber && (
                          <div className="text-[10px] text-purple-600 mt-1 font-mono">
                            فاتورة: {displayInvoiceNumber}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* Print / Preview */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuotation(quo);
                              setShowPrintModal(true);
                            }}
                            title="معاينة وطباعة عرض السعر"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* When converted, show indicator; when not converted, show conversion buttons */}
                          {isConverted ? (
                            displayInvoiceNumber ? (
                              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 inline-flex items-center gap-1">
                                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                                <span>مرحل لفاتورة ({displayInvoiceNumber})</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-flex items-center gap-1">
                                <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                                <span>مرحل لأمر بيع ({displayOrderNumber})</span>
                              </span>
                            )
                          ) : (
                            <>
                              {/* Quick Convert to Sales Invoice */}
                              <button
                                type="button"
                                onClick={() => handleConvertToInvoice(quo)}
                                title="تحويل إلى فاتورة مبيعات مباشرة"
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg border border-emerald-200 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                فاتورة
                              </button>

                              {/* Quick Convert to Sales Order */}
                              <button
                                type="button"
                                onClick={() => handleConvertToOrder(quo)}
                                title="تحويل إلى أمر بيع"
                                className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded-lg border border-purple-200 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                أمر بيع
                              </button>
                            </>
                          )}

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(quo)}
                            disabled={!canEdit}
                            title={canEdit ? 'تعديل عرض السعر' : 'ليس لديك صلاحية التعديل'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              canEdit
                                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(quo)}
                            disabled={!canDelete}
                            title={canDelete ? 'حذف عرض السعر' : 'ليس لديك صلاحية الحذف'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              canDelete
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE QUOTATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-6xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <FileBadge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    إنشاء عرض سعر جديد للعميل
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    الرقم المقترح: {getNextSequenceCode('quotation')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
              {/* Header Info: Customer, Rep, Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    العميل <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    value={customerId}
                    onChange={(val) => setCustomerId(val)}
                    placeholder="اختر العميل..."
                    searchPlaceholder="ابحث باسم العميل أو الشركة..."
                    options={customers.map((c) => ({
                      value: c.id,
                      label: c.name,
                      subLabel: c.companyName || c.phone,
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مندوب المبيعات
                  </label>
                  <SearchableSelect
                    value={salesRepId}
                    onChange={(val) => setSalesRepId(val)}
                    placeholder="-- بدون مندوب محدد --"
                    searchPlaceholder="ابحث باسم المندوب..."
                    options={[
                      { value: '', label: '-- بدون مندوب محدد --' },
                      ...salesReps.map((r) => ({
                        value: r.id,
                        label: `${r.name} (${r.code})`,
                        subLabel: r.phone,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ العرض
                  </label>
                  <input
                    type="date"
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    صالح حتى (تاريخ الانتهاء)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Items Section (Single Horizontal Row Layout) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-800 text-sm">أصناف وبنود عرض السعر</span>
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {items.length} {items.length === 1 ? 'بند' : 'بنود'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItemRow(false)}
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-200 text-xs shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + إضافة بند
                  </button>
                </div>

                {/* Table Column Headers on Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100/90 rounded-xl text-[11px] font-bold text-slate-600">
                  <div className="col-span-4">الصنف والمنتج</div>
                  <div className="col-span-2 text-center">الكمية (يدعم 5*10)</div>
                  <div className="col-span-2 text-center">سعر الوحدة ({currency})</div>
                  <div className="col-span-2 text-center">خصم الصنف</div>
                  <div className="col-span-2 text-center">الإجمالي شامل الضريبة</div>
                </div>

                {/* Single Row Item Cards */}
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 sm:p-2 rounded-xl bg-white border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2 items-center hover:border-slate-300 transition-colors"
                    >
                      {/* Product Selector in single row */}
                      <div className="sm:col-span-4">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">
                          بند #{idx + 1}: الصنف والمنتج
                        </label>
                        <ProductSelectSearch
                          selectedProductId={item.productId}
                          onSelectProduct={(p) => updateItem(idx, 'productId', p.id, false)}
                          placeholder="اختر الصنف..."
                        />
                      </div>

                      {/* Quantity with Math calculator */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">الكمية</label>
                        <MathQuantityInput
                          value={item.quantity}
                          onChange={(val) => updateItem(idx, 'quantity', val, false)}
                          min={0.01}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">سعر الوحدة</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0, false)
                          }
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center font-mono"
                        />
                      </div>

                      {/* Single Item Discount */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-amber-700 mb-0.5 font-bold flex items-center gap-1">
                          <Tag className="w-3 h-3 text-amber-600" />
                          <span>خصم الصنف</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={item.discount || ''}
                          onChange={(e) =>
                            updateItem(idx, 'discount', parseFloat(e.target.value) || 0, false)
                          }
                          className="w-full p-2 text-xs rounded-xl border border-amber-300 bg-amber-50/50 font-bold text-center text-amber-900 font-mono"
                        />
                      </div>

                      {/* Item Total & Delete on Single Line */}
                      <div className="sm:col-span-2 flex items-center justify-between gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex-1 text-center font-extrabold text-xs text-amber-700 font-mono py-1">
                          {formatMoney(item.total)}
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx, false)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                            title="حذف البند"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Item Row Button */}
                <button
                  type="button"
                  onClick={() => addItemRow(false)}
                  className="w-full py-2.5 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/30 hover:bg-amber-50 text-amber-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-amber-600" />
                  + إضافة بند جديد لعرض السعر
                </button>
              </div>

              {/* Totals, Discount, Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      شروط الدفع والتوريد
                    </label>
                    <input
                      type="text"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      placeholder="مثال: الدفع نقداً عند الاستلام، التوريد خلال 3 أيام..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ملاحظات وبنود إضافية
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="أي شروط أو تفاصيل إضافية للعميل..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-r md:border-r-slate-200 md:pr-4">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>إجمالي الأصناف:</span>
                    <span className="font-mono font-bold">{formatMoney(grossSubtotal)} {currency}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 gap-2">
                    <span>خصم إضافي على العرض:</span>
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        value={quotationDiscount}
                        onChange={(e) => setQuotationDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1 text-center font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 gap-2">
                    <span>نسبة الضريبة (%):</span>
                    <div className="w-20">
                      <input
                        type="number"
                        value={vatRate}
                        onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1 text-center font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-600">
                    <span>مبلغ الضريبة:</span>
                    <span className="font-mono font-bold">{formatMoney(vatTotal)} {currency}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>الإجمالي النهائي للعرض:</span>
                    <span className="font-mono text-amber-700 text-base">{formatMoney(grandTotal)} {currency}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  حفظ وإصدار عرض السعر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT QUOTATION MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-6xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    تعديل عرض السعر
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {editId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    العميل <span className="text-rose-500">*</span>
                  </label>
                  <SearchableSelect
                    value={editCustomerId}
                    onChange={(val) => setEditCustomerId(val)}
                    placeholder="اختر العميل..."
                    searchPlaceholder="ابحث باسم العميل..."
                    options={customers.map((c) => ({
                      value: c.id,
                      label: c.name,
                      subLabel: c.phone,
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مندوب المبيعات
                  </label>
                  <SearchableSelect
                    value={editSalesRepId}
                    onChange={(val) => setEditSalesRepId(val)}
                    placeholder="-- بدون مندوب --"
                    searchPlaceholder="ابحث باسم المندوب..."
                    options={[
                      { value: '', label: '-- بدون مندوب --' },
                      ...salesReps.map((r) => ({
                        value: r.id,
                        label: r.name,
                        subLabel: r.phone,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ العرض
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الحالة
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as Quotation['status'])}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="draft">مسودة</option>
                    <option value="pending">قيد الانتظار</option>
                    <option value="sent">تم الإرسال</option>
                    <option value="approved">معتمد ومقبول</option>
                    <option value="converted_to_order">محول لأمر بيع</option>
                    <option value="converted_to_invoice">محول لفاتورة</option>
                    <option value="rejected">مرفوض</option>
                    <option value="expired">منتهي الصلاحية</option>
                  </select>
                </div>
              </div>

              {/* Items Section (Single Horizontal Row Layout) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-800 text-sm">أصناف وبنود عرض السعر</span>
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {editItems.length} {editItems.length === 1 ? 'بند' : 'بنود'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItemRow(true)}
                    className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-200 text-xs shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + إضافة بند
                  </button>
                </div>

                {/* Table Column Headers on Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100/90 rounded-xl text-[11px] font-bold text-slate-600">
                  <div className="col-span-4">الصنف والمنتج</div>
                  <div className="col-span-2 text-center">الكمية (يدعم 5*10)</div>
                  <div className="col-span-2 text-center">سعر الوحدة ({currency})</div>
                  <div className="col-span-2 text-center">خصم الصنف</div>
                  <div className="col-span-2 text-center">الإجمالي شامل الضريبة</div>
                </div>

                {/* Single Row Item Cards */}
                <div className="space-y-2">
                  {editItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 sm:p-2 rounded-xl bg-white border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2 items-center hover:border-slate-300 transition-colors"
                    >
                      {/* Product Selector in single row */}
                      <div className="sm:col-span-4">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">
                          بند #{idx + 1}: الصنف والمنتج
                        </label>
                        <ProductSelectSearch
                          selectedProductId={item.productId}
                          onSelectProduct={(p) => updateItem(idx, 'productId', p.id, true)}
                          placeholder="اختر الصنف..."
                        />
                      </div>

                      {/* Quantity with Math calculator */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">الكمية</label>
                        <MathQuantityInput
                          value={item.quantity}
                          onChange={(val) => updateItem(idx, 'quantity', val, true)}
                          min={0.01}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">سعر الوحدة</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0, true)
                          }
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center font-mono"
                        />
                      </div>

                      {/* Single Item Discount */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-amber-700 mb-0.5 font-bold flex items-center gap-1">
                          <Tag className="w-3 h-3 text-amber-600" />
                          <span>خصم الصنف</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={item.discount || ''}
                          onChange={(e) =>
                            updateItem(idx, 'discount', parseFloat(e.target.value) || 0, true)
                          }
                          className="w-full p-2 text-xs rounded-xl border border-amber-300 bg-amber-50/50 font-bold text-center text-amber-900 font-mono"
                        />
                      </div>

                      {/* Item Total & Delete on Single Line */}
                      <div className="sm:col-span-2 flex items-center justify-between gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex-1 text-center font-extrabold text-xs text-amber-700 font-mono py-1">
                          {formatMoney(item.total)}
                        </div>
                        {editItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx, true)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                            title="حذف البند"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Item Row Button */}
                <button
                  type="button"
                  onClick={() => addItemRow(true)}
                  className="w-full py-2.5 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/30 hover:bg-amber-50 text-amber-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-amber-600" />
                  + إضافة بند جديد لعرض السعر
                </button>
              </div>

              {/* Totals & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      شروط الدفع والتوريد
                    </label>
                    <input
                      type="text"
                      value={editPaymentTerms}
                      onChange={(e) => setEditPaymentTerms(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ملاحظات
                    </label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-r md:border-r-slate-200 md:pr-4">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>إجمالي الأصناف:</span>
                    <span className="font-mono font-bold">{formatMoney(editGrossSubtotal)} {currency}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 gap-2">
                    <span>خصم إضافي:</span>
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        value={editQuotationDiscount}
                        onChange={(e) => setEditQuotationDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1 text-center font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 gap-2">
                    <span>نسبة الضريبة (%):</span>
                    <div className="w-20">
                      <input
                        type="number"
                        value={editVatRate}
                        onChange={(e) => setEditVatRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1 text-center font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-slate-600">
                    <span>مبلغ الضريبة:</span>
                    <span className="font-mono font-bold">{formatMoney(editVatTotal)} {currency}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>الإجمالي النهائي للعرض:</span>
                    <span className="font-mono text-amber-700 text-base">{formatMoney(editGrandTotal)} {currency}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT / PREVIEW MODAL */}
      {showPrintModal && selectedQuotation && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title="معاينة عرض السعر الرسمي"
          docNumber={selectedQuotation.quotationNumber}
          badgeText="عرض سعر معتمد"
          badgeColor="bg-amber-50 text-amber-800 border-amber-200"
          elementId="quotation-print-canvas-sheet"
        >
          {({ orientation }) => (
            <div className="space-y-6 text-xs text-slate-800">
              {/* Standardized Header with Logo & Business Details */}
              <PrintHeader
                docTitle="عرض أسعار رسمي (QUOTATION)"
                docNumber={selectedQuotation.quotationNumber}
                date={selectedQuotation.date}
                dueDate={selectedQuotation.validUntil ? `صالح حتى: ${selectedQuotation.validUntil}` : undefined}
                badgeColor="bg-amber-600 text-white"
                additionalMeta={[
                  { label: 'العميل', value: selectedQuotation.customerName },
                  { label: 'المسؤول', value: selectedQuotation.salesRepName || 'قسم المبيعات' },
                ]}
                orientation={orientation}
              />

              {/* Customer Information Box */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">مقدم إلى العميل (Customer):</span>
                  <p className="text-sm font-bold text-slate-900">{selectedQuotation.customerName}</p>
                  {selectedQuotation.customerPhone && (
                    <p className="text-slate-600 font-mono mt-0.5">الهاتف: {selectedQuotation.customerPhone}</p>
                  )}
                  {selectedQuotation.customerTaxNumber && (
                    <p className="text-slate-600 font-mono mt-0.5">الرقم الضريبي: {selectedQuotation.customerTaxNumber}</p>
                  )}
                </div>

                <div className="text-left space-y-1">
                  <div>
                    <span className="text-slate-500">مندوب المبيعات: </span>
                    <strong className="text-slate-900">{selectedQuotation.salesRepName || 'الإدارة'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">شروط الدفع والتسليم: </span>
                    <span className="font-semibold text-slate-800">{selectedQuotation.paymentTerms || 'حسب الاتفاق'}</span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border border-slate-200">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">بيان الصنف والخدمة</th>
                      <th className="p-2.5 text-center">الكمية</th>
                      <th className="p-2.5 text-center">سعر الوحدة</th>
                      <th className="p-2.5 text-center">الخصم</th>
                      <th className="p-2.5 text-center">الصافي</th>
                      <th className="p-2.5 text-center">الضريبة</th>
                      <th className="p-2.5 text-left">الإجمالي ({currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedQuotation.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2.5">
                          <p className="font-bold text-slate-900">{it.productName}</p>
                          {it.sku && <span className="text-[10px] text-slate-400 font-mono">SKU: {it.sku}</span>}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold">{it.quantity} {it.unit || ''}</td>
                        <td className="p-2.5 text-center font-mono">{formatMoney(it.unitPrice)}</td>
                        <td className="p-2.5 text-center font-mono">{formatMoney(it.discount || 0)}</td>
                        <td className="p-2.5 text-center font-mono">{formatMoney(it.subtotal)}</td>
                        <td className="p-2.5 text-center font-mono">{formatMoney(it.vatAmount)}</td>
                        <td className="p-2.5 text-left font-mono font-bold text-slate-900">{formatMoney(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>إجمالي القيمة:</span>
                    <span className="font-mono font-bold">{formatMoney(selectedQuotation.subtotal)} {currency}</span>
                  </div>
                  {selectedQuotation.discountTotal > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>إجمالي الخصم:</span>
                      <span className="font-mono font-bold">-{formatMoney(selectedQuotation.discountTotal)} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>ضريبة القيمة المضافة ({selectedQuotation.vatRate}%):</span>
                    <span className="font-mono font-bold">{formatMoney(selectedQuotation.vatTotal)} {currency}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                    <span>صافي العرض النهائي:</span>
                    <span className="font-mono text-amber-700 text-base font-black">{formatMoney(selectedQuotation.grandTotal)} {currency}</span>
                  </div>
                </div>
              </div>

              {/* Standardized Footer */}
              <PrintFooter
                preparedByTitle="إعداد / قسم المبيعات"
                approvedByTitle="اعتماد إدارة المنشأة"
                receivedByTitle="موافقة وتوقيع العميل"
                terms={selectedQuotation.notes || 'العرض ساري للمدة المحددة أعلاه، والأسعار خاضعة للشروط المتفق عليها.'}
              />
            </div>
          )}
        </PrintPreviewModal>
      )}
    </div>
  );
};
