import { createTheme } from "@mantine/core";
import localFont from "next/font/local";
import { Roboto } from 'next/font/google'

const robotoFont = Roboto({
    weight: ["400", "500", "700"],
    subsets: ["latin"],
});

const cascadiaMonoFont = localFont({
    src: [
        {
            path: "./fonts/CascadiaMono.woff2"
        }
    ]
});

export const applicationTheme = createTheme({
    fontFamily: robotoFont.style.fontFamily,
    fontFamilyMonospace: cascadiaMonoFont.style.fontFamily,
    primaryColor: "violet"
});