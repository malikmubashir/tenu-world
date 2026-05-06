import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "src/lib/pricing/**",
        "src/lib/geo/zone-tendue.ts",
        "src/lib/payments/stripe.ts",
        "src/app/api/webhooks/**",
      ],
      thresholds: {
        lines:     70,
        functions: 70,
        branches:  60,
      },
    },
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
