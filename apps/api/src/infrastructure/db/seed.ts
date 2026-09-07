import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as schema from "./schema/index.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../../.env") });

import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  admins,
  appointmentAssignments,
  appointmentEvents,
  appointmentProcedures,
  appointments,
  auditLogs,
  chatConversations,
  chatMessages,
  chatParticipants,
  doctors,
  labProcedures,
  medTeamMembers,
  medTeamShifts,
  medTeamShiftOverrides,
  notifications,
  permissions,
  patients,
  rescheduleProposals,
  roles,
  rolePermissions,
  sessions,
  supportAgents,
  supportShiftOverrides,
  supportShifts,
  userPermissionOverrides,
  users,
} from "./schema/index.js";
import { SEED_PATIENTS } from "./seeds/patient.seeds.js";
import { SEED_ROLES } from "./seeds/role.seeds.js";
import { SEED_USERS } from "./seeds/user.seeds.js";
import { SEED_MED_TEAM_MEMBERS } from "./seeds/med-team-member.seeds.js";
import { SEED_MED_TEAM_SHIFTS } from "./seeds/med-team-shift.seeds.js";
import {
  SEED_ADMINS,
  SEED_APPOINTMENTS,
  SEED_CHAT_CONVERSATIONS,
  SEED_DOCTORS,
  SEED_LAB_PROCEDURES,
  SEED_MED_TEAM_OVERRIDES,
  SEED_PERMISSIONS,
  SEED_RESCHEDULE_PROPOSALS,
  SEED_ROLE_PERMISSIONS,
  SEED_SUPPORT_AGENTS,
  SEED_SUPPORT_OVERRIDES,
  SEED_SUPPORT_SHIFTS,
} from "./seeds/additional.seeds.js";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seeding roles 🃏…");
  await db
    .insert(roles)
    .values(
      SEED_ROLES.map((r) => ({ role: r.role, description: r.description })),
    )
    .onConflictDoUpdate({
      target: roles.role,
      set: {
        description: sql`excluded.description`,
        updatedAt: new Date(),
      },
    });

  console.log("Seeding users 👥…");
  await db
    .insert(users)
    .values(
      SEED_USERS.map((u) => ({
        email: u.email,
        passwordHash: bcrypt.hashSync(u.password, 10),
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        middleName: u.middleName,
        phone: u.phone,
        avatar: u.avatar,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
      })),
    )
    .onConflictDoNothing({ target: users.email });

  console.log("Seeding med team members 🧑‍⚕️…");
  for (const m of SEED_MED_TEAM_MEMBERS) {
    const u = await db.query.users.findFirst({
      where: eq(users.email, m.userEmail),
    });

    if (!u) {
      console.warn(
        "Skipping med team member seed, user not found:",
        m.userEmail,
      );
      continue;
    }

    if (u.role !== "med_team") {
      console.warn(
        "Skipping med team member seed, user is not med_team role:",
        m.userEmail,
      );
      continue;
    }

    await db
      .insert(medTeamMembers)
      .values({
        userId: u.id,
        licenseNumber: m.licenseNumber,
        specialization: m.specialization,
        serviceAreaCity: m.serviceAreaCity,
        isAvailable: m.isAvailable,
        rating: m.rating,
      })
      .onConflictDoNothing({ target: medTeamMembers.userId });
  }

  console.log("Seeding med team shifts 📅…");
  for (const s of SEED_MED_TEAM_SHIFTS) {
    const u = await db.query.users.findFirst({
      where: eq(users.email, s.memberUserEmail),
    });

    if (!u) {
      console.warn(
        "Skipping med team shift seed, user not found:",
        s.memberUserEmail,
      );
      continue;
    }

    const member = await db.query.medTeamMembers.findFirst({
      where: eq(medTeamMembers.userId, u.id),
    });

    if (!member) {
      console.warn(
        "Skipping med team shift seed, med team member profile not found for:",
        s.memberUserEmail,
      );
      continue;
    }

    await db
      .insert(medTeamShifts)
      .values({
        medTeamMemberId: member.id,
        dayOfWeek: s.dayOfWeek,
        shiftStart: s.shiftStart,
        shiftEnd: s.shiftEnd,
        isActive: s.isActive,
        effectiveFrom: s.effectiveFrom,
        effectiveUntil: s.effectiveUntil,
      })
      .onConflictDoNothing({
        target: [
          medTeamShifts.medTeamMemberId,
          medTeamShifts.dayOfWeek,
          medTeamShifts.shiftStart,
          medTeamShifts.effectiveFrom,
        ],
      });
  }

  console.log("Seeding patients 🧬…");
  for (const p of SEED_PATIENTS) {
    const u = await db.query.users.findFirst({
      where: eq(users.email, p.userEmail),
    });
    if (!u) {
      console.warn("Skipping patient seed, user not found:", p.userEmail);
      continue;
    }
    if (u.role !== "patient") {
      console.warn(
        "Skipping patient seed, user is not patient role:",
        p.userEmail,
      );
      continue;
    }
    await db
      .insert(patients)
      .values({
        userId: u.id,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        address1: p.address1,
        address2: p.address2,
        city: p.city,
        province: p.province,
        postalCode: p.postalCode,
        latitude: p.latitude,
        longitude: p.longitude,
        emergencyContactName: p.emergencyContactName,
        emergencyContactPhone: p.emergencyContactPhone,
        medicalNotes: p.medicalNotes,
      })
      .onConflictDoNothing({ target: patients.userId });
  }

  console.log("Seeding staff profiles 🩺…");
  for (const d of SEED_DOCTORS) {
    const u = await db.query.users.findFirst({
      where: eq(users.email, d.userEmail),
    });
    if (!u || u.role !== "doctor") continue;
    await db
      .insert(doctors)
      .values({
        userId: u.id,
        licenseNumber: d.licenseNumber,
        specialization: d.specialization,
        clinicName: d.clinicName,
        clinicAddress: d.clinicAddress,
      })
      .onConflictDoNothing({ target: doctors.userId });
  }
  for (const s of SEED_SUPPORT_AGENTS) {
    const u = await db.query.users.findFirst({
      where: eq(users.email, s.userEmail),
    });
    if (!u || u.role !== "support") continue;
    await db
      .insert(supportAgents)
      .values({ userId: u.id, isOnline: s.isOnline })
      .onConflictDoNothing({ target: supportAgents.userId });
  }
  for (const a of SEED_ADMINS) {
    const u = await db.query.users.findFirst({
      where: eq(users.email, a.userEmail),
    });
    if (!u || u.role !== "admin") continue;
    await db
      .insert(admins)
      .values({ userId: u.id, permissions: [...a.permissions] })
      .onConflictDoNothing({ target: admins.userId });
  }

  console.log("Seeding support schedules and shift overrides 📆…");
  for (const s of SEED_SUPPORT_SHIFTS) {
    const u = await db.query.users.findFirst({
      where: eq(users.email, s.agentEmail),
    });
    if (!u) continue;
    const agent = await db.query.supportAgents.findFirst({
      where: eq(supportAgents.userId, u.id),
    });
    if (!agent) continue;
    await db
      .insert(supportShifts)
      .values({
        supportAgentId: agent.id,
        dayOfWeek: s.dayOfWeek,
        shiftStart: s.shiftStart,
        shiftEnd: s.shiftEnd,
        effectiveFrom: s.effectiveFrom,
      })
      .onConflictDoNothing({
        target: [
          supportShifts.supportAgentId,
          supportShifts.dayOfWeek,
          supportShifts.shiftStart,
          supportShifts.effectiveFrom,
        ],
      });
  }
  for (const o of SEED_MED_TEAM_OVERRIDES) {
    const u = await db.query.users.findFirst({
      where: eq(users.email, o.memberEmail),
    });
    if (!u) continue;
    const member = await db.query.medTeamMembers.findFirst({
      where: eq(medTeamMembers.userId, u.id),
    });
    if (!member) continue;
    await db
      .insert(medTeamShiftOverrides)
      .values({
        medTeamMemberId: member.id,
        overrideDate: o.overrideDate,
        overrideType: o.overrideType,
        shiftStart: o.shiftStart,
        shiftEnd: o.shiftEnd,
        reason: o.reason,
      })
      .onConflictDoNothing({
        target: [
          medTeamShiftOverrides.medTeamMemberId,
          medTeamShiftOverrides.overrideDate,
        ],
      });
  }
  for (const o of SEED_SUPPORT_OVERRIDES) {
    const u = await db.query.users.findFirst({
      where: eq(users.email, o.agentEmail),
    });
    if (!u) continue;
    const agent = await db.query.supportAgents.findFirst({
      where: eq(supportAgents.userId, u.id),
    });
    if (!agent) continue;
    await db
      .insert(supportShiftOverrides)
      .values({
        supportAgentId: agent.id,
        overrideDate: o.overrideDate,
        overrideType: o.overrideType,
        shiftStart: o.shiftStart,
        shiftEnd: o.shiftEnd,
        reason: o.reason,
      })
      .onConflictDoNothing({
        target: [
          supportShiftOverrides.supportAgentId,
          supportShiftOverrides.overrideDate,
        ],
      });
  }

  console.log("Seeding laboratory procedures 🧪…");
  await db
    .insert(labProcedures)
    .values([...SEED_LAB_PROCEDURES])
    .onConflictDoUpdate({
      target: labProcedures.code,
      set: {
        name: sql`excluded.name`,
        category: sql`excluded.category`,
        description: sql`excluded.description`,
        preparationInstructions: sql`excluded.preparation_instructions`,
        estimatedDurationMinutes: sql`excluded.estimated_duration_minutes`,
        price: sql`excluded.price`,
        updatedAt: new Date(),
      },
    });

  console.log("Seeding appointments and workflow history 🗓️…");
  for (const a of SEED_APPOINTMENTS) {
    const patientUser = await db.query.users.findFirst({
      where: eq(users.email, a.patientEmail),
    });
    if (!patientUser) continue;
    const patient = await db.query.patients.findFirst({
      where: eq(patients.userId, patientUser.id),
    });
    if (!patient) continue;
    const doctorUser = await db.query.users.findFirst({
      where: eq(users.email, a.doctorEmail),
    });
    const doctor = doctorUser
      ? await db.query.doctors.findFirst({
          where: eq(doctors.userId, doctorUser.id),
        })
      : undefined;
    const procedureRows = await Promise.all(
      a.procedureCodes.map((code) =>
        db.query.labProcedures.findFirst({
          where: eq(labProcedures.code, code),
        }),
      ),
    );
    const totalPrice = procedureRows.reduce(
      (sum, procedure) => sum + (procedure?.price ?? 0),
      0,
    );
    let appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.patientId, patient.id),
        eq(appointments.requestedDate, new Date(a.requestedDate)),
      ),
    });
    if (!appointment) {
      const inserted = await db
        .insert(appointments)
        .values({
          patientId: patient.id,
          doctorId: doctor?.id,
          requestedDate: new Date(a.requestedDate),
          confirmedDate: new Date(a.confirmedDate),
          status: a.status,
          serviceAddress: a.serviceAddress,
          patientNotes: a.patientNotes,
          medteamNotes: a.medteamNotes,
          totalPrice,
        })
        .returning();
      appointment = inserted[0];
    }
    if (!appointment) continue;
    for (const procedure of procedureRows) {
      if (!procedure) continue;
      await db
        .insert(appointmentProcedures)
        .values({
          appointmentId: appointment.id,
          procedureId: procedure.id,
          priceAtBooking: procedure.price,
        })
        .onConflictDoNothing({
          target: [
            appointmentProcedures.appointmentId,
            appointmentProcedures.procedureId,
          ],
        });
    }
    const memberUser = await db.query.users.findFirst({
      where: eq(users.email, "medteam@homelabconnect.local"),
    });
    const member = memberUser
      ? await db.query.medTeamMembers.findFirst({
          where: eq(medTeamMembers.userId, memberUser.id),
        })
      : undefined;
    if (member) {
      await db
        .insert(appointmentAssignments)
        .values({
          appointmentId: appointment.id,
          medTeamMemberId: member.id,
          role: "lead",
        })
        .onConflictDoNothing({
          target: [
            appointmentAssignments.appointmentId,
            appointmentAssignments.medTeamMemberId,
          ],
        });
    }
    const event = await db.query.appointmentEvents.findFirst({
      where: and(
        eq(appointmentEvents.appointmentId, appointment.id),
        eq(appointmentEvents.eventType, "created"),
      ),
    });
    if (!event) {
      await db
        .insert(appointmentEvents)
        .values({
          appointmentId: appointment.id,
          actorUserId: patientUser.id,
          eventType: "created",
          payload: { source: "seed" },
        });
    }
  }

  for (const r of SEED_RESCHEDULE_PROPOSALS) {
    const patientUser = await db.query.users.findFirst({
      where: eq(users.email, r.patientEmail),
    });
    const proposer = await db.query.users.findFirst({
      where: eq(users.email, r.proposedByEmail),
    });
    if (!patientUser || !proposer) continue;
    const patient = await db.query.patients.findFirst({
      where: eq(patients.userId, patientUser.id),
    });
    if (!patient) continue;
    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.patientId, patient.id),
    });
    if (!appointment) continue;
    const existing = await db.query.rescheduleProposals.findFirst({
      where: and(
        eq(rescheduleProposals.appointmentId, appointment.id),
        eq(rescheduleProposals.proposedDate, new Date(r.proposedDate)),
      ),
    });
    if (!existing) {
      await db
        .insert(rescheduleProposals)
        .values({
          appointmentId: appointment.id,
          proposedByUserId: proposer.id,
          proposedDate: new Date(r.proposedDate),
          reason: r.reason,
          status: r.status,
        });
    }
  }

  console.log("Seeding chat, notifications, sessions, and audit logs 💬…");
  for (const c of SEED_CHAT_CONVERSATIONS) {
    const patient = await db.query.users.findFirst({
      where: eq(users.email, c.patientEmail),
    });
    if (!patient) continue;
    let conversation = await db.query.chatConversations.findFirst({
      where: and(
        eq(chatConversations.type, c.type),
        eq(chatConversations.subject, c.subject),
      ),
    });
    if (!conversation) {
      conversation = (
        await db
          .insert(chatConversations)
          .values({ type: c.type, subject: c.subject })
          .returning()
      )[0];
    }
    if (!conversation) continue;
    for (const email of [c.patientEmail, ...c.participantEmails]) {
      const participant = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (!participant) continue;
      await db
        .insert(chatParticipants)
        .values({ conversationId: conversation.id, userId: participant.id })
        .onConflictDoNothing({
          target: [chatParticipants.conversationId, chatParticipants.userId],
        });
    }
    const existingMessage = await db.query.chatMessages.findFirst({
      where: and(
        eq(chatMessages.conversationId, conversation.id),
        eq(
          chatMessages.content,
          "Your preparation question has been received.",
        ),
      ),
    });
    if (!existingMessage) {
      await db
        .insert(chatMessages)
        .values({
          conversationId: conversation.id,
          senderUserId: patient.id,
          content: "Your preparation question has been received.",
        });
    }
  }
  const patientUser = await db.query.users.findFirst({
    where: eq(users.email, "patient01@homelabconnect.local"),
  });
  if (patientUser) {
    const existingNotification = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.userId, patientUser.id),
        eq(notifications.title, "Appointment accepted"),
      ),
    });
    if (!existingNotification) {
      await db
        .insert(notifications)
        .values({
          userId: patientUser.id,
          type: "appointment_accepted",
          title: "Appointment accepted",
          body: "Your home laboratory appointment has been accepted.",
          data: { source: "seed" },
          isRead: false,
        });
    }
    const existingSession = await db.query.sessions.findFirst({
      where: eq(sessions.tokenHash, "seed-session-token-hash"),
    });
    if (!existingSession) {
      await db
        .insert(sessions)
        .values({
          userId: patientUser.id,
          tokenHash: "seed-session-token-hash",
          userAgent: "seed",
          ipAddress: "127.0.0.1",
          expiresAt: new Date("2027-01-01T00:00:00.000Z"),
        });
    }
    const existingAudit = await db.query.auditLogs.findFirst({
      where: and(
        eq(auditLogs.actorUserId, patientUser.id),
        eq(auditLogs.action, "seed.created"),
        eq(auditLogs.resourceType, "appointment"),
      ),
    });
    if (!existingAudit) {
      await db
        .insert(auditLogs)
        .values({
          actorUserId: patientUser.id,
          action: "seed.created",
          resourceType: "appointment",
          resourceId: "seed",
          metadata: { source: "seed" },
          ipAddress: "127.0.0.1",
        });
    }
  }

  console.log("Seeding permissions 🔐…");
  await db
    .insert(permissions)
    .values([...SEED_PERMISSIONS])
    .onConflictDoUpdate({
      target: permissions.key,
      set: {
        label: sql`excluded.label`,
        category: sql`excluded.category`,
        updatedAt: new Date(),
      },
    });
  for (const rp of SEED_ROLE_PERMISSIONS) {
    const permission = await db.query.permissions.findFirst({
      where: eq(permissions.key, rp.permissionKey),
    });
    if (!permission) continue;
    await db
      .insert(rolePermissions)
      .values({
        role: rp.role,
        permissionId: permission.id,
        isGranted: rp.isGranted,
      })
      .onConflictDoUpdate({
        target: [rolePermissions.role, rolePermissions.permissionId],
        set: { isGranted: rp.isGranted, updatedAt: new Date() },
      });
  }
  const adminUser = await db.query.users.findFirst({
    where: eq(users.email, "admin@homelabconnect.local"),
  });
  const attachmentPermission = await db.query.permissions.findFirst({
    where: eq(permissions.key, "chat.attachment.create"),
  });
  if (adminUser && attachmentPermission) {
    await db
      .insert(userPermissionOverrides)
      .values({
        userId: adminUser.id,
        permissionId: attachmentPermission.id,
        isGranted: true,
        reason: "Seed administrator override",
        grantedByUserId: adminUser.id,
      })
      .onConflictDoUpdate({
        target: [
          userPermissionOverrides.userId,
          userPermissionOverrides.permissionId,
        ],
        set: { isGranted: true, updatedAt: new Date() },
      });
  }

  await client.end();
  console.log("✅ seed complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ seed failed", err);
  process.exit(1);
});
