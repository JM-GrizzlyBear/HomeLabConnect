import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { Matcher } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { controlSizes, controlSurface } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { type ControlProps, FormField } from "./FormField";

const ISO = "yyyy-MM-dd";

/** "2026-01-15" → a local Date (no timezone shift), or undefined. */
function fromIso(value: string): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, ISO, new Date());
  return isValid(date) ? date : undefined;
}

interface DatePickerProps extends Partial<ControlProps> {
  /** ISO date ("2026-01-15"), or "" for none. The shared Zod schemas expect this format. */
  value: string;
  onChange(value: string): void;
  placeholder?: string;
  size?: keyof typeof controlSizes;
  /** Earliest and latest selectable dates, as ISO strings. */
  min?: string;
  max?: string;
  /** Extra days to block, e.g. holidays when booking. */
  disabledDays?: Matcher | Matcher[];
  /** Show a "Clear" button, for optional dates. */
  clearable?: boolean;
  disabled?: boolean;
}

/** A button that opens a calendar. Month and year dropdowns make far-away dates quick to reach. */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  size = "md",
  min,
  max,
  disabledDays,
  clearable = false,
  disabled,
  ...control
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = fromIso(value);
  const minDate = min ? fromIso(min) : undefined;
  const maxDate = max ? fromIso(max) : undefined;
  const blocked: Matcher[] = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
    ...(disabledDays ? [disabledDays].flat() : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            controlSurface,
            controlSizes[size],
            "flex items-center justify-between gap-2 text-left hover:bg-brand-100/60 data-[state=open]:border-ring data-[state=open]:bg-background",
            !selected && "text-muted-foreground",
          )}
          {...control}
        >
          <span className="truncate">
            {selected ? format(selected, "MMM d, yyyy") : placeholder}
          </span>
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? maxDate ?? minDate}
          captionLayout="dropdown"
          startMonth={minDate ?? new Date(1900, 0)}
          endMonth={maxDate ?? new Date(new Date().getFullYear() + 5, 11)}
          disabled={blocked}
          onSelect={(date) => {
            onChange(date ? format(date, ISO) : "");
            setOpen(false);
          }}
        />
        {clearable && selected && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface DatePickerFieldProps extends Omit<DatePickerProps, keyof ControlProps> {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** `false` marks the field "(optional)" and allows clearing it. */
  required?: boolean;
  hideLabel?: boolean;
  className?: string;
}

/** A labelled DatePicker. */
export function DatePickerField({
  label,
  hint,
  error,
  required,
  hideLabel,
  className,
  ...picker
}: DatePickerFieldProps) {
  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      optional={required === false}
      hideLabel={hideLabel}
      className={className}
    >
      {(control) => <DatePicker clearable={required === false} {...picker} {...control} />}
    </FormField>
  );
}
