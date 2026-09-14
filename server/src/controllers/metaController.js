import LegalCategory from "../models/LegalCategory.js";
import Location from "../models/Location.js";

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/meta/categories
// Controlled category metadata. This collection is the runtime source of truth
// for search and AI classification and can later be managed by the admin UI.
export const getPublicCategories = async (req, res) => {
  try {
    const categories = await LegalCategory.find({ isActive: true })
      .select("categoryId name description sortOrder")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return res.json({
      count: categories.length,
      categories: categories.map((category) => ({
        id: category.categoryId,
        name: category.name,
        description: category.description || "",
      })),
    });
  } catch (error) {
    console.error("Get public categories error:", error);

    return res.status(500).json({
      message: "Failed to fetch legal categories.",
    });
  }
};

// GET /api/meta/locations?query=pa
// Locations come from their own controlled collection. They are not derived
// live from lawyer-entered profile strings, so future admin/location management
// can keep them canonical.
export const getPublicLocations = async (req, res) => {
  try {
    const level = String(req.query.level || "");
    if (level && !["provinces", "districts", "cities"].includes(level)) {
      return res.status(400).json({ message: "Invalid location level." });
    }
    if (level === "provinces") {
      const provinces = await Location.distinct("province", { isActive: true });
      return res.json({ provinces: provinces.sort() });
    }
    if (level === "districts") {
      const province = String(req.query.province || "");
      if (!province) return res.status(400).json({ message: "Province is required." });
      const districts = await Location.distinct("district", { province, isActive: true });
      return res.json({ districts: districts.sort() });
    }
    if (level === "cities") {
      const province = String(req.query.province || "");
      const district = String(req.query.district || "");
      if (!province || !district) return res.status(400).json({ message: "Province and district are required." });
      const locations = await Location.find({ province, district, isActive: true })
        .select("city district province").sort({ city: 1 }).lean();
      return res.json({ locations: locations.map((item) => ({
        id: String(item._id), city: item.city, district: item.district, province: item.province,
      })) });
    }
    const query = String(req.query.query || "").trim();
    const filter = { isActive: true };

    if (query) {
      filter.city = {
        $regex: `^${escapeRegex(query)}`,
        $options: "i",
      };
    }

    const locations = await Location.find(filter)
      .select("city district province")
      .sort({ city: 1 })
      .limit(query ? 30 : 150)
      .lean();

    return res.json({
      count: locations.length,
      locations: locations.map((location) => ({
        id: String(location._id),
        city: location.city,
        district: location.district,
        province: location.province,
      })),
    });
  } catch (error) {
    console.error("Get public locations error:", error);

    return res.status(500).json({
      message: "Failed to fetch locations.",
    });
  }
};
