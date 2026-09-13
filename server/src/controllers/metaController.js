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
