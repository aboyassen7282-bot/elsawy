import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Package,
  FolderTree,
  ShoppingBag,
  Settings,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Phone,
  MessageCircle,
  Eye,
  Check,
  RotateCcw,
  Tag,
  DollarSign,
  KeyRound,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  Save,
} from 'lucide-react';
import { Product, StoreSettings, StoredOrder } from '../types';
import { INITIAL_CATEGORIES } from '../data/defaultProducts';
import { ImagePickerField } from './ImagePickerField';
import { supabase } from '../lib/supabaseClient'; // تأكد من أن مسار ملف supabaseClient صحيح في مشروعك

interface AdminPortalProps {
  settings: StoreSettings;
  products: Product[];
  orders: StoredOrder[];
  isAuthenticated: boolean;
  onLogin: (pin: string) => boolean;
  onLogout: () => void;
  onBackToStore: () => void;
  onSaveSettings: (settings: StoreSettings) => void;
  onSaveProducts: (products: Product[]) => void;
  onUpdateOrderStatus: (orderId: string, status: StoredOrder['status']) => void;
  onDeleteOrder: (orderId: string) => void;
  onResetDefaults: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  settings,
  products,
  orders,
  isAuthenticated,
  onLogin,
  onLogout,
  onBackToStore,
  onSaveSettings,
  onSaveProducts,
  onUpdateOrderStatus,
  onDeleteOrder,
  onResetDefaults,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'settings'>('products');
  const [savedToast, setSavedToast] = useState(false);
  const [isSavingToDb, setIsSavingToDb] = useState(false);

