import { getGeminiModel } from "./geminiClient.js";
import { parseAiJsonArray } from "../../utils/parseAiJson.js";
import { limitText } from "../../utils/text.js";

export const findResources = async (text) => {
  try {
    const model = getGeminiModel();

    const prompt = `
    Analyze the following study material and identify 3-5 key topics.
    For each topic, provide:
    1. A brief explanation.
    2. A search query for YouTube.
    3. A search query for Google Scholar or Wikipedia.

    Return ONLY a JSON array of objects.
    Each object must have: "topic", "explanation", "youtubeQuery", "webQuery".

    Text:
    ${limitText(text)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    return parseAiJsonArray(responseText, "Resources");
  } catch (error) {
    console.error("Resource generation error:", error);
    throw new Error(error.message || "Failed to find resources");
  }
};
