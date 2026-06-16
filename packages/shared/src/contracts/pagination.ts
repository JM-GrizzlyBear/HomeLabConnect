import { z } from "zod";
import { uuid } from "./primitives";

export const IdInputSchema = z.object({ id: uuid });
export type IdInput = z.infer<typeof IdInputSchema>;

export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
