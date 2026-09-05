import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import { PaymentReceipt, PurchaseInvoice, Vendor } from '../types';
import { ProductSelectSearch } from './ProductSelectSearch';
import { MathQuantityInput } from './MathQuantityInput';
import { PrintPreviewModal } from './PrintPreviewModal';
import { PrintHeader } from './PrintHeader';
import { PrintFooter } from './PrintFooter';
import { SearchableSelect } from './SearchableSelect';
import { QuickAddModal } from './QuickAddModal';
import { PurchaseOrdersSection } from './purchases/PurchaseOrdersSection';
import { GoodsReceiptsSection } from './purchases/GoodsReceiptsSection';
import { LandedCostSection } from './purchases/LandedCostSection';
import { PurchaseReturnsSection } from './purchases/PurchaseReturnsSection';
import { VendorAgingSection } from './purchases/VendorAgingSection';
import { PurchaseOrder } from '../types';
import {
  ShoppingCart,
  PlusCircle,
  Search,
  Building,
  Building2,
  CreditCard,
  X,
  Package,
  Edit3,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Filter,
  RefreshCw,
  Undo2,
  FileSpreadsheet,
  Printer,
  FileCheck2,
  PackageCheck,
  Ship,
  RotateCcw,
  Clock,
} from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const {
    vendors = [],
    purchaseInvoices = [],
    products = [],
    productBatches = [],
    accounts = [],
    warehouses = [],
    companyProfile,
    formatMoney,
    canDeleteEntity,
    addVendor,
    editVendor,
    deleteVendor,
    addPurchaseInvoice,
    editPurchaseInvoice,
    deletePurchaseInvoice,
    recordVendorPayment,
    hasPermission,
    activeSubTab: globalSubTab,
    setActiveSubTab: setGlobalSubTab,
    showAlert,
    showConfirm,
  } = useErp();

  type PurchasesSubTab =
    | 'bills'
    | 'purchase_orders'
    | 'goods_receipts'
    | 'landed_costs'
    | 'returns'
    | 'vendor_aging'
    | 'vendors';

  const [activeSubTab, setActiveSubTabLocal] = useState<PurchasesSubTab>('bills');
  const [selectedPoForGrn, setSelectedPoForGrn] = useState<PurchaseOrder | null>(null);

  React.useEffect(() => {
    if (
      globalSubTab &&
      [
        'bills',
        'purchase_orders',
        'goods_receipts',
        'landed_costs',
        'returns',
        'vendor_aging',
        'vendors',
      ].includes(globalSubTab)
    ) {
      setActiveSubTabLocal(globalSubTab as PurchasesSubTab);
    }
  }, [globalSubTab]);

  const setActiveSubTab = (tab: PurchasesSubTab) => {
    setActiveSubTabLocal(tab);
    setGlobalSubTab(tab);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [sortField, setSortField] = useState<'invoiceNumber' | 'vendorName' | 'date' | 'grandTotal' | 'remainingAmount' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'invoiceNumber' | 'vendorName' | 'date' | 'grandTotal' | 'remainingAmount' | 'status') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredBills = useMemo(() => {
    return purchaseInvoices
      .filter((bill) => {
        // Search
        const matchesSearch =
          searchQuery === '' ||
          bill.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bill.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (bill.notes && bill.notes.toLowerCase().includes(searchQuery.toLowerCase()));

        // Status
        let matchesStatus = true;
        if (statusFilter === 'unpaid') {
          matchesStatus = bill.remainingAmount > 0;
        } else if (statusFilter === 'paid') {
          matchesStatus = bill.remainingAmount <= 0;
        }

        // Date range
        let matchesDate = true;
        if (dateFrom && bill.date < dateFrom) matchesDate = false;
        if (dateTo && bill.date > dateTo) matchesDate = false;

        // Vendor
        let matchesVendor = true;
        if (vendorFilter && bill.vendorId !== vendorFilter) matchesVendor = false;

        return matchesSearch && matchesStatus && matchesDate && matchesVendor;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof PurchaseInvoice] ?? '';
        let valB: any = b[sortField as keyof PurchaseInvoice] ?? '';

        if (typeof valA === 'string') {
          const comp = valA.localeCompare(valB);
          return sortDirection === 'asc' ? comp : -comp;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [purchaseInvoices, searchQuery, statusFilter, dateFrom, dateTo, vendorFilter, sortField, sortDirection]);

  // Modals
  const [showQuickAddVendor, setShowQuickAddVendor] = useState(false);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [showCreateBillModal, setShowCreateBillModal] = useState(false);
  const [showEditBillModal, setShowEditBillModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<PurchaseInvoice | null>(null);

  // Edit Vendor Form
  const [editVendorId, setEditVendorId] = useState('');
  const [editVendorName, setEditVendorName] = useState('');
  const [editVendorCompany, setEditVendorCompany] = useState('');
  const [editVendorPhone, setEditVendorPhone] = useState('');
  const [editVendorEmail, setEditVendorEmail] = useState('');
  const [editVendorTax, setEditVendorTax] = useState('');
  const [editVendorAddress, setEditVendorAddress] = useState('');
  const [editVendorTerms, setEditVendorTerms] = useState(30);

  // New Bill Form
  const [billVendorId, setBillVendorId] = useState(vendors[0]?.id || '');
  const [billWarehouseId, setBillWarehouseId] = useState(warehouses[0]?.id || '');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billDueDate, setBillDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [billVatRate, setBillVatRate] = useState<number>(companyProfile.defaultVatRate ?? 15);
  const [billNotes, setBillNotes] = useState('');
  const [billItems, setBillItems] = useState([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      quantity: 5,
      unitPrice: products[0]?.costPrice || 100,
      total: (products[0]?.costPrice || 100) * 5,
      batchNumber: products[0]?.batchNumber || '',
      productionDate: products[0]?.productionDate || '',
      expiryDate: products[0]?.expiryDate || '',
      warehouseId: warehouses[0]?.id || '',
    },
  ]);

  // Edit Bill Form
  const [editBillId, setEditBillId] = useState('');
  const [editBillVendorId, setEditBillVendorId] = useState('');
  const [editBillWarehouseId, setEditBillWarehouseId] = useState('');
  const [editBillDate, setEditBillDate] = useState('');
  const [editBillDueDate, setEditBillDueDate] = useState('');
  const [editBillVatRate, setEditBillVatRate] = useState<number>(companyProfile.defaultVatRate ?? 15);
  const [editBillNotes, setEditBillNotes] = useState('');
  const [editBillItems, setEditBillItems] = useState<any[]>([]);

  // Payment Form
  const [payAmount, setPayAmount] = useState(0);
  const [payAccountId, setPayAccountId] = useState(accounts.find((a) => a.code === '1120')?.id || '');
  const [payMethod, setPayMethod] = useState<PaymentReceipt['paymentMethod']>('bank_transfer');

  const selectedVendor = vendors.find((v) => v.id === billVendorId);

  const defaultVat = companyProfile.defaultVatRate ?? 15;

  const billSubtotal = billItems.reduce((sum, i) => sum + i.total, 0);
  const billVat = billVatRate > 0 ? (billSubtotal * billVatRate) / 100 : 0;
  const billGrandTotal = billSubtotal + billVat;

  const editBillSubtotal = editBillItems.reduce((sum, i) => sum + i.total, 0);
  const editBillVat = editBillVatRate > 0 ? (editBillSubtotal * editBillVatRate) / 100 : 0;
  const editBillGrandTotal = editBillSubtotal + editBillVat;

  const canEditBill = hasPermission('edit_purchases');
  const canDeleteBill = hasPermission('delete_purchases');
  const canEditVend = hasPermission('edit_vendors');
  const canDeleteVend = hasPermission('delete_vendors');

  const handleAddBillItem = () => {
    const p = products[0];
    if (!p) return;
    setBillItems((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        quantity: 1,
        unitPrice: p.costPrice || 100,
        total: (p.costPrice || 100) * 1,
        batchNumber: p.batchNumber || '',
        productionDate: p.productionDate || '',
        expiryDate: p.expiryDate || '',
        warehouseId: billWarehouseId || warehouses[0]?.id || '',
      },
    ]);
  };

  const handleRemoveBillItem = (index: number) => {
    if (billItems.length <= 1) return;
    setBillItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBillProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    setBillItems((prev) => {
      const next = [...prev];
      const currentQty = next[index]?.quantity || 1;
      next[index] = {
        productId: prod.id,
        productName: prod.name,
        quantity: currentQty,
        unitPrice: prod.costPrice || 100,
        total: (prod.costPrice || 100) * currentQty,
        batchNumber: next[index]?.batchNumber || prod.batchNumber || '',
        productionDate: next[index]?.productionDate || prod.productionDate || '',
        expiryDate: next[index]?.expiryDate || prod.expiryDate || '',
        warehouseId: next[index]?.warehouseId || billWarehouseId || warehouses[0]?.id || '',
      };
      return next;
    });
  };

  const handleBillItemValueChange = (index: number, field: string, val: any) => {
    setBillItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === 'quantity') {
        item.quantity = Math.max(1, Number(val));
        item.total = item.quantity * item.unitPrice;
      } else if (field === 'unitPrice') {
        item.unitPrice = Math.max(0, Number(val));
        item.total = item.quantity * item.unitPrice;
      } else if (field === 'batchNumber') {
        item.batchNumber = val;
        // Check if there is an existing batch matching this batchNumber
        const matchedBatch = productBatches.find(
          (b) => b.productId === item.productId && b.batchNumber.toLowerCase() === String(val).toLowerCase().trim()
        );
        if (matchedBatch) {
          if (matchedBatch.expiryDate && !item.expiryDate) item.expiryDate = matchedBatch.expiryDate;
          if (matchedBatch.productionDate && !item.productionDate) item.productionDate = matchedBatch.productionDate;
          if (matchedBatch.warehouseId) item.warehouseId = matchedBatch.warehouseId;
        }
      } else {
        (item as any)[field] = val;
      }
      next[index] = item;
      return next;
    });
  };

  const handleAddEditBillItem = () => {
    const p = products[0];
    if (!p) return;
    setEditBillItems((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        quantity: 1,
        unitPrice: p.costPrice || 100,
        total: (p.costPrice || 100) * 1,
        batchNumber: p.batchNumber || '',
        productionDate: p.productionDate || '',
        expiryDate: p.expiryDate || '',
        warehouseId: editBillWarehouseId || warehouses[0]?.id || '',
      },
    ]);
  };

  const handleRemoveEditBillItem = (index: number) => {
    if (editBillItems.length <= 1) return;
    setEditBillItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditBillProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    setEditBillItems((prev) => {
      const next = [...prev];
      const currentQty = next[index]?.quantity || 1;
      next[index] = {
        productId: prod.id,
        productName: prod.name,
        quantity: currentQty,
        unitPrice: prod.costPrice || 100,
        total: (prod.costPrice || 100) * currentQty,
        batchNumber: next[index]?.batchNumber || prod.batchNumber || '',
        productionDate: next[index]?.productionDate || prod.productionDate || '',
        expiryDate: next[index]?.expiryDate || prod.expiryDate || '',
        warehouseId: next[index]?.warehouseId || editBillWarehouseId || warehouses[0]?.id || '',
      };
      return next;
    });
  };

  const handleEditBillItemValueChange = (index: number, field: string, val: any) => {
    setEditBillItems((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (field === 'quantity') {
        item.quantity = Math.max(1, Number(val));
        item.total = item.quantity * item.unitPrice;
      } else if (field === 'unitPrice') {
        item.unitPrice = Math.max(0, Number(val));
        item.total = item.quantity * item.unitPrice;
      } else if (field === 'batchNumber') {
        item.batchNumber = val;
        // Check if there is an existing batch matching this batchNumber
        const matchedBatch = productBatches.find(
          (b) => b.productId === item.productId && b.batchNumber.toLowerCase() === String(val).toLowerCase().trim()
        );
        if (matchedBatch) {
          if (matchedBatch.expiryDate && !item.expiryDate) item.expiryDate = matchedBatch.expiryDate;
          if (matchedBatch.productionDate && !item.productionDate) item.productionDate = matchedBatch.productionDate;
          if (matchedBatch.warehouseId) item.warehouseId = matchedBatch.warehouseId;
        }
      } else {
        (item as any)[field] = val;
      }
      next[index] = item;
      return next;
    });
  };

  const handleOpenEditBill = (bill: PurchaseInvoice) => {
    if (!canEditBill) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لتعديل فواتير المشتريات. يرجى مراجعة المسؤول.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setEditBillId(bill.id);
    setEditBillVendorId(bill.vendorId);
    setEditBillDate(bill.date);
    setEditBillDueDate(bill.dueDate);
    setEditBillItems([...bill.items]);
    setEditBillNotes(bill.notes || '');
    const impliedVatRate = bill.subtotal > 0 ? Math.round((bill.vatTotal / bill.subtotal) * 100) : (companyProfile.defaultVatRate ?? 15);
    setEditBillVatRate(impliedVatRate);
    setShowEditBillModal(true);
  };

  const handleDeleteBill = (bill: PurchaseInvoice) => {
    if (!canDeleteBill) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لحذف فواتير المشتريات.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    const check = canDeleteEntity('purchase', bill.id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف فاتورة المشتريات (${bill.invoiceNumber})`,
        message: 'لا يمكن حذف فاتورة الشراء للأسباب التالية:',
        details: check.reason,
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    showConfirm(
      `هل أنت متأكد من حذف فاتورة الشراء رقم ${bill.invoiceNumber}؟ سيتم إلغاء الترحيلات وإلغاء استلام المخزون.`,
      () => {
        deletePurchaseInvoice(bill.id);
      },
      `تأكيد حذف فاتورة الشراء (${bill.invoiceNumber})`,
      'حذف الفاتورة'
    );
  };

  const handleOpenEditVendor = (v: Vendor) => {
    if (!canEditVend) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لتعديل بيانات الموردين.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    setEditVendorId(v.id);
    setEditVendorName(v.name);
    setEditVendorCompany(v.companyName || '');
    setEditVendorPhone(v.phone || '');
    setEditVendorEmail(v.email || '');
    setEditVendorTax(v.taxNumber || '');
    setEditVendorAddress(v.address || '');
    setEditVendorTerms(v.paymentTermsDays || 30);
    setShowEditVendorModal(true);
  };

  const handleDeleteVendor = (v: Vendor) => {
    if (!canDeleteVend) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية لحذف الموردين.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    const check = canDeleteEntity('vendor', v.id);
    if (!check.canDelete) {
      showAlert({
        title: `تعذر حذف المورد (${v.name})`,
        message: 'لا يمكن حذف المورد من السجلات للأسباب التالية:',
        details: check.reason,
        note: 'للحفاظ على تكامل قيود المشتريات وحسابات الدائنين، يُمنع حذف الموردين الذين لديهم حركات.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    showConfirm(
      `هل أنت متأكد من حذف المورد "${v.name}" نهائياً من النظام؟`,
      () => {
        deleteVendor(v.id);
      },
      `تأكيد حذف المورد (${v.name})`,
      'حذف المورد'
    );
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) {
      showAlert({
        title: 'تحديد المورد',
        message: 'يرجى اختيار المورد المعتمد للفاتورة أولاً.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    addPurchaseInvoice({
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      date: billDate,
      dueDate: billDueDate,
      items: billItems,
      subtotal: billSubtotal,
      vatTotal: billVat,
      grandTotal: billGrandTotal,
      notes: billNotes,
    });

    setShowCreateBillModal(false);
    setBillNotes('');
  };

  const handlePayVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || payAmount <= 0) return;
    recordVendorPayment(selectedBill.id, payAmount, payAccountId, payMethod);
    setShowPayModal(false);
    setSelectedBill(null);
  };

  const handleRevertTransaction = (bill: PurchaseInvoice) => {
    if (!canDeleteBill) {
      showAlert({
        title: 'صلاحيات غير كافية',
        message: 'عذراً: ليس لديك صلاحية للرجوع عن حركات فواتير المشتريات.',
        type: 'error',
        confirmText: 'فهمت',
      });
      return;
    }
    showConfirm(
      `تنبيه أمان وحركة محاسبية: هل أنت متأكد من الرجوع عن حركة فاتورة المشتريات رقم (${bill.invoiceNumber}) للمورد "${bill.vendorName}"؟\n\nالآثار المترتبة على الرجوع:\n1. إلغاء قيد استحقاق المشتريات وضريبة المدخلات من دفتر اليومية.\n2. خصم الكميات المشتراة من رصيد المستودعات والمخزون.\n3. إلغاء أي مديونية أو استحقاقات مسجلة للمورد.\n\nهل ترغب بالاستمرار والتراجع عن الحركة؟`,
      () => {
        deletePurchaseInvoice(bill.id);
        showAlert({
          title: 'تم التراجع عن الحركة بنجاح',
          message: `تم إلغاء فاتورة الشراء (${bill.invoiceNumber}) وعكس كافة القيود المحاسبية وحركات المخزون بنجاح.`,
          type: 'success',
          confirmText: 'حسناً',
        });
      },
      `تأكيد الرجوع عن حركة فاتورة الشراء (${bill.invoiceNumber})`,
      'تراجع عن الحركة'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header - displayed for bills and vendors views */}
      {['bills', 'vendors'].includes(activeSubTab) && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              المشتريات وإدارة الموردين وحسابات الدائنين
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              إثبات فواتير التوريد، وأوامر الشراء، وأذونات الاستلام، وتكاليف الشحن، وأعمار الديون
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowQuickAddVendor(true)}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl transition-all border border-slate-300 cursor-pointer"
              title="إضافة مورد جديد للنظام والمشتريات"
            >
              <Building2 className="w-4 h-4 text-emerald-600" />
              + مورد جديد
            </button>

            <button
              onClick={() => setShowCreateBillModal(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              فاتورة مشتريات
            </button>
          </div>
        </div>
      )}

      {/* Subtab: Purchase Orders */}
      {activeSubTab === 'purchase_orders' && (
        <PurchaseOrdersSection
          onConvertToGrn={(po) => {
            setSelectedPoForGrn(po);
            setActiveSubTab('goods_receipts');
          }}
          onConvertToBill={(po) => {
            setShowCreateBillModal(true);
          }}
        />
      )}

      {/* Subtab: Goods Receipts */}
      {activeSubTab === 'goods_receipts' && (
        <GoodsReceiptsSection
          initialPoForGrn={selectedPoForGrn}
          onClearInitialPo={() => setSelectedPoForGrn(null)}
        />
      )}

      {/* Subtab: Landed Costs */}
      {activeSubTab === 'landed_costs' && <LandedCostSection />}

      {/* Subtab: Purchase Returns */}
      {activeSubTab === 'returns' && <PurchaseReturnsSection />}

      {/* Subtab: Vendor Aging */}
      {activeSubTab === 'vendor_aging' && (
        <VendorAgingSection
          onPayVendor={(vendorId) => {
            setVendorFilter(vendorId);
            setActiveSubTab('bills');
          }}
        />
      )}

      {/* Subtab 1: Bills */}
      {activeSubTab === 'bills' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="البحث برقم فاتورة الشراء، اسم المورد، أو الملاحظات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pr-9 pl-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  جميع الفواتير ({purchaseInvoices.length})
                </button>
                <button
                  onClick={() => setStatusFilter('unpaid')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === 'unpaid' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  مستحقة / غير مسددة
                </button>
                <button
                  onClick={() => setStatusFilter('paid')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    statusFilter === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  مسددة بالكامل
                </button>
              </div>
            </div>

            {/* Advanced Filters: Date Range + Vendor */}
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
                <span className="font-semibold text-slate-600">تصفية المورد:</span>
                <div className="w-48">
                  <SearchableSelect
                    value={vendorFilter}
                    onChange={(val) => setVendorFilter(val)}
                    placeholder="جميع الموردين"
                    searchPlaceholder="ابحث باسم المورد..."
                    options={[
                      { value: '', label: 'جميع الموردين' },
                      ...vendors.map((v) => ({
                        value: v.id,
                        label: v.name,
                        subLabel: v.phone,
                      })),
                    ]}
                  />
                </div>
              </div>

              {(dateFrom || dateTo || vendorFilter || searchQuery || statusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                    setVendorFilter('');
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
                تم العثور على {filteredBills.length} من أصل {purchaseInvoices.length} فاتورة
              </div>
            </div>
          </div>

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
                      onClick={() => handleSort('vendorName')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>اسم المورد</span>
                        {sortField === 'vendorName' ? (
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
                        <span>تاريخ التوريد</span>
                        {sortField === 'date' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4">تاريخ الاستحقاق</th>
                    <th className="py-3 px-4">المبلغ قبل الضريبة</th>
                    <th className="py-3 px-4">ضريبة المدخلات {defaultVat}%</th>
                    <th
                      onClick={() => handleSort('grandTotal')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>إجمالي الفاتورة</span>
                        {sortField === 'grandTotal' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4">المسدد</th>
                    <th
                      onClick={() => handleSort('remainingAmount')}
                      className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>المتبقي للدفع</span>
                        {sortField === 'remainingAmount' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        لا توجد فواتير مشتريات مطابقة للبحث أو التصفية الحالية
                      </td>
                    </tr>
                  ) : (
                    filteredBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {bill.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{bill.vendorName}</td>
                        <td className="py-3 px-4 text-slate-600">{bill.date}</td>
                        <td className="py-3 px-4 text-slate-600">{bill.dueDate}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{formatMoney(bill.subtotal)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatMoney(bill.vatTotal)}</td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">
                          {formatMoney(bill.grandTotal)}
                        </td>
                        <td className="py-3 px-4 text-emerald-700 font-bold">{formatMoney(bill.paidAmount)}</td>
                        <td className="py-3 px-4 text-rose-700 font-extrabold">{formatMoney(bill.remainingAmount)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Print / Preview */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowPrintModal(true);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                              title="معاينة وطباعة فاتورة المشتريات"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Pay button */}
                            {bill.remainingAmount > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setPayAmount(bill.remainingAmount);
                                  setShowPayModal(true);
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-lg border border-emerald-200 text-[11px] transition-colors cursor-pointer"
                                title="سداد دفعة أو تصفية المستحقات"
                              >
                                سداد
                              </button>
                            ) : (
                              <span className="text-emerald-600 font-bold text-[11px] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                تم السداد
                              </span>
                            )}

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditBill(bill)}
                              disabled={!canEditBill}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                canEditBill
                                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                                  : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              }`}
                              title={canEditBill ? 'تعديل فاتورة المشتريات' : 'ليس لديك صلاحية تعديل فواتير المشتريات'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteBill(bill)}
                              disabled={!canDeleteBill}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                canDeleteBill
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                  : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              }`}
                              title={canDeleteBill ? 'حذف فاتورة المشتريات' : 'ليس لديك صلاحية حذف فواتير المشتريات'}
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
        </div>
      )}

      {/* Subtab 2: Vendors */}
      {activeSubTab === 'vendors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendors.map((v) => (
            <div key={v.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-700">
                      {v.code}
                    </span>
                    <h3 className="font-bold text-slate-900">{v.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{v.companyName}</p>
                </div>
                <div className="text-left">
                  <span className="text-[11px] text-slate-400 block">رصيد المورد المستحق:</span>
                  <span className="font-extrabold text-rose-700 text-base">{formatMoney(v.currentBalance)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div>الهاتف: {v.phone} | البريد: {v.email}</div>
                {v.taxNumber && <div className="font-mono">الرقم الضريبي: {v.taxNumber}</div>}
                <div>فترة الائتمان المتفق عليها: {v.paymentTermsDays} يوماً</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEditVendor(v)}
                  disabled={!canEditVend}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                    canEditVend
                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                      : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title={canEditVend ? 'تعديل بيانات المورد' : 'ليس لديك صلاحية تعديل الموردين'}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  تعديل
                </button>
                <button
                  onClick={() => handleDeleteVendor(v)}
                  disabled={!canDeleteVend}
                  className={`px-3 py-1 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${
                    canDeleteVend
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'opacity-40 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                  title={canDeleteVend ? 'حذف المورد' : 'ليس لديك صلاحية حذف الموردين'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Quick Add Vendor */}
      <QuickAddModal
        isOpen={showQuickAddVendor}
        onClose={() => setShowQuickAddVendor(false)}
        initialTab="vendor"
      />

      {/* Modal 1.5: Edit Vendor */}
      {showEditVendorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                تعديل بيانات المورد
              </h3>
              <button onClick={() => setShowEditVendorModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                editVendor(editVendorId, {
                  name: editVendorName,
                  companyName: editVendorCompany,
                  phone: editVendorPhone,
                  email: editVendorEmail,
                  taxNumber: editVendorTax,
                  address: editVendorAddress,
                  paymentTermsDays: editVendorTerms,
                });
                setShowEditVendorModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم المورد</label>
                <input
                  type="text"
                  required
                  value={editVendorName}
                  onChange={(e) => setEditVendorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الهاتف</label>
                  <input
                    type="text"
                    value={editVendorPhone}
                    onChange={(e) => setEditVendorPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">الرقم الضريبي</label>
                  <input
                    type="text"
                    value={editVendorTax}
                    onChange={(e) => setEditVendorTax(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">فترة الائتمان (بالأيام)</label>
                <input
                  type="number"
                  min="0"
                  value={editVendorTerms}
                  onChange={(e) => setEditVendorTerms(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditVendorModal(false)}
                  className="px-4 py-2 text-slate-600 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2.5: Edit Purchase Bill */}
      {showEditBillModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  تعديل فاتورة المشتريات والتوريد المخزني
                </h3>
                <p className="text-xs text-slate-500">
                  تعديل أصناف وكميات الفاتورة وتحديث أرصدة المخازن وحسابات المورد المعتمد
                </p>
              </div>
              <button
                onClick={() => setShowEditBillModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const vend = vendors.find((v) => v.id === editBillVendorId);
                if (!vend) {
                  showAlert({
                    title: 'تحديد المورد',
                    message: 'يرجى اختيار المورد المعتمد للفاتورة أولاً.',
                    type: 'warning',
                    confirmText: 'فهمت',
                  });
                  return;
                }
                editPurchaseInvoice(editBillId, {
                  vendorId: vend.id,
                  vendorName: vend.name,
                  date: editBillDate,
                  dueDate: editBillDueDate,
                  items: editBillItems,
                  subtotal: editBillSubtotal,
                  vatTotal: editBillVat,
                  grandTotal: editBillGrandTotal,
                  notes: editBillNotes,
                });
                setShowEditBillModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المورد المعتمد</label>
                  <SearchableSelect
                    value={editBillVendorId}
                    onChange={(val) => setEditBillVendorId(val)}
                    placeholder="اختر المورد..."
                    searchPlaceholder="ابحث باسم المورد أو الكود..."
                    options={vendors.map((v) => ({
                      value: v.id,
                      label: `${v.name} (${v.code})`,
                      subLabel: v.phone,
                      badge: v.currentBalance > 0 ? `مستحق: ${formatMoney(v.currentBalance)}` : undefined,
                      badgeColor: 'bg-amber-50 text-amber-700',
                    }))}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">مستودع الاستلام الافتراضي</label>
                  <select
                    value={editBillWarehouseId || warehouses[0]?.id || ''}
                    onChange={(e) => {
                      const wid = e.target.value;
                      setEditBillWarehouseId(wid);
                      setEditBillItems((prev) => prev.map((it) => ({ ...it, warehouseId: wid })));
                    }}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.isDefault ? '(الرئيسي)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الفاتورة / التوريد</label>
                  <input
                    type="date"
                    required
                    value={editBillDate}
                    onChange={(e) => setEditBillDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    required
                    value={editBillDueDate}
                    onChange={(e) => setEditBillDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نسبة ضريبة المدخلات (VAT)</label>
                  <select
                    value={editBillVatRate}
                    onChange={(e) => setEditBillVatRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  >
                    <option value={defaultVat}>{defaultVat}% (الافتراضي للشركة)</option>
                    {defaultVat !== 15 && <option value="15">15% (السعودية ZATCA)</option>}
                    {defaultVat !== 14 && <option value="14">14% (مصر - قيمة مضافة)</option>}
                    {defaultVat !== 5 && <option value="5">5% (الإمارات / عمان)</option>}
                    <option value="0">0% (معفى من الضريبة)</option>
                  </select>
                </div>
              </div>

              {/* Items Section (Single Horizontal Row Layout with Batch Tracking) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-sm">الأصناف والبنود الموردة</span>
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {editBillItems.length} {editBillItems.length === 1 ? 'بند' : 'بنود'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEditBillItem}
                    className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 text-xs shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + إضافة بند
                  </button>
                </div>

                {/* Table Column Headers on Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100/90 rounded-xl text-[11px] font-bold text-slate-600">
                  <div className="col-span-4">الصنف والمنتج</div>
                  <div className="col-span-2 text-center">رقم الباتش / التشغيلة</div>
                  <div className="col-span-2 text-center">تاريخ الصلاحية</div>
                  <div className="col-span-1 text-center">الكمية</div>
                  <div className="col-span-1 text-center">سعر التكلفة</div>
                  <div className="col-span-2 text-center">إجمالي البند</div>
                </div>

                {/* Single Row Item Cards */}
                <div className="space-y-2">
                  {editBillItems.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const isExpiryTracked = prod?.hasExpiry || Boolean(item.expiryDate);

                    return (
                      <div
                        key={idx}
                        className="p-2.5 sm:p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          {/* Product Selector */}
                          <div className="sm:col-span-4">
                            <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">
                              بند #{idx + 1}: الصنف والمنتج
                            </label>
                            <ProductSelectSearch
                              selectedProductId={item.productId}
                              onSelectProduct={(p) => handleEditBillProductChange(idx, p.id)}
                            />
                          </div>

                          {/* Batch Number */}
                          <div className="sm:col-span-2">
                            <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">رقم التشغيلة / الباتش</label>
                            <input
                              type="text"
                              placeholder="رقم الباتش (اختياري)"
                              list={`edit-batch-suggestions-${idx}`}
                              value={item.batchNumber || ''}
                              onChange={(e) => handleEditBillItemValueChange(idx, 'batchNumber', e.target.value)}
                              className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-mono text-center placeholder:text-slate-400"
                            />
                            <datalist id={`edit-batch-suggestions-${idx}`}>
                              {productBatches
                                .filter((b) => b.productId === item.productId)
                                .map((b) => (
                                  <option key={b.id} value={b.batchNumber}>
                                    {b.batchNumber} (صلاحية: {b.expiryDate} - رصيد: {b.quantity})
                                  </option>
                                ))}
                            </datalist>
                          </div>

                          {/* Expiry Date */}
                          <div className="sm:col-span-2">
                            <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">
                              تاريخ انتهاء الصلاحية {isExpiryTracked && <span className="text-amber-600 font-bold">*</span>}
                            </label>
                            <input
                              type="date"
                              value={item.expiryDate || ''}
                              onChange={(e) => handleEditBillItemValueChange(idx, 'expiryDate', e.target.value)}
                              className={`w-full p-2 text-xs rounded-xl border ${
                                isExpiryTracked ? 'border-amber-400 bg-amber-50/40 text-amber-900 font-bold' : 'border-slate-300 bg-white'
                              } text-center`}
                            />
                          </div>

                          {/* Quantity with Math calculator */}
                          <div className="sm:col-span-1">
                            <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">الكمية</label>
                            <MathQuantityInput
                              value={item.quantity}
                              onChange={(newQty) => handleEditBillItemValueChange(idx, 'quantity', newQty)}
                              min={1}
                              className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                            />
                          </div>

                          {/* Unit Cost Price */}
                          <div className="sm:col-span-1">
                            <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">سعر التكلفة</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleEditBillItemValueChange(idx, 'unitPrice', Number(e.target.value))}
                              className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                            />
                          </div>

                          {/* Item Total & Delete on Single Line */}
                          <div className="sm:col-span-2 flex items-center justify-between gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="flex-1 text-center font-extrabold text-xs text-blue-700 font-mono py-1">
                              {formatMoney(item.total)}
                            </div>
                            {editBillItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveEditBillItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                                title="حذف البند"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Extra Batch Details Row (Production Date & Specific Warehouse) */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500 bg-slate-50/50 p-1.5 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-600">المستودع:</span>
                            <select
                              value={item.warehouseId || editBillWarehouseId || warehouses[0]?.id || ''}
                              onChange={(e) => handleEditBillItemValueChange(idx, 'warehouseId', e.target.value)}
                              className="p-1 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-800"
                            >
                              {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-600">تاريخ الإنتاج:</span>
                            <input
                              type="date"
                              value={item.productionDate || ''}
                              onChange={(e) => handleEditBillItemValueChange(idx, 'productionDate', e.target.value)}
                              className="p-1 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Item Row Button */}
                <button
                  type="button"
                  onClick={handleAddEditBillItem}
                  className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50 text-blue-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>+ إضافة بند جديد للفاتورة</span>
                </button>
              </div>

              {/* Purchase Summary Box */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 shadow-xs border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>إجمالي الأصناف الموردة قبل الضريبة:</span>
                  <span className="font-semibold text-white">{formatMoney(editBillSubtotal)}</span>
                </div>
                {editBillVatRate > 0 ? (
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>ضريبة القيمة المضافة / المدخلات ({editBillVatRate}% VAT):</span>
                    <span className="font-bold text-emerald-400">+{formatMoney(editBillVat)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>ضريبة القيمة المضافة:</span>
                    <span className="font-bold text-slate-400">0% (معفى من الضريبة)</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700/80 pt-2 mt-1">
                  <span>المبلغ الإجمالي المعدل للمشتريات:</span>
                  <span className="text-emerald-400 text-base font-black">{formatMoney(editBillGrandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات الفاتورة ورقم إذن التوريد / السند الورقي</label>
                <textarea
                  rows={2}
                  value={editBillNotes}
                  onChange={(e) => setEditBillNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات عن الفاتورة أو رقم سند التوريد الورقي للمورد..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditBillModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  حفظ تعديلات الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Bill */}
      {showCreateBillModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  تسجيل فاتورة مشتريات وتوريد مخزني
                </h3>
                <p className="text-xs text-slate-500">
                  تسجيل استلام بضاعة ومشتريات، وتحديث المخزون آلياً، وقيد ضريبة المدخلات وحسابات الموردين
                </p>
              </div>
              <button
                onClick={() => setShowCreateBillModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">المورد المعتمد</label>
                  <SearchableSelect
                    value={billVendorId}
                    onChange={(val) => setBillVendorId(val)}
                    placeholder="اختر المورد..."
                    searchPlaceholder="ابحث باسم المورد أو الكود..."
                    options={vendors.map((v) => ({
                      value: v.id,
                      label: `${v.name} (${v.code})`,
                      subLabel: v.phone,
                      badge: v.currentBalance > 0 ? `مستحق: ${formatMoney(v.currentBalance)}` : undefined,
                      badgeColor: 'bg-amber-50 text-amber-700',
                    }))}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">مستودع الاستلام الافتراضي</label>
                  <select
                    value={billWarehouseId || warehouses[0]?.id || ''}
                    onChange={(e) => {
                      const wid = e.target.value;
                      setBillWarehouseId(wid);
                      setBillItems((prev) => prev.map((it) => ({ ...it, warehouseId: wid })));
                    }}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.isDefault ? '(الرئيسي)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الفاتورة / التوريد</label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    required
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نسبة ضريبة المدخلات (VAT)</label>
                  <select
                    value={billVatRate}
                    onChange={(e) => setBillVatRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                  >
                    <option value={defaultVat}>{defaultVat}% (الافتراضي للشركة)</option>
                    {defaultVat !== 15 && <option value="15">15% (السعودية ZATCA)</option>}
                    {defaultVat !== 14 && <option value="14">14% (مصر - قيمة مضافة)</option>}
                    {defaultVat !== 5 && <option value="5">5% (الإمارات / عمان)</option>}
                    <option value="0">0% (معفى من الضريبة)</option>
                  </select>
                </div>
              </div>

              {/* Items Section (Single Horizontal Row Layout with Batch Tracking) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 text-sm">الأصناف والبنود الموردة</span>
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {billItems.length} {billItems.length === 1 ? 'بند' : 'بنود'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBillItem}
                    className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200 text-xs shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    + إضافة بند
                  </button>
                </div>

                {/* Table Column Headers on Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 py-1.5 bg-slate-100/90 rounded-xl text-[11px] font-bold text-slate-600">
                  <div className="col-span-4">الصنف والمنتج</div>
                  <div className="col-span-2 text-center">رقم الباتش / التشغيلة</div>
                  <div className="col-span-2 text-center">تاريخ الصلاحية</div>
                  <div className="col-span-1 text-center">الكمية</div>
                  <div className="col-span-1 text-center">سعر التكلفة</div>
                  <div className="col-span-2 text-center">إجمالي البند</div>
                </div>

                {/* Single Row Item Cards */}
                <div className="space-y-2">
                  {billItems.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const isExpiryTracked = prod?.hasExpiry || Boolean(item.expiryDate);

                    return (
                      <div
                        key={idx}
                        className="p-2.5 sm:p-2 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          {/* Product Selector */}
                          <div className="sm:col-span-4">
                            <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">
                              بند #{idx + 1}: الصنف والمنتج
                            </label>
                            <ProductSelectSearch
                              selectedProductId={item.productId}
                              onSelectProduct={(p) => handleBillProductChange(idx, p.id)}
                            />
                          </div>

                          {/* Batch Number */}
                          <div className="sm:col-span-2">
                            <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">رقم التشغيلة / الباتش</label>
                            <input
                              type="text"
                              placeholder="رقم الباتش (اختياري)"
                              list={`bill-batch-suggestions-${idx}`}
                              value={item.batchNumber || ''}
                              onChange={(e) => handleBillItemValueChange(idx, 'batchNumber', e.target.value)}
                              className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-mono text-center placeholder:text-slate-400"
                            />
                            <datalist id={`bill-batch-suggestions-${idx}`}>
                              {productBatches
                                .filter((b) => b.productId === item.productId)
                                .map((b) => (
                                  <option key={b.id} value={b.batchNumber}>
                                    {b.batchNumber} (صلاحية: {b.expiryDate} - رصيد: {b.quantity})
                                  </option>
                                ))}
                            </datalist>
                          </div>

                          {/* Expiry Date */}
                          <div className="sm:col-span-2">
                            <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">
                              تاريخ انتهاء الصلاحية {isExpiryTracked && <span className="text-amber-600 font-bold">*</span>}
                            </label>
                            <input
                              type="date"
                              value={item.expiryDate || ''}
                              onChange={(e) => handleBillItemValueChange(idx, 'expiryDate', e.target.value)}
                              className={`w-full p-2 text-xs rounded-xl border ${
                                isExpiryTracked ? 'border-amber-400 bg-amber-50/40 text-amber-900 font-bold' : 'border-slate-300 bg-white'
                              } text-center`}
                            />
                          </div>

                          {/* Quantity with Math calculator */}
                          <div className="sm:col-span-1">
                            <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">الكمية</label>
                            <MathQuantityInput
                              value={item.quantity}
                              onChange={(newQty) => handleBillItemValueChange(idx, 'quantity', newQty)}
                              min={1}
                              className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                            />
                          </div>

                          {/* Unit Cost Price */}
                          <div className="sm:col-span-1">
                            <label className="sm:hidden block text-[10px] text-slate-500 mb-0.5 font-bold">سعر التكلفة</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleBillItemValueChange(idx, 'unitPrice', Number(e.target.value))}
                              className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-center"
                            />
                          </div>

                          {/* Item Total & Delete on Single Line */}
                          <div className="sm:col-span-2 flex items-center justify-between gap-1.5 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="flex-1 text-center font-extrabold text-xs text-emerald-700 font-mono py-1">
                              {formatMoney(item.total)}
                            </div>
                            {billItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveBillItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                                title="حذف البند"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Extra Batch Details Row (Production Date & Specific Warehouse) */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500 bg-slate-50/50 p-1.5 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-600">المستودع:</span>
                            <select
                              value={item.warehouseId || billWarehouseId || warehouses[0]?.id || ''}
                              onChange={(e) => handleBillItemValueChange(idx, 'warehouseId', e.target.value)}
                              className="p-1 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-800"
                            >
                              {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-600">تاريخ الإنتاج:</span>
                            <input
                              type="date"
                              value={item.productionDate || ''}
                              onChange={(e) => handleBillItemValueChange(idx, 'productionDate', e.target.value)}
                              className="p-1 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Item Row Button */}
                <button
                  type="button"
                  onClick={handleAddBillItem}
                  className="w-full py-2.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>+ إضافة بند جديد للفاتورة</span>
                </button>
              </div>

              {/* Purchase Summary Box */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 shadow-xs border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>إجمالي الأصناف الموردة قبل الضريبة:</span>
                  <span className="font-semibold text-white">{formatMoney(billSubtotal)}</span>
                </div>
                {billVatRate > 0 ? (
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>ضريبة القيمة المضافة / المدخلات ({billVatRate}% VAT):</span>
                    <span className="font-bold text-emerald-400">+{formatMoney(billVat)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>ضريبة القيمة المضافة:</span>
                    <span className="font-bold text-slate-400">0% (معفى من الضريبة)</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-700/80 pt-2 mt-1">
                  <span>المبلغ الإجمالي النهائي للمشتريات:</span>
                  <span className="text-emerald-400 text-base font-black">{formatMoney(billGrandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ملاحظات الفاتورة ورقم إذن التوريد / السند الورقي</label>
                <textarea
                  rows={2}
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  placeholder="أدخل أي ملاحظات عن الفاتورة أو رقم سند التوريد الورقي للمورد..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateBillModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  تأكيد التوريد وقيد المشتريات والترحيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Pay Vendor */}
      {showPayModal && selectedBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">سند صرف وسداد مستحقات مورد</h3>
                <p className="text-xs text-slate-500">فاتورة: {selectedBill.invoiceNumber}</p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayVendor} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between">
                <span className="text-slate-600">المتبقي للمورد:</span>
                <span className="font-extrabold text-rose-700 text-sm">{formatMoney(selectedBill.remainingAmount)}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">المبلغ المراد صرفه</label>
                <input
                  type="number"
                  min="1"
                  max={selectedBill.remainingAmount}
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-extrabold text-center text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">الحساب المصروف منه (الخزينة/البنك)</label>
                <SearchableSelect
                  value={payAccountId}
                  onChange={(val) => setPayAccountId(val)}
                  placeholder="-- اختر الخزينة أو الحساب البنكي --"
                  searchPlaceholder="ابحث باسم الحساب أو الكود..."
                  options={accounts
                    .filter((a) => (a.code === '1110' || a.code === '1120') && !a.isHeader)
                    .map((a) => ({
                      value: a.id,
                      label: `${a.code} - ${a.name}`,
                      subLabel: a.category,
                    }))}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 text-slate-600 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                >
                  تأكيد سند الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Print Purchase Invoice Modal */}
      {showPrintModal && selectedBill && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title="معاينة فاتورة المشتريات والتوريد"
          docNumber={selectedBill.invoiceNumber}
          badgeText="فاتورة مشتريات معتمدة"
          badgeColor="bg-emerald-50 text-emerald-800 border-emerald-200"
          elementId="purchase-invoice-document-sheet"
        >
          {({ orientation }) => (
            <div className="space-y-6 text-xs text-slate-800">
              {/* Standardized Header */}
              <PrintHeader
                docTitle="فاتورة مشتريات وتوريد (PURCHASE BILL)"
                docNumber={selectedBill.invoiceNumber}
                date={selectedBill.date}
                dueDate={selectedBill.dueDate ? `الاستحقاق: ${selectedBill.dueDate}` : undefined}
                badgeColor="bg-emerald-700 text-white"
                additionalMeta={[
                  { label: 'المورد', value: selectedBill.vendorName },
                  { label: 'حالة السداد', value: selectedBill.status === 'paid' || selectedBill.remainingAmount <= 0 ? 'خالصة ومسددة' : 'غير مسددة' },
                ]}
                orientation={orientation}
              />

              {/* Vendor and Supply Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">بيانات المورد (Vendor Details):</span>
                  <div className="font-extrabold text-slate-900 text-sm">{selectedBill.vendorName}</div>
                  <div className="text-slate-600 mt-1">
                    حالة السداد: <strong className={selectedBill.remainingAmount <= 0 ? 'text-emerald-700' : 'text-amber-700'}>
                      {selectedBill.remainingAmount <= 0 ? 'مدفوعة بالكامل' : 'متبقي مبالغ آجلة'}
                    </strong>
                  </div>
                </div>
                <div className="text-left space-y-1">
                  <div>
                    <span className="text-slate-500">تاريخ الفاتورة: </span>
                    <span className="font-mono font-bold text-slate-800">{selectedBill.date}</span>
                  </div>
                  {selectedBill.dueDate && (
                    <div>
                      <span className="text-slate-500">تاريخ الاستحقاق: </span>
                      <span className="font-mono font-bold text-slate-800">{selectedBill.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">الصنف / البيان والمواصفات</th>
                      <th className="p-2.5 text-center">الكمية المستلمة</th>
                      <th className="p-2.5 text-center">تكلفة الوحدة</th>
                      <th className="p-2.5 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {selectedBill.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="p-2.5 font-sans font-bold text-slate-900">{item.productName}</td>
                        <td className="p-2.5 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="p-2.5 text-center text-slate-700">{formatMoney(item.unitCost)}</td>
                        <td className="p-2.5 text-left font-bold text-slate-900">{formatMoney(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع قبل الضريبة:</span>
                    <span className="font-mono font-bold">{formatMoney(selectedBill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ضريبة القيمة المضافة:</span>
                    <span className="font-mono font-bold text-emerald-700">+{formatMoney(selectedBill.vatTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-300">
                    <span>الإجمالي النهائي للفاتورة:</span>
                    <span className="font-mono text-emerald-700 text-base font-black">{formatMoney(selectedBill.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                    <span>المبلغ المسدد:</span>
                    <span className="font-mono font-bold text-emerald-600">{formatMoney(selectedBill.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold pt-1">
                    <span>المتبقي للمورد:</span>
                    <span className="font-mono font-extrabold">{formatMoney(selectedBill.remainingAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Standardized Footer */}
              <PrintFooter
                preparedByTitle="أمين المستودع (استلام الأصناف)"
                approvedByTitle="مدير المشتريات / الإدارة المالية"
                receivedByTitle="توقيع مندوب المورد"
                terms="تم استلام ومطابقة المواد المذكورة أعلاه بحالة جيدة وقيدها في السجلات المخزنية والمحاسبية."
              />
            </div>
          )}
        </PrintPreviewModal>
      )}
    </div>
  );
};
