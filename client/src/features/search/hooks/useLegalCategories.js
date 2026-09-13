import { useEffect, useState } from "react";

import { legalCategories as fallbackCategories } from "../data/searchOptions.js";
import { getLegalCategories } from "../searchMetaApi.js";

export default function useLegalCategories() {
  const [categories, setCategories] = useState(fallbackCategories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        setLoading(true);
        setError("");

        const data = await getLegalCategories();

        if (!cancelled && Array.isArray(data.categories) && data.categories.length) {
          setCategories(data.categories);
        }
      } catch (requestError) {
        if (!cancelled) {
          // Keep the bundled category list as a resilience fallback. The API
          // remains the normal runtime source of truth when available.
          setError(requestError.message || "Unable to load categories.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    categories,
    loading,
    error,
  };
}
