"use client";

import { useMemo } from "react";
import { Drawer } from "@mantine/core";
import {
  AppWindow,
  FileText,
  FileVideo,
  House,
  Settings,
  Users,
  Calendar,
  FolderTree,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    title: "ホーム",
    href: "/",
    icon: <House className="h-5 w-5" />,
  },
  {
    title: "動画",
    href: "/videos",
    icon: <FileVideo className="h-5 w-5" />,
  },
  {
    title: "資料",
    href: "/documents",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "アプリ",
    href: "/applications",
    icon: <AppWindow className="h-5 w-5" />,
  },
  {
    title: "会員",
    href: "/members",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "カレンダー",
    href: "/calendar",
    icon: <Calendar className="h-5 w-5" />,
  },
];

const ADMIN_NAV_ITEM: NavItem = {
  title: "管理画面",
  href: "/dashboard",
  icon: <Settings className="h-5 w-5" />,
};

const CATEGORY_ADMIN_NAV_ITEM: NavItem = {
  title: "カテゴリー管理",
  href: "/categories",
  icon: <FolderTree className="h-5 w-5" />,
};

interface SideNavProps {
  isAdmin: boolean;
  isContentMgr: boolean;
  open: boolean;
  onClose: () => void;
}

export function SideNav({ isAdmin, isContentMgr, open, onClose }: SideNavProps) {
  const navItems = useMemo<NavItem[]>(
    () => [
      ...DEFAULT_NAV_ITEMS,
      ...(isContentMgr ? [CATEGORY_ADMIN_NAV_ITEM] : []),
      ...(isAdmin ? [ADMIN_NAV_ITEM] : []),
    ],
    [isAdmin, isContentMgr]
  );

  return (
    <>
      {/* モバイル用ドロワー */}
      <Drawer
        opened={open}
        onClose={onClose}
        position="left"
        size="250px"
        padding="md"
        title={
          <Link
            href="/"
            className="text-xl font-bold inline-flex items-center space-x-2  no-underline text-inherit"
          >
            <Image
              src="/icon.png"
              alt="Sinlab Logo"
              width={132}
              height={132}
              className="w-auto h-[1em] origin-center"
            />
            <div className="font-bold">Sinlab Portal</div>
          </Link>
        }
      >
        <nav className="space-y-2">
          {navItems.map(item => (
            <div key={item.href} className="px-3 py-2">
              <Link
                href={item.href}
                onClick={onClose}
                className="inline-flex items-center gap-3 rounded-sm text-muted-foreground transition-all hover:text-foreground"
              >
                {item.icon}
                {item.title}
              </Link>
            </div>
          ))}
        </nav>
      </Drawer>

      {/* デスクトップ用サイドバー */}
      <div className="hidden sm:flex h-screen w-64 flex-col fixed left-0 top-0 border-r bg-card">
        <div className="p-6">
          <Link
            href="/"
            className="text-xl font-bold inline-flex items-center space-x-2 no-underline  text-inherit"
          >
            <Image
              src="/icon.png"
              width={132}
              height={132}
              alt="Sinlab Logo"
              className="w-auto h-[1em] origin-center"
            />
            <div className="font-bold">Sinlab Portal</div>
          </Link>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map(item => (
            <div key={item.href} className="px-3 py-2">
              <Link
                href={item.href}
                className="inline-flex items-center gap-3 rounded-sm text-muted-foreground transition-all hover:text-foreground"
              >
                {item.icon}
                {item.title}
              </Link>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
