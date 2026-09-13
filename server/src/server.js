import "dotenv/config";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { ensureSearchMetadata } from "./services/searchMetadataService.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    await ensureSearchMetadata();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
