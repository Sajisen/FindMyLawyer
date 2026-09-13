import LawyerProfile from "../models/LawyerProfile.js";
import {
  getActiveLegalCategory,
  getActiveLocation,
} from "./searchMetadataService.js";

const PUBLIC_VISIBILITY = {
  $or: [
    {
      isDemo: true,
      verificationStatus: "demo_verified",
    },
    {
      isDemo: { $ne: true },
      isPublished: true,
    },
  ],
};

const PUBLIC_PROJECT = {
  displayName: 1,
  professionalTitle: 1,
  email: 1,
  phone: 1,
  officeCity: 1,
  district: 1,
  province: 1,
  primaryPracticeArea: 1,
  practiceAreas: 1,
  subAreas: 1,
  languages: 1,
  consultationModes: 1,
  yearsOfPractice: 1,
  description: 1,
  acceptingNewClients: 1,
};

export class SearchValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "SearchValidationError";
    this.statusCode = 400;
  }
}

function normalize(value = "") {
  return String(value).trim().toLowerCase();
}

function locationLabelExpression(location, allowOnlineFallback) {
  if (!location) {
    return { $literal: null };
  }

  const branches = [
    {
      case: {
        $eq: [
          { $toLower: { $ifNull: ["$officeCity", ""] } },
          normalize(location.city),
        ],
      },
      then: "Exact city",
    },
    {
      case: {
        $eq: [
          { $toLower: { $ifNull: ["$district", ""] } },
          normalize(location.district),
        ],
      },
      then: "Same district",
    },
    {
      case: {
        $eq: [
          { $toLower: { $ifNull: ["$province", ""] } },
          normalize(location.province),
        ],
      },
      then: "Same province",
    },
  ];

  if (allowOnlineFallback) {
    branches.push({
      case: {
        $in: ["Online", { $ifNull: ["$consultationModes", []] }],
      },
      then: "Online consultation",
    });
  }

  return {
    $switch: {
      branches,
      default: null,
    },
  };
}

function locationScoreExpression(location, allowOnlineFallback) {
  if (!location) {
    return 0;
  }

  const branches = [
    {
      case: {
        $eq: [
          { $toLower: { $ifNull: ["$officeCity", ""] } },
          normalize(location.city),
        ],
      },
      then: 50,
    },
    {
      case: {
        $eq: [
          { $toLower: { $ifNull: ["$district", ""] } },
          normalize(location.district),
        ],
      },
      then: 30,
    },
    {
      case: {
        $eq: [
          { $toLower: { $ifNull: ["$province", ""] } },
          normalize(location.province),
        ],
      },
      then: 15,
    },
  ];

  if (allowOnlineFallback) {
    branches.push({
      case: {
        $in: ["Online", { $ifNull: ["$consultationModes", []] }],
      },
      then: 5,
    });
  }

  return {
    $switch: {
      branches,
      default: 0,
    },
  };
}

function categoryScoreExpression(practiceArea) {
  if (!practiceArea) {
    return 0;
  }

  return {
    $switch: {
      branches: [
        {
          case: { $eq: ["$primaryPracticeArea", practiceArea] },
          then: 100,
        },
        {
          case: {
            $in: [practiceArea, { $ifNull: ["$practiceAreas", []] }],
          },
          then: 70,
        },
      ],
      default: 0,
    },
  };
}

