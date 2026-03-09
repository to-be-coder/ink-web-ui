"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./SplashDemoInner"),
  { ssr: false }
);

export function SplashDemo() {
  return <Inner />;
}
