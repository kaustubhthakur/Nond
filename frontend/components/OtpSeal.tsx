"use client";

import {
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const LENGTH = 6;

export function OtpSeal({
  value,
  onChange,
  onComplete,
  disabled,
  stamped,
}: {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (val: string) => void;
  disabled?: boolean;
  stamped?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: LENGTH }, (_, i) => value[i] ?? "")
  );
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setDigits(Array.from({ length: LENGTH }, (_, i) => value[i] ?? ""));
  }, [value]);

  const commit = (next: string[]) => {
    setDigits(next);
    const joined = next.join("");
    onChange(joined);
    if (joined.length === LENGTH && !next.includes("")) {
      onComplete?.(joined);
    }
  };

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    commit(next);
    if (char && index < LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < LENGTH - 1)
      refs.current[index + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    const next = Array.from({ length: LENGTH }, (_, i) => pasted[i] ?? "");
    commit(next);
    const lastIndex = Math.min(pasted.length, LENGTH) - 1;
    refs.current[lastIndex]?.focus();
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          inputMode="numeric"
          maxLength={1}
          aria-label={`Digit ${i + 1} of ${LENGTH}`}
          className={`field-underline w-full text-center text-xl font-mono py-2 border !border-line focus:!border-accent ${
            stamped ? "stamp-ready text-accent border-accent" : "text-ink"
          }`}
        />
      ))}
    </div>
  );
}