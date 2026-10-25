import type { AppointmentNoteView } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { FileTextIcon, PaperclipIcon, Trash2Icon } from "lucide-react";
import { type SubmitEvent, useRef, useState } from "react";
import { FormField } from "@/components/form/FormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "../../api/apiClient";
import { addNote, deleteAttachment, fetchNotes } from "../../api/appointments";
import { useAuth } from "../../auth/authContext";
import { useCan } from "../../auth/useCan";
import { useFeedback } from "../../feedback/feedbackContext";
import { queryKeys } from "../../queries/queryKeys";
import { useApiQuery } from "../../queries/useApiQuery";
import { ContentCard } from "../layout/ContentCard";

const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Notes and files on an appointment. Staff and the visit's team see them all and can add more;
 * the patient sees only those shared with them.
 */
export function NotesCard({
  appointmentId,
  isPatient,
}: {
  appointmentId: string;
  isPatient: boolean;
}) {
  const can = useCan();
  const {
    data: notes,
    error,
    reload,
  } = useApiQuery(
    queryKeys.notes(appointmentId),
    async (signal) => await fetchNotes(appointmentId, signal),
    { errorMessage: "Could not load the notes." },
  );
  const canWrite = !isPatient && can("notes.create");

  return (
    <ContentCard
      title={isPatient ? "Notes from our team" : "Notes & files"}
      className="lg:col-span-5"
    >
      {canWrite && <AddNoteForm appointmentId={appointmentId} onAdded={reload} />}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !notes ? (
        <Skeleton className="h-16" aria-label="Loading notes" />
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="divide-y" aria-label="Notes">
          {notes.map((note) => (
            <NoteItem key={note.id} appointmentId={appointmentId} note={note} onChanged={reload} />
          ))}
        </ul>
      )}
    </ContentCard>
  );
}

function NoteItem({
  appointmentId,
  note,
  onChanged,
}: {
  appointmentId: string;
  note: AppointmentNoteView;
  onChanged(): void;
}) {
  const { user } = useAuth();
  const feedback = useFeedback();

  async function remove(attachmentId: string, filename: string) {
    const confirmed = await feedback.confirm({
      title: `Remove ${filename}?`,
      description: "The file is deleted for everyone.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await deleteAttachment(appointmentId, attachmentId);
      feedback.success({ title: "File removed" });
      onChanged();
    } catch (failure) {
      feedback.error({
        title: "Couldn't remove the file",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <li className="py-3 text-sm">
      <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-slate-800">{note.author.name}</span>
        <span>{format(parseISO(note.createdAt), "MMM d, yyyy h:mm a")}</span>
        {note.sharedWithPatient && <Badge variant="secondary">Shared with patient</Badge>}
      </p>
      {note.body && <p className="mt-1 whitespace-pre-line">{note.body}</p>}
      {note.attachments.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-3">
          {note.attachments.map((file) => (
            <li key={file.id} className="flex items-center gap-1.5">
              <a
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-brand-700 hover:underline"
              >
                {file.mimeType === "application/pdf" ? (
                  <FileTextIcon className="size-4" />
                ) : (
                  <img src={file.url} alt="" className="size-10 rounded object-cover" />
                )}
                {file.filename}
              </a>
              {(file.uploadedBy.id === user?.id || user?.role === "admin") && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Remove ${file.filename}`}
                  onClick={() => void remove(file.id, file.filename)}
                >
                  <Trash2Icon />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function AddNoteForm({ appointmentId, onAdded }: { appointmentId: string; onAdded(): void }) {
  const can = useCan();
  const feedback = useFeedback();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState({
    body: "",
    shared: false,
    file: null as File | null,
    saving: false,
  });

  function pick(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.split(",").includes(file.type)) {
      feedback.error({ title: "Attach a JPG, PNG, WebP photo or a PDF" });
      return;
    }
    if (file.size > MAX_BYTES) {
      feedback.error({ title: "Files must be 5 MB or smaller" });
      return;
    }
    setState((current) => ({ ...current, file }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state.body.trim() && !state.file) {
      feedback.error({ title: "Write a note or attach a file" });
      return;
    }
    setState((current) => ({ ...current, saving: true }));
    try {
      await addNote(appointmentId, {
        body: state.body,
        sharedWithPatient: state.shared,
        file: state.file,
      });
      feedback.success({ title: "Note added" });
      setState({ body: "", shared: false, file: null, saving: false });
      onAdded();
    } catch (failure) {
      setState((current) => ({ ...current, saving: false }));
      feedback.error({
        title: "Couldn't add the note",
        description:
          failure instanceof ApiError ? failure.message : "Could not reach the server. Try again.",
      });
    }
  }

  return (
    <form className="mb-4 grid gap-3 border-b pb-4" onSubmit={handleSubmit} noValidate>
      <FormField label="New note">
        {(control) => (
          <Textarea
            {...control}
            rows={2}
            placeholder="e.g. Call before arriving; gate code 1234."
            value={state.body}
            onChange={(event) => setState((current) => ({ ...current, body: event.target.value }))}
          />
        )}
      </FormField>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={state.shared}
            onCheckedChange={(shared) => setState((current) => ({ ...current, shared }))}
          />
          Share with patient
        </label>
        {can("notes.attach") && (
          <>
            <input
              ref={input}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              aria-label="Attach a file"
              onChange={(event) => {
                pick(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => input.current?.click()}
            >
              <PaperclipIcon />
              {state.file ? state.file.name : "Attach photo or PDF"}
            </Button>
          </>
        )}
        <Button type="submit" size="sm" loading={state.saving} className="ml-auto">
          Add note
        </Button>
      </div>
    </form>
  );
}
