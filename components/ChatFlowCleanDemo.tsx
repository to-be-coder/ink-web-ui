"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./ChatFlowCleanDemoInner"),
  { ssr: false }
);

export function ChatFlowCleanDemo() {
  return <Inner />;
}
