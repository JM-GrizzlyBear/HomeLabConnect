import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { controlSizes, controlSurface } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { type ControlProps, FormField } from "./FormField";
import type { SelectOption } from "./SelectInputField";

interface ComboboxProps extends Partial<ControlProps> {
  options: readonly SelectOption[];
  /** "" for nothing selected. */
  value: string;
  onChange(value: string): void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  size?: keyof typeof controlSizes;
  disabled?: boolean;
}

/** A searchable single select, for lists too long to scroll (procedures, patients, teams). */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Choose…",
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
  size = "md",
  disabled,
  ...control
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            controlSurface,
            controlSizes[size],
            "flex items-center justify-between gap-2 text-left hover:bg-brand-100/60 data-[state=open]:border-ring data-[state=open]:bg-background",
            !selected && "text-muted-foreground",
          )}
          {...control}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label]}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  <CheckIcon
                    className={cn(
                      "ml-auto size-4",
                      option.value === value ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface ComboboxFieldProps extends Omit<ComboboxProps, keyof ControlProps> {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  hideLabel?: boolean;
  className?: string;
}

/** A labelled Combobox. */
export function ComboboxField({
  label,
  hint,
  error,
  required,
  hideLabel,
  className,
  ...combobox
}: ComboboxFieldProps) {
  return (
    <FormField
      label={label}
      hint={hint}
      error={error}
      optional={required === false}
      hideLabel={hideLabel}
      className={className}
    >
      {(control) => <Combobox {...combobox} {...control} />}
    </FormField>
  );
}
