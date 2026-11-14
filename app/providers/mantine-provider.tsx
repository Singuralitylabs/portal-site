"use client";

import { useState } from "react";
import { MantineProvider as CoreMantineProvider } from "@mantine/core";

interface AppMantineProviderProps {
  nonce: string;
  children: React.ReactNode;
}

// MantineProvider の getStyleNonce は関数 prop のため Server Component からは渡せない。
// nonce (文字列) だけを RSC 境界越しに受け取り、クロージャはこの Client Component 内で生成する。
// dev はブラウザが nonce 属性を隠すためハイドレーション警告になる。dev の CSP は style 要素を
// 'unsafe-inline' で許可していて nonce 不要なので、本番ビルド時のみ渡す(csp.ts の styleElemSources と対応)。
//
// ブラウザの CSP は最初の HTML レスポンスの nonce のままなので、nonce はドキュメントの存続中は固定する。
// router.refresh() などで RootLayout が再実行されると nonce prop は新しい値になるが、
// そのまま使うと Mantine が後から挿入する style 要素が CSP に拒否される。初回の値を state に保持して使う。
export function AppMantineProvider({ nonce, children }: AppMantineProviderProps) {
  const [initialNonce] = useState(nonce);
  return (
    <CoreMantineProvider
      getStyleNonce={process.env.NODE_ENV === "production" ? () => initialNonce : undefined}
    >
      {children}
    </CoreMantineProvider>
  );
}