export async function searchPublicLawyers({
  practiceArea = "",
  province = "",
  district = "",
  locationId = "",
  city = "",
  language = "",
  consultationMode = "",
  minExperience,
  acceptingNewClients,
  page = 1,
  limit = 10,
}) {
  const hasPracticeArea = Boolean(practiceArea?.trim());
  const hasLocation = Boolean(locationId || city?.trim());

  if (!hasPracticeArea && !hasLocation) {
    throw new SearchValidationError(
      "Choose an area of practice or a preferred location before searching."
    );
  }

  let canonicalPracticeArea = "";

  if (hasPracticeArea) {
    const category = await getActiveLegalCategory(practiceArea);

    if (!category) {
      throw new SearchValidationError(
        "Please select a valid area of practice."
      );
    }

    canonicalPracticeArea = category.categoryId;
  }

  let location = null;

  if (hasLocation) {
    location = await getActiveLocation({ locationId, city });

    if (!location) {
      throw new SearchValidationError(
        "Please select a valid location from the suggestions."
      );
    }
  }

  const conditions = [PUBLIC_VISIBILITY];

  if (canonicalPracticeArea) {
    conditions.push({
      $or: [
        { primaryPracticeArea: canonicalPracticeArea },
        { practiceAreas: canonicalPracticeArea },
      ],
    });
  }

  if (province) {
    conditions.push({ province });
  }

  if (district) {
    conditions.push({ district });
  }

  if (language) {
    conditions.push({ languages: language });
  }

  if (consultationMode) {
    conditions.push({ consultationModes: consultationMode });
  }

  if (minExperience !== undefined && minExperience !== "") {
    conditions.push({
      yearsOfPractice: { $gte: Number(minExperience) },
    });
  }

  if (acceptingNewClients !== undefined) {
    conditions.push({ acceptingNewClients });
  }

  const allowOnlineFallback = Boolean(canonicalPracticeArea && location);

  if (location) {
    if (canonicalPracticeArea) {
      // Category + location: keep geographically relevant lawyers first, then
      // permit online lawyers as a useful fallback for that legal category.
      conditions.push({
        $or: [
          { officeCity: location.city },
          { district: location.district },
          { province: location.province },
          { consultationModes: "Online" },
        ],
      });
    } else {
      // Location-only search: do not pull in unrelated lawyers nationwide just
      // because they offer online consultations. Stay inside the selected
      // province and rank exact city -> district -> province.
      conditions.push({ province: location.province });
    }
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  const skip = (safePage - 1) * safeLimit;

  const pipeline = [
    {
      $match: {
        $and: conditions,
      },
    },
    {
      $addFields: {
        _categoryScore: categoryScoreExpression(canonicalPracticeArea),
        _locationScore: locationScoreExpression(
          location,
          allowOnlineFallback
        ),
        _locationLabel: locationLabelExpression(
          location,
          allowOnlineFallback
        ),
      },
    },
    {
      $addFields: {
        relevanceScore: {
          $add: ["$_categoryScore", "$_locationScore"],
        },
      },
    },
  ];

  if (location) {
    pipeline.push({
      $match: {
        _locationLabel: { $ne: null },
      },
    });
  }

  pipeline.push({
    $facet: {
      total: [{ $count: "count" }],
      locationStats: [
        {
          $group: {
            _id: "$_locationLabel",
            count: { $sum: 1 },
          },
        },
      ],
      lawyers: [
        {
          $sort: {
            relevanceScore: -1,
            displayName: 1,
          },
        },
        { $skip: skip },
        { $limit: safeLimit },
        {
          $project: {
            ...PUBLIC_PROJECT,
            relevanceScore: 1,
            match: {
              matchedPracticeArea: {
                $literal: Boolean(canonicalPracticeArea),
              },
              locationLabel: "$_locationLabel",
            },
          },
        },
      ],
    },
  });

  const [aggregationResult] = await LawyerProfile.aggregate(pipeline);
  const totalCount = aggregationResult?.total?.[0]?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));

  const locationStats = new Map(
    (aggregationResult?.locationStats || []).map((item) => [
      item._id,
      item.count,
    ])
  );

  const exactCityCount = locationStats.get("Exact city") || 0;
  const sameDistrictCount = locationStats.get("Same district") || 0;
  const sameProvinceCount = locationStats.get("Same province") || 0;
  const onlineFallbackCount = locationStats.get("Online consultation") || 0;
  const locationRelevantCount =
    exactCityCount + sameDistrictCount + sameProvinceCount;

  return {
    count: totalCount,
    lawyers: aggregationResult?.lawyers || [],
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalPages,
      totalResults: totalCount,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    },
    searchMeta: {
      requestedCity: location?.city || null,
      locationId: location ? String(location._id) : null,
      locationFound: location ? true : null,
      exactCityCount: location ? exactCityCount : null,
      sameDistrictCount: location ? sameDistrictCount : null,
      sameProvinceCount: location ? sameProvinceCount : null,
      locationRelevantCount: location ? locationRelevantCount : null,
      onlineFallbackCount: location ? onlineFallbackCount : null,
    },
  };
}
