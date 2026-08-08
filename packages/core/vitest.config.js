import { defineConfig } from "vitest/config";

// Los hooks del core usan React (useState/useEffect), así que necesitan un DOM
// simulado (jsdom) para renderizarse con renderHook en los tests.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
});
