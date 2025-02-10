import type { Metadata } from "next";
import "./globals.css";
import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider, createTheme, mantineHtmlProps, useMantineTheme } from '@mantine/core';

export const metadata: Metadata = {
    title: "JSONPath Playground",
    description: "Playground for JSONPath query language.",
};

const theme = createTheme({
    fontFamily: 'Segoe UI',
    primaryColor: "teal"
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
                <MantineProvider theme={theme} defaultColorScheme="light">{children}</MantineProvider>
            </body>
        </html>
    );
}
