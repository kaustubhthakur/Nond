import Link from "next/link";
import { PageShell } from "@/components/ui";

export default function Home() {
  return (
    <PageShell>
      <div className="w-full max-w-md ledger-card px-8 py-9 sm:px-10 sm:py-10 text-center">
        <p className="eyebrow mb-3">Account access</p>
        <h1 className="font-display text-[1.9rem] leading-tight text-ink mb-3">
          Every entry, verified.
        </h1>
        <p className="text-sm text-ink/60 mb-8 leading-relaxed">
          A password gets you to the door. A one-time code lets you in.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full bg-accent text-paper text-sm tracking-wide py-3 hover:bg-accent-dim transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="w-full border border-ink/20 text-ink text-sm py-3 hover:border-accent hover:text-accent transition-colors"
          >
            Open an account
          </Link>
        </div>
      </div>
    </PageShell>
  );
}