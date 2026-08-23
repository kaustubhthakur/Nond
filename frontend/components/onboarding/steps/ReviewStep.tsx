"use client";

import type { useOnboarding } from "@/hooks/useOnboarding";
import { BUSINESS_CATEGORY_LABELS, BUSINESS_TYPE_LABELS } from "@/types/store";

interface Props {
  onboarding: ReturnType<typeof useOnboarding>;
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-ink/40">{label}</p>
        <p className="mt-0.5 text-sm text-ink">{value || "—"}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs text-accent hover:underline"
      >
        Edit
      </button>
    </div>
  );
}

export default function ReviewStep({ onboarding }: Props) {
  const { form, goToStep } = onboarding;

  const businessTypeLabel =
    form.businessType === "other"
      ? form.businessTypeCustom
      : form.businessType
        ? BUSINESS_TYPE_LABELS[form.businessType]
        : "";

  const businessCategoryLabel =
    form.businessCategory === "other"
      ? form.businessCategoryCustom
      : form.businessCategory
        ? BUSINESS_CATEGORY_LABELS[form.businessCategory]
        : "";

  const locationLabel = [form.city, form.state, form.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Step five</p>
        <h2 className="font-display text-xl text-ink">Ready to open?</h2>
        <p className="mt-1 text-sm text-ink/60">
          Double-check the details below before your store goes live.
        </p>
      </div>

      <div className="divide-y divide-ink/10 border border-ink/20 px-4">
        <SummaryRow label="Store name" value={form.storeName} onEdit={() => goToStep(0)} />
        <SummaryRow label="Business type" value={businessTypeLabel} onEdit={() => goToStep(0)} />
        <SummaryRow label="Category" value={businessCategoryLabel} onEdit={() => goToStep(1)} />
        <SummaryRow label="Location" value={locationLabel} onEdit={() => goToStep(2)} />
        <SummaryRow
          label="Preferences"
          value={`${form.language.toUpperCase()} · ${form.currency} · ${form.timezone}`}
          onEdit={() => goToStep(3)}
        />
      </div>
    </div>
  );
}