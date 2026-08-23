"use client";

import type { useOnboarding } from "@/hooks/useOnboarding";
import { BUSINESS_TYPES, BUSINESS_TYPE_LABELS } from "@/types/store";
import Field from "../Field";
import { inputClass } from "../inputClass";

interface Props {
  onboarding: ReturnType<typeof useOnboarding>;
}

export default function StoreBasicsStep({ onboarding }: Props) {
  const { form, errors, updateField } = onboarding;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Step one</p>
        <h2 className="font-display text-xl text-ink">What should we call your store?</h2>
        <p className="mt-1 text-sm text-ink/60">
          This is the name customers and your team will see.
        </p>
      </div>

      <Field label="Store name" htmlFor="storeName" error={errors.storeName}>
        <input
          id="storeName"
          className={inputClass}
          placeholder="e.g. Kaus General Store"
          value={form.storeName}
          onChange={(e) => updateField("storeName", e.target.value)}
          autoFocus
        />
      </Field>

      <div>
        <p className="text-sm text-ink">What kind of business is this?</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {BUSINESS_TYPES.map((type) => {
            const active = form.businessType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => updateField("businessType", type)}
                className={`border px-3 py-2.5 text-left text-sm transition-colors ${
                  active
                    ? "border-accent bg-accent text-paper"
                    : "border-ink/20 text-ink hover:border-accent hover:text-accent"
                }`}
              >
                {BUSINESS_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
        {errors.businessType && <p className="mt-1.5 text-xs text-red-700">{errors.businessType}</p>}
      </div>

      {form.businessType === "other" && (
        <Field
          label="Tell us what kind of business"
          htmlFor="businessTypeCustom"
          error={errors.businessTypeCustom}
        >
          <input
            id="businessTypeCustom"
            className={inputClass}
            placeholder="e.g. Repair workshop"
            value={form.businessTypeCustom}
            onChange={(e) => updateField("businessTypeCustom", e.target.value)}
          />
        </Field>
      )}
    </div>
  );
}