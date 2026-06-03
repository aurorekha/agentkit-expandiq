export type ToolResult = {
  ok: boolean;
  data: unknown | null;
  error: {
    code: string;
    message: string;
    recoverable: boolean;
  } | null;
};

export type Tool = {
  name: string;
  description: string;
  keywords: string[];
  idempotent: boolean;
  parallelSafe: boolean;
  execute: (args: Record<string, unknown>) => ToolResult;
};

const melbourneWeatherAttempts = new Set<string>();

function success(data: unknown): ToolResult {
  return { ok: true, data, error: null };
}

function failure(
  code: string,
  message: string,
  recoverable: boolean,
): ToolResult {
  return {
    ok: false,
    data: null,
    error: { code, message, recoverable },
  };
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

const searchDocs: Tool = {
  name: "search_docs",
  description: "Search internal documentation by query string.",
  keywords: ["docs", "documentation", "search", "knowledge", "stuck"],
  idempotent: true,
  parallelSafe: true,
  execute(args) {
    const query = asString(args.query, "general");
    return success({
      query,
      hits: [
        { id: "doc-onboarding", title: "AgentKit onboarding guide" },
        { id: "doc-tools", title: "Tool registry reference" },
        { id: "doc-safety", title: "Safety and guardrails overview" },
      ],
    });
  },
};

const fetchDoc: Tool = {
  name: "fetch_doc",
  description: "Fetch the full text of a documentation article by id.",
  keywords: ["docs", "documentation", "article", "fetch"],
  idempotent: true,
  parallelSafe: true,
  execute(args) {
    const docId = asString(args.doc_id, "doc-onboarding");
    const contentById: Record<string, string> = {
      "doc-onboarding":
        "AgentKit runs goals through a tool-using agent runtime with persistence.",
      "doc-tools":
        "Tools are registered with metadata and deterministic execute handlers.",
      "doc-safety":
        "Guards validate tool arguments and block unsafe operations before execution.",
    };
    return success({
      doc_id: docId,
      title: docId.replace("doc-", "").replace(/-/g, " "),
      content: contentById[docId] ?? contentById["doc-onboarding"],
    });
  },
};

const sendEmail: Tool = {
  name: "send_email",
  description: "Send an email to a recipient with subject and body.",
  keywords: ["email", "mail", "notify", "message"],
  idempotent: false,
  parallelSafe: false,
  execute(args) {
    const recipient = asString(args.recipient).trim();
    if (!recipient) {
      return failure("INVALID_ARGUMENT", "recipient is required", false);
    }
    return success({
      message_id: "msg-1001",
      recipient,
      subject: asString(args.subject, "(no subject)"),
      status: "queued",
    });
  },
};

const createCalendarEvent: Tool = {
  name: "create_calendar_event",
  description: "Create a calendar event with title and start time.",
  keywords: ["calendar", "event", "schedule", "meeting"],
  idempotent: false,
  parallelSafe: false,
  execute(args) {
    return success({
      event_id: "evt-2001",
      title: asString(args.title, "Untitled event"),
      start: asString(args.start, "2026-06-03T10:00:00Z"),
      status: "created",
    });
  },
};

const querySql: Tool = {
  name: "query_sql",
  description: "Run a read-only SQL query against the analytics warehouse.",
  keywords: ["sql", "database", "query", "analytics"],
  idempotent: true,
  parallelSafe: true,
  execute(args) {
    const sql = asString(args.sql, "SELECT 1");
    return success({
      sql,
      columns: ["run_id", "status", "total_cost"],
      rows: [
        ["run-001", "completed", 0.12],
        ["run-002", "running", 0.04],
      ],
    });
  },
};

const summariseText: Tool = {
  name: "summarise_text",
  description: "Summarise a block of text into a short bullet list.",
  keywords: ["summary", "summarise", "condense", "tldr"],
  idempotent: true,
  parallelSafe: true,
  execute(args) {
    const text = asString(args.text, "");
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return success({
      summary: [
        "Key point one from the provided text.",
        "Key point two from the provided text.",
      ],
      source_word_count: wordCount,
    });
  },
};

const translate: Tool = {
  name: "translate",
  description: "Translate text into a target language code.",
  keywords: ["translate", "language", "localization"],
  idempotent: true,
  parallelSafe: true,
  execute(args) {
    const text = asString(args.text, "Hello");
    const targetLang = asString(args.target_lang, "es");
    return success({
      source_text: text,
      target_lang: targetLang,
      translated_text: `[${targetLang}] ${text}`,
    });
  },
};

const fetchWeather: Tool = {
  name: "fetch_weather",
  description: "Fetch current weather conditions for a city.",
  keywords: ["weather", "forecast", "temperature", "climate"],
  idempotent: false,
  parallelSafe: true,
  execute(args) {
    const city = asString(args.city, "Sydney");
    const cityKey = city.trim().toLowerCase();

    if (cityKey === "melbourne" && !melbourneWeatherAttempts.has(cityKey)) {
      melbourneWeatherAttempts.add(cityKey);
      return failure(
        "TEMP_UNAVAILABLE",
        "Weather service temporarily unavailable",
        true,
      );
    }

    const weatherByCity: Record<string, { temp_c: number; condition: string }> =
      {
        melbourne: { temp_c: 14, condition: "cloudy" },
        sydney: { temp_c: 22, condition: "sunny" },
        london: { temp_c: 16, condition: "light rain" },
      };

    const weather = weatherByCity[cityKey] ?? {
      temp_c: 20,
      condition: "clear",
    };

    return success({
      city,
      ...weather,
      unit: "celsius",
    });
  },
};

const lookupContact: Tool = {
  name: "lookup_contact",
  description: "Look up a contact record by name or email fragment.",
  keywords: ["contact", "crm", "person", "lookup"],
  idempotent: true,
  parallelSafe: true,
  execute(args) {
    const query = asString(args.query, "team");
    return success({
      query,
      contacts: [
        {
          id: "contact-01",
          name: "Alex Chen",
          email: "alex.chen@example.com",
          team: "Platform",
        },
        {
          id: "contact-02",
          name: "Sam Rivera",
          email: "sam.rivera@example.com",
          team: "Support",
        },
      ],
    });
  },
};

const webSearch: Tool = {
  name: "web_search",
  description: "Search the public web for pages matching a query.",
  keywords: ["web", "search", "internet", "links"],
  idempotent: true,
  parallelSafe: true,
  execute(args) {
    const query = asString(args.query, "agentkit");
    return success({
      query,
      results: [
        {
          url: "https://example.com/agentkit",
          title: "AgentKit overview",
          snippet: "Introduction to the AgentKit assignment runtime.",
        },
        {
          url: "https://example.com/agentkit/tools",
          title: "AgentKit tools",
          snippet: "Reference for built-in deterministic tools.",
        },
      ],
    });
  },
};

export const toolRegistry: Tool[] = [
  searchDocs,
  fetchDoc,
  sendEmail,
  createCalendarEvent,
  querySql,
  summariseText,
  translate,
  fetchWeather,
  lookupContact,
  webSearch,
];

const toolsByName = new Map(toolRegistry.map((tool) => [tool.name, tool]));

export function getTool(name: string): Tool | undefined {
  return toolsByName.get(name);
}
