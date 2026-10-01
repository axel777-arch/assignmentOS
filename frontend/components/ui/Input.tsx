import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };

export function Input({ label, error, id, className = "", ...props }: Props) {
  return <label className="field" htmlFor={id}>{label && <span className="field-label">{label}</span>}<input id={id} className={`text-input ${className}`} aria-invalid={Boolean(error)} {...props} />{error && <span className="field-error">{error}</span>}</label>;
}
