import { PROFILE_PHOTO_LIMITS, type SessionUser } from "@homelabconnect/shared";
import { CameraIcon, Trash2Icon } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ApiError } from "../../api/apiClient";
import { removeProfilePhoto, uploadProfilePhoto } from "../../api/profile";
import { useFeedback } from "../../feedback/feedbackContext";

interface ProfilePhotoCardProps {
  user: SessionUser;
  onChanged(photoUrl: string | null): void;
}

/** Shows the user's photo, with buttons to change or remove it. */
export function ProfilePhotoCard({ user, onChanged }: ProfilePhotoCardProps) {
  const feedback = useFeedback();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<string | null>, success: string, failure: string) {
    setBusy(true);
    try {
      onChanged(await action());
      feedback.success({ title: success });
    } catch (error) {
      feedback.error({
        title: failure,
        description:
          error instanceof ApiError ? error.message : "Could not reach the server. Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const photo = event.target.files?.[0];
    event.target.value = ""; // picking the same file again still fires a change
    if (!photo) return;
    if (!(PROFILE_PHOTO_LIMITS.types as readonly string[]).includes(photo.type)) {
      feedback.error({ title: "Choose a JPG, PNG or WebP photo" });
      return;
    }
    if (photo.size > PROFILE_PHOTO_LIMITS.maxBytes) {
      feedback.error({ title: "The photo must be 2 MB or smaller" });
      return;
    }
    await run(
      async () => (await uploadProfilePhoto(photo)).photoUrl,
      "Photo updated",
      "Couldn't save the photo",
    );
  }

  async function remove() {
    const confirmed = await feedback.confirm({
      title: "Remove your photo?",
      description: "Your initials will show instead.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!confirmed) return;
    await run(
      async () => (await removeProfilePhoto()).photoUrl,
      "Photo removed",
      "Couldn't remove the photo",
    );
  }

  return (
    <div className="flex items-center gap-5">
      <Avatar className="size-20">
        {user.photoUrl && <AvatarImage src={user.photoUrl} alt="Your profile photo" />}
        <AvatarFallback className="bg-brand-50 text-2xl font-semibold text-brand-700">
          {`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-wrap gap-2">
        <input
          ref={input}
          type="file"
          accept={PROFILE_PHOTO_LIMITS.types.join(",")}
          className="hidden"
          aria-label="Profile photo file"
          onChange={pick}
        />
        <Button size="sm" loading={busy} onClick={() => input.current?.click()}>
          <CameraIcon />
          {user.photoUrl ? "Change photo" : "Add photo"}
        </Button>
        {user.photoUrl && (
          <Button size="sm" variant="outline" disabled={busy} onClick={remove}>
            <Trash2Icon />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
