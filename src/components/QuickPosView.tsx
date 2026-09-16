import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import { Product, Customer, PaymentReceipt, SalesInvoice, ProductUnit } from '../types';
import { printDocumentElement } from '../utils/printUtils';
import { SearchableSelect } from './SearchableSelect';
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
  X,
  MessageCircle,
  Vault,
  Clock,
  Send,
  FileSpreadsheet,
  Check,
  Layers,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react';
import { InvoiceQrCode } from '../utils/qrCodeGenerator';
import { openWhatsAppShare, openZReportWhatsAppShare } from '../utils/whatsappShare';

export const QuickPosView: React.FC = () => {
  const {
    products,
    customers,
    addCustomer,
    createQuickPosSale,
    salesInvoices,
    salesReturns,
    logAuditEvent,
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

  // Multi-Unit PosCartItem Interface
  interface PosCartItem {
    id: string; // unique row identifier, e.g. `${product.id}-${unit?.id || 'base'}`
    product: Product;
    quantity: number;
    unitPrice: number;
    discount: number;
    selectedUnit?: ProductUnit;
  }

  // Multi-Cart Interface
  interface PosCart {
    id: string;
    name: string;
    createdAt: number;
    items: PosCartItem[];
    selectedCustomerId: string;
    paymentMethod: PaymentReceipt['paymentMethod'];
    discountTotal: number;
    vatRate: number;
    paidAmountInput: string;
    invoiceNotes: string;
  }

  const createDefaultCart = (cartNum: number = 1): PosCart => ({
    id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: `سلة ${cartNum}`,
    createdAt: Date.now(),
    items: [],
    selectedCustomerId: 'cust-walkin',
    paymentMethod: 'credit',
    discountTotal: 0,
    vatRate: companyVat,
    paidAmountInput: '',
    invoiceNotes: '',
  });

  const [carts, setCarts] = useState<PosCart[]>(() => {
    try {
      const saved = localStorage.getItem('orbix_pos_multi_carts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((c, idx) => ({
            id: c.id || `cart-${idx + 1}`,
            name: c.name || `سلة ${idx + 1}`,
            createdAt: c.createdAt || Date.now(),
            items: Array.isArray(c.items) ? c.items : [],
            selectedCustomerId: c.selectedCustomerId || 'cust-walkin',
            paymentMethod: c.paymentMethod || 'credit',
            discountTotal: typeof c.discountTotal === 'number' ? c.discountTotal : 0,
            vatRate: typeof c.vatRate === 'number' ? c.vatRate : companyVat,
            paidAmountInput: c.paidAmountInput || '',
            invoiceNotes: c.invoiceNotes || '',
          }));
        }
      }
    } catch {}
    return [createDefaultCart(1)];
  });

  const [activeCartId, setActiveCartId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('orbix_pos_active_cart_id');
      if (saved) return saved;
    } catch {}
    return carts[0]?.id || 'cart-1';
  });

  const [editingCartId, setEditingCartId] = useState<string | null>(null);
  const [editingCartName, setEditingCartName] = useState<string>('');
  const [showAllCartsDropdown, setShowAllCartsDropdown] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Scroll tabs horizontally
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 180;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // When activeCartId changes or carts added, ensure active tab is scrolled into view
  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeEl = tabsContainerRef.current.querySelector(`[data-cart-id="${activeCartId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeCartId, carts.length]);

  // Persist carts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('orbix_pos_multi_carts', JSON.stringify(carts));
      localStorage.setItem('orbix_pos_active_cart_id', activeCartId);
    } catch {}
  }, [carts, activeCartId]);

  // Ensure activeCartId exists
  useEffect(() => {
    if (carts.length > 0 && !carts.some((c) => c.id === activeCartId)) {
      setActiveCartId(carts[0].id);
    }
  }, [carts, activeCartId]);

  const activeCart = useMemo(() => {
    return carts.find((c) => c.id === activeCartId) || carts[0] || createDefaultCart(1);
  }, [carts, activeCartId]);

  // Active Cart values & reactive setters (seamless drop-in replacement)
  const cartItems = activeCart.items || [];
  const selectedCustomerId = activeCart.selectedCustomerId || 'cust-walkin';
  const paymentMethod = activeCart.paymentMethod || 'credit';
  const discountTotal = activeCart.discountTotal || 0;
  const vatRate = activeCart.vatRate ?? companyVat;
  const paidAmountInput = activeCart.paidAmountInput || '';
  const invoiceNotes = activeCart.invoiceNotes || '';

  const setCartItems = (action: PosCartItem[] | ((prev: PosCartItem[]) => PosCartItem[])) => {
    setCarts((prevCarts) =>
      prevCarts.map((c) => {
        if (c.id === activeCart.id) {
          const newItems = typeof action === 'function' ? action(c.items || []) : action;
          return { ...c, items: newItems };
        }
        return c;
      })
    );
  };

  const setSelectedCustomerId = (val: string | ((prev: string) => string)) => {
    setCarts((prevCarts) =>
      prevCarts.map((c) => {
        if (c.id === activeCart.id) {
          const newVal = typeof val === 'function' ? val(c.selectedCustomerId || 'cust-walkin') : val;
          return { ...c, selectedCustomerId: newVal };
        }
        return c;
      })
    );
  };

  const setPaymentMethod = (
    val: PaymentReceipt['paymentMethod'] | ((prev: PaymentReceipt['paymentMethod']) => PaymentReceipt['paymentMethod'])
  ) => {
    setCarts((prevCarts) =>
      prevCarts.map((c) => {
        if (c.id === activeCart.id) {
          const newVal = typeof val === 'function' ? val(c.paymentMethod || 'credit') : val;
          return { ...c, paymentMethod: newVal };
        }
        return c;
      })
    );
  };

  const setDiscountTotal = (val: number | ((prev: number) => number)) => {
    setCarts((prevCarts) =>
      prevCarts.map((c) => {
        if (c.id === activeCart.id) {
          const newVal = typeof val === 'function' ? val(c.discountTotal || 0) : val;
          return { ...c, discountTotal: newVal };
        }
        return c;
      })
    );
  };

  const setVatRate = (val: number | ((prev: number) => number)) => {
    setCarts((prevCarts) =>
      prevCarts.map((c) => {
        if (c.id === activeCart.id) {
          const newVal = typeof val === 'function' ? val(c.vatRate ?? companyVat) : val;
          return { ...c, vatRate: newVal };
        }
        return c;
      })
    );
  };

  const setPaidAmountInput = (val: string | ((prev: string) => string)) => {
    setCarts((prevCarts) =>
      prevCarts.map((c) => {
        if (c.id === activeCart.id) {
          const newVal = typeof val === 'function' ? val(c.paidAmountInput || '') : val;
          return { ...c, paidAmountInput: newVal };
        }
        return c;
      })
    );
  };

  const setInvoiceNotes = (val: string | ((prev: string) => string)) => {
    setCarts((prevCarts) =>
      prevCarts.map((c) => {
        if (c.id === activeCart.id) {
          const newVal = typeof val === 'function' ? val(c.invoiceNotes || '') : val;
          return { ...c, invoiceNotes: newVal };
        }
        return c;
      })
    );
  };

  // Multi-Cart Controls
  const handleAddNewCart = () => {
    const existingNums = carts.map((c) => {
      const match = c.name.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxNum = existingNums.length > 0 ? Math.max(...existingNums, 0) : 0;
    const nextNum = maxNum + 1;

    const newCart = createDefaultCart(nextNum);
    setCarts((prev) => [...prev, newCart]);
    setActiveCartId(newCart.id);
  };

  const handleSwitchCart = (cartId: string) => {
    setActiveCartId(cartId);
  };

  const handleCloseCart = (cartId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const targetCart = carts.find((c) => c.id === cartId);
    if (!targetCart) return;

    const executeClose = () => {
      if (carts.length <= 1) {
        const fresh = createDefaultCart(1);
        setCarts([fresh]);
        setActiveCartId(fresh.id);
        return;
      }

      const remaining = carts.filter((c) => c.id !== cartId);
      setCarts(remaining);
      if (activeCartId === cartId) {
        const nextActive = remaining[remaining.length - 1];
        setActiveCartId(nextActive.id);
      }
    };

    if (targetCart.items && targetCart.items.length > 0) {
      showConfirm(
        `سلة "${targetCart.name}" تحتوي على ${targetCart.items.length} صنف. هل تريد بالتأكيد إغلاقها وحذف محتوياتها؟`,
        executeClose,
        'إغلاق السلة',
        'نعم، إغلاق وحذف'
      );
    } else {
      executeClose();
    }
  };

  const startRenameCart = (cart: PosCart, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCartId(cart.id);
    setEditingCartName(cart.name);
  };

  const saveRenameCart = (cartId: string) => {
    if (editingCartName.trim()) {
      setCarts((prev) =>
        prev.map((c) => (c.id === cartId ? { ...c, name: editingCartName.trim() } : c))
      );
    }
    setEditingCartId(null);
  };

  // Customer selection
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Post-Sale & Print Modal
  const [printedInvoice, setPrintedInvoice] = useState<SalesInvoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState<'thermal80' | 'a4'>('thermal80');

  // Z-Report / Daily Shift Closing State
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [shiftInitialCash, setShiftInitialCash] = useState<number>(() => {
    const saved = localStorage.getItem('orbix_pos_shift_initial_cash');
    return saved ? parseFloat(saved) || 0 : 500;
  });
  const [actualCountedCashInput, setActualCountedCashInput] = useState<string>('');
  const [shiftNotes, setShiftNotes] = useState<string>('');
  const [managerPhone, setManagerPhone] = useState<string>(() => {
    return localStorage.getItem('orbix_pos_manager_phone') || '';
  });
  const [shiftStartTime] = useState<string>(() => {
    const saved = localStorage.getItem('orbix_pos_shift_start_time');
    if (saved) return saved;
    const now = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    localStorage.setItem('orbix_pos_shift_start_time', now);
    return now;
  });

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Today's POS Invoices for Z-Report
  const todayPosInvoices = useMemo(() => {
    return salesInvoices.filter(
      (inv) => inv.date === todayDateStr && (inv.invoiceNumber.startsWith('POS-') || inv.notes?.includes('كاشير'))
    );
  }, [salesInvoices, todayDateStr]);

  const todayReturns = useMemo(() => {
    return (salesReturns || []).filter((r) => r.date === todayDateStr);
  }, [salesReturns, todayDateStr]);

  const totalPosSales = todayPosInvoices.reduce((s, inv) => s + inv.grandTotal, 0);
  const totalPosDiscounts = todayPosInvoices.reduce((s, inv) => s + (inv.discountTotal || 0), 0);
  const totalPosVat = todayPosInvoices.reduce((s, inv) => s + (inv.vatTotal || 0), 0);

  const totalCashSales = todayPosInvoices
    .filter((inv) => inv.notes?.includes('نقداً') || (!inv.notes?.includes('فيزا') && !inv.notes?.includes('محفظة') && !inv.notes?.includes('آجل') && inv.paidAmount > 0))
    .reduce((s, inv) => s + inv.paidAmount, 0);

  const totalCardSales = todayPosInvoices
    .filter((inv) => inv.notes?.includes('فيزا') || inv.notes?.includes('شبكة'))
    .reduce((s, inv) => s + inv.paidAmount, 0);

  const totalEWalletSales = todayPosInvoices
    .filter((inv) => inv.notes?.includes('محفظة') || inv.notes?.includes('إنستاباي'))
    .reduce((s, inv) => s + inv.paidAmount, 0);

  const totalCreditSales = todayPosInvoices
    .filter((inv) => inv.remainingAmount > 0)
    .reduce((s, inv) => s + inv.remainingAmount, 0);

  const totalRefunds = todayReturns.reduce((s, r) => s + (r.totalRefundAmount || 0), 0);

  const expectedDrawerCash = Math.max(0, shiftInitialCash + totalCashSales - totalRefunds);
  const actualCountedCash = actualCountedCashInput !== '' ? parseFloat(actualCountedCashInput) || 0 : expectedDrawerCash;
  const cashVariance = actualCountedCash - expectedDrawerCash;

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Products (support name, SKU, product barcode, and any secondary unit barcode)
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCat = selectedCategory === 'all' || prod.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        prod.name.toLowerCase().includes(query) ||
        prod.sku.toLowerCase().includes(query) ||
        (prod.barcode && prod.barcode.toLowerCase().includes(query)) ||
        (prod.units && prod.units.some((u) => u.barcode && u.barcode.toLowerCase().includes(query))) ||
        prod.category.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Selected customer object
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Add to cart with support for packaging units
  const addToCart = (product: Product, targetUnit?: ProductUnit) => {
    const factor = targetUnit?.factor || 1;
    if (product.stockQuantity < factor) {
      showAlert({
        title: 'نفاد المخزون',
        message: `تنبيه: صنف "${product.name}" المتوفر منه ${product.stockQuantity} قطعة فقط، والوحدة المطلوبة (${targetUnit?.name || product.unit}) تتطلب ${factor} قطعة.`,
        type: 'warning',
        confirmText: 'فهمت',
      });
      return;
    }

    const rowId = `${product.id}-${targetUnit?.id || 'base'}`;
    const initialPrice = targetUnit?.sellingPrice !== undefined && targetUnit?.sellingPrice > 0
      ? targetUnit.sellingPrice
      : product.sellingPrice * factor;

    setCartItems((prev) => {
      const existing = prev.find((it) => it.id === rowId);

      // Check cumulative pieces requested in cart
      const currentPieces = prev
        .filter((it) => it.product.id === product.id)
        .reduce((sum, it) => sum + it.quantity * (it.selectedUnit?.factor || 1), 0);

      if (currentPieces + factor > product.stockQuantity) {
        showAlert({
          title: 'تجاوز رصيد المخزن',
          message: `تنبيه: الكمية المطلوبة تتجاوز الرصيد المتوفر بالمخزن (${product.stockQuantity} قطعة).`,
          type: 'warning',
          confirmText: 'فهمت',
        });
        return prev;
      }

      if (existing) {
        return prev.map((it) =>
          it.id === rowId ? { ...it, quantity: it.quantity + 1 } : it
        );
      }

      return [
        ...prev,
        {
          id: rowId,
          product,
          quantity: 1,
          unitPrice: initialPrice,
          discount: 0,
          selectedUnit: targetUnit,
        },
      ];
    });
  };

  // Update item quantity
  const updateQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) => {
      const target = prev.find((it) => it.id === cartItemId);
      if (!target) return prev;

      const factor = target.selectedUnit?.factor || 1;
      const newQty = target.quantity + delta;

      if (delta > 0) {
        const currentPieces = prev
          .filter((it) => it.product.id === target.product.id)
          .reduce((sum, it) => sum + it.quantity * (it.selectedUnit?.factor || 1), 0);

        if (currentPieces + factor > target.product.stockQuantity) {
          showAlert({
            title: 'تجاوز رصيد المخزن',
            message: `الكمية القصوى المتاحة في المخزن لهذا الصنف هي ${target.product.stockQuantity} قطعة.`,
            type: 'warning',
            confirmText: 'فهمت',
          });
          return prev;
        }
      }

      return prev
        .map((it) => {
          if (it.id === cartItemId) {
            return newQty > 0 ? { ...it, quantity: newQty } : null;
          }
          return it;
        })
        .filter(Boolean) as PosCartItem[];
    });
  };

  // Remove item
  const removeFromCart = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== cartItemId));
  };

  // Update item discount
  const updateItemDiscount = (cartItemId: string, discount: number) => {
    setCartItems((prev) =>
      prev.map((it) =>
        it.id === cartItemId ? { ...it, discount: Math.max(0, discount) } : it
      )
    );
  };

  // Update item unit price
  const updateItemPrice = (cartItemId: string, price: number) => {
    setCartItems((prev) =>
      prev.map((it) =>
        it.id === cartItemId ? { ...it, unitPrice: Math.max(0, price) } : it
      )
    );
  };

  // Update unit for an item in cart
  const updateItemUnit = (cartItemId: string, newUnitId: string) => {
    setCartItems((prev) => {
      const target = prev.find((it) => it.id === cartItemId);
      if (!target) return prev;

      let newSelectedUnit: ProductUnit | undefined = undefined;
      let newPrice = target.product.sellingPrice;
      let newRowId = `${target.product.id}-base`;

      if (newUnitId !== 'base') {
        const found = target.product.units?.find((u) => u.id === newUnitId);
        if (found) {
          newSelectedUnit = found;
          newPrice = found.sellingPrice || (target.product.sellingPrice * found.factor);
          newRowId = `${target.product.id}-${found.id}`;
        }
      }

      return prev.map((it) => {
        if (it.id === cartItemId) {
          return {
            ...it,
            id: newRowId,
            selectedUnit: newSelectedUnit,
            unitPrice: newPrice,
          };
        }
        return it;
      });
    });
  };

  // Clear Cart
  const clearCart = () => {
    if (cartItems.length > 0) {
      showConfirm(
        `هل تريد بالتأكيد تفريغ كافة الأصناف من "${activeCart.name}" الحالية؟`,
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
        unitName: it.selectedUnit?.name || it.product.unit,
        unitFactor: it.selectedUnit?.factor || 1,
        unitBarcode: it.selectedUnit?.barcode || it.product.barcode,
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

    // If there are other waiting carts, close this checked-out cart and switch to the next cart
    if (carts.length > 1) {
      const remaining = carts.filter((c) => c.id !== activeCart.id);
      setCarts(remaining);
      setActiveCartId(remaining[0].id);
    } else {
      setCartItems([]);
      setDiscountTotal(0);
      setPaidAmountInput('');
      setInvoiceNotes('');
    }

    if (autoPrint) {
      setShowReceiptModal(true);
    } else {
      setShowReceiptModal(true);
    }
  };

  // Trigger print
  const triggerNativePrint = () => {
    printDocumentElement('pos-printable-receipt', {
      title: `فاتورة_كاشير_${printedInvoice?.invoiceNumber || ''}`,
      orientation: 'portrait',
    });
  };

  // Trigger Z-Report thermal 80mm print
  const triggerZReportPrint = () => {
    printDocumentElement('pos-z-report-receipt', {
      title: `تقرير_تقفيل_وردية_${todayDateStr}`,
      orientation: 'portrait',
    });
  };

  // Share Z-Report via WhatsApp to manager
  const handleShareZReportWhatsApp = () => {
    openZReportWhatsAppShare({
      companyName: companyProfile.nameAr || companyProfile.nameEn || 'متجرنا',
      shiftNumber: `SH-${todayDateStr.replace(/-/g, '')}-01`,
      cashierName: currentUser?.name || 'كاشير الفرع',
      date: todayDateStr,
      startTime: shiftStartTime,
      endTime: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      totalSales: totalPosSales,
      totalCash: totalCashSales,
      totalCard: totalCardSales,
      totalEWallet: totalEWalletSales,
      totalCredit: totalCreditSales,
      totalReturns: totalRefunds,
      totalDiscounts: totalPosDiscounts,
      totalTax: totalPosVat,
      invoiceCount: todayPosInvoices.length,
      initialCash: shiftInitialCash,
      expectedCash: expectedDrawerCash,
      actualCash: actualCountedCash,
      difference: cashVariance,
      managerPhone: managerPhone,
      currency: currency,
      notes: shiftNotes,
    });
  };

  // Confirm close shift
  const handleConfirmCloseShift = async () => {
    const confirmed = await showConfirm({
      title: 'تأكيد إغلاق الوردية (Z-Report)',
      message: `هل أنت متأكد من إغلاق الوردية الحالية للكاشير (${currentUser?.name || 'كاشير الفرع'})؟ سيتم تسجيل بيانات الإغلاق في سجل المراجعة، وبدء وردية جديدة.`,
      confirmText: 'نعم، اعتماد وإغلاق الوردية',
      cancelText: 'إلغاء',
      type: 'warning',
    });

    if (!confirmed) return;

    logAuditEvent({
      action: 'UPDATE',
      entityType: 'INVENTORY',
      entityId: `SHIFT-${Date.now()}`,
      details: `إغلاق وردية كاشير: مبيعات إجمالية ${formatMoney(totalPosSales)}، عدد الفواتير: ${todayPosInvoices.length}، نقدية متوقعة: ${formatMoney(expectedDrawerCash)}، نقدية فعلية: ${formatMoney(actualCountedCash)}، الفارق: ${formatMoney(cashVariance)}`,
    });

    if (managerPhone) {
      localStorage.setItem('orbix_pos_manager_phone', managerPhone);
    }

    const nextStartTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    localStorage.setItem('orbix_pos_shift_start_time', nextStartTime);

    showAlert({
      title: 'تم إغلاق الوردية بنجاح',
      message: 'تم تسجيل بيانات تقفيل الوردية في سجل النظام. يمكنك طباعة إيصال الوردية أو إرساله للإدارة الآن.',
      type: 'success',
      confirmText: 'حسناً',
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Cashier Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-slate-900">
                نقطة البيع والفاتورة السريعة (Quick POS)
              </h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                كاشير فوري
              </span>
            </div>
            <p className="text-xs text-slate-500">
              اختيار مباشر للأصناف والعميل، تحديث فوري للمخزون، وطباعة الفاتورة والباركود
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
          <button
            type="button"
            onClick={() => {
              if ((window as any).electronAPI?.kickCashDrawer) {
                (window as any).electronAPI.kickCashDrawer();
              }
              showAlert({
                title: 'درج النقدية',
                message: 'تم إرسال إشارة فتح درج الكاشير إلى الطابعة بنجاح.',
                type: 'info',
                confirmText: 'حسناً',
              });
            }}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold cursor-pointer transition-colors"
            title="إرسال إشارة فتح درج الكاشير عبر الطابعة"
          >
            <Vault className="w-3.5 h-3.5 text-emerald-600" />
            <span>فتح درج النقدية</span>
          </button>

          {/* Z-Report Shift Closing Button */}
          <button
            type="button"
            onClick={() => setShowZReportModal(true)}
            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-semibold cursor-pointer transition-colors"
            title="حساب مبيعات اليوم وإغلاق الوردية وطباعة تقرير Z-Report ومشاركتها عبر واتساب"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>إغلاق الوردية (Z-Report)</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            <span>العملة: <strong className="text-slate-900 font-mono">{currency} ({formatMoney(0).replace('0.00 ', '')})</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>الكاشير: <strong className="text-slate-900">{currentUser?.name || 'كاشير الفرع'}</strong></span>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = searchQuery.trim();
                    if (!query) return;

                    for (const prod of products) {
                      if (prod.units && prod.units.length > 0) {
                        const matchedUnit = prod.units.find(
                          (u) => u.barcode && u.barcode.toLowerCase() === query.toLowerCase()
                        );
                        if (matchedUnit) {
                          addToCart(prod, matchedUnit);
                          setSearchQuery('');
                          return;
                        }
                      }
                    }

                    const matchedProduct = products.find(
                      (p) =>
                        (p.barcode && p.barcode.toLowerCase() === query.toLowerCase()) ||
                        p.sku.toLowerCase() === query.toLowerCase()
                    );

                    if (matchedProduct) {
                      addToCart(matchedProduct);
                      setSearchQuery('');
                    }
                  }
                }}
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
                      {prod.units && prod.units.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
                          {prod.units.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              disabled={prod.stockQuantity < u.factor}
                              onClick={() => addToCart(prod, u)}
                              className="text-[10px] bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                              title={`إضافة ${u.name} (${u.factor} ${prod.unit})`}
                            >
                              +{u.name} ({formatMoney(u.sellingPrice || prod.sellingPrice * u.factor)})
                            </button>
                          ))}
                        </div>
                      )}
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
        <div id="pos-cart-section" className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col h-auto lg:h-[calc(100vh-140px)] lg:min-h-[640px] lg:sticky lg:top-20 overflow-hidden">
            {/* Multi-Cart Tabs Bar */}
            <div className="bg-slate-900 px-2 py-2 flex items-center gap-1.5 border-b border-slate-800 select-none shrink-0 relative">
              {/* Scroll Right Button (in RTL: toward Cart 1) */}
              <button
                type="button"
                onClick={() => scrollTabs('right')}
                className="w-6 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="التمرير نحو السلات الأولى"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Scrollable Cart Tabs Container */}
              <div
                ref={tabsContainerRef}
                onWheel={(e) => {
                  if (tabsContainerRef.current) {
                    tabsContainerRef.current.scrollLeft += e.deltaY;
                  }
                }}
                className="min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent py-0.5 scroll-smooth"
              >
                {carts.map((cart, index) => {
                  const isActive = cart.id === activeCart.id;
                  const totalItems = (cart.items || []).reduce((s, it) => s + it.quantity, 0);
                  const cartTotal = (cart.items || []).reduce(
                    (sum, it) => sum + (it.quantity * it.unitPrice - it.discount),
                    0
                  );

                  return (
                    <div
                      key={cart.id}
                      data-cart-id={cart.id}
                      onClick={() => handleSwitchCart(cart.id)}
                      onDoubleClick={(e) => startRenameCart(cart, e)}
                      className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50'
                          : 'bg-slate-800 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/80'
                      }`}
                      title={`انقر للتبديل إلى ${cart.name} (انقر نقراً مزدوجاً لإعادة التسمية)`}
                    >
                      <ShoppingCart
                        className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`}
                      />

                      {editingCartId === cart.id ? (
                        <input
                          type="text"
                          value={editingCartName}
                          onChange={(e) => setEditingCartName(e.target.value)}
                          onBlur={() => saveRenameCart(cart.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveRenameCart(cart.id);
                            if (e.key === 'Escape') setEditingCartId(null);
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          className="bg-slate-900 text-white border border-emerald-400 rounded-md px-1 py-0.5 text-xs w-20 outline-hidden"
                        />
                      ) : (
                        <span className="max-w-[85px] truncate">{cart.name || `سلة ${index + 1}`}</span>
                      )}

                      {/* Items count & subtotal */}
                      {totalItems > 0 ? (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                            isActive
                              ? 'bg-emerald-700 text-emerald-100'
                              : 'bg-slate-900/90 text-emerald-300 border border-slate-700'
                          }`}
                        >
                          {totalItems} • <span className="privacy-blur">{formatMoney(cartTotal)}</span>
                        </span>
                      ) : (
                        <span className={`text-[9px] ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                          فارغة
                        </span>
                      )}

                      {/* Close button if more than 1 cart */}
                      {carts.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleCloseCart(cart.id, e)}
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ml-0.5 cursor-pointer ${
                            isActive
                              ? 'hover:bg-emerald-700 text-emerald-100 hover:text-white'
                              : 'hover:bg-rose-500/30 text-slate-400 hover:text-rose-300'
                          }`}
                          title={`إغلاق / حذف ${cart.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Scroll Left Button (in RTL: toward newest carts) */}
              <button
                type="button"
                onClick={() => scrollTabs('left')}
                className="w-6 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="التمرير نحو السلات التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Add New Cart Button */}
              <button
                type="button"
                onClick={handleAddNewCart}
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md active:scale-95"
                title="إضافة سلة جديدة لعميل آخر (تعليق السلة الحالية)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ سلة</span>
              </button>
            </div>

            {/* Cart Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-slate-800" />
                  <h3 className="font-bold text-sm text-slate-900">
                    {activeCart.name} ({cartItems.reduce((s, it) => s + it.quantity, 0)} قطعة)
                  </h3>

                  {/* Interactive Dropdown Button for all carts */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAllCartsDropdown((v) => !v)}
                      className="inline-flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer border border-emerald-300/60 shadow-2xs"
                      title="انقر لعرض قائمة بكافة السلات والانتقال المباشر لأي سلة"
                    >
                      <span>{carts.findIndex((c) => c.id === activeCart.id) + 1} من {carts.length}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${showAllCartsDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* All Carts Dropdown Menu Popover */}
                    {showAllCartsDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowAllCartsDropdown(false)}
                        />
                        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>كافة السلات المفتوحة ({carts.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                handleAddNewCart();
                                setShowAllCartsDropdown(false);
                              }}
                              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              سلة جديدة
                            </button>
                          </div>

                          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                            {carts.map((cart, idx) => {
                              const isActive = cart.id === activeCart.id;
                              const totalItems = (cart.items || []).reduce((s, it) => s + it.quantity, 0);
                              const cartTotal = (cart.items || []).reduce(
                                (sum, it) => sum + (it.quantity * it.unitPrice - it.discount),
                                0
                              );
                              const customer = customers.find((c) => c.id === cart.selectedCustomerId);

                              return (
                                <div
                                  key={cart.id}
                                  onClick={() => {
                                    handleSwitchCart(cart.id);
                                    setShowAllCartsDropdown(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <ShoppingCart className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    <div className="min-w-0 text-right">
                                      <div className="truncate font-bold">{cart.name || `سلة ${idx + 1}`}</div>
                                      <div className="text-[10px] text-slate-400 truncate">
                                        {customer?.name || 'عميل نقدي'}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                                      totalItems > 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {totalItems > 0 ? `${totalItems} قطع • ${formatMoney(cartTotal)}` : 'فارغة'}
                                    </span>

                                    {carts.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          handleCloseCart(cart.id, e);
                                        }}
                                        className="w-5 h-5 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                                        title="إغلاق وحذف هذه السلة"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
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
                <SearchableSelect
                  value={selectedCustomerId}
                  onChange={(val) => setSelectedCustomerId(val)}
                  placeholder="ابحث أو اختر العميل..."
                  searchPlaceholder="ابحث باسم العميل أو الهاتف..."
                  options={customers.map((c) => ({
                    value: c.id,
                    label: c.name,
                    subLabel: c.phone,
                    badge: c.currentBalance > 0 ? `مديونية: ${formatMoney(c.currentBalance)}` : undefined,
                    badgeColor: 'bg-rose-50 text-rose-700',
                  }))}
                />
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
                  key={item.id}
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
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-900 truncate" title={item.product.name}>
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.product.sku}
                        </span>
                        {item.product.units && item.product.units.length > 0 && (
                          <select
                            value={item.selectedUnit?.id || 'base'}
                            onChange={(e) => updateItemUnit(item.id, e.target.value)}
                            className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 rounded px-1 py-0.5 font-bold cursor-pointer"
                          >
                            <option value="base">{item.product.unit || 'قطعة'}</option>
                            {item.product.units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} (x{u.factor})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="sm:col-span-2 flex items-center justify-center">
                    <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 p-0.5 w-full max-w-[100px] justify-between">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors shrink-0"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-center font-bold text-xs text-slate-900 font-mono flex-1">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
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
                    {item.selectedUnit && (
                      <span className="block text-[9px] text-blue-600 font-medium font-mono">
                        لكل {item.selectedUnit.name}
                      </span>
                    )}
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
                      onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
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
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
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
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1 text-xs privacy-blur">
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
                <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200 space-y-1.5 privacy-blur">
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
                className={`printable-sheet printable-page mx-auto bg-white shadow-md p-6 border border-slate-300 text-slate-900 ${
                  receiptFormat === 'thermal80' ? 'receipt-thermal max-w-[340px] text-xs font-mono' : 'receipt-a4 max-w-full text-sm'
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
                  <div className="mx-auto flex items-center justify-center">
                    <InvoiceQrCode
                      data={{
                        sellerName: companyProfile.nameAr || companyProfile.nameEn || 'متجرنا',
                        taxNumber: companyProfile.taxNumber || '300000000000003',
                        timestamp: (printedInvoice.date || new Date().toISOString().split('T')[0]) + 'T' + (printedInvoice.time || '12:00:00'),
                        totalWithVat: printedInvoice.grandTotal,
                        vatAmount: printedInvoice.vatTotal,
                        invoiceNumber: printedInvoice.invoiceNumber,
                      }}
                      size={90}
                      showCaption={true}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight">
                    {companyProfile.invoiceFooterNotes || 'شكراً لتسوقكم ونسعد بخدمتكم دائماً'}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    نظام Orbix ERP • تم الإصدار إلكترونياً
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                إغلاق
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openWhatsAppShare({
                      companyName: companyProfile.nameAr || companyProfile.nameEn || 'متجرنا',
                      invoiceNumber: printedInvoice.invoiceNumber,
                      date: printedInvoice.date,
                      customerName: printedInvoice.customerName || 'عميل نقدي',
                      customerPhone: currentCustomer?.phone || '',
                      total: printedInvoice.grandTotal,
                      taxTotal: printedInvoice.vatTotal,
                      balanceDue: printedInvoice.remainingAmount,
                      currency: currency,
                      notes: printedInvoice.notes,
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="مشاركة الفاتورة للعميل عبر واتساب"
                >
                  <MessageCircle className="w-4 h-4" />
                  إرسال عبر واتساب
                </button>

                <button
                  type="button"
                  onClick={triggerNativePrint}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  طباعة الفاتورة الآن (Ctrl + P)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Z-Report Shift Closing Modal */}
      {showZReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto print:p-0">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    تقرير إغلاق الوردية وجرد الكاشير (Z-Report)
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>الكاشير: <strong className="text-white">{currentUser?.name || 'كاشير الفرع'}</strong></span>
                    <span>•</span>
                    <span>التاريخ: <strong className="text-white">{todayDateStr}</strong></span>
                    <span>•</span>
                    <span>بدء الوردية: <strong className="text-white">{shiftStartTime}</strong></span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowZReportModal(false)}
                className="text-slate-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center bg-white/10 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] space-y-6 privacy-blur">
              {/* 1. Shift Sales Summary Cards */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>إحصائيات مبيعات الوردية اليوم</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500 block">عدد فواتير الكاشير</span>
                    <strong className="text-lg font-bold text-slate-900 font-mono">
                      {todayPosInvoices.length}
                    </strong>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <span className="text-[11px] text-emerald-700 block">إجمالي المبيعات</span>
                    <strong className="text-lg font-bold text-emerald-700 font-mono">
                      {formatMoney(totalPosSales)}
                    </strong>
                  </div>
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <span className="text-[11px] text-amber-700 block">إجمالي الخصومات</span>
                    <strong className="text-lg font-bold text-amber-700 font-mono">
                      {formatMoney(totalPosDiscounts)}
                    </strong>
                  </div>
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                    <span className="text-[11px] text-rose-700 block">المرتجعات المستردة</span>
                    <strong className="text-lg font-bold text-rose-700 font-mono">
                      {formatMoney(totalRefunds)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 2. Breakdown of Payment Methods */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>تفصيل طرق التحصيل</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      <span>كاش (نقداً)</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {formatMoney(totalCashSales)}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      <span>فيزا / شبكة</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {formatMoney(totalCardSales)}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                      <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                      <span>محافظ / إنستاباي</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {formatMoney(totalEWalletSales)}
                    </span>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>مبيعات آجلة</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {formatMoney(totalCreditSales)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Cash Drawer Reconciliation */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Vault className="w-4 h-4 text-emerald-600" />
                    <span>جرد ومطابقة نقدية الدرج (Cash Reconciliation)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">حساب آلي للزيادة والعجز</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      رصيد بداية الوردية (العهدة)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={shiftInitialCash}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setShiftInitialCash(val);
                          localStorage.setItem('orbix_pos_shift_initial_cash', val.toString());
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold font-mono focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">{currency}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      النقدية المتوقعة بالدرج
                    </label>
                    <div className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 font-mono flex items-center justify-between">
                      <span>{formatMoney(expectedDrawerCash)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">عهدة + مبيعات نقداً</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      النقدية الفعلية بعد الجرد
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder={expectedDrawerCash.toString()}
                        value={actualCountedCashInput}
                        onChange={(e) => setActualCountedCashInput(e.target.value)}
                        className="w-full bg-white border-2 border-indigo-300 rounded-xl px-3 py-2 text-sm font-bold font-mono text-indigo-950 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-indigo-400 font-bold">{currency}</span>
                    </div>
                  </div>
                </div>

                {/* Variance result banner */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    cashVariance === 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : cashVariance > 0
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {cashVariance === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : cashVariance > 0 ? (
                      <Sparkles className="w-4 h-4 text-blue-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>
                      نتيجة المطابقة:{' '}
                      {cashVariance === 0
                        ? 'النقدية بالدرج مطابقة تماماً للمبيعات والعهدة (0.00)'
                        : cashVariance > 0
                        ? `يوجد فائض نقدي في الدرج بمقدار (+${formatMoney(cashVariance)})`
                        : `يوجد عجز نقدي في الدرج بمقدار (${formatMoney(cashVariance)})`}
                    </span>
                  </div>
                  <span className="font-mono text-sm">
                    {cashVariance > 0 ? `+${formatMoney(cashVariance)}` : formatMoney(cashVariance)}
                  </span>
                </div>
              </div>

              {/* 4. Manager WhatsApp & Cashier Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    رقم واتساب الإدارة / المدير (لإرسال التقرير مباشرة)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="مثال: 01012345678 أو 966501234567"
                      value={managerPhone}
                      onChange={(e) => setManagerPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                    <MessageCircle className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    يمكن إرسال ملخص الوردية كاملاً للإدارة بنقرة زر واحدة عبر واتساب.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ملاحظات الكاشير على الوردية
                  </label>
                  <textarea
                    rows={2}
                    placeholder="أي ملاحظات حول عجز، زيادة، أو ظروف التشغيل..."
                    value={shiftNotes}
                    onChange={(e) => setShiftNotes(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setShowZReportModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                إغلاق
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareZReportWhatsApp}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="إرسال تقرير الوردية إلى الإدارة عبر واتساب"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال للإدارة عبر واتساب</span>
                </button>

                <button
                  type="button"
                  onClick={triggerZReportPrint}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="طباعة إيصال الوردية الحراري 80mm"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة إيصال الوردية (80mm)</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCloseShift}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>اعتماد وإغلاق الوردية</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden 80mm Thermal Receipt for Z-Report Print */}
      <div className="hidden">
        <div
          id="pos-z-report-receipt"
          className="printable-sheet printable-page mx-auto bg-white p-4 border border-slate-300 text-slate-900 receipt-thermal max-w-[340px] text-xs font-mono space-y-3"
        >
          {/* Header */}
          <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-slate-300">
            <h2 className="font-bold text-base text-slate-900 tracking-tight">
              {companyProfile.nameAr || companyProfile.nameEn || 'متجرنا'}
            </h2>
            {companyProfile.activity && (
              <p className="text-[10px] text-slate-600 font-sans">{companyProfile.activity}</p>
            )}
            <div className="text-[10px] text-slate-500 font-sans mt-1">
              الرقم الضريبي: <span className="font-mono font-bold">{companyProfile.taxNumber || 'غير محدد'}</span>
            </div>
            <div className="pt-2">
              <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white font-bold rounded-md text-xs">
                تقرير إغلاق الوردية (Z-Report)
              </span>
            </div>
          </div>

          {/* Shift Meta */}
          <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-600">التاريخ:</span>
              <span className="font-bold">{todayDateStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">الكاشير:</span>
              <span className="font-bold">{currentUser?.name || 'كاشير الفرع'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">فترة الوردية:</span>
              <span>{shiftStartTime} - {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">عدد الفواتير:</span>
              <span className="font-bold">{todayPosInvoices.length}</span>
            </div>
          </div>

          {/* Sales Summary */}
          <div className="text-[11px] space-y-1.5 pb-2 border-b border-dashed border-slate-200">
            <div className="font-bold text-slate-800 text-[10px] uppercase">ملخص المبيعات:</div>
            <div className="flex justify-between">
              <span>إجمالي المبيعات:</span>
              <span className="font-bold">{formatMoney(totalPosSales)}</span>
            </div>
            {totalPosDiscounts > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>إجمالي الخصومات:</span>
                <span>-{formatMoney(totalPosDiscounts)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>ضريبة القيمة المضافة:</span>
              <span>{formatMoney(totalPosVat)}</span>
            </div>
            {totalRefunds > 0 && (
              <div className="flex justify-between text-rose-700">
                <span>المرتجعات:</span>
                <span>-{formatMoney(totalRefunds)}</span>
              </div>
            )}
          </div>

          {/* Payment Breakdown */}
          <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-slate-200">
            <div className="font-bold text-slate-800 text-[10px] uppercase">طرق التحصيل:</div>
            <div className="flex justify-between">
              <span>نقداً (كاش):</span>
              <span className="font-bold">{formatMoney(totalCashSales)}</span>
            </div>
            <div className="flex justify-between">
              <span>فيزا / شبكة:</span>
              <span>{formatMoney(totalCardSales)}</span>
            </div>
            <div className="flex justify-between">
              <span>محافظ / إنستاباي:</span>
              <span>{formatMoney(totalEWalletSales)}</span>
            </div>
            <div className="flex justify-between">
              <span>آجل:</span>
              <span>{formatMoney(totalCreditSales)}</span>
            </div>
          </div>

          {/* Drawer Audit */}
          <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-slate-200 bg-slate-50 p-2 rounded-lg">
            <div className="font-bold text-slate-800 text-[10px] uppercase">جرد النقدية بالدرج:</div>
            <div className="flex justify-between">
              <span>رصيد البداية (عهدة):</span>
              <span>{formatMoney(shiftInitialCash)}</span>
            </div>
            <div className="flex justify-between">
              <span>المبيعات النقدية:</span>
              <span>+{formatMoney(totalCashSales)}</span>
            </div>
            <div className="flex justify-between">
              <span>المرتجعات النقدية:</span>
              <span>-{formatMoney(totalRefunds)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-slate-300 pt-1">
              <span>المتوقع بالدرج:</span>
              <span>{formatMoney(expectedDrawerCash)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>الفعلي بعد الجرد:</span>
              <span>{formatMoney(actualCountedCash)}</span>
            </div>
            <div className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-300">
              <span>الفارق (عجز/زيادة):</span>
              <span>{cashVariance > 0 ? `+${formatMoney(cashVariance)}` : formatMoney(cashVariance)}</span>
            </div>
          </div>

          {shiftNotes && (
            <div className="text-[10px] pb-2 border-b border-dashed border-slate-200">
              <span className="font-bold block">ملاحظات:</span>
              <p className="text-slate-600">{shiftNotes}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-3 text-[10px] space-y-4">
            <div className="flex justify-between">
              <span>توقيع الكاشير: ........................</span>
              <span>توقيع المشرف: ........................</span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t-2 border-dashed border-slate-300 text-center space-y-1">
            <p className="text-[9px] text-slate-500 font-sans">
              نظام Orbix ERP • تم الإغلاق إلكترونياً
            </p>
            <p className="text-[8px] text-slate-400 font-mono">
              {new Date().toLocaleString('ar-EG')}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Summary Bar (Visible only on screens < lg when cart has items) */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-14 sm:bottom-16 inset-x-2 sm:inset-x-4 z-40 animate-in slide-in-from-bottom duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/40 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-white">
                    السلة ({cartItems.reduce((s, it) => s + it.quantity, 0)})
                  </span>
                  <span className="text-[10px] text-slate-400 truncate font-mono">
                    ({activeCart.name})
                  </span>
                </div>
                <div className="text-sm font-black text-emerald-400 font-mono">
                  {formatMoney(cartGrandTotal)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const cartEl = document.getElementById('pos-cart-section');
                  if (cartEl) {
                    cartEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>إتمام الدفع</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
