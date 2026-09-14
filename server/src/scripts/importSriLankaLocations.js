import "dotenv/config";
import { readFile } from "node:fs/promises";
import { connectDB } from "../config/db.js";
import Location from "../models/Location.js";
import demoLocations from "../data/demoLocations.json" with { type: "json" };
import { mergeLocations, locationKey, normalize } from "../data/buildLocationCatalog.js";

// Source: https://github.com/SKIDDOW/SriLankaCitiesDatabase (MIT).
// Download provinces.json, districts.json and cities.json there, or allow
// this script to retrieve them from the repository at run time.
const source = "https://raw.githubusercontent.com/SKIDDOW/SriLankaCitiesDatabase/main";

async function loadJson(name, directory) {
  if (directory) return JSON.parse(await readFile(`${directory}/${name}.json`, "utf8"));
  const response = await fetch(`${source}/${name}.json`);
  if (!response.ok) throw new Error(`Could not download ${name}.json (${response.status}).`);
  return response.json();
}


async function run() {
  const apply = process.argv.includes("--apply");
  const directory = process.argv.find((arg) => arg.startsWith("--source-dir="))?.slice(13);
  const data = await Promise.all(["provinces", "districts", "cities"].map((name) => loadJson(name, directory)));
  const locations = mergeLocations(...data);
  console.log(`Validated ${locations.length} unique locations, including ${demoLocations.length} demo locations.`);
  if (!apply) {
    console.log("Dry run only. Add --apply to upsert into MongoDB without deleting existing records.");
    return;
  }
  await connectDB();
  const results = await Location.bulkWrite(locations.map((entry) => ({
    updateOne: {
      filter: { locationKey: locationKey(entry) },
      update: { $setOnInsert: { ...entry, normalizedCity: normalize(entry.city), locationKey: locationKey(entry), isActive: true } },
      upsert: true,
    },
  })), { ordered: false });
  console.log(`Inserted ${results.upsertedCount} locations. Existing location IDs were kept.`);
}

if (process.argv[1]?.endsWith("importSriLankaLocations.js")) {
  run().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
}
