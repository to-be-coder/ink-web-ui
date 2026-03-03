"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./FuzzyFinderDemoInner"),
  { ssr: false }
);

export function FuzzyFinderDemo() {
  return <Inner />;
}
