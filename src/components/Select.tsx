import { SelectHTMLAttributes } from "react";
import clsx from "clsx";

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={clsx(
      "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none",
      className
    )}
    {...props}
  />
);
