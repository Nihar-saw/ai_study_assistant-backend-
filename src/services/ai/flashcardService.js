import { getGeminiModel } from "./geminiClient.js";
import { parseAiJsonArray } from "../../utils/parseAiJson.js";
import { limitText } from "../../utils/text.js";
import { fallbackFlashcards } from "./fallbackStudyService.js";

export const generateFlashcards = async (text, existingCards = null) => {
  try {
    const model = getGeminiModel();

    let avoidPrompt = "";
    if (existingCards && existingCards.length > 0) {
      const cardsToAvoid = existingCards.map((c, idx) => `${idx + 1}. Q: ${c.question} -> A: ${c.answer}`).join("\n");
      avoidPrompt = `
      CRITICAL REGENERATION INSTRUCTION:
      The user is resetting their flashcards and wants a completely different set of questions and answers.
      You MUST NOT test the exact same concepts, and you MUST NOT reuse any of the following questions/answers:
      ${cardsToAvoid}
      
      Please analyze the text and find alternative key points, terms, definitions, formulas, or concepts to generate new flashcards.
      `;
    }

    const prompt = `
    Generate a set of 10 flashcards from this text.
    Return ONLY a JSON array of objects.
    Each object must have: "question" and "answer".
    IMPORTANT: If there are any mathematical equations, formulas, or expressions, you MUST format them using valid LaTeX enclosed in $ for inline math (e.g. $E=mc^2$) or $$ for block math. Do not use plain text for math.
    CRITICAL: Because you are returning JSON, you MUST double-escape all backslashes in your LaTeX commands! For example, write "\\\\frac{1}{2}" instead of "\\frac{1}{2}". Failure to double-escape will break the JSON parser.
    ${avoidPrompt}

    Text:
    ${limitText(text)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    return parseAiJsonArray(responseText, "Flashcard");
  } catch (error) {
    console.error("Flashcard generation error:", error);
    return fallbackFlashcards(text);
  }
};
