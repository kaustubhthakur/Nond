import type {
  BusinessOptionsResponse,
  CreateStorePayload,
  StoreResponse,
  StoresListResponse,
   StoreStatsResponse
} from "@/types/store";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,

    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error ?? "Something went wrong. Please try again.");
  }

  return data as T;
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error ?? "Something went wrong. Please try again.");
  }

  return data as T;
}

export function getBusinessOptions() {
  return request<BusinessOptionsResponse>("/store/options");
}

export function createStore(payload: CreateStorePayload) {
  return request<StoreResponse>("/store", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyStores() {
  return request<StoresListResponse>("/store");
}

export function getStore(storeId: string) {
  return request<StoreResponse>(`/store/${storeId}`);
}

export function updateStore(storeId: string, payload: Partial<CreateStorePayload>) {
  return request<StoreResponse>(`/store/${storeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function uploadStoreLogo(storeId: string, file: File) {
  const formData = new FormData();
  formData.append("logo", file);
  return uploadRequest<StoreResponse>(`/store/${storeId}/logo`, formData);
}

export function deleteStore(storeId: string) {
  return request<{ success: boolean; message: string }>(`/store/${storeId}`, {
    method: "DELETE",
  });
}
export function getStoreStats(storeId: string) {
  return request<StoreStatsResponse>(`/store/${storeId}/stats`);
}