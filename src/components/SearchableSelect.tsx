import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  id?: string;
  name?: string;
  options: (SearchableSelectOption | string)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  required?: boolean;
  clearable?: boolean;
  renderOption?: (option: SearchableSelectOption, isSelected: boolean) => React.ReactNode;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  name,
  options,
  value,
  onChange,
  placeholder = '-- اختر من القائمة --',
  searchPlaceholder = 'ابحث أثناء الكتابة...',
  disabled = false,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  required = false,
  clearable = false,
  renderOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [openUpwards, setOpenUpwards] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options to SearchableSelectOption format
  const normalizedOptions: SearchableSelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Selected Option object
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((opt) => {
      const matchLabel = opt.label?.toLowerCase().includes(q);
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false;
      const matchVal = String(opt.value).toLowerCase().includes(q);
      const matchBadge = opt.badge ? opt.badge.toLowerCase().includes(q) : false;
      return matchLabel || matchSub || matchVal || matchBadge;
    });
  }, [normalizedOptions, searchQuery]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Position calculation and auto-focus input
  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 260 && rect.top > 260) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (val: string, isDisabled?: boolean) => {
    if (isDisabled) return;
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        toggleDropdown();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value, filteredOptions[highlightedIndex].disabled);
      }
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const el = listRef.current.children[highlightedIndex] as HTMLElement;
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      id={id ? `${id}-wrapper` : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for standard forms */}
      {name && <input type="hidden" name={name} value={value} required={required} />}

      {/* Main Select Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={toggleDropdown}
        className={`w-full flex items-center justify-between text-right px-3 py-2 rounded-xl border transition-all text-xs font-medium cursor-pointer min-h-[38px] ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-emerald-600 ring-2 ring-emerald-100 shadow-xs'
            : 'bg-white border-slate-300 hover:border-slate-400 text-slate-800 shadow-2xs'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
          )}

          <div className="truncate flex-1">
            {selectedOption ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-slate-900 truncate">{selectedOption.label}</span>
                {selectedOption.subLabel && (
                  <span className="text-[10px] text-slate-500 truncate font-normal">
                    ({selectedOption.subLabel})
                  </span>
                )}
                {selectedOption.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                      selectedOption.badgeColor || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 truncate">{placeholder}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 mr-1 text-slate-400">
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 hover:text-slate-600 rounded-md transition-colors"
              title="مسح الاختيار"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Searchable Dropdown Overlay */}
      {isOpen && (
        <div
          className={`absolute z-[120] right-0 left-0 ${
            openUpwards
              ? 'bottom-full mb-1.5 shadow-2xl origin-bottom'
              : 'top-full mt-1.5 shadow-2xl origin-top'
          } bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 min-w-[240px] flex flex-col ${dropdownClassName}`}
        >
          {/* Real-time Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder={searchPlaceholder}
              className="w-full text-xs bg-transparent border-none outline-hidden placeholder:text-slate-400 font-medium text-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options Results List */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto p-1 space-y-0.5 divide-y divide-slate-50 text-xs"
          >
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs font-medium">
                لا توجد نتائج مطابقة للبحث "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = String(option.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                if (renderOption) {
                  return (
                    <div
                      key={option.value || idx}
                      onClick={() => handleSelect(option.value, option.disabled)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`cursor-pointer rounded-xl transition-colors ${
                        option.disabled ? 'opacity-50 cursor-not-allowed' : ''
                      } ${isSelected ? 'bg-emerald-50 text-emerald-950 font-bold' : ''} ${
                        isHighlighted && !isSelected ? 'bg-slate-50' : ''
                      }`}
                    >
                      {renderOption(option, isSelected)}
                    </div>
                  );
                }

                return (
                  <button
                    key={option.value || idx}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value, option.disabled)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      option.disabled ? 'opacity-40 cursor-not-allowed' : ''
                    } ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-100'
                        : isHighlighted
                        ? 'bg-slate-100 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {option.icon && <span className="shrink-0 text-slate-500">{option.icon}</span>}
                      <div className="truncate flex-1">
                        <span className="truncate block font-medium">{option.label}</span>
                        {option.subLabel && (
                          <span className="text-[10px] text-slate-500 block truncate">
                            {option.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mr-2">
                      {option.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            option.badgeColor || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
