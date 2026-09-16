/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ErpProvider, useErp } from './context/ErpContext';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AccountsView } from './components/AccountsView';
import { SalesView } from './components/SalesView';
import { PurchasesView } from './components/PurchasesView';
import { InventoryView } from './components/InventoryView';
import { CrmCollectionsView } from './components/CrmCollectionsView';
import { HrPayrollView } from './components/HrPayrollView';
import { FinancialReportsView } from './components/FinancialReportsView';
import { ErpBlueprintView } from './components/ErpBlueprintView';
import { QuickPosView } from './components/QuickPosView';
import { SettingsView } from './components/SettingsView';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { InitialSetupWizard } from './components/InitialSetupWizard';
import { GlobalAlertModal } from './components/GlobalAlertModal';
import { Footer } from './components/Footer';
import { BrowserTabBar } from './components/BrowserTabBar';
import { WatermarkWorkspace } from './components/WatermarkWorkspace';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OrbixPreloader } from './components/OrbixPreloader';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { Lock, ShieldAlert, KeyRound, Building2, RefreshCw } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    users, 
    isSetupCompleted, 
    hasPermission,
    alertModal,
    closeAlertModal,
    isInitialSyncDone
  } = useErp();
  const [isPreloaderFinished, setIsPreloaderFinished] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('orbix_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('orbix_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Creative Ultra-Modern Preloader (Smoothly handles initial sync & boot sequence)
  if (!isPreloaderFinished) {
    return (
      <OrbixPreloader 
        isReady={isInitialSyncDone} 
        onFinish={() => setIsPreloaderFinished(true)} 
        minDurationMs={1600}
      />
    );
  }

  // If system is fresh or no admin/users exist, display the Initial Setup & Admin Registration Wizard
  if (!isSetupCompleted || users.length === 0) {
    return (
      <>
        <InitialSetupWizard />
        <GlobalAlertModal data={alertModal} onClose={closeAlertModal} />
      </>
    );
  }

  // If user is not logged in, show dedicated, full-screen Login Page
  if (!currentUser) {
    return (
      <>
        <LoginPage />
        <GlobalAlertModal data={alertModal} onClose={closeAlertModal} />
      </>
    );
  }

  // Check if current user has permission for active tab
  const canAccessTab = (tab: string): boolean => {
    if (tab === 'erp_blueprint') return true;
    return hasPermission(tab);
  };

  const isPermitted = canAccessTab(activeTab);

  return (
    <div className="h-screen w-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white overflow-hidden animate-in fade-in duration-500" dir="rtl">
      <Navbar 
        onOpenLoginModal={() => setIsLoginModalOpen(true)} 
        setActiveTab={setActiveTab}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
      />

      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-0 overflow-hidden items-stretch">
        {/* Desktop Sidebar Navigation - Fixed full-height docked on Right side in RTL, hidden on mobile/tablet */}
        <aside className={`hidden lg:flex shrink-0 h-full z-30 bg-slate-900 border-l border-slate-800 flex-col overflow-hidden print:hidden print-hide transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-60 xl:w-64'
        }`}>
          <Sidebar 
            activeTab={activeTab as ActiveTab} 
            setActiveTab={setActiveTab} 
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
          />
        </aside>

        {/* Mobile & Tablet Slide-Over Drawer Navigation */}
        {isMobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex" dir="rtl">
            {/* Backdrop Blur Overlay */}
            <div 
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in cursor-pointer"
              onClick={() => setIsMobileDrawerOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer Body */}
            <div className="relative w-72 sm:w-80 max-w-[85vw] h-full bg-slate-900 shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
              <Sidebar 
                activeTab={activeTab as ActiveTab} 
                setActiveTab={setActiveTab} 
                isCollapsed={false}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content with Browser Tabs Navigation */}
        <div className="flex-1 min-w-0 w-full h-full flex flex-col overflow-hidden">
          {/* Browser Multi-Tabs Bar */}
          <BrowserTabBar />

          {/* Active Module Content */}
          <main className="flex-1 min-w-0 w-full overflow-y-auto p-2 sm:p-4 lg:p-6 pb-24 lg:pb-6">
            <ErrorBoundary fallbackTitle="تعذر تحميل هذه الشاشة بشكل صحيح">
              {!activeTab ? (
                <WatermarkWorkspace setActiveTab={setActiveTab} />
              ) : !isPermitted ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center max-w-lg mx-auto my-12 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto flex items-center justify-center">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    هذه الشاشة مقيدة بالصلاحيات (RBAC Restricted)
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    حسابك الحالي (<strong className="text-slate-800">{currentUser?.name}</strong>) بدور{' '}
                    <strong className="text-slate-800">{currentUser?.role}</strong> لا يملك صلاحية الوصول إلى هذه الوحدة.
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLoginModalOpen(true)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      تبديل الحساب / تسجيل الدخول كمدير
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
                  {activeTab === 'quick_pos' && <QuickPosView />}
                  {activeTab === 'accounts' && <AccountsView />}
                  {activeTab === 'inventory' && <InventoryView />}
                  {activeTab === 'sales' && <SalesView />}
                  {activeTab === 'purchases' && <PurchasesView />}
                  {activeTab === 'crm_collections' && <CrmCollectionsView />}
                  {activeTab === 'hr_payroll' && <HrPayrollView />}
                  {activeTab === 'financial_reports' && <FinancialReportsView />}
                  {activeTab === 'settings' && <SettingsView />}
                  {activeTab === 'erp_blueprint' && <ErpBlueprintView setActiveTab={setActiveTab} />}
                </>
              )}
            </ErrorBoundary>
          </main>
        </div>
      </div>

      {/* Global Login & Auth Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Global Formatted System Alert & Confirmation Modal */}
      <GlobalAlertModal
        data={alertModal}
        onClose={closeAlertModal}
      />

      {/* Mobile Bottom Navigation Bar (Phones & Small Viewports) */}
      <MobileBottomNav 
        activeTab={activeTab as ActiveTab} 
        setActiveTab={setActiveTab}
        onOpenMenu={() => setIsMobileDrawerOpen(true)}
      />

      {/* Global Fixed Bottom Mini Footer */}
      <Footer />

      {/* Progressive Web App (PWA) Mobile Install Prompt */}
      <PwaInstallPrompt />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="حدث خطأ غير متوقع في تشغيل منظومة أوربكس ERP">
      <ErpProvider>
        <MainAppContent />
      </ErpProvider>
    </ErrorBoundary>
  );
}


