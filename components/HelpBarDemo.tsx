"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./HelpBarDemoInner"),
  { ssr: false }
);

export function HelpBarDemo() {
  return <Inner />;
}
