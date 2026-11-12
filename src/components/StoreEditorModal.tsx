import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Edit3, RotateCcw, Check, Phone, DollarSign, FolderTree, Tag, AlertCircle } from 'lucide-react';
import { Product, StoreSettings } from '../types';
import { INITIAL_CATEGORIES } from '../data/defaultProducts';
import { ImagePickerField } from './ImagePickerField';

interface StoreEditorModalProps {
  isOpen: boolean;
  settings: StoreSettings;
  products: Product[];
  initialTab?: 'products' | 'categories' | 'settings';
  onClose: () => void;
  onSaveSettings: (settings: StoreSettings) => void;
  onSaveProducts: (products: Product[]) => void;
  onResetDefaults: () => void;
}

export const StoreEditorModal: React.FC<StoreEditorModalProps> = ({
  isOpen,
  settings,
  products,
  initialTab = 'products',
  onClose,
  onSaveSettings,
  onSaveProducts,
  onResetDefaults,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'settings'>(initialTab);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [editingSettings, setEditingSettings] = useState<StoreSettings>({
    ...settings,
    categories: settings.categories && settings.categories.length > 0 ? settings.categories : INITIAL_CATEGORIES,
  });
  const [localProducts, setLocalProducts] = useState<Product[]>([...products]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [savedAlert, setSavedAlert] = useState(false);

  // Category management states
  const currentCategories = editingSettings.categories && editingSettings.categories.length > 0
    ? editingSettings.categories
    : INITIAL_CATEGORIES;

  const [newCatInput, setNewCatInput] = useState('');
  const [editingCatOld, setEditingCatOld] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [quickAddCatModal, setQuickAddCatModal] = useState(false);
  const [quickCatDraft, setQuickCatDraft] = useState('');

  // New product draft
  const [isAddingNew, setIsAddingNew] = useState(false);
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

  const handleSaveAll = () => {
    onSaveSettings(editingSettings);
    onSaveProducts(localProducts);
    setSavedAlert(true);
    setTimeout(() => {
      setSavedAlert(false);
    }, 2500);
  };

  const handleUpdateProduct = (id: string, updatedFields: Partial<Product>) => {
    setLocalProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      setLocalProducts((prev) => prev.filter((p) => p.id !== id));
      if (editingProductId === id) setEditingProductId(null);
    }
  };

  const handleAddNewProduct = () => {
    if (!newProduct.name?.trim()) {
      alert('يرجى إدخال اسم المنتج');
      return;
    }

    const created: Product = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      category: newProduct.category || currentCategories[0] || 'عام',
      price: Number(newProduct.price) || 100,
      originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
      description: newProduct.description || 'منتج عالي الجودة متوفر للطلب الفوري.',
      features: newProduct.features || ['منتج أصلي', 'توصيل لجميع المحافظات'],
      image: newProduct.image || '/src/assets/images/laptop_business_dell_1794498745461.jpg',
      inStock: newProduct.inStock ?? true,
      badge: newProduct.badge || 'جديد',
      rating: 5.0,
      reviewsCount: 1,
    };

    setLocalProducts([created, ...localProducts]);
    setIsAddingNew(false);
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
  };

  // Category Operations
  const handleAddCategory = (catToAdd?: string) => {
    const targetName = (catToAdd || newCatInput).trim();
    if (!targetName) {
      alert('يرجى كتابة اسم القسم');
      return;
    }
    if (currentCategories.includes(targetName)) {
      alert('هذا القسم موجود بالفعل');
      return;
    }
    const updated = [...currentCategories, targetName];
    setEditingSettings((prev) => ({ ...prev, categories: updated }));
    setNewCatInput('');
    setQuickCatDraft('');
    setQuickAddCatModal(false);
  };

  const handleDeleteCategory = (catName: string) => {
    const productsInThisCat = localProducts.filter((p) => p.category === catName);
    const confirmMessage = productsInThisCat.length > 0
      ? `هذا القسم يحتوي على ${productsInThisCat.length} منتج. عند حذفه، سيتم نقل هذه المنتجات إلى قسم "عام" لحمايتها من الحذف. هل تريد المتابعة؟`
      : `هل أنت متأكد من حذف قسم "${catName}"؟`;

    if (confirm(confirmMessage)) {
      const updatedCategories = currentCategories.filter((c) => c !== catName);
      setEditingSettings((prev) => ({ ...prev, categories: updatedCategories }));

      // Move products from this category to 'عام'
      if (productsInThisCat.length > 0) {
        setLocalProducts((prev) =>
          prev.map((p) => (p.category === catName ? { ...p, category: 'عام' } : p))
        );
      }
    }
  };

  const handleStartRename = (catName: string) => {
    setEditingCatOld(catName);
    setEditingCatName(catName);
  };

  const handleSaveRename = () => {
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

    const updatedCategories = currentCategories.map((c) => (c === editingCatOld ? trimmed : c));
    setEditingSettings((prev) => ({ ...prev, categories: updatedCategories }));

    // Update products that were under old category name
    setLocalProducts((prev) =>
      prev.map((p) => (p.category === editingCatOld ? { ...p, category: trimmed } : p))
    );
    setEditingCatOld(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-500" />
              <span>لوحة التحكم وتعديل المتجر</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              يمكنك هنا تعديل المنتجات وإضافة الصور وإدارة الأقسام وتعديل أرقام الاتصال
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-stone-100 dark:border-stone-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            إدارة المنتجات ({localProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>إدارة وتعديل الأقسام ({currentCategories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
            }`}
          >
            إعدادات المتجر وأرقام الاتصال
          </button>
        </div>

        {/* Main Tabs Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          
          {/* TAB 1: Products Management */}
          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-stone-500 font-semibold">
                  اضغط على أي منتج لتعديل اسمه أو سعره أو قسمه وصورته:
                </span>
                <button
                  onClick={() => setIsAddingNew(!isAddingNew)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج جديد</span>
                </button>
              </div>

              {/* Add New Product Form */}
              {isAddingNew && (
                <div className="p-5 mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-4">
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>إدخال بيانات المنتج الجديد</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                        اسم المنتج *
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: لاب توب ديل كور آي 7"
                        value={newProduct.name || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300">
                          القسم / التصنيف *
                        </label>
                        <button
                          type="button"
                          onClick={() => setQuickAddCatModal(true)}
                          className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold"
                        >
                          + قسم جديد
                        </button>
                      </div>
                      <select
                        value={newProduct.category || currentCategories[0] || 'عام'}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                      >
                        {currentCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                        السعر الحالي ({editingSettings.currency}) *
                      </label>
                      <input
                        type="number"
                        value={newProduct.price || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                        السعر قبل الخصم (اختياري)
                      </label>
                      <input
                        type="number"
                        value={newProduct.originalPrice || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Image Picker with Device Upload */}
                  <ImagePickerField
                    label="صورة المنتج (رفع من جهازك أو اختيار صورة جاهزة)"
                    value={newProduct.image || ''}
                    onChange={(img) => setNewProduct({ ...newProduct, image: img })}
                  />

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 dark:text-stone-300 mb-1">
                      وصف وتفاصيل المنتج
                    </label>
                    <textarea
                      rows={2}
                      placeholder="اكتب مواصفات المنتج وحالته..."
                      value={newProduct.description || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsAddingNew(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleAddNewProduct}
                      className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
                    >
                      حفظ وإضافة المنتج
                    </button>
                  </div>
                </div>
              )}

              {/* Products list with inline edit toggle */}
              <div className="space-y-3">
                {localProducts.map((prod) => {
                  const isEditing = editingProductId === prod.id;
                  return (
                    <div
                      key={prod.id}
                      className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg object-cover bg-stone-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-sm font-bold text-stone-900 dark:text-white truncate">
                              {prod.name}
                            </h5>
                            <span className="text-xs text-stone-500">
                              {prod.price} {editingSettings.currency} · <strong className="text-blue-600 dark:text-blue-400 font-semibold">{prod.category}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setEditingProductId(isEditing ? null : prod.id)}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-300 cursor-pointer"
                          >
                            {isEditing ? 'إغلاق التعديل' : 'تعديل التفاصيل والصورة'}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-2 text-xs font-bold rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Edit Form */}
                      {isEditing && (
                        <div className="pt-3 border-t border-stone-200 dark:border-stone-700 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                                اسم المنتج
                              </label>
                              <input
                                type="text"
                                value={prod.name}
                                onChange={(e) => handleUpdateProduct(prod.id, { name: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                              />
                            </div>

                            {/* Category Selector for Existing Product */}
                            <div>
                              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                                القسم / التصنيف
                              </label>
                              <select
                                value={prod.category}
                                onChange={(e) => handleUpdateProduct(prod.id, { category: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                              >
                                {currentCategories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                                السعر ({editingSettings.currency})
                              </label>
                              <input
                                type="number"
                                value={prod.price}
                                onChange={(e) => handleUpdateProduct(prod.id, { price: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                                حالة التوفر
                              </label>
                              <select
                                value={prod.inStock ? 'true' : 'false'}
                                onChange={(e) => handleUpdateProduct(prod.id, { inStock: e.target.value === 'true' })}
                                className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                              >
                                <option value="true">متوفر بالمخزن</option>
                                <option value="false">نفذت الكمية</option>
                              </select>
                            </div>
                          </div>

                          {/* Image picker inside existing product */}
                          <ImagePickerField
                            label="صورة المنتج (تغيير أو رفع صورة جديدة لهذا المنتج)"
                            value={prod.image || ''}
                            onChange={(img) => handleUpdateProduct(prod.id, { image: img })}
                          />

                          <div>
                            <label className="block text-[11px] font-bold text-stone-600 dark:text-stone-300 mb-1">
                              وصف المنتج
                            </label>
                            <textarea
                              rows={2}
                              value={prod.description}
                              onChange={(e) => handleUpdateProduct(prod.id, { description: e.target.value })}
                              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white resize-none"
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

          {/* TAB 2: Categories Management (إدارة الأقسام) */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Add New Category Card */}
              <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                <h4 className="text-sm font-bold text-blue-950 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>إضافة قسم جديد للمتجر</span>
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
                  اكتب اسم القسم الجديد (مثلاً: شاشات كمبيوتر، طابعات وأحبار، هاردوير، أجهزة شبكات) ليظهر في قائمة الفلاتر وتصنيف المنتجات.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="اسم القسم الجديد..."
                    value={newCatInput}
                    onChange={(e) => setNewCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleAddCategory()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة القسم</span>
                  </button>
                </div>
              </div>

              {/* Current Categories List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-blue-500" />
                    <span>أقسام المتجر الحالية ({currentCategories.length})</span>
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    يمكنك تعديل اسم القسم أو حذفه
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentCategories.map((catName) => {
                    const productCount = localProducts.filter((p) => p.category === catName).length;
                    const isRenaming = editingCatOld === catName;

                    return (
                      <div
                        key={catName}
                        className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3"
                      >
                        {!isRenaming ? (
                          <>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Tag className="w-4 h-4" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-stone-900 dark:text-white">
                                  {catName}
                                </h5>
                                <span className="text-xs text-stone-500">
                                  {productCount === 0
                                    ? 'لا توجد منتجات بعد'
                                    : `يحتوي على ${productCount} ${productCount === 1 ? 'منتج' : 'منتجات'}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStartRename(catName)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-300 transition-colors cursor-pointer"
                              >
                                تعديل الاسم
                              </button>

                              <button
                                onClick={() => handleDeleteCategory(catName)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                title="حذف القسم"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          /* Inline Rename Form */
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={editingCatName}
                              onChange={(e) => setEditingCatName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename();
                                if (e.key === 'Escape') setEditingCatOld(null);
                              }}
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-blue-500 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveRename}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => setEditingCatOld(null)}
                              className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-semibold cursor-pointer"
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

          {/* TAB 3: Store Settings & Contact Numbers */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    اسم المتجر
                  </label>
                  <input
                    type="text"
                    value={editingSettings.storeName}
                    onChange={(e) => setEditingSettings({ ...editingSettings, storeName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    شعار المتجر (الوصف المختصر)
                  </label>
                  <input
                    type="text"
                    value={editingSettings.storeTagline}
                    onChange={(e) => setEditingSettings({ ...editingSettings, storeTagline: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>رقم هاتف الاتصال المباشر (زر اتصال) *</span>
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={editingSettings.phoneNumber}
                    onChange={(e) => setEditingSettings({ ...editingSettings, phoneNumber: e.target.value })}
                    placeholder="010XXXXXXXX"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-white font-mono"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    هذا هو الرقم الذي يتم الاتصال به عند ضغط الزبون على زر "اتصال" بجوار "أضف للسلة"
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>رقم واتساب (مع كود الدولة) *</span>
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={editingSettings.whatsappNumber}
                    onChange={(e) => setEditingSettings({ ...editingSettings, whatsappNumber: e.target.value })}
                    placeholder="2010XXXXXXXX"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-white font-mono"
                  />
                  <span className="text-[11px] text-stone-500 mt-1 block">
                    مثال: 01020570660 (20 لمصر)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                    <span>رمز العملة</span>
                  </label>
                  <input
                    type="text"
                    value={editingSettings.currency}
                    onChange={(e) => setEditingSettings({ ...editingSettings, currency: e.target.value })}
                    placeholder="ج.م أو ر.س أو $"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    الحد الأدنى للشحن المجاني
                  </label>
                  <input
                    type="number"
                    value={editingSettings.freeShippingThreshold}
                    onChange={(e) => setEditingSettings({ ...editingSettings, freeShippingThreshold: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Logo and Banner customizers with file upload */}
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

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  شريط الإعلانات أعلى الصفحة
                </label>
                <input
                  type="text"
                  value={editingSettings.announcement}
                  onChange={(e) => setEditingSettings({ ...editingSettings, announcement: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-sm text-stone-900 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (confirm('هل تريد استعادة المنتجات والأقسام والإعدادات الافتراضية؟')) {
                      onResetDefaults();
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 cursor-pointer font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة الضبط الافتراضي للمتجر</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Category Modal / Drawer */}
        {quickAddCatModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800">
              <h5 className="text-sm font-bold text-stone-900 dark:text-white mb-2">
                إضافة قسم جديد سريعاً
              </h5>
              <input
                type="text"
                placeholder="اسم القسم الجديد..."
                value={quickCatDraft}
                onChange={(e) => setQuickCatDraft(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-900 dark:text-white mb-3"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setQuickAddCatModal(false)}
                  className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => {
                    if (quickCatDraft.trim()) {
                      handleAddCategory(quickCatDraft.trim());
                      setNewProduct({ ...newProduct, category: quickCatDraft.trim() });
                    }
                  }}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  إضافة واختيار
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer save bar */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            {savedAlert && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <Check className="w-4 h-4" />
                تم حفظ جميع التعديلات والأقسام بنجاح!
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ جميع التعديلات والأقسام</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
