import React from 'react';
import { X, Trash2, ShoppingBag, ArrowLeft, Plus, Minus, Truck } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  currency: string;
  freeShippingThreshold: number;
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  currency,
  freeShippingThreshold,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity">
      <div 
        className="w-full max-w-md bg-white dark:bg-stone-900 h-full shadow-2xl flex flex-col border-r border-stone-200 dark:border-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-white">
              سلة المشتريات ({items.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="إغلاق السلة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Bar */}
        <div className="px-5 py-3 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            <Truck className="w-4 h-4 text-amber-500 shrink-0" />
            {remainingForFreeShipping === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                🎉 مبروك! حصلت على شحن مجاني
              </span>
            ) : (
              <span>
                أضف بقيمة <strong className="tabular-nums font-bold text-stone-900 dark:text-white">{remainingForFreeShipping} {currency}</strong> للحصول على شحن مجاني
              </span>
            )}
          </div>
          <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <ShoppingBag className="w-16 h-16 stroke-1 mb-3 text-stone-300 dark:text-stone-600" />
              <p className="text-base font-bold text-stone-700 dark:text-stone-300 mb-1">
                سلتك فارغة حالياً
              </p>
              <p className="text-xs text-stone-500 mb-4">
                تصفح منتجاتنا المميزة وأضف ما يعجبك!
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-3 p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800"
              >
                {/* Thumb */}
                <div className="w-20 h-20 rounded-xl bg-white dark:bg-stone-800 overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white truncate">
                        {product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(product.id)}
                        className="text-stone-400 hover:text-red-500 transition-colors p-1"
                        title="حذف من السلة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-stone-500">
                      {product.price.toLocaleString('ar-EG')} {currency}
                    </span>
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden bg-white dark:bg-stone-900">
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 text-xs font-bold tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white tabular-nums">
                      {(product.price * quantity).toLocaleString('ar-EG')} {currency}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
            <div className="flex items-center justify-between text-sm mb-2 text-stone-600 dark:text-stone-400">
              <span>المجموع الفرعي:</span>
              <span className="font-bold text-stone-900 dark:text-white tabular-nums">
                {subtotal.toLocaleString('ar-EG')} {currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-4 text-stone-600 dark:text-stone-400">
              <span>مصاريف الشحن:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {subtotal >= freeShippingThreshold ? 'مجاناً' : 'تحدد عند التأكيد'}
              </span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <span>متابعة إتمام الطلب</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
