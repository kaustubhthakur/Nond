"use client";

import type { useOnboarding } from "@/hooks/useOnboarding";
import Field from "../Field";
import { inputClass } from "../inputClass";

interface Props {
  onboarding: ReturnType<typeof useOnboarding>;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "mr", label: "Marathi" },
  { value: "gu", label: "Gujarati" },
  { value: "ta", label: "Tamil" },
];

const CURRENCIES = [
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AED", label: "AED — UAE Dirham" },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Dhaka",
  "Europe/London",
  "America/New_York",
];

export default function PreferencesStep({ onboarding }: Props) {
  const { form, updateField } = onboarding;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--onb-ink)]">
          A few defaults
        </h2>
        <p className="mt-1 text-sm text-[var(--onb-muted)]">
          You can change any of these later from settings.
        </p>
      </div>

      <Field label="Language" htmlFor="language">
        <select
          id="language"
          className={inputClass}
          value={form.language}
          onChange={(e) => updateField("language", e.target.value)}
        >
          {LANGUAGES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Currency" htmlFor="currency">
        <select
          id="currency"
          className={inputClass}
          value={form.currency}
          onChange={(e) => updateField("currency", e.target.value)}
        >
          {CURRENCIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Timezone"
        htmlFor="timezone"
        hint="Detected automatically — adjust if this isn't right."
      >
        <select
          id="timezone"
          className={inputClass}
          value={form.timezone}
          onChange={(e) => updateField("timezone", e.target.value)}
        >
          {!TIMEZONES.includes(form.timezone) && (
            <option value={form.timezone}>{form.timezone}</option>
          )}
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}