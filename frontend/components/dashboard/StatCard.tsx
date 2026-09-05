import { ReactNode } from "react";

export function StatCard({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-5 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-ink/70">
        {icon}
        {title}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}