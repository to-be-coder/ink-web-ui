"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./TokenUsageDemoInner"),
  { ssr: false }
);

export function TokenUsageDemo() {
  return <Inner />;
}
