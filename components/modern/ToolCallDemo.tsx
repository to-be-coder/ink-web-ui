"use client";
import dynamic from "next/dynamic";
const Inner = dynamic(() => import("./ToolCallDemoInner"), { ssr: false });
export function ModernToolCallDemo() {
  return <Inner />;
}
