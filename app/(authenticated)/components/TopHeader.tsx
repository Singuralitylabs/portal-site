"use client";

import { Button } from "@mantine/core";
import { Menu } from "lucide-react";
import { UserProfileMenu } from "./UserProfileMenu";

interface TopHeaderProps {
  onMenuOpen: () => void;
}

export function TopHeader({ onMenuOpen }: TopHeaderProps) {
  return (
    <>
      {/* モバイル: フルヘッダーバー */}
      <header className="sm:hidden fixed top-0 left-0 right-0 z-20 h-14 px-4 flex items-center justify-between bg-card border-b">
        <Button variant="subtle" onClick={onMenuOpen} p={4}>
          <Menu size={24} />
        </Button>
        <UserProfileMenu />
      </header>

      {/* デスクトップ: アバターのみ右上固定 */}
      <div className="hidden sm:block fixed top-3 right-4 z-20">
        <UserProfileMenu />
      </div>
    </>
  );
}
