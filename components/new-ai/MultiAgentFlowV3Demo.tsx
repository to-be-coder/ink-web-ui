"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./MultiAgentFlowV3DemoInner"), { ssr: false });
export function NewAIMultiAgentFlowV3Demo() {
  return <Inner />;
}
