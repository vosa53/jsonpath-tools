import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Root from "./app/root";

/**
 * Application entry point.
 */
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Root />
    </StrictMode>
);
