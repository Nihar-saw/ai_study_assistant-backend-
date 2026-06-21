import { getGeminiModel } from "./geminiClient.js";
import { parseAiJsonObject } from "../../utils/parseAiJson.js";

export const analyzeWeakness = async (activityLogs, currentWeaknessState = []) => {
  try {
    const model = getGeminiModel();

    // Serialize activity logs for prompt
    const formattedLogs = activityLogs
      .map((log) => {
        const dateStr = new Date(log.createdAt).toLocaleDateString();
        if (log.actionType === "quiz_completed") {
          return `[${dateStr}] Quiz: Score ${log.score}/${log.maxScore} on topics: ${log.topics?.join(", ")}`;
        } else if (log.actionType === "flashcard_reviewed") {
          return `[${dateStr}] Flashcard review: ${log.score === 1 ? "Passed" : "Failed"} on topic: ${log.topics?.join(", ")}`;
        }
        return null;
      })
      .filter(Boolean)
      .join("\n");

    const prompt = `
    You are an AI Weakness Detection agent.
    Analyze the student's learning logs and determine the concepts they are struggling with (where they answer incorrectly or fail reviews).
    
    Learning activity log:
    ${formattedLogs || "No logs yet. The student is starting out."}
    
    Current identified weak areas:
    ${JSON.stringify(currentWeaknessState)}

    Evaluate which concepts require urgent revision.
    Return ONLY valid JSON with this structure:
    {
      "weakTopics": [
        {
          "topic": "Name of Concept (e.g. SQL Joins)",
          "score": 45, // Score out of 100 representing strength (lower is weaker)
          "attempts": 4, // Estimate attempts
          "incorrectCount": 3 // Estimate incorrect answers
        }
      ],
      "recommendations": [
        {
          "topic": "SQL Joins",
          "text": "Revision action, e.g. Re-read section 3.2 on Outer Joins and complete a custom practice quiz."
        }
      ]
    }

    Limit the results to a maximum of 4 weak topics. If the student has perfect logs, return an empty weakTopics array.
    `;

    console.log("[Weakness] Analyzing student performance...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    return parseAiJsonObject(responseText, "Weakness Analytics");
  } catch (error) {
    console.error("Weakness analysis error, using fallback:", error);
    return {
      weakTopics: [
        { topic: "Database Normalization", score: 60, attempts: 2, incorrectCount: 1 },
        { topic: "SQL Joins", score: 50, attempts: 3, incorrectCount: 2 }
      ],
      recommendations: [
        { topic: "Database Normalization", text: "Review 1NF, 2NF, and 3NF dependency requirements in your notes." },
        { topic: "SQL Joins", text: "Create a custom review quiz focusing on Left, Right, and Full Outer Joins." }
      ]
    };
  }
};
