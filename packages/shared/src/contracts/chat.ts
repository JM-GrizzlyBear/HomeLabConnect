import { z } from "zod";
import { ChatConversationTypeSchema } from "./enums";
import { isoDateTime, uuid } from "./primitives";

export const ChatConversationSchema = z.object({
  id: uuid,
  type: ChatConversationTypeSchema,
  subject: z.string().nullable(),
  appointmentId: uuid.nullable(),
  lastMessageAt: isoDateTime.nullable(),
  isClosed: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type ChatConversation = z.infer<typeof ChatConversationSchema>;

export const CreateChatConversationInputSchema = z.object({
  type: ChatConversationTypeSchema,
  subject: z.string().max(200).optional().nullable(),
  appointmentId: uuid.optional().nullable(),
  participantUserIds: z.array(uuid).min(1),
});
export type CreateChatConversationInput = z.infer<
  typeof CreateChatConversationInputSchema
>;

export const ChatParticipantSchema = z.object({
  id: uuid,
  conversationId: uuid,
  userId: uuid,
  joinedAt: isoDateTime,
  lastReadAt: isoDateTime.nullable(),
});
export type ChatParticipant = z.infer<typeof ChatParticipantSchema>;

export const ChatMessageSchema = z.object({
  id: uuid,
  conversationId: uuid,
  senderUserId: uuid,
  content: z.string(),
  attachmentUrl: z.string().url().nullable(),
  attachmentType: z.string().nullable(),
  isEdited: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const SendChatMessageInputSchema = z.object({
  conversationId: uuid,
  content: z.string().min(1).max(4000),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentType: z.string().max(80).optional().nullable(),
});
export type SendChatMessageInput = z.infer<typeof SendChatMessageInputSchema>;

export const ListChatMessagesInputSchema = z.object({
  conversationId: uuid,
  before: isoDateTime.optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});
export type ListChatMessagesInput = z.infer<typeof ListChatMessagesInputSchema>;

export const MarkConversationReadInputSchema = z.object({
  conversationId: uuid,
});
export type MarkConversationReadInput = z.infer<
  typeof MarkConversationReadInputSchema
>;
