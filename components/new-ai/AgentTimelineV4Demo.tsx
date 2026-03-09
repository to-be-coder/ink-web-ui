"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./AgentTimelineV4DemoInner"), { ssr: false });
export function NewAIAgentTimelineV4Demo() {
  return <Inner />;
}
