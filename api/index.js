import app from "../src/app.js";
import connectDB from "../src/config/db.js";

// Connect to MongoDB
await connectDB();

export default app;
