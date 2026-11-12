import React, { useState } from 'react';
import { X, Copy, Check, Share2, Globe, ExternalLink, Smartphone } from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  storeName,
}) => {
  if (!isOpen) return null;

  // The actual live URL of this deployed applet:
  const liveUrl = 'https://ais-pre-nwgh66lu4d6jhchbysbvlj-273712393121.europe-west1.run.app';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(liveUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = liveUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `تفضل بزيارة ${storeName} وتسوق أفضل المنتجات مع إمكانية الاتصال المباشر والدفع عند الاستلام:`,
          url: liveUrl,
        });
      } catch (err) {
        console.log('Share dismissed', err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:bg-stone-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Globe className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 dark:text-white">
            رابط المتجر (يفتح على النت من أي متصفح)
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            متجرك منشور ومتاح أونلاين على مدار الساعة، ويمكن فتحه على الموبايل والكمبيوتر عبر أي متصفح
          </p>
        </div>

        {/* Link box */}
        <div className="p-3.5 bg-stone-50 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 mb-5">
          <label className="block text-[11px] font-bold text-stone-500 dark:text-stone-400 mb-1.5">
            رابط المتجر المباشر:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              dir="ltr"
              value={liveUrl}
              className="flex-1 bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-mono text-stone-800 dark:text-stone-200 select-all"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 hover:bg-stone-800'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ'}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة الرابط عبر الواتساب أو التطبيقات</span>
          </button>

          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>تجربة فتح الرابط في تبويب جديد</span>
          </a>
        </div>

        {/* Browser compatibility info */}
        <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-stone-500 mb-2">
            <Smartphone className="w-4 h-4 text-amber-500" />
            <span>متوافق مع جميع المتصفحات والأجهزة:</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Google Chrome · Safari (iPhone & Mac) · Samsung Internet · Firefox · Edge
          </p>
        </div>
      </div>
    </div>
  );
};
