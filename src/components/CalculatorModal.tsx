import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  X, 
  Copy, 
  Check, 
  RotateCcw, 
  Percent, 
  Delete, 
  Divide, 
  X as Multiply, 
  Minus, 
  Plus, 
  Equal,
  History,
  Trash2
} from 'lucide-react';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [prevNumber, setPrevNumber] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<{ expr: string; result: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [memory, setMemory] = useState<number>(0);

  // Keyboard navigation & inputs
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Digits
      if (/[0-9]/.test(e.key)) {
        inputDigit(e.key);
      } else if (e.key === '.') {
        inputDot();
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        e.preventDefault();
        performOperation(e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'c' || e.key === 'C') {
        clearAll();
      } else if (e.key === '%') {
        applyPercent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display, waitingForOperand, prevNumber, operator, expression]);

  if (!isOpen) return null;

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleBackspace = () => {
    if (waitingForOperand) return;
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setExpression('');
    setPrevNumber(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  const toggleSign = () => {
    const val = parseFloat(display);
    if (val !== 0) {
      setDisplay(String(-val));
    }
  };

  const applyPercent = () => {
    const current = parseFloat(display);
    if (isNaN(current)) return;
    const res = current / 100;
    setDisplay(String(res));
  };

  const applyQuickVat = (vatRate: number) => {
    const current = parseFloat(display);
    if (isNaN(current) || current === 0) return;
    const vatAmount = current * (vatRate / 100);
    const total = current + vatAmount;
    const formatted = parseFloat(total.toFixed(4)).toString();
    
    setHistory((prev) => [
      { expr: `${current} + ضريبة ${vatRate}% (${vatAmount.toFixed(2)})`, result: formatted },
      ...prev.slice(0, 19),
    ]);
    
    setExpression(`${current} + ${vatRate}%`);
    setDisplay(formatted);
    setWaitingForOperand(true);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevNumber === null) {
      setPrevNumber(inputValue);
      setExpression(`${inputValue} ${nextOperator}`);
    } else if (operator) {
      const currentValue = prevNumber || 0;
      let result = 0;

      if (operator === '+') result = currentValue + inputValue;
      else if (operator === '-') result = currentValue - inputValue;
      else if (operator === '×' || operator === '*') result = currentValue * inputValue;
      else if (operator === '÷' || operator === '/') {
        if (inputValue === 0) {
          setDisplay('خطأ: القسمة على صفر');
          setWaitingForOperand(true);
          return;
        }
        result = currentValue / inputValue;
      }

      // Round to prevent floating point anomalies
      result = parseFloat(result.toFixed(8));
      setDisplay(String(result));
      setPrevNumber(result);
      setExpression(`${result} ${nextOperator}`);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (operator && prevNumber !== null) {
      let result = 0;
      if (operator === '+') result = prevNumber + inputValue;
      else if (operator === '-') result = prevNumber - inputValue;
      else if (operator === '×' || operator === '*') result = prevNumber * inputValue;
      else if (operator === '÷' || operator === '/') {
        if (inputValue === 0) {
          setDisplay('خطأ: القسمة على صفر');
          setWaitingForOperand(true);
          return;
        }
        result = prevNumber / inputValue;
      }

      result = parseFloat(result.toFixed(8));
      const fullExpr = `${prevNumber} ${operator} ${inputValue}`;
      const resultStr = String(result);

      setHistory((prev) => [{ expr: fullExpr, result: resultStr }, ...prev.slice(0, 19)]);
      setExpression(`${fullExpr} =`);
      setDisplay(resultStr);
      setPrevNumber(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 text-slate-100 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-800 overflow-hidden flex flex-col"
        dir="ltr"
      >
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-200">الآلة الحاسبة المحاسبية</h3>
              <p className="text-[10px] text-slate-400">حسابات سريعة وضريبة القيمة المضافة</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-xl transition-colors ${
                showHistory 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
              title="سجل العمليات الحسابية"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 rounded-xl transition-colors cursor-pointer"
              title="إغلاق (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Panel or Main Screen */}
        {showHistory ? (
          <div className="p-4 flex-1 max-h-[360px] overflow-y-auto space-y-2 text-right">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-xs font-bold text-slate-400">سجل الحسابات السابقة</span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  مسح السجل
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">لا توجد عمليات سابقة في السجل</div>
            ) : (
              history.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDisplay(item.result);
                    setShowHistory(false);
                  }}
                  className="w-full text-right bg-slate-800/60 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-700/50 transition-colors block cursor-pointer group"
                >
                  <div className="text-[11px] text-slate-400 font-mono">{item.expr}</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 group-hover:text-emerald-300">
                    = {item.result}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Display Area */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-end text-right min-h-[90px] relative">
              <button
                type="button"
                onClick={copyResult}
                className="absolute top-2.5 left-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                title="نسخ الناتج للحافظة"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{copied ? 'تم النسخ' : 'نسخ'}</span>
              </button>

              <div className="text-xs text-slate-400 font-mono h-5 overflow-hidden text-ellipsis whitespace-nowrap">
                {expression || ' '}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight overflow-x-auto whitespace-nowrap text-right">
                {display}
              </div>
            </div>

            {/* Quick Tax & Discount Shortcuts (Accounting special) */}
            <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => applyQuickVat(14)}
                className="py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 rounded-xl transition-colors cursor-pointer"
                title="إضافة ضريبة مصر 14%"
              >
                +14% ضريبة
              </button>
              <button
                type="button"
                onClick={() => applyQuickVat(15)}
                className="py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 rounded-xl transition-colors cursor-pointer"
                title="إضافة ضريبة السعودية 15%"
              >
                +15% ضريبة
              </button>
              <button
                type="button"
                onClick={() => applyQuickVat(5)}
                className="py-1.5 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/60 text-emerald-300 rounded-xl transition-colors cursor-pointer"
                title="إضافة ضريبة الإمارات 5%"
              >
                +5% ضريبة
              </button>
              <button
                type="button"
                onClick={applyPercent}
                className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                title="نسبة مئوية %"
              >
                %
              </button>
            </div>

            {/* Main Keypad */}
            <div className="grid grid-cols-4 gap-2">
              {/* Row 1 */}
              <button
                type="button"
                onClick={clearAll}
                className="p-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold rounded-xl border border-rose-500/30 transition-colors text-sm cursor-pointer"
              >
                C
              </button>
              <button
                type="button"
                onClick={clearEntry}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-sm cursor-pointer"
              >
                CE
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                title="حذف رقم"
              >
                <Delete className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => performOperation('÷')}
                className="p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition-colors text-base flex items-center justify-center cursor-pointer"
              >
                <Divide className="w-4 h-4" />
              </button>

              {/* Row 2 */}
              <button
                type="button"
                onClick={() => inputDigit('7')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-base cursor-pointer"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => inputDigit('8')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-base cursor-pointer"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => inputDigit('9')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-base cursor-pointer"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => performOperation('×')}
                className="p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition-colors text-base flex items-center justify-center cursor-pointer"
              >
                <Multiply className="w-4 h-4" />
              </button>

              {/* Row 3 */}
              <button
                type="button"
                onClick={() => inputDigit('4')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-base cursor-pointer"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => inputDigit('5')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-base cursor-pointer"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => inputDigit('6')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-base cursor-pointer"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => performOperation('-')}
                className="p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition-colors text-base flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Row 4 */}
              <button
                type="button"
                onClick={() => inputDigit('1')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-base cursor-pointer"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => inputDigit('2')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-base cursor-pointer"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => inputDigit('3')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-base cursor-pointer"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => performOperation('+')}
                className="p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold rounded-xl border border-amber-500/30 transition-colors text-base flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Row 5 */}
              <button
                type="button"
                onClick={toggleSign}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-sm cursor-pointer"
              >
                ±
              </button>
              <button
                type="button"
                onClick={() => inputDigit('0')}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-base cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={inputDot}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors text-base cursor-pointer"
              >
                .
              </button>
              <button
                type="button"
                onClick={handleEquals}
                className="p-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center text-lg cursor-pointer"
              >
                <Equal className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="p-2.5 bg-slate-950/60 border-t border-slate-800 text-center text-[10px] text-slate-500">
          يمكنك استخدام لوحة المفاتيح (الأرقام، +, -, *, /, Enter, Backspace, Esc)
        </div>
      </div>
    </div>
  );
};
