import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";

// Attempt an initial DB connection on startup (non-fatal if it fails)
// The per-request middleware in app.js will retry on each request
connectDB().catch((err) => {
  console.warn("Initial DB connection attempt failed, will retry on first request:", err.message);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
