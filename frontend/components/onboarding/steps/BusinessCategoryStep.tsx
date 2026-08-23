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
        <p className="eyebrow mb-2">Step two</p>
        <h2 className="font-display text-xl text-ink">
          What does {form.storeName || "your store"} sell?
        </h2>
        <p className="mt-1 text-sm text-ink/60">
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
              className={`border px-3 py-2.5 text-left text-sm transition-colors ${
                active
                  ? "border-accent bg-accent text-paper"
                  : "border-ink/20 text-ink hover:border-accent hover:text-accent"
              }`}
            >
              {BUSINESS_CATEGORY_LABELS[category]}
            </button>
          );
        })}
      </div>
      {errors.businessCategory && (
        <p className="text-xs text-red-700">{errors.businessCategory}</p>
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