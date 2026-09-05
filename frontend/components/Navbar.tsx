"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { authApi } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

function navLinkClass(active: boolean) {
  return `text-sm tracking-wide transition-colors ${
    active ? "text-accent" : "text-ink/60 hover:text-ink"
  }`;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, clearSession } = useAuth();
  const { store, uploadLogo, uploadingLogo, renameStore, renamingStore } = useStore();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  const handleLogoClick = () => {
    if (!store || uploadingLogo) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadLogo(file);
    } catch {
      
    } finally {
      e.target.value = "";
    }
  };

  const startEditingName = () => {
    if (!store || renamingStore) return;
    setNameDraft(store.store_name);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };

  const commitNameEdit = async () => {
    setEditingName(false);
    if (!store) return;
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === store.store_name) return;
    try {
      await renameStore(trimmed);
    } catch {
      
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingName(false);
    }
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 group">
          {store ? (
            <>
              <button
                type="button"
                onClick={handleLogoClick}
                title="Update store logo"
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-ink/20 bg-paper transition-colors hover:border-accent"
              >
                {store.logo_url ? (
                  <Image
                    src={`${API_BASE_URL}${store.logo_url}`}
                    alt={`${store.store_name} logo`}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-ink/40 hover:text-accent text-lg leading-none">
                    +
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {editingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={commitNameEdit}
                  onKeyDown={handleNameKeyDown}
                  className="font-display italic text-lg text-ink tracking-wide bg-transparent border-b border-accent focus:outline-none max-w-[200px]"
                />
              ) : (
                <button
                  type="button"
                  onClick={startEditingName}
                  title="Click to rename your store"
                  className="font-display italic text-lg text-ink tracking-wide hover:text-accent transition-colors text-left"
                >
                  {renamingStore
                    ? "Saving…"
                    : uploadingLogo
                    ? "Uploading…"
                    : store.store_name}
                </button>
              )}
            </>
          ) : (
            <Link
              href="/"
              className="font-display italic text-lg text-ink tracking-wide"
            >
              NOND
            </Link>
          )}
        </div>

        <nav className="flex items-center gap-4 sm:gap-5">
          {isLoading ? null : user ? (
            <>
              <Link
                href="/dashboard"
                className={navLinkClass(pathname === "/dashboard")}
              >
                Dashboard
              </Link>

              <Link
                href="/warehouses"
                className={navLinkClass(pathname.startsWith("/warehouses"))}
              >
                Purchase Entry
              </Link>
 <Link
                href="/sell"
                className={navLinkClass(pathname.startsWith("/sell"))}
              >
                Sell Entry
              </Link>

              

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="eyebrow border border-ink/20 px-3 py-1.5 hover:border-rust hover:text-rust transition-colors disabled:opacity-50"
              >
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>

              <Link
                href="/profile"
                title={user.username}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 border border-accent/30 font-mono text-xs text-accent hover:border-accent transition-colors"
              >
                {initials}
              </Link>
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