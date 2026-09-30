import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

/**
 * The look every text-like control shares (input, textarea, select trigger,
 * input group): a soft brand fill that turns white with a brand ring on focus,
 * and rose when aria-invalid.
 */
const controlSurface =
  "w-full min-w-0 border border-transparent bg-secondary text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive/50 aria-invalid:bg-rose-50 aria-invalid:ring-destructive/20 aria-invalid:focus-visible:bg-background";

/** sm h-8, md h-10, lg h-12: the same scale as Button. */
const controlSizes = {
  sm: "h-8 rounded-lg px-2.5 text-xs",
  md: "h-10 rounded-lg px-3 text-sm",
  lg: "h-12 rounded-xl px-4 text-sm",
} as const;

const inputVariants = cva(
  cn(
    controlSurface,
    "py-1 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
  ),
  {
    variants: { size: controlSizes },
    defaultVariants: { size: "md" },
  },
);

type InputProps = Omit<React.ComponentProps<"input">, "size"> & VariantProps<typeof inputVariants>;

function Input({ className, type, size = "md", ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(inputVariants({ size }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants, controlSurface, controlSizes };
export type { InputProps };
