import React, { useState } from 'react';
import { ShoppingCart, Phone, MessageCircle, Star, Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  currency: string;
  phoneNumber: string;
  whatsappNumber: string;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  phoneNumber,
  whatsappNumber,
  onAddToCart,
  onViewDetails,
}) => {
  const [imageError, setImageError] = useState(false);

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const whatsappMessage = encodeURIComponent(
    `السلام عليكم، أود الاستفسار عن منتج: "${product.name}" بسعر ${product.price} ${currency}`
  );

  return (
    <article className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden">
      {/* 
        IMAGE CONTAINER:
        Strictly isolated box so product description NEVER overlaps or bleeds into the image.
      */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative w-full aspect-4/3 bg-stone-100 dark:bg-stone-800 overflow-hidden cursor-pointer"
      >
        {!imageError && product.image ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 text-stone-400">
            <span className="text-sm font-medium">{product.name}</span>
          </div>
        )}

        {/* Small badge top-right inside image frame */}
        {product.badge && (
          <span className="absolute top-3 right-3 bg-stone-900/90 text-amber-400 text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm backdrop-blur-xs">
            {product.badge}
          </span>
        )}

        {/* Hover quick preview button */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/90 dark:bg-stone-900/90 text-stone-900 dark:text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 backdrop-blur-xs">
            <Eye className="w-3.5 h-3.5" />
            عرض التفاصيل
          </span>
        </div>
      </div>

      {/* 
        CONTENT & DESCRIPTION CONTAINER:
        Completely separate from the image box, with clear spacing and zero overlap!
      */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Stock Status */}
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1.5">
            <span className="font-medium text-stone-500 dark:text-stone-400">{product.category}</span>
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={product.inStock ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-red-600'}>
                {product.inStock ? 'متوفر بالمخزن' : 'نفذت الكمية'}
              </span>
            </span>
          </div>

          {/* Product Name */}
          <h3 
            onClick={() => onViewDetails(product)}
            className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors line-clamp-1 cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* 
            Description:
            Nicely spaced, distinct from image, clean typography
          */}
          <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Rating */}
          {product.rating && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <div className="flex items-center text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="font-bold mr-1 tabular-nums">{product.rating}</span>
              </div>
              {product.reviewsCount && (
                <span>({product.reviewsCount} تقييم)</span>
              )}
            </div>
          )}
        </div>

        {/* Pricing and Action Buttons */}
        <div className="mt-4 pt-3.5 border-t border-stone-100 dark:border-stone-800">
          {/* Price Row */}
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-stone-900 dark:text-white tabular-nums">
                {product.price.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-semibold text-stone-500">{currency}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-stone-400 line-through tabular-nums mr-1">
                  {product.originalPrice.toLocaleString('ar-EG')} {currency}
                </span>
              )}
            </div>
            {discountPercentage > 0 && (
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
                وفر {discountPercentage}%
              </span>
            )}
          </div>

          {/* 
            Action Buttons Side-by-Side:
            [ أضف للسلة ] جنبها [ زر اتصال ] ومحادثة واتساب
          */}
          <div className="grid grid-cols-2 gap-2">
            {/* Add to Cart Button */}
            {/* <button
              onClick={() => onAddToCart(product)}
              disabled={!product.inStock}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs ${
                product.inStock
                  ? 'bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 active:scale-98'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="truncate">أضف للسلة</span>
            </button> */}

            {/* Direct Phone Call Button (Requirement: جنب اضف للسلة زر اتصال) */}
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-98 cursor-pointer shadow-xs"
              title={`اتصال مباشر: ${phoneNumber}`}
            >
              <Phone className="w-4 h-4 shrink-0 animate-bounce" />
              <span className="truncate">اتصال</span>
            </a>
          </div>

          {/* Secondary Quick WhatsApp Row */}
          <div className="mt-2 flex items-center justify-center">
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1 text-[11px] sm:text-xs text-stone-500 hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400 py-1 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>أو استفسر عبر واتساب</span>
            </a>
          </div>
        </div>
      </div>
    </article>
  );
};
