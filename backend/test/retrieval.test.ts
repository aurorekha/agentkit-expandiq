import { describe, expect, it } from "vitest";
import { retrieveTools } from "../src/runtime/retrieval.js";

function toolNames(goal: string, topK = 5): string[] {
  return retrieveTools(goal, topK).map((tool) => tool.name);
}

describe("tool retrieval ranking", () => {
  it('includes fetch_weather in top 5 for goal "weather"', () => {
    expect(toolNames("weather")).toContain("fetch_weather");
  });

  it('includes search_docs, fetch_doc, and summarise_text for goal "policy docs"', () => {
    const names = toolNames("policy docs");
    expect(names).toContain("search_docs");
    expect(names).toContain("fetch_doc");
    expect(names).toContain("summarise_text");
  });
});
