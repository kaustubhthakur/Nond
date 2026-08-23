"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createStore } from "@/lib/api/store";
import type { BusinessCategory, BusinessType, CreateStorePayload } from "@/types/store";

const DRAFT_KEY = "nond_onboarding_draft";

export interface OnboardingFormState {
  storeName: string;
  businessType: BusinessType | "";
  businessTypeCustom: string;
  businessCategory: BusinessCategory | "";
  businessCategoryCustom: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  language: string;
  currency: string;
  timezone: string;
}

const INITIAL_STATE: OnboardingFormState = {
  storeName: "",
  businessType: "",
  businessTypeCustom: "",
  businessCategory: "",
  businessCategoryCustom: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  language: "en",
  currency: "INR",
  timezone: "Asia/Kolkata",
};

export const STEPS = [
  { key: "basics", title: "Store & type" },
  { key: "category", title: "Category" },
  { key: "location", title: "Location" },
  { key: "preferences", title: "Preferences" },
  { key: "review", title: "Review" },
] as const;

type FormErrors = Partial<Record<keyof OnboardingFormState, string>>;

export function useOnboarding() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<OnboardingFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore an in-progress draft so a refresh or dropped connection
  // doesn't send the user back to a blank first step.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { form: OnboardingFormState; stepIndex: number };
        setForm((prev) => ({ ...prev, ...parsed.form }));
        setStepIndex(parsed.stepIndex ?? 0);
      } else {
        // Only auto-detect on a fresh draft, not over a restored one.
        setForm((prev) => ({
          ...prev,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || prev.timezone,
        }));
      }
    } catch {
      // Malformed draft — start clean.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, stepIndex }));
  }, [form, stepIndex, hydrated]);

  const updateField = useCallback(
    <K extends keyof OnboardingFormState>(key: K, value: OnboardingFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    []
  );

  const validateStep = useCallback(
    (index: number): boolean => {
      const nextErrors: FormErrors = {};

      if (index === 0) {
        if (!form.storeName.trim()) nextErrors.storeName = "Give your store a name.";
        if (!form.businessType) nextErrors.businessType = "Choose what best fits your business.";
        if (form.businessType === "other" && !form.businessTypeCustom.trim()) {
          nextErrors.businessTypeCustom = "Tell us what kind of business this is.";
        }
      }

      if (index === 1) {
        if (!form.businessCategory) nextErrors.businessCategory = "Pick a category.";
        if (form.businessCategory === "other" && !form.businessCategoryCustom.trim()) {
          nextErrors.businessCategoryCustom = "Tell us which category this is.";
        }
      }

      if (index === 2) {
        if (!form.city.trim()) nextErrors.city = "City is required.";
        if (!form.state.trim()) nextErrors.state = "State is required.";
        if (!form.country.trim()) nextErrors.country = "Country is required.";
      }

      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    },
    [form]
  );

  const goNext = useCallback(() => {
    if (!validateStep(stepIndex)) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, [stepIndex, validateStep]);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToStep = useCallback(
    (index: number) => {
      // Only allow jumping to steps already completed, from the review step.
      if (index <= stepIndex) setStepIndex(index);
    },
    [stepIndex]
  );

  const submit = useCallback(async () => {
    const stepsValid = [0, 1, 2].every((i) => validateStep(i));
    if (!stepsValid) {
      setStepIndex(0);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const payload: CreateStorePayload = {
      storeName: form.storeName.trim(),
      businessType: form.businessType as BusinessType,
      businessTypeCustom: form.businessType === "other" ? form.businessTypeCustom.trim() : null,
      businessCategory: form.businessCategory as BusinessCategory,
      businessCategoryCustom:
        form.businessCategory === "other" ? form.businessCategoryCustom.trim() : null,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      pincode: form.pincode.trim(),
      language: form.language,
      currency: form.currency,
      timezone: form.timezone,
    };

    try {
      await createStore(payload);
      window.localStorage.removeItem(DRAFT_KEY);
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't create your store.");
    } finally {
      setSubmitting(false);
    }
  }, [form, router, validateStep]);

  const progress = useMemo(() => (stepIndex + 1) / STEPS.length, [stepIndex]);

  return {
    steps: STEPS,
    stepIndex,
    form,
    errors,
    submitting,
    submitError,
    progress,
    updateField,
    goNext,
    goBack,
    goToStep,
    submit,
  };
}