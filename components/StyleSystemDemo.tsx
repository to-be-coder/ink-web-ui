"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./StyleSystemDemoInner"),
  { ssr: false }
);

export function StyleSystemDemo() {
  return <Inner />;
}
