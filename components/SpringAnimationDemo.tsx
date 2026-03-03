"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./SpringAnimationDemoInner"),
  { ssr: false }
);

export function SpringAnimationDemo() {
  return <Inner />;
}
