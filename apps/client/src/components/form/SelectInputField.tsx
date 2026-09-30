import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "./FormField";

export interface SelectOption {
  /** Must not be empty: Radix reserves "" for "nothing selected". */
  value: string;
  label: string;
}

interface SelectInputFieldProps {
  label: string;
  options: readonly SelectOption[];
  /** "" shows the placeholder. */
  value: string;
  onValueChange(value: string): void;
  placeholder?: string;
  name?: string;
  hint?: ReactNode;
  error?: string;
  size?: "sm" | "md" | "lg";
  hideLabel?: boolean;
  /** `false` marks the field "(optional)". */
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/** A labelled dropdown built on the styled shadcn Select. */
export function SelectInputField({
  label,
  options,
  value,
  onValueChange,
  placeholder = "Choose…",
  name,
  hint,
  error,
  size = "md",
  hideLabel,
  required,
  disabled,
  className,
}: SelectInputFieldProps) {
  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      optional={required === false}
      hideLabel={hideLabel}
      className={className}
    >
      {(control) => (
        <Select
          name={name}
          value={value === "" ? undefined : value}
          onValueChange={onValueChange}
          disabled={disabled}
        >
          <SelectTrigger size={size} {...control}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}
