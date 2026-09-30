import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { controlSurface } from "@/components/ui/input";

const textareaVariants = cva(cn(controlSurface, "flex field-sizing-content"), {
  variants: {
    size: {
      sm: "min-h-16 rounded-lg px-2.5 py-1.5 text-xs",
      md: "min-h-20 rounded-lg px-3 py-2 text-sm",
      lg: "min-h-28 rounded-xl px-4 py-3 text-sm",
    },
  },
  defaultVariants: { size: "md" },
});

type TextareaProps = React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>;

function Textarea({ className, size = "md", ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      className={cn(textareaVariants({ size }), className)}
      {...props}
    />
  );
}

export { Textarea, textareaVariants };
export type { TextareaProps };
