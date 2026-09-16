import React, { useState, useRef, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { Currency } from '../types';
import { 
  ChevronDown,
  ShieldCheck,
  Users,
  Sliders,
  LogOut,
  UserCheck,
  Share2,
  Menu,
  CheckSquare,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { OrbixLogo } from './OrbixLogo';
import { GlobalQuickSearch } from './GlobalQuickSearch';
import { OnlineUsersModal } from './OnlineUsersModal';
import { TeamCollaborationDrawer } from './TeamCollaborationDrawer';

interface NavbarProps {
  onOpenLoginModal: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenLoginModal, 
  setActiveTab,
  onOpenMobileMenu,
}) => {
  const { 
    currency, 
    setCurrency, 
    currencies: contextCurrencies, 
    companyProfile, 
    currentUser, 
    logout,
    users = [],
    navigateTo,
    pendingTasksCount = 0,
    awaitingApprovalTasksCount = 0,
  } = useErp();

  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCollaborationOpen, setIsCollaborationOpen] = useState(false);
  const [collaborationDefaultTab, setCollaborationDefaultTab] = useState<'tasks' | 'chat'>('tasks');
  const [collaborationOpenNewTask, setCollaborationOpenNewTask] = useState(false);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Listen to external triggers to open team collaboration drawer
  useEffect(() => {
    const handleOpenCollab = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: 'tasks' | 'chat'; openNewTask?: boolean }>;
      if (customEvent.detail?.tab) {
        setCollaborationDefaultTab(customEvent.detail.tab);
      }
      setCollaborationOpenNewTask(Boolean(customEvent.detail?.openNewTask));
      setIsCollaborationOpen(true);
    };
    window.addEventListener('orbix:open-collaboration', handleOpenCollab);
    return () => window.removeEventListener('orbix:open-collaboration', handleOpenCollab);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(e.target as Node)) {
        setIsCurrencyMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currenciesList = contextCurrencies && contextCurrencies.length > 0 
    ? contextCurrencies 
    : [
        { code: 'EGP', name: 'جنيه مصري', symbol: 'ج.م', rateToBase: 1 },
        { code: 'SAR', name: 'ريال سعودي', symbol: 'ر.س', rateToBase: 13.33 },
        { code: 'AED', name: 'درهم إماراتي', symbol: 'د.إ', rateToBase: 13.61 },
        { code: 'USD', name: 'دولار أمريكي', symbol: '$', rateToBase: 50 },
      ];

  const currentCurrencyObj = currenciesList.find((c) => c.code.toUpperCase() === currency.toUpperCase()) || {
    code: currency,
    name: currency,
    symbol: currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'SAR' ? 'ر.س' : 'ج.م',
  };

  const roleNameMap: Record<string, string> = {
    admin: 'مدير عام / أدمن',
    accountant: 'محاسب مالي',
    sales_cashier: 'كاشير POS',
    warehouse_keeper: 'أمين مخزن',
    hr_manager: 'مدير موارد بشرية',
    auditor: 'مراجع حسابات',
  };

  const activeUsersCount = users.filter((u) => u.isActive !== false).length;

  return (
    <>
      <header className="bg-white border-b border-slate-200 shrink-0 z-30 shadow-xs print:hidden print-hide">
        <div className="w-full px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
            {/* Right Side (in RTL): Company Profile Logo & Info */}
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              {/* Company Profile Logo & Business Details */}
              <div 
                className="flex items-center gap-1.5 sm:gap-3 cursor-pointer group min-w-0" 
                onClick={() => setActiveTab('dashboard')}
                title="الرئيسية - بيانات المنشأة"
              >
                {/* Company Logo / Brand Icon */}
                <div className="flex items-center justify-center shrink-0 bg-slate-100/90 border border-slate-200/90 rounded-xl p-1 sm:p-1.5 min-w-[34px] sm:min-w-[42px] h-9 sm:h-11 transition-all group-hover:bg-slate-200/70 shadow-2xs">
                  {companyProfile.logoBase64 ? (
                    <img 
                      src={companyProfile.logoBase64} 
                      alt={companyProfile.nameAr} 
                      className="h-full w-auto max-w-[70px] sm:max-w-[130px] object-contain rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <OrbixLogo size="sm" variant="icon" />
                    </div>
                  )}
                </div>

                {/* Company Business Information */}
                <div className="flex flex-col text-right border-r border-slate-200 pr-2 sm:pr-3 mr-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors truncate max-w-[200px] sm:max-w-md md:max-w-lg lg:max-w-xl">
                      {companyProfile.nameAr || 'منظومة أوربكس ERP'}
                    </h1>
                  </div>

                  {/* Commercial Register & Tax ID Badges - Visible on Desktop & Tablets (sm and up) */}
                  <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex-wrap">
                    {companyProfile.commercialRegister ? (
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/80 font-mono text-slate-700">
                        <span className="font-bold text-slate-500 font-sans">س.ت:</span>
                        <span className="font-bold">{companyProfile.commercialRegister}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">النظام السحابي</span>
                    )}

                    {companyProfile.taxNumber && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/80 font-mono text-emerald-800">
                        <span className="font-bold text-emerald-600 font-sans">ر.ض:</span>
                        <span className="font-bold">{companyProfile.taxNumber}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Center Quick Live Global Search Bar */}
            <GlobalQuickSearch />

            {/* Quick Actions & User Bar */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Currency Selector Icon Button - Desktop Only (lg and up) */}
              <div className="hidden lg:block relative" ref={currencyMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsCurrencyMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/90 text-slate-800 border border-slate-200/90 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer group"
                  title={`العملة الحالية: ${currentCurrencyObj.name} (${currentCurrencyObj.code}) - انقر للتغيير`}
                >
                  <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-bold text-xs flex items-center justify-center font-mono">
                    {currentCurrencyObj.symbol || '$'}
                  </div>
                  <span className="text-xs font-bold font-mono text-slate-900 hidden xs:inline">
                    {currentCurrencyObj.code}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-transform ${isCurrencyMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isCurrencyMenuOpen && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-500">
                      اختر عملة النظام الرئيسية:
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                      {currenciesList.map((c) => {
                        const isSelected = c.code.toUpperCase() === currency.toUpperCase();
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setCurrency(c.code as Currency);
                              setIsCurrencyMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold text-right transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-900 font-extrabold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold flex items-center justify-center">
                                {c.symbol || '$'}
                              </span>
                              <span>{c.name}</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">
                              {c.code}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Team Collaboration: Tasks & Chat Trigger */}
              <button
                type="button"
                onClick={() => {
                  setCollaborationDefaultTab('tasks');
                  setIsCollaborationOpen(true);
                }}
                className="relative flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer group"
                title="المهام المشتركة والمحادثة الفورية للفريق (To-Do & Team Chat)"
              >
                {/* Red Notification Badge Notch on the corner of the button */}
                {(pendingTasksCount > 0 || awaitingApprovalTasksCount > 0) && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center gap-0.5 border-2 border-white shadow-xs z-10 pointer-events-none">
                    <Bell className="w-2.5 h-2.5 fill-current animate-bell shrink-0" />
                    <span>{pendingTasksCount + awaitingApprovalTasksCount}</span>
                  </span>
                )}

                <CheckSquare className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />

                <span className="text-xs font-bold hidden md:inline text-slate-800 group-hover:text-emerald-900">
                  المهام والدردشة
                </span>
                {awaitingApprovalTasksCount > 0 && (
                  <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                    {awaitingApprovalTasksCount} للتأكيد
                  </span>
                )}
              </button>

              {/* User Avatar with Dropdown Menu & Logout */}
              {currentUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="relative w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 hover:border-emerald-500 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center cursor-pointer"
                    title="حساب المستخدم الحالي • انقر لخيارات الحساب وتسجيل الخروج"
                  >
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {currentUser.name.charAt(0)}
                      </div>
                    )}
                    {/* Active Green Dot */}
                    <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                  </button>

                  {/* Dropdown Menu for Current User */}
                  {isUserMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-slate-700">
                            {currentUser.avatarUrl ? (
                              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                            ) : (
                              currentUser.name.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-extrabold text-slate-900 truncate">
                              {currentUser.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-mono">
                              @{currentUser.username}
                            </p>
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {roleNameMap[currentUser.role] || currentUser.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenLoginModal();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors text-right cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4 text-slate-500" />
                          <span>تبديل الحساب (Switch Account)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors text-right cursor-pointer border border-transparent hover:border-rose-200"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>تسجيل الخروج (Logout)</span>
                        </button>

                        {/* Mobile & Tablet Quick Currency Switcher (visible on < lg) */}
                        <div className="lg:hidden border-t border-slate-100 pt-2 mt-2">
                          <div className="text-[10px] font-bold text-slate-500 px-2 mb-1.5 flex items-center justify-between">
                            <span>عملة النظام:</span>
                            <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {currentCurrencyObj.name} ({currentCurrencyObj.code})
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 px-1">
                            {currenciesList.map((c) => {
                              const isSelected = c.code.toUpperCase() === currency.toUpperCase();
                              return (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => {
                                    setCurrency(c.code as Currency);
                                    setIsUserMenuOpen(false);
                                  }}
                                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  <span className="truncate text-[11px]">{c.name}</span>
                                  <span className="font-mono text-[10px] font-bold">{c.symbol || '$'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-slate-800 shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">تسجيل الدخول</span>
                </button>
              )}

              {/* Online Users Indicator & Modal Trigger - Desktop Only (lg and up) */}
              <button
                type="button"
                onClick={() => setIsOnlineModalOpen(true)}
                className="hidden lg:flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-200 px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer group"
                title="المستخدمون المتصلون الآن على السيستم"
              >
                <div className="relative flex items-center justify-center">
                  <Users className="w-4 h-4 text-slate-600 group-hover:text-emerald-700 transition-colors" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-white" />
                </div>
                <span className="text-xs font-extrabold font-mono text-emerald-700">
                  {currentUser ? activeUsersCount : 0}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-emerald-600">
                  متصل
                </span>
              </button>

              {/* Settings Quick Icon - Desktop Only (lg and up) */}
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="hidden lg:flex items-center justify-center text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-xl transition-colors cursor-pointer"
                title="مركز الإعدادات والأمان"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Online Users Modal */}
      <OnlineUsersModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        onOpenLoginModal={onOpenLoginModal}
      />

      {/* Team Collaboration Drawer (Tasks To-Do & Internal Chat) */}
      <TeamCollaborationDrawer
        isOpen={isCollaborationOpen}
        onClose={() => {
          setIsCollaborationOpen(false);
          setCollaborationOpenNewTask(false);
        }}
        defaultTab={collaborationDefaultTab}
        openNewTask={collaborationOpenNewTask}
      />
    </>
  );
};

