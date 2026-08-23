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
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div>
      <div className="h-px w-full bg-ink/10">
        <div
          className="h-px bg-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-3 flex items-baseline justify-between font-mono text-xs text-ink/50">
        <span>
          {String(currentIndex + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
        </span>
        <span>{steps[currentIndex].title}</span>
      </div>
    </div>
  );
}