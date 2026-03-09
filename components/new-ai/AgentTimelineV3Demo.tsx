"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./AgentTimelineV3DemoInner"), { ssr: false });
export function NewAIAgentTimelineV3Demo() {
  return <Inner />;
}
