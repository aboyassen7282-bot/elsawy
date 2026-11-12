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
}

export interface OrderDetails {
  customerName: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
  paymentMethod: 'cod';
}
