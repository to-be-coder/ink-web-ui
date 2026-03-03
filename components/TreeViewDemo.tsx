"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./TreeViewDemoInner"),
  { ssr: false }
);

export function TreeViewDemo() {
  return <Inner />;
}
