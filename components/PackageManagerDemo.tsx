"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./PackageManagerDemoInner"),
  { ssr: false }
);

export function PackageManagerDemo() {
  return <Inner />;
}
