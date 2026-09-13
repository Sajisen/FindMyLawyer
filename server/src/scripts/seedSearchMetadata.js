import "dotenv/config";

import { connectDB } from "../config/db.js";
import LegalCategory from "../models/LegalCategory.js";
import Location from "../models/Location.js";
import { ensureSearchMetadata } from "../services/searchMetadataService.js";

async function run() {
  try {
    await connectDB();

    await LegalCategory.deleteMany({});
    await Location.deleteMany({});

    await ensureSearchMetadata();

    console.log("Search metadata seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed search metadata:", error);
    process.exit(1);
  }
}

run();
