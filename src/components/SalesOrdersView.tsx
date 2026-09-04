import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { SalesOrder, SalesOrderItem, Quotation } from '../types';
import { ProductSelectSearch } from './ProductSelectSearch';
import { MathQuantityInput } from './MathQuantityInput';
import { OrbixLogo } from './OrbixLogo';
import { PrintPreviewModal } from './PrintPreviewModal';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import { SearchableSelect } from './SearchableSelect';
import {
  ClipboardList,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
  X,
  Edit3,
  Trash2,
  RotateCcw,
  Tag,
  Package,
  Calendar,
  UserCheck,
  Building2,
  FileBadge,
  FileSpreadsheet,
  Truck,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SalesOrdersViewProps {
  onNavigateToInvoices?: () => void;
  onNavigateToQuotations?: () => void;
}

export const SalesOrdersView: React.FC<SalesOrdersViewProps> = ({
  onNavigateToInvoices,
  onNavigateToQuotations,
}) => {
  const {
    companyProfile,
    salesOrders,
    salesInvoices,
    quotations,
    customers,
    products,
    salesReps,
    currency,
    formatMoney,
    hasPermission,
    addSalesOrder,
    editSalesOrder,
    deleteSalesOrder,
    updateSalesOrderStatus,
    convertSalesOrderToInvoice,
    getNextSequenceCode,
    getProductPriceForCustomer,
    showAlert,
    showConfirm,
  } = useErp();

  const companyVat = companyProfile?.defaultVatRate ?? 15;

  const [statusFilter, setStatusFilter] = useState<'all' | SalesOrder['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showImportQuotationModal, setShowImportQuotationModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // New Sales Order Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [salesRepId, setSalesRepId] = useState(salesReps[0]?.id || '');
  const [linkedQuotationId, setLinkedQuotationId] = useState<string | undefined>(undefined);
  const [linkedQuotationNumber, setLinkedQuotationNumber] = useState<string | undefined>(undefined);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [vatRate, setVatRate] = useState(companyVat);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [shippingAddress, setShippingAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('يرجى التوريد لمقر العميل بعد التنسيق هاتفياً.');
  const [notes, setNotes] = useState('أمر بيع وتوريد معتمد.');
  const [items, setItems] = useState<SalesOrderItem[]>(() => {
    const initialProduct = products[0];
    const initialPrice = initialProduct?.sellingPrice || 100;
    const initialVat = (initialPrice * companyVat) / 100;
    return [
      {
        id: `so-item-${Date.now()}-1`,
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
        deliveredQuantity: 0,
      },
    ];
  });

  // Edit Sales Order Form State
  const [editId, setEditId] = useState('');
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editSalesRepId, setEditSalesRepId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editExpectedDeliveryDate, setEditExpectedDeliveryDate] = useState('');
  const [editStatus, setEditStatus] = useState<SalesOrder['status']>('confirmed');
  const [editShippingAddress, setEditShippingAddress] = useState('');
  const [editDeliveryNotes, setEditDeliveryNotes] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<SalesOrderItem[]>([]);
  const [editVatRate, setEditVatRate] = useState(companyVat);
  const [editOrderDiscount, setEditOrderDiscount] = useState<number>(0);

  // Recalculate totals for Create
  const grossSubtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const itemsDiscountTotal = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const netItemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountTotal = itemsDiscountTotal + (orderDiscount || 0);
  const taxableSubtotal = Math.max(0, netItemsSubtotal - (orderDiscount || 0));
  const vatTotal = vatRate > 0 ? (taxableSubtotal * vatRate) / 100 : 0;
  const grandTotal = taxableSubtotal + vatTotal;

  // Recalculate totals for Edit
  const editGrossSubtotal = editItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const editItemsDiscountTotal = editItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  const editNetItemsSubtotal = editItems.reduce((sum, item) => sum + item.subtotal, 0);
  const editDiscountTotal = editItemsDiscountTotal + (editOrderDiscount || 0);
  const editTaxableSubtotal = Math.max(0, editNetItemsSubtotal - (editOrderDiscount || 0));
  const editVatTotal = editVatRate > 0 ? (editTaxableSubtotal * editVatRate) / 100 : 0;
  const editGrandTotal = editTaxableSubtotal + editVatTotal;

  // Quotations available for creating a sales order (strictly without any movement / conversion)
  const availableQuotationsForOrder = quotations.filter((quo) => {
    // Exclude if already converted or rejected
    if (
      quo.status === 'converted_to_order' ||
      quo.status === 'converted_to_invoice' ||
      quo.status === 'rejected'
    ) {
      return false;
    }
    // Exclude if linked to an order
    if (quo.convertedToOrderId) return false;
    const hasLinkedOrder = salesOrders.some(
      (so) =>
        so.quotationId === quo.id ||
        (quo.quotationNumber && so.quotationNumber === quo.quotationNumber) ||
        quo.convertedToOrderId === so.id ||
        (quo.convertedToOrderNumber && so.orderNumber === quo.convertedToOrderNumber)
    );
    if (hasLinkedOrder) return false;

    // Exclude if linked to an invoice
    if (quo.convertedToInvoiceId) return false;
    const hasLinkedInvoice = salesInvoices.some(
      (inv) =>
        inv.quotationId === quo.id ||
        (quo.quotationNumber && inv.quotationNumber === quo.quotationNumber) ||
        quo.convertedToInvoiceId === inv.id ||
        (quo.convertedToInvoiceNumber && inv.invoiceNumber === quo.convertedToInvoiceNumber)
    );
    if (hasLinkedInvoice) return false;

    return true;
  });

  // Permissions
  const canEdit = hasPermission('edit_invoices');
  const canDelete = hasPermission('delete_invoices');

  // Filter orders
  const filteredOrders = salesOrders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.quotationNumber && o.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.notes && o.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const totalOrdersCount = salesOrders.length;
  const confirmedCount = salesOrders.filter((o) => o.status === 'confirmed').length;
  const processingCount = salesOrders.filter((o) => o.status === 'processing').length;
  const deliveredCount = salesOrders.filter((o) => o.status === 'delivered').length;
  const invoicedCount = salesOrders.filter((o) => o.status === 'invoiced').length;
  const totalValue = salesOrders.reduce((acc, o) => acc + o.grandTotal, 0);

  // Status badge config
  const getStatusBadge = (status: SalesOrder['status']) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'مؤكد للتجهيز',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'processing':
        return {
          label: 'قيد التجهيز والتسليم',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        };
      case 'delivered':
        return {
          label: 'تم التوريد والتسليم',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Truck,
        };
      case 'invoiced':
        return {
          label: 'مفوتر بالكامل',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: FileSpreadsheet,
        };
      case 'cancelled':
        return {
          label: 'ملغي',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: X,
        };
      case 'pending':
      default:
        return {
          label: 'قيد الانتظار',
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
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
    const newItem: SalesOrderItem = {
      id: `so-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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
      deliveredQuantity: 0,
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
    field: keyof SalesOrderItem,
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

  // Import from Quotation handler
  const handleImportQuotation = (quo: Quotation) => {
    setCustomerId(quo.customerId);
    if (quo.salesRepId) setSalesRepId(quo.salesRepId);
    setLinkedQuotationId(quo.id);
    setLinkedQuotationNumber(quo.quotationNumber);
    setVatRate(quo.vatRate || companyVat);
    setOrderDiscount(quo.discountTotal || 0);
    setDeliveryNotes(quo.paymentTerms ? `شروط العرض: ${quo.paymentTerms}` : 'تم الاسترداد من عرض السعر.');
    setNotes(`أمر بيع منشأ ومسترد من عرض السعر ${quo.quotationNumber}`);

    // Map quotation items to sales order items
    const orderItems: SalesOrderItem[] = quo.items.map((it, idx) => ({
      id: `so-item-${Date.now()}-${idx + 1}`,
      productId: it.productId,
      productName: it.productName,
      sku: it.sku,
      unit: it.unit || 'قطعة',
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discount: it.discount || 0,
      subtotal: it.subtotal,
      vatAmount: it.vatAmount,
      total: it.total,
      deliveredQuantity: 0,
    }));

    setItems(orderItems);
    setShowImportQuotationModal(false);
    setShowCreateModal(true);

    showAlert({
      title: 'تم استرداد بيانات عرض السعر ✨',
      message: `تم ملء بنود وأسعار وبيانات العميل من عرض السعر (${quo.quotationNumber}). يمكنك مراجعة البيانات وحفظ أمر البيع.`,
      type: 'info',
    });
  };

  // Open Edit Modal
  const handleOpenEdit = (order: SalesOrder) => {
    if (!canEdit) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'ليس لديك صلاحية لتعديل أوامر البيع.',
        type: 'error',
      });
      return;
    }
    setEditId(order.id);
    setEditCustomerId(order.customerId);
    setEditSalesRepId(order.salesRepId || '');
    setEditDate(order.date);
    setEditExpectedDeliveryDate(order.expectedDeliveryDate || '');
    setEditStatus(order.status);
    setEditShippingAddress(order.shippingAddress || '');
    setEditDeliveryNotes(order.deliveryNotes || '');
    setEditNotes(order.notes || '');
    setEditVatRate(order.vatRate ?? companyVat);
    setEditOrderDiscount(order.discountTotal || 0);
    setEditItems(
      order.items.map((it) => ({
        ...it,
      }))
    );
    setShowEditModal(true);
  };

  // Submit Create
  const handleCreateOrder = (e: React.FormEvent) => {
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

    const newOrder = addSalesOrder({
      customerId,
      customerName: cust?.name || 'عميل نقدي',
      customerPhone: cust?.phone,
      customerTaxNumber: cust?.taxNumber,
      salesRepId: rep?.id,
      salesRepName: rep?.name,
      quotationId: linkedQuotationId,
      quotationNumber: linkedQuotationNumber,
      date: orderDate,
      expectedDeliveryDate,
      status: 'confirmed',
      items,
      subtotal: grossSubtotal,
      discountTotal,
      vatRate,
      vatTotal,
      grandTotal,
      shippingAddress,
      deliveryNotes,
      notes,
    });

    // Reset linked quotation if any
    setLinkedQuotationId(undefined);
    setLinkedQuotationNumber(undefined);

    setShowCreateModal(false);
    showAlert({
      title: 'تم إنشاء أمر البيع بنجاح 🎉',
      message: `تم تسجيل أمر البيع برقم (${newOrder.orderNumber}) للعميل (${cust?.name}) بإجمالي ${formatMoney(grandTotal)}.`,
      type: 'success',
    });
  };

  // Submit Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === editCustomerId);
    const rep = salesReps.find((r) => r.id === editSalesRepId);

    editSalesOrder(editId, {
      customerId: editCustomerId,
      customerName: cust?.name || 'عميل نقدي',
      customerPhone: cust?.phone,
      customerTaxNumber: cust?.taxNumber,
      salesRepId: rep?.id,
      salesRepName: rep?.name,
      date: editDate,
      expectedDeliveryDate: editExpectedDeliveryDate,
      status: editStatus,
      shippingAddress: editShippingAddress,
      deliveryNotes: editDeliveryNotes,
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
      message: 'تم تحديث أمر البيع والتوريد بنجاح.',
      type: 'success',
    });
  };

  // Delete Handler
  const handleDelete = (order: SalesOrder) => {
    if (!canDelete) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'ليس لديك صلاحية لحذف أوامر البيع.',
        type: 'error',
      });
      return;
    }

    const linkedQuo = quotations.find(
      (q) =>
        q.convertedToOrderId === order.id ||
        q.convertedToOrderNumber === order.orderNumber ||
        (order.quotationId && q.id === order.quotationId) ||
        (order.quotationNumber && q.quotationNumber === order.quotationNumber)
    );

    if (linkedQuo) {
      showConfirm({
        title: `⚠️ تنبيه: أمر البيع مرتبط بعرض سعر (${order.orderNumber})`,
        type: 'warning',
        message: `أمر البيع هذا (${order.orderNumber}) تم ترحيله وإنشاؤه من عرض السعر (${linkedQuo.quotationNumber}). هل أنت متأكد من رغبتك في حذفه وعكس الحركة؟`,
        details: [
          `سيتم فك الارتباط تلقائياً وإرجاع حالة عرض السعر (${linkedQuo.quotationNumber}) إلى (معتمد / قيد الإجراء).`,
          'سيتم إعادة إتاحة خيارات التحويل والإجراءات كاملة على عرض السعر.',
          'سيتم حذف سجل أمر البيع من قائمة الأوامر والتوريدات.',
        ].join('\n• '),
        confirmText: 'نعم، احذف أمر البيع وأرجع الحركة',
        cancelText: 'إلغاء الأمر',
        isDestructive: true,
        onConfirm: () => {
          deleteSalesOrder(order.id);
          showAlert({
            title: 'تم الحذف وفك الارتباط',
            message: `تم حذف أمر البيع ${order.orderNumber} وإرجاع حالة عرض السعر (${linkedQuo.quotationNumber}) إلى معتمد بنجاح.`,
            type: 'info',
          });
        },
      });
    } else {
      showConfirm({
        title: `حذف أمر البيع (${order.orderNumber})`,
        message: `هل أنت متأكد من حذف أمر البيع الخاص بالعميل (${order.customerName}) بقيمة ${formatMoney(order.grandTotal)}؟`,
        confirmText: 'نعم، احذف',
        cancelText: 'إلغاء',
        isDestructive: true,
        onConfirm: () => {
          deleteSalesOrder(order.id);
          showAlert({
            title: 'تم الحذف',
            message: `تم حذف أمر البيع ${order.orderNumber} بنجاح.`,
            type: 'info',
          });
        },
      });
    }
  };

  // Conversion: Sales Order -> Sales Invoice
  const handleConvertToInvoice = (order: SalesOrder) => {
    showConfirm({
      title: 'تحويل أمر البيع إلى فاتورة مبيعات ضريبية',
      message: `سيتم إنشاء فاتورة مبيعات رسمية مستردة من أمر البيع (${order.orderNumber})، وتحديث المخازن وترحيل القيود المحاسبية الآلية وتحديث حالة أمر البيع إلى (مفوتر).`,
      confirmText: 'تأكيد وإصدار الفاتورة',
      cancelText: 'إلغاء',
      onConfirm: () => {
        try {
          const newInv = convertSalesOrderToInvoice(order.id);
          showAlert({
            title: 'تم إصدار فاتورة المبيعات بنجاح 🧾',
            message: `تم إصدار الفاتورة الضريبية رقم (${newInv.invoiceNumber}) بمبلغ ${formatMoney(newInv.grandTotal)} وتم ربطها بأمر البيع.`,
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
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                أوامر البيع والتوريد (Sales Orders)
              </h2>
              <p className="text-xs text-slate-500">
                إدارة أوامر التوريد ومتابعة التجهيز والتسليم، والاسترداد السريع من عروض الأسعار والتحويل للفواتير
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Button to import from quotation */}
          <button
            type="button"
            id="btn-import-from-quotation"
            onClick={() => setShowImportQuotationModal(true)}
            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            استرداد من عرض سعر
          </button>

          <button
            type="button"
            id="btn-create-order"
            onClick={() => {
              setLinkedQuotationId(undefined);
              setLinkedQuotationNumber(undefined);
              setShowCreateModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            إنشاء أمر بيع جديد
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي الأوامر</span>
            <ClipboardList className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2 font-mono">{totalOrdersCount}</p>
          <span className="text-[11px] text-slate-400">كافة الأوامر المسجلة</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">أوامر مؤكدة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-2 font-mono">{confirmedCount}</p>
          <span className="text-[11px] text-emerald-700/70">جاهزة للتجهيز</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">قيد التجهيز / التسليم</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-2 font-mono">{processingCount}</p>
          <span className="text-[11px] text-amber-700/70">في المستودع والشحن</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">مفوتر بالكامل</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-purple-600 mt-2 font-mono">{invoicedCount}</p>
          <span className="text-[11px] text-purple-700/70">تم إصدار فواتير لها</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">القيمة الإجمالية</span>
            <Tag className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2 font-mono">
            {formatMoney(totalValue)}
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
            placeholder="بحث برقم الأمر أو العميل أو رقم العرض..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
            الكل ({salesOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('confirmed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'confirmed'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            مؤكد
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('processing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'processing'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            قيد التجهيز
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('delivered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'delivered'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            تم التوريد
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('invoiced')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
              statusFilter === 'invoiced'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            مفوتر بالكامل
          </button>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5 sm:p-4">رقم الأمر</th>
                <th className="p-3.5 sm:p-4">التاريخ والتسليم</th>
                <th className="p-3.5 sm:p-4">العميل</th>
                <th className="p-3.5 sm:p-4">المصدر المرجعي</th>
                <th className="p-3.5 sm:p-4">البنود</th>
                <th className="p-3.5 sm:p-4">إجمالي القيمة</th>
                <th className="p-3.5 sm:p-4">الحالة</th>
                <th className="p-3.5 sm:p-4 text-center">الإجراءات والتحويل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    لا توجد أوامر بيع مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const linkedInv = salesInvoices.find(
                    (inv) =>
                      inv.salesOrderId === order.id ||
                      (order.orderNumber && inv.salesOrderNumber === order.orderNumber) ||
                      order.invoiceId === inv.id ||
                      order.convertedToInvoiceId === inv.id ||
                      (order.invoiceNumber && inv.invoiceNumber === order.invoiceNumber) ||
                      (order.convertedToInvoiceNumber && inv.invoiceNumber === order.convertedToInvoiceNumber)
                  );

                  const effectiveStatus = linkedInv ? 'invoiced' : order.status;
                  const badge = getStatusBadge(effectiveStatus);
                  const BadgeIcon = badge.icon;
                  const displayInvoiceNumber =
                    linkedInv?.invoiceNumber || order.invoiceNumber || order.convertedToInvoiceNumber;
                  const isInvoiced =
                    effectiveStatus === 'invoiced' ||
                    Boolean(linkedInv || order.invoiceId || order.convertedToInvoiceId);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 sm:p-4 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <div className="text-slate-800 font-medium">{order.date}</div>
                        {order.expectedDeliveryDate && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <span>تسليم متوقع:</span>
                            <span className="font-mono">{order.expectedDeliveryDate}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <div className="font-bold text-slate-900">{order.customerName}</div>
                        {order.customerPhone && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {order.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        {order.quotationNumber ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-mono text-xs">
                            <FileBadge className="w-3 h-3" />
                            {order.quotationNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">مباشر</span>
                        )}
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono text-xs">
                          {order.items.length} أصناف
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 font-bold font-mono text-slate-900">
                        {formatMoney(order.grandTotal)}{' '}
                        <span className="text-[11px] text-slate-500 font-sans">{currency}</span>
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
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
                              setSelectedOrder(order);
                              setShowPrintModal(true);
                            }}
                            title="معاينة وطباعة أمر البيع"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Convert to Invoice Button (only when not already invoiced) */}
                          {!isInvoiced && (
                            <button
                              type="button"
                              onClick={() => handleConvertToInvoice(order)}
                              title="تحويل إلى فاتورة مبيعات ضريبية"
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg border border-emerald-200 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              فاتورة
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(order)}
                            disabled={!canEdit}
                            title={canEdit ? 'تعديل أمر البيع' : 'ليس لديك صلاحية التعديل'}
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
                            onClick={() => handleDelete(order)}
                            disabled={!canDelete}
                            title={canDelete ? 'حذف أمر البيع' : 'ليس لديك صلاحية الحذف'}
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

      {/* MODAL: SELECT QUOTATION TO IMPORT */}
      {showImportQuotationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    استرداد البيانات من عرض سعر (Import from Quotation)
                  </h3>
                  <p className="text-xs text-slate-500">
                    اختر أحد عروض الأسعار المسجلة لاستيراد بنودها وأسعارها إلى أمر بيع جديد
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportQuotationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 space-y-2.5 pr-1">
              {availableQuotationsForOrder.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <FileBadge className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-600 text-sm">لا توجد عروض أسعار متاحة للاسترداد حالياً</p>
                  <p className="text-xs text-slate-400 mt-1">جميع عروض الأسعار المسجلة تم ترحيلها إلى أوامر بيع / فواتير مبيعات بالفعل أو مرتبطة بحركات.</p>
                </div>
              ) : (
                availableQuotationsForOrder.map((quo) => (
                  <div
                    key={quo.id}
                    className="p-3.5 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-2xl transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {quo.quotationNumber}
                        </span>
                        <span className="text-xs text-slate-500 font-sans">
                          ({quo.date})
                        </span>
                        {quo.status === 'approved' && (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            معتمد
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-700 mt-1">
                        العميل: {quo.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {quo.items.length} أصناف • إجمالي {formatMoney(quo.grandTotal)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleImportQuotation(quo)}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      استرداد وإنشاء أمر بيع
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE SALES ORDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-6xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    إنشاء أمر بيع وتوريد جديد
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    الرقم المقترح: {getNextSequenceCode('sales_order')}
                    {linkedQuotationNumber && (
                      <span className="mr-2 text-amber-600 font-sans font-bold">
                        (مسترد من عرض السعر {linkedQuotationNumber})
                      </span>
                    )}
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

            <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1">
              {/* Header Info */}
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
                    تاريخ أمر البيع
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاريخ التسليم المتوقع
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Items Section (Single Horizontal Row Layout) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm">أصناف وبنود أمر البيع</span>
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {items.length} {items.length === 1 ? 'بند' : 'بنود'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItemRow(false)}
                    className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 text-xs shadow-2xs"
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
                        <label className="sm:hidden block text-[10px] text-blue-700 mb-0.5 font-bold flex items-center gap-1">
                          <Tag className="w-3 h-3 text-blue-600" />
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
                          className="w-full p-2 text-xs rounded-xl border border-blue-300 bg-blue-50/50 font-bold text-center text-blue-900 font-mono"
                        />
                      </div>

                      {/* Item Total & Delete on Single Line */}
                      <div className="sm:col-span-2 flex items-center justify-between gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex-1 text-center font-extrabold text-xs text-blue-700 font-mono py-1">
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
                  className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50 text-blue-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  + إضافة بند جديد لأمر البيع
                </button>
              </div>

              {/* Delivery, Shipping Address & Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      عنوان وموقع التوريد / الشحن
                    </label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="عنوان مستودع العميل أو موقع التسليم..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      تعليمات التسليم والشحن
                    </label>
                    <input
                      type="text"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="تعليمات خاصة لأمين المخزن وسائق الشحن..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ملاحظات عامة
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-r md:border-r-slate-200 md:pr-4">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>إجمالي الأصناف:</span>
                    <span className="font-mono font-bold">{formatMoney(grossSubtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 gap-2">
                    <span>خصم على أمر البيع:</span>
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        value={orderDiscount}
                        onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
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
                    <span className="font-mono font-bold">{formatMoney(vatTotal)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>الإجمالي النهائي لأمر البيع:</span>
                    <span className="font-mono text-blue-700 text-base">{formatMoney(grandTotal)}</span>
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
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  حفظ وتأكيد أمر البيع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SALES ORDER MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-6xl p-6 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    تعديل أمر البيع والتوريد
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
                    تاريخ أمر البيع
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    حالة الأمر
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as SalesOrder['status'])}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="confirmed">مؤكد للتجهيز</option>
                    <option value="processing">قيد التجهيز والتسليم</option>
                    <option value="delivered">تم التوريد والتسليم</option>
                    <option value="invoiced">مفوتر بالكامل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>

              {/* Items Section (Single Horizontal Row Layout) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm">أصناف وبنود أمر البيع</span>
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {editItems.length} {editItems.length === 1 ? 'بند' : 'بنود'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => addItemRow(true)}
                    className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 text-xs shadow-2xs"
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
                        <label className="sm:hidden block text-[10px] text-blue-700 mb-0.5 font-bold flex items-center gap-1">
                          <Tag className="w-3 h-3 text-blue-600" />
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
                          className="w-full p-2 text-xs rounded-xl border border-blue-300 bg-blue-50/50 font-bold text-center text-blue-900 font-mono"
                        />
                      </div>

                      {/* Item Total & Delete on Single Line */}
                      <div className="sm:col-span-2 flex items-center justify-between gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex-1 text-center font-extrabold text-xs text-blue-700 font-mono py-1">
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
                  className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50 text-blue-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  + إضافة بند جديد لأمر البيع
                </button>
              </div>

              {/* Delivery info & Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      عنوان التسليم والشحن
                    </label>
                    <input
                      type="text"
                      value={editShippingAddress}
                      onChange={(e) => setEditShippingAddress(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      تعليمات التسليم
                    </label>
                    <input
                      type="text"
                      value={editDeliveryNotes}
                      onChange={(e) => setEditDeliveryNotes(e.target.value)}
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
                    <span className="font-mono font-bold">{formatMoney(editGrossSubtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 gap-2">
                    <span>خصم على أمر البيع:</span>
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        value={editOrderDiscount}
                        onChange={(e) => setEditOrderDiscount(parseFloat(e.target.value) || 0)}
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
                    <span className="font-mono font-bold">{formatMoney(editVatTotal)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>الإجمالي النهائي لأمر البيع:</span>
                    <span className="font-mono text-blue-700 text-base">{formatMoney(editGrandTotal)}</span>
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
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
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
      {showPrintModal && selectedOrder && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title="معاينة أمر البيع والتوريد"
          docNumber={selectedOrder.orderNumber}
          badgeText="أمر بيع وتوريد معتمد"
          badgeColor="bg-blue-50 text-blue-800 border-blue-200"
          elementId="sales-order-print-sheet"
        >
          {({ orientation }) => (
            <div className="space-y-6 text-xs text-slate-800">
              {/* Standardized Header */}
              <PrintHeader
                docTitle="أمر بيع وتوريد (SALES ORDER)"
                docNumber={selectedOrder.orderNumber}
                date={selectedOrder.date}
                dueDate={selectedOrder.expectedDeliveryDate ? `تاريخ التسليم: ${selectedOrder.expectedDeliveryDate}` : undefined}
                badgeColor="bg-blue-700 text-white"
                additionalMeta={[
                  { label: 'العميل', value: selectedOrder.customerName },
                  { label: 'مرجع العرض', value: selectedOrder.quotationNumber || 'مباشر' },
                ]}
                orientation={orientation}
              />

              {/* Customer and Delivery Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">العميل (Customer):</span>
                  <p className="text-sm font-bold text-slate-900">{selectedOrder.customerName}</p>
                  {selectedOrder.customerPhone && (
                    <p className="text-slate-600 font-mono mt-0.5">الهاتف: {selectedOrder.customerPhone}</p>
                  )}
                  {selectedOrder.customerTaxNumber && (
                    <p className="text-slate-600 font-mono mt-0.5">الرقم الضريبي: {selectedOrder.customerTaxNumber}</p>
                  )}
                </div>

                <div className="text-left space-y-1">
                  {selectedOrder.shippingAddress && (
                    <p className="text-slate-700">موقع التسليم: <strong className="text-slate-900">{selectedOrder.shippingAddress}</strong></p>
                  )}
                  {selectedOrder.expectedDeliveryDate && (
                    <p className="text-slate-700 font-mono">تاريخ التسليم المتوقع: <strong>{selectedOrder.expectedDeliveryDate}</strong></p>
                  )}
                  <p className="text-slate-700">مندوب المبيعات: <strong>{selectedOrder.salesRepName || 'الإدارة'}</strong></p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border border-slate-200">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">بيان الصنف والمواصفات</th>
                      <th className="p-2.5 text-center">الكمية المطلوبة</th>
                      <th className="p-2.5 text-center">سعر الوحدة</th>
                      <th className="p-2.5 text-center">الخصم</th>
                      <th className="p-2.5 text-center">الصافي</th>
                      <th className="p-2.5 text-center">الضريبة</th>
                      <th className="p-2.5 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedOrder.items.map((it, idx) => (
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
                    <span className="font-mono font-bold">{formatMoney(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discountTotal > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>إجمالي الخصم:</span>
                      <span className="font-mono font-bold">-{formatMoney(selectedOrder.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>ضريبة القيمة المضافة ({selectedOrder.vatRate}%):</span>
                    <span className="font-mono font-bold">{formatMoney(selectedOrder.vatTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                    <span>الإجمالي النهائي لأمر البيع:</span>
                    <span className="font-mono text-blue-700 text-base font-black">{formatMoney(selectedOrder.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Standardized Footer */}
              <PrintFooter
                preparedByTitle="مسؤول المبيعات"
                approvedByTitle="مسؤول المستودع والتجهيز"
                receivedByTitle="استلام العميل والمطابقة"
                terms={selectedOrder.deliveryNotes || 'يلتزم المستودع بتجهيز وتسليم الطلبية وفق المواعيد والمواصفات المحددة أعلاه.'}
              />
            </div>
          )}
        </PrintPreviewModal>
      )}
    </div>
  );
};
