import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@mantine/core/styles.css";
import "./globals.css";
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from "@mantine/core";

export const metadata: Metadata = {
  title: "Sinlab Portal",
  description: "シンギュラリティ・ラボのポータルサイトです。",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
    other: {
      rel: "apple-touch-icon",
      url: "/apple-icon.png",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <ClerkProvider>
          <MantineProvider>
            <div className="min-h-screen">{children}</div>
          </MantineProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
