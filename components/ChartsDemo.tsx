"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./ChartsDemoInner"),
  { ssr: false }
);

export function ChartsDemo() {
  return <Inner />;
}
