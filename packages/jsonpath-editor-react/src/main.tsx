import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Root from "./root";

/**
 * JSONPath editor testing entry point.
 */
createRoot(document.getElementById("app")!).render(
    <StrictMode>
        <Root />
    </StrictMode>
);