export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl: string;
  parentSlug?: string;
  children?: Category[];
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  stock: number;
  rating: number;
  reviewCount: number;
  images: string[];
  categorySlug: string; // subcategory (leaf) slug
  categoryName: string; // subcategory (leaf) name
  mainCategorySlug?: string;
  mainCategoryName?: string;
  brand: Brand;
  isFlashOffer?: boolean;
  specifications?: Record<string, string>;
  warrantyMonths?: number;
}

export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface CheckoutFormValues {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode?: string;
  notes?: string;
}
