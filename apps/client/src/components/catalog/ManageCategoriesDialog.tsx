import { categoryRequestSchema, type ProcedureCategory } from "@homelabconnect/shared";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { type SubmitEvent, useState } from "react";
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
import { useFormState } from "../../forms/useFormState";

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
  // Only one row is renamed at a time.
  const [editingId, setEditingId] = useState<string | null>(null);

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
            editingId === category.id ? (
              <RenameCategoryRow
                key={category.id}
                category={category}
                onDone={() => {
                  setEditingId(null);
                  onChanged();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <CategoryRow
                key={category.id}
                category={category}
                onRename={() => setEditingId(category.id)}
                onDeleted={onChanged}
              />
            ),
          )}
          {categories.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No categories yet.
            </li>
          )}
        </ul>

        <AddCategoryForm onAdded={onChanged} />
      </DialogContent>
    </Dialog>
  );
}

function CategoryRow({
  category,
  onRename,
  onDeleted,
}: {
  category: ProcedureCategory;
  onRename(): void;
  onDeleted(): void;
}) {
  const { token } = useAuth();
  const feedback = useFeedback();

  async function remove() {
    const confirmed = await feedback.confirm({
      title: `Delete ${category.name}?`,
      description: "Only empty categories can be deleted.",
      confirmLabel: "Delete category",
      destructive: true,
    });
    if (!confirmed || !token) return;
    try {
      await deleteCategory(token, category.id);
      onDeleted();
    } catch (error) {
      feedback.error({
        title: "Couldn't delete the category",
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <li className="flex items-center gap-2 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{category.name}</p>
        <p className="text-xs text-muted-foreground">
          {category.procedureCount === 1 ? "1 procedure" : `${category.procedureCount} procedures`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Rename ${category.name}`}
        onClick={onRename}
      >
        <PencilIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${category.name}`}
        className="text-destructive hover:text-destructive"
        onClick={() => void remove()}
      >
        <Trash2Icon />
      </Button>
    </li>
  );
}

function RenameCategoryRow({
  category,
  onDone,
  onCancel,
}: {
  category: ProcedureCategory;
  onDone(): void;
  onCancel(): void;
}) {
  const { token } = useAuth();
  const { values, submitting, field, submit } = useFormState({ name: category.name });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    await submit(
      categoryRequestSchema.safeParse(values),
      async ({ name }) => {
        await renameCategory(token, category.id, name);
        onDone();
      },
      { title: "Couldn't rename the category", fieldByCode },
    );
  }

  return (
    <li className="p-3">
      <form onSubmit={handleSubmit} className="flex items-start gap-2" noValidate>
        <TextInputField
          label={`New name for ${category.name}`}
          hideLabel
          size="sm"
          autoFocus
          className="min-w-0 flex-1"
          {...field("name")}
        />
        <Button type="submit" size="sm" loading={submitting}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </form>
    </li>
  );
}

function AddCategoryForm({ onAdded }: { onAdded(): void }) {
  const { token } = useAuth();
  const { values, submitting, setValues, field, submit } = useFormState({ name: "" });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    await submit(
      categoryRequestSchema.safeParse(values),
      async ({ name }) => {
        await createCategory(token, name);
        setValues({ name: "" });
        onAdded();
      },
      { title: "Couldn't add the category", fieldByCode },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2" noValidate>
      <TextInputField
        label="New category"
        hideLabel
        placeholder="New category name"
        className="min-w-0 flex-1"
        {...field("name")}
      />
      <Button type="submit" variant="outline" loading={submitting}>
        Add category
      </Button>
    </form>
  );
}
