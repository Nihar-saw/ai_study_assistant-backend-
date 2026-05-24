import { getGeminiModel } from "./geminiClient.js";
import { parseAiJsonObject } from "../../utils/parseAiJson.js";
import { limitText } from "../../utils/text.js";

export const identifyPDF = async (text, filename) => {
  const model = getGeminiModel();

  const prompt = `
You are identifying a study PDF for a learning app.
Return ONLY valid JSON with this shape:
{
  "detectedTitle": "short human-friendly title",
  "subject": "main subject area",
  "description": "one concise sentence explaining what the PDF is about",
  "keyTopics": ["topic 1", "topic 2", "topic 3"],
  "suggestedQuestions": ["question 1", "question 2", "question 3"]
}

Use the filename only as a hint. Do not invent details that are not supported by the text.

Filename: ${filename}

PDF text:
${limitText(text, 12000)}
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const profile = parseAiJsonObject(await response.text(), "PDF identification");

  return {
    detectedTitle: String(profile.detectedTitle || filename).slice(0, 120),
    subject: String(profile.subject || "General").slice(0, 80),
    description: String(profile.description || "AI study material").slice(0, 240),
    keyTopics: Array.isArray(profile.keyTopics) ? profile.keyTopics.slice(0, 6).map(String) : [],
    suggestedQuestions: Array.isArray(profile.suggestedQuestions) ? profile.suggestedQuestions.slice(0, 5).map(String) : [],
  };
};

