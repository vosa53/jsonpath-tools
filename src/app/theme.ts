import { createTheme } from "@mantine/core";
import localFont from "next/font/local";

const cascadiaMonoFont = localFont({
    src: [
        {
            path: "./fonts/CascadiaMono.woff2"
        }
    ]
});

export const applicationTheme = createTheme({
    fontFamily: "Segoe UI",
    fontFamilyMonospace: cascadiaMonoFont.style.fontFamily,
    primaryColor: "violet"
});