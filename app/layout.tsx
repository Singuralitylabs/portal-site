import type { Metadata } from "next";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";
import { headers } from "next/headers";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";
import { AppMantineProvider } from "@/app/providers/mantine-provider";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // middleware.ts が発行した nonce (CSP の script-src/style-src と一致させる)
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="ja" {...mantineHtmlProps}>
      <head>
        {/* ブラウザが nonce 属性を隠すため client 側で nonce が空になり、ハイドレーション警告になるため suppressHydrationWarning で抑止する */}
        <ColorSchemeScript nonce={nonce} suppressHydrationWarning />
      </head>
      <body>
        <SupabaseAuthProvider>
          <AppMantineProvider nonce={nonce}>
            <Notifications position="top-right" />
            <div className="min-h-screen">{children}</div>
          </AppMantineProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
