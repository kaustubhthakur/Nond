"use client";

import type { useOnboarding } from "@/hooks/useOnboarding";
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABELS } from "@/types/store";
import Field from "../Field";
import { inputClass } from "../inputClass";

interface Props {
  onboarding: ReturnType<typeof useOnboarding>;
}

export default function BusinessCategoryStep({ onboarding }: Props) {
  const { form, errors, updateField } = onboarding;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--onb-ink)]">
          What does {form.storeName || "your store"} sell?
        </h2>
        <p className="mt-1 text-sm text-[var(--onb-muted)]">
          Pick the closest match — you can refine this later.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BUSINESS_CATEGORIES.map((category) => {
          const active = form.businessCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => updateField("businessCategory", category)}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "border-[var(--onb-primary)] bg-[var(--onb-primary-soft)] text-[var(--onb-primary-ink)]"
                  : "border-[var(--onb-border)] text-[var(--onb-ink)] hover:border-[var(--onb-primary)]"
              }`}
            >
              {BUSINESS_CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>
      {errors.businessCategory && (
        <p className="text-xs text-red-600">{errors.businessCategory}</p>
      )}

      {form.businessCategory === "other" && (
        <Field
          label="Tell us which category this is"
          htmlFor="businessCategoryCustom"
          error={errors.businessCategoryCustom}
        >
          <input
            id="businessCategoryCustom"
            className={inputClass}
            placeholder="e.g. Stationery"
            value={form.businessCategoryCustom}
            onChange={(e) => updateField("businessCategoryCustom", e.target.value)}
          />
        </Field>
      )}
    </div>
  );
}