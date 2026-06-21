import { getGeminiModel } from "./geminiClient.js";
import { parseAiJsonObject } from "../../utils/parseAiJson.js";
import { limitText } from "../../utils/text.js";

export const generateExamPrep = async (text, mode = "University") => {
  try {
    const model = getGeminiModel();

    const prompt = `
    You are an expert academic examiner and study coach.
    Based on the provided text, generate comprehensive exam preparation material optimized for the following mode: "${mode}".
    
    Modes definition:
    - University Exam Mode: Focus on standard conceptual questions of varying marks, definitions, explanations, and long form essays.
    - Competitive Exam Mode: Focus on deep analytical queries, edge cases, logical reasoning, and complex problem solving.
    - Viva Mode: Focus on quick-fire verbal questions, core mechanisms, definitions, and "why" / "how" questions.

    Return ONLY valid JSON with this exact structure:
    {
      "twoMarkQuestions": ["3-5 short questions, focusing on brief definitions or quick points"],
      "fiveMarkQuestions": ["2-3 medium-length questions, focusing on comparing, explaining, or summarizing components"],
      "tenMarkQuestions": ["2 long-form questions, focusing on deep descriptions, architecture, derivations or analytical applications"],
      "vivaQuestions": ["3-5 verbal review questions suitable for an oral exam"],
      "importantTopics": ["3-5 topics in this material that carry the highest marks or probability of being asked"],
      "frequentConcepts": ["3-5 concepts that are fundamental and frequently tested in standard curricula"]
    }

    Text:
    ${limitText(text, 12000)}
    `;

    console.log(`[Exam] Requesting AI Exam Prep in ${mode} mode...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    return parseAiJsonObject(responseText, "Exam Prep");
  } catch (error) {
    console.error("Exam prep generation error, using fallback:", error);
    return {
      twoMarkQuestions: ["State the primary function of this subject.", "List two key advantages of the proposed approaches.", "Define the core concept described in the text."],
      fiveMarkQuestions: ["Explain the operational workflow or structure of the main system details.", "Compare and contrast the primary methods outlined in this study material."],
      tenMarkQuestions: ["Provide a comprehensive architectural or theoretical analysis of the key methodologies.", "Discuss the implementation challenges and trade-offs of the concepts presented."],
      vivaQuestions: ["Why is this technique preferred over traditional alternatives?", "How does this core process handle errors or boundaries?", "Explain the physical meaning of the core parameters."],
      importantTopics: ["System architecture and foundations", "Comparative performance parameters", "Error recovery and edge cases"],
      frequentConcepts: ["Operational efficiency", "Structural scaling", "Data integrity / validation flow"]
    };
  }
};
