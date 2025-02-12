import type { Metadata } from "next";
import '@mantine/core/styles.css';
import "./globals.css";
import { Accordion, ColorSchemeScript, MantineProvider, createTheme, mantineHtmlProps, useMantineTheme } from '@mantine/core';
import localFont from 'next/font/local';

export const cascadiaMonoFont = localFont({
  src: [
    {
      path: './CascadiaMono.woff2'
    }
  ],
});

export const metadata: Metadata = {
    title: "JSONPath Playground",
    description: "Playground for JSONPath query language.",
};

const theme = createTheme({
    fontFamily: "Segoe UI",
    fontFamilyMonospace: cascadiaMonoFont.style.fontFamily,
    primaryColor: "violet"
  });

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" {...mantineHtmlProps}>
            <head>
                <ColorSchemeScript />
            </head>
            <body>
                <MantineProvider theme={theme} defaultColorScheme="auto">{children}</MantineProvider>
            </body>
        </html>
    );
}
