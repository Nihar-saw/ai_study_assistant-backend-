import { getGeminiModel } from "./geminiClient.js";
import { limitText } from "../../utils/text.js";
import { fallbackAnswer } from "./fallbackStudyService.js";

export const chatWithPDF = async (text, message, history = [], tutorMode = "Professor") => {
  try {
    console.log(`[Chat] Sending message in mode: ${tutorMode}. PDF context length: ${text?.length || 0}`);
    const model = getGeminiModel();

    let modeInstructions = "";
    if (tutorMode === "Professor") {
      modeInstructions = "You are a distinguished university professor. Provide detailed, thorough, highly academic explanations with theoretical background, clear definitions, and deep analysis of core principles.";
    } else if (tutorMode === "Friend") {
      modeInstructions = "You are a supportive, smart study buddy. Provide very simple, clear, intuitive explanations using everyday analogies, simple vocabulary, and casual, encouraging language.";
    } else if (tutorMode === "Examiner") {
      modeInstructions = "You are an academic examiner. Your responses should be question-driven. Challenge the student's reasoning, test their conceptual understanding of the PDF context, and grade or evaluate their answers.";
    } else if (tutorMode === "Interviewer") {
      modeInstructions = "You are a corporate recruiter conducting a job placement interview. Focus heavily on real-world placement questions, code efficiency or design trade-offs, how the concept is tested in software interviews, and optimization tips.";
    } else {
      modeInstructions = "You are a professional study assistant. Provide precise, structured, and highly readable answers.";
    }

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `System Instruction: ${modeInstructions}
          
Your goal is to provide extremely precise, structured, and professional answers (similar to ChatGPT and Claude).
Guidelines:
- Format your responses beautifully using clean Markdown.
- Use headers (###) for logical sections, bold text for key terms, and lists for comparisons/steps.
- Code blocks, math equations (LaTeX format), or comparisons should be used where helpful.
- Prioritize clear, thorough, and highly precise answers.
- Ground your answers in the provided PDF context. If the user asks for concepts, elaborations, math solutions, code snippets, or definitions related to the topic that are not explicitly detailed in the PDF text, use your pre-trained academic and general knowledge to provide a complete, comprehensive explanation, rather than refusing to answer.

PDF context:
${limitText(text)}` }],
        },
        {
          role: "model",
          parts: [{ text: `I understand. I am now acting in ${tutorMode} Mode. I will evaluate the PDF context under these guidelines and provide structured, precise answers. What is your question?` }],
        },
        ...history
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return await response.text();
  } catch (error) {
    console.error("Chat generation error:", error);
    return fallbackAnswer(text, message);
  }
};
