"use client";

import { useOnboarding } from "@/hooks/useOnboarding";
import { useOnboardingGuard } from "@/hooks/useOnboardingGuard";
import StepIndicator from "./StepIndicator";
import StoreBasicsStep from "./steps/StoreBasicsStep";
import BusinessCategoryStep from "./steps/BusinessCategoryStep";
import LocationStep from "./steps/LocationStep";
import PreferencesStep from "./steps/PreferencesStep";
import ReviewStep from "./steps/ReviewStep";

export default function OnboardingWizard() {
  const { checking } = useOnboardingGuard("require-no-store");
  const onboarding = useOnboarding();
  const { stepIndex, steps, goNext, goBack, submitting, submit, submitError } = onboarding;

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--onb-muted)]">
          Checking your account…
        </p>
      </div>
    );
  }

  const isLastStep = stepIndex === steps.length - 1;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10 sm:py-16">
      <header className="mb-10">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--onb-muted)]">
          Set up your shop
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl italic text-[var(--onb-ink)] sm:text-4xl">
          Let&rsquo;s open your storefront.
        </h1>
      </header>

      <StepIndicator steps={steps} currentIndex={stepIndex} />

      <div className="mt-8 flex-1 rounded-2xl border border-[var(--onb-border)] bg-[var(--onb-surface)] p-6 shadow-sm sm:p-8">
        {stepIndex === 0 && <StoreBasicsStep onboarding={onboarding} />}
        {stepIndex === 1 && <BusinessCategoryStep onboarding={onboarding} />}
        {stepIndex === 2 && <LocationStep onboarding={onboarding} />}
        {stepIndex === 3 && <PreferencesStep onboarding={onboarding} />}
        {stepIndex === 4 && <ReviewStep onboarding={onboarding} />}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0 || submitting}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-[var(--onb-muted)] transition hover:text-[var(--onb-ink)] disabled:opacity-0"
        >
          Back
        </button>

        {!isLastStep ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-[var(--onb-primary)] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--onb-primary-ink)]"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-full bg-[var(--onb-accent)] px-6 py-2.5 text-sm font-medium text-white transition hover:brightness-95 disabled:opacity-60"
          >
            {submitting ? "Opening your store…" : "Create my store"}
          </button>
        )}
      </div>

      {submitError && <p className="mt-4 text-center text-sm text-red-600">{submitError}</p>}
    </div>
  );
}