"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./TaskPipeline2DemoInner"), { ssr: false });
export function ModernTaskPipeline2Demo() {
  return <Inner />;
}
