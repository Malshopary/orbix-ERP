import React from 'react';
import { useErp } from '../context/ErpContext';
import { Currency } from '../types';
import { 
  Building2, 
  RotateCcw, 
  Download, 
  CheckCircle2, 
  Coins,
  ShieldCheck,
  Zap,
  Sliders,
  UserCheck,
  LogOut,
  Sparkles
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface NavbarProps {
  onOpenLoginModal: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLoginModal, setActiveTab }) => {
  const { currency, setCurrency, resetToDefaultData, exportDataJSON, companyProfile, currentUser, logout } = useErp();

  const currencies: { code: Currency; label: string }[] = [
    { code: 'EGP', label: 'جنيه مصري (EGP)' },
    { code: 'SAR', label: 'ريال سعودي (SAR)' },
    { code: 'AED', label: 'درهم إماراتي (AED)' },
    { code: 'USD', label: 'دولار أمريكي (USD)' },
  ];

  const roleNameMap: Record<string, string> = {
    admin: 'مدير عام',
    accountant: 'محاسب',
    sales_cashier: 'كاشير POS',
    warehouse_keeper: 'أمين مخزن',
    hr_manager: 'مدير HR',
    auditor: 'مراجع',
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-sm overflow-hidden p-1 border border-slate-800">
              {companyProfile.logoBase64 ? (
                <img
                  src={companyProfile.logoBase64}
                  alt="Company Logo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <Building2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                  {companyProfile.nameAr}
                </h1>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  ERP متكامل
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                الحسابات، المخازن، نقطة البيع السريعة، المشتريات، CRM، والرواتب
              </p>
            </div>
          </div>

          {/* Quick Actions & User Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick POS Shortcut Button */}
            <button
              type="button"
              onClick={() => setActiveTab('quick_pos')}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-500 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">فاتورة سريعة POS</span>
            </button>

            {/* Currency Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <Coins className="w-3.5 h-3.5 text-slate-500 mx-1 hidden sm:block" />
              <select
                id="currency-selector"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden py-1 px-1.5 cursor-pointer"
                title="تغيير عملة النظام"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Current User & Login Switcher */}
            {currentUser ? (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1 pr-2.5 rounded-xl transition-all text-right cursor-pointer"
                title="انقر لتبديل المستخدم أو تسجيل الخروج"
              >
                <div className="hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold block">
                    {roleNameMap[currentUser.role] || currentUser.role}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-700">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-slate-800 shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>تسجيل الدخول</span>
              </button>
            )}

            {/* Settings Quick Icon */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-colors cursor-pointer"
              title="مركز الإعدادات والأمان"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
