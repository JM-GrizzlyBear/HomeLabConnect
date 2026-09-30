import { categoryRequestSchema, type ProcedureCategory } from "@homelabconnect/shared";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { TextInputField } from "@/components/form/TextInputField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "../../api/apiClient";
import { createCategory, deleteCategory, renameCategory } from "../../api/catalog";
import { useAuth } from "../../auth/authContext";
import { useFeedback } from "../../feedback/feedbackContext";
import { toFieldErrors } from "../../forms/fieldErrors";
import { handleSubmitError } from "../../forms/submitErrors";

interface ManageCategoriesDialogProps {
  open: boolean;
  categories: readonly ProcedureCategory[];
  onClose(): void;
  /** Called after any change, so the page can reload its categories. */
  onChanged(): void;
}

const fieldByCode = { category_name_taken: "name" };

/** Add, rename and delete procedure categories. Categories in use can't be deleted. */
export function ManageCategoriesDialog({
  open,
  categories,
  onClose,
  onChanged,
}: ManageCategoriesDialogProps) {
  const { token } = useAuth();
  const feedback = useFeedback();
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | undefined>();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [renameError, setRenameError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = categoryRequestSchema.safeParse({ name: newName });
    if (!parsed.success) {
      setAddError(toFieldErrors(parsed.error.issues).name);
      return;
    }
    if (!token) return;
    setAdding(true);
    try {
      await createCategory(token, parsed.data.name);
      setNewName("");
      setAddError(undefined);
      onChanged();
    } catch (error) {
      handleSubmitError(error, {
        title: "Couldn't add the category",
        feedback,
        setFieldErrors: (errors) => setAddError(errors.name),
        fieldByCode,
      });
    } finally {
      setAdding(false);
    }
  }

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !token) return;
    const parsed = categoryRequestSchema.safeParse({ name: editing.name });
    if (!parsed.success) {
      setRenameError(toFieldErrors(parsed.error.issues).name);
      return;
    }
    setSaving(true);
    try {
      await renameCategory(token, editing.id, parsed.data.name);
      setEditing(null);
      setRenameError(undefined);
      onChanged();
    } catch (error) {
      handleSubmitError(error, {
        title: "Couldn't rename the category",
        feedback,
        setFieldErrors: (errors) => setRenameError(errors.name),
        fieldByCode,
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove(category: ProcedureCategory) {
    const confirmed = await feedback.confirm({
      title: `Delete ${category.name}?`,
      description: "Only empty categories can be deleted.",
      confirmLabel: "Delete category",
      destructive: true,
    });
    if (!confirmed || !token) return;
    try {
      await deleteCategory(token, category.id);
      onChanged();
    } catch (error) {
      feedback.error({
        title: "Couldn't delete the category",
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    }
  }

  function startEditing(category: ProcedureCategory) {
    setEditing({ id: category.id, name: category.name });
    setRenameError(undefined);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
          <DialogDescription>
            Procedures are grouped by category. A category can only be deleted once it's empty.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-80 divide-y overflow-y-auto rounded-lg border">
          {categories.map((category) =>
            editing?.id === category.id ? (
              <li key={category.id} className="p-3">
                <form onSubmit={rename} className="flex items-start gap-2" noValidate>
                  <TextInputField
                    label={`New name for ${category.name}`}
                    hideLabel
                    size="sm"
                    autoFocus
                    value={editing.name}
                    onChange={(e) => setEditing({ id: category.id, name: e.target.value })}
                    error={renameError}
                    className="min-w-0 flex-1"
                  />
                  <Button type="submit" size="sm" loading={saving}>
                    Save
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </form>
              </li>
            ) : (
              <li key={category.id} className="flex items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {category.procedureCount === 1
                      ? "1 procedure"
                      : `${category.procedureCount} procedures`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Rename ${category.name}`}
                  onClick={() => startEditing(category)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${category.name}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => void remove(category)}
                >
                  <Trash2Icon />
                </Button>
              </li>
            ),
          )}
          {categories.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No categories yet.
            </li>
          )}
        </ul>

        <form onSubmit={add} className="flex items-start gap-2" noValidate>
          <TextInputField
            label="New category"
            hideLabel
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            error={addError}
            className="min-w-0 flex-1"
          />
          <Button type="submit" variant="outline" loading={adding}>
            Add category
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
