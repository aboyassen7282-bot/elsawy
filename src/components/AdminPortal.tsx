import React, { useState, useEffect } from 'react';
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
import { supabase } from '../lib/supabaseClient';

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

  // جلب المنتجات المحدثة من Supabase عند تحديث صفحة الأدمن (Refresh) لضمان عدم اختفائها
  useEffect(() => {
    async function fetchAdminFreshData() {
      try {
        const { data: dbProds } = await supabase.from('products').select('*');
        if (dbProds && dbProds.length > 0) {
          const mappedProds: Product[] = dbProds.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: Number(p.price),
            originalPrice: p.original_price ? Number(p.original_price) : undefined,
            description: p.description || '',
            features: p.features || [],
            image: p.image || '',
            inStock: p.in_stock ?? true,
            rating: p.rating ?? 5.0,
            reviewsCount: p.reviews_count ?? 0,
            badge: p.badge || undefined,
          }));
          setLocalProducts(mappedProds);
        }
      } catch (err) {
        console.error('Error refreshing admin products:', err);
      }
    }
    fetchAdminFreshData();
  }, []);

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
          admin_pin: editingSettings.adminPin || '7282',
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

    const { error } = await supabase.from('products').insert([dbPayload]);

    setIsSavingToDb(false);

    if (error) {
      alert('فشل حفظ المنتج في Supabase: ' + error.message);
      return;
    }

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-950 text-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

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
              {/* <span className="text-[11px] text-stone-500 block text-center mt-2">
                الرقم السري الافتراضي هو: <strong className="text-stone-300 font-mono">1234</strong>
              </span> */}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>دخول لوحة التحكم</span>
            </button>
          </form>

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

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {savedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 py-3 px-5 rounded-2xl bg-emerald-600 text-white text-sm font-bold shadow-2xl animate-fade-in">
          <Check className="w-4 h-4" />
          <span>تم الحفظ والمزامنة في قاعدة البيانات بنجاح!</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
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
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onBackToStore}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-stone-700"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>معاينة المتجر كعميل</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSavingToDb}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingToDb ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
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

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  قائمة المنتجات الحالية ({localProducts.length})
                </h3>
              </div>

              <button
                onClick={() => setIsAddingProduct(!isAddingProduct)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {isAddingProduct && (
              <div className="p-6 rounded-3xl bg-stone-900 border border-blue-500/30 space-y-4">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>إدخال بيانات المنتج الجديد</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">اسم المنتج *</label>
                    <input
                      type="text"
                      value={newProduct.name || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">القسم *</label>
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
                    <label className="block text-xs font-bold text-stone-300 mb-1">السعر *</label>
                    <input
                      type="number"
                      value={newProduct.price || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">السعر قبل الخصم</label>
                    <input
                      type="number"
                      value={newProduct.originalPrice || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                    />
                  </div>
                </div>

                <ImagePickerField
                  label="صورة المنتج"
                  value={newProduct.image || ''}
                  onChange={(img) => setNewProduct({ ...newProduct, image: img })}
                />

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">الوصف</label>
                  <textarea
                    rows={3}
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
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    حفظ وإضافة المنتج
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {localProducts.map((prod) => {
                const isEditing = editingProductId === prod.id;
                return (
                  <div key={prod.id} className="p-4 sm:p-5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img src={prod.image} alt={prod.name} className="w-14 h-14 rounded-xl object-cover bg-stone-800 shrink-0 border border-stone-700" />
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-white truncate">{prod.name}</h4>
                          <span className="text-xs text-stone-400">{prod.price} {editingSettings.currency} · <strong className="text-blue-400">{prod.category}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setEditingProductId(isEditing ? null : prod.id)}
                          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700 cursor-pointer"
                        >
                          {isEditing ? 'إغلاق التعديل' : 'تعديل'}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-2 text-red-400 hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-stone-900 border border-blue-500/20">
              <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                <span>إضافة قسم جديد للمتجر</span>
              </h4>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="اسم القسم الجديد..."
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer"
                >
                  إضافة القسم
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {currentCategories.map((catName) => (
                <div key={catName} className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-4">
                  <h5 className="text-base font-bold text-white">{catName}</h5>
                  <button onClick={() => handleDeleteCategory(catName)} className="p-2 text-red-400 hover:bg-red-950/40 rounded-xl cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">سجل طلبات الشراء الواردة ({orders.length})</h3>
            {orders.map((ord) => (
              <div key={ord.id} className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                  <span className="font-bold text-white">طلب رقم #{ord.orderNumber}</span>
                  <span className="text-xs text-amber-400">{ord.total} {settings.currency}</span>
                </div>
                <div className="text-xs text-stone-300">
                  <p>العميل: <strong>{ord.customerName}</strong></p>
                  <p>الهاتف: <strong dir="ltr">{ord.phone}</strong></p>
                  <p>العنوان: <strong>{ord.city} - {ord.address}</strong></p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <h4 className="text-base font-bold text-white">إعدادات المتجر</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">اسم المتجر</label>
                  <input
                    type="text"
                    value={editingSettings.storeName}
                    onChange={(e) => setEditingSettings({ ...editingSettings, storeName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">هاتف الاتصال</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={editingSettings.phoneNumber}
                    onChange={(e) => setEditingSettings({ ...editingSettings, phoneNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-sm text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};