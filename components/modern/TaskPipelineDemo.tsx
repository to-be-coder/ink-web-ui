"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./TaskPipelineDemoInner"), { ssr: false });
export function ModernTaskPipelineDemo() {
  return <Inner />;
}
