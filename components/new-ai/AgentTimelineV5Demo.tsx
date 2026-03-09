"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./AgentTimelineV5DemoInner"), { ssr: false });
export function NewAIAgentTimelineV5Demo() {
  return <Inner />;
}
