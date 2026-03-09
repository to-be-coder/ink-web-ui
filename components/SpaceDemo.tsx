"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./SpaceDemoInner"),
  { ssr: false }
);

export function SpaceDemo() {
  return <Inner />;
}
