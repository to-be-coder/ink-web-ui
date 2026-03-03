"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () => import("./AgentWorkflowDemoInner"),
  { ssr: false }
);

export function AgentWorkflowDemo() {
  return <Inner />;
}
