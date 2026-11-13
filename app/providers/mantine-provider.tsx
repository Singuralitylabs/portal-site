"use client";

import { MantineProvider as CoreMantineProvider } from "@mantine/core";

interface AppMantineProviderProps {
  nonce: string;
  children: React.ReactNode;
}

// MantineProvider の getStyleNonce は関数 prop のため Server Component からは渡せない。
// nonce (文字列) だけを RSC 境界越しに受け取り、クロージャはこの Client Component 内で生成する。
// dev はブラウザが nonce 属性を隠すためハイドレーション警告になる。dev の CSP は style 要素を
// 'unsafe-inline' で許可していて nonce 不要なので、本番ビルド時のみ渡す(csp.ts の styleElemSources と対応)。
export function AppMantineProvider({ nonce, children }: AppMantineProviderProps) {
  return (
    <CoreMantineProvider
      getStyleNonce={process.env.NODE_ENV === "production" ? () => nonce : undefined}
    >
      {children}
    </CoreMantineProvider>
  );
}
