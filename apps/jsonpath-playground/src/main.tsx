import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import RootLayout from "./app/layout";

/**
 * Application entry point.
 */
createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RootLayout />
    </StrictMode>,
);
