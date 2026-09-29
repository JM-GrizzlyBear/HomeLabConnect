/**
 * Enforces the Dependency Rule of Clean Architecture:
 * source code dependencies may only point inward.
 *
 *   domain  <-  application  <-  interface  <-  infrastructure  <-  main.ts
 *
 * See docs/ARCHITECTURE.md.
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      comment:
        "Entities (domain) must not depend on anything outside the domain: no other ring, no npm package, no Node built-in.",
      severity: "error",
      from: { path: "^src/domain/" },
      to: { pathNot: "^src/domain/" },
    },
    {
      name: "application-depends-only-on-domain",
      comment:
        "Use cases (application) may only depend on the domain. Frameworks and drivers are reached through ports.",
      severity: "error",
      from: { path: "^src/application/" },
      to: { pathNot: "^src/(domain|application)/" },
    },
    {
      name: "interface-does-not-know-infrastructure",
      comment:
        "Interface adapters (controllers, presenters, middleware) must not depend on frameworks & drivers.",
      severity: "error",
      from: { path: "^src/interface/" },
      to: { path: "^src/(infrastructure/|main\\.ts$)" },
    },
    {
      name: "interface-has-no-framework-packages",
      comment:
        "Interface adapters stay framework-free: only the shared contracts package is allowed from node_modules.",
      severity: "error",
      from: { path: "^src/interface/" },
      to: {
        dependencyTypes: ["npm", "npm-dev", "npm-optional", "npm-peer", "npm-no-pkg", "core"],
        pathNot: "(^|/)(packages/shared|@homelabconnect/shared)/",
      },
    },
    {
      name: "nothing-imports-main",
      comment: "main.ts is the composition root; nothing may depend on it.",
      severity: "error",
      from: {},
      to: { path: "^src/main\\.ts$" },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.test\\.ts$" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
    },
  },
};
