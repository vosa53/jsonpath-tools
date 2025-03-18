import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import RootLayout from './app/layout';

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <RootLayout />
    </StrictMode>,
);