  // Local editing states
  const [editingSettings, setEditingSettings] = useState<StoreSettings>({
    ...settings,
    categories: settings.categories && settings.categories.length > 0 ? settings.categories : INITIAL_CATEGORIES,
  });
  const [localProducts, setLocalProducts] = useState<Product[]>([...products]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // PIN change state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Categories state
  const currentCategories = editingSettings.categories && editingSettings.categories.length > 0
    ? editingSettings.categories
    : INITIAL_CATEGORIES;
  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatOld, setEditingCatOld] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Add Product state
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: currentCategories[0] || 'عام',
    price: 500,
    originalPrice: 650,
    description: '',
    image: '',
    inStock: true,
    badge: 'جديد',
    features: ['ضمان الجودة العالية', 'شحن سريع'],
  });

  const triggerSaveNotification = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  // حفظ جميع التعديلات ومزامنتها مع Supabase
  const handleSaveAll = async () => {
    setIsSavingToDb(true);
    try {
      // 1. تحديث أو إدراج إعدادات المتجر في Supabase
      const { error: settingsError } = await supabase
        .from('store_settings')
        .upsert({
          id: 1,
          store_name: editingSettings.storeName,
          store_tagline: editingSettings.storeTagline,
          announcement: editingSettings.announcement,
          phone_number: editingSettings.phoneNumber,
          whatsapp_number: editingSettings.whatsappNumber,
          currency: editingSettings.currency,
          free_shipping_threshold: Number(editingSettings.freeShippingThreshold) || 0,
          logo_url: editingSettings.logoUrl,
          banner_url: editingSettings.bannerUrl,
          categories: currentCategories,
          admin_pin: editingSettings.adminPin || '1234',
        });

      if (settingsError) {
        console.error('Error saving settings:', settingsError);
      }

      // 2. مزامنة المنتجات المعدلة مع جدول products
      if (localProducts.length > 0) {
        const formattedProducts = localProducts.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: Number(p.price) || 0,
          original_price: p.originalPrice ? Number(p.originalPrice) : null,
          description: p.description || '',
          features: p.features || [],
          image: p.image && !p.image.startsWith('/src/')
            ? p.image
            : 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
          in_stock: p.inStock ?? true,
          rating: p.rating ?? 5.0,
          reviews_count: p.reviewsCount ?? 0,
          badge: p.badge || null,
        }));

        const { error: productsError } = await supabase
          .from('products')
          .upsert(formattedProducts);

        if (productsError) {
          alert('حدث خطأ أثناء مزامنة المنتجات مع قاعدة البيانات: ' + productsError.message);
          setIsSavingToDb(false);
          return;
        }
      }

      onSaveSettings(editingSettings);
      onSaveProducts(localProducts);
      triggerSaveNotification();
    } catch (err: any) {
      alert('حدث خطأ غير متوقع: ' + err.message);
    } finally {
      setIsSavingToDb(false);
    }
  };

  const handleLoginFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(pinInput);
    if (!success) {
      setLoginError(true);
      setPinInput('');
    } else {
      setLoginError(false);
    }
  };

  // Product Operations
  const handleUpdateProduct = (id: string, fields: Partial<Product>) => {
    setLocalProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...fields } : p))
    );
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        alert('تعذر حذف المنتج من قاعدة البيانات: ' + error.message);
        return;
      }
      const updated = localProducts.filter((p) => p.id !== id);
      setLocalProducts(updated);
      onSaveProducts(updated);
      if (editingProductId === id) setEditingProductId(null);
      triggerSaveNotification();
    }
  };

  const handleAddNewProduct = async () => {
    if (!newProduct.name?.trim()) {
      alert('يرجى كتابة اسم المنتج');
      return;
    }

    setIsSavingToDb(true);
    const validImage =
      newProduct.image && !newProduct.image.startsWith('/src/')
        ? newProduct.image
        : 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';

    const newId = `prod-${Date.now()}`;

    // البيانات بصيغة أعمدة جدول Supabase
    const dbPayload = {
      id: newId,
      name: newProduct.name.trim(),
      category: newProduct.category || currentCategories[0] || 'عام',
      price: Number(newProduct.price) || 100,
      original_price: newProduct.originalPrice ? Number(newProduct.originalPrice) : null,
      description: newProduct.description || 'منتج عالي الجودة معتمد من ELSAWY STORE.',
      features: newProduct.features || ['منتج فرز أول أصلي', 'توصيل وضمان حقيقي'],
      image: validImage,
      in_stock: newProduct.inStock ?? true,
      badge: newProduct.badge || 'جديد',
      rating: 5.0,
      reviews_count: 1,
    };

    // الإرسال الفوري لقاعدة بيانات Supabase
    const { error } = await supabase.from('products').insert([dbPayload]);

    setIsSavingToDb(false);

    if (error) {
      alert('فشل حفظ المنتج في Supabase: ' + error.message);
      return;
    }

    // تحديث الواجهة المحلية وتمرير المنتج للـ App
    const createdForState: Product = {
      id: newId,
      name: dbPayload.name,
      category: dbPayload.category,
      price: dbPayload.price,
      originalPrice: dbPayload.original_price ?? undefined,
      description: dbPayload.description,
      features: dbPayload.features,
      image: validImage,
      inStock: dbPayload.in_stock,
      badge: dbPayload.badge,
      rating: 5.0,
      reviewsCount: 1,
    };

    const updatedList = [createdForState, ...localProducts];
    setLocalProducts(updatedList);
    onSaveProducts(updatedList);
    setIsAddingProduct(false);
    setNewProduct({
      name: '',
      category: currentCategories[0] || 'عام',
      price: 500,
      originalPrice: 650,
      description: '',
      image: '',
      inStock: true,
      badge: 'جديد',
    });
    triggerSaveNotification();
  };

  // Category Operations
  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      alert('يرجى كتابة اسم القسم');
      return;
    }
    if (currentCategories.includes(trimmed)) {
      alert('هذا القسم موجود مسبقاً');
      return;
    }
    const updated = [...currentCategories, trimmed];
    setEditingSettings((prev) => ({ ...prev, categories: updated }));
    setNewCatInput('');
  };

  const handleDeleteCategory = (catName: string) => {
    const prods = localProducts.filter((p) => p.category === catName);
    const msg = prods.length > 0
      ? `هذا القسم يحتوي على ${prods.length} منتج. سيتم نقله إلى قسم "عام" لحمايته. هل تريد حذف القسم؟`
      : `هل أنت متأكد من حذف قسم "${catName}"؟`;

    if (confirm(msg)) {
      const updated = currentCategories.filter((c) => c !== catName);
      setEditingSettings((prev) => ({ ...prev, categories: updated }));
      if (prods.length > 0) {
        setLocalProducts((prev) =>
          prev.map((p) => (p.category === catName ? { ...p, category: 'عام' } : p))
        );
      }
    }
  };

  const handleSaveRenameCategory = () => {
    if (!editingCatOld) return;
    const trimmed = editingCatName.trim();
    if (!trimmed || trimmed === editingCatOld) {
      setEditingCatOld(null);
      return;
    }
    if (currentCategories.includes(trimmed) && trimmed !== editingCatOld) {
      alert('يوجد قسم آخر بهذا الاسم');
      return;
    }

    const updated = currentCategories.map((c) => (c === editingCatOld ? trimmed : c));
    setEditingSettings((prev) => ({ ...prev, categories: updated }));
    setLocalProducts((prev) =>
      prev.map((p) => (p.category === editingCatOld ? { ...p, category: trimmed } : p))
    );
    setEditingCatOld(null);
  };

  // PIN update handler
  const handleUpdatePin = () => {
    if (!newPin || newPin.length < 4) {
      alert('الرجاء إدخال رقم سري مكون من 4 أرقام على الأقل');
      return;
    }
    if (newPin !== confirmPin) {
      alert('الرقم السري وتأكيده غير متطابقين');
      return;
    }
    setEditingSettings((prev) => ({ ...prev, adminPin: newPin }));
    setNewPin('');
    setConfirmPin('');
    alert('تم تغيير الرقم السري للوحة الإدارة بنجاح! تذكر الضغط على "حفظ التعديلات" بالأعلى لتثبيته.');
  };

  /* 
    VIEW 1: ADMIN LOGIN SCREEN
    Shown when not authenticated
  */
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo & Header */}
          <div className="text-center mb-6 relative">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.storeName}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-blue-500/40 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-xl mx-auto mb-3 shadow-lg">
                ES
              </div>
            )}
            <h2 className="text-2xl font-black text-white">
              لوحة إدارة <span className="text-blue-500">ELSAWY STORE</span>
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              منطقة مخصصة لمدير المتجر فقط لإجراء التعديلات وإدارة المنتجات والطلبات
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginFormSubmit} className="space-y-4 relative">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-400" />
                <span>الرقم السري للوحة التحكم (PIN)</span>
              </label>
              <input
                type="password"
                dir="ltr"
                required
                maxLength={10}
                placeholder="أدخل الرقم السري..."
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setLoginError(false);
                }}
                className={`w-full px-4 py-3 rounded-xl border bg-stone-800/90 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-2 ${
                  loginError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-stone-700 focus:ring-blue-500'
                }`}
                autoFocus
              />
              {loginError && (
                <p className="text-xs text-red-400 mt-1.5 text-center font-semibold">
                  ⚠️ الرقم السري غير صحيح، يرجى المحاولة مرة أخرى
                </p>
              )}
              <span className="text-[11px] text-stone-500 block text-center mt-2">
                الرقم السري الافتراضي هو: <strong className="text-stone-300 font-mono">1234</strong> (ويمكنك تغييره بعد الدخول)
              </span>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>دخول لوحة التحكم</span>
            </button>
          </form>

          {/* Back to Customer Store button */}
          <div className="mt-6 pt-4 border-t border-stone-800 text-center">
            <button
              type="button"
              onClick={onBackToStore}
              className="text-xs text-stone-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <span>العودة لمتجر العملاء</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* 
    VIEW 2: AUTHENTICATED ADMIN DASHBOARD
  */
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Toast notification */}
      {savedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 py-3 px-5 rounded-2xl bg-emerald-600 text-white text-sm font-bold shadow-2xl animate-fade-in">
          <Check className="w-4 h-4" />
          <span>تم الحفظ والمزامنة في قاعدة البيانات بنجاح!</span>
        </div>
      )}

      {/* Admin Top Header Bar */}
      <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt={settings.storeName}
                className="w-10 h-10 rounded-full object-cover border border-blue-500/40"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">
                  لوحة تحكم <span className="text-blue-500">ELSAWY STORE</span>
                </span>
                <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                  وضع الأدمن
                </span>
              </div>
              <span className="text-[11px] text-stone-400 hidden sm:block">
                صفحة الإدارة الخاصة بالتعديلات والإعدادات
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Public Storefront */}
            <button
              onClick={onBackToStore}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-stone-700"
              title="مشاهدة المتجر كما يراه العميل"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>معاينة المتجر كعميل</span>
            </button>

            {/* Save all changes button */}
            <button
              onClick={handleSaveAll}
              disabled={isSavingToDb}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingToDb ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors cursor-pointer"
              title="تسجيل الخروج من لوحة التحكم"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tabular-nums">{localProducts.length}</span>
              <span className="text-xs text-stone-400 block">إجمالي المنتجات</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tabular-nums">{currentCategories.length}</span>
              <span className="text-xs text-stone-400 block">الأقسام والتصنيفات</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-white tabular-nums">{orders.length}</span>
              <span className="text-xs text-stone-400 block">طلبات العملاء الواردة</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-white truncate block font-mono" dir="ltr">
                {editingSettings.phoneNumber}
              </span>
              <span className="text-xs text-stone-400 block">هاتف الاتصال</span>
            </div>
          </div>
        </div>

        {/* Admin Tabs Bar */}
        <div className="flex items-center gap-2 pb-3 mb-6 border-b border-stone-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>إدارة المنتجات ({localProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>إدارة وتعديل الأقسام ({currentCategories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>طلبات الشراء الواردة ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>إعدادات المتجر والأمان</span>
          </button>
        </div>

        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  قائمة المنتجات الحالية ({localProducts.length})
                </h3>
                <p className="text-xs text-stone-400">
                  يمكنك إضافة منتج جديد، أو تعديل الأسعار والأوصاف ورفع الصور من هاتفك أو جهازك
                </p>
              </div>

              <button
                onClick={() => setIsAddingProduct(!isAddingProduct)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {/* Add New Product Form */}
            {isAddingProduct && (
              <div className="p-6 rounded-3xl bg-stone-900 border border-blue-500/30 space-y-4">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>إدخال بيانات المنتج الجديد</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      اسم المنتج *
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: لاب توب ديل كور آي 7"
                      value={newProduct.name || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      القسم / التصنيف *
                    </label>
                    <select
                      value={newProduct.category || currentCategories[0] || 'عام'}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                    >
                      {currentCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      السعر الحالي ({editingSettings.currency}) *
                    </label>
                    <input
                      type="number"
                      value={newProduct.price || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      السعر قبل الخصم (اختياري)
                    </label>
                    <input
                      type="number"
                      value={newProduct.originalPrice || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                    />
                  </div>
                </div>

                {/* Direct Image Picker with Upload */}
                <ImagePickerField
                  label="صورة المنتج (أدخل رابط صورة مباشر أو اختر من الصور الجاهزة)"
                  value={newProduct.image || ''}
                  onChange={(img) => setNewProduct({ ...newProduct, image: img })}
                />

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    الوصف والتفاصيل الفنية
                  </label>
                  <textarea
                    rows={3}
                    placeholder="اكتب مواصفات المنتج وحالته بالتفصيل..."
                    value={newProduct.description || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsAddingProduct(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-white cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleAddNewProduct}
                    disabled={isSavingToDb}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    {isSavingToDb ? 'جاري الإضافة...' : 'حفظ وإضافة المنتج'}
                  </button>
                </div>
              </div>
            )}

            {/* Products List */}
            <div className="space-y-3">
              {localProducts.map((prod) => {
                const isEditing = editingProductId === prod.id;
                return (
                  <div
                    key={prod.id}
                    className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-14 h-14 rounded-xl object-cover bg-stone-800 shrink-0 border border-stone-700"
                        />
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-white truncate">
                            {prod.name}
                          </h4>
                          <span className="text-xs text-stone-400">
                            {prod.price} {editingSettings.currency} · <strong className="text-blue-400 font-semibold">{prod.category}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setEditingProductId(isEditing ? null : prod.id)}
                          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700 cursor-pointer"
                        >
                          {isEditing ? 'إغلاق التعديل' : 'تعديل التفاصيل والصورة'}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-2 text-red-400 hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                          title="حذف المنتج"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline edit details */}
                    {isEditing && (
                      <div className="pt-4 mt-2 border-t border-stone-800 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-stone-400 mb-1">
                              اسم المنتج
                            </label>
                            <input
                              type="text"
                              value={prod.name}
                              onChange={(e) => handleUpdateProduct(prod.id, { name: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-stone-400 mb-1">
                              القسم
                            </label>
                            <select
                              value={prod.category}
                              onChange={(e) => handleUpdateProduct(prod.id, { category: e.target.value })}
                              className="w-full px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                            >
                              {currentCategories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-stone-400 mb-1">
                              السعر ({editingSettings.currency})
                            </label>
                            <input
                              type="number"
                              value={prod.price}
                              onChange={(e) => handleUpdateProduct(prod.id, { price: Number(e.target.value) })}
                              className="w-full px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-stone-400 mb-1">
                              حالة التوفر
                            </label>
                            <select
                              value={prod.inStock ? 'true' : 'false'}
                              onChange={(e) => handleUpdateProduct(prod.id, { inStock: e.target.value === 'true' })}
                              className="w-full px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                            >
                              <option value="true">متوفر بالمخزن</option>
                              <option value="false">نفذت الكمية</option>
                            </select>
                          </div>
                        </div>

                        {/* Image picker */}
                        <ImagePickerField
                          label="صورة المنتج (تغيير أو رفع صورة جديدة لهذا المنتج)"
                          value={prod.image || ''}
                          onChange={(img) => handleUpdateProduct(prod.id, { image: img })}
                        />

                        <div>
                          <label className="block text-xs font-bold text-stone-400 mb-1">
                            وصف وتفاصيل المنتج
                          </label>
                          <textarea
                            rows={3}
                            value={prod.description}
                            onChange={(e) => handleUpdateProduct(prod.id, { description: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-stone-900 border border-blue-500/20">
              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                <span>إضافة قسم جديد للمتجر</span>
              </h4>
              <p className="text-xs text-stone-400 mb-4">
                الأقسام التي تنشئها هنا تظهر فوراً في المتجر للعملاء لتصفح المنتجات وفلترتها.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="اسم القسم الجديد (مثال: شاشات كمبيوتر، إكسسوارات وهاردوير...)"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddCategory}
                  className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة القسم</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-white mb-3">
                أقسام المتجر المتاحة حالياً ({currentCategories.length})
              </h4>
              <div className="space-y-2.5">
                {currentCategories.map((catName) => {
                  const count = localProducts.filter((p) => p.category === catName).length;
                  const isRenaming = editingCatOld === catName;

                  return (
                    <div
                      key={catName}
                      className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-4"
                    >
                      {!isRenaming ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                              <Tag className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-base font-bold text-white">{catName}</h5>
                              <span className="text-xs text-stone-400">
                                {count === 0 ? 'لا توجد منتجات مرتبطة' : `يحتوي على ${count} منتج`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingCatOld(catName);
                                setEditingCatName(catName);
                              }}
                              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 transition-colors cursor-pointer"
                            >
                              تعديل الاسم
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(catName)}
                              className="p-2 text-red-400 hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                              title="حذف القسم"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-blue-500 bg-stone-800 text-white"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveRenameCategory}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => setEditingCatOld(null)}
                            className="px-4 py-2 bg-stone-800 text-stone-300 rounded-xl text-xs cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER ORDERS RECORD */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                سجل طلبات الشراء الواردة ({orders.length})
              </h3>
              <p className="text-xs text-stone-400">
                جميع الطلبات التي يتم إرسالها من العملاء عبر صفحة الشراء تظهر هنا مع تفاصيل العميل والمنتجات
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center bg-stone-900 border border-stone-800 rounded-3xl text-stone-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <h4 className="text-base font-bold text-white mb-1">لا توجد طلبات واردة بعد</h4>
                <p className="text-xs text-stone-500">
                  عندما يطلب أي عميل منتجاً من المتجر، ستظهر تفاصيل طلبه ورقم هاتفه وعنوانه هنا فوراً.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 sm:p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">
                            طلب رقم #{ord.orderNumber}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : ord.status === 'processing'
                                ? 'bg-amber-500/20 text-amber-400'
                                : ord.status === 'cancelled'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {ord.status === 'delivered'
                              ? 'تم التوصيل'
                              : ord.status === 'processing'
                              ? 'قيد التجهيز'
                              : ord.status === 'cancelled'
                              ? 'ملغي'
                              : 'طلب جديد'}
                          </span>
                        </div>
                        <span className="text-xs text-stone-500 flex items-center gap-1.5 mt-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(ord.createdAt).toLocaleString('ar-EG')}</span>
                        </span>
                      </div>

                      {/* Customer Actions: Call or WhatsApp */}
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${ord.phone}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>اتصال بالعميل</span>
                        </a>

                        <a
                          href={`https://wa.me/2${ord.phone.replace(/^0+/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-emerald-400 text-xs font-bold border border-stone-700 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>

                        <button
                          onClick={() => onDeleteOrder(ord.id)}
                          className="p-2 text-stone-500 hover:text-red-400 rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
                          title="حذف الطلب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-300 bg-stone-800/40 p-3.5 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>العميل: <strong className="text-white">{ord.customerName}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>الهاتف: <strong className="text-white font-mono" dir="ltr">{ord.phone}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>العنوان: <strong className="text-white">{ord.city} - {ord.address}</strong></span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-stone-400 block">المنتجات المطلوبة:</span>
                      <div className="space-y-1.5">
                        {ord.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-stone-800/60"
                          >
                            <span className="font-semibold text-white">
                              {it.productName} × <strong className="text-blue-400">{it.quantity}</strong>
                            </span>
                            <span className="font-mono tabular-nums text-stone-300">
                              {(it.price * it.quantity).toLocaleString('ar-EG')} {settings.currency}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-between text-sm font-bold text-white border-t border-stone-800">
                        <span>المبلغ الإجمالي عند الاستلام:</span>
                        <span className="text-amber-400 font-mono text-base">
                          {ord.total.toLocaleString('ar-EG')} {settings.currency}
                        </span>
                      </div>
                    </div>

                    {/* Status Changer */}
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-stone-400">تحديث حالة الطلب:</span>
                      <select
                        value={ord.status}
                        onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as any)}
                        className="px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-800 text-xs text-white"
                      >
                        <option value="new">طلب جديد</option>
                        <option value="processing">قيد التجهيز والشحن</option>
                        <option value="delivered">تم التوصيل بنجاح</option>
                        <option value="cancelled">ملغي</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STORE SETTINGS & SECURITY */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* General store info */}
            <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <span>البيانات الأساسية للمتجر</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">
                    اسم المتجر
                  </label>
                  <input
                    type="text"
                    value={editingSettings.storeName}
                    onChange={(e) => setEditingSettings({ ...editingSettings, storeName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">
                    شعار المتجر (الوصف المختصر)
                  </label>
                  <input
                    type="text"
                    value={editingSettings.storeTagline}
                    onChange={(e) => setEditingSettings({ ...editingSettings, storeTagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>رقم هاتف الاتصال المباشر (زر اتصال للزبائن) *</span>
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={editingSettings.phoneNumber}
                    onChange={(e) => setEditingSettings({ ...editingSettings, phoneNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white font-mono"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    هذا هو الرقم الذي يتصل به العميل مباشرة عند الضغط على "اتصال".
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>رقم واتساب (مع كود الدولة 20) *</span>
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={editingSettings.whatsappNumber}
                    onChange={(e) => setEditingSettings({ ...editingSettings, whatsappNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white font-mono"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    مثال: 01020570660 (20 لمصر)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    <span>رمز العملة</span>
                  </label>
                  <input
                    type="text"
                    value={editingSettings.currency}
                    onChange={(e) => setEditingSettings({ ...editingSettings, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">
                    الحد الأدنى للشحن المجاني
                  </label>
                  <input
                    type="number"
                    value={editingSettings.freeShippingThreshold}
                    onChange={(e) => setEditingSettings({ ...editingSettings, freeShippingThreshold: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">
                  شريط الإعلانات أعلى المتجر
                </label>
                <input
                  type="text"
                  value={editingSettings.announcement}
                  onChange={(e) => setEditingSettings({ ...editingSettings, announcement: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                />
              </div>

              {/* Logo and Banner customizers */}
              <div className="space-y-4 pt-2">
                <ImagePickerField
                  label="لوجو المتجر (Logo - رفع من جهازك أو اختيار اللوجو الرسمي)"
                  value={editingSettings.logoUrl || ''}
                  onChange={(img) => setEditingSettings({ ...editingSettings, logoUrl: img })}
                  presetImages={[
                    { name: 'شعار ELSAWY STORE الرسمي', url: '/assets/aistudio/_____elsawy_a5ca57a6.png' }
                  ]}
                />

                <ImagePickerField
                  label="بانر واجهة المتجر (Hero Banner - رفع من جهازك أو اختيار البانر التقني)"
                  value={editingSettings.bannerUrl || ''}
                  onChange={(img) => setEditingSettings({ ...editingSettings, bannerUrl: img })}
                  presetImages={[
                    { name: 'بانر ELSAWY STORE التقني', url: '/assets/aistudio/elsawy_store_d8c513ab.png' }
                  ]}
                />
              </div>
            </div>

            {/* PIN Security Card */}
            <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <span>حماية لوحة التحكم وتغيير الرقم السري (PIN)</span>
              </h4>
              <p className="text-xs text-stone-400">
                يمكنك هنا تغيير الرقم السري الذي يُطلب للدخول إلى لوحة إدارة المتجر (الرقم الحالي: {editingSettings.adminPin || '1234'}).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">
                    الرقم السري الجديد (4 أرقام على الأقل)
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    maxLength={10}
                    placeholder="****"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">
                    تأكيد الرقم السري الجديد
                  </label>
                  <input
                    type="password"
                    dir="ltr"
                    maxLength={10}
                    placeholder="****"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleUpdatePin}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                تحديث الرقم السري
              </button>
            </div>

            {/* Reset Defaults */}
            <div className="p-6 rounded-3xl bg-red-950/20 border border-red-900/40 flex items-center justify-between gap-4">
              <div>
                <h5 className="text-sm font-bold text-red-400">استعادة الضبط الافتراضي</h5>
                <p className="text-xs text-stone-400 mt-0.5">
                  استعادة جميع منتجات وأقسام وإعدادات المتجر إلى الحالة الأصلية
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('هل أنت متأكد من استعادة الضبط الافتراضي؟')) {
                    onResetDefaults();
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الافتراضي</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};