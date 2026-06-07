// Connectivity test for the Sentinel/Medable LLM gateway. Reads .env.local.
import { readFileSync } from "node:fs";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Minimal .env.local parser
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const model = new ChatOpenAI({
  model: env.NOTATION_AI_MODEL ?? "sonnet-4.5",
  apiKey: env.OPENAI_API_KEY,
  configuration: { baseURL: env.OPENAI_BASE_URL },
  temperature: 0,
});

console.log("baseURL:", env.OPENAI_BASE_URL, "model:", env.NOTATION_AI_MODEL);

try {
  const res = await model.invoke(
    [
      new SystemMessage('Reply ONLY with JSON: {"ok": true, "echo": <the number you are told>}'),
      new HumanMessage("the number is 7"),
    ],
    { response_format: { type: "json_object" } },
  );
  const text = typeof res.content === "string" ? res.content : JSON.stringify(res.content);
  console.log("RESPONSE:", text);
  console.log("GATEWAY: OK");
} catch (e) {
  console.log("GATEWAY ERROR:", e.message);
  process.exit(1);
}
