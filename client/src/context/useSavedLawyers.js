import { useContext } from "react";

import SavedLawyersContext from "./savedLawyersContext.js";

export function useSavedLawyers() {
  const context = useContext(SavedLawyersContext);

  if (!context) {
    throw new Error(
      "useSavedLawyers must be used inside SavedLawyersProvider"
    );
  }

  return context;
}
