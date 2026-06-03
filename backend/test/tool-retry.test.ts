import { beforeEach, describe, expect, it, vi } from "vitest";
import { executeToolWithRetry } from "../src/runtime/loop.js";
import { getTool, resetRegistryTestState } from "../src/tools/registry.js";

describe("tool retry classification", () => {
  beforeEach(() => {
    resetRegistryTestState();
  });

  it("retries recoverable fetch_weather Melbourne once and succeeds", () => {
    const tool = getTool("fetch_weather");
    expect(tool).toBeDefined();
    const execute = vi.spyOn(tool!, "execute");

    const result = executeToolWithRetry("fetch_weather", { city: "Melbourne" });

    expect(execute).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({ city: "Melbourne", temp_c: 14 });
  });

  it("does not retry send_email when recipient is missing", () => {
    const tool = getTool("send_email");
    expect(tool).toBeDefined();
    const execute = vi.spyOn(tool!, "execute");

    const result = executeToolWithRetry("send_email", {});

    expect(execute).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({
      code: "INVALID_ARGUMENT",
      recoverable: false,
    });
  });
});
