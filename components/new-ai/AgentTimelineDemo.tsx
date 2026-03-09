"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./AgentTimelineDemoInner"), { ssr: false });
export function NewAIAgentTimelineDemo() {
  return <Inner />;
}
