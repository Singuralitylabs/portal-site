import type { Metadata } from "next";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";
import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from "@mantine/core";
import { SupabaseAuthProvider } from "@/app/providers/supabase-auth-provider";
import { Notifications } from "@mantine/notifications";

export const metadata: Metadata = {
  title: "Sinlab Portal",
  description: "シンギュラリティ・ラボのポータルサイトです。",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
    other: {
      rel: "apple-touch-icon",
      url: "/icon.png",
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
        <SupabaseAuthProvider>
          <MantineProvider>
            <Notifications position="top-right" />
            <div className="min-h-screen">{children}</div>
          </MantineProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
