// Starts the API: reads the settings, connects to Postgres and wires the app with the real services.
import { buildApp } from "./buildApp.js";
import { BcryptPasswordHasher } from "./infrastructure/auth/BcryptPasswordHasher.js";
import { CryptoTemporaryPasswordGenerator } from "./infrastructure/auth/CryptoTemporaryPasswordGenerator.js";
import { loadConfig } from "./infrastructure/config.js";
import { createDatabase } from "./infrastructure/db/client.js";
import { NodemailerAccountEmails } from "./infrastructure/mail/NodemailerAccountEmails.js";
import { NodemailerAppointmentEmails } from "./infrastructure/mail/NodemailerAppointmentEmails.js";
import { SystemClock } from "./infrastructure/SystemClock.js";
import { createPhotoStorage } from "./infrastructure/storage/createPhotoStorage.js";

const config = loadConfig();
const { db, pool } = createDatabase(config.databaseUrl);

const mail = {
  smtpHost: config.smtpHost,
  smtpPort: config.smtpPort,
  smtpUser: config.smtpUser,
  smtpPass: config.smtpPass,
  from: config.mailFrom,
  appUrl: config.appUrl,
};

const app = buildApp({
  db,
  pool,
  clock: new SystemClock(),
  passwordHasher: new BcryptPasswordHasher(),
  temporaryPasswords: new CryptoTemporaryPasswordGenerator(),
  accountEmails: new NodemailerAccountEmails(mail),
  appointmentEmails: new NodemailerAppointmentEmails(mail),
  sessionSecret: config.sessionSecret,
  sessionTtlMinutes: config.sessionTtlMinutes,
  secureCookie: config.secureCookie,
  trustProxy: config.trustProxy,
  photoStorage: createPhotoStorage(config),
  uploadsDir: config.photoStorage === "local" ? config.uploadsDir : undefined,
});

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
