// @ts-nocheck
import React from 'react';
import { ShoppingBag, Share2, Settings, Phone, Moon, Sun } from 'lucide-react';
import { StoreSettings } from '../types';

interface HeaderProps {
  settings: StoreSettings;
  cartCount: number;
  isAdmin?: boolean;
  onOpenCart: () => void;
  onOpenShare: () => void;
  onGoToAdmin?: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  cartCount,
  isAdmin,
  onOpenCart,
  onOpenShare,
  onGoToAdmin,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      {/* Top Announcement Bar */}
      {settings.announcement && (
        <div className="bg-stone-900 dark:bg-stone-950 text-stone-200 text-xs py-2 px-4 text-center font-medium tracking-wide">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <span className="mx-auto truncate">{settings.announcement}</span>
            <a
              href={`tel:${settings.phoneNumber}`}
              className="hidden sm:inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors shrink-0 text-xs font-semibold"
            >
              <Phone className="w-3.5 h-3.5" />
              <span dir="ltr">{settings.phoneNumber}</span>
            </a>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Zone with Official Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <a href="#" className="flex items-center gap-3 group">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.storeName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-md border-2 border-blue-500/30 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-base">
                ES
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-tight text-stone-900 dark:text-white flex items-center gap-1.5">
                <span className="text-blue-600 dark:text-blue-400">STORE</span> ELSAWY 
              </span>
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 hidden sm:block">
                {settings.storeTagline}
              </span>
            </div>
          </a>
        </div>

        {/* Desktop Quick Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-300">
          <a href="#products" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            جميع المنتجات
          </a>
          <a href="#features" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            مميزات التسوق
          </a>
          <a href="#contact" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            تواصل معنا
          </a>
        </nav>

        {/* Action Zone */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Share Link Button (user request: فتح الرابط على أي متصفح) */}
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all cursor-pointer"
            title="مشاركة رابط المتجر وفتحه على أي متصفح"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">مشاركة الرابط</span>
          </button>

          {/* Admin Portal Button - shown ONLY to logged-in admin */}
          {isAdmin && onGoToAdmin && (
            <button
              onClick={onGoToAdmin}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
              title="الانتقال إلى لوحة إدارة المتجر"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">لوحة الإدارة</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            title={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            aria-label="تبديل الوضع"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center justify-center p-2.5 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-100 transition-all cursor-pointer shadow-sm"
            aria-label="سلة المشتريات"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
