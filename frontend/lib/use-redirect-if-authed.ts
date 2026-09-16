"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useRedirectIfAuthed(destination = "/dashboard") {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(destination);
    }
  }, [isLoading, user, router, destination]);

 
  return { checking: isLoading || !!user };
}