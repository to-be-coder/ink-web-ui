"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./CommandPaletteDemoInner"),
  { ssr: false }
);

export function CommandPaletteDemo() {
  return <Inner />;
}
