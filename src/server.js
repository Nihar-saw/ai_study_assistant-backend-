import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
// Trigger dev server restart to reload environment variables (switching to Ollama)

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
