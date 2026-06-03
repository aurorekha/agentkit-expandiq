import { toolRegistry, type Tool } from "../tools/registry.js";

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function scoreTool(goal: string, tool: Tool): number {
  const goalLower = goal.toLowerCase();
  const goalTokens = new Set(tokenize(goal));
  let score = 0;

  for (const token of tokenize(tool.name.replace(/_/g, " "))) {
    if (goalTokens.has(token)) {
      score += 2;
    }
  }

  if (goalLower.includes(tool.name)) {
    score += 2;
  }

  for (const keyword of tool.keywords) {
    const keywordLower = keyword.toLowerCase();
    if (goalLower.includes(keywordLower)) {
      score += 3;
    }
    for (const token of tokenize(keyword)) {
      if (goalTokens.has(token)) {
        score += 2;
      }
    }
  }

  for (const token of tokenize(tool.description)) {
    if (goalTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

export function retrieveTools(goal: string, topK = 5): Tool[] {
  const ranked = toolRegistry
    .map((tool) => ({ tool, score: scoreTool(goal, tool) }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.tool.name.localeCompare(b.tool.name);
    });

  return ranked.slice(0, topK).map((entry) => entry.tool);
}
