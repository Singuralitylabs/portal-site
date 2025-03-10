"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // URLにエラーパラメータがあるかチェック
      const url = new URL(window.location.href);
      const error = url.searchParams.get("error");

      if (error) {
        console.error("認証エラー:", error);
        router.push("/login");
      } else {
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-medium mb-2">認証中...</h2>
        <p>しばらくお待ちください</p>
      </div>
    </div>
  );
}
