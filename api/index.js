import app from "../src/app.js";
import connectDB from "../src/config/db.js";

let connectionPromise;

const ensureDatabase = () => {
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
};

export default async function handler(req, res) {
  await ensureDatabase();
  return app(req, res);
}
