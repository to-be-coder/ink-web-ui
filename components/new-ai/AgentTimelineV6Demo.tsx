"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./AgentTimelineV6DemoInner"), { ssr: false });
export function NewAIAgentTimelineV6Demo() {
  return <Inner />;
}
