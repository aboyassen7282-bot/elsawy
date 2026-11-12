import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Phone,
  MessageCircle,
  Share2,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Plus,
  Lock,
} from 'lucide-react';
import { Product, CartItem, StoreSettings, StoredOrder } from './types';
import { INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS, INITIAL_CATEGORIES } from './data/defaultProducts';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ShareLinkModal } from './components/ShareLinkModal';
import { AdminPortal } from './components/AdminPortal';

const STORAGE_KEY_PRODUCTS = 'elsawy_store_products_v2';
const STORAGE_KEY_SETTINGS = 'elsawy_store_settings_v2';
const STORAGE_KEY_CART = 'elsawy_store_cart_v2';
const STORAGE_KEY_THEME = 'elsawy_store_theme_v2';
const STORAGE_KEY_ORDERS = 'elsawy_store_orders_v2';
const STORAGE_KEY_ADMIN_AUTH = 'elsawy_admin_authenticated_v2';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved !== null) return saved === 'dark';
    return false;
  });

  // Store settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_STORE_SETTINGS;
  });

  // Products state
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_PRODUCTS;
  });

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Orders state
  const [orders, setOrders] = useState<StoredOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Dedicated Admin Route & Authentication
  const checkIsAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.hash.toLowerCase().includes('admin') ||
      window.location.search.toLowerCase().includes('admin') ||
      window.location.pathname.startsWith('/admin')
    );
  };

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkIsAdminRoute);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === 'true';
  });

  // Listen to browser hash changes (e.g. typing #admin or navigating back)
  useEffect(() => {
    const handleHashOrPopState = () => {
      setIsAdminRoute(checkIsAdminRoute());
    };
    window.addEventListener('hashchange', handleHashOrPopState);
    window.addEventListener('popstate', handleHashOrPopState);
    return () => {
      window.removeEventListener('hashchange', handleHashOrPopState);
      window.removeEventListener('popstate', handleHashOrPopState);
    };
  }, []);

  const navigateToAdmin = () => {
    window.location.hash = 'admin';
    setIsAdminRoute(true);
  };

  const navigateToStore = () => {
    window.location.hash = '';
    setIsAdminRoute(false);
  };

  const handleAdminLogin = (pin: string): boolean => {
    const validPin = settings.adminPin || '1234';
    if (pin.trim() === validPin.trim()) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem(STORAGE_KEY_ADMIN_AUTH);
    showToast('تم تسجيل الخروج من لوحة الإدارة');
  };

  // Customer Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sync dark mode class on HTML document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [darkMode]);

  // Persist products, settings, cart & orders to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  }, [orders]);

  // Categories list from store settings
  const categories = useMemo(() => {
    if (settings.categories && settings.categories.length > 0) {
      return settings.categories;
    }
    return INITIAL_CATEGORIES;
  }, [settings.categories]);

  // Reset selected category if it was deleted
  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0;
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`تمت إضافة "${product.name}" إلى السلة`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('تم حذف المنتج من السلة');
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleSaveOrder = (newOrder: StoredOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleUpdateOrderStatus = (orderId: string, status: StoredOrder['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    showToast('تم تحديث حالة الطلب');
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    showToast('تم حذف الطلب');
  };

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  const handleResetDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    setSettings(INITIAL_STORE_SETTINGS);
    showToast('تمت استعادة الإعدادات والمنتجات الافتراضية');
  };

  /* 
    ================================================================
    RENDER ROUTE 1: DEDICATED ADMIN PORTAL (#admin)
    ================================================================
  */
  if (isAdminRoute) {
    return (
      <AdminPortal
        settings={settings}
        products={products}
        orders={orders}
        isAuthenticated={isAdminAuthenticated}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        onBackToStore={navigateToStore}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          showToast('تم حفظ إعدادات المتجر');
        }}
        onSaveProducts={(newProducts) => {
          setProducts(newProducts);
          showToast('تم حفظ تعديلات المنتجات');
        }}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onDeleteOrder={handleDeleteOrder}
        onResetDefaults={handleResetDefaults}
      />
    );
  }

  /* 
    ================================================================
    RENDER ROUTE 2: PUBLIC CUSTOMER STOREFRONT
    Customers see ONLY customer-facing features (no admin buttons).
    ================================================================
  */
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 py-3 px-5 rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 text-xs sm:text-sm font-bold shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Logged-In Top Helper Bar (shown ONLY if admin is authenticated) */}
      {isAdminAuthenticated && (
        <div className="bg-blue-600 text-white text-xs py-2 px-4 border-b border-blue-700">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>أنت تتصفح المتجر حالياً كعميل (حساب المدير نشط)</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={navigateToAdmin}
                className="font-bold underline cursor-pointer hover:text-blue-100"
              >
                الانتقال للوحة الإدارة
              </button>
              <span>·</span>
              <button
                onClick={handleAdminLogout}
                className="opacity-80 hover:opacity-100 cursor-pointer text-blue-200"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main App Header */}
      <Header
        settings={settings}
        cartCount={totalCartCount}
        isAdmin={isAdminAuthenticated}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onGoToAdmin={navigateToAdmin}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Hero Banner with Official Visual Asset & Direct Contact */}
      <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white pt-6 pb-10 border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Visual Banner Frame */}
          <div className="relative rounded-3xl overflow-hidden border border-blue-500/30 shadow-2xl bg-black group mb-8">
            <img
              src={settings.bannerUrl || '/assets/aistudio/elsawy_store_d8c513ab.png'}
              alt="ELSAWY STORE للكمبيوتر واللاب توب وأنظمة المراقبة"
              className="w-full h-auto object-cover max-h-[500px] transition-transform duration-700 group-hover:scale-[1.01]"
            />
          </div>

          {/* Brand Info & Action Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-stone-800/70 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-stone-700/60 shadow-lg">
            <div className="flex items-center gap-4 sm:gap-5">
              {settings.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-xl border-2 border-blue-500/50 shrink-0"
                />
              )}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Your Tech, Our Priority · فرز أول وضمان حقيقي</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  <span className="text-blue-500">ELSAWY</span> STORE
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl">
                  {settings.storeTagline} · تشكيلة واسعة من أجهزة HP, Dell, Lenovo, Acer, Asus وأنظمة كاميرات المراقبة الأمنية المتكاملة مع الدفع عند الاستلام.
                </p>
              </div>
            </div>

            {/* Quick Hero Actions */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0">
              {/* Call Now Hero CTA */}
              <a
                href={`tel:${settings.phoneNumber}`}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Phone className="w-4 h-4 animate-bounce" />
                <span>اتصل بنا للطلب ({settings.phoneNumber})</span>
              </a>

              {/* WhatsApp Quick Chat */}
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-stone-700 hover:bg-stone-600 text-white border border-stone-600 font-bold text-xs sm:text-sm shadow-xs transition-all"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>واتساب</span>
              </a>

              {/* Share Store Link */}
              <button
                onClick={() => setIsShareOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-semibold text-xs transition-all cursor-pointer"
                title="مشاركة رابط يفتح على أي متصفح"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة الرابط</span>
              </button>
            </div>
          </div>

          {/* Trust strip matching banner icons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-2">
            <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-800/40 border border-stone-700/50 text-xs text-stone-300">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="font-semibold">جودة مضمونة 100%</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-800/40 border border-stone-700/50 text-xs text-stone-300">
              <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">أسعار منافسة وتوصيل</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-800/40 border border-stone-700/50 text-xs text-stone-300">
              <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold">خدمة ما بعد البيع</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-stone-800/40 border border-stone-700/50 text-xs text-stone-300">
              <Phone className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-semibold">دعم فني متخصص</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Products Section */}
      <main id="products" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Search, Filter & Sort Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white">
                قائمة المنتجات المميزة
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                تصفح المنتجات المتوفرة واضغط "أضف للسلة" أو "اتصال" للشراء الفوري
              </p>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Categories Segmented Control & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                }`}
              >
                جميع المنتجات ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    {cat} {count > 0 && <span className="opacity-80 text-[11px] mr-1 font-mono">({count})</span>}
                  </button>
                );
              })}

              {/* Admin shortcut button (shown ONLY if logged in as Admin) */}
              {isAdminAuthenticated && (
                <button
                  onClick={navigateToAdmin}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer whitespace-nowrap"
                  title="إدارة وتعديل الأقسام"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تعديل الأقسام</span>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-stone-500 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>ترتيب حسب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-stone-100 dark:bg-stone-800 border-none rounded-lg px-2.5 py-1 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer"
              >
                <option value="default">الافتراضي</option>
                <option value="price-asc">الأقل سعراً</option>
                <option value="price-desc">الأعلى سعراً</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={settings.currency}
                phoneNumber={settings.phoneNumber}
                whatsappNumber={settings.whatsappNumber}
                onAddToCart={(prod) => handleAddToCart(prod, 1)}
                onViewDetails={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
            <p className="text-base font-bold text-stone-700 dark:text-stone-300 mb-1">
              لا توجد منتجات مطابقة للبحث
            </p>
            <p className="text-xs text-stone-500 mb-4">
              جرب تغيير كلمة البحث أو اختيار تصنيف آخر
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold rounded-xl cursor-pointer"
            >
              عرض جميع المنتجات
            </button>
          </div>
        )}

        {/* Store Trust / Guarantees Section */}
        <section id="features" className="mt-16 pt-12 border-t border-stone-200 dark:border-stone-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900 dark:text-white mb-1">
                  شحن سريع وتوصيل للمنزل
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  توصيل لجميع المحافظات خلال 24 إلى 48 ساعة مع إمكانية معاينة الجهاز وتشغيله قبل الاستلام.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900 dark:text-white mb-1">
                  ضمان معتمد وفرز أول
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  جميع الأجهزة وكاميرات المراقبة أصلية 100% ومفحوصة بدقة مع شهادة ضمان معتمدة.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900 dark:text-white mb-1">
                  خدمة ما بعد البيع والدعم الفني
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  فريق فني متخصص جاهز دائماً لمساعدتك في التثبيت والتشغيل وتوصيل الكاميرات والشبكات.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="mt-auto bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-right">
            <div className="flex items-center gap-3">
              {settings.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName}
                  className="w-12 h-12 rounded-full object-cover border border-blue-500/40 shadow-sm shrink-0"
                />
              )}
              <div>
                <span className="text-xl font-black text-stone-900 dark:text-white block">
                  <span className="text-blue-600 dark:text-blue-400">ELSAWY</span> STORE
                </span>
                <p className="text-xs text-stone-500 mt-0.5 max-w-md">
                  {settings.storeTagline} · متواجدون لخدمتكم يومياً مع إمكانية الاتصال المباشر والدفع عند الاستلام.
                </p>
              </div>
            </div>

            {/* Contact numbers and share */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={`tel:${settings.phoneNumber}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>اتصال: {settings.phoneNumber}</span>
              </a>

              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب المتجر</span>
              </a>

              <button
                onClick={() => setIsShareOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold text-xs hover:bg-stone-200 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-500" />
                <span>مشاركة الرابط</span>
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
            <span>جميع الحقوق محفوظة © {new Date().getFullYear()} {settings.storeName}</span>
            <div className="flex items-center gap-4">
              {/* Discreet Admin Login Link for the store owner */}
              <button
                onClick={navigateToAdmin}
                className="hover:text-blue-500 transition-colors cursor-pointer flex items-center gap-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                title="لوحة تحكم إدارة المتجر"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>دخول الإدارة</span>
              </button>
              <span>·</span>
              <a href="#" className="hover:text-blue-500 transition-colors">الشروط والأحكام</a>
              <span>·</span>
              <a href="#" className="hover:text-blue-500 transition-colors">سياسة الخصوصية</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        currency={settings.currency}
        phoneNumber={settings.phoneNumber}
        whatsappNumber={settings.whatsappNumber}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        items={cart}
        currency={settings.currency}
        freeShippingThreshold={settings.freeShippingThreshold}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal with Order Persistence */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        items={cart}
        settings={settings}
        onClose={() => setIsCheckoutOpen(false)}
        onSaveOrder={handleSaveOrder}
        onOrderComplete={() => {
          handleClearCart();
          showToast('تم تسجيل طلبك بنجاح وسنتصل بك قريباً!');
        }}
      />

      {/* Share Link Modal */}
      <ShareLinkModal
        isOpen={isShareOpen}
        storeName={settings.storeName}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}
