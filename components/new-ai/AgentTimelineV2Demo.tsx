"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./AgentTimelineV2DemoInner"), { ssr: false });
export function NewAIAgentTimelineV2Demo() {
  return <Inner />;
}
