import { useId } from "react";
import { FieldError } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
  /** A short line under the label. */
  hint?: string;
}

interface RadioGroupFieldProps {
  label: string;
  options: readonly RadioOption[];
  value: string;
  onValueChange(value: string): void;
  error?: string;
  /** Side by side instead of stacked. */
  inline?: boolean;
  disabled?: boolean;
  className?: string;
}

/** A labelled set of radio buttons, for choosing one of a few options. */
export function RadioGroupField({
  label,
  options,
  value,
  onValueChange,
  error,
  inline = false,
  disabled,
  className,
}: RadioGroupFieldProps) {
  const id = useId();
  return (
    <fieldset className={cn("grid gap-2", className)}>
      <legend className="mb-2 text-sm font-medium text-slate-700">{label}</legend>
      <RadioGroup
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        className={cn(inline ? "flex flex-wrap gap-x-6 gap-y-2" : "grid gap-2")}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-start gap-2">
            <RadioGroupItem value={option.value} id={`${id}-${option.value}`} className="mt-0.5" />
            <Label htmlFor={`${id}-${option.value}`} className="grid gap-0.5 font-normal">
              <span className="text-sm text-slate-800">{option.label}</span>
              {option.hint && <span className="text-xs text-muted-foreground">{option.hint}</span>}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {error && <FieldError role={undefined}>{error}</FieldError>}
    </fieldset>
  );
}
