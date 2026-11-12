import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, Trash2, Check } from 'lucide-react';

interface ImagePickerFieldProps {
  label: string;
  value: string;
  onChange: (imageUrl: string) => void;
  presetImages?: { name: string; url: string }[];
}

// Built-in presets for computer, laptops, and CCTV cameras
const DEFAULT_PRESETS = [
  { name: 'لاب توب ديل', url: '/src/assets/images/laptop_business_dell_1794498745461.jpg' },
  { name: 'كمبيوتر HP وركستيشن', url: '/src/assets/images/desktop_pc_hp_1794498746835.jpg' },
  { name: 'سيستم كاميرات مراقبة', url: '/src/assets/images/cctv_security_cameras_1794498746992.jpg' },
  { name: 'لاب توب ثينك باد', url: '/src/assets/images/laptop_lenovo_thinkpad_1794498747340.jpg' },
];

/**
 * Resizes and compresses an image file to keep localStorage fast and lightweight
 */
const compressImageFile = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const ImagePickerField: React.FC<ImagePickerFieldProps> = ({
  label,
  value,
  onChange,
  presetImages = DEFAULT_PRESETS,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const compressedDataUrl = await compressImageFile(file);
      onChange(compressedDataUrl);
    } catch (err) {
      console.error('Error uploading/compressing image:', err);
      alert('حدث خطأ أثناء تحميل الصورة، يرجى تجربة صورة أخرى.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlDraft.trim()) {
      onChange(urlDraft.trim());
      setUrlDraft('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
        {label}
      </label>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Current Preview or Upload Box */}
      <div className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
        {/* Thumbnail Preview */}
        <div className="relative w-24 h-24 rounded-lg bg-stone-200 dark:bg-stone-700 overflow-hidden shrink-0 border border-stone-300 dark:border-stone-600 flex items-center justify-center">
          {value ? (
            <img
              src={value}
              alt="معاينة الصورة"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="text-center p-2 text-stone-400 text-[10px]">
              <ImageIcon className="w-6 h-6 mx-auto mb-1 stroke-1" />
              <span>بدون صورة</span>
            </div>
          )}
        </div>

        {/* Upload Buttons & Options */}
        <div className="flex-1 space-y-2 w-full">
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Upload Button from Mobile / PC */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'جاري التحميل...' : '📷 رفع صورة من جهازك'}</span>
            </button>

            {/* Toggle Web URL input */}
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>إدخال رابط صورة</span>
            </button>

            {/* Remove photo button */}
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition-colors cursor-pointer"
                title="إزالة الصورة"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إزالة</span>
              </button>
            )}
          </div>

          {/* Web URL input box */}
          {showUrlInput && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                placeholder="https://..."
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-1.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-xs font-bold rounded-lg cursor-pointer"
              >
                تطبيق
              </button>
            </div>
          )}

          {/* Quick preset selector */}
          {presetImages && presetImages.length > 0 && (
            <div>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block mb-1">
                أو اختر صورة جاهزة من المتجر:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetImages.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChange(preset.url)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                      value === preset.url
                        ? 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-stone-700/60 border-stone-200 dark:border-stone-600 text-stone-600 dark:text-stone-300 hover:border-blue-400'
                    }`}
                  >
                    {value === preset.url && <Check className="w-3 h-3 text-blue-600" />}
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
