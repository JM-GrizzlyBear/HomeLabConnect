import { type InputHTMLAttributes, type ReactNode, useId } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  /** Leading icon shown inside the input. */
  icon?: ReactNode;
  /** Keep the label for screen readers only; the placeholder shows it visually. */
  hideLabel?: boolean;
}

export function TextField({
  label,
  error,
  hint,
  icon,
  hideLabel = false,
  className = "",
  ...input
}: TextFieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-slate-700"}
      >
        {label}
        {input.required === false && (
          <span className="font-normal text-slate-400"> (optional)</span>
        )}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-700 [&>svg]:size-5">
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`block w-full rounded-xl py-3 pr-4 text-sm text-slate-900 ring-1 transition outline-none placeholder:text-slate-500 focus:bg-white focus:ring-2 ${
            icon ? "pl-12" : "pl-4"
          } ${
            error
              ? "bg-rose-50 ring-rose-300 focus:ring-rose-400"
              : "bg-brand-50 ring-transparent focus:ring-brand-500"
          }`}
          {...input}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
