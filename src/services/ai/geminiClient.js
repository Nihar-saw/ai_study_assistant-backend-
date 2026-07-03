import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
const DEFAULT_OLLAMA_MODEL = "llama3";
const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

export const getGeminiModel = () => {
  const provider = (process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : "ollama")).toLowerCase();

  if (provider === "gemini") {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing. Add it to backend/.env or set AI_PROVIDER=ollama.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    });
  }

  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY || process.env.groq_api_key;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is missing. Add it to backend/.env");
    }
    const modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const callGroq = async (messages) => {
      try {
        console.log(`[Groq] Calling model: ${modelName}...`);
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
          model: modelName,
          messages: messages,
          temperature: 0.2,
        }, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        });
        console.log(`[Groq] Success!`);
        return response.data.choices[0].message.content;
      } catch (error) {
        console.error("Groq API error:", error.response?.data || error.message);
        throw new Error(`Groq failed: ${error.message}`);
      }
    };

    return {
      generateContent: async (prompt) => {
        const text = await callGroq([{ role: "user", content: prompt }]);
        return {
          response: {
            text: async () => text,
          },
        };
      },
      startChat: ({ history = [] }) => {
        let internalHistory = history.map(h => ({
          role: h.role === "model" ? "assistant" : "user",
          content: h.parts && h.parts[0] ? h.parts[0].text : ""
        })).filter(h => h.content !== "");

        return {
          sendMessage: async (message) => {
            internalHistory.push({ role: "user", content: message });
            const text = await callGroq(internalHistory);
            internalHistory.push({ role: "assistant", content: text });
            
            return {
              response: {
                text: async () => text,
              },
            };
          },
        };
      },
    };
  }

  const baseURL = (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).replace("localhost", "127.0.0.1");
  const modelName = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
  const timeout = Number(process.env.OLLAMA_TIMEOUT_MS) || 120000;

  const callOllama = async (messages) => {
    try {
      console.log(`[Ollama] Calling model: ${modelName}...`);
      const response = await axios.post(`${baseURL}/api/chat`, {
        model: modelName,
        messages: messages,
        stream: false,
        options: {
          temperature: 0.2,
          num_ctx: 8192,
        },
      }, {
        timeout,
      });
      console.log(`[Ollama] Success!`);
      return response.data.message.content;
    } catch (error) {
      console.error("Ollama API error:", error.response?.data || error.message);
      throw new Error(`Ollama failed: ${error.message}. Make sure Ollama is running at ${baseURL}`);
    }
  };

  return {
    generateContent: async (prompt) => {
      const text = await callOllama([{ role: "user", content: prompt }]);
      return {
        response: {
          text: async () => text,
        },
      };
    },
    startChat: ({ history = [] }) => {
      // Convert Gemini history format to Ollama message format
      let internalHistory = history.map(h => ({
        role: h.role === "model" ? "assistant" : "user",
        content: h.parts && h.parts[0] ? h.parts[0].text : ""
      })).filter(h => h.content !== "");

      return {
        sendMessage: async (message) => {
          internalHistory.push({ role: "user", content: message });
          const text = await callOllama(internalHistory);
          internalHistory.push({ role: "assistant", content: text });
          
          return {
            response: {
              text: async () => text,
            },
          };
        },
      };
    },
  };
};
