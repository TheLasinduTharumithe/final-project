export type ChatLanguageMode = "sinhala" | "english" | "mixed";

const sinhalaUnicodePattern = /[\u0D80-\u0DFF]/;
const englishLetterPattern = /[a-zA-Z]/g;

const singlishHints = [
  "mage",
  "mama",
  "mata",
  "mokakda",
  "monawada",
  "kiyanna",
  "pennanna",
  "thiyenawada",
  "kochchara",
  "dawanna",
  "danaganna",
  "adala",
  "request",
  "donation",
  "ads",
  "role eka"
];

function countEnglishLetters(text: string) {
  return (text.match(englishLetterPattern) || []).length;
}

function looksLikeSinglish(text: string) {
  const normalized = text.toLowerCase();
  return singlishHints.some((hint) => normalized.includes(hint));
}

export function detectChatLanguage(message: string): ChatLanguageMode {
  const normalized = message.trim();
  const hasSinhala = sinhalaUnicodePattern.test(normalized);
  const englishCount = countEnglishLetters(normalized);
  const hasEnglish = englishCount > 0;
  const hasSinglish = looksLikeSinglish(normalized);

  if (hasSinhala && hasEnglish) {
    return "mixed";
  }

  if (hasSinhala) {
    return "sinhala";
  }

  if (hasSinglish) {
    return "mixed";
  }

  return "english";
}

export function buildLanguageInstruction(mode: ChatLanguageMode) {
  if (mode === "sinhala") {
    return "Reply in natural, simple, polite Sri Lankan Sinhala. Avoid stiff translation-style Sinhala.";
  }

  if (mode === "mixed") {
    return "Reply mainly in simple natural Sinhala. You may keep a few familiar English technical words like donation, request, ad, role, or dashboard only when helpful.";
  }

  return "Reply in clear, natural English.";
}

export function localizeChatMessage(
  mode: ChatLanguageMode,
  messages: {
    english: string;
    sinhala: string;
    mixed?: string;
  }
) {
  if (mode === "english") {
    return messages.english;
  }

  if (mode === "mixed" && messages.mixed) {
    return messages.mixed;
  }

  return messages.sinhala;
}
