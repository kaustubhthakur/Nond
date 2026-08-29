"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";

function navLinkClass(active: boolean) {
  return `text-sm tracking-wide transition-colors ${
    active ? "text-accent" : "text-ink/60 hover:text-ink"
  }`;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, clearSession } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
   
    } finally {
      clearSession();
      setLoggingOut(false);
      router.push("/login");
    }
  };

  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-display italic text-lg text-ink tracking-wide"
        >
          Ledger
        </Link>

        <nav className="flex items-center gap-5 sm:gap-6">
          <Link href="/" className={navLinkClass(pathname === "/")}>
            Home
          </Link>

          {isLoading ? null : user ? (
            <>
              <Link
                href="/dashboard"
                className={navLinkClass(pathname === "/dashboard")}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="eyebrow border border-ink/20 px-3 py-1.5 hover:border-rust hover:text-rust transition-colors disabled:opacity-50"
              >
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={navLinkClass(pathname === "/login")}>
                Sign in
              </Link>
              <Link
                href="/register"
                className="eyebrow border border-ink/20 px-3 py-1.5 hover:border-accent hover:text-accent transition-colors"
              >
                Open account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}