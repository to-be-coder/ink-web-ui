"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./SplitPanesDemoInner"),
  { ssr: false }
);

export function SplitPanesDemo() {
  return <Inner />;
}
