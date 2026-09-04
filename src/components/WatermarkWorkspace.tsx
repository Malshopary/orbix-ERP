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
import { OrbixLogo } from './OrbixLogo';

interface WatermarkWorkspaceProps {
  setActiveTab: (tab: string) => void;
}

export const WatermarkWorkspace: React.FC<WatermarkWorkspaceProps> = ({ setActiveTab }) => {
  const { openBrowserTab, companyProfile } = useErp();

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
    <div className="relative w-full h-full min-h-[380px] flex-1 flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden my-auto">
      {/* Background Giant Watermark - Native Inline Vector SVG immune to any path/host/GitHub 404 errors */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none z-0 overflow-hidden">
        <svg
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[85vw] max-w-[760px] max-h-[65vh] object-contain filter grayscale"
          aria-hidden="true"
        >
          <g transform="translate(100, 50) scale(3)">
            <g fill="#07215C" opacity="0.85">
              <path d="M 45 7 L 18 22.5 C 14.5 24.8 14 28 14 33 L 14 42 L 31 32 C 33.5 30.5 35.5 31 37 32.5 L 45 40.5 Z" />
              <path d="M 55 7 L 82 22.5 C 85.5 24.8 86 28 86 33 L 86 42 L 69 32 C 66.5 30.5 64.5 31 63 32.5 L 55 40.5 Z" />
              <path d="M 45 93 L 18 77.5 C 14.5 75.2 14 72 14 67 L 14 58 L 31 68 C 33.5 69.5 35.5 69 37 67.5 L 45 59.5 Z" />
              <path d="M 55 93 L 82 77.5 C 85.5 75.2 86 72 86 67 L 86 58 L 69 68 C 66.5 69.5 64.5 69 63 67.5 L 55 59.5 Z" />
            </g>
            <circle cx="50" cy="50" r="14" fill="#00C078" opacity="0.9" />
          </g>
          <text
            x="250"
            y="420"
            textAnchor="middle"
            fontFamily="'Readex Pro', 'Segoe UI', 'Arial Black', sans-serif"
            fontSize="64"
            fontWeight="900"
            letterSpacing="8"
            fill="#07215C"
            opacity="0.85"
          >
            ORBIX ERP
          </text>
        </svg>
      </div>

      {/* Foreground Content Card */}
      <div className="relative z-10 max-w-3xl w-full flex flex-col items-center text-center space-y-6">
        {/* Logo Icon & System Title */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center p-1">
            {companyProfile?.logoBase64 ? (
              <img
                src={companyProfile.logoBase64}
                alt={companyProfile.nameAr || 'شعار المنشأة'}
                className="max-h-20 max-w-[280px] object-contain drop-shadow-xs"
              />
            ) : (
              <OrbixLogo size="xl" className="h-16 sm:h-20 w-auto drop-shadow-xs" />
            )}
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
