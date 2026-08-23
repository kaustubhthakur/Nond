"use client";

interface Step {
  key: string;
  title: string;
}

interface StepIndicatorProps {
  steps: readonly Step[];
  currentIndex: number;
}

export default function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <div>
      {/* Awning rail — one stripe per step, filled as the shop gets set up. */}
      <div className="flex h-2 gap-1">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className="h-full flex-1 rounded-full transition-colors duration-500"
            style={{
              backgroundColor: index <= currentIndex ? "var(--onb-accent)" : "var(--onb-border)",
            }}
          />
        ))}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--onb-muted)]">
          Step {String(currentIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--onb-muted)]">
          {steps[currentIndex].title}
        </span>
      </div>
    </div>
  );
}