"use client";

import { MantineProvider as CoreMantineProvider } from "@mantine/core";

interface AppMantineProviderProps {
  nonce: string;
  children: React.ReactNode;
}

// MantineProvider の getStyleNonce は関数 prop のため Server Component からは渡せない。
// nonce (文字列) だけを RSC 境界越しに受け取り、クロージャはこの Client Component 内で生成する。
export function AppMantineProvider({ nonce, children }: AppMantineProviderProps) {
  return <CoreMantineProvider getStyleNonce={() => nonce}>{children}</CoreMantineProvider>;
}
