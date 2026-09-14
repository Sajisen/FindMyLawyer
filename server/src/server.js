import "dotenv/config";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { ensureSearchMetadata } from "./services/searchMetadataService.js";
import { getAIProviderStatus } from "./services/aiProviders/aiProviderService.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required before the server can start.");
    }

    await connectDB();
    await ensureSearchMetadata();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);

      const aiStatus = getAIProviderStatus();

      if (aiStatus.activeProvider) {
        console.log(
          `Advanced Search AI provider: ${aiStatus.activeProvider} (${aiStatus.model})`
        );
      } else {
        console.warn(
          `Advanced Search AI provider is not ready: ${aiStatus.configurationError}`
        );
      }
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
