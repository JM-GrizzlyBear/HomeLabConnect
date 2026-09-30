import { type ReactNode, useId } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

/** Wiring a control needs so its label, hint and error are announced together. */
export interface ControlProps {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

interface FormFieldProps {
  label: string;
  /** Shown under the control when there's no error. */
  hint?: ReactNode;
  /** Inline validation message for this field only. Results go in a dialog instead. */
  error?: string;
  /** Adds "(optional)" after the label. */
  optional?: boolean;
  /** Keep the label for screen readers only. */
  hideLabel?: boolean;
  className?: string;
  children(control: ControlProps): ReactNode;
}

/** One form row: label, the control, then either its error or its hint. */
export function FormField({
  label,
  hint,
  error,
  optional = false,
  hideLabel = false,
  className,
  children,
}: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={id} className={hideLabel ? "sr-only" : "text-slate-700"}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </FieldLabel>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {error ? (
        <FieldError id={errorId} role={undefined}>
          {error}
        </FieldError>
      ) : hint ? (
        <FieldDescription id={hintId} className="text-xs">
          {hint}
        </FieldDescription>
      ) : null}
    </Field>
  );
}
