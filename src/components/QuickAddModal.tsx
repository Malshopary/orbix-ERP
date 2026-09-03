import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import {
  UserPlus,
  Building2,
  Briefcase,
  PackagePlus,
  X,
  Check,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  FileText,
  DollarSign,
  ShieldCheck,
  Calendar,
  Layers,
  Percent,
  Barcode,
  Award,
  CreditCard,
  Building,
  UserCheck,
  Tag,
  Hash,
  AlertCircle,
  Camera,
  Upload,
  Clock,
  Trash2,
  Plus,
  Image as ImageIcon,
} from 'lucide-react';
import {
  GOVERNORATES_DATA,
  CUSTOMER_CATEGORIES,
  ACQUISITION_CHANNELS,
  VENDOR_CATEGORIES,
  PRODUCT_BRANDS,
  PRODUCT_UNITS,
  CONTRACT_TYPES,
  getRegionsForGovernorate,
} from '../data/regionsData';
import { Customer, Vendor, Employee, Product } from '../types';
import { SearchableSelect } from './SearchableSelect';

export type QuickAddTab = 'customer' | 'vendor' | 'employee' | 'product';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: QuickAddTab;
  onSuccess?: (type: QuickAddTab, entity: any) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'customer',
  onSuccess,
}) => {
  const {
    addCustomer,
    addVendor,
    addEmployee,
    addProduct,
    syncProductBatches,
    salesReps,
    priceLists,
    warehouses,
    vendors,
    showAlert,
    formatMoney,
  } = useErp();

  const [activeTab, setActiveTab] = useState<QuickAddTab>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // ==========================================
  // 1. CUSTOMER STATE
  // ==========================================
  const [custName, setCustName] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custTax, setCustTax] = useState('');
  const [custCommercialReg, setCustCommercialReg] = useState('');
  const [custGov, setCustGov] = useState('القاهرة');
  const [custRegion, setCustRegion] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custContactPerson, setCustContactPerson] = useState('');
  const [custContactPhone, setCustContactPhone] = useState('');
  const [custCategory, setCustCategory] = useState<any>('retail');
  const [custChannel, setCustChannel] = useState<any>('direct');
  const [custSalesRepId, setCustSalesRepId] = useState('');
  const [custPriceListId, setCustPriceListId] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState(25000);
  const [custTerms, setCustTerms] = useState(30);
  const [custNotes, setCustNotes] = useState('');

  // ==========================================
  // 2. VENDOR / SUPPLIER STATE
  // ==========================================
  const [vndName, setVndName] = useState('');
  const [vndCompany, setVndCompany] = useState('');
  const [vndCategory, setVndCategory] = useState('مصنع محلي ومنتج');
  const [vndPhone, setVndPhone] = useState('');
  const [vndEmail, setVndEmail] = useState('');
  const [vndTax, setVndTax] = useState('');
  const [vndCommercialReg, setVndCommercialReg] = useState('');
  const [vndGov, setVndGov] = useState('القاهرة');
  const [vndRegion, setVndRegion] = useState('');
  const [vndAddress, setVndAddress] = useState('');
  const [vndContactPerson, setVndContactPerson] = useState('');
  const [vndContactPhone, setVndContactPhone] = useState('');
  const [vndBankName, setVndBankName] = useState('');
  const [vndBankIban, setVndBankIban] = useState('');
  const [vndCreditLimit, setVndCreditLimit] = useState(50000);
  const [vndTerms, setVndTerms] = useState(30);
  const [vndRating, setVndRating] = useState(5);
  const [vndNotes, setVndNotes] = useState('');

  // ==========================================
  // 3. EMPLOYEE STATE
  // ==========================================
  const [empName, setEmpName] = useState('');
  const [empJobTitle, setEmpJobTitle] = useState('مندوب مبيعات وتوزيع');
  const [empDepartment, setEmpDepartment] = useState('إدارة المبيعات والتسويق');
  const [empBranch, setEmpBranch] = useState('المقر الرئيسي - الإدارة العامة');
  const [empContractType, setEmpContractType] = useState<any>('full_time');
  const [empGov, setEmpGov] = useState('القاهرة');
  const [empRegion, setEmpRegion] = useState('');
  const [empAddress, setEmpAddress] = useState('');
  const [empGender, setEmpGender] = useState<'male' | 'female'>('male');
  const [empBirthDate, setEmpBirthDate] = useState('1994-05-15');
  const [empHireDate, setEmpHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empNationalId, setEmpNationalId] = useState('');
  const [empEmergencyName, setEmpEmergencyName] = useState('');
  const [empEmergencyPhone, setEmpEmergencyPhone] = useState('');
  const [empBasicSalary, setEmpBasicSalary] = useState(6000);
  const [empHousing, setEmpHousing] = useState(1000);
  const [empTransport, setEmpTransport] = useState(500);
  const [empOtherAllowances, setEmpOtherAllowances] = useState(0);
  const [empBankName, setEmpBankName] = useState('البنك التجاري الدولي (CIB)');
  const [empBankIban, setEmpBankIban] = useState('');
  const [empIsSalesRep, setEmpIsSalesRep] = useState(true);
  const [empCommissionRate, setEmpCommissionRate] = useState(3);
  const [empSalesTarget, setEmpSalesTarget] = useState(80000);
  const [empNotes, setEmpNotes] = useState('');
  const [empPhotoBase64, setEmpPhotoBase64] = useState<string | undefined>(undefined);

  // ==========================================
  // 4. PRODUCT STATE
  // ==========================================
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('إلكترونيات وأجهزة');
  const [prodBrand, setProdBrand] = useState('ORBIX Enterprise');
  const [prodOrigin, setProdOrigin] = useState('مصر');
  const [prodUnit, setProdUnit] = useState('قطعة (Pcs)');
  const [prodCostPrice, setProdCostPrice] = useState(100);
  const [prodSellingPrice, setProdSellingPrice] = useState(150);
  const [prodWholesalePrice, setProdWholesalePrice] = useState(135);
  const [prodMinPrice, setProdMinPrice] = useState(120);
  const [prodStock, setProdStock] = useState(25);
  const [prodMinAlert, setProdMinAlert] = useState(5);
  const [prodWarehouseId, setProdWarehouseId] = useState(warehouses[0]?.id || 'wh-1');
  const [prodShelf, setProdShelf] = useState('A-01');
  const [prodGov, setProdGov] = useState('القاهرة');
  const [prodSupplierId, setProdSupplierId] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodWeight, setProdWeight] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodImageBase64, setProdImageBase64] = useState<string | undefined>(undefined);
  const [prodHasExpiry, setProdHasExpiry] = useState(false);
  const [prodProductionDate, setProdProductionDate] = useState('');
  const [prodExpiryDate, setProdExpiryDate] = useState('');
  const [prodBatchNumber, setProdBatchNumber] = useState('');

  interface QuickAddBatchDraft {
    id: string;
    batchNumber: string;
    productionDate: string;
    expiryDate: string;
    warehouseId: string;
    quantity: number;
  }

  const [prodBatches, setProdBatches] = useState<QuickAddBatchDraft[]>([
    {
      id: 'batch-init-1',
      batchNumber: 'LOT-2026-01',
      productionDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      warehouseId: warehouses[0]?.id || 'wh-1',
      quantity: 25,
    },
  ]);

  const handleAddBatchRow = () => {
    const nextIdx = prodBatches.length + 1;
    setProdBatches((prev) => [
      ...prev,
      {
        id: `batch-${Date.now()}-${nextIdx}`,
        batchNumber: `LOT-2026-${nextIdx.toString().padStart(2, '0')}`,
        productionDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        warehouseId: prodWarehouseId || warehouses[0]?.id || 'wh-1',
        quantity: 10,
      },
    ]);
  };

  const handleRemoveBatchRow = (id: string) => {
    if (prodBatches.length <= 1) return;
    setProdBatches((prev) => prev.filter((b) => b.id !== id));
  };

  const handleBatchFieldChange = (id: string, field: keyof QuickAddBatchDraft, value: any) => {
    setProdBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  if (!isOpen) return null;

  // Regions lookup helpers
  const custRegions = getRegionsForGovernorate(custGov);
  const vndRegions = getRegionsForGovernorate(vndGov);
  const empRegions = getRegionsForGovernorate(empGov);

  // Generate random barcode
  const handleGenerateBarcode = () => {
    const code = '622' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    setProdBarcode(code);
  };

  // Submit Handlers
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      showAlert({ title: 'تنبيه', message: 'يرجى إدخال اسم العميل بشكل صحيح', type: 'warning' });
      return;
    }

    const assignedRep = salesReps.find((r) => r.id === custSalesRepId);

    const newCust: Omit<Customer, 'id' | 'code' | 'currentBalance'> = {
      name: custName.trim(),
      companyName: custCompany.trim() || custName.trim(),
      phone: custPhone.trim(),
      email: custEmail.trim(),
      taxNumber: custTax.trim() || undefined,
      commercialRegister: custCommercialReg.trim() || undefined,
      governorate: custGov,
      region: custRegion.trim() || undefined,
      address: custAddress.trim() || `${custGov} - ${custRegion}`,
      contactPerson: custContactPerson.trim() || undefined,
      contactPersonPhone: custContactPhone.trim() || undefined,
      customerCategory: custCategory,
      acquisitionChannel: custChannel,
      salesRepId: custSalesRepId || undefined,
      salesRepName: assignedRep?.name,
      priceListId: custPriceListId || undefined,
      creditLimit: Number(custCreditLimit) || 0,
      paymentTermsDays: Number(custTerms) || 0,
      status: 'active',
      loyaltyPoints: 0,
      notes: custNotes.trim() || undefined,
    };

    addCustomer(newCust);
    showAlert({
      title: 'تمت الإضافة بنجاح',
      message: `تم إضافة العميل "${custName}" وتخصيص المحافظة (${custGov}) والتصنيف بنجاح.`,
      type: 'success',
    });
    if (onSuccess) onSuccess('customer', newCust);
    onClose();
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vndName.trim()) {
      showAlert({ title: 'تنبيه', message: 'يرجى إدخال اسم المورد أو الشركة', type: 'warning' });
      return;
    }

    const newVnd: Omit<Vendor, 'id' | 'code' | 'currentBalance'> = {
      name: vndName.trim(),
      companyName: vndCompany.trim() || vndName.trim(),
      category: vndCategory,
      phone: vndPhone.trim(),
      email: vndEmail.trim(),
      taxNumber: vndTax.trim() || undefined,
      commercialRegister: vndCommercialReg.trim() || undefined,
      governorate: vndGov,
      region: vndRegion.trim() || undefined,
      address: vndAddress.trim() || `${vndGov} - ${vndRegion}`,
      contactPerson: vndContactPerson.trim() || undefined,
      contactPersonPhone: vndContactPhone.trim() || undefined,
      bankName: vndBankName.trim() || undefined,
      bankIban: vndBankIban.trim() || undefined,
      creditLimit: Number(vndCreditLimit) || 0,
      paymentTermsDays: Number(vndTerms) || 0,
      rating: Number(vndRating) || 5,
      notes: vndNotes.trim() || undefined,
    };

    addVendor(newVnd);
    showAlert({
      title: 'تمت الإضافة بنجاح',
      message: `تم إضافة المورد "${vndName}" وربطه بالبيانات الجغرافية والضريبية بنجاح.`,
      type: 'success',
    });
    if (onSuccess) onSuccess('vendor', newVnd);
    onClose();
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) {
      showAlert({ title: 'تنبيه', message: 'يرجى إدخال اسم الموظف بالكامل', type: 'warning' });
      return;
    }

    const newEmp: Omit<Employee, 'id' | 'employeeCode'> = {
      name: empName.trim(),
      jobTitle: empJobTitle.trim(),
      department: empDepartment.trim(),
      branch: empBranch.trim(),
      contractType: empContractType,
      governorate: empGov,
      region: empRegion.trim() || undefined,
      address: empAddress.trim() || `${empGov} - ${empRegion}`,
      gender: empGender,
      birthDate: empBirthDate,
      hireDate: empHireDate,
      phone: empPhone.trim(),
      email: empEmail.trim(),
      nationalId: empNationalId.trim(),
      emergencyContactName: empEmergencyName.trim() || undefined,
      emergencyContactPhone: empEmergencyPhone.trim() || undefined,
      basicSalary: Number(empBasicSalary) || 0,
      housingAllowance: Number(empHousing) || 0,
      transportAllowance: Number(empTransport) || 0,
      otherAllowances: Number(empOtherAllowances) || 0,
      socialInsuranceEmployeeRate: 11,
      socialInsuranceCompanyRate: 18.75,
      taxDeductionRate: 5,
      status: 'active',
      bankName: empBankName.trim(),
      bankIban: empBankIban.trim(),
      photoBase64: empPhotoBase64 || undefined,
      isSalesRep: empIsSalesRep,
      commissionRate: empIsSalesRep ? Number(empCommissionRate) || 0 : undefined,
      monthlySalesTarget: empIsSalesRep ? Number(empSalesTarget) || 0 : undefined,
      salesTarget: empIsSalesRep ? Number(empSalesTarget) || 0 : undefined,
      notes: empNotes.trim() || undefined,
    };

    addEmployee(newEmp);
    showAlert({
      title: 'تمت إضافة الموظف',
      message: `تم تسجيل الموظف "${empName}" (${empJobTitle}) في المنظومة بنجاح.`,
      type: 'success',
    });
    if (onSuccess) onSuccess('employee', newEmp);
    onClose();
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      showAlert({ title: 'تنبيه', message: 'يرجى إدخال اسم الصنف / المنتج', type: 'warning' });
      return;
    }

    const preferredSupplier = vendors.find((v) => v.id === prodSupplierId);
    const primaryBatch = prodHasExpiry && prodBatches.length > 0 ? (prodBatches.find((b) => b.expiryDate) || prodBatches[0]) : null;

    const totalCalculatedStock = prodHasExpiry && prodBatches.length > 0
      ? prodBatches.reduce((acc, b) => acc + (Number(b.quantity) || 0), 0)
      : (Number(prodStock) || 0);

    const newProd: Omit<Product, 'id'> = {
      sku: '',
      name: prodName.trim(),
      category: prodCategory.trim(),
      brand: prodBrand.trim() || undefined,
      originCountry: prodOrigin.trim() || undefined,
      unit: prodUnit,
      costPrice: Number(prodCostPrice) || 0,
      sellingPrice: Number(prodSellingPrice) || 0,
      wholesalePrice: Number(prodWholesalePrice) || undefined,
      minSellingPrice: Number(prodMinPrice) || undefined,
      stockQuantity: totalCalculatedStock,
      minStockAlert: Number(prodMinAlert) || 5,
      warehouseId: prodWarehouseId || 'wh-1',
      shelfLocation: prodShelf.trim() || undefined,
      governorate: prodGov,
      supplierId: prodSupplierId || undefined,
      supplierName: preferredSupplier?.name,
      barcode: prodBarcode.trim() || undefined,
      weight: prodWeight.trim() || undefined,
      description: prodDescription.trim() || undefined,
      hasExpiry: prodHasExpiry,
      productionDate: prodHasExpiry ? (primaryBatch?.productionDate || prodProductionDate || undefined) : undefined,
      expiryDate: prodHasExpiry ? (primaryBatch?.expiryDate || prodExpiryDate || undefined) : undefined,
      batchNumber: prodHasExpiry ? (primaryBatch?.batchNumber?.trim() || prodBatchNumber.trim() || undefined) : undefined,
      imageBase64: prodImageBase64 || undefined,
    };

    const createdProduct = addProduct(newProd);

    if (prodHasExpiry && prodBatches.length > 0 && createdProduct?.id) {
      syncProductBatches(
        createdProduct.id,
        prodBatches.map((b) => ({
          ...b,
          productId: createdProduct.id,
          productName: prodName.trim(),
          sku: createdProduct.sku || '',
          costPrice: Number(prodCostPrice) || 0,
          sellingPrice: Number(prodSellingPrice) || 0,
        }))
      );
    }

    showAlert({
      title: 'تمت إضافة المنتج',
      message: `تم إضافة المنتج "${prodName}" بسعر بيع ${formatMoney(prodSellingPrice)} وتكلفة ${formatMoney(prodCostPrice)}${prodHasExpiry ? ` مع تسجيل ${prodBatches.length} تشغيلة/باتش.` : '.'}`,
      type: 'success',
    });
    if (onSuccess) onSuccess('product', createdProduct || newProd);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs select-none overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl flex flex-col my-auto max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Title and Unified Navigation Tabs */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-white flex items-center gap-2">
                  <span>الإضافة السريعة والشاملة</span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-mono">
                    Quick CRM & Entity Registry
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  أضف موردين، عملاء، موظفين، ومنتجات جديدة بكافة التفاصيل الجغرافية والتحليلية
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-950/70 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('customer')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'customer'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>عميل جديد</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vendor')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'vendor'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>مورد جديد</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('employee')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'employee'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>موظف جديد</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('product')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'product'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PackagePlus className="w-4 h-4" />
              <span>منتج جديد</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {/* ========================================================================= */}
          {/* TAB 1: CUSTOMER FORM                                                      */}
          {/* ========================================================================= */}
          {activeTab === 'customer' && (
            <form onSubmit={handleSaveCustomer} className="space-y-5">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>البيانات الأساسية للعميل والشركة</span>
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    متاح للـ CRM والفواتير
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>اسم العميل / الاسم التجاري</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: شركة الأمل للتجارة والمقاولات"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الاسم المؤسسي / المسجل</label>
                    <input
                      type="text"
                      placeholder="اسم الشركة الرسمي"
                      value={custCompany}
                      onChange={(e) => setCustCompany(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">تصنيف العميل (CRM Tier)</label>
                    <select
                      value={custCategory}
                      onChange={(e) => setCustCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {CUSTOMER_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">قناة الاستقطاب / المصدر</label>
                    <select
                      value={custChannel}
                      onChange={(e) => setCustChannel(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {ACQUISITION_CHANNELS.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">مندوب المبيعات المسؤول</label>
                    <SearchableSelect
                      value={custSalesRepId}
                      onChange={(val) => setCustSalesRepId(val)}
                      placeholder="-- بدون تعيين مندوب محدد --"
                      searchPlaceholder="ابحث باسم المندوب..."
                      options={[
                        { value: '', label: '-- بدون تعيين مندوب محدد --' },
                        ...salesReps.map((rep) => ({
                          value: rep.id,
                          label: `${rep.name} (${rep.code})`,
                          subLabel: rep.phone,
                        })),
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Geographic & Contact Details */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>البيانات الجغرافية والعنوان والتواصل</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">المحافظة / الإمارة</label>
                    <SearchableSelect
                      value={custGov}
                      onChange={(val) => {
                        setCustGov(val);
                        setCustRegion('');
                      }}
                      placeholder="اختر المحافظة..."
                      searchPlaceholder="ابحث باسم المحافظة أو الدولة..."
                      options={GOVERNORATES_DATA.map((g) => ({
                        value: g.name,
                        label: `${g.name} (${g.country})`,
                      }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">المنطقة / الحي / المدينة</label>
                    <input
                      type="text"
                      list="cust-regions-list"
                      placeholder="اختر أو اكتب المنطقة..."
                      value={custRegion}
                      onChange={(e) => setCustRegion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                    <datalist id="cust-regions-list">
                      {custRegions.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">رقم الهاتف / الموبايل</label>
                    <input
                      type="text"
                      placeholder="01xxxxxxxxx"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">البريد الإلكتروني</label>
                    <input
                      type="email"
                      placeholder="client@company.com"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">العنوان التفصيلي / الشارع والمبنى</label>
                    <input
                      type="text"
                      placeholder="مثال: 15 شارع النصر، عمارة الأمل، الدور الثالث"
                      value={custAddress}
                      onChange={(e) => setCustAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الشخص المسؤول (Contact Person)</label>
                    <input
                      type="text"
                      placeholder="اسم مسؤول المشتريات"
                      value={custContactPerson}
                      onChange={(e) => setCustContactPerson(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">هاتف الشخص المسؤول</label>
                    <input
                      type="text"
                      placeholder="موبايل المسؤول المباشر"
                      value={custContactPhone}
                      onChange={(e) => setCustContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Tax & Financial Terms */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>البيانات الضريبية وشروط الائتمان والأسعار</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الرقم الضريبي (VAT ID)</label>
                    <input
                      type="text"
                      placeholder="300xxxxxxxxx"
                      value={custTax}
                      onChange={(e) => setCustTax(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">السجل التجاري (CR)</label>
                    <input
                      type="text"
                      placeholder="1010xxxxxx"
                      value={custCommercialReg}
                      onChange={(e) => setCustCommercialReg(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الحد الائتماني (Credit Limit)</label>
                    <input
                      type="number"
                      min="0"
                      value={custCreditLimit}
                      onChange={(e) => setCustCreditLimit(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">أيام السداد والائتمان</label>
                    <input
                      type="number"
                      min="0"
                      value={custTerms}
                      onChange={(e) => setCustTerms(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ العميل في النظام</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: VENDOR / SUPPLIER FORM                                             */}
          {/* ========================================================================= */}
          {activeTab === 'vendor' && (
            <form onSubmit={handleSaveVendor} className="space-y-5">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>بيانات المورد والشركة وسلاسل الإمداد</span>
                  </h4>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                    متاح للمشتريات وفواتير التوريد
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>اسم المورد / الشركة الموردة</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: شركة النور للصناعات والتوريدات العمومية"
                      value={vndName}
                      onChange={(e) => setVndName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">تصنيف المورد</label>
                    <select
                      value={vndCategory}
                      onChange={(e) => setVndCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {VENDOR_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">المحافظة / الإمارة</label>
                    <select
                      value={vndGov}
                      onChange={(e) => {
                        setVndGov(e.target.value);
                        setVndRegion('');
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {GOVERNORATES_DATA.map((g) => (
                        <option key={g.name} value={g.name}>
                          {g.name} ({g.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">المنطقة / الحي</label>
                    <input
                      type="text"
                      list="vnd-regions-list"
                      placeholder="المنطقة الصناعية أو الحي..."
                      value={vndRegion}
                      onChange={(e) => setVndRegion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                    <datalist id="vnd-regions-list">
                      {vndRegions.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">رقم الهاتف / الموبايل</label>
                    <input
                      type="text"
                      placeholder="01xxxxxxxxx"
                      value={vndPhone}
                      onChange={(e) => setVndPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Contact, Bank and Credit Info */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>البيانات البنكية، جهة الاتصال والائتمان</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">مندوب المورد / المسؤول</label>
                    <input
                      type="text"
                      placeholder="اسم مندوب الشركة الموردة"
                      value={vndContactPerson}
                      onChange={(e) => setVndContactPerson(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">هاتف المندوب</label>
                    <input
                      type="text"
                      placeholder="موبايل المندوب المباشر"
                      value={vndContactPhone}
                      onChange={(e) => setVndContactPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">اسم البنك المعتمد</label>
                    <input
                      type="text"
                      placeholder="البنك الأهلي، CIB، الراجحي..."
                      value={vndBankName}
                      onChange={(e) => setVndBankName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">رقم الحساب / IBAN</label>
                    <input
                      type="text"
                      placeholder="EGxxxxxxxxxxxxxx"
                      value={vndBankIban}
                      onChange={(e) => setVndBankIban(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الرقم الضريبي (VAT)</label>
                    <input
                      type="text"
                      placeholder="300xxxxxxxxx"
                      value={vndTax}
                      onChange={(e) => setVndTax(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">السجل التجاري (CR)</label>
                    <input
                      type="text"
                      placeholder="1010xxxxxx"
                      value={vndCommercialReg}
                      onChange={(e) => setVndCommercialReg(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">فترة السداد (أيام)</label>
                    <input
                      type="number"
                      min="0"
                      value={vndTerms}
                      onChange={(e) => setVndTerms(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">سقف الائتمان الممنوح لنا</label>
                    <input
                      type="number"
                      min="0"
                      value={vndCreditLimit}
                      onChange={(e) => setVndCreditLimit(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ المورد في المنظومة</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: EMPLOYEE FORM                                                      */}
          {/* ========================================================================= */}
          {activeTab === 'employee' && (
            <form onSubmit={handleSaveEmployee} className="space-y-5">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span>البيانات الوظيفية والتعاقدية للموظف</span>
                  </h4>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    متاح للموارد البشرية ومسيرات الرواتب
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>اسم الموظف بالكامل (كما في بطاقة الهوية)</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد محمد عبد الرحمن علي"
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">المسمى الوظيفي</label>
                    <input
                      type="text"
                      value={empJobTitle}
                      onChange={(e) => setEmpJobTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">القسم / الإدارة</label>
                    <input
                      type="text"
                      value={empDepartment}
                      onChange={(e) => setEmpDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الفرع ومقر العمل</label>
                    <input
                      type="text"
                      placeholder="الفرع الرئيسي"
                      value={empBranch}
                      onChange={(e) => setEmpBranch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">نوع العقد</label>
                    <select
                      value={empContractType}
                      onChange={(e) => setEmpContractType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {CONTRACT_TYPES.map((ct) => (
                        <option key={ct.id} value={ct.id}>
                          {ct.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Personal & Geographic Info */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>البيانات الشخصية، العنوان والطوارئ</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">المحافظة / الإمارة</label>
                    <select
                      value={empGov}
                      onChange={(e) => {
                        setEmpGov(e.target.value);
                        setEmpRegion('');
                      }}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {GOVERNORATES_DATA.map((g) => (
                        <option key={g.name} value={g.name}>
                          {g.name} ({g.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">المنطقة / الحي</label>
                    <input
                      type="text"
                      list="emp-regions-list"
                      placeholder="المنطقة أو المدينة..."
                      value={empRegion}
                      onChange={(e) => setEmpRegion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                    <datalist id="emp-regions-list">
                      {empRegions.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الرقم القومي / الهوية الوطنية</label>
                    <input
                      type="text"
                      placeholder="29xxxxxxxxx"
                      value={empNationalId}
                      onChange={(e) => setEmpNationalId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">رقم الهاتف / الموبايل</label>
                    <input
                      type="text"
                      placeholder="01xxxxxxxxx"
                      value={empPhone}
                      onChange={(e) => setEmpPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">شخص للطوارئ (اسم)</label>
                    <input
                      type="text"
                      placeholder="اسم القريب / الطوارئ"
                      value={empEmergencyName}
                      onChange={(e) => setEmpEmergencyName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">هاتف الطوارئ</label>
                    <input
                      type="text"
                      placeholder="هاتف الطوارئ"
                      value={empEmergencyPhone}
                      onChange={(e) => setEmpEmergencyPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">تاريخ التعيين والالتحاق</label>
                    <input
                      type="date"
                      value={empHireDate}
                      onChange={(e) => setEmpHireDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Salary & Sales Rep Flags */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>الراتب والبدلات وخطة المبيعات والعمولات</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الراتب الأساسي</label>
                    <input
                      type="number"
                      min="0"
                      value={empBasicSalary}
                      onChange={(e) => setEmpBasicSalary(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">بدل السكن</label>
                    <input
                      type="number"
                      min="0"
                      value={empHousing}
                      onChange={(e) => setEmpHousing(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">بدل الانتقال / الوقود</label>
                    <input
                      type="number"
                      min="0"
                      value={empTransport}
                      onChange={(e) => setEmpTransport(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">البنك المحول إليه</label>
                    <input
                      type="text"
                      value={empBankName}
                      onChange={(e) => setEmpBankName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Photo & Notes */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {empPhotoBase64 ? (
                      <img src={empPhotoBase64} alt="الموظف" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <label className="text-xs font-bold text-slate-700 block mb-1">صورة الموظف الشخصية (اختياري)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setEmpPhotoBase64(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-0 file:ml-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>
                  {empPhotoBase64 && (
                    <button
                      type="button"
                      onClick={() => setEmpPhotoBase64(undefined)}
                      className="text-xs text-rose-500 hover:underline"
                    >
                      إزالة الصورة
                    </button>
                  )}
                </div>

                {/* Sales Rep Toggle */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={empIsSalesRep}
                      onChange={(e) => setEmpIsSalesRep(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-emerald-950">
                      يعمل كمندوب مبيعات وله عمولات ومستهدف بيعي (Sales Representative)
                    </span>
                  </label>

                  {empIsSalesRep && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="text-slate-600">نسبة العمولة:</span>
                        <div className="relative w-20">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={empCommissionRate}
                            onChange={(e) => setEmpCommissionRate(Number(e.target.value))}
                            className="w-full bg-white border border-emerald-300 rounded-lg px-2 py-1 text-xs font-bold text-emerald-900 text-center"
                          />
                          <span className="absolute left-1.5 top-1 text-[11px] text-slate-400">%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="text-slate-600">الهدف الشهري:</span>
                        <input
                          type="number"
                          min="0"
                          value={empSalesTarget}
                          onChange={(e) => setEmpSalesTarget(Number(e.target.value))}
                          className="w-28 bg-white border border-emerald-300 rounded-lg px-2 py-1 text-xs font-bold font-mono text-emerald-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ الموظف في النظام</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PRODUCT FORM                                                       */}
          {/* ========================================================================= */}
          {activeTab === 'product' && (
            <form onSubmit={handleSaveProduct} className="space-y-5">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <PackagePlus className="w-4 h-4 text-emerald-600" />
                    <span>البيانات الأساسية للصنف والتصنيف</span>
                  </h4>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    متاح للمخازن والمبيعات والـ POS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>اسم المنتج / الصنف التجاري</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: شاشة لمس نقطة بيع POS Touch Screen 15.6 Inch"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">التصنيف / الفئة</label>
                    <input
                      type="text"
                      placeholder="أجهزة، قطع غيار، مواد خام..."
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الماركة / العلامة التجارية</label>
                    <input
                      type="text"
                      list="prod-brands-list"
                      placeholder="الماركة أو البراند..."
                      value={prodBrand}
                      onChange={(e) => setProdBrand(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                    <datalist id="prod-brands-list">
                      {PRODUCT_BRANDS.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">بلد المنشأ</label>
                    <input
                      type="text"
                      placeholder="مصر، الصين، ألمانيا..."
                      value={prodOrigin}
                      onChange={(e) => setProdOrigin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">وحدة القياس</label>
                    <select
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {PRODUCT_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Profit Margins */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>الأسعار، التكاليف وهامش الربح</span>
                  </h4>
                  {prodSellingPrice > prodCostPrice && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      هامش الربح المتوقع:{' '}
                      {(
                        ((prodSellingPrice - prodCostPrice) / (prodSellingPrice || 1)) *
                        100
                      ).toFixed(1)}
                      % ({formatMoney(prodSellingPrice - prodCostPrice)})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">سعر التكلفة (Cost Price)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={prodCostPrice}
                      onChange={(e) => setProdCostPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-emerald-800">سعر البيع الافتراضي</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={prodSellingPrice}
                      onChange={(e) => setProdSellingPrice(Number(e.target.value))}
                      className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-emerald-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">سعر الجملة (Wholesale)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={prodWholesalePrice}
                      onChange={(e) => setProdWholesalePrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الحد الأدنى لسعر البيع</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={prodMinPrice}
                      onChange={(e) => setProdMinPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Warehouse, Stock & Barcode */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>المستودع، الرصيد الافتتاحي والباركود</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">المستودع التخزيني</label>
                    <SearchableSelect
                      value={prodWarehouseId}
                      onChange={(val) => setProdWarehouseId(val)}
                      placeholder="اختر المستودع..."
                      searchPlaceholder="ابحث باسم المستودع..."
                      options={warehouses.map((wh) => ({
                        value: wh.id,
                        label: wh.name,
                        subLabel: wh.location,
                      }))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">المحافظة / الموقع</label>
                    <select
                      value={prodGov}
                      onChange={(e) => setProdGov(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {GOVERNORATES_DATA.map((g) => (
                        <option key={g.name} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">الرصيد الافتتاحي (كمية)</label>
                    <input
                      type="number"
                      min="0"
                      value={prodStock}
                      onChange={(e) => setProdStock(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">حد التنبيه وإعادة الطلب</label>
                    <input
                      type="number"
                      min="0"
                      value={prodMinAlert}
                      onChange={(e) => setProdMinAlert(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>الباركود الدولي (Barcode / EAN)</span>
                      <button
                        type="button"
                        onClick={handleGenerateBarcode}
                        className="text-[11px] text-emerald-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        توليد باركود تلقائي
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="امسح بالباركود أو اكتب الرمز"
                        value={prodBarcode}
                        onChange={(e) => setProdBarcode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden pl-8"
                      />
                      <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">المورد المفضل</label>
                    <SearchableSelect
                      value={prodSupplierId}
                      onChange={(val) => setProdSupplierId(val)}
                      placeholder="-- بدون مورد محدد --"
                      searchPlaceholder="ابحث باسم المورد..."
                      options={[
                        { value: '', label: '-- بدون مورد محدد --' },
                        ...vendors.map((v) => ({
                          value: v.id,
                          label: v.name,
                          subLabel: v.governorate || v.phone,
                        })),
                      ]}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">موقع الرف (Shelf/Bin)</label>
                    <input
                      type="text"
                      placeholder="القطاع A - رف 01"
                      value={prodShelf}
                      onChange={(e) => setProdShelf(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Product Photo & Expiry / Batch Tracking */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>صورة الصنف وتتبع الصلاحية والتشغيلات (Lot / Batch)</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Image Upload */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {prodImageBase64 ? (
                        <img src={prodImageBase64} alt="الصنف" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      <label className="text-xs font-bold text-slate-700 block mb-1">صورة الصنف (اختياري)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setProdImageBase64(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-slate-500 file:mr-0 file:ml-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                      />
                    </div>
                    {prodImageBase64 && (
                      <button
                        type="button"
                        onClick={() => setProdImageBase64(undefined)}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        حذف
                      </button>
                    )}
                  </div>

                  {/* Expiry Checkbox and fields */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodHasExpiry}
                        onChange={(e) => setProdHasExpiry(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        الصنف له تاريخ صلاحية وتتبع رقم تشغيلة (Batch/Expiry)
                      </span>
                    </label>

                    {prodHasExpiry && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            بيانات التشغيلات والباتشات (Multi-Batch Tracking)
                          </span>
                          <button
                            type="button"
                            onClick={handleAddBatchRow}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            + إضافة تشغيلة أخرى
                          </button>
                        </div>

                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {prodBatches.map((batch, idx) => (
                            <div
                              key={batch.id}
                              className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  تشغيلة #{idx + 1}
                                </span>
                                {prodBatches.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBatchRow(batch.id)}
                                    className="text-rose-500 hover:text-rose-700 p-1 text-xs cursor-pointer"
                                    title="حذف هذه التشغيلة"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                <div className="space-y-1 sm:col-span-1">
                                  <label className="text-[10px] font-bold text-slate-500">رقم التشغيلة</label>
                                  <input
                                    type="text"
                                    placeholder="LOT-2026-01"
                                    value={batch.batchNumber}
                                    onChange={(e) => handleBatchFieldChange(batch.id, 'batchNumber', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-mono text-slate-900"
                                  />
                                </div>
                                <div className="space-y-1 sm:col-span-1">
                                  <label className="text-[10px] font-bold text-slate-500">تاريخ الإنتاج</label>
                                  <input
                                    type="date"
                                    value={batch.productionDate}
                                    onChange={(e) => handleBatchFieldChange(batch.id, 'productionDate', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900"
                                  />
                                </div>
                                <div className="space-y-1 sm:col-span-1">
                                  <label className="text-[10px] font-bold text-slate-500">تاريخ الانتهاء</label>
                                  <input
                                    type="date"
                                    value={batch.expiryDate}
                                    onChange={(e) => handleBatchFieldChange(batch.id, 'expiryDate', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900"
                                  />
                                </div>
                                <div className="space-y-1 sm:col-span-1">
                                  <label className="text-[10px] font-bold text-slate-500">المستودع</label>
                                  <select
                                    value={batch.warehouseId}
                                    onChange={(e) => handleBatchFieldChange(batch.id, 'warehouseId', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900"
                                  >
                                    {warehouses.map((w) => (
                                      <option key={w.id} value={w.id}>
                                        {w.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1 sm:col-span-1">
                                  <label className="text-[10px] font-bold text-slate-500">الكمية بالرصيد</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={batch.quantity}
                                    onChange={(e) => handleBatchFieldChange(batch.id, 'quantity', Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-900"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-emerald-50 text-emerald-800 text-[11px] p-2 rounded-xl border border-emerald-200 flex items-center justify-between font-bold">
                          <span>إجمالي رصيد التشغيلات:</span>
                          <span>{prodBatches.reduce((acc, b) => acc + (Number(b.quantity) || 0), 0)} {prodUnit}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ الصنف في المخزون</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
