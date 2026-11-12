export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  image: string;
  inStock: boolean;
  rating?: number;
  reviewsCount?: number;
  badge?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StoreSettings {
  storeName: string;
  storeTagline: string;
  announcement: string;
  phoneNumber: string;
  whatsappNumber: string;
  currency: string;
  freeShippingThreshold: number;
  logoUrl?: string;
  bannerUrl?: string;
  categories?: string[];
  adminPin?: string; // أضيف لحفظ وتحديث الرقم السري للوحة التحكم
}

export interface OrderDetails {
  customerName: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
  paymentMethod: 'cod';
}

export interface StoredOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: 'new' | 'processing' | 'delivered' | 'cancelled';
  paymentMethod: string;
  createdAt: string;
}