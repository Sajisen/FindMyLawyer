import {
  LEGAL_CATEGORY_IDS,
} from "../../constants/legalCategories.js";

import {
  searchLawyers,
} from "./lawyer.service.js";

export async function getLawyers(
  req,
  res,
  next
) {
  try {
    const categories =
      typeof req.query.categories ===
      "string"
        ? req.query.categories
            .split(",")
            .map((category) =>
              category.trim()
            )
            .filter(Boolean)
        : [];

    const invalidCategories =
      categories.filter(
        (category) =>
          !LEGAL_CATEGORY_IDS.has(category)
      );

    if (
      invalidCategories.length > 0
    ) {
      return res.status(400).json({
        message:
          "One or more practice areas are invalid.",
      });
    }

    const city =
      typeof req.query.city ===
      "string"
        ? req.query.city.trim()
        : "";

    const language =
      typeof req.query.language ===
      "string"
        ? req.query.language.trim()
        : "";

    const consultationMode =
      typeof req.query
        .consultationMode === "string"
        ? req.query.consultationMode.trim()
        : "";

    const minExperience =
      Number(
        req.query.minExperience
      ) || 0;

    const limit =
      Number(req.query.limit) || 20;

    if (minExperience < 0) {
      return res.status(400).json({
        message:
          "Minimum experience cannot be negative.",
      });
    }

    const result =
      await searchLawyers({
        categories,
        city,
        language,
        consultationMode,
        minExperience,
        limit,
      });

    return res.status(200).json({
      count: result.count,

      appliedFilters: {
        categories,
        city,
        language,
        consultationMode,
        minExperience,
      },

      lawyers: result.lawyers,
    });
  } catch (error) {
    next(error);
  }
}