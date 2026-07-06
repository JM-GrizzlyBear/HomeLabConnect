import {
  CreatePatientProfileInputSchema,
  PatientSchema,
  UpdatePatientProfileInputSchema,
} from "@homelabconnect/shared";
import { ORPCError } from "@orpc/server";
import { authedProcedure } from "../procedures/authed";

const patientOnly = authedProcedure.use(async ({ context, next }) => {
  if (context.user?.role !== "patient") {
    throw new ORPCError("FORBIDDEN", {
      message: "Only patient users can manage patient profile",
    });
  }
  return next();
});

export const patientRouter = {
  create: patientOnly
    .input(CreatePatientProfileInputSchema)
    .output(PatientSchema)
    .handler(({ input, context }) => {
      if (!context.user) throw new ORPCError("UNAUTHORIZED");
      return context.usecases.createPatientProfile.exec(context.user.id, input);
    }),

  update: patientOnly
    .input(UpdatePatientProfileInputSchema)
    .output(PatientSchema)
    .handler(({ input, context }) => {
      if (!context.user) throw new ORPCError("UNAUTHORIZED");
      return context.usecases.updatePatientProfile.exec(context.user.id, input);
    }),
};
