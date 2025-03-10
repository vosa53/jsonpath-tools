"use client"

import { alpha, createTheme, CSSVariablesResolver } from "@mantine/core";
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

export const applicationCSSVariablesResolver: CSSVariablesResolver = (theme) => ({
    variables: {

    },
    light: {
        "--application-color-text-selection": alpha(theme.colors.violet[6], 0.2),
        "--application-color-code-block": theme.colors.gray[1],
        "--application-color-code-background": "var(--mantine-color-body)",
        "--application-color-code-highlighted": alpha(theme.colors.yellow[3], 0.2),
        "--application-color-code-highlighted-current": alpha(theme.colors.yellow[9], 0.2),
        "--application-color-code-highlighted-match": "#4dabf740"
    },
    dark: {
        "--application-color-text-selection": alpha(theme.colors.violet[4], 0.3),
        "--application-color-code-block": theme.colors.gray[8],
        "--application-color-code-background": "var(--mantine-color-body)",
        "--application-color-code-highlighted": alpha(theme.colors.yellow[9], 0.2),
        "--application-color-code-highlighted-current": alpha(theme.colors.yellow[3], 0.3),
        "--application-color-code-highlighted-match": "#d0ebff40"
    },
});