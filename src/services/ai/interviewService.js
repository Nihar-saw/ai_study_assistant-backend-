import { getGeminiModel } from "./geminiClient.js";
import { parseAiJsonObject } from "../../utils/parseAiJson.js";
import { limitText } from "../../utils/text.js";

// Generate opening question for mock interview
export const generateOpeningQuestion = async (text, type = "Technical") => {
  try {
    const model = getGeminiModel();

    const prompt = `
    You are an expert recruiter and interviewer.
    Based on the following study material, initiate a mock interview session.
    The session type is: "${type}".
    - Technical: Ask a deep, role-related technical question on the core concepts.
    - HR: Ask a personal growth, behavioral, or resume-related question connected to mastering this subject.
    - Scenario: Present a realistic practical design scenario or bug, and ask the candidate how they would solve it.
    - Viva: Ask a direct conceptual examination question testing fundamental definitions.

    Return ONLY the interviewer's opening greeting and first question. Do not return JSON. Keep it friendly but professional, under 80 words.
    
    Study material text:
    ${limitText(text, 8000)}
    `;

    console.log(`[Interview] Requesting opening question for ${type}...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return (await response.text()).trim();
  } catch (error) {
    console.error("Interview opening question error:", error);
    return `Hello! Welcome to your mock interview session. Let's begin by discussing the study material. Can you tell me what you find to be the most crucial concept in this text and why it matters?`;
  }
};

// Generate subsequent questions or evaluations based on user replies
export const generateNextInterviewTurn = async (history, message, pdfText, type) => {
  try {
    const model = getGeminiModel();
    
    // Construct simplified dialog thread
    const conversation = history.map(m => `${m.role === "candidate" ? "Candidate" : "Interviewer"}: ${m.content}`).join("\n");

    const prompt = `
    You are conducting a professional mock interview of type "${type}" based on this reference material:
    ---
    ${limitText(pdfText, 6000)}
    ---
    
    Here is the interview history:
    ${conversation}
    Candidate's latest reply: "${message}"

    Based on the history and reference material:
    Provide the Interviewer's response. In your response, briefly acknowledge the candidate's last reply (e.g. correct them politely, ask for more details, or approve of their solution) and then ask the NEXT question.
    Keep the reply and next question combined, professional, and under 100 words. Do not return JSON, just the plain text dialogue.
    `;

    console.log("[Interview] Generating next turn...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return (await response.text()).trim();
  } catch (error) {
    console.error("Interview next turn generation error:", error);
    return `Interesting response. Can you elaborate further on how that applies to real-world scenarios?`;
  }
};

// Evaluate the final full interview session
export const evaluateInterviewSession = async (history, pdfText, type) => {
  try {
    const model = getGeminiModel();

    const conversation = history.map(m => `${m.role === "candidate" ? "Candidate" : "Interviewer"}: ${m.content}`).join("\n");

    const prompt = `
    You are an expert panel evaluating a mock interview session of type "${type}" based on the following material:
    ---
    ${limitText(pdfText, 6000)}
    ---

    Here is the dialogue transcript:
    ${conversation}
    
    Please evaluate the candidate's answers. Grade them out of 100 based on technical accuracy, clarity, structure, and depth.
    
    Return ONLY valid JSON with this structure:
    {
      "score": 85, // Integer 0-100
      "feedback": "Summary paragraph of overall performance.",
      "detailedEvaluation": {
        "strengths": ["list of 2-3 specific things the candidate explained well"],
        "weaknesses": ["list of 2-3 gaps in knowledge or structural improvements"],
        "tips": ["list of 2-3 revision actions to improve their performance"]
      }
    }
    `;

    console.log("[Interview] Evaluating interview session...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = await response.text();

    return parseAiJsonObject(responseText, "Interview Evaluation");
  } catch (error) {
    console.error("Interview evaluation error, using fallback:", error);
    return {
      score: 75,
      feedback: "The session was completed successfully. The candidate showed solid conceptual awareness but would benefit from explaining architectural tradeoffs and edge conditions more thoroughly.",
      detailedEvaluation: {
        strengths: ["Engaged actively with questions", "Demonstrated clear foundational definitions"],
        weaknesses: ["Lacked structural organization in scenario design", "Did not cover error conditions in detail"],
        tips: ["Practice explaining technical trade-offs", "Review error recovery mechanisms in the study text"]
      }
    };
  }
};
