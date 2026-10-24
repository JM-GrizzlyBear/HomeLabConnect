import { defineConfig } from "vitest/config";

// Two kinds of tests:
//   unit        → rules and use cases on in-memory fakes, no database (fast)
//   integration → the real API against a test database that's reset before every test
export default defineConfig({
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["test/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["test/integration/**/*.test.ts"],
          globalSetup: ["test/integration/support/globalSetup.ts"],
          // One shared test database: run the files one after another
          fileParallelism: false,
          testTimeout: 20_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
