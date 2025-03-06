<<<<<<< HEAD
"use client";
=======
'use client';
>>>>>>> 5963fad (auth, authenticated 配下で layout.tsxを個別定義)

import { useState } from "react";
import { Drawer, Button, Burger } from "@mantine/core";
import { Menu, House, Video, FileText, User, LogOut } from "lucide-react";
import Link from "next/link";
<<<<<<< HEAD
import Image from "next/image";
import IconImage from "../../public/icon.png";

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
  // {
  //   title: "動画一覧",
  //   href: "/videos",
  //   icon: <Video className="h-5 w-5" />,
  // },
  {
    title: "資料一覧",
    href: "/documents",
    icon: <FileText className="h-5 w-5" />,
  },
  // {
  //   title: "プロフィール",
  //   href: "/profile",
  //   //icon: <User className="h-5 w-5" />,
  // },
  {
    title: "ログアウト",
    href: "/login",
    icon: <LogOut className="h-5 w-5" />,
  },
];

export function SideNav() {
  const [open, setOpen] = useState(false);

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
            className="text-xl font-bold flex items-center space-x-2  no-underline text-inherit"
          >
            <Image src={IconImage} alt="Sinlab Logo" className="w-auto h-[1em] origin-center" />
            <div className="font-bold">Sinlab Portal</div>
          </Link>
        }
      >
        <nav className="space-y-2">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-sm px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </Drawer>

      {/* デスクトップ用サイドバー */}
      <div className="hidden sm:flex h-screen w-64 flex-col fixed left-0 top-0 border-r bg-card">
        <div className="p-6">
          <Link
            href="/"
            className="text-xl font-bold flex items-center space-x-2 no-underline  text-inherit"
          >
            <Image src={IconImage} alt="Sinlab Logo" className="w-auto h-[1em] origin-center" />
            <div className="font-bold">Sinlab Portal</div>
          </Link>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-sm px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
=======

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
    // {
    //   title: "動画一覧",
    //   href: "/videos",
    //   icon: <Video className="h-5 w-5" />,
    // },
    {
      title: "資料一覧",
      href: "/documents",
      icon: <FileText className="h-5 w-5" />,
    },
    // {
    //   title: "プロフィール",
    //   href: "/profile",
    //   //icon: <User className="h-5 w-5" />,
    // },
    {
      title: "ログアウト",
      href: "/login",
      icon: <LogOut className="h-5 w-5" />,
    },
  ];

  export function SideNav() {
    const [open, setOpen] = useState(false);
    
    return (
      <>

        {/* ハンバーガーメニュー (モバイル用) */}
        <Button 
            variant="subtle" 
            onClick={() => setOpen(true)} 
            className="sm:hidden"
        >
        <Menu 
            size={24}
            className="sm:hidden" 
        />
        </Button>
        
        {/* モバイル用ハンバーガーメニュー */}
        <Drawer
            opened={open}
            onClose={() => setOpen(false)}
            position="left"
            size="250px"
            padding="md"
            title="メニュー"
        >
            <nav className="space-y-2">
            {navItems.map((item) => (
                <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-sm px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
                >
                {item.icon}
                {item.title}
                </Link>
            ))}
            </nav>
        </Drawer>

        {/* デスクトップ用サイドバー */}
        <div className="hidden sm:flex h-screen w-64 flex-col fixed left-0 top-0 border-r bg-card">
          <div className="p-6">
            <h1 className="text-xl font-bold">Sinlab Portal</h1>
          </div>
          <nav className="flex-1 space-y-2 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-sm px-3 py-2 text-muted-foreground transition-all hover:text-foreground"
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </>
    );
  }
>>>>>>> 5963fad (auth, authenticated 配下で layout.tsxを個別定義)
