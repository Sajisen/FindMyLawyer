import "dotenv/config";

import mongoose from "mongoose";

import LawyerProfile from "../models/LawyerProfile.js";
import demoLawyers from "./demoLawyers.json" with { type: "json" };

async function seedLawyers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName:
        process.env.MONGO_DB_NAME ||
        "findmylawyer",
    });

    console.log("Connected to MongoDB");

    // Remove only existing demo profiles.
    // Real registered lawyers are preserved.
    await LawyerProfile.deleteMany({
      isDemo: true,
    });

    const inserted =
      await LawyerProfile.insertMany(
        demoLawyers
      );

    console.log(
      `Successfully inserted ${inserted.length} demo lawyers`
    );
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.disconnect();

    console.log(
      "MongoDB disconnected"
    );
  }
}

seedLawyers();