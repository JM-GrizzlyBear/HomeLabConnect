import {
  type PermissionEffect,
  type PermissionEntry,
  type PermissionKey,
  permissionModules,
} from "@homelabconnect/shared";
import { SearchIcon } from "lucide-react";
import { useId, useState } from "react";
import { TextInputField } from "@/components/form/TextInputField";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { permissionState } from "../../access/rolePermissions";

type Choice = "inherit" | PermissionEffect;

const choices: { value: Choice; label: string }[] = [
  { value: "inherit", label: "Inherit" },
  { value: "grant", label: "Allow" },
  { value: "deny", label: "Deny" },
];

interface PermissionMatrixProps {
  /** What the base role grants. */
  baseGrants: readonly string[];
  entries: readonly PermissionEntry[];
  /** Leave out for a read-only view. */
  onChange?(entries: PermissionEntry[]): void;
}

/**
 * Every permission grouped by module, showing what the base role gives and
 * what the custom role changes. Editable rows pick Inherit / Allow / Deny.
 */
export function PermissionMatrix({ baseGrants, entries, onChange }: PermissionMatrixProps) {
  const [filter, setFilter] = useState("");
  const needle = filter.trim().toLowerCase();

  const modules = permissionModules
    .map((module) => ({
      ...module,
      permissions: module.permissions.filter(
        (permission) =>
          !needle ||
          permission.label.toLowerCase().includes(needle) ||
          permission.key.includes(needle) ||
          module.name.toLowerCase().includes(needle),
      ),
    }))
    .filter((module) => module.permissions.length > 0);

  function choose(key: PermissionKey, choice: Choice) {
    if (!onChange) return;
    const others = entries.filter((entry) => entry.key !== key);
    onChange(choice === "inherit" ? others : [...others, { key, effect: choice }]);
  }

  return (
    <div className="grid gap-4">
      <TextInputField
        label="Filter permissions"
        hideLabel
        type="search"
        size="sm"
        icon={<SearchIcon />}
        placeholder="Filter by name or key, e.g. payments"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      {modules.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">No permissions match.</p>
      )}
      {modules.map((module) => {
        const allowed = module.permissions.filter(
          (permission) => permissionState(permission.key, baseGrants, entries).allowed,
        ).length;
        return (
          <section key={module.id} aria-labelledby={`module-${module.id}`}>
            <header className="mb-1 flex items-baseline justify-between gap-2 border-b pb-1.5">
              <h3 id={`module-${module.id}`} className="text-sm font-semibold text-slate-800">
                {module.name}
              </h3>
              <span className="text-xs text-muted-foreground">
                {allowed} of {module.permissions.length} allowed
              </span>
            </header>
            <ul className="divide-y divide-slate-100">
              {module.permissions.map((permission) => (
                <PermissionRow
                  key={permission.key}
                  permissionKey={permission.key}
                  label={permission.label}
                  state={permissionState(permission.key, baseGrants, entries)}
                  onChoose={onChange ? (choice) => choose(permission.key, choice) : undefined}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function PermissionRow({
  permissionKey,
  label,
  state,
  onChoose,
}: {
  permissionKey: PermissionKey;
  label: string;
  state: ReturnType<typeof permissionState>;
  onChoose?(choice: Choice): void;
}) {
  const id = useId();
  const changed = state.effect !== null;

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-slate-800">{label}</p>
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <code className="font-mono">{permissionKey}</code>
          <span>· base role: {state.inherited ? "allowed" : "not allowed"}</span>
        </p>
      </div>
      {onChoose ? (
        <RadioGroup
          aria-label={label}
          value={state.effect ?? "inherit"}
          onValueChange={(value) => onChoose(value as Choice)}
          className="flex gap-4"
        >
          {choices.map((choice) => (
            <div key={choice.value} className="flex items-center gap-1.5">
              <RadioGroupItem value={choice.value} id={`${id}-${choice.value}`} />
              <Label htmlFor={`${id}-${choice.value}`} className="text-xs font-normal">
                {choice.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      ) : (
        <Badge
          variant={state.allowed ? "success" : "muted"}
          className={cn(changed && "ring-1 ring-current/30")}
        >
          {state.allowed ? "Allowed" : "Not allowed"}
          {changed && " (changed)"}
        </Badge>
      )}
    </li>
  );
}
