import React, { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, Copy, Check, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare state: State;
  declare props: Props;
  declare setState: (updater: Partial<State> | ((prevState: State) => Partial<State>)) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Orbix ERP Uncaught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoHome = () => {
    this.handleReset();
    try {
      localStorage.setItem('orbix_active_tab', 'dashboard');
    } catch {}
    window.location.reload();
  };

  private handleCopyError = () => {
    const errorDetails = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack || ''}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-[400px] w-full flex items-center justify-center p-6 bg-slate-50/70 select-none"
          dir="rtl"
        >
          <div className="max-w-xl w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8 text-rose-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">
                {this.props.fallbackTitle || 'تعذر عرض هذه الواجهة بشكل صحيح'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                حدث خطأ برمجي غير متوقع أثناء معالجة عناصر الواجهة. تم عزل المشكلة تلقائياً لمنع إغلاق النظام أو فقدان بياناتك المدخلة.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 text-right">
                <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>تفاصيل الخطأ التقني:</span>
                </div>
                <div className="text-[11px] font-mono text-rose-700 break-words line-clamp-2 bg-white/80 p-2.5 rounded-xl border border-rose-100">
                  {this.state.error.message || 'Unknown Error'}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة الآن</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>العودة للرئيسية</span>
              </button>

              <button
                type="button"
                onClick={this.handleCopyError}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                title="نسخ تفاصيل الخطأ لإرسالها للدعم الفني"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>نسخ التقرير</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
