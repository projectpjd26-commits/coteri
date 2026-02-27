/**
 * Shared alert/notification component for success, error, info, and warning.
 * Use for inline feedback (e.g. "Copied!", empty state, form errors).
 */

export type AlertVariant = "success" | "error" | "info" | "warning";

const variantStyles: Record<
  AlertVariant,
  { className: string; role: string; ariaLive?: "polite" | "assertive" }
> = {
  success: {
    className: "bg-green-500/15 border-green-500/40 text-green-800 dark:text-green-200",
    role: "status",
    ariaLive: "polite",
  },
  error: {
    className: "bg-red-500/15 border-red-500/40 text-red-800 dark:text-red-200",
    role: "alert",
    ariaLive: "assertive",
  },
  info: {
    className: "bg-sky-500/15 border-sky-500/40 text-sky-800 dark:text-sky-200",
    role: "status",
    ariaLive: "polite",
  },
  warning: {
    className: "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-200",
    role: "status",
    ariaLive: "polite",
  },
};

export function Alert({
  variant = "info",
  children,
  className = "",
  ...rest
}: {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const { className: variantClass, role, ariaLive } = variantStyles[variant];
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${variantClass} ${className}`}
      role={role}
      aria-live={ariaLive}
      {...rest}
    >
      {children}
    </div>
  );
}
