import type { Metadata } from "next";
import "@mantine/core/styles.css";
import "./globals.css";
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from "@mantine/core";
// import { SideNav } from "./components/SideNav";

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

export default function AuthLayout({
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
        <MantineProvider>
          <div className="min-h-screen">
            {/* <SideNav /> in case of authenticated, sm:flex */}
            {children}
          </div>
        </MantineProvider>
      </body>
    </html>
  );
}
