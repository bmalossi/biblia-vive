import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component resets the window scroll position to (0, 0)
 * whenever the location (URL path or search query) changes.
 * This ensures that navigating to a new page (like an article or chapter)
 * always starts from the top.
 */
export default function ScrollToTop() {
    const { pathname, search } = useLocation();

    useEffect(() => {
        // Reset scroll position immediately on route change
        window.scrollTo(0, 0);
    }, [pathname, search]);

    return null;
}
