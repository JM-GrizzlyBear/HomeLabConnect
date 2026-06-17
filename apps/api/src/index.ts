import { env } from "./env";
import { createApp } from "./infrastructure/http/express-app";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🚀 API listening on http://localhost:${env.PORT}`);
  console.log(`   POST http://localhost:${env.PORT}/rpc/auth/register`);
  console.log(`   POST http://localhost:${env.PORT}/rpc/auth/login`);
  console.log(`   GET  http://localhost:${env.PORT}/rpc/auth/me`);
});
