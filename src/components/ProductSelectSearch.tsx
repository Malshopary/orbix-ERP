import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { useErp } from '../context/ErpContext';
import { Search, Package, ChevronDown, Check, X, Barcode } from 'lucide-react';

interface ProductSelectSearchProps {
  selectedProductId: string;
  onSelectProduct: (product: Product) => void;
  className?: string;
  placeholder?: string;
  id?: string;
}

export const ProductSelectSearch: React.FC<ProductSelectSearchProps> = ({
  selectedProductId,
  onSelectProduct,
  className = '',
  placeholder = 'ابحث بالاسم أو كود الصنف SKU أو الباركود...',
  id,
}) => {
  const { products, formatMoney } = useErp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpwards, setOpenUpwards] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
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
      // If space below is less than 260px and space above is bigger, open upwards
      if (spaceBelow < 260 && rect.top > 260) {
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
    onSelectProduct(product);
    setIsOpen(false);
    setSearchQuery('');
  };

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
          }
        }}
        className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-300 bg-white hover:border-slate-400 transition-all text-xs cursor-pointer shadow-2xs gap-2 min-h-[38px]"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedProduct?.imageBase64 ? (
            <img
              src={selectedProduct.imageBase64}
              alt={selectedProduct.name}
              className="w-6 h-6 rounded-md object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="truncate text-right flex-1">
            <span className="font-bold text-slate-900 block truncate">
              {selectedProduct?.name || 'اختر الصنف...'}
            </span>
            {selectedProduct && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-mono">
                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                  {selectedProduct.sku}
                </span>
                {selectedProduct.barcode && (
                  <span className="text-slate-400">| {selectedProduct.barcode}</span>
                )}
                <span className="text-emerald-700 font-semibold mr-auto">
                  {formatMoney(selectedProduct.sellingPrice)}
                </span>
              </span>
            )}
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className={`absolute z-[100] right-0 left-0 ${
            openUpwards ? 'bottom-full mb-1.5 shadow-2xl origin-bottom' : 'top-full mt-1.5 shadow-2xl origin-top'
          } bg-white rounded-2xl border border-slate-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150 min-w-[280px]`}
        >
          {/* Quick Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full text-xs bg-transparent border-none outline-hidden placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                لا يوجد صنف مطابق للبحث "{searchQuery}"
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = p.id === selectedProductId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={`flex items-center justify-between p-2.5 hover:bg-emerald-50/70 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50 text-emerald-950 font-bold' : 'text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {p.imageBase64 ? (
                        <img
                          src={p.imageBase64}
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1 text-right">
                        <div className="font-bold truncate text-slate-900">{p.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                            {p.sku}
                          </span>
                          {p.barcode && (
                            <span className="text-slate-400 flex items-center gap-0.5">
                              <Barcode className="w-2.5 h-2.5" />
                              {p.barcode}
                            </span>
                          )}
                          <span className="bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-medium">
                            رصيد: {p.stockQuantity} {p.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0 pl-2">
                      <div className="font-extrabold text-emerald-700 text-xs">
                        {formatMoney(p.sellingPrice)}
                      </div>
                      {isSelected && (
                        <div className="text-emerald-600 flex items-center justify-end text-[10px]">
                          <Check className="w-3 h-3" />
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
