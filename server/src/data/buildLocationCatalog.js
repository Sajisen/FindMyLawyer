import demoLocations from "./demoLocations.json" with { type: "json" };

export const normalize = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
export const locationKey = ({ city, district, province }) => [city, district, province].map(normalize).join("|");
const districtNames = new Map(demoLocations.map(({ district, province }) => [normalize(district), { district, province }]));
districtNames.set("mullativu", districtNames.get("mullaitivu"));
districtNames.set("mullaitivu", districtNames.get("mullaitivu"));

export function mergeLocations(provinces, districts, cities) {
  if (![provinces, districts, cities].every(Array.isArray)) throw new Error("Expected three JSON arrays.");
  const provinceById = new Map(provinces.map((item) => [String(item.id), item.name_en]));
  const districtById = new Map(districts.map((item) => [String(item.id), item]));
  const result = new Map();
  for (const entry of demoLocations) result.set(locationKey(entry), entry);
  for (const item of cities) {
    const districtRecord = districtById.get(String(item.district_id));
    const rawDistrict = districtRecord?.name_en;
    const canonicalDistrict = districtNames.get(normalize(rawDistrict));
    const rawProvince = provinceById.get(String(districtRecord?.province_id));
    if (!canonicalDistrict || normalize(rawProvince) !== normalize(canonicalDistrict.province)) {
      throw new Error(`Unmapped district/province in source: ${rawDistrict} / ${rawProvince}`);
    }
    const city = String(item.name_en || "").trim();
    if (!city || city.toUpperCase() === "NULL") continue;
    const entry = { city, ...canonicalDistrict };
    const key = locationKey(entry);
    if (!result.has(key)) result.set(key, entry);
  }
  return [...result.values()].sort((a, b) => locationKey(a).localeCompare(locationKey(b)));
}
