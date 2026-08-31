import React, { useState, useEffect } from 'react';
import { evaluateMathExpression, isValidMathCharacter, sanitizeMathInput } from '../utils/mathHelper';
import { Calculator } from 'lucide-react';

interface MathQuantityInputProps {
  value: number;
  onChange: (newValue: number) => void;
  className?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  title?: string;
}

export const MathQuantityInput: React.FC<MathQuantityInputProps> = ({
  value,
  onChange,
  className = '',
  min = 0.0001,
  max,
  placeholder = 'الكمية',
  disabled = false,
  id,
  title = 'يقبل معادلات حسابية مثل 5*2 أو 10+3. اضغط Enter أو Tab لحساب الناتج',
}) => {
  const [inputValue, setInputValue] = useState<string>(String(value ?? 1));
  const [hasFormula, setHasFormula] = useState<boolean>(false);

  // Sync when prop value changes externally
  useEffect(() => {
    // Only update if prop value differs from current parsed value
    const currentNum = evaluateMathExpression(inputValue, -1);
    if (value !== currentNum && !isNaN(value)) {
      setInputValue(String(value));
    }
  }, [value]);

  const commitValue = () => {
    const evaluated = evaluateMathExpression(inputValue, value || 1);
    let finalVal = evaluated;
    if (min !== undefined && finalVal < min) finalVal = min;
    if (max !== undefined && finalVal > max) finalVal = max;

    setInputValue(String(finalVal));
    setHasFormula(false);
    onChange(finalVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation, deletion, shortcuts
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }

    // Evaluate and commit on Enter or Tab
    if (e.key === 'Enter' || e.key === 'Tab') {
      commitValue();
      return;
    }

    // Block non-math characters (letters, symbols like $, @, #, etc.)
    if (!isValidMathCharacter(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = sanitizeMathInput(raw);
    setInputValue(sanitized);
    setHasFormula(/[+\-*/%]/.test(sanitized));
  };

  const handleBlur = () => {
    commitValue();
  };

  return (
    <div className="relative inline-flex items-center w-full">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        title={title}
        className={`w-full font-mono text-center transition-all ${className} ${
          hasFormula ? 'ring-2 ring-amber-400 bg-amber-50/50' : ''
        }`}
      />
      {hasFormula && (
        <span
          className="absolute left-1.5 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none"
          title="معادلة رياضية - اضغط Enter لحسابها"
        >
          <Calculator className="w-3 h-3 animate-pulse" />
        </span>
      )}
    </div>
  );
};
