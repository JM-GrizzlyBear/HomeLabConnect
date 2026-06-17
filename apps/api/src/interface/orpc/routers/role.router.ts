import {
  CreateRoleInputSchema,
  ListRolesOutputSchema,
  PublicRoleSchema,
  UpdateRoleInputSchema,
} from "@homelabconnect/shared";
import { ORPCError } from "@orpc/server";
import { authedProcedure } from "../procedures/authed";

// Roles are readable by any signed-in user; mutations require admin.
const adminOnly = authedProcedure.use(async ({ context, next }) => {
  if (context.user?.role !== "admin") {
    throw new ORPCError("FORBIDDEN", { message: "Admin role required" });
  }
  return next();
});

export const roleRouter = {
  list: authedProcedure
    .output(ListRolesOutputSchema)
    .handler(({ context }) => context.usecases.listRoles.exec()),

  create: adminOnly
    .input(CreateRoleInputSchema)
    .output(PublicRoleSchema)
    .handler(({ input, context }) => context.usecases.createRole.exec(input)),

  update: adminOnly
    .input(UpdateRoleInputSchema)
    .output(PublicRoleSchema)
    .handler(({ input, context }) => context.usecases.updateRole.exec(input)),
};
