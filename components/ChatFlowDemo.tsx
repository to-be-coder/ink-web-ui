"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./ChatFlowDemoInner"),
  { ssr: false }
);

export function ChatFlowDemo() {
  return <Inner />;
}
