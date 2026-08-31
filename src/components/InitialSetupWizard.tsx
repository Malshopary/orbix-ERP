import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import {
  Building2,
  ShieldCheck,
  KeyRound,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Calculator,
  Lock,
  Layers,
  Coins,
  Receipt,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  BadgePercent,
  Check,
  Eye,
  EyeOff,
  FolderTree,
  DollarSign
} from 'lucide-react';
import { AppUser, CompanyProfile } from '../types';

export const InitialSetupWizard: React.FC = () => {
  const {
    companyProfile,
    currencies,
    accounts,
    completeInitialSetup,
  } = useErp();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Step 1: Company Profile State
  const [companyForm, setCompanyForm] = useState({
    nameAr: companyProfile.nameAr || 'شركة التجارة والحلول المتكاملة',
    nameEn: companyProfile.nameEn || 'Integrated Solutions & Trading Co.',
    taxNumber: companyProfile.taxNumber || '',
    commercialRegister: companyProfile.commercialRegister || '',
    city: companyProfile.city || 'القاهرة',
    address: companyProfile.address || 'المقر الرئيسي - مبنى الإدارة',
    phone: companyProfile.phone || '',
    mobile: companyProfile.mobile || '',
    email: companyProfile.email || 'info@company.eg',
    defaultCurrency: companyProfile.defaultCurrency || 'EGP',
    defaultVatRate: companyProfile.defaultVatRate ?? 14,
  });

  // Step 2: Super Admin Account State
  const [adminForm, setAdminForm] = useState({
    name: 'م. المدير العام',
    username: 'admin',
    email: 'admin@company.eg',
    phone: '',
    password: '123',
    confirmPassword: '123',
    pin: '1234',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!companyForm.nameAr.trim()) {
      errors.nameAr = 'يرجى إدخال اسم المنشأة / الشركة بالعربية';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Step 2
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!adminForm.name.trim()) {
      errors.name = 'يرجى إدخال اسم المدير بالكامل';
    }
    if (!adminForm.username.trim()) {
      errors.username = 'يرجى إدخال اسم مستخدم الدخول';
    }
    if (!adminForm.password || adminForm.password.length < 3) {
      errors.password = 'كلمة المرور يجب أن لا تقل عن 3 أحرف';
    }
    if (adminForm.password !== adminForm.confirmPassword) {
      errors.confirmPassword = 'كلمتا المرور غير متطابقتين';
    }
    if (!adminForm.pin || adminForm.pin.length !== 4) {
      errors.pin = 'رمز الـ PIN السريع يجب أن يتكون من 4 أرقام';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handlePrevStep = () => {
    setFormErrors({});
    if (currentStep === 2) setCurrentStep(1);
    if (currentStep === 3) setCurrentStep(2);
  };

  const handleFinishSetup = () => {
    if (!validateStep1() || !validateStep2()) return;

    setIsSubmitting(true);

    const updatedProfile: Partial<CompanyProfile> = {
      nameAr: companyForm.nameAr.trim(),
      nameEn: companyForm.nameEn.trim(),
      taxNumber: companyForm.taxNumber.trim(),
      commercialRegister: companyForm.commercialRegister.trim(),
      city: companyForm.city.trim(),
      address: companyForm.address.trim(),
      phone: companyForm.phone.trim(),
      mobile: companyForm.mobile.trim(),
      email: companyForm.email.trim(),
      defaultCurrency: companyForm.defaultCurrency as any,
      defaultVatRate: Number(companyForm.defaultVatRate),
    };

    const newAdminUser: AppUser = {
      id: 'usr-admin-primary',
      name: adminForm.name.trim(),
      username: adminForm.username.trim(),
      password: adminForm.password,
      pin: adminForm.pin.trim(),
      role: 'admin',
      permissions: [
        'dashboard',
        'quick_pos',
        'accounts',
        'inventory',
        'sales',
        'purchases',
        'crm_collections',
        'hr_payroll',
        'financial_reports',
        'settings',
        'erp_blueprint',
      ],
      isActive: true,
      avatarUrl: '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    setTimeout(() => {
      completeInitialSetup(updatedProfile, newAdminUser);
      setIsSubmitting(false);
    }, 600);
  };

  // Group accounts by main category for step 3 preview
  const assetAccounts = accounts.filter((a) => a.type === 'asset');
  const liabilityAccounts = accounts.filter((a) => a.type === 'liability');
  const equityAccounts = accounts.filter((a) => a.type === 'equity');
  const revenueAccounts = accounts.filter((a) => a.type === 'revenue');
  const expenseAccounts = accounts.filter((a) => a.type === 'expense');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md text-white font-bold text-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                تهيئة وإعداد النظام لأول مرة
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                  ترحيب بشركتك الجديدة
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                معالج البدء الفوري وتسجيل المدير العام وضبط الحسابات القياسية
              </p>
            </div>
          </div>

          {/* Step Badges */}
          <div className="hidden md:flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 1
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : currentStep > 1
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>1. بيانات المنشأة</span>
              {currentStep > 1 && <Check className="w-3.5 h-3.5" />}
            </div>

            <div className="w-4 h-0.5 bg-slate-800" />

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 2
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : currentStep > 2
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>2. حساب المدير العام</span>
              {currentStep > 2 && <Check className="w-3.5 h-3.5" />}
            </div>

            <div className="w-4 h-0.5 bg-slate-800" />

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentStep === 3
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>3. شجرة الحسابات والجاهزية</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* STEP 1: COMPANY IDENTITY & FINANCIAL CONFIG */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  الخطوة الأولى: الهوية والبيانات المالية الأساسية
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  معلومات الشركة والمنشأة
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  أدخل البيانات الرسمية للمؤسسة لطباعتها تلقائياً على الفواتير، عروض الأسعار، وسندات القبض والصرف.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Arabic Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم الشركة / المنشأة (بالعربية) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyForm.nameAr}
                    onChange={(e) => setCompanyForm({ ...companyForm, nameAr: e.target.value })}
                    placeholder="مثال: شركة النصر للتجارة والتوريدات"
                    className={`w-full bg-slate-950 border ${
                      formErrors.nameAr ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  {formErrors.nameAr && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.nameAr}</p>
                  )}
                </div>

                {/* English Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم الشركة (بالإنجليزية)
                  </label>
                  <input
                    type="text"
                    value={companyForm.nameEn}
                    onChange={(e) => setCompanyForm({ ...companyForm, nameEn: e.target.value })}
                    placeholder="e.g. Al-Nasr Trading & Supplies Co."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Tax Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>الرقم الضريبي / السجل الضريبي</span>
                    <span className="text-[10px] text-slate-400">للفاتورة الإلكترونية</span>
                  </label>
                  <input
                    type="text"
                    value={companyForm.taxNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, taxNumber: e.target.value })}
                    placeholder="مثال: 300-123-456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Commercial Register */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رقم السجل التجاري
                  </label>
                  <input
                    type="text"
                    value={companyForm.commercialRegister}
                    onChange={(e) => setCompanyForm({ ...companyForm, commercialRegister: e.target.value })}
                    placeholder="مثال: 104523 - القاهرة"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Base Currency */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    العملة الأساسية للنظام والحسابات
                  </label>
                  <select
                    value={companyForm.defaultCurrency}
                    onChange={(e) => setCompanyForm({ ...companyForm, defaultCurrency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default VAT Rate */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <BadgePercent className="w-3.5 h-3.5 text-emerald-400" />
                    نسبة ضريبة القيمة المضافة الافتراضية (%)
                  </label>
                  <select
                    value={companyForm.defaultVatRate}
                    onChange={(e) => setCompanyForm({ ...companyForm, defaultVatRate: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  >
                    <option value={14}>14% (ضريبة القيمة المضافة - مصر)</option>
                    <option value={15}>15% (ضريبة القيمة المضافة - السعودية)</option>
                    <option value={5}>5% (ضريبة القيمة المضافة - الإمارات)</option>
                    <option value={0}>0% (معفى من الضريبة / لا توجد ضريبة)</option>
                  </select>
                </div>

                {/* City & Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    المدينة والدولة
                  </label>
                  <input
                    type="text"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    placeholder="مثال: القاهرة، الرياض، دبي..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Detailed Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    العنوان التفصيلي
                  </label>
                  <input
                    type="text"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    placeholder="مثال: التجمع الخامس - شارع التسعين"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Phone & Mobile */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    هاتف الشركة أو الجوال
                  </label>
                  <input
                    type="text"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    placeholder="مثال: 01012345678"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    البريد الإلكتروني الرسمي
                  </label>
                  <input
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    placeholder="info@company.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SUPER ADMIN ACCOUNT REGISTRATION */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  الخطوة الثانية: تسجيل حساب المدير العام المسؤول
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  إنشاء حساب الإدارة العليا (Super Admin)
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  سيكون لهذا الحساب كامل الصلاحيات الإدارية والمالية وإدارة المستخدمين وإعدادات النظام.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Admin Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الاسم الكامل للمدير <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminForm.name}
                    onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                    placeholder="مثال: م. أحمد محمد عبد الرحمن"
                    className={`w-full bg-slate-950 border ${
                      formErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم المستخدم للدخول (Username) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminForm.username}
                    onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="مثال: admin"
                    className={`w-full bg-slate-950 border ${
                      formErrors.username ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  {formErrors.username && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.username}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>كلمة المرور <span className="text-rose-400">*</span></span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showPassword ? 'إخفاء' : 'إظهار'}
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      placeholder="••••••"
                      className={`w-full bg-slate-950 border ${
                        formErrors.password ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                      } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                    />
                  </div>
                  {formErrors.password && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    تأكيد كلمة المرور <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminForm.confirmPassword}
                    onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                    placeholder="••••••"
                    className={`w-full bg-slate-950 border ${
                      formErrors.confirmPassword ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>

                {/* PIN Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      رمز الـ PIN السريع (4 أرقام) <span className="text-rose-400">*</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-normal">
                      للدخول السريع وشاشات الكاشير POS
                    </span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={adminForm.pin}
                    onChange={(e) => setAdminForm({ ...adminForm, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="1234"
                    className={`w-full bg-slate-950 border ${
                      formErrors.pin ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl px-3.5 py-2.5 text-center tracking-widest text-lg font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all`}
                  />
                  {formErrors.pin && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.pin}</p>
                  )}
                </div>

                {/* Admin Role Badge & Permission Overview */}
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    مستوى الصلاحية الممنوح: مدير عام شامل (Super Admin)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    يشمل إدارة دليل الحسابات، قيود اليومية، فواتير المبيعات ونقاط البيع، المشتريات والموردين، المخزون، الرواتب، وإعدادات الشركة.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STANDARD CHART OF ACCOUNTS & CONFIRMATION */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 mb-2">
                  <FolderTree className="w-3.5 h-3.5" />
                  الخطوة الثالثة: اعتماد الدليل المحاسبي والجاهزية
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  شجرة الحسابات المحاسبية المعتمدة للشركة
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  تم تضمين شجرة الحسابات القياسية للشركات المحاسبية (الأصول، الخصوم، حقوق الملكية، الإيرادات، المصروفات) بـ 0.00 رصيد افتتاحي جاهزة لعملياتك.
                </p>
              </div>

              {/* Summary of 5 Chart of Accounts Roots */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Assets */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      1. الأصول (Assets)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                      {assetAccounts.length} حساب
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• الخزينة الرئيسية والبنوك والمحافظ</li>
                    <li>• العملاء والمدينون ومخزون البضائع</li>
                    <li>• الأصول الثابتة ونقاط البيع POS</li>
                  </ul>
                </div>

                {/* 2. Liabilities */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-rose-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                      2. الخصوم والالتزامات (Liabilities)
                    </span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono">
                      {liabilityAccounts.length} حساب
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• الموردون والدائنون وأوراق الدفع</li>
                    <li>• ضريبة القيمة المضافة مخرجات</li>
                    <li>• مخصص الرواتب والأجور المستحقة</li>
                  </ul>
                </div>

                {/* 3. Equity */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                      3. حقوق الملكية (Equity)
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono">
                      {equityAccounts.length} حساب
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• رأس المال المدفوع التأسيسي</li>
                    <li>• الأرباح المدورة والمحتجزة</li>
                    <li>• جاري الشركاء والاحتياطيات</li>
                  </ul>
                </div>

                {/* 4. Revenue */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      4. الإيرادات والمبيعات (Revenue)
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono">
                      {revenueAccounts.length} حساب
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• إيرادات مبيعات المنتجات وPOS</li>
                    <li>• إيرادات الخدمات والصيانة</li>
                    <li>• الخصومات والعوائد الأخرى</li>
                  </ul>
                </div>

                {/* 5. Expenses */}
                <div className="bg-slate-950/90 rounded-2xl p-4 border border-amber-500/30 sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      5. المصروفات والتكاليف (Expenses)
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                      {expenseAccounts.length} حساب
                    </span>
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li>• تكلفة البضاعة المباعة (COGS) ومصروفات الرواتب والأجور</li>
                    <li>• الإيجار والمرافق والتسويق والشحن والصيانة ورسوم البنوك والإهلاك</li>
                  </ul>
                </div>
              </div>

              {/* System State Notice */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-0.5">جاهزية النظام النظيف:</strong>
                  تم تجهيز قاعدة البيانات بحالة فارغة 100% (بدون فواتير تجريبية أو قيود وهمية سابقة)، لتتمكن من إدخال منتجاتك وعملائك ومورديك وفواتيرك الحقيقية من اليوم الأول.
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="border-t border-slate-800 pt-6 mt-8 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                السابق
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <span>متابعة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishSetup}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-bold px-8 py-3 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer shadow-xl shadow-emerald-500/25 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{isSubmitting ? 'جاري حفظ وتفعيل النظام...' : 'حفظ وتفعيل النظام وبدء الاستخدام الفوري'}</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        منظومة تخطيط الموارد ERP والمحاسبة المالية الذكية • الإصدار الموحد
      </footer>
    </div>
  );
};
