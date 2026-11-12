import { createClient } from '@supabase/supabase-js';

// قراءة بيانات الاتصال من متغيرات البيئة في Vercel أو المتصفح
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('تحذير: مفاتيح اتصال Supabase غير متوفرة أو ناقصة في متغيرات البيئة.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);