import "dotenv/config";

import mongoose from "mongoose";

import Lawyer from "../modules/lawyers/lawyer.model.js";
import demoLawyers from "./demoLawyers.json" with { type: "json" };

async function seedLawyers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB_NAME || "findmylawyer",
    });

    console.log("Connected to MongoDB");

    // Remove only old demo profiles.
    // This avoids deleting future real lawyer registrations.
    await Lawyer.deleteMany({
      isDemo: true,
    });

    const inserted = await Lawyer.insertMany(demoLawyers);

    console.log(
      `Successfully inserted ${inserted.length} demo lawyers`
    );
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

seedLawyers();