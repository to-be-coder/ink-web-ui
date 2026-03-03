"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./ViewportDemoInner"),
  { ssr: false }
);

export function ViewportDemo() {
  return <Inner />;
}
