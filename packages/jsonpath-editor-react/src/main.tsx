import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Root from "./root";

createRoot(document.getElementById("app")!).render(
    <StrictMode>
        <Root />
    </StrictMode>
);