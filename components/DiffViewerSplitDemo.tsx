"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./DiffViewerSplitDemoInner"),
  { ssr: false }
);

export function DiffViewerSplitDemo() {
  return <Inner />;
}
