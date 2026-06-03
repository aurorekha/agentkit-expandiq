import { closeDb, initTestDb } from "../src/db/client.js";
import { resetRegistryTestState } from "../src/tools/registry.js";

export function setupTestDb(): void {
  resetRegistryTestState();
  initTestDb();
}

export function teardownTestDb(): void {
  closeDb();
  resetRegistryTestState();
}
