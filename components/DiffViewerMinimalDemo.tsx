"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./DiffViewerMinimalDemoInner"),
  { ssr: false }
);

export function DiffViewerMinimalDemo() {
  return <Inner />;
}
