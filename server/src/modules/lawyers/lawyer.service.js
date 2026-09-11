import Lawyer from "./lawyer.model.js";

function normalize(value = "") {
  return value.trim().toLowerCase();
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function offersOnlineConsultation(lawyer) {
  return lawyer.consultationModes?.some(
    (mode) => normalize(mode) === "online"
  );
}

function calculateCategoryScore(
  lawyer,
  categories
) {
  let score = 0;

  for (const category of categories) {
    if (
      lawyer.primaryPracticeArea === category
    ) {
      score += 100;
    } else if (
      lawyer.practiceAreas?.includes(category)
    ) {
      score += 70;
    }
  }

  return score;
}

function calculateLocationMatch(
  lawyer,
  requestedCity,
  locationContext
) {
  if (!requestedCity) {
    return {
      score: 0,
      label: null,
    };
  }

  if (
    normalize(lawyer.officeCity) ===
    normalize(requestedCity)
  ) {
    return {
      score: 50,
      label: "Exact city",
    };
  }

  if (
    locationContext?.district &&
    lawyer.district ===
      locationContext.district
  ) {
    return {
      score: 30,
      label: "Same district",
    };
  }

  if (
    locationContext?.province &&
    lawyer.province ===
      locationContext.province
  ) {
    return {
      score: 15,
      label: "Same province",
    };
  }

  if (offersOnlineConsultation(lawyer)) {
    return {
      score: 5,
      label: "Online consultation",
    };
  }

  return {
    score: 0,
    label: null,
  };
}

export async function searchLawyers({
  categories = [],
  city = "",
  language = "",
  consultationMode = "",
  minExperience = 0,
  limit = 20,
}) {
  const query = {
    acceptingNewClients: true,

    verificationStatus: {
      $in: [
        "verified",
        "demo_verified",
      ],
    },
  };

  if (categories.length > 0) {
    query.practiceAreas = {
      $in: categories,
    };
  }

  if (language) {
    query.languages = language;
  }

  if (consultationMode) {
    query.consultationModes =
      consultationMode;
  }

  if (minExperience > 0) {
    query.yearsOfPractice = {
      $gte: minExperience,
    };
  }

  /*
    We intentionally don't filter by city here.

    We need the wider result set so that we can
    rank:
    exact city
    -> district
    -> province
    -> online.
  */
  const candidates = await Lawyer.find(
    query
  ).lean();

  let locationContext = null;

  if (city) {
    const escapedCity =
      escapeRegex(city.trim());

    const referenceLocation =
      await Lawyer.findOne({
        officeCity: {
          $regex: `^${escapedCity}$`,
          $options: "i",
        },
      })
        .select("district province")
        .lean();

    if (referenceLocation) {
      locationContext = {
        district:
          referenceLocation.district,

        province:
          referenceLocation.province,
      };
    }
  }

  const rankedLawyers = candidates
    .map((lawyer) => {
      const categoryScore =
        calculateCategoryScore(
          lawyer,
          categories
        );

      const locationMatch =
        calculateLocationMatch(
          lawyer,
          city,
          locationContext
        );

      let relevanceScore =
        categoryScore +
        locationMatch.score;

      if (
        language &&
        lawyer.languages?.includes(language)
      ) {
        relevanceScore += 15;
      }

      if (
        consultationMode &&
        lawyer.consultationModes?.includes(
          consultationMode
        )
      ) {
        relevanceScore += 10;
      }

      return {
        ...lawyer,

        relevanceScore,

        match: {
          matchedCategories:
            categories.filter((category) =>
              lawyer.practiceAreas?.includes(
                category
              )
            ),

          locationLabel:
            locationMatch.label,
        },
      };
    })

    .filter((lawyer) => {
      if (!city) {
        return true;
      }

      return Boolean(
        lawyer.match.locationLabel
      );
    })

    .sort((a, b) => {
      if (
        b.relevanceScore !==
        a.relevanceScore
      ) {
        return (
          b.relevanceScore -
          a.relevanceScore
        );
      }

      return a.displayName.localeCompare(
        b.displayName
      );
    });

  const safeLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    50
  );

  const totalCount =
    rankedLawyers.length;

  const lawyers = rankedLawyers
    .slice(0, safeLimit)
    .map((lawyer) => ({
      id: lawyer._id,

      displayName:
        lawyer.displayName,

      professionalTitle:
        lawyer.professionalTitle,

      officeCity:
        lawyer.officeCity,

      district:
        lawyer.district,

      province:
        lawyer.province,

      primaryPracticeArea:
        lawyer.primaryPracticeArea,

      practiceAreas:
        lawyer.practiceAreas,

      languages:
        lawyer.languages,

      consultationModes:
        lawyer.consultationModes,

      yearsOfPractice:
        lawyer.yearsOfPractice,

      description:
        lawyer.description,

      verificationStatus:
        lawyer.verificationStatus,

      match:
        lawyer.match,
    }));

  return {
    count: totalCount,
    lawyers,
  };
}