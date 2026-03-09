"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./AgentTimelineV7DemoInner"), { ssr: false });
export function NewAIAgentTimelineV7Demo() {
  return <Inner />;
}
