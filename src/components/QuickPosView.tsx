import React, { useState, useMemo } from 'react';
import { useErp } from '../context/ErpContext';
import { Product, Customer, PaymentReceipt, SalesInvoice } from '../types';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  UserPlus,
  QrCode,
  Coins,
  CreditCard,
  Smartphone,
  Banknote,
  Receipt,
  RotateCcw,
  Sparkles,
  PackageCheck,
  AlertTriangle,
  Building2,
  Calendar,
  X
} from 'lucide-react';

export const QuickPosView: React.FC = () => {
  const {
    products,
    customers,
    addCustomer,
    createQuickPosSale,
    companyProfile,
    currency,
    formatMoney,
    currentUser,
    showAlert,
    showConfirm,
  } = useErp();

  const companyVat = companyProfile?.defaultVatRate ?? 15;

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart state
  const [cartItems, setCartItems] = useState<
    {
      product: Product;
      quantity: number;
      unitPrice: number;
      discount: number;
    }[]
  >([]);

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-walkin');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Payment state - Default to Credit (أجل) and Company default VAT rate
  const [paymentMethod, setPaymentMethod] = useState<PaymentReceipt['paymentMethod']>('credit');
  const [discountTotal, setDiscountTotal] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(companyVat);
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');

  // Post-Sale & Print Modal
  const [printedInvoice, setPrintedInvoice] = useState<SalesInvoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState<'thermal80' | 'a4'>('thermal80');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedCategory === 'all' || prod.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        prod.name.toLowerCase().includes(query) ||
        prod.sku.toLowerCase().includes(query) ||
        (prod.barcode && prod.barcode.toLowerCase().includes(query)) ||
        prod.category.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Selected customer object
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      showAlert({
        title: 'نفاد المخزون',
        message: `تنبيه: صنف "${product.name}" نفد من المخزون تماماً (الرصيد 0).`,
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          showAlert({
            title: 'تجاوز رصيد المخزن',
            message: `تنبيه: الكمية المطلوبة تتجاوز الرصيد المتوفر بالمخزن (${product.stockQuantity} قطعة).`,
            type: 'warning',
            confirmText: 'فهمت',
          });
          return prev;
        }
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: product.sellingPrice,
          discount: 0,
        },
      ];
    });
  };

  // Update item quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.product.id === productId) {
            const newQty = it.quantity + delta;
            if (newQty > it.product.stockQuantity) {
              showAlert({
                title: 'تجاوز رصيد المخزن',
                message: `الكمية القصوى المتاحة في المخزن لهذا الصنف هي ${it.product.stockQuantity} قطعة.`,
                type: 'warning',
                confirmText: 'فهمت',
              });
              return it;
            }
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as any[]
    );
  };

  // Remove item
  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  // Update item discount
  const updateItemDiscount = (productId: string, discount: number) => {
    setCartItems((prev) =>
      prev.map((it) =>
        it.product.id === productId ? { ...it, discount: Math.max(0, discount) } : it
      )
    );
  };

  // Update item unit price
  const updateItemPrice = (productId: string, price: number) => {
    setCartItems((prev) =>
      prev.map((it) =>
        it.product.id === productId ? { ...it, unitPrice: Math.max(0, price) } : it
      )
    );
  };

  // Clear Cart
  const clearCart = () => {
    if (cartItems.length > 0) {
      showConfirm(
        'هل تريد بالتأكيد تفريغ كافة الأصناف من سلة الكاشير الحالية؟',
        () => {
          setCartItems([]);
          setDiscountTotal(0);
          setPaidAmountInput('');
        },
        'تأكيد تفريغ السلة',
        'تفريغ السلة'
      );
    }
  };

  // Calculations
  const cartSubtotal = cartItems.reduce(
    (sum, it) => sum + (it.quantity * it.unitPrice - it.discount),
    0
  );
  const netBeforeTax = Math.max(0, cartSubtotal - discountTotal);
  const cartVatTotal = (netBeforeTax * vatRate) / 100;
  const cartGrandTotal = netBeforeTax + cartVatTotal;

  const actualPaidAmount = paidAmountInput !== '' ? parseFloat(paidAmountInput) || 0 : cartGrandTotal;
  const customerChange = Math.max(0, actualPaidAmount - cartGrandTotal);

  // Quick Customer Creation
  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    addCustomer({
      name: newCustName.trim(),
      companyName: 'عميل نقطة بيع',
      phone: newCustPhone.trim() || '01000000000',
      email: '',
      address: 'القاهرة',
      creditLimit: 20000,
      paymentTermsDays: 15,
      notes: 'تمت إضافته سريعاً من شاشة POS الكاشير',
    });

    setNewCustName('');
    setNewCustPhone('');
    setShowAddCustomerModal(false);
  };

  // Process and Submit Invoice
  const handleCheckout = (autoPrint: boolean = false) => {
    if (cartItems.length === 0) {
      showAlert({
        title: 'السلة فارغة',
        message: 'يرجى اختيار صنف واحد على الأقل لإصدار فاتورة الكاشير.',
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    const saleItems = cartItems.map((it) => {
      const itemSubtotal = it.quantity * it.unitPrice - it.discount;
      const itemVat = (itemSubtotal * vatRate) / 100;
      return {
        productId: it.product.id,
        productName: it.product.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount,
        subtotal: itemSubtotal,
        vatAmount: itemVat,
        total: itemSubtotal + itemVat,
      };
    });

    const newInvoice = createQuickPosSale({
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerTaxNumber: currentCustomer.taxNumber,
      items: saleItems,
      discountTotal,
      vatRate,
      paymentMethod,
      paidAmount: actualPaidAmount,
      notes: invoiceNotes,
    });

    setPrintedInvoice(newInvoice);
    setCartItems([]);
    setDiscountTotal(0);
    setPaidAmountInput('');
    setInvoiceNotes('');

    if (autoPrint) {
      setShowReceiptModal(true);
    } else {
      setShowReceiptModal(true);
    }
  };

  // Trigger print
  const triggerNativePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Cashier Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white">
                نقطة البيع والفاتورة السريعة (Quick POS)
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                كاشير فوري
              </span>
            </div>
            <p className="text-xs text-slate-400">
              اختيار مباشر للأصناف والعميل، تحديث فوري للمخزون، وطباعة الفاتورة والباركود
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>العملة: <strong className="text-white font-mono">{currency} ({formatMoney(0).replace('0.00 ', '')})</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>الكاشير: <strong className="text-white">{currentUser?.name || 'كاشير الفرع'}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Grid: Products (Left) + Side Cart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Section: Product Catalog (7 or 8 columns on large screens) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                placeholder="ابحث بالاسم، أو الباركود، أو كود الصنف (SKU)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 w-5 h-5 rounded-full flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? '✨ كافة الأصناف' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Visual Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((prod) => {
              const inCart = cartItems.find((it) => it.product.id === prod.id);
              const isLowStock = prod.stockQuantity <= prod.minStockAlert;
              const isOutOfStock = prod.stockQuantity <= 0;

              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && addToCart(prod)}
                  className={`group relative bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs cursor-pointer select-none ${
                    isOutOfStock
                      ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                      : inCart
                      ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/20 hover:shadow-md'
                      : 'border-slate-200 hover:border-slate-400 hover:shadow-md'
                  }`}
                >
                  {/* Product Image Thumbnail */}
                  <div className="relative w-full h-32 bg-slate-100 overflow-hidden">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
                        <PackageCheck className="w-8 h-8 mb-1 opacity-60" />
                        <span className="text-[10px] font-medium">{prod.category}</span>
                      </div>
                    )}

                    {/* Stock Alert Badge */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {isOutOfStock ? (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                          نفد المخزون
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          متبقي {prod.stockQuantity}
                        </span>
                      ) : (
                        <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md shadow-xs">
                          متاح: {prod.stockQuantity} {prod.unit}
                        </span>
                      )}
                    </div>

                    {/* In-Cart Counter Pill */}
                    {inCart && (
                      <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce">
                        {inCart.quantity}
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block truncate">
                        {prod.sku} {prod.barcode ? `• ${prod.barcode}` : ''}
                      </span>
                      <h3 className="font-bold text-xs text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                        {prod.name}
                      </h3>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">السعر</span>
                        <p className="font-bold text-sm text-emerald-700 font-mono leading-none">
                          {formatMoney(prod.sellingPrice)}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) addToCart(prod);
                        }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : inCart
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                        title="إضافة للسلة"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 space-y-2">
              <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">لا توجد أصناف مطابقة للبحث</h4>
              <p className="text-xs text-slate-400">
                جرب البحث بكلمة مختلفة أو اختر تصنيفاً آخر
              </p>
            </div>
          )}
        </div>

        {/* Right Section: Side Cart & Checkout (5 or 4 columns on large screens) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col h-[calc(100vh-140px)] min-h-[640px] sticky top-20">
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-slate-800" />
                  <h3 className="font-bold text-sm text-slate-900">
                    السلة الجانبية ({cartItems.reduce((s, it) => s + it.quantity, 0)} قطعة)
                  </h3>
                </div>
                {cartItems.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    تفريغ
                  </button>
                )}
              </div>

              {/* Customer Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600">العميل المشتري:</label>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    + عميل جديد
                  </button>
                </div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900 cursor-pointer shadow-2xs"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.currentBalance > 0 ? `(مديونية: ${formatMoney(c.currentBalance)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Items Scrollable List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
              {cartItems.length > 0 && (
                <div className="hidden sm:grid grid-cols-12 gap-1.5 px-2 py-1 bg-slate-100/90 rounded-lg text-[10px] font-bold text-slate-600">
                  <div className="col-span-4">الصنف والمنتج</div>
                  <div className="col-span-2 text-center">الكمية</div>
                  <div className="col-span-2 text-center">السعر</div>
                  <div className="col-span-2 text-center">خصم الصنف</div>
                  <div className="col-span-2 text-center">الإجمالي</div>
                </div>
              )}

              {cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-1.5 items-center hover:border-slate-300 transition-colors"
                >
                  {/* Thumbnail & Name */}
                  <div className="sm:col-span-4 flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                          صنف
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate" title={item.product.name}>
                        {item.product.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.product.sku}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="sm:col-span-2 flex items-center justify-center">
                    <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 p-0.5 w-full max-w-[100px] justify-between">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-center font-bold text-xs text-slate-900 font-mono flex-1">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Unit Price */}
                  <div className="sm:col-span-2 text-center">
                    <span className="sm:hidden text-[10px] text-slate-400 ml-1">السعر:</span>
                    <span className="font-bold text-xs text-slate-800 font-mono">
                      {formatMoney(item.unitPrice)}
                    </span>
                  </div>

                  {/* Single Item Discount Input */}
                  <div className="sm:col-span-2 flex items-center gap-1">
                    <span className="sm:hidden text-[10px] text-amber-700 font-bold">خصم:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={item.discount || ''}
                      onChange={(e) => updateItemDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                      className="w-full bg-amber-50/60 border border-amber-300 focus:border-amber-500 rounded-lg px-1.5 py-1 text-xs font-mono font-bold text-center text-amber-900 focus:outline-hidden"
                      title="خصم على الصنف"
                    />
                  </div>

                  {/* Item Total & Delete */}
                  <div className="sm:col-span-2 flex items-center justify-between gap-1 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex-1 text-center font-bold text-xs text-emerald-700 font-mono">
                      {formatMoney(Math.max(0, item.quantity * item.unitPrice - (item.discount || 0)))}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                      title="حذف من السلة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {cartItems.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <ShoppingCart className="w-10 h-10 opacity-40 mx-auto" />
                  <p className="text-xs font-medium">السلة فارغة حالياً</p>
                  <p className="text-[11px] text-slate-400">
                    انقر على أي صنف من القائمة لإضافته مباشرة
                  </p>
                </div>
              )}
            </div>

            {/* Cart Footer / Totals & Payment Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/90 rounded-b-2xl space-y-3">
              {/* Payment Methods */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">طريقة الدفع والتسوية (الافتراضي: آجل):</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      paymentMethod === 'credit'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    أجل / على الحساب
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/40'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    كاش نقدي
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/40'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    فيزا / شبكة
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/40'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    إنستاباي / محفظة
                  </button>
                </div>
              </div>

              {/* Discount & Tax Options */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    خصم إضافي عام ({currency}):
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={discountTotal || ''}
                    onChange={(e) => setDiscountTotal(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    نسبة الضريبة (الافتراضي للشركة: {companyVat}%):
                  </label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  >
                    <option value={companyVat}>{companyVat}% (الافتراضي للشركة)</option>
                    {companyVat !== 15 && <option value="15">15% (السعودية ZATCA)</option>}
                    {companyVat !== 14 && <option value="14">14% (مصر - قيمة مضافة)</option>}
                    {companyVat !== 5 && <option value="5">5% (الإمارات / عمان)</option>}
                    <option value="0">0% (معفى من الضريبة)</option>
                  </select>
                </div>
              </div>

              {/* Summary Calculations */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono">{formatMoney(cartSubtotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex items-center justify-between text-rose-600 font-medium">
                    <span>قيمة الخصم:</span>
                    <span className="font-mono">-{formatMoney(discountTotal)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span>ضريبة القيمة المضافة ({vatRate}%):</span>
                  <span className="font-mono">{formatMoney(cartVatTotal)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold text-slate-900 text-sm">
                  <span>المبلغ الصافي المطلوب:</span>
                  <span className="text-emerald-700 font-mono text-base">{formatMoney(cartGrandTotal)}</span>
                </div>
              </div>

              {/* Cash Paid / Change Calculator */}
              {paymentMethod === 'cash' && (
                <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-emerald-900">المبلغ المدفوع كاش:</label>
                    <input
                      type="number"
                      placeholder={cartGrandTotal.toString()}
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value)}
                      className="w-28 bg-white border border-emerald-300 rounded-lg px-2 py-0.5 text-xs text-left font-mono font-bold text-slate-900 focus:outline-hidden"
                    />
                  </div>
                  {customerChange > 0 && (
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 pt-1 border-t border-emerald-200/80">
                      <span>الفكة / المتبقي للعميل:</span>
                      <span className="font-mono text-sm">{formatMoney(customerChange)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={cartItems.length === 0}
                  onClick={() => handleCheckout(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>تأكيد وحفظ</span>
                </button>

                <button
                  type="button"
                  disabled={cartItems.length === 0}
                  onClick={() => handleCheckout(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>تأكيد وطباعة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                إضافة عميل سريع لنقطة البيع
              </h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">اسم العميل / الشركة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: م. أحمد عبدالفتاح"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">رقم الهاتف / الموبايل</label>
                <input
                  type="text"
                  placeholder="01012345678"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                >
                  حفظ واختيار العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Receipt & Print Preview Modal */}
      {showReceiptModal && printedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Controls Bar (Hidden on Print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">معاينة وطباعة الفاتورة</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                  <button
                    onClick={() => setReceiptFormat('thermal80')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      receiptFormat === 'thermal80' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300'
                    }`}
                  >
                    إيصال حراري 80mm
                  </button>
                  <button
                    onClick={() => setReceiptFormat('a4')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      receiptFormat === 'a4' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300'
                    }`}
                  >
                    فاتورة رسمية A4
                  </button>
                </div>

                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="text-slate-400 hover:text-white w-7 h-7 rounded-full flex items-center justify-center bg-white/10"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper Container */}
            <div className="p-6 bg-slate-100 overflow-y-auto max-h-[70vh]">
              <div
                id="pos-printable-receipt"
                className={`mx-auto bg-white shadow-md p-6 border border-slate-300 text-slate-900 ${
                  receiptFormat === 'thermal80' ? 'max-w-[340px] text-xs font-mono' : 'max-w-full text-sm'
                }`}
              >
                {/* Header: Company Logo & Info */}
                <div className="text-center space-y-1.5 pb-4 border-b-2 border-dashed border-slate-300">
                  {companyProfile.logoBase64 ? (
                    <img
                      src={companyProfile.logoBase64}
                      alt="Company Logo"
                      style={{ maxWidth: `${companyProfile.logoWidth || 160}px`, maxHeight: '60px' }}
                      className="mx-auto object-contain mb-2"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl mx-auto flex items-center justify-center mb-1">
                      <Building2 className="w-6 h-6 text-emerald-400" />
                    </div>
                  )}

                  <h2 className="font-bold text-base text-slate-900 tracking-tight">
                    {companyProfile.nameAr}
                  </h2>
                  <p className="text-[11px] text-slate-500">{companyProfile.nameEn}</p>
                  <p className="text-[11px] text-slate-600">{companyProfile.address}</p>
                  <p className="text-[11px] text-slate-600">
                    هاتف: {companyProfile.phone} • م: {companyProfile.mobile}
                  </p>
                  <div className="text-[11px] font-bold text-slate-800 bg-slate-100 py-1 rounded-md mt-1">
                    الرقم الضريبي: {companyProfile.taxNumber} | س.ت: {companyProfile.commercialRegister}
                  </div>
                </div>

                {/* Invoice Meta */}
                <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">رقم الفاتورة:</span>
                    <span className="font-bold font-mono">{printedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">التاريخ والوقت:</span>
                    <span className="font-mono">{printedInvoice.date} - {new Date().toLocaleTimeString('ar-EG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">العميل:</span>
                    <span className="font-bold">{printedInvoice.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">الكاشير:</span>
                    <span>{currentUser?.name || 'كاشير'}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-3 border-b-2 border-dashed border-slate-300">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-500">
                        <th className="pb-1">الصنف</th>
                        <th className="pb-1 text-center">الكمية</th>
                        <th className="pb-1 text-left">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {printedInvoice.items.map((it, idx) => (
                        <tr key={idx} className="text-[11px]">
                          <td className="py-1.5 pr-0.5">
                            <span className="font-bold block">{it.productName}</span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {formatMoney(it.unitPrice)} للقطعة
                            </span>
                          </td>
                          <td className="py-1.5 text-center font-mono font-bold">
                            {it.quantity}
                          </td>
                          <td className="py-1.5 text-left font-mono font-bold">
                            {formatMoney(it.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="py-3 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>المجموع قبل الضريبة:</span>
                    <span className="font-mono">{formatMoney(printedInvoice.subtotal)}</span>
                  </div>
                  {printedInvoice.discountTotal > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>قيمة الخصم:</span>
                      <span className="font-mono">-{formatMoney(printedInvoice.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>ضريبة القيمة المضافة ({printedInvoice.vatRate}%):</span>
                    <span className="font-mono">{formatMoney(printedInvoice.vatTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-300">
                    <span>الصافي الإجمالي:</span>
                    <span className="font-mono">{formatMoney(printedInvoice.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-medium">
                    <span>المسدد ({printedInvoice.notes}):</span>
                    <span className="font-mono">{formatMoney(printedInvoice.paidAmount)}</span>
                  </div>
                  {printedInvoice.remainingAmount > 0 && (
                    <div className="flex justify-between text-amber-800 font-bold">
                      <span>المتبقي آجل على العميل:</span>
                      <span className="font-mono">{formatMoney(printedInvoice.remainingAmount)}</span>
                    </div>
                  )}
                </div>

                {/* QR Code & Footer */}
                <div className="pt-3 border-t-2 border-dashed border-slate-300 text-center space-y-2">
                  <div className="w-24 h-24 mx-auto bg-slate-50 border border-slate-300 p-1 flex items-center justify-center">
                    <QrCode className="w-20 h-20 text-slate-900" />
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono tracking-tighter truncate">
                    {printedInvoice.qrData}
                  </p>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight">
                    {companyProfile.invoiceFooterNotes}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    نظام Orbix ERP • تم الإصدار إلكترونياً
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between print:hidden">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={triggerNativePrint}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                طباعة الفاتورة الآن (Ctrl + P)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
