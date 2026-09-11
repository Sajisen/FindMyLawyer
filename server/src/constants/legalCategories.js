export const LEGAL_CATEGORIES = [
  {
    id: "criminal",
    name: "Criminal Law",
  },
  {
    id: "family",
    name: "Family & Matrimonial Law",
  },
  {
    id: "property",
    name: "Land, Property & Notarial Matters",
  },
  {
    id: "civil",
    name: "Civil Disputes & Compensation",
  },
  {
    id: "business",
    name: "Business & Commercial Law",
  },
  {
    id: "employment",
    name: "Employment & Labour Law",
  },
  {
    id: "inheritance",
    name: "Wills, Probate & Inheritance",
  },
  {
    id: "finance",
    name: "Banking, Debt, Tax & Consumer Matters",
  },
  {
    id: "public",
    name: "Fundamental Rights & Public Law",
  },
  {
    id: "technology",
    name: "Intellectual Property & Technology",
  },
  {
    id: "immigration",
    name: "Immigration & Citizenship",
  },
  {
    id: "other",
    name: "Other / I'm Not Sure",
  },
];

export const LEGAL_CATEGORY_IDS = new Set(
  LEGAL_CATEGORIES.map((category) => category.id)
);