import type {
  BusinessOptionsResponse,
  CreateStorePayload,
  StoreResponse,
  StoresListResponse,
} from "@/types/store";

// server.js mounts the router at app.use("/store", storeRouter) with no
// "/api" prefix — e.g. http://localhost:8081/store, /store/options, etc.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    // The server uses cookie-parser + cors({ credentials: true }), which
    // means verifyToken reads the JWT from an httpOnly cookie set at
    // login — not a bearer token. "include" sends that cookie along.
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

export function deleteStore(storeId: string) {
  return request<{ success: boolean; message: string }>(`/store/${storeId}`, {
    method: "DELETE",
  });
}