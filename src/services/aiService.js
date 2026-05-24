import { getGeminiModel } from "./ai/geminiClient.js";
import { limitText } from "../utils/text.js";

export const generateSummary = async (text) => {
  try {
    const model = getGeminiModel();

    const prompt = `
    Summarize the following study material in simple points:

    ${limitText(text)}
    `;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    return await response.text();
  } catch (error) {
    console.error("Summary generation error:", error);
    throw new Error(error.message || "Summary generation failed");
  }
};
