import { getGeminiModel } from "./geminiClient.js";
import { parseAiJsonArray } from "../../utils/parseAiJson.js";
import { limitText } from "../../utils/text.js";
import { fallbackQuiz } from "./fallbackStudyService.js";
import { shuffleArray } from "../../utils/array.js";

export const generateQuiz = async (text, existingQuestions = null) => {
  try {
    const model = getGeminiModel();

    let avoidPrompt = "";
    if (existingQuestions && existingQuestions.length > 0) {
      const questionsToAvoid = existingQuestions.map((q, idx) => {
        const qText = typeof q === 'string' ? q : q.question;
        return `${idx + 1}. ${qText}`;
      }).join("\n");
      avoidPrompt = `
      CRITICAL REGENERATION INSTRUCTION:
      The user is retaking this quiz and wants a completely different set of questions.
      You MUST NOT test the exact same concepts, and you MUST NOT reuse any of the following questions:
      ${questionsToAvoid}
      
      Please analyze the text and find alternative details, formulas, concepts, or application cases to test.
      `;
    }

    const prompt = `
    Generate exactly 10 multiple-choice questions based on this text.
    The questions must be conceptually challenging, analytical, and test deep understanding rather than simple recall. The options must be plausible and require careful analysis to distinguish the correct answer.
    ${avoidPrompt}
    
    Return ONLY a JSON array of objects.
    Each object must have: "question", "options" (array of 4 strings), and "correctAnswer" (one of the options).
    IMPORTANT: If there are any mathematical equations, formulas, or expressions, you MUST format them using valid LaTeX enclosed in $ for inline math (e.g. $E=mc^2$) or $$ for block math. Do not use plain text for math.
    CRITICAL: Because you are returning JSON, you MUST double-escape all backslashes in your LaTeX commands! For example, write "\\\\frac{1}{2}" instead of "\\frac{1}{2}". Failure to double-escape will break the JSON parser.

    Random seed for generation variety: ${Math.floor(Math.random() * 1000000)}

    Text:
    ${limitText(text)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    const parsedQuiz = parseAiJsonArray(responseText, "Quiz");
    if (!Array.isArray(parsedQuiz)) return parsedQuiz;
    
    return parsedQuiz.map(q => ({
      ...q,
      options: q.options ? shuffleArray(q.options) : []
    }));
  } catch (error) {
    console.error("Quiz generation error:", error);
    return fallbackQuiz(text);
  }
};
