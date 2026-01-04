import clsx from "clsx";

export const Badge = ({ label, className }: { label: string; className?: string }) => (
  <span
    className={clsx(
      "rounded-full border border-border bg-surface-muted px-2 py-1 text-xs text-text",
      className
    )}
  >
    {label}
  </span>
);
