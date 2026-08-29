"use client";

import { useEffect } from "react";
import { useStore } from "@/context/StoreContext";

export function DocumentTitle() {
  const { store } = useStore();

  useEffect(() => {
    document.title = store ? `${store.store_name} by Nond` : "Nond";
  }, [store]);

  return null;
}