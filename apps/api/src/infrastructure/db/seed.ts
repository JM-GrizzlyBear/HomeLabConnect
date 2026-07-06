import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import * as schema from "./schema/index.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../../.env") });

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  medTeamMembers,
  medTeamShifts,
  patients,
  roles,
  users,
} from "./schema/index.js";
import { SEED_PATIENTS } from "./seeds/patient.seeds.js";
import { SEED_ROLES } from "./seeds/role.seeds.js";
import { SEED_USERS } from "./seeds/user.seeds.js";
import { SEED_MED_TEAM_MEMBERS } from "./seeds/med-team-member.seeds.js";
import { SEED_MED_TEAM_SHIFTS } from "./seeds/med-team-shift.seeds.js";

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

  await client.end();
  console.log("✅ seed complete");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ seed failed", err);
  process.exit(1);
});
