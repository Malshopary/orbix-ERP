import React, { useState, useEffect, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  TrendingUp,
  AlertTriangle,
  Users,
  Coins,
  Loader2,
  Lightbulb,
  Key,
  Check,
  CheckCircle2,
  Settings2,
  ArrowDown,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: string;
}

const renderMessageContent = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    let cleanLine = line;
    let isHeader = false;
    let isBullet = false;

    if (cleanLine.startsWith('### ')) {
      isHeader = true;
      cleanLine = cleanLine.replace(/^###\s+/, '');
    } else if (cleanLine.startsWith('## ')) {
      isHeader = true;
      cleanLine = cleanLine.replace(/^##\s+/, '');
    } else if (cleanLine.startsWith('# ')) {
      isHeader = true;
      cleanLine = cleanLine.replace(/^#\s+/, '');
    } else if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ')) {
      isBullet = true;
      cleanLine = cleanLine.replace(/^[*\-]\s+/, '');
    }

    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const formattedParts = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={partIdx} className="font-extrabold text-inherit">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    if (isHeader) {
      return (
        <div key={lineIdx} className="font-extrabold text-sm sm:text-base text-inherit mt-2.5 mb-1">
          {formattedParts}
        </div>
      );
    }

    if (isBullet) {
      return (
        <div key={lineIdx} className="flex items-start gap-1.5 pr-1.5 my-0.5">
          <span className="text-emerald-500 font-bold">•</span>
          <span>{formattedParts}</span>
        </div>
      );
    }

    return (
      <div key={lineIdx} className={line.trim() === '' ? 'h-2' : 'min-h-[1.25rem]'}>
        {formattedParts}
      </div>
    );
  });
};

