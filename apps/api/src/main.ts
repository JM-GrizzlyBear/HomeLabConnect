// Composition root: the only place that creates concrete classes and wires
// them together. Everything else receives its dependencies via constructors.
import { CheckSystemHealth } from "./application/use-cases/CheckSystemHealth.js";
import { loadConfig } from "./infrastructure/config.js";
import { createDatabase } from "./infrastructure/db/client.js";
import { DrizzleDatabaseHealthProbe } from "./infrastructure/db/DrizzleDatabaseHealthProbe.js";
import { createApp } from "./infrastructure/http/app.js";
import { HealthController } from "./interface/http/controllers/HealthController.js";

const config = loadConfig();
const { db, pool } = createDatabase(config.databaseUrl);

// Use cases
const checkSystemHealth = new CheckSystemHealth(new DrizzleDatabaseHealthProbe(db));

// HTTP
const app = createApp({
  corsOrigin: config.appUrl,
  controllers: {
    health: new HealthController(checkSystemHealth),
  },
});

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

function shutdown() {
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
