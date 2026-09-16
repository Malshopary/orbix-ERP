import React from 'react';
import { LayoutDashboard, Zap, Search, Plus, Menu, Bell } from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { ActiveTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMenu: () => void;
  onOpenSearch?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMenu,
  onOpenSearch,
}) => {
  const { pendingTasksCount = 0, awaitingApprovalTasksCount = 0 } = useErp();
  const totalTasksBadge = pendingTasksCount + awaitingApprovalTasksCount;

  const isHomeActive = activeTab === 'dashboard';
  const isPosActive = activeTab === 'quick_pos';

  return (
    <nav
      aria-label="التنقل السفلي للموبايل والتابلت"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 py-1.5 pb-safe select-none print:hidden print-hide"
      dir="rtl"
    >
      <div className="grid grid-cols-5 gap-1 items-center max-w-md sm:max-w-lg md:max-w-xl mx-auto">
        {/* 1. الرئيسية */}
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer relative group"
          title="الرئيسية"
          aria-label="الرئيسية"
        >
          <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isHomeActive
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-xs'
              : 'bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-600'
          }`}>
            <LayoutDashboard className={`w-4 h-4 transition-transform ${isHomeActive ? 'scale-110' : ''}`} />
            {isHomeActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            )}
          </div>
        </button>

        {/* 2. الكاشير POS */}
        <button
          type="button"
          onClick={() => setActiveTab('quick_pos')}
          className="flex items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer relative group"
          title="الكاشير السريع"
          aria-label="الكاشير السريع"
        >
          <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isPosActive 
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 border border-emerald-400/50' 
              : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50'
          }`}>
            <Zap className="w-4 h-4 fill-current" />
          </div>
        </button>

        {/* 3. الإجراءات السريعة والمهام (الزر في المنتصف تماماً) */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('orbix:toggle-quick-actions'));
          }}
          className="flex items-center justify-center py-1.5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer relative group"
          title="الإجراءات السريعة والمهام"
          aria-label="الإجراءات السريعة والمهام"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:border-emerald-500/50 transition-colors">
              <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            {totalTasksBadge > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white text-[9px] font-black flex items-center justify-center gap-0.5 shadow-md border border-slate-900 animate-bounce z-10">
                <Bell className="w-2.5 h-2.5 fill-current animate-bell shrink-0" />
                {totalTasksBadge > 1 && <span>{totalTasksBadge}</span>}
              </span>
            )}
          </div>
        </button>

        {/* 4. البحث السريع */}
        <button
          type="button"
          onClick={() => {
            if (onOpenSearch) {
              onOpenSearch();
            } else {
              window.dispatchEvent(new CustomEvent('orbix:open-search'));
            }
          }}
          className="flex items-center justify-center py-1.5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer group"
          title="بحث سريع"
          aria-label="بحث سريع"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white group-hover:border-slate-600 transition-colors">
            <Search className="w-4 h-4 text-emerald-400" />
          </div>
        </button>

        {/* 5. القائمة الكاملة */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex items-center justify-center py-1.5 rounded-xl text-slate-400 hover:text-emerald-400 transition-all cursor-pointer group"
          title="القائمة"
          aria-label="القائمة"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 hover:text-white group-hover:border-slate-600 transition-colors">
            <Menu className="w-4 h-4" />
          </div>
        </button>
      </div>
    </nav>
  );
};
