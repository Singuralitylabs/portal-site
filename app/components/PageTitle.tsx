"use client";

import { Title } from "@mantine/core";
import { ReactNode } from "react";

interface PageTitleProps {
  children: ReactNode;
}

export function PageTitle({ children }: PageTitleProps) {
  return (
    <Title order={1} p="1.25rem 0" style={{ borderBottom: "1px solid #888" }}>
      {children}
    </Title>
  );
}
