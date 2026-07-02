import app from "../src/app.js";

// DB connection is handled lazily by middleware in app.js
// This prevents Vercel serverless function crashes on cold start

export default app;
