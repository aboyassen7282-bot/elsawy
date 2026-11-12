import React, { useState } from 'react';
import { X, ShoppingCart, Phone, MessageCircle, Star, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  currency: string;
  phoneNumber: string;
  whatsappNumber: string;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  phoneNumber,
  whatsappNumber,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const whatsappMessage = encodeURIComponent(
    `مرحباً، أود طلب المنتج التالي:\nاسم المنتج: ${product.name}\nالكمية: ${quantity}\nالسعر الإجمالي: ${product.price * quantity} ${currency}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 p-2 rounded-full bg-stone-100/80 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* 
            PRODUCT IMAGE COLUMN:
            Completely dedicated container, zero text overlap!
          */}
          <div className="relative bg-stone-100 dark:bg-stone-800 flex items-center justify-center min-h-[280px] md:min-h-[420px] p-6">
            {!imageError && product.image ? (
              <img
                src={product.image}
                alt={product.name}
                onError={() => setImageError(true)}
                referrerPolicy="no-referrer"
                className="max-h-[380px] w-auto object-contain rounded-xl shadow-sm"
              />
            ) : (
              <div className="text-center p-8 text-stone-400">
                <p className="font-semibold">{product.name}</p>
              </div>
            )}
            {product.badge && (
              <span className="absolute top-4 right-4 bg-stone-900 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                {product.badge}
              </span>
            )}
          </div>

          {/* 
            PRODUCT DETAILS COLUMN:
            Clean, well-spaced, clear hierarchy
          */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Category & Rating */}
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-2">
                <span>{product.category}</span>
                {product.rating && (
                  <div className="flex items-center text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold mr-1 tabular-nums">{product.rating}</span>
                    <span className="text-stone-400 mr-1">({product.reviewsCount || 0})</span>
                  </div>
                )}
              </div>

              {/* Product Title */}
              <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-white leading-snug">
                {product.name}
              </h2>

              {/* Price Row */}
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tabular-nums">
                  {(product.price * quantity).toLocaleString('ar-EG')}
                </span>
                <span className="text-sm font-bold text-stone-600 dark:text-stone-400">{currency}</span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-stone-400 line-through tabular-nums">
                    {(product.originalPrice * quantity).toLocaleString('ar-EG')} {currency}
                  </span>
                )}
                {discountPercentage > 0 && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                    خصم {discountPercentage}%
                  </span>
                )}
              </div>

              {/* Full Description (distinct and clean) */}
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                  وصف المنتج
                </h4>
                <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Key Features */}
              {product.features && product.features.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                    أبرز المواصفات
                  </h4>
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                      <span className="text-amber-500 font-bold">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Trust badges */}
              <div className="mt-5 grid grid-cols-3 gap-2 py-3 px-2 bg-stone-50 dark:bg-stone-800/60 rounded-xl text-center text-[11px] text-stone-600 dark:text-stone-400">
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-4 h-4 text-stone-500" />
                  <span>شحن سريع</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ضمان أصلي</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RefreshCw className="w-4 h-4 text-stone-500" />
                  <span>استبدال 14 يوم</span>
                </div>
              </div>
            </div>

            {/* Actions Area */}
            <div className="mt-6 pt-4 border-t border-stone-100 dark:border-stone-800">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">الكمية:</span>
                <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden bg-stone-50 dark:bg-stone-800">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 font-bold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 font-bold text-sm tabular-nums text-stone-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 font-bold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 
                Side-by-side action buttons:
                [ أضف للسلة ] و [ زر اتصال ]
              */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onAddToCart(product, quantity);
                    onClose();
                  }}
                  disabled={!product.inStock}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 transition-all active:scale-98 cursor-pointer shadow-md"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>أضف للسلة</span>
                </button>

                <a
                  href={`tel:${phoneNumber}`}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-98 cursor-pointer shadow-md"
                >
                  <Phone className="w-4 h-4 animate-bounce" />
                  <span>اتصال مباشر</span>
                </a>
              </div>

              {/* WhatsApp direct order */}
              <div className="mt-3">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>طلب مباشر وسريع عبر واتساب</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
