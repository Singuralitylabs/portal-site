"use client";

import { useState } from "react";
import { Drawer, Button } from "@mantine/core";
import { Menu, House, FileVideo, FileText, Users, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClientSupabaseClient } from "@/app/services/api/supabase-client";
import { useRouter } from "next/navigation";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: "ホーム",
    href: "/",
    icon: <House className="h-5 w-5" />,
  },
  {
    title: "動画一覧",
    href: "/videos",
    icon: <FileVideo className="h-5 w-5" />,
  },
  {
    title: "資料一覧",
    href: "/documents",
    icon: <FileText className="h-5 w-5" />,
  },
  // {
  //   title: "プロフィール",
  //   href: "/profile",
  //   icon: <User className="h-5 w-5" />,
  // },
  {
    title: "会員リスト",
    href: "/members",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "ログアウト",
    href: "/login",
    icon: <LogOut className="h-5 w-5" />,
  },
];

export function SideNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClientSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* ハンバーガーメニュー (モバイル用) */}
      <Button variant="subtle" onClick={() => setOpen(true)} className="sm:hidden">
        <Menu size={24} className="sm:hidden" />
      </Button>

      {/* モバイル用ハンバーガーメニュー */}
      <Drawer
        opened={open}
        onClose={() => setOpen(false)}
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
          {navItems.map(item =>
            item.title === "ログアウト" ? (
              <div key={item.title} className="px-3 py-2">
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-3 rounded-sm text-muted-foreground transition-all hover:text-foreground text-left bg-transparent border-none font-inherit text-inherit cursor-pointer"
                >
                  {item.icon}
                  {item.title}
                </button>
              </div>
            ) : (
              <div key={item.href} className="px-3 py-2">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-3 rounded-sm text-muted-foreground transition-all hover:text-foreground"
                >
                  {item.icon}
                  {item.title}
                </Link>
              </div>
            )
          )}
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
          {navItems.map(item =>
            item.title === "ログアウト" ? (
              <div key={item.title} className="px-3 py-2">
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-3 rounded-sm text-muted-foreground transition-all hover:text-foreground text-left bg-transparent border-none font-inherit text-inherit cursor-pointer"
                >
                  {item.icon}
                  {item.title}
                </button>
              </div>
            ) : (
              <div key={item.href} className="px-3 py-2">
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-3 rounded-sm text-muted-foreground transition-all hover:text-foreground"
                >
                  {item.icon}
                  {item.title}
                </Link>
              </div>
            )
          )}
        </nav>
      </div>
    </>
  );
}
