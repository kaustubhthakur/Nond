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
        <p className="font-mono text-sm text-ink/50">Checking your account…</p>
      </div>
    );
  }

  const isLastStep = stepIndex === steps.length - 1;

  return (
    <main className="flex min-h-screen justify-center px-6 py-10 sm:py-16">
      <div className="w-full max-w-xl">
        <header className="mb-10 text-center">
          <p className="eyebrow mb-3">Set up your shop</p>
          <h1 className="font-display text-[1.9rem] leading-tight text-ink">
            Let&rsquo;s open your storefront.
          </h1>
        </header>

        <StepIndicator steps={steps} currentIndex={stepIndex} />

        <div className="ledger-card mt-8 px-8 py-9 sm:px-10 sm:py-10">
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
            className="text-sm text-ink/50 transition-colors hover:text-accent disabled:opacity-0"
          >
            Back
          </button>

          {!isLastStep ? (
            <button
              type="button"
              onClick={goNext}
              className="bg-accent px-6 py-3 text-sm tracking-wide text-paper transition-colors hover:bg-accent-dim"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="bg-accent px-6 py-3 text-sm tracking-wide text-paper transition-colors hover:bg-accent-dim disabled:opacity-60"
            >
              {submitting ? "Opening your store…" : "Create my store"}
            </button>
          )}
        </div>

        {submitError && <p className="mt-4 text-center text-sm text-red-700">{submitError}</p>}
      </div>
    </main>
  );
}