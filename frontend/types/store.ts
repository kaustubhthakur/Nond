export const BUSINESS_TYPES = [
  "retail",
  "wholesale",
  "manufacturing",
  "service",
  "restaurant",
  "online",
  "other",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  retail: "Retail",
  wholesale: "Wholesale",
  manufacturing: "Manufacturing",
  service: "Service",
  restaurant: "Restaurant",
  online: "Online",
  other: "Something else",
};

export const BUSINESS_CATEGORIES = [
  "grocery",
  "electronics",
  "fashion",
  "furniture",
  "automotive",
  "beauty",
  "food",
  "hardware",
  "sports",
  "books",
  "jewelry",
  "healthcare",
  "other",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  grocery: "Grocery",
  electronics: "Electronics",
  fashion: "Fashion",
  furniture: "Furniture",
  automotive: "Automotive",
  beauty: "Beauty",
  food: "Food",
  hardware: "Hardware",
  sports: "Sports",
  books: "Books",
  jewelry: "Jewelry",
  healthcare: "Healthcare",
  other: "Something else",
};

export interface CreateStorePayload {
  storeName: string;
  businessType: BusinessType;
  businessTypeCustom?: string | null;
  businessCategory: BusinessCategory;
  businessCategoryCustom?: string | null;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  language?: string;
  currency?: string;
  timezone?: string;
}

export interface Store extends CreateStorePayload {
  id: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessOptionsResponse {
  success: boolean;
  businessTypes: BusinessType[];
  businessCategories: BusinessCategory[];
}

export interface StoreResponse {
  success: boolean;
  message?: string;
  store: Store;
}

export interface StoresListResponse {
  success: boolean;
  stores: Store[];
}