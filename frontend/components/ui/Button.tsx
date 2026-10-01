import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "quiet" | "outline"; children: ReactNode };

export function Button({ variant = "outline", className = "", ...props }: Props) {
  return <button className={`button button-${variant} ${className}`} {...props} />;
}
