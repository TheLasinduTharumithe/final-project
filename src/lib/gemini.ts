import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildLanguageInstruction, type ChatLanguageMode } from "@/lib/chat-language";

const fallbackModels = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-flash-latest"
].filter(Boolean) as string[];

function buildGeneralPrompt(message: string, languageMode: ChatLanguageMode) {
  return `
You are EcoPlate Assistant, a helpful support chatbot for a restaurant food donation platform.

${buildLanguageInstruction(languageMode)}

You should only help with:
- how restaurants can donate surplus food
- food safety tips
- packing suggestions
- pickup and logistics guidance
- general EcoPlate platform support

Keep answers practical, beginner-friendly, and concise.
If asked about medical or legal topics, give general safety guidance and advise contacting qualified professionals.

User question: ${message}
  `;
}

function buildDatabasePrompt(question: string, facts: string, languageMode: ChatLanguageMode) {
  return `
You are EcoPlate Assistant.

${buildLanguageInstruction(languageMode)}

Answer the user's question using only the database facts below.
If the facts do not contain the answer, clearly say that.
Do not invent records, counts, names, or statuses.
Keep the answer concise, natural, and user-friendly.

Database facts:
${facts}

User question:
${question}
  `;
}

async function runGeminiPrompt(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const client = new GoogleGenerativeAI(apiKey);
  let lastError: unknown;

  for (const modelName of fallbackModels) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw new Error(`Gemini request failed: ${lastError.message}`);
  }

  throw new Error("Gemini request failed.");
}

export async function getGeminiReply(message: string) {
  return runGeminiPrompt(buildGeneralPrompt(message, "english"));
}

export async function getGeminiReplyForLanguage(input: {
  message: string;
  languageMode: ChatLanguageMode;
}) {
  return runGeminiPrompt(buildGeneralPrompt(input.message, input.languageMode));
}

export async function getGeminiDatabaseReply(input: {
  question: string;
  facts: string;
  languageMode: ChatLanguageMode;
}) {
  return runGeminiPrompt(buildDatabasePrompt(input.question, input.facts, input.languageMode));
}
