import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Search, X, Sparkles } from 'lucide-react';

interface CreatableComboboxProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onAddNew: (newItem: string) => string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
  hint?: string;
  className?: string;
}

export const CreatableCombobox: React.FC<CreatableComboboxProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  onAddNew,
  placeholder = 'اختر أو اكتب للإضافة...',
  required = false,
  icon,
  hint,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal search term when external value changes
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If user typed something and blurred without selecting, keep the typed value
        if (searchTerm.trim() && searchTerm !== value) {
          onChange(searchTerm.trim());
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchTerm, value, onChange]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const exactMatch = options.some(
    (opt) => opt.trim().toLowerCase() === searchTerm.trim().toLowerCase()
  );

  const handleSelectOption = (opt: string) => {
    setSearchTerm(opt);
    onChange(opt);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    const created = onAddNew(trimmed);
    onChange(created || trimmed);
    setSearchTerm(created || trimmed);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0 && !exactMatch && filteredOptions[0].toLowerCase() === searchTerm.trim().toLowerCase()) {
        handleSelectOption(filteredOptions[0]);
      } else if (!exactMatch && searchTerm.trim()) {
        handleCreateNew();
      } else if (filteredOptions.length > 0) {
        handleSelectOption(filteredOptions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id ? `${id}-container` : undefined}>
      <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          {icon}
          {label} {required && <span className="text-rose-500">*</span>}
        </span>
        {hint && <span className="text-[10px] font-normal text-slate-400">{hint}</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={searchTerm}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full p-2.5 pl-16 pr-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white text-slate-900 transition-all font-medium"
        />

        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                onChange('');
                inputRef.current?.focus();
              }}
              className="p-1 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
              title="مسح"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }}
            className="p-1 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
            title="فتح القائمة"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Header indicator */}
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>القائمة المتاحة ({filteredOptions.length})</span>
            <span className="text-[10px] text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> اقتراح وحفظ لحظي
            </span>
          </div>

          {/* Quick Create option if not exact match */}
          {searchTerm.trim().length > 0 && !exactMatch && (
            <div className="p-1.5 bg-emerald-50/80 border-b border-emerald-100">
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full text-right p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>إضافة وإنشاء: <strong className="underline decoration-emerald-300">"{searchTerm.trim()}"</strong></span>
                </span>
                <span className="text-[10px] bg-emerald-700/60 px-2 py-0.5 rounded-lg shrink-0">حفظ فوري</span>
              </button>
            </div>
          )}

          {/* Options list */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-50 max-h-48">
            {filteredOptions.map((option) => {
              const isSelected = option === value;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-right px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-100'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="truncate">{option}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 mr-1" />}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="p-4 text-center text-slate-400 text-xs">
                {searchTerm ? 'لا توجد نتائج مطابقة — يمكنك الضغط على زر الإنشاء أعلاه' : 'لا توجد خيارات متاحة'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
