"use client";

import type { useOnboarding } from "@/hooks/useOnboarding";
import Field from "../Field";
import { inputClass } from "../inputClass";

interface Props {
  onboarding: ReturnType<typeof useOnboarding>;
}

export default function LocationStep({ onboarding }: Props) {
  const { form, errors, updateField } = onboarding;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Step three</p>
        <h2 className="font-display text-xl text-ink">Where&rsquo;s the store located?</h2>
        <p className="mt-1 text-sm text-ink/60">
          Used on invoices and for customers finding you.
        </p>
      </div>

      <Field label="Street address" htmlFor="address" optional>
        <textarea
          id="address"
          className={`${inputClass} min-h-[80px] resize-none`}
          placeholder="Shop no., building, street"
          value={form.address}
          onChange={(e) => updateField("address", e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="City" htmlFor="city" error={errors.city}>
          <input
            id="city"
            className={inputClass}
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
          />
        </Field>

        <Field label="State" htmlFor="state" error={errors.state}>
          <input
            id="state"
            className={inputClass}
            value={form.state}
            onChange={(e) => updateField("state", e.target.value)}
          />
        </Field>

        <Field label="Country" htmlFor="country" error={errors.country}>
          <input
            id="country"
            className={inputClass}
            value={form.country}
            onChange={(e) => updateField("country", e.target.value)}
          />
        </Field>

        <Field label="PIN / ZIP code" htmlFor="pincode" optional>
          <input
            id="pincode"
            className={inputClass}
            value={form.pincode}
            onChange={(e) => updateField("pincode", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}