import type { ReactNode } from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { FormField } from "./FormField";

interface TextInputFieldProps extends Omit<InputProps, "id"> {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** Leading icon inside the input. */
  icon?: ReactNode;
  hideLabel?: boolean;
}

/**
 * A labelled text input. `required={false}` marks it "(optional)", matching
 * the forms' convention that fields are required unless said otherwise.
 */
export function TextInputField({
  label,
  hint,
  error,
  icon,
  hideLabel,
  className,
  size = "md",
  ...input
}: TextInputFieldProps) {
  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      optional={input.required === false}
      hideLabel={hideLabel}
      className={className}
    >
      {(control) =>
        icon ? (
          <InputGroup size={size}>
            <InputGroupAddon className="text-slate-700 [&>svg:not([class*='size-'])]:size-5">
              {icon}
            </InputGroupAddon>
            <InputGroupInput {...input} {...control} />
          </InputGroup>
        ) : (
          <Input size={size} {...input} {...control} />
        )
      }
    </FormField>
  );
}
