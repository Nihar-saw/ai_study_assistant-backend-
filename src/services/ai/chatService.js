import { getGeminiModel } from "./geminiClient.js";
import { limitText } from "../../utils/text.js";

export const chatWithPDF = async (text, message, history = []) => {
  try {
    console.log(`[Chat] Sending message with PDF context length: ${text?.length || 0}`);
    const model = getGeminiModel();

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `You are a study assistant. Answer only from this PDF context. If the answer is not in the PDF, say that clearly.\n\nPDF context:\n${limitText(text)}` }],
        },
        {
          role: "model",
          parts: [{ text: "I understand. I am ready to help you study this material. What is your question?" }],
        },
        ...history
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return await response.text();
  } catch (error) {
    console.error("Chat generation error:", error);
    throw new Error(error.message || "Chat failed");
  }
};
