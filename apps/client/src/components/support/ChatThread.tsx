import type { TicketMessage } from "@homelabconnect/shared";
import { format, parseISO } from "date-fns";
import { FileTextIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** The ticket's messages, oldest first: yours on the right, the other side on the left. */
export function ChatThread({ messages, userId }: { messages: TicketMessage[]; userId: string }) {
  const end = useRef<HTMLLIElement>(null);
  const count = messages.length;
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "nearest" });
  }, [count]);

  return (
    <ol className="grid max-h-[32rem] gap-3 overflow-y-auto pr-1" aria-label="Messages">
      {messages.map((message) => {
        const mine = message.author.id === userId;
        return (
          <li key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                mine ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-900",
              )}
            >
              <p className={cn("text-xs", mine ? "text-white/80" : "text-muted-foreground")}>
                <span className="font-medium">{mine ? "You" : message.author.name}</span>
                {!message.fromPatient && !mine && " · Support"} ·{" "}
                {format(parseISO(message.createdAt), "MMM d, h:mm a")}
              </p>
              {message.body && <p className="mt-1 whitespace-pre-line">{message.body}</p>}
              {message.attachment && (
                <a
                  href={message.attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "mt-2 flex items-center gap-2 underline-offset-2 hover:underline",
                    mine ? "text-white" : "text-brand-700",
                  )}
                >
                  {message.attachment.mimeType === "application/pdf" ? (
                    <FileTextIcon className="size-4 shrink-0" />
                  ) : (
                    <img
                      src={message.attachment.url}
                      alt=""
                      className="size-12 shrink-0 rounded object-cover"
                    />
                  )}
                  <span className="truncate">{message.attachment.filename}</span>
                </a>
              )}
            </div>
          </li>
        );
      })}
      <li ref={end} aria-hidden className="h-px" />
    </ol>
  );
}
