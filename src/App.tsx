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
import { InitialSetupWizard } from './components/InitialSetupWizard';
import { GlobalAlertModal } from './components/GlobalAlertModal';
import { Footer } from './components/Footer';
import { BrowserTabBar } from './components/BrowserTabBar';
import { WatermarkWorkspace } from './components/WatermarkWorkspace';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    users, 
    isSetupCompleted, 
    hasPermission,
    alertModal,
    closeAlertModal
  } = useErp();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // If system is fresh or no admin/users exist, display the Initial Setup & Admin Registration Wizard
  if (!isSetupCompleted || users.length === 0) {
    return (
      <>
        <InitialSetupWizard />
        <GlobalAlertModal data={alertModal} onClose={closeAlertModal} />
      </>
    );
  }

  // Check if current user has permission for active tab
  const canAccessTab = (tab: string): boolean => {
    if (!currentUser) return true; // allow initial preview or prompts login
    if (tab === 'erp_blueprint') return true;
    return hasPermission(tab);
  };

  const isPermitted = canAccessTab(activeTab);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white" dir="rtl">
      <Navbar onOpenLoginModal={() => setIsLoginModalOpen(true)} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-[calc(100vh-6.5rem)] pb-10 items-stretch">
        {/* Sidebar Navigation - Fixed full-height docked on Right side in RTL, No border-radius */}
        <aside className="w-full lg:w-60 xl:w-64 shrink-0 lg:sticky lg:top-16 lg:h-[calc(100vh-6.5rem)] z-30 bg-slate-900 border-l border-slate-800 flex flex-col">
          <Sidebar activeTab={activeTab as ActiveTab} setActiveTab={setActiveTab} />
        </aside>

        {/* Main Content with Browser Tabs Navigation */}
        <div className="flex-1 min-w-0 w-full flex flex-col">
          {/* Browser Multi-Tabs Bar */}
          <BrowserTabBar />

          {/* Active Module Content */}
          <main className="flex-1 min-w-0 w-full p-3 sm:p-4 lg:p-6">
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

      {/* Global Fixed Bottom Mini Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ErpProvider>
      <MainAppContent />
    </ErpProvider>
  );
}


