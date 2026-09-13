import LawyerProfile from "../models/LawyerProfile.js";

const PUBLIC_LAWYER_FIELDS = [
  "displayName",
  "professionalTitle",
  "email",
  "phone",
  "officeCity",
  "district",
  "province",
  "primaryPracticeArea",
  "practiceAreas",
  "subAreas",
  "languages",
  "consultationModes",
  "yearsOfPractice",
  "description",
  "acceptingNewClients",
].join(" ");

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

function normalize(value = "") {
  return value.trim().toLowerCase();
}

function escapeRegex(value = "") {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function offersOnlineConsultation(lawyer) {
  return lawyer.consultationModes?.some(
    (mode) => normalize(mode) === "online"
  );
}

function calculateCategoryScore(
  lawyer,
  practiceArea
) {
  if (!practiceArea) {
    return 0;
  }

  if (
    normalize(lawyer.primaryPracticeArea) ===
    normalize(practiceArea)
  ) {
    return 100;
  }

  if (
    lawyer.practiceAreas?.some(
      (area) =>
        normalize(area) ===
        normalize(practiceArea)
    )
  ) {
    return 70;
  }

  return 0;
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
    normalize(lawyer.district) ===
      normalize(locationContext.district)
  ) {
    return {
      score: 30,
      label: "Same district",
    };
  }

  if (
    locationContext?.province &&
    normalize(lawyer.province) ===
      normalize(locationContext.province)
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

export async function searchPublicLawyers({
  practiceArea = "",
  province = "",
  district = "",
  city = "",
  language = "",
  consultationMode = "",
  minExperience,
  acceptingNewClients,
}) {
  const conditions = [
    PUBLIC_VISIBILITY,
  ];

  if (practiceArea) {
    conditions.push({
      $or: [
        {
          primaryPracticeArea:
            practiceArea,
        },
        {
          practiceAreas:
            practiceArea,
        },
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
    conditions.push({
      languages: language,
    });
  }

  if (consultationMode) {
    conditions.push({
      consultationModes:
        consultationMode,
    });
  }

  if (
    minExperience !== undefined &&
    minExperience !== ""
  ) {
    conditions.push({
      yearsOfPractice: {
        $gte: Number(minExperience),
      },
    });
  }

  if (
    acceptingNewClients !== undefined
  ) {
    conditions.push({
      acceptingNewClients,
    });
  }

  /*
    Do not filter candidates directly by city.

    We need a wider set so we can rank:
    exact city
    -> same district
    -> same province
    -> online.
  */
  const candidates =
    await LawyerProfile.find({
      $and: conditions,
    })
      .select(PUBLIC_LAWYER_FIELDS)
      .lean();

  let locationContext = null;

  if (city) {
    const escapedCity =
      escapeRegex(city.trim());

    const referenceLocation =
      await LawyerProfile.findOne({
        $and: [
          PUBLIC_VISIBILITY,
          {
            officeCity: {
              $regex: `^${escapedCity}$`,
              $options: "i",
            },
          },
        ],
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
          practiceArea
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
          matchedPracticeArea:
            Boolean(practiceArea),
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

  return {
    count: rankedLawyers.length,
    lawyers: rankedLawyers,
  };
}