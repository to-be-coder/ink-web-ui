"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./MultiSelectDemoInner"),
  { ssr: false }
);

export function MultiSelectDemo() {
  return <Inner />;
}
