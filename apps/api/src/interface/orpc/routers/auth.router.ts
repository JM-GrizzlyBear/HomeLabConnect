import {
  AuthResultSchema,
  LoginInputSchema,
  PublicUserSchema,
  RegisterInputSchema,
} from "@homelabconnect/shared";
import { ORPCError } from "@orpc/server";
import { authedProcedure } from "../procedures/authed";
import { publicProcedure } from "../procedures/public";

export const authRouter = {
  register: publicProcedure
    .input(RegisterInputSchema)
    .output(AuthResultSchema)
    .handler(async ({ input, context }) =>
      context.usecases.registerUser.exec(input),
    ),

  login: publicProcedure
    .input(LoginInputSchema)
    .output(AuthResultSchema)
    .handler(async ({ input, context }) =>
      context.usecases.loginUser.exec(input),
    ),

  me: authedProcedure.output(PublicUserSchema).handler(async ({ context }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED");
    }
    return context.usecases.getMe.exec(context.user.id);
  }),
};
