"use client";

import { useState } from "react";
import { TopHeader } from "./TopHeader";
import { SideNav } from "./SideNav";

interface NavigationWrapperProps {
  isAdmin: boolean;
  isContentMgr: boolean;
  children: React.ReactNode;
}

export function NavigationWrapper({ isAdmin, isContentMgr, children }: NavigationWrapperProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:flex min-h-screen">
      <TopHeader onMenuOpen={() => setOpen(true)} />
      <SideNav
        isAdmin={isAdmin}
        isContentMgr={isContentMgr}
        open={open}
        onClose={() => setOpen(false)}
      />
      <div className="flex-1 sm:ml-64 p-4 pt-14 sm:pt-4">{children}</div>
    </div>
  );
}
