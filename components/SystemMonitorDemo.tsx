"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./SystemMonitorDemoInner"),
  { ssr: false }
);

export function SystemMonitorDemo() {
  return <Inner />;
}
