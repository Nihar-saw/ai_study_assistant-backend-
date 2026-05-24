import { getGeminiModel } from "./geminiClient.js";
import { parseAiJsonArray } from "../../utils/parseAiJson.js";
import { limitText } from "../../utils/text.js";

export const generateQuiz = async (text) => {
  try {
    const model = getGeminiModel();

    const prompt = `
    Generate a multiple choice quiz from this text.
    Return ONLY a JSON array of objects.
    Each object must have: "question", "options" (array of 4 strings), and "correctAnswer" (one of the options).
    IMPORTANT: If there are any mathematical equations, formulas, or expressions, you MUST format them using valid LaTeX enclosed in $ for inline math (e.g. $E=mc^2$) or $$ for block math. Do not use plain text for math.
    CRITICAL: Because you are returning JSON, you MUST double-escape all backslashes in your LaTeX commands! For example, write "\\\\frac{1}{2}" instead of "\\frac{1}{2}". Failure to double-escape will break the JSON parser.

    Text:
    ${limitText(text)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    return parseAiJsonArray(responseText, "Quiz");
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw new Error(error.message || "Quiz generation failed");
  }
};
