"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getMyStores,
  updateStore,
  uploadStoreLogo as uploadLogoRequest,
} from "@/lib/store";
import type { Store } from "@/types/store";

interface StoreContextValue {
  store: Store | null;
  isLoading: boolean;
  uploadingLogo: boolean;
  renamingStore: boolean;
  refreshStore: () => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  renameStore: (newName: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [renamingStore, setRenamingStore] = useState(false);

  const refreshStore = useCallback(async () => {
    if (!user) {
      setStore(null);
      setIsLoading(false);
      return;
    }
    try {
      const { stores } = await getMyStores();
      setStore(stores.length > 0 ? stores[0] : null);
    } catch {
      setStore(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  const uploadLogo = useCallback(
    async (file: File) => {
      if (!store) return;
      setUploadingLogo(true);
      try {
        const { store: updated } = await uploadLogoRequest(store.id, file);
        setStore(updated);
      } finally {
        setUploadingLogo(false);
      }
    },
    [store]
  );

  const renameStore = useCallback(
    async (newName: string) => {
      if (!store) return;
      const trimmed = newName.trim();
      if (!trimmed || trimmed === store.store_name) return;

      setRenamingStore(true);
      try {
        const { store: updated } = await updateStore(store.id, {
          storeName: trimmed,
        });
        setStore(updated);
      } finally {
        setRenamingStore(false);
      }
    },
    [store]
  );

  return (
    <StoreContext.Provider
      value={{
        store,
        isLoading,
        uploadingLogo,
        renamingStore,
        refreshStore,
        uploadLogo,
        renameStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}