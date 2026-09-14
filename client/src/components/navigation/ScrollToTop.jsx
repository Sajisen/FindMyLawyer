import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    // New link/programmatic navigations should begin at the top. Browser
    // Back/Forward navigation is different: preserving the previous position
    // is more useful and matches normal browser behaviour. Search results also
    // have their own async-safe restoration for returning from a lawyer page.
    if (navigationType === "POP") {
      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [navigationType, pathname]);

  return null;
}
