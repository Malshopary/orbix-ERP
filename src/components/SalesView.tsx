import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import { InvoiceItem, PaymentReceipt, SalesInvoice, Quotation, SalesOrder } from '../types';
import { SalesReturnsView } from './SalesReturnsView';
import { QuotationsView } from './QuotationsView';
import { SalesOrdersView } from './SalesOrdersView';
import { CustomerStatementModal } from './CustomerStatementModal';
import { ProductSelectSearch } from './ProductSelectSearch';
import { MathQuantityInput } from './MathQuantityInput';
import {
  Receipt,
  PlusCircle,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Printer,
  CreditCard,
  QrCode,
  X,
  FileSpreadsheet,
  Edit3,
  Trash2,
  Lock,
  RotateCcw,
  Tag,
  Package,
  Calculator,
  FileBadge,
  ClipboardList,
  Undo2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export const SalesView: React.FC = () => {
  const {
    companyProfile,
    salesInvoices,
    quotations,
    salesOrders,
    customers,
    products,
    accounts,
    formatMoney,
    canDeleteEntity,
    addSalesInvoice,
    editSalesInvoice,
    deleteSalesInvoice,
    recordInvoicePayment,
    hasPermission,
    activeSubTab: globalSubTab,
    setActiveSubTab: setGlobalSubTab,
    showAlert,
    showConfirm,
  } = useErp();

  const companyVat = companyProfile?.defaultVatRate ?? 15;

  const [activeSubTab, setActiveSubTabLocal] = useState<'quotes' | 'orders' | 'invoices' | 'returns'>('invoices');

  React.useEffect(() => {
    if (globalSubTab && ['quotes', 'orders', 'invoices', 'returns'].includes(globalSubTab)) {
      setActiveSubTabLocal(globalSubTab as any);
    }
  }, [globalSubTab]);

  const setActiveSubTab = (tab: 'quotes' | 'orders' | 'invoices' | 'returns') => {
    setActiveSubTabLocal(tab);
    setGlobalSubTab(tab);
  };

  // Filters & Sorting State
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [sortField, setSortField] = useState<'date' | 'invoiceNumber' | 'customerName' | 'grandTotal' | 'remainingAmount' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showImportQuotationModal, setShowImportQuotationModal] = useState(false);
  const [showImportOrderModal, setShowImportOrderModal] = useState(false);
  const [statementCustomerId, setStatementCustomerId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);

  // Edit Invoice Form State
  const [editInvId, setEditInvId] = useState('');
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<InvoiceItem[]>([]);
  const [editVatRate, setEditVatRate] = useState(companyVat);
  const [editInvoiceDiscount, setEditInvoiceDiscount] = useState<number>(0);

  // New Invoice Form State
  const [importedQuotationId, setImportedQuotationId] = useState<string | null>(null);
  const [importedQuotationNumber, setImportedQuotationNumber] = useState<string | null>(null);
  const [importedSalesOrderId, setImportedSalesOrderId] = useState<string | null>(null);
  const [importedSalesOrderNumber, setImportedSalesOrderNumber] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [vatRate, setVatRate] = useState(companyVat);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('فاتورة ضريبية إلكترونية مستحقة الدفع.');
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      quantity: 1,
      unitPrice: products[0]?.sellingPrice || 100,
      discount: 0,
      subtotal: products[0]?.sellingPrice || 100,
      vatAmount: ((products[0]?.sellingPrice || 100) * companyVat) / 100,
      total: (products[0]?.sellingPrice || 100) * (1 + companyVat / 100),
    },
  ]);

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentAccountId, setPaymentAccountId] = useState(accounts.find((a) => a.code === '1120')?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentReceipt['paymentMethod']>('bank_transfer');

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Recalculate totals for Create
  const grossSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const itemsDiscountTotal = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const netItemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountTotal = itemsDiscountTotal + (invoiceDiscount || 0);
  const taxableSubtotal = Math.max(0, netItemsSubtotal - (invoiceDiscount || 0));
  const vatTotal = vatRate > 0 ? (taxableSubtotal * vatRate) / 100 : 0;
  const grandTotal = taxableSubtotal + vatTotal;

  // Recalculate totals for Edit
  const editGrossSubtotal = editItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const editItemsDiscountTotal = editItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  const editNetItemsSubtotal = editItems.reduce((sum, item) => sum + item.subtotal, 0);
  const editDiscountTotal = editItemsDiscountTotal + (editInvoiceDiscount || 0);
  const editTaxableSubtotal = Math.max(0, editNetItemsSubtotal - (editInvoiceDiscount || 0));
  const editVatTotal = editVatRate > 0 ? (editTaxableSubtotal * editVatRate) / 100 : 0;
  const editGrandTotal = editTaxableSubtotal + editVatTotal;

  const canEditInvoice = hasPermission('edit_invoices');
  const canDeleteInvoice = hasPermission('delete_invoices');

  const handleOpenEdit = (inv: SalesInvoice) => {
    if (!canEditInvoice) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لتعديل الفواتير. يرجى مراجعة المدير العام أو مسؤول النظام.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setEditInvId(inv.id);
    setEditCustomerId(inv.customerId);
    setEditDate(inv.date);
    setEditDueDate(inv.dueDate);
    setEditNotes(inv.notes || '');
    const currentRate = inv.vatRate !== undefined && inv.vatRate !== null ? inv.vatRate : companyVat;
    setEditVatRate(currentRate);

    // Calculate existing invoice-level discount vs item discounts
    const itemsDisc = inv.items.reduce((s, it) => s + (it.discount || 0), 0);
    const invoiceLevelDisc = Math.max(0, (inv.discountTotal || 0) - itemsDisc);
    setEditInvoiceDiscount(invoiceLevelDisc);

    setEditItems(
      inv.items.map((it) => {
        const disc = it.discount || 0;
        const sub = Math.max(0, it.quantity * it.unitPrice - disc);
        const vat = currentRate > 0 ? (sub * currentRate) / 100 : 0;
        return {
          ...it,
          discount: disc,
          subtotal: sub,
          vatAmount: vat,
          total: sub + vat,
        };
      })
    );
    setShowEditModal(true);
  };

  const handleDelete = (inv: SalesInvoice) => {
    if (!canDeleteInvoice) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لحذف الفواتير. يرجى مراجعة المدير العام.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    const check = canDeleteEntity('invoice', inv.id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف الفاتورة (${inv.invoiceNumber})`,
        message: 'لا يمكن حذف فاتورة المبيعات للأسباب التالية:',
        details: check.reason,
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }

    const linkedQuo = quotations.find(
      (q) =>
        q.convertedToInvoiceId === inv.id ||
        q.convertedToInvoiceNumber === inv.invoiceNumber ||
        q.id === inv.quotationId ||
        (inv.quotationNumber && q.quotationNumber === inv.quotationNumber)
    );
    const linkedOrder = salesOrders.find(
      (so) =>
        so.convertedToInvoiceId === inv.id ||
        so.convertedToInvoiceNumber === inv.invoiceNumber ||
        so.id === inv.salesOrderId ||
        (inv.salesOrderNumber && so.orderNumber === inv.salesOrderNumber)
    );

    if (linkedQuo || linkedOrder) {
      const sourceDesc =
        linkedQuo && linkedOrder
          ? `عرض السعر (${linkedQuo.quotationNumber}) وأمر البيع (${linkedOrder.orderNumber})`
          : linkedQuo
          ? `عرض السعر (${linkedQuo.quotationNumber})`
          : `أمر البيع (${linkedOrder?.orderNumber})`;

      showConfirm({
        title: `⚠️ تنبيه: الفاتورة مرتبطة بحركة سابقة (${inv.invoiceNumber})`,
        type: 'warning',
        message: `هذه الفاتورة تم ترحيلها وإنشاؤها من ${sourceDesc}. هل أنت متأكد من رغبتك في حذف الفاتورة وعكس الحركة؟`,
        details: [
          'سيتم استرجاع كميات الأصناف تلقائياً إلى المخزن.',
          'سيتم تسوية وإلغاء مديونية العميل المترتبة على الفاتورة.',
          `سيتم فك الارتباط تلقائياً وإرجاع حالة ${sourceDesc} إلى الوضع السابق (معتمد / قيد الإجراء) مع إعادة تفعيل أزرار التحويل والإجراءات كاملة.`,
        ].join('\n• '),
        confirmText: 'نعم، احذف الفاتورة وأرجع الحركة',
        cancelText: 'إلغاء الأمر',
        onConfirm: () => {
          deleteSalesInvoice(inv.id);
        },
      });
    } else {
      showConfirm(
        `هل أنت متأكد من حذف الفاتورة رقم ${inv.invoiceNumber}؟ سيتم إلغاء الترحيلات واسترجاع الكميات للمخزن وتسوية رصيد العميل.`,
        () => {
          deleteSalesInvoice(inv.id);
        },
        `تأكيد حذف الفاتورة (${inv.invoiceNumber})`,
        { confirmText: 'حذف الفاتورة', type: 'warning' }
      );
    }
  };

  // Revert / Undo Transaction Handler
  const handleRevertTransaction = (inv: SalesInvoice) => {
    if (!canDeleteInvoice) {
      showAlert({
        title: 'صلاحيات غير كافية للرجوع عن الحركة',
        message: 'عذراً: عملية الرجوع عن الحركة تتطلب صلاحيات إدارة الفواتير وإلغاء القيود المحاسبية.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }

    showConfirm(
      `هل أنت متأكد من الرجوع عن حركة الفاتورة الضريبية رقم (${inv.invoiceNumber}) بقيمة ${formatMoney(inv.grandTotal)}؟\n\n` +
      `⚠️ تنبيه هام حول الأثر المالي والمخزني للرجوع عن الحركة:\n` +
      `1. سيتم استرجاع كامل الكميات المباعة (${inv.items.reduce((s, i) => s + i.quantity, 0)} قطعة) إلى رصيد المخزن.\n` +
      `2. سيتم إلغاء القيود المحاسبية الآلية وقيد تكلفة البضاعة المباعة.\n` +
      `3. سيتم خصم مبلغ الفاتورة من مديونية وحساب العميل (${inv.customerName}).`,
      () => {
        deleteSalesInvoice(inv.id);
        showAlert({
          title: 'تم الرجوع عن الحركة بنجاح',
          message: `تم إلغاء الفاتورة (${inv.invoiceNumber}) وإعادة الأصناف إلى المخزن وتسوية الحسابات.`,
          type: 'success',
          confirmText: 'حسناً',
        });
      },
      `تأكيد الرجوع عن حركة الفاتورة (${inv.invoiceNumber})`,
      'تأكيد الرجوع عن الحركة'
    );
  };

  // Import from Quotation
  const handleImportQuotation = (q: Quotation) => {
    setImportedQuotationId(q.id);
    setImportedQuotationNumber(q.quotationNumber);
    setImportedSalesOrderId(null);
    setImportedSalesOrderNumber(null);
    setCustomerId(q.customerId);
    setNotes(q.notes ? `مستورد من عرض السعر رقم: ${q.quotationNumber}\n${q.notes}` : `مستورد من عرض السعر رقم: ${q.quotationNumber}`);
    setVatRate(q.vatRate ?? companyVat);
    setInvoiceDiscount(q.discountTotal ? Math.max(0, q.discountTotal - q.items.reduce((s, i) => s + (i.discount || 0), 0)) : 0);
    setItems(
      q.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount || 0,
        subtotal: it.subtotal,
        vatAmount: it.vatAmount,
        total: it.total,
      }))
    );
    setShowImportQuotationModal(false);
    setShowCreateModal(true);
    showAlert({
      title: 'تم استرداد بيانات عرض السعر ✨',
      message: `تم تعبئة بيانات العميل (${q.customerName}) والأصناف والأسعار والخصومات من عرض السعر ${q.quotationNumber} بنجاح. سيتم تحديث حالة عرض السعر تلقائياً عند حفظ الفاتورة.`,
      type: 'success',
      confirmText: 'متابعة',
    });
  };

  // Import from Sales Order
  const handleImportSalesOrder = (so: SalesOrder) => {
    setImportedSalesOrderId(so.id);
    setImportedSalesOrderNumber(so.orderNumber);
    setImportedQuotationId(so.quotationId || null);
    setImportedQuotationNumber(so.quotationNumber || null);
    setCustomerId(so.customerId);
    setNotes(so.notes ? `مستورد من أمر البيع رقم: ${so.orderNumber}\n${so.notes}` : `مستورد من أمر البيع رقم: ${so.orderNumber}`);
    setVatRate(so.vatRate ?? companyVat);
    setInvoiceDiscount(so.discountTotal ? Math.max(0, so.discountTotal - so.items.reduce((s, i) => s + (i.discount || 0), 0)) : 0);
    setItems(
      so.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount || 0,
        subtotal: it.subtotal,
        vatAmount: it.vatAmount,
        total: it.total,
      }))
    );
    setShowImportOrderModal(false);
    setShowCreateModal(true);
    showAlert({
      title: 'تم استرداد بيانات أمر البيع ✨',
      message: `تم تعبئة بيانات العميل (${so.customerName}) والأصناف والكميات من أمر البيع ${so.orderNumber} بنجاح. سيتم تحديث حالة أمر البيع إلى مفوتر تلقائياً عند حفظ الفاتورة.`,
      type: 'success',
      confirmText: 'متابعة',
    });
  };

  // Handle Header Sort Click
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filtered and Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return salesInvoices
      .filter((inv) => {
        const matchSearch =
          searchQuery === '' ||
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.notes && inv.notes.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchStatus =
          statusFilter === 'all' ||
          (statusFilter === 'unpaid' && (inv.status === 'unpaid' || inv.status === 'partially_paid')) ||
          (statusFilter === 'paid' && inv.status === 'paid') ||
          (statusFilter === 'overdue' && inv.status === 'overdue');

        const matchDateFrom = !dateFrom || inv.date >= dateFrom;
        const matchDateTo = !dateTo || inv.date <= dateTo;
        const matchCustomer = !customerFilter || inv.customerId === customerFilter;

        return matchSearch && matchStatus && matchDateFrom && matchDateTo && matchCustomer;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'date') {
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
        } else if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        if (sortDirection === 'asc') {
          return valA > valB ? 1 : valA < valB ? -1 : 0;
        } else {
          return valA < valB ? 1 : valA > valB ? -1 : 0;
        }
      });
  }, [salesInvoices, searchQuery, statusFilter, dateFrom, dateTo, customerFilter, sortField, sortDirection]);

  // Quotations available for generating invoices (strictly without any movement / conversion)
  const availableQuotationsForInvoice = useMemo(() => {
    return quotations.filter((quo) => {
      // Exclude if already converted, rejected, or expired
      if (
        quo.status === 'converted_to_invoice' ||
        quo.status === 'converted_to_order' ||
        quo.status === 'rejected' ||
        quo.status === 'expired'
      ) {
        return false;
      }
      if (quo.convertedToInvoiceId || quo.convertedToOrderId) return false;

      const hasLinkedInvoice = salesInvoices.some(
        (inv) =>
          inv.quotationId === quo.id ||
          (quo.quotationNumber && inv.quotationNumber === quo.quotationNumber) ||
          quo.convertedToInvoiceId === inv.id ||
          (quo.convertedToInvoiceNumber && inv.invoiceNumber === quo.convertedToInvoiceNumber)
      );
      if (hasLinkedInvoice) return false;

      const hasLinkedOrder = salesOrders.some(
        (so) =>
          so.quotationId === quo.id ||
          (quo.quotationNumber && so.quotationNumber === quo.quotationNumber) ||
          quo.convertedToOrderId === so.id ||
          (quo.convertedToOrderNumber && so.orderNumber === quo.convertedToOrderNumber)
      );
      if (hasLinkedOrder) return false;

      return true;
    });
  }, [quotations, salesInvoices, salesOrders]);

  // Sales Orders available for generating invoices (strictly without any movement / already invoiced)
  const availableSalesOrdersForInvoice = useMemo(() => {
    return salesOrders.filter((so) => {
      // Exclude if invoiced or cancelled
      if (so.status === 'invoiced' || so.status === 'cancelled') {
        return false;
      }
      if (so.invoiceId || so.convertedToInvoiceId) return false;

      const hasLinkedInvoice = salesInvoices.some(
        (inv) =>
          inv.salesOrderId === so.id ||
          (so.orderNumber && inv.salesOrderNumber === so.orderNumber) ||
          so.invoiceId === inv.id ||
          so.convertedToInvoiceId === inv.id ||
          (so.invoiceNumber && inv.invoiceNumber === so.invoiceNumber) ||
          (so.convertedToInvoiceNumber && inv.invoiceNumber === so.convertedToInvoiceNumber)
      );
      if (hasLinkedInvoice) return false;

      return true;
    });
  }, [salesOrders, salesInvoices]);

  const handleAddItemRow = () => {
    const defaultProd = products[0];
    if (!defaultProd) return;
    const baseSubtotal = defaultProd.sellingPrice;
    const vat = (baseSubtotal * vatRate) / 100;
    setItems([
      ...items,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        quantity: 1,
        unitPrice: defaultProd.sellingPrice,
        discount: 0,
        subtotal: baseSubtotal,
        vatAmount: vat,
        total: baseSubtotal + vat,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const newItems = [...items];
    const qty = newItems[index]?.quantity || 1;
    const disc = newItems[index]?.discount || 0;
    const price = prod.sellingPrice;
    const itemSub = Math.max(0, qty * price - disc);
    const vat = (itemSub * vatRate) / 100;

    newItems[index] = {
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unitPrice: price,
      discount: disc,
      subtotal: itemSub,
      vatAmount: vat,
      total: itemSub + vat,
    };
    setItems(newItems);
  };

  const handleItemValueChange = (
    index: number,
    field: 'quantity' | 'unitPrice' | 'discount',
    value: number
  ) => {
    const newItems = [...items];
    const current = newItems[index];
    if (!current) return;

    const qty = field === 'quantity' ? Math.max(1, value) : current.quantity;
    const price = field === 'unitPrice' ? Math.max(0, value) : current.unitPrice;
    const disc = field === 'discount' ? Math.max(0, value) : (current.discount || 0);

    const itemSub = Math.max(0, qty * price - disc);
    const vat = (itemSub * vatRate) / 100;

    newItems[index] = {
      ...current,
      quantity: qty,
      unitPrice: price,
      discount: disc,
      subtotal: itemSub,
      vatAmount: vat,
      total: itemSub + vat,
    };
    setItems(newItems);
  };

  // Edit item handlers
  const handleAddEditItemRow = () => {
    const defaultProd = products[0];
    if (!defaultProd) return;
    const baseSub = defaultProd.sellingPrice;
    const vat = (baseSub * editVatRate) / 100;
    setEditItems([
      ...editItems,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        quantity: 1,
        unitPrice: defaultProd.sellingPrice,
        discount: 0,
        subtotal: baseSub,
        vatAmount: vat,
        total: baseSub + vat,
      },
    ]);
  };

  const handleRemoveEditItemRow = (index: number) => {
    if (editItems.length <= 1) return;
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleEditProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const newIt = [...editItems];
    const qty = newIt[index]?.quantity || 1;
    const disc = newIt[index]?.discount || 0;
    const price = prod.sellingPrice;
    const sub = Math.max(0, qty * price - disc);
    const vat = (sub * editVatRate) / 100;

    newIt[index] = {
      productId: prod.id,
      productName: prod.name,
      quantity: qty,
      unitPrice: price,
      discount: disc,
      subtotal: sub,
      vatAmount: vat,
      total: sub + vat,
    };
    setEditItems(newIt);
  };

  const handleEditItemValueChange = (
    index: number,
    field: 'quantity' | 'unitPrice' | 'discount',
    value: number
  ) => {
    const newIt = [...editItems];
    const current = newIt[index];
    if (!current) return;

    const qty = field === 'quantity' ? Math.max(1, value) : current.quantity;
    const price = field === 'unitPrice' ? Math.max(0, value) : current.unitPrice;
    const disc = field === 'discount' ? Math.max(0, value) : (current.discount || 0);

    const sub = Math.max(0, qty * price - disc);
    const vat = (sub * editVatRate) / 100;

    newIt[index] = {
      ...current,
      quantity: qty,
      unitPrice: price,
      discount: disc,
      subtotal: sub,
      vatAmount: vat,
      total: sub + vat,
    };
    setEditItems(newIt);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      showAlert({
        title: 'تحديد العميل',
        message: 'يرجى اختيار العميل أولاً لإصدار الفاتورة باسمه.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    addSalesInvoice({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerTaxNumber: selectedCustomer.taxNumber,
      date: invoiceDate,
      dueDate,
      items,
      subtotal: taxableSubtotal,
      discountTotal,
      vatRate,
      vatTotal,
      grandTotal,
      notes,
      quotationId: importedQuotationId || undefined,
      quotationNumber: importedQuotationNumber || undefined,
      salesOrderId: importedSalesOrderId || undefined,
      salesOrderNumber: importedSalesOrderNumber || undefined,
    });

    setImportedQuotationId(null);
    setImportedQuotationNumber(null);
    setImportedSalesOrderId(null);
    setImportedSalesOrderNumber(null);
    setInvoiceDiscount(0);
    setShowCreateModal(false);
  };

  const handleSettlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || paymentAmount <= 0) return;
    if (paymentAmount > selectedInvoice.remainingAmount) {
      showAlert({
        title: 'مبلغ السداد غير صحيح',
        message: 'مبلغ السداد لا يمكن أن يتجاوز المتبقي من الفاتورة!',
        details: `المتبقي المستحق: ${formatMoney(selectedInvoice.remainingAmount)} | المبلغ المدخل: ${formatMoney(paymentAmount)}`,
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }

    recordInvoicePayment(selectedInvoice.id, paymentAmount, paymentAccountId, paymentMethod);
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-6">
      {activeSubTab === 'quotes' ? (
        <QuotationsView
          onNavigateToOrders={() => setActiveSubTab('orders')}
          onNavigateToInvoices={() => setActiveSubTab('invoices')}
        />
      ) : activeSubTab === 'orders' ? (
        <SalesOrdersView
          onNavigateToInvoices={() => setActiveSubTab('invoices')}
          onNavigateToQuotations={() => setActiveSubTab('quotes')}
        />
      ) : activeSubTab === 'returns' ? (
        <SalesReturnsView />
      ) : (
        <>
          {/* Header & Quick Action Buttons */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                المبيعات والفواتير الضريبية الإلكترونية (ZATCA)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                إصدار فواتير ضريبية مفصلة مع الرمز المشفر QR، وحساب ضريبة القيمة المضافة ({companyProfile.defaultVatRate}%)، وإمكانية الاستيراد من عروض الأسعار وأوامر البيع
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Import from Quotation Button */}
              {quotations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowImportQuotationModal(true)}
                  className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
                  title="استرداد بيانات الفاتورة من عرض سعر معتمد"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  استرداد من عرض سعر
                </button>
              )}

              {/* Import from Sales Order Button */}
              {salesOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowImportOrderModal(true)}
                  className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-2xs cursor-pointer"
                  title="استرداد بيانات الفاتورة من أمر بيع"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                  استرداد من أمر بيع
                </button>
              )}

              <button
                id="new-sales-invoice-btn"
                onClick={() => {
                  setImportedQuotationId(null);
                  setImportedQuotationNumber(null);
                  setImportedSalesOrderId(null);
                  setImportedSalesOrderNumber(null);
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                إصدار فاتورة ضريبية جديدة
              </button>
            </div>
          </div>

          {/* Filter, Search & Date Range Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="البحث برقم الفاتورة، اسم العميل، أو الملاحظات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pr-9 pl-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Quick Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  جميع الفواتير ({salesInvoices.length})
                </button>
                <button
                  onClick={() => setStatusFilter('unpaid')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'unpaid' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  غير مسددة
                </button>
                <button
                  onClick={() => setStatusFilter('paid')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  مسددة بالكامل
                </button>
                <button
                  onClick={() => setStatusFilter('overdue')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'overdue' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  متأخرة
                </button>
              </div>
            </div>

            {/* Advanced Filters: Date Range + Customer Filter */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-600">الفترة: من</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                />
                <span className="font-semibold text-slate-600">إلى</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-600">تصفية العميل:</span>
                <select
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium"
                >
                  <option value="">جميع العملاء</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {(dateFrom || dateTo || customerFilter || searchQuery || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setCustomerFilter('');
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  إعادة ضبط الفلاتر
                </button>
              )}

              <div className="mr-auto text-[11px] text-slate-400 font-medium">
                تم العثور على {filteredInvoices.length} من أصل {salesInvoices.length} فاتورة
              </div>
            </div>
          </div>

          {/* Invoices List with Sortable Headers & Undo Column */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
                    <th
                      onClick={() => handleSort('invoiceNumber')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>رقم الفاتورة</span>
                        {sortField === 'invoiceNumber' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('customerName')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>العميل</span>
                        {sortField === 'customerName' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('date')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>تاريخ الإصدار</span>
                        {sortField === 'date' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4">تاريخ الاستحقاق</th>
                    <th className="py-3 px-4">المبلغ قبل الضريبة</th>
                    <th className="py-3 px-4">ضريبة {companyProfile.defaultVatRate}%</th>
                    <th
                      onClick={() => handleSort('grandTotal')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>الإجمالي شامل الضريبة</span>
                        {sortField === 'grandTotal' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('remainingAmount')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>المتبقي للتحصيل</span>
                        {sortField === 'remainingAmount' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>حالة السداد</span>
                        {sortField === 'status' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">إجراءات الفاتورة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        لا توجد فواتير مطابقة للبحث أو التصفية الحالية
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          <div>{inv.invoiceNumber}</div>
                          {inv.notes && inv.notes.includes('عرض السعر') && (
                            <span className="inline-block mt-0.5 text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-sans">
                              من عرض سعر
                            </span>
                          )}
                          {inv.notes && inv.notes.includes('أمر البيع') && (
                            <span className="inline-block mt-0.5 text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-sans">
                              من أمر بيع
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{inv.customerName}</div>
                          {inv.customerTaxNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">الرقم الضريبي: {inv.customerTaxNumber}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{inv.date}</td>
                        <td className="py-3 px-4 text-slate-600">{inv.dueDate}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {formatMoney(inv.subtotal)}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {formatMoney(inv.vatTotal)}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">
                          {formatMoney(inv.grandTotal)}
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-700">
                          {inv.remainingAmount > 0 ? formatMoney(inv.remainingAmount) : 'مسدد'}
                        </td>
                        <td className="py-3 px-4">
                          {inv.status === 'paid' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] px-2 py-0.5 rounded-md font-bold">
                              مسددة بالكامل
                            </span>
                          ) : inv.status === 'partially_paid' ? (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] px-2 py-0.5 rounded-md font-bold">
                              سداد جزئي
                            </span>
                          ) : inv.status === 'overdue' ? (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] px-2 py-0.5 rounded-md font-bold">
                              متأخرة السداد
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] px-2 py-0.5 rounded-md font-bold">
                              غير مسددة
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setShowPrintModal(true);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="معاينة وطباعة الفاتورة الضريبية"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {inv.remainingAmount > 0 && (
                              <button
                                onClick={() => {
                                setSelectedInvoice(inv);
                                setPaymentAmount(inv.remainingAmount);
                                setShowPaymentModal(true);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg border border-emerald-200 text-[11px] transition-colors cursor-pointer"
                              title="تحصيل دفعة أو سداد كامل"
                            >
                              تحصيل
                            </button>
                          )}

                          {/* Statement Button */}
                          <button
                            onClick={() => setStatementCustomerId(inv.customerId)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 p-1.5 rounded-lg border border-purple-200 transition-colors cursor-pointer"
                            title="كشف حساب تفصيلي للعميل"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            disabled={!canEditInvoice}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              canEditInvoice
                                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            }`}
                            title={canEditInvoice ? 'تعديل الفاتورة' : 'ليس لديك صلاحية تعديل الفواتير'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(inv)}
                            disabled={!canDeleteInvoice}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              canDeleteInvoice
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            }`}
                            title={canDeleteInvoice ? 'حذف الفاتورة' : 'ليس لديك صلاحية حذف الفواتير'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </>
    )}

      {/* Modal: Import from Quotation */}
      {showImportQuotationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  استيراد بيانات من عرض سعر معتمد
                </h3>
                <p className="text-xs text-slate-500">اختر عرض السعر لتوليد فاتورة مبيعات بنفس الأصناف والأسعار والخصومات</p>
              </div>
              <button
                onClick={() => setShowImportQuotationModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {availableQuotationsForInvoice.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <p className="font-bold text-slate-600 text-sm">لا توجد عروض أسعار متاحة للتوليد حالياً</p>
                  <p className="text-xs text-slate-400 mt-1">جميع عروض الأسعار المسجلة تم ترحيلها إلى فواتير / أوامر بيع بالفعل أو مرتبطة بحركات.</p>
                </div>
              ) : (
                availableQuotationsForInvoice.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{q.quotationNumber}</span>
                        <span className="font-bold text-slate-800">{q.customerName}</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {q.items.length} بنود
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-3">
                        <span>التاريخ: {q.date}</span>
                        <span>الصلاحية حتى: {q.validUntil}</span>
                      </div>
                    </div>

                    <div className="text-left flex items-center gap-3">
                      <div className="font-extrabold text-sm text-slate-900">
                        {formatMoney(q.grandTotal)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImportQuotation(q)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                      >
                        استيراد وتوليد فاتورة
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Import from Sales Order */}
      {showImportOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                  استيراد بيانات من أمر بيع وتوريد
                </h3>
                <p className="text-xs text-slate-500">اختر أمر البيع لتوليد فاتورة ضريبية رسمية للعميل</p>
              </div>
              <button
                onClick={() => setShowImportOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {availableSalesOrdersForInvoice.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  <p className="font-bold text-slate-600 text-sm">لا توجد أوامر بيع متاحة للتوليد حالياً</p>
                  <p className="text-xs text-slate-400 mt-1">جميع أوامر البيع المسجلة تم إصدار فواتير لها بالفعل أو مرتبطة بحركات.</p>
                </div>
              ) : (
                availableSalesOrdersForInvoice.map((so) => (
                  <div
                    key={so.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{so.orderNumber}</span>
                        <span className="font-bold text-slate-800">{so.customerName}</span>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {so.items.length} بنود
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-3">
                        <span>تاريخ الأمر: {so.date}</span>
                        <span>تاريخ التسليم: {so.deliveryDate}</span>
                      </div>
                    </div>

                    <div className="text-left flex items-center gap-3">
                      <div className="font-extrabold text-sm text-slate-900">
                        {formatMoney(so.grandTotal)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImportSalesOrder(so)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                      >
                        استيراد وتوليد فاتورة
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Create New Tax Invoice */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">إنشاء فاتورة مبيعات ضريبية إلكترونية</h3>
                <p className="text-xs text-slate-500">متوافقة مع متطلبات الفاتورة الإلكترونية وهيئة الزكاة والضريبة والجمارك</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              {/* Linked Source Document Banner */}
              {(importedQuotationNumber || importedSalesOrderNumber) && (
                <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>الفاتورة مستوردة ومرتبطة بـ:</span>
                        <span className="font-mono bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md font-extrabold">
                          {importedSalesOrderNumber
                            ? `أمر البيع (${importedSalesOrderNumber})`
                            : `عرض السعر (${importedQuotationNumber})`}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        سيتم تحديث الحالة وإغلاق المستند الأصلي تلقائياً عند الاعتماد، وسيتم عكس الحركة وإعادة الإتاحة تلقائياً في حال حذف الفاتورة.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setImportedQuotationId(null);
                      setImportedQuotationNumber(null);
                      setImportedSalesOrderId(null);
                      setImportedSalesOrderNumber(null);
                    }}
                    className="shrink-0 text-amber-800 hover:text-rose-700 text-xs font-bold px-3 py-1.5 bg-amber-100 hover:bg-rose-50 border border-amber-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                    title="فك الارتباط وإصدارها كفاتورة مباشرة مستقلة"
                  >
                    فك الارتباط (فاتورة مستقلة)
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">العميل المستفيد</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ تحرير الفاتورة</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-amber-800 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>خصم إضافي على الفاتورة</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={invoiceDiscount || ''}
                    onChange={(e) => setInvoiceDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full p-2 rounded-xl border border-amber-300 bg-amber-50/50 font-bold text-amber-900 text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نسبة الضريبة (VAT)</label>
                  <select
                    value={vatRate}
                    onChange={(e) => {
                      const newRate = parseFloat(e.target.value) || 0;
                      setVatRate(newRate);
                      setItems((prev) =>
                        prev.map((it) => {
                          const disc = it.discount || 0;
                          const sub = Math.max(0, it.quantity * it.unitPrice - disc);
                          const vat = newRate > 0 ? (sub * newRate) / 100 : 0;
                          return { ...it, subtotal: sub, vatAmount: vat, total: sub + vat };
                        })
                      );
                    }}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  >
                    <option value={companyVat}>{companyVat}% (الافتراضي للشركة)</option>
                    {companyVat !== 15 && <option value="15">15% (السعودية ZATCA)</option>}
                    {companyVat !== 14 && <option value="14">14% (مصر - قيمة مضافة)</option>}
                    {companyVat !== 5 && <option value="5">5% (الإمارات / عمان)</option>}
                    <option value="0">0% (معفى من الضريبة)</option>
                  </select>
                </div>
              </div>

              {/* Items Section (Single Horizontal Row Layout) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 text-sm">بنود وأصناف الفاتورة</span>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {items.length} {items.length === 1 ? 'بند' : 'بنود'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200 text-xs shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + إضافة بند
                  </button>
                </div>

                {/* Table Column Headers on Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100/90 rounded-xl text-[11px] font-bold text-slate-600">
                  <div className="col-span-4">الصنف والمنتج</div>
                  <div className="col-span-2 text-center">الكمية (يدعم 5*10)</div>
                  <div className="col-span-2 text-center">سعر الوحدة</div>
                  <div className="col-span-2 text-center">خصم الصنف</div>
                  <div className="col-span-2 text-center">الإجمالي</div>
                </div>

                {/* Single Row Item Cards */}
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 sm:p-2 rounded-xl bg-white border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2 items-center hover:border-slate-300 transition-colors"
                    >
                      {/* Product Selector in single row */}
                      <div className="sm:col-span-4">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">
                          بند #{idx + 1}: الصنف والمنتج
                        </label>
                        <ProductSelectSearch
                          selectedProductId={item.productId}
                          onSelectProduct={(prod) => handleProductChange(idx, prod.id)}
                        />
                      </div>

                      {/* Quantity with Math calculator */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">الكمية</label>
                        <MathQuantityInput
                          value={item.quantity}
                          onChange={(newQty) => handleItemValueChange(idx, 'quantity', newQty)}
                          min={1}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">سعر الوحدة</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemValueChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
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
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.discount || ''}
                          onChange={(e) => handleItemValueChange(idx, 'discount', Number(e.target.value))}
                          className="w-full p-2 text-xs rounded-xl border border-amber-300 bg-amber-50/50 font-bold text-center text-amber-900"
                        />
                      </div>

                      {/* Item Total & Delete on Single Line */}
                      <div className="sm:col-span-2 flex items-center justify-between gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex-1 text-center font-extrabold text-xs text-emerald-700 font-mono py-1">
                          {formatMoney(item.total)}
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
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
                  onClick={handleAddItemRow}
                  className="w-full py-2.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>+ إضافة بند جديد للفاتورة</span>
                </button>
              </div>

              {/* Invoice Summary Box */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 shadow-xs border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>إجمالي الأصناف قبل الخصم:</span>
                  <span className="font-semibold text-white">{formatMoney(grossSubtotal)}</span>
                </div>
                {itemsDiscountTotal > 0 && (
                  <div className="flex justify-between text-xs text-amber-300">
                    <span>خصومات الأصناف:</span>
                    <span className="font-bold text-amber-300">-{formatMoney(itemsDiscountTotal)}</span>
                  </div>
                )}
                {invoiceDiscount > 0 && (
                  <div className="flex justify-between text-xs text-amber-300">
                    <span>خصم إضافي على الفاتورة:</span>
                    <span className="font-bold text-amber-300">-{formatMoney(invoiceDiscount)}</span>
                  </div>
                )}
                {discountTotal > 0 && (
                  <div className="flex justify-between text-xs text-amber-200 border-t border-slate-800 pt-1 font-bold">
                    <span>إجمالي الخصومات:</span>
                    <span>-{formatMoney(discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-300">
                  <span>المجموع بعد الخصم (الخاضع للضريبة):</span>
                  <span className="font-bold text-white">{formatMoney(taxableSubtotal)}</span>
                </div>
                {vatRate > 0 ? (
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>ضريبة القيمة المضافة ({vatRate}% VAT):</span>
                    <span className="font-bold text-emerald-400">+{formatMoney(vatTotal)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>ضريبة القيمة المضافة:</span>
                    <span className="font-bold text-slate-400">0% (معفى)</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700/80 pt-2 mt-1">
                  <span>المبلغ الإجمالي النهائي المستحق:</span>
                  <span className="text-emerald-400 text-base font-black">{formatMoney(grandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">شروط الدفع والملاحظات</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  اعتماد الفاتورة والترحيل للدفاتر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1.5: Edit Existing Tax Invoice */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  تعديل بيانات وبنود الفاتورة
                </h3>
                <p className="text-xs text-slate-500">تعديل الفاتورة وإعادة احتساب الأرصدة والقيود المحاسبية</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cust = customers.find((c) => c.id === editCustomerId);
                if (!cust) return;
                editSalesInvoice(editInvId, {
                  customerId: cust.id,
                  customerName: cust.name,
                  customerTaxNumber: cust.taxNumber,
                  date: editDate,
                  dueDate: editDueDate,
                  items: editItems,
                  subtotal: editTaxableSubtotal,
                  discountTotal: editDiscountTotal,
                  vatRate: editVatRate,
                  vatTotal: editVatTotal,
                  grandTotal: editGrandTotal,
                  notes: editNotes,
                });
                setShowEditModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="sm:col-span-1">
                  <label className="block font-semibold text-slate-700 mb-1">العميل المستفيد</label>
                  <select
                    value={editCustomerId}
                    onChange={(e) => setEditCustomerId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الإصدار</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-amber-800 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>خصم إضافي على الفاتورة</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={editInvoiceDiscount || ''}
                    onChange={(e) => setEditInvoiceDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full p-2 rounded-xl border border-amber-300 bg-amber-50/50 font-bold text-amber-900 text-center"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نسبة الضريبة (VAT)</label>
                  <select
                    value={editVatRate}
                    onChange={(e) => {
                      const newRate = parseFloat(e.target.value) || 0;
                      setEditVatRate(newRate);
                      setEditItems((prev) =>
                        prev.map((it) => {
                          const disc = it.discount || 0;
                          const sub = Math.max(0, it.quantity * it.unitPrice - disc);
                          const vat = newRate > 0 ? (sub * newRate) / 100 : 0;
                          return { ...it, subtotal: sub, vatAmount: vat, total: sub + vat };
                        })
                      );
                    }}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  >
                    <option value={companyVat}>{companyVat}% (الافتراضي للشركة)</option>
                    {companyVat !== 15 && <option value="15">15% (السعودية ZATCA)</option>}
                    {companyVat !== 14 && <option value="14">14% (مصر - قيمة مضافة)</option>}
                    {companyVat !== 5 && <option value="5">5% (الإمارات / عمان)</option>}
                    <option value="0">0% (معفى من الضريبة)</option>
                  </select>
                </div>
              </div>

              {/* Edit Items Section (Single Horizontal Row Layout) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm">بنود وأصناف الفاتورة</span>
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {editItems.length} {editItems.length === 1 ? 'بند' : 'بنود'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEditItemRow}
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
                  <div className="col-span-2 text-center">سعر الوحدة</div>
                  <div className="col-span-2 text-center">خصم الصنف</div>
                  <div className="col-span-2 text-center">الإجمالي</div>
                </div>

                {/* Single Row Item Cards */}
                <div className="space-y-2">
                  {editItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 sm:p-2 rounded-xl bg-white border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2 items-center hover:border-slate-300 transition-colors"
                    >
                      {/* Product Selector in single row */}
                      <div className="sm:col-span-4">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">
                          بند #{idx + 1}: الصنف والمنتج
                        </label>
                        <ProductSelectSearch
                          selectedProductId={item.productId}
                          onSelectProduct={(prod) => handleEditProductChange(idx, prod.id)}
                        />
                      </div>

                      {/* Quantity with Math calculator */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">الكمية</label>
                        <MathQuantityInput
                          value={item.quantity}
                          onChange={(newQty) => handleEditItemValueChange(idx, 'quantity', newQty)}
                          min={1}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">سعر الوحدة</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleEditItemValueChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
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
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.discount || ''}
                          onChange={(e) => handleEditItemValueChange(idx, 'discount', Number(e.target.value))}
                          className="w-full p-2 text-xs rounded-xl border border-amber-300 bg-amber-50/50 font-bold text-center text-amber-900"
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
                            onClick={() => handleRemoveEditItemRow(idx)}
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
                  onClick={handleAddEditItemRow}
                  className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50 text-blue-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>+ إضافة بند جديد للفاتورة</span>
                </button>
              </div>

              {/* Summary */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 shadow-xs border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>إجمالي الأصناف قبل الخصم:</span>
                  <span className="font-semibold text-white">{formatMoney(editGrossSubtotal)}</span>
                </div>
                {editItemsDiscountTotal > 0 && (
                  <div className="flex justify-between text-xs text-amber-300">
                    <span>خصومات الأصناف:</span>
                    <span className="font-bold text-amber-300">-{formatMoney(editItemsDiscountTotal)}</span>
                  </div>
                )}
                {editInvoiceDiscount > 0 && (
                  <div className="flex justify-between text-xs text-amber-300">
                    <span>خصم إضافي على الفاتورة:</span>
                    <span className="font-bold text-amber-300">-{formatMoney(editInvoiceDiscount)}</span>
                  </div>
                )}
                {editDiscountTotal > 0 && (
                  <div className="flex justify-between text-xs text-amber-200 border-t border-slate-800 pt-1 font-bold">
                    <span>إجمالي الخصومات:</span>
                    <span>-{formatMoney(editDiscountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-300">
                  <span>المجموع بعد الخصم (الخاضع للضريبة):</span>
                  <span className="font-bold text-white">{formatMoney(editTaxableSubtotal)}</span>
                </div>
                {editVatRate > 0 ? (
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>ضريبة القيمة المضافة ({editVatRate}%):</span>
                    <span className="font-bold text-emerald-400">+{formatMoney(editVatTotal)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>ضريبة القيمة المضافة:</span>
                    <span className="font-bold text-slate-400">0% (معفى)</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700/80 pt-2 mt-1">
                  <span>المبلغ الإجمالي الجديد:</span>
                  <span className="text-emerald-400 text-base font-black">{formatMoney(editGrandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات الفاتورة</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  حفظ التعديلات وتحديث القيود
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Official Printable Invoice Preview */}
      {showPrintModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto text-slate-900">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">معاينة الفاتورة الضريبية</span>
                <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-md font-bold">
                  جاهزة للطباعة
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  طباعة الفاتورة
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl border border-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official Invoice Sheet */}
            <div className="border border-slate-300 p-6 rounded-xl space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">{companyProfile.nameAr}</h1>
                  {companyProfile.address && <p className="text-xs text-slate-500 mt-0.5">{companyProfile.address} {companyProfile.phone ? `| هاتف: ${companyProfile.phone}` : ''}</p>}
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                    {companyProfile.taxNumber ? `الرقم الضريبي للمنشأة: ${companyProfile.taxNumber}` : ''} {companyProfile.commercialRegister ? `| س.ت: ${companyProfile.commercialRegister}` : ''}
                  </p>
                </div>
                <div className="text-left">
                  {((selectedInvoice.vatRate && selectedInvoice.vatRate > 0) || (selectedInvoice.vatTotal && selectedInvoice.vatTotal > 0)) ? (
                    <div className="inline-block bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-md mb-1">
                      فاتورة ضريبية TAX INVOICE
                    </div>
                  ) : (
                    <div className="inline-block bg-emerald-800 text-white text-xs font-bold px-3 py-1 rounded-md mb-1">
                      فاتورة مبيعات SALES INVOICE
                    </div>
                  )}
                  <div className="font-mono font-extrabold text-sm text-slate-900">
                    {selectedInvoice.invoiceNumber}
                  </div>
                </div>
              </div>

              {/* Customer & Invoice Meta Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">بيانات العميل (المشتري):</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoice.customerName}</div>
                  {selectedInvoice.customerTaxNumber && (
                    <div className="font-mono text-slate-600 mt-0.5">الرقم الضريبي: {selectedInvoice.customerTaxNumber}</div>
                  )}
                </div>
                <div className="space-y-1 text-left">
                  <div>
                    <span className="text-slate-500">تاريخ الإصدار: </span>
                    <span className="font-bold">{selectedInvoice.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">تاريخ الاستحقاق: </span>
                    <span className="font-bold">{selectedInvoice.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              {(() => {
                const isVatZero = (selectedInvoice.vatRate === 0 || selectedInvoice.vatRate === undefined || selectedInvoice.vatRate === null) && (!selectedInvoice.vatTotal || selectedInvoice.vatTotal === 0);
                const itemsGrossTotal = selectedInvoice.items.reduce((s, it) => s + (it.quantity * it.unitPrice), 0);

                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs border border-slate-200">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          {isVatZero ? (
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">الصنف / الوصف</th>
                              <th className="py-2.5 px-3 text-center">الكمية</th>
                              <th className="py-2.5 px-3">سعر الوحدة</th>
                              <th className="py-2.5 px-3">الخصم</th>
                              <th className="py-2.5 px-3">بعد الخصم</th>
                              <th className="py-2.5 px-3 font-bold">المجموع</th>
                            </tr>
                          ) : (
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">الصنف / الوصف</th>
                              <th className="py-2.5 px-3 text-center">الكمية</th>
                              <th className="py-2.5 px-3">سعر الوحدة</th>
                              <th className="py-2.5 px-3">الخصم</th>
                              <th className="py-2.5 px-3">المجموع قبل الضريبة</th>
                              <th className="py-2.5 px-3 text-center">نسبة الضريبة</th>
                              <th className="py-2.5 px-3">مبلغ الضريبة</th>
                              <th className="py-2.5 px-3 font-bold">المجموع شامل الضريبة</th>
                            </tr>
                          )}
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedInvoice.items.map((it, idx) => {
                            const lineGross = it.quantity * it.unitPrice;
                            const lineDisc = it.discount || 0;
                            const lineNet = Math.max(0, lineGross - lineDisc);

                            return isVatZero ? (
                              <tr key={idx}>
                                <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{it.productName}</td>
                                <td className="py-2.5 px-3 text-center font-bold">{it.quantity}</td>
                                <td className="py-2.5 px-3 font-mono">{formatMoney(it.unitPrice)}</td>
                                <td className="py-2.5 px-3 font-mono text-amber-700">
                                  {lineDisc > 0 ? `-${formatMoney(lineDisc)}` : '0.00'}
                                </td>
                                <td className="py-2.5 px-3 font-mono">{formatMoney(lineNet)}</td>
                                <td className="py-2.5 px-3 font-mono font-extrabold text-slate-900">{formatMoney(lineNet)}</td>
                              </tr>
                            ) : (
                              <tr key={idx}>
                                <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900">{it.productName}</td>
                                <td className="py-2.5 px-3 text-center font-bold">{it.quantity}</td>
                                <td className="py-2.5 px-3 font-mono">{formatMoney(it.unitPrice)}</td>
                                <td className="py-2.5 px-3 font-mono text-amber-700">
                                  {lineDisc > 0 ? `-${formatMoney(lineDisc)}` : '0.00'}
                                </td>
                                <td className="py-2.5 px-3 font-mono">{formatMoney(it.subtotal)}</td>
                                <td className="py-2.5 px-3 text-center font-mono">{selectedInvoice.vatRate ?? companyProfile.defaultVatRate}%</td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">{formatMoney(it.vatAmount)}</td>
                                <td className="py-2.5 px-3 font-mono font-extrabold text-slate-900">{formatMoney(it.total)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary & QR Code */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      {/* Simulated ZATCA QR Code */}
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="w-16 h-16 bg-white border border-slate-300 p-1 flex items-center justify-center rounded-lg">
                          <QrCode className="w-14 h-14 text-slate-800" />
                        </div>
                        <div className="text-[11px] text-slate-600 max-w-[200px]">
                          <span className="font-bold block text-slate-900">رمز الاستجابة السريع ZATCA</span>
                          مشفر وفق اشتراطات الفوترة الإلكترونية المرحلة الثانية
                        </div>
                      </div>

                      {/* Calculation Breakdown */}
                      <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>إجمالي الأصناف قبل الخصم:</span>
                          <span className="font-bold">{formatMoney(itemsGrossTotal)}</span>
                        </div>
                        {selectedInvoice.discountTotal > 0 && (
                          <div className="flex justify-between text-amber-700 font-bold">
                            <span>إجمالي الخصم:</span>
                            <span>-{formatMoney(selectedInvoice.discountTotal)}</span>
                          </div>
                        )}
                        {selectedInvoice.discountTotal > 0 && !isVatZero && (
                          <div className="flex justify-between text-slate-600">
                            <span>المجموع بعد الخصم (قبل الضريبة):</span>
                            <span className="font-bold">{formatMoney(selectedInvoice.subtotal)}</span>
                          </div>
                        )}
                        {!isVatZero && (
                          <div className="flex justify-between text-slate-600">
                            <span>ضريبة القيمة المضافة ({selectedInvoice.vatRate ?? companyProfile.defaultVatRate}%):</span>
                            <span className="font-bold text-emerald-700">+{formatMoney(selectedInvoice.vatTotal)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-300 pt-2">
                          <span>إجمالي الفاتورة المستحق:</span>
                          <span className="text-emerald-700 font-black text-base">{formatMoney(selectedInvoice.grandTotal)}</span>
                        </div>
                        {selectedInvoice.paidAmount > 0 && (
                          <div className="flex justify-between text-xs text-slate-600 border-t border-slate-200 pt-1.5">
                            <span>المدفوع:</span>
                            <span className="font-bold text-emerald-700">{formatMoney(selectedInvoice.paidAmount)}</span>
                          </div>
                        )}
                        {selectedInvoice.remainingAmount > 0 && (
                          <div className="flex justify-between text-xs font-bold text-rose-600">
                            <span>المتبقي:</span>
                            <span>{formatMoney(selectedInvoice.remainingAmount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* Notes */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-700">ملاحظات: </span>
                {selectedInvoice.notes || 'سداد الفاتورة خلال المدة المحددة.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Record Payment / Collection */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">سند قبض وتحصيل مستحقات</h3>
                <p className="text-xs text-slate-500">فاتورة: {selectedInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-600">المتبقي على العميل:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {formatMoney(selectedInvoice.remainingAmount)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المبلغ المحصل</label>
                <input
                  type="number"
                  min="1"
                  max={selectedInvoice.remainingAmount}
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold text-base text-emerald-700 text-center"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">طريقة السداد</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentReceipt['paymentMethod'])}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium"
                >
                  <option value="bank_transfer">تحويل بنكي (Bank Transfer)</option>
                  <option value="cash">نقداً بالصندوق (Cash)</option>
                  <option value="cheque">شيك مصرفي (Cheque)</option>
                  <option value="card">بطاقة مدى / ائتمان (POS/Card)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الحساب المستلم (الخزينة أو البنك)</label>
                <select
                  value={paymentAccountId}
                  onChange={(e) => setPaymentAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                >
                  {accounts
                    .filter((a) => (a.code === '1110' || a.code === '1120') && !a.isHeader)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs"
                >
                  تأكيد سند القبض والترحيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Customer Statement Modal */}
      {statementCustomerId && (
        <CustomerStatementModal
          customerId={statementCustomerId}
          onClose={() => setStatementCustomerId(null)}
        />
      )}
    </div>
  );
};
