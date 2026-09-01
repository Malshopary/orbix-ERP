import React from 'react';
import {
  LayoutDashboard,
  Zap,
  BookOpenCheck,
  Receipt,
  Layers,
  Users2,
  Calendar,
  PieChart,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';

interface WatermarkWorkspaceProps {
  setActiveTab: (tab: string) => void;
}

export const WatermarkWorkspace: React.FC<WatermarkWorkspaceProps> = ({ setActiveTab }) => {
  const { openBrowserTab } = useErp();

  const quickLinks = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, color: 'text-emerald-500 hover:bg-emerald-50 hover:border-emerald-200' },
    { id: 'quick_pos', label: 'الكاشير السريع', icon: Zap, color: 'text-amber-500 hover:bg-amber-50 hover:border-amber-200' },
    { id: 'sales', label: 'المبيعات والفوترة', icon: Receipt, color: 'text-blue-500 hover:bg-blue-50 hover:border-blue-200' },
    { id: 'accounts', label: 'شجرة الحسابات والقيود', icon: BookOpenCheck, color: 'text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200' },
    { id: 'inventory', label: 'الأصناف والمخزون', icon: Layers, color: 'text-purple-500 hover:bg-purple-50 hover:border-purple-200' },
    { id: 'crm_collections', label: 'سجل العملاء CRM', icon: Users2, color: 'text-cyan-500 hover:bg-cyan-50 hover:border-cyan-200' },
    { id: 'hr_payroll', label: 'الرواتب وشؤون الموظفين', icon: Calendar, color: 'text-rose-500 hover:bg-rose-50 hover:border-rose-200' },
    { id: 'financial_reports', label: 'التقارير والقوائم المالية', icon: PieChart, color: 'text-teal-500 hover:bg-teal-50 hover:border-teal-200' },
    { id: 'settings', label: 'الإعدادات والنسخ الاحتياطي', icon: Settings, color: 'text-slate-600 hover:bg-slate-100 hover:border-slate-300' },
  ];

  return (
    <div className="relative w-full min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Background Giant Watermark from /img/ folder filling the entire page */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none z-0">
        <img
          src="/img/watermark.svg"
          alt="Orbix ERP Watermark"
          className="w-[85vw] max-w-[820px] max-h-[75vh] object-contain filter grayscale"
        />
      </div>

      {/* Foreground Content Card */}
      <div className="relative z-10 max-w-3xl w-full flex flex-col items-center text-center space-y-6">
        {/* Logo Icon & System Title */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center p-1">
            <img
              src="/img/logo.svg"
              alt="Orbix Logo"
              className="w-48 sm:w-64 md:w-72 h-16 sm:h-20 object-contain drop-shadow-xs"
            />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
              <span>نظام أوربكس لإدارة الموارد</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                ORBIX ERP
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium max-w-md mx-auto">
              مساحة العمل جاهزة. يمكنك فتح أي شاشة أو خدمة من القائمة الجانبية، أو النقر على أحد الاختصارات السريعة أدناه:
            </p>
          </div>
        </div>

        {/* Quick Launch Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl pt-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => openBrowserTab(link.id)}
                className={`flex items-center gap-2.5 p-3 rounded-2xl bg-white/80 backdrop-blur-xs border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 text-right cursor-pointer group ${link.color}`}
              >
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-slate-800 group-hover:text-slate-900 truncate">
                    {link.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Informative Tip */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-200/50 px-3.5 py-1.5 rounded-full border border-slate-200/60 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>يمكنك فتح أكثر من شاشة معاً والتبديل بينها أو إغلاقها بحرية تامة في أي وقت</span>
        </div>
      </div>
    </div>
  );
};
