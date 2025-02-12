import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import '@mantine/core/styles.css';
import type { Metadata } from "next";
import "./styles/globals.css";
import { applicationTheme } from "./theme";

export const metadata: Metadata = {
    title: "JSONPath Playground",
    description: "Playground for JSONPath query language.",
};

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
                <MantineProvider
                    theme={applicationTheme}
                    defaultColorScheme="auto">
                    {children}
                </MantineProvider>
            </body>
        </html>
    );
}