export const AiAssistantModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    companyProfile,
    salesInvoices,
    products,
    customers,
    currency,
    formatMoney,
  } = useErp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `أهلاً بك! أنا **Orbix AI**، مستشارك المالي والمحاسبي الذكي المدعوم بنموذج Google Gemini.
أستطيع مساعدتك في تحليل المبيعات، ومراقبة المخزون، وتنبيهك للنواقص والعملاء المتأخرين واقتراح خطط زيادة الأرباح.
يمكنك اختيار أحد الأسئلة السريعة أدناه أو كتابة أي استفسار محاسبي!`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      source: 'gemini (3.6-flash)',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    setShowScrollBottom(!isNearBottom);
  };

  // Scroll to bottom when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom('auto'), 50);
      setTimeout(() => scrollToBottom('smooth'), 150);
    }
  }, [isOpen]);

  // Scroll to bottom automatically on new message or when loading status changes
  useEffect(() => {
    scrollToBottom('smooth');
    const timer = setTimeout(() => scrollToBottom('smooth'), 60);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  const [aiStatus, setAiStatus] = useState<{
    configured: boolean;
    model: string;
    maskedKey: string | null;
  }>({
    configured: false,
    model: 'gemini-3.6-flash',
    maskedKey: null,
  });

  // Check AI connection status on mount / open
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setAiStatus(data);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) return;
    setKeySaving(true);
    const adminKey = (import.meta as any).env?.VITE_ADMIN_SECURITY_KEY || 'orbix_enterprise_sec_2026';
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Orbix-Admin-Key': adminKey,
        },
        body: JSON.stringify({ apiKey: newApiKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setAiStatus({
          configured: true,
          model: 'gemini-3.6-flash',
          maskedKey: data.maskedKey,
        });
        setNewApiKey('');
        setShowKeyConfig(false);
      }
    } catch {
      // Ignore
    } finally {
      setKeySaving(false);
    }
  };

  // Prepare financial & operational context
  const totalRevenue = (salesInvoices || []).reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const lowStockProducts = (products || []).filter((p) => p && p.stockQuantity <= p.minStockAlert);

  const contextData = {
    companyName: companyProfile.nameAr || companyProfile.nameEn || 'Orbix Store',
    salesInvoicesCount: (salesInvoices || []).length,
    totalRevenue,
    lowStockCount: lowStockProducts.length,
    lowStockSample: lowStockProducts.slice(0, 5).map((p) => ({ name: p.name, stock: p.stockQuantity, min: p.minStockAlert })),
    customersCount: (customers || []).length,
    currency,
  };

  const handleSend = async (queryText?: string) => {
    const promptToSend = queryText || inputQuery;
    if (!promptToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptToSend.trim(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);
    setTimeout(() => scrollToBottom('smooth'), 20);

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg.text,
          context: contextData,
        }),
      });

      const data = await res.json();
      const aiReplyText = data.reply || data.error || 'عذراً، لم أتمكن من إتمام التحليل في الوقت الحالي.';

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'حدث خطأ أثناء الاتصال بخدمة الذكاء الاصطناعي.',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: '📊 ملخص الأرباح والمبيعات', query: 'أعطني ملخصاً سريعاً عن حجم المبيعات والإيرادات الحالية' },
    { label: '📦 النواقص والأصناف الحرجة', query: 'ما هي الأصناف التي أوشكت على النفاد وتحتاج طلبية شراء؟' },
    { label: '👥 متابعة العملاء والتحصيل', query: 'كيف هو وضع العملاء وتوصيات التحصيل والسيولة؟' },
    { label: '💡 خطة تحسين الأرباح', query: 'ما هي أهم 3 نصائح لتحسين ربحية المنشأة وتقليل الهدر؟' },
  ];

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl flex flex-col h-[640px] max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">المستشار الذكي (Orbix AI)</h3>
                <span
                  className="relative flex h-2.5 w-2.5 items-center justify-center cursor-help"
                  title={aiStatus.configured ? `الذكاء الاصطناعي متصل ونشط (Gemini AI)` : 'نظام التحليل الذكي المدمج'}
                >
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      aiStatus.configured ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      aiStatus.configured ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500'
                    }`}
                  />
                </span>
              </div>
              <p className="text-xs text-slate-400">تحليل مالي ومحاسبي ذكي لبيانات منشأتك لحظياً</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowKeyConfig((v) => !v)}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="إعدادات وتعديل مفتاح Gemini API"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق النافذة (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Key Config Bar */}
        {showKeyConfig && (
          <div className="bg-slate-800 border-b border-slate-700 p-3 text-white flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Key className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                type="password"
                placeholder={aiStatus.maskedKey ? `المفتاح الحالي: ${aiStatus.maskedKey}` : 'الصق مفتاح Gemini API هنا...'}
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={keySaving || !newApiKey.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                {keySaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>حفظ وتفعيل</span>
              </button>
              <button
                type="button"
                onClick={() => setShowKeyConfig(false)}
                className="text-slate-400 hover:text-white px-2 py-1 text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

        {/* Preset Quick Prompts Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {quickPrompts.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(btn.query)}
              disabled={isLoading}
              className="text-xs whitespace-nowrap bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-xl font-medium shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Message Stream */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-100/60 scroll-smooth"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-emerald-600 text-white shadow-xs'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-none space-y-1.5'
                  }`}
                >
                  <div className="leading-relaxed">
                    {renderMessageContent(msg.text)}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">
                    <span>{msg.timestamp}</span>
                    {msg.source && (
                      <span className={`font-mono px-2 py-0.5 rounded-md text-[9px] font-bold ${
                        msg.source.includes('gemini')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {msg.source.includes('gemini') ? '✨ Google Gemini AI' : '📊 نظام التحليل الذكي'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs text-slate-600 shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>جاري تحليل الأرقام والبيانات المالية عبر الذكاء الاصطناعي...</span>
                </div>
              </div>
            )}

            {/* Target anchor to scroll to the very bottom */}
            <div ref={messagesEndRef} className="h-4 shrink-0" />
          </div>

          {/* Floating Scroll-to-bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 hover:bg-slate-900 text-white border border-slate-700 px-3 py-1.5 rounded-full shadow-lg text-xs font-bold flex items-center gap-1.5 transition-all z-20 cursor-pointer animate-in fade-in zoom-in-95"
            >
              <ArrowDown className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span>الانتقال لآخر رسالة</span>
            </button>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="اكتب استفسارك المحاسبي أو المالي هنا..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white p-2.5 sm:px-5 sm:py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">إرسال</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
