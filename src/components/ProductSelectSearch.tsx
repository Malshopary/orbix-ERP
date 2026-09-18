import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { useErp } from '../context/ErpContext';
import { Search, Package, ChevronDown, Check, X, Barcode, Plus } from 'lucide-react';

export interface ProductSelectSearchProps {
  selectedProductId?: string;
  onSelectProduct?: (product: Product) => void;
  onSelect?: (product: Product) => void;
  products?: Product[];
  className?: string;
  placeholder?: string;
  id?: string;
  mode?: 'select' | 'add';
  priceType?: 'cost' | 'selling';
}

export const ProductSelectSearch: React.FC<ProductSelectSearchProps> = ({
  selectedProductId,
  onSelectProduct,
  onSelect,
  products: propProducts,
  className = '',
  placeholder,
  id,
  mode,
  priceType = 'cost',
}) => {
  const { products: contextProducts, formatMoney } = useErp();
  const products = propProducts || contextProducts;

  // Determine effective mode: if explicitly 'add', or no selectedProductId is given
  const isAddMode = mode === 'add' || (!selectedProductId && mode !== 'select');

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpwards, setOpenUpwards] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = useMemo(() => {
    if (isAddMode || !selectedProductId) return null;
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId, isAddMode]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
      const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
      const matchCategory = p.category ? p.category.toLowerCase().includes(q) : false;
      return matchName || matchSku || matchBarcode || matchCategory;
    });
  }, [products, searchQuery]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect position when opening
  const toggleDropdown = () => {
    if (!isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 280 && rect.top > 280) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
    setIsOpen(!isOpen);
  };

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (product: Product) => {
    if (onSelect) {
      onSelect(product);
    }
    if (onSelectProduct) {
      onSelectProduct(product);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const getDisplayPrice = (p: Product) => {
    if (priceType === 'cost') {
      return p.costPrice || p.purchasePrice || p.sellingPrice || 0;
    }
    return p.sellingPrice || 0;
  };

  const defaultPlaceholder = isAddMode
    ? 'ابحث عن صنف بالاسم أو الباركود أو الرمز لإضافته...'
    : 'ابحث بالاسم أو كود الصنف SKU أو الباركود...';

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <div
        id={id}
        tabIndex={0}
        role="button"
        onClick={toggleDropdown}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all text-xs cursor-pointer shadow-2xs gap-2 min-h-[40px] ${
          isAddMode
            ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/70'
            : 'bg-white border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isAddMode ? (
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Plus className="w-4 h-4" />
            </div>
          ) : (selectedProduct?.imageBase64 || selectedProduct?.imageUrl) ? (
            <img
              src={selectedProduct.imageBase64 || selectedProduct.imageUrl}
              alt={selectedProduct.name}
              className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <Package className="w-4 h-4" />
            </div>
          )}

          <div className="truncate text-right flex-1">
            {isAddMode ? (
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span className="text-emerald-900 font-bold truncate">
                  {placeholder || defaultPlaceholder}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/70 font-bold px-2 py-0.5 rounded-full shrink-0 mr-2">
                  + إضافة صنف
                </span>
              </div>
            ) : selectedProduct ? (
              <>
                <span className="font-bold text-slate-900 block truncate">
                  {selectedProduct.name}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono mt-0.5">
                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                    {selectedProduct.sku}
                  </span>
                  {selectedProduct.barcode && (
                    <span className="text-slate-400">| {selectedProduct.barcode}</span>
                  )}
                  <span className="text-emerald-700 font-bold mr-auto">
                    {priceType === 'cost' ? 'تكلفة: ' : 'سعر: '}
                    {formatMoney(getDisplayPrice(selectedProduct))}
                  </span>
                </span>
              </>
            ) : (
              <span className="text-slate-400 font-medium block truncate">
                {placeholder || 'اختر الصنف...'}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className={`absolute z-[100] right-0 left-0 ${
            openUpwards ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
          } bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 min-w-[320px] max-w-full`}
        >
          {/* Quick Search Header */}
          <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-600 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder || defaultPlaceholder}
              className="w-full text-xs bg-transparent border-none outline-hidden placeholder:text-slate-400 font-medium text-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
            {filteredProducts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs space-y-1">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p>لا يوجد صنف مطابق للبحث "{searchQuery}"</p>
                <p className="text-[10px] text-slate-400">تأكد من كتابة الاسم أو الباركود أو كود الصنف بشكل صحيح</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = !isAddMode && p.id === selectedProductId;
                const priceVal = getDisplayPrice(p);

                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={`flex items-center justify-between p-2.5 hover:bg-emerald-50/80 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50 text-emerald-950 font-bold' : 'text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {p.imageBase64 || p.imageUrl ? (
                        <img
                          src={p.imageBase64 || p.imageUrl}
                          alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                          <Package className="w-4.5 h-4.5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 text-right">
                        <div className="font-bold truncate text-slate-900">{p.name}</div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                          {p.sku && (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                              {p.sku}
                            </span>
                          )}
                          {p.barcode && (
                            <span className="text-slate-400 flex items-center gap-0.5">
                              <Barcode className="w-2.5 h-2.5" />
                              {p.barcode}
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.2 rounded font-medium ${
                              (p.stockQuantity || 0) > 0
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-rose-50 text-rose-700 font-bold'
                            }`}
                          >
                            رصيد: {p.stockQuantity ?? 0} {p.unit || 'قطعة'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0 pl-2">
                      <div className="font-extrabold text-emerald-700 text-xs">
                        {formatMoney(priceVal)}
                      </div>
                      <div className="text-[10px] text-slate-400 text-left">
                        {priceType === 'cost' ? 'سعر التكلفة' : 'سعر البيع'}
                      </div>
                      {isSelected && (
                        <div className="text-emerald-600 flex items-center justify-end text-[10px] mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
