import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Zap,
  BookOpenCheck,
  FileText,
  Receipt,
  CreditCard,
  Award,
  Tag,
  FolderTree,
  FileBadge,
  ClipboardList,
  FileSpreadsheet,
  RotateCcw,
  Building,
  Package,
  Layers,
  AlertTriangle,
  ArrowDownUp,
  Users2,
  TrendingUp,
  PhoneCall,
  LifeBuoy,
  Target,
  Calendar,
  Users,
  PieChart,
  Scale,
  Building2,
  Coins,
  ShieldCheck,
  Database,
  Laptop,
  Lightbulb,
  X,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { BrowserTab } from '../types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Zap,
  BookOpenCheck,
  FileText,
  Receipt,
  CreditCard,
  Award,
  Tag,
  FolderTree,
  FileBadge,
  ClipboardList,
  FileSpreadsheet,
  RotateCcw,
  Building,
  Package,
  Layers,
  AlertTriangle,
  ArrowDownUp,
  Users2,
  TrendingUp,
  PhoneCall,
  LifeBuoy,
  Target,
  Calendar,
  Users,
  PieChart,
  Scale,
  Building2,
  Coins,
  ShieldCheck,
  Database,
  Laptop,
  Lightbulb,
};

export const BrowserTabBar: React.FC = () => {
  const {
    openTabs,
    activeTabId,
    switchBrowserTab,
    closeBrowserTab,
    closeOtherBrowserTabs,
    closeAllBrowserTabs,
    openBrowserTab,
  } = useErp();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1000);
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    tabId: string;
  } | null>(null);

  // Measure container width for dynamic compaction
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Dynamic Compaction Logic:
  // - Active tab is ALWAYS expanded (shows icon + title + close button).
  // - When tabs increase or container space decreases, non-active tabs compact to Icon-Only.
  // - Earlier/inactive tabs are compressed first, maintaining seamless fit without scrollbars.
  const expandedTabIds = useMemo(() => {
    const total = openTabs.length;
    if (total <= 2) {
      return new Set(openTabs.map((t) => t.id));
    }

    const available = Math.max(200, containerWidth - 90);
    const activeWidth = 170;
    const compactWidth = 40;
    const expandedWidth = 150;

    // Remaining width available for other tabs to expand
    const remainingWidth = available - activeWidth - (total - 1) * compactWidth;
    const extraSlots = Math.max(0, Math.floor(remainingWidth / (expandedWidth - compactWidth)));
    const maxExpanded = Math.min(total, 1 + extraSlots);

    const expandedSet = new Set<string>();
    expandedSet.add(activeTabId);

    // If hover is active on a compact tab, give it temporary expansion priority if space allows
    if (hoveredTabId && !expandedSet.has(hoveredTabId) && expandedSet.size < maxExpanded) {
      expandedSet.add(hoveredTabId);
    }

    // Find active tab index
    const activeIdx = openTabs.findIndex((t) => t.id === activeTabId);

    // Expand neighboring tabs to the active tab if additional slots exist
    let offset = 1;
    while (expandedSet.size < maxExpanded && offset < total) {
      if (activeIdx - offset >= 0 && expandedSet.size < maxExpanded) {
        expandedSet.add(openTabs[activeIdx - offset].id);
      }
      if (activeIdx + offset < total && expandedSet.size < maxExpanded) {
        expandedSet.add(openTabs[activeIdx + offset].id);
      }
      offset++;
    }

    return expandedSet;
  }, [openTabs, activeTabId, containerWidth, hoveredTabId]);

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tabId,
    });
  };

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 select-none sticky top-16 z-20 shadow-xs overflow-hidden">
      <div
        ref={containerRef}
        className="flex items-stretch h-10 px-2 gap-1.5 relative w-full overflow-hidden"
      >
        {/* Tabs List (No scrollbar, auto-compacting) */}
        <div className="flex-1 flex items-end gap-1 overflow-hidden h-full pt-1">
          {openTabs.length === 0 ? (
            <div className="flex items-center gap-2 h-8.5 px-3 text-xs text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>مساحة العمل جاهزة — اختر أي صفحة من القائمة الجانبية للفتح</span>
            </div>
          ) : (
            openTabs.map((tab: BrowserTab, index: number) => {
              const isActive = tab.id === activeTabId;
              const isExpanded = expandedTabIds.has(tab.id);
              const IconComponent = ICON_MAP[tab.iconName] || FolderTree;

              return (
                <div
                  key={tab.id}
                  data-tab-id={tab.id}
                  onContextMenu={(e) => handleContextMenu(e, tab.id)}
                  onClick={() => switchBrowserTab(tab.id)}
                  onMouseEnter={() => setHoveredTabId(tab.id)}
                  onMouseLeave={() => setHoveredTabId(null)}
                  className={`group relative flex items-center h-8.5 rounded-t-xl transition-all duration-200 cursor-pointer select-none shrink-0 ${
                    isExpanded
                      ? 'px-3 gap-2 min-w-[120px] max-w-[185px] flex-1'
                      : 'w-10 px-0 justify-center'
                  } ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow-sm border-t-2 border-emerald-500 font-extrabold z-10'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-t-2 border-transparent hover:border-slate-600'
                  }`}
                  title={tab.title}
                >
                  {/* Tab Icon */}
                  <div className="flex items-center justify-center shrink-0">
                    <IconComponent
                      className={`w-3.5 h-3.5 transition-colors ${
                        isActive
                          ? 'text-emerald-600'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                  </div>

                  {/* Expanded Title */}
                  {isExpanded && (
                    <span className="truncate flex-1 text-right text-[11px] sm:text-xs font-bold transition-all">
                      {tab.title}
                    </span>
                  )}

                  {/* Close Button (Available on all tabs, even single open tab) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeBrowserTab(tab.id);
                    }}
                    className={`rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                      isExpanded
                        ? 'w-4 h-4 ml-0.5'
                        : 'absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-900 border border-slate-700 opacity-0 group-hover:opacity-100 shadow-xs'
                    } ${
                      isActive
                        ? 'text-slate-500 hover:bg-slate-200 hover:text-rose-600'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-rose-400'
                    }`}
                    title={`إغلاق ${tab.title}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>

                  {/* Subtle Divider between compact inactive tabs */}
                  {!isExpanded &&
                    !isActive &&
                    index < openTabs.length - 1 &&
                    openTabs[index + 1].id !== activeTabId && (
                      <span className="absolute left-0 top-2 bottom-2 w-px bg-slate-800/80 pointer-events-none" />
                    )}
                </div>
              );
            })
          )}
        </div>

        {/* Action Buttons (New Tab + Close All) */}
        <div className="flex items-center gap-1 shrink-0 my-auto pl-1">
          <button
            type="button"
            onClick={() => openBrowserTab('dashboard')}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs border border-slate-700/60"
            title="فتح الرئيسية في تبويب جديد"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {openTabs.length > 1 && (
            <button
              type="button"
              onClick={closeAllBrowserTabs}
              className="text-[10px] text-slate-400 hover:text-rose-300 hover:bg-slate-800 px-2 py-1 rounded-lg transition-all border border-slate-800 shrink-0 hidden sm:inline-flex items-center gap-1 cursor-pointer"
              title="إغلاق كافة التبويبات والرجوع للرئيسية"
            >
              <X className="w-3 h-3 text-rose-400" />
              إغلاق الكل
            </button>
          )}
        </div>
      </div>

      {/* Right Click Context Menu */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1.5 min-w-[180px] text-right text-xs text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              closeBrowserTab(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-right hover:bg-slate-800 hover:text-rose-400 flex items-center justify-between gap-2 transition-all cursor-pointer"
          >
            <span>إغلاق هذا التبويب</span>
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => {
              closeOtherBrowserTabs(contextMenu.tabId);
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-right hover:bg-slate-800 hover:text-emerald-400 flex items-center justify-between gap-2 transition-all cursor-pointer border-t border-slate-800"
          >
            <span>إغلاق التبويبات الأخرى</span>
            <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => {
              closeAllBrowserTabs();
              setContextMenu(null);
            }}
            className="w-full px-3 py-2 text-right hover:bg-slate-800 hover:text-amber-400 flex items-center justify-between gap-2 transition-all cursor-pointer border-t border-slate-800"
          >
            <span>إغلاق كافة التبويبات</span>
            <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      )}
    </div>
  );
};
