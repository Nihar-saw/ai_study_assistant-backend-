import { getGeminiModel } from "./geminiClient.js";
import { parseAiJsonArray } from "../../utils/parseAiJson.js";
import { limitText } from "../../utils/text.js";

export const generateRoadmap = async (text, filename) => {
  try {
    const model = getGeminiModel();

    const prompt = `
    Analyze the following study material text and create a highly structured, hierarchical learning roadmap outline.
    The roadmap should break down the text into chapters, major sections, and specific core concepts.
    
    Return ONLY a JSON array of objects.
    Each object in the array represents a node in the roadmap tree, and must have this exact structure:
    {
      "id": "a-unique-lowercase-slug-id (e.g. intro-to-dbms, relational-algebra)",
      "name": "Human-friendly Title (e.g. Introduction to DBMS, SQL Queries)",
      "parent": "the id of its parent node, or null if it is a top-level chapter",
      "keyConcepts": ["list of 2-4 key terms or concepts covered in this section"]
    }

    Ensure topics are ordered logically for a student learning the material.
    Aim to output between 5 and 12 nodes total.
    
    Filename: ${filename}
    
    Study Text:
    ${limitText(text, 12000)}
    `;

    console.log("[Roadmap] Requesting AI Roadmap outline...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    return parseAiJsonArray(responseText, "Roadmap");
  } catch (error) {
    console.error("Roadmap generation error, using fallback:", error);
    // Fallback roadmap based on PDF filename and a simple default list
    return [
      { id: "intro", name: "Introduction & Foundations", parent: null, keyConcepts: ["Basic concepts", "Core terminology"] },
      { id: "core-concepts", name: "Core Principles", parent: null, keyConcepts: ["Key processes", "Theoretical models"] },
      { id: "advanced-topics", name: "Advanced Analysis", parent: null, keyConcepts: ["Complex problem solving", "Practical application"] },
      { id: "exam-review", name: "Revision & Exercises", parent: "advanced-topics", keyConcepts: ["Mock questions", "Syllabus summary"] }
    ];
  }
};
