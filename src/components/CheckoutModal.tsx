import React, { useState } from 'react';
import { X, CheckCircle2, Phone, MessageCircle, Truck } from 'lucide-react';
import { CartItem, OrderDetails, StoreSettings, StoredOrder } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  items: CartItem[];
  settings: StoreSettings;
  onClose: () => void;
  onOrderComplete: () => void;
  onSaveOrder?: (order: StoredOrder) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  items,
  settings,
  onClose,
  onOrderComplete,
  onSaveOrder,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = useState<OrderDetails>({
    customerName: '',
    phone: '',
    address: '',
    city: 'القاهرة',
    notes: '',
    paymentMethod: 'cod',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const isFreeShipping = subtotal >= settings.freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : 45;
  const total = subtotal + shippingFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.phone.trim() || !form.address.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const randomId = Math.floor(100000 + Math.random() * 900000).toString();
    setOrderNumber(randomId);

    if (onSaveOrder) {
      onSaveOrder({
        id: `ord-${Date.now()}`,
        orderNumber: randomId,
        createdAt: new Date().toISOString(),
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city,
        notes: form.notes?.trim(),
        items: items.map((it) => ({
          productId: it.product.id,
          productName: it.product.name,
          productImage: it.product.image,
          price: it.product.price,
          quantity: it.quantity,
        })),
        subtotal,
        shippingFee,
        total,
        status: 'new',
      });
    }

    setIsSubmitted(true);
    onOrderComplete();
  };

  const orderSummaryText = encodeURIComponent(
    `طلب جديد رقم #${orderNumber}\n` +
    `الاسم: ${form.customerName}\n` +
    `الهاتف: ${form.phone}\n` +
    `العنوان: ${form.city} - ${form.address}\n` +
    `المنتجات:\n` +
    items.map((it) => `- ${it.product.name} (الكمية: ${it.quantity}) - ${it.product.price * it.quantity} ${settings.currency}`).join('\n') +
    `\nالإجمالي المطلوب عند الاستلام: ${total} ${settings.currency}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                إتمام الطلب والدفع عند الاستلام
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                ادخل بيانات التوصيل وسيتم شحن طلبك والتأكيد معك هاتفياً
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  الاسم الكامل *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد أحمد"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  رقم الهاتف للتواصل والتأكيد *
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="010XXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    المحافظة / المدينة *
                  </label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="القاهرة">القاهرة</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                    <option value="الدقهلية">الدقهلية</option>
                    <option value="الشرقية">الشرقية</option>
                    <option value="القليوبية">القليوبية</option>
                    <option value="الغربية">الغربية</option>
                    <option value="المنوفية">المنوفية</option>
                    <option value="البحيرة">البحيرة</option>
                    <option value="محافظة أخرى">محافظة أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    طريقة الدفع
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 text-xs font-semibold">
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>الدفع نقداً عند الاستلام</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  العنوان بالتفصيل (اسم الشارع - رقم العقار - الدور) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="اكتب العنوان بالتفصيل لسرعة وصول المندوب..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Order total preview */}
              <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>إجمالي المنتجات ({items.length}):</span>
                  <span className="font-bold tabular-nums text-stone-900 dark:text-white">
                    {subtotal.toLocaleString('ar-EG')} {settings.currency}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>الشحن:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {isFreeShipping ? 'مجاناً' : `${shippingFee} ${settings.currency}`}
                  </span>
                </div>
                <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between text-sm font-bold text-stone-900 dark:text-white">
                  <span>المبلغ الإجمالي المطلوب عند الاستلام:</span>
                  <span className="tabular-nums text-amber-600 dark:text-amber-400 text-base">
                    {total.toLocaleString('ar-EG')} {settings.currency}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer mt-2"
              >
                تأكيد وإرسال الطلب الآن
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-extrabold text-stone-900 dark:text-white mb-2">
              تم استلام طلبك بنجاح!
            </h3>
            <p className="text-stone-600 dark:text-stone-300 text-sm mb-2">
              شكراً لتسوقك معنا يا <strong className="text-stone-900 dark:text-white">{form.customerName}</strong>
            </p>
            <p className="text-xs text-stone-500 mb-6">
              رقم طلبك: <span className="font-mono font-bold text-amber-600">#{orderNumber}</span> · سنتصل بك قريباً لتأكيد ميعاد التوصيل
            </p>

            {/* Quick Actions after order */}
            <div className="space-y-3">
              <a
                href={`https://wa.me/${settings.whatsappNumber}?text=${orderSummaryText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال تفاصيل الفاتورة عبر واتساب فوراً</span>
              </a>

              <a
                href={`tel:${settings.phoneNumber}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>اتصال هاتفي بخدمة العملاء ({settings.phoneNumber})</span>
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 font-medium cursor-pointer"
              >
                العودة للتسوق في المتجر
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
