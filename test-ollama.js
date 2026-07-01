import axios from "axios";

const baseURL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const modelName = "llama3";

async function testOllama() {
  try {
    console.log(`Checking Ollama at ${baseURL}...`);
    const res = await axios.get(`${baseURL}/api/tags`);
    console.log("Ollama is running!");
    console.log("Available models:", res.data.models.map(m => m.name));
    
    if (!res.data.models.find(m => m.name.startsWith(modelName))) {
        console.warn(`WARNING: Model ${modelName} not found in Ollama list!`);
    } else {
        console.log(`Model ${modelName} found!`);
        console.log("Testing generation...");
        const genRes = await axios.post(`${baseURL}/api/generate`, {
            model: modelName,
            prompt: "Say hi",
            stream: false
        });
        console.log("Success:", genRes.data.response);
    }
  } catch (e) {
    console.error("Ollama connection failed:", e.message);
  }
}

testOllama();
