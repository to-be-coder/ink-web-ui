"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./ModelBenchmarkDemoInner"),
  { ssr: false }
);

export function ModelBenchmarkDemo() {
  return <Inner />;
}
