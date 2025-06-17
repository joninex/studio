// src/app/(app)/layout.tsx
import { AppShell } from "@/components/layout/AppShell";
import React from "react";

export default function AuthenticatedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
